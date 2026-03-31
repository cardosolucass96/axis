import { Lucia, TimeSpan } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import fs from "fs";

// Usa o mesmo banco de dados principal (axis.db)
// Em produção usa /app/data (volume montado), em dev usa raiz do projeto
const dbPath = process.env.NODE_ENV === "production"
    ? "/app/data/axis.db"
    : path.join(process.cwd(), "axis.db");

// Garante que o diretório existe em produção
if (process.env.NODE_ENV === "production") {
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

export const authDb: Database.Database = new Database(dbPath);

// Cria tabelas se não existirem
authDb.exec(`
    CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'leader',
        avatar_url TEXT,
        google_id TEXT UNIQUE,
        password_hash TEXT,
        email_verified INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
`);

// Adiciona coluna password_hash se não existir (migração)
try {
    authDb.exec(`ALTER TABLE user ADD COLUMN password_hash TEXT`);
} catch (e) {
    // Coluna já existe, ignora
}

try {
    authDb.exec(`ALTER TABLE user ADD COLUMN email_verified INTEGER DEFAULT 0`);
} catch (e) {
    // Coluna já existe, ignora
}

// Adiciona coluna sector_id para vincular líder ao setor
try {
    authDb.exec(`ALTER TABLE user ADD COLUMN sector_id TEXT`);
} catch (e) {
    // Coluna já existe, ignora
}

// Adiciona colunas de impersonação na sessão
try {
    authDb.exec(`ALTER TABLE session ADD COLUMN impersonated_by TEXT`);
} catch (e) {
    // Coluna já existe, ignora
}

try {
    authDb.exec(`ALTER TABLE session ADD COLUMN original_session_id TEXT`);
} catch (e) {
    // Coluna já existe, ignora
}

// Configura adapter do Lucia
const adapter = new BetterSqlite3Adapter(authDb, {
    user: "user",
    session: "session"
});

// Detecta se está usando HTTPS (túnel ou produção)
const isSecure = process.env.GOOGLE_REDIRECT_URI?.startsWith("https://") || process.env.NODE_ENV === "production";

// Cria instância do Lucia
export const lucia = new Lucia(adapter, {
    sessionExpiresIn: new TimeSpan(30, "d"), // 30 dias
    sessionCookie: {
        name: "axis_session",
        attributes: {
            secure: isSecure,
            sameSite: "lax"
        }
    },
    getUserAttributes: (attributes) => {
        // Parse sector_id: pode ser JSON array ou UUID simples (backward compat)
        let sectorIds: string[] = [];
        if (attributes.sector_id) {
            if (attributes.sector_id.startsWith("[")) {
                try { sectorIds = JSON.parse(attributes.sector_id); } catch { sectorIds = [attributes.sector_id]; }
            } else {
                sectorIds = [attributes.sector_id];
            }
        }
        return {
            email: attributes.email,
            name: attributes.name,
            role: attributes.role,
            avatarUrl: attributes.avatar_url,
            googleId: attributes.google_id,
            sectorIds
        };
    }
});

// Tipos TypeScript
declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}

interface DatabaseUserAttributes {
    email: string;
    name: string;
    role: string;
    avatar_url: string | null;
    google_id: string | null;
    password_hash: string | null;
    email_verified: number;
    sector_id: string | null;
}

// Constantes para validação
const SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;
const ALLOWED_DOMAIN = "@grupovorp.com";

// Funções de hash de senha
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Validação de email
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isAllowedDomain(email: string): boolean {
    return email.endsWith(ALLOWED_DOMAIN);
}

// Validação de senha
export function validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { valid: false, message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres` };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: "A senha deve conter pelo menos uma letra maiúscula" };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: "A senha deve conter pelo menos uma letra minúscula" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: "A senha deve conter pelo menos um número" };
    }
    return { valid: true };
}

// Funções auxiliares para gerenciar usuários
export function createUser(data: {
    id: string;
    email: string;
    name: string;
    role?: string;
    avatarUrl?: string;
    googleId?: string;
    passwordHash?: string;
}) {
    const stmt = authDb.prepare(`
        INSERT INTO user (id, email, name, role, avatar_url, google_id, password_hash, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    // Se tem google_id, email já está verificado
    const emailVerified = data.googleId ? 1 : 0;
    stmt.run(
        data.id, 
        data.email, 
        data.name, 
        data.role || "leader", 
        data.avatarUrl || null, 
        data.googleId || null,
        data.passwordHash || null,
        emailVerified
    );
}

export function getUserByGoogleId(googleId: string) {
    const stmt = authDb.prepare("SELECT * FROM user WHERE google_id = ?");
    return stmt.get(googleId) as DatabaseUserAttributes & { id: string } | undefined;
}

export function getUserByEmail(email: string) {
    const stmt = authDb.prepare("SELECT * FROM user WHERE email = ?");
    return stmt.get(email) as DatabaseUserAttributes & { id: string } | undefined;
}

export function getUserById(id: string) {
    const stmt = authDb.prepare("SELECT * FROM user WHERE id = ?");
    return stmt.get(id) as DatabaseUserAttributes & { id: string } | undefined;
}

export function updateUserGoogleId(userId: string, googleId: string) {
    const stmt = authDb.prepare("UPDATE user SET google_id = ?, email_verified = 1, updated_at = unixepoch() WHERE id = ?");
    stmt.run(googleId, userId);
}

export function getSessionExtras(sessionId: string): { impersonated_by: string | null; original_session_id: string | null } | null {
    const stmt = authDb.prepare("SELECT impersonated_by, original_session_id FROM session WHERE id = ?");
    return stmt.get(sessionId) as { impersonated_by: string | null; original_session_id: string | null } | null;
}

export function setSessionImpersonation(sessionId: string, impersonatedBy: string, originalSessionId: string) {
    const stmt = authDb.prepare("UPDATE session SET impersonated_by = ?, original_session_id = ? WHERE id = ?");
    stmt.run(impersonatedBy, originalSessionId, sessionId);
}

export function updateUserPassword(userId: string, passwordHash: string) {
    const stmt = authDb.prepare("UPDATE user SET password_hash = ?, updated_at = unixepoch() WHERE id = ?");
    stmt.run(passwordHash, userId);
}

export function userHasPassword(email: string): boolean {
    const user = getUserByEmail(email);
    return !!(user && user.password_hash);
}

export function userHasGoogleAuth(email: string): boolean {
    const user = getUserByEmail(email);
    return !!(user && user.google_id);
}
