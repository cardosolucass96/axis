import { Lucia, TimeSpan } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import Database from "better-sqlite3";
import path from "path";

// Usa o mesmo banco de dados principal (axis.db)
const dbPath = path.join(process.cwd(), "axis.db");
export const authDb = new Database(dbPath);

// Cria tabelas se não existirem
authDb.exec(`
    CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'leader',
        avatar_url TEXT,
        google_id TEXT UNIQUE,
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
        return {
            email: attributes.email,
            name: attributes.name,
            role: attributes.role,
            avatarUrl: attributes.avatar_url,
            googleId: attributes.google_id
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
}

// Funções auxiliares para gerenciar usuários
export function createUser(data: {
    id: string;
    email: string;
    name: string;
    role?: string;
    avatarUrl?: string;
    googleId?: string;
}) {
    const stmt = authDb.prepare(`
        INSERT INTO user (id, email, name, role, avatar_url, google_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(data.id, data.email, data.name, data.role || "leader", data.avatarUrl || null, data.googleId || null);
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
    const stmt = authDb.prepare("UPDATE user SET google_id = ?, updated_at = unixepoch() WHERE id = ?");
    stmt.run(googleId, userId);
}
