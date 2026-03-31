import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { generateCodeVerifier, generateState } from "arctic";
import { google, getGoogleUser } from "../auth/google";
import {
    lucia,
    createUser,
    getUserByGoogleId,
    getUserByEmail,
    getUserById,
    updateUserGoogleId,
    hashPassword,
    verifyPassword,
    isValidEmail,
    isAllowedDomain,
    validatePassword,
    userHasPassword,
    userHasGoogleAuth,
    getSessionExtras,
    setSessionImpersonation
} from "../auth/lucia";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { generateIdFromEntropySize } from "lucia";
import { AppDataSource } from "../data-source";
import { User as UserEntity } from "../entities/User";
import "dotenv/config";

// Detecta se está usando HTTPS
const isSecure = process.env.GOOGLE_REDIRECT_URI?.startsWith("https://") || process.env.NODE_ENV === "production";

// Email padrão para login de desenvolvimento
const DEV_USER_EMAIL = "lucas.cardoso@grupovorp.com";

// Domínio permitido
const ALLOWED_DOMAIN = "@grupovorp.com";

// Tipos para as requisições
interface LoginRequest {
    email: string;
    password: string;
}

interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export async function authRoutes(app: FastifyInstance) {
    // Login de desenvolvimento (apenas localhost)
    app.get("/auth/dev-login", async (request: FastifyRequest, reply: FastifyReply) => {
        const host = request.headers.host || "";
        
        // Só permite em localhost/127.0.0.1
        if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
            return reply.status(403).send({ error: "Dev login só funciona em localhost" });
        }

        try {
            // Busca usuário na tabela de autenticação
            let user = getUserByEmail(DEV_USER_EMAIL);

            if (!user) {
                // Busca na tabela TypeORM
                const userRepository = AppDataSource.getRepository(UserEntity);
                const existingUser = await userRepository.findOne({ where: { email: DEV_USER_EMAIL } });

                if (existingUser) {
                    // Cria na tabela de autenticação
                    createUser({
                        id: existingUser.id,
                        email: existingUser.email,
                        name: existingUser.name,
                        role: existingUser.role
                    });
                    // sectorIds é um array no entity, converter para JSON para auth DB
                    const sectorIdsJson = existingUser.sectorIds && existingUser.sectorIds.length > 0
                        ? JSON.stringify(existingUser.sectorIds) : null;
                    user = {
                        id: existingUser.id,
                        email: existingUser.email,
                        name: existingUser.name,
                        role: existingUser.role,
                        avatar_url: null,
                        google_id: null,
                        password_hash: null,
                        email_verified: 0,
                        sector_id: sectorIdsJson
                    };
                } else {
                    return reply.status(404).send({ error: "Usuário de desenvolvimento não encontrado" });
                }
            }

            if (!user) {
                return reply.status(404).send({ error: "Usuário não encontrado" });
            }

            // Cria sessão
            const session = await lucia.createSession(user.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            reply.setCookie(sessionCookie.name, sessionCookie.value, {
                path: sessionCookie.attributes.path || "/",
                httpOnly: true,
                secure: false, // localhost não usa HTTPS
                sameSite: "lax",
                maxAge: sessionCookie.attributes.maxAge
            });

            const frontendUrl = "http://localhost:5173";
            return reply.redirect(`${frontendUrl}/`);
        } catch (error) {
            console.error("Erro no dev login:", error);
            return reply.status(500).send({ error: "Erro no login de desenvolvimento" });
        }
    });

    // ============================================
    // LOGIN COM EMAIL E SENHA
    // ============================================
    app.post("/auth/login", async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
        const { email, password } = request.body;

        // Validações básicas
        if (!email || !password) {
            return reply.status(400).send({ 
                error: "MISSING_FIELDS",
                message: "Email e senha são obrigatórios" 
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (!isValidEmail(normalizedEmail)) {
            return reply.status(400).send({ 
                error: "INVALID_EMAIL",
                message: "Email inválido" 
            });
        }

        try {
            // Busca usuário
            let user = getUserByEmail(normalizedEmail);

            // Se não existe na tabela de auth, verifica TypeORM
            if (!user) {
                const userRepository = AppDataSource.getRepository(UserEntity);
                const existingUser = await userRepository.findOne({ where: { email: normalizedEmail } });

                if (!existingUser) {
                    return reply.status(401).send({ 
                        error: "USER_NOT_FOUND",
                        message: "Não encontramos uma conta com esse email. Deseja criar uma conta?" 
                    });
                }

                // Usuário existe no TypeORM mas não na auth (usuário do seed sem senha)
                return reply.status(401).send({
                    error: "PASSWORD_NOT_SET",
                    message: "Esta conta ainda não possui senha. Use o Google para entrar ou defina uma senha."
                });
            }

            // Verifica se o usuário tem senha definida
            if (!user.password_hash) {
                // Verifica se tem Google vinculado
                if (user.google_id) {
                    return reply.status(401).send({
                        error: "USE_GOOGLE",
                        message: "Esta conta utiliza login com Google. Por favor, entre com o Google."
                    });
                }
                return reply.status(401).send({
                    error: "PASSWORD_NOT_SET",
                    message: "Esta conta ainda não possui senha configurada."
                });
            }

            // Verifica a senha
            const validPassword = await verifyPassword(password, user.password_hash);
            if (!validPassword) {
                return reply.status(401).send({ 
                    error: "INVALID_CREDENTIALS",
                    message: "Email ou senha incorretos" 
                });
            }

            // Cria sessão
            const session = await lucia.createSession(user.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            reply.setCookie(sessionCookie.name, sessionCookie.value, {
                path: sessionCookie.attributes.path || "/",
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                maxAge: sessionCookie.attributes.maxAge
            });

            return { 
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            };
        } catch (error) {
            console.error("Erro no login:", error);
            return reply.status(500).send({ 
                error: "SERVER_ERROR",
                message: "Erro interno do servidor" 
            });
        }
    });

    // ============================================
    // REGISTRO DE NOVO USUÁRIO
    // ============================================
    app.post("/auth/register", async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
        const { name, email, password, confirmPassword } = request.body;

        // Validações básicas
        if (!name || !email || !password || !confirmPassword) {
            return reply.status(400).send({ 
                error: "MISSING_FIELDS",
                message: "Todos os campos são obrigatórios" 
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
            return reply.status(400).send({ 
                error: "INVALID_NAME",
                message: "O nome deve ter pelo menos 2 caracteres" 
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return reply.status(400).send({ 
                error: "INVALID_EMAIL",
                message: "Email inválido" 
            });
        }

        if (!isAllowedDomain(normalizedEmail)) {
            return reply.status(400).send({ 
                error: "DOMAIN_NOT_ALLOWED",
                message: `Apenas emails com domínio ${ALLOWED_DOMAIN} são permitidos` 
            });
        }

        if (password !== confirmPassword) {
            return reply.status(400).send({ 
                error: "PASSWORDS_DONT_MATCH",
                message: "As senhas não coincidem" 
            });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return reply.status(400).send({ 
                error: "WEAK_PASSWORD",
                message: passwordValidation.message 
            });
        }

        try {
            // Verifica se usuário já existe
            let existingUser = getUserByEmail(normalizedEmail);
            
            if (existingUser) {
                // Se já tem senha, não pode criar de novo
                if (existingUser.password_hash) {
                    return reply.status(409).send({ 
                        error: "EMAIL_EXISTS",
                        message: "Já existe uma conta com este email" 
                    });
                }
                
                // Se existe mas não tem senha (ex: criado via Google ou seed), atualiza com senha
                const passwordHash = await hashPassword(password);
                const { updateUserPassword } = await import("../auth/lucia.js");
                updateUserPassword(existingUser.id, passwordHash);
                
                // Cria sessão
                const session = await lucia.createSession(existingUser.id, {});
                const sessionCookie = lucia.createSessionCookie(session.id);

                reply.setCookie(sessionCookie.name, sessionCookie.value, {
                    path: sessionCookie.attributes.path || "/",
                    httpOnly: true,
                    secure: isSecure,
                    sameSite: "lax",
                    maxAge: sessionCookie.attributes.maxAge
                });

                return { 
                    success: true,
                    message: "Senha configurada com sucesso!",
                    user: {
                        id: existingUser.id,
                        email: existingUser.email,
                        name: existingUser.name,
                        role: existingUser.role
                    }
                };
            }

            // Verifica também na tabela TypeORM
            const userRepository = AppDataSource.getRepository(UserEntity);
            const typeormUser = await userRepository.findOne({ where: { email: normalizedEmail } });

            if (typeormUser) {
                // Usuário existe no TypeORM mas não na auth, cria na auth com senha
                const passwordHash = await hashPassword(password);
                createUser({
                    id: typeormUser.id,
                    email: typeormUser.email,
                    name: typeormUser.name,
                    role: typeormUser.role,
                    passwordHash
                });

                // Cria sessão
                const session = await lucia.createSession(typeormUser.id, {});
                const sessionCookie = lucia.createSessionCookie(session.id);

                reply.setCookie(sessionCookie.name, sessionCookie.value, {
                    path: sessionCookie.attributes.path || "/",
                    httpOnly: true,
                    secure: isSecure,
                    sameSite: "lax",
                    maxAge: sessionCookie.attributes.maxAge
                });

                return { 
                    success: true,
                    message: "Conta ativada com sucesso!",
                    user: {
                        id: typeormUser.id,
                        email: typeormUser.email,
                        name: typeormUser.name,
                        role: typeormUser.role
                    }
                };
            }

            // Cria novo usuário
            const userId = generateIdFromEntropySize(10);
            const passwordHash = await hashPassword(password);

            createUser({
                id: userId,
                email: normalizedEmail,
                name: trimmedName,
                role: "leader",
                passwordHash
            });

            // Também cria na tabela TypeORM para manter sincronizado
            const newUser = userRepository.create({
                id: userId,
                email: normalizedEmail,
                name: trimmedName,
                role: "leader"
            });
            await userRepository.save(newUser);

            // Cria sessão
            const session = await lucia.createSession(userId, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            reply.setCookie(sessionCookie.name, sessionCookie.value, {
                path: sessionCookie.attributes.path || "/",
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                maxAge: sessionCookie.attributes.maxAge
            });

            return { 
                success: true,
                message: "Conta criada com sucesso!",
                user: {
                    id: userId,
                    email: normalizedEmail,
                    name: trimmedName,
                    role: "leader"
                }
            };
        } catch (error) {
            console.error("Erro no registro:", error);
            return reply.status(500).send({ 
                error: "SERVER_ERROR",
                message: "Erro interno do servidor" 
            });
        }
    });

    // ============================================
    // VERIFICAR SE EMAIL EXISTE
    // ============================================
    app.post("/auth/check-email", async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
        const { email } = request.body;

        if (!email) {
            return reply.status(400).send({ error: "MISSING_EMAIL", message: "Email é obrigatório" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (!isValidEmail(normalizedEmail)) {
            return reply.status(400).send({ error: "INVALID_EMAIL", message: "Email inválido" });
        }

        const user = getUserByEmail(normalizedEmail);
        
        if (!user) {
            const userRepository = AppDataSource.getRepository(UserEntity);
            const typeormUser = await userRepository.findOne({ where: { email: normalizedEmail } });
            
            if (typeormUser) {
                return { 
                    exists: true, 
                    hasPassword: false,
                    hasGoogle: false,
                    message: "Usuário encontrado, precisa definir senha"
                };
            }
            
            return { exists: false };
        }

        return { 
            exists: true,
            hasPassword: !!user.password_hash,
            hasGoogle: !!user.google_id
        };
    });

    // Inicia fluxo OAuth com Google
    app.get("/auth/google", async (request: FastifyRequest, reply: FastifyReply) => {
        const state = generateState();
        const codeVerifier = generateCodeVerifier();

        const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);

        // Salva state e codeVerifier em cookies
        reply.setCookie("google_oauth_state", state, {
            path: "/",
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 60 * 10 // 10 minutos
        });

        reply.setCookie("google_code_verifier", codeVerifier, {
            path: "/",
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 60 * 10
        });

        return reply.redirect(url.toString());
    });

    // Callback do Google OAuth
    app.get("/auth/google/callback", async (request: FastifyRequest, reply: FastifyReply) => {
        const { code, state } = request.query as { code?: string; state?: string };

        const storedState = request.cookies.google_oauth_state;
        const storedCodeVerifier = request.cookies.google_code_verifier;

        // Valida state
        if (!code || !state || !storedState || state !== storedState || !storedCodeVerifier) {
            return reply.status(400).send({ error: "Requisição inválida" });
        }

        try {
            // Troca code por tokens
            const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
            const accessToken = tokens.accessToken();

            // Obtém informações do usuário
            const googleUser = await getGoogleUser(accessToken);

            // Valida se o email é do domínio @grupovorp.com
            const allowedDomain = "@grupovorp.com";
            if (!googleUser.email.endsWith(allowedDomain)) {
                return reply.status(403).send({ 
                    error: "Acesso negado",
                    message: `Apenas emails com o domínio ${allowedDomain} são permitidos`
                });
            }

            // Verifica se usuário já existe na tabela de autenticação (Lucia)
            let user = getUserByGoogleId(googleUser.sub);

            if (!user) {
                // Verifica também por email na tabela de autenticação
                user = getUserByEmail(googleUser.email);
                
                if (user) {
                    // Usuário existe na tabela Lucia mas sem google_id, atualiza
                    updateUserGoogleId(user.id, googleUser.sub);
                    user.google_id = googleUser.sub;
                } else {
                    // Busca na tabela TypeORM (usuários do seed)
                    const userRepository = AppDataSource.getRepository(UserEntity);
                    const existingUser = await userRepository.findOne({ where: { email: googleUser.email } });

                    if (existingUser) {
                        // Cria o usuário na tabela de autenticação (Lucia) com os dados do TypeORM
                        createUser({
                            id: existingUser.id,
                            email: existingUser.email,
                            name: existingUser.name,
                            avatarUrl: googleUser.picture,
                            googleId: googleUser.sub,
                            role: existingUser.role
                        });
                        // Busca password_hash da tabela de auth
                        const authUser = getUserByEmail(existingUser.email);
                        const sectorIdsJsonGoogle = existingUser.sectorIds && existingUser.sectorIds.length > 0
                            ? JSON.stringify(existingUser.sectorIds) : null;
                        user = {
                            id: existingUser.id,
                            email: existingUser.email,
                            name: existingUser.name,
                            role: existingUser.role,
                            avatar_url: googleUser.picture || null,
                            google_id: googleUser.sub,
                            password_hash: authUser?.password_hash || null,
                            email_verified: 1,
                            sector_id: sectorIdsJsonGoogle
                        };
                    } else {
                        // Cria novo usuário (login pela primeira vez)
                        const userId = generateIdFromEntropySize(10);
                        createUser({
                            id: userId,
                            email: googleUser.email,
                            name: googleUser.name,
                            avatarUrl: googleUser.picture,
                            googleId: googleUser.sub,
                            role: "leader"
                        });
                        user = {
                            id: userId,
                            email: googleUser.email,
                            name: googleUser.name,
                            role: "leader",
                            avatar_url: googleUser.picture || null,
                            google_id: googleUser.sub,
                            password_hash: null,
                            email_verified: 1,
                            sector_id: null
                        };
                    }
                }
            }

            if (!user) {
                return reply.status(500).send({ error: "Erro ao criar usuário" });
            }

            // Cria sessão
            const session = await lucia.createSession(user.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            // Limpa cookies temporários e define cookie de sessão
            reply.setCookie(sessionCookie.name, sessionCookie.value, {
                path: sessionCookie.attributes.path || "/",
                httpOnly: true,
                secure: sessionCookie.attributes.secure,
                sameSite: sessionCookie.attributes.sameSite as "lax" | "strict" | "none",
                maxAge: sessionCookie.attributes.maxAge
            });

            reply.clearCookie("google_oauth_state", { path: "/" });
            reply.clearCookie("google_code_verifier", { path: "/" });

            // Redireciona para o frontend
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            return reply.redirect(`${frontendUrl}/`);
        } catch (error) {
            console.error("Erro no callback do Google:", error);
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            return reply.redirect(`${frontendUrl}/login?error=auth_failed`);
        }
    });

    // Obtém usuário atual
    app.get("/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
        const sessionId = request.cookies.axis_session;

        if (!sessionId) {
            return reply.status(401).send({ error: "Não autenticado" });
        }

        try {
            const { session, user } = await lucia.validateSession(sessionId);

            if (!session) {
                const blankCookie = lucia.createBlankSessionCookie();
                reply.setCookie(blankCookie.name, blankCookie.value, {
                    path: blankCookie.attributes.path || "/",
                    httpOnly: true,
                    secure: blankCookie.attributes.secure,
                    sameSite: blankCookie.attributes.sameSite as "lax" | "strict" | "none"
                });
                return reply.status(401).send({ error: "Sessão inválida" });
            }

            // Renova sessão se necessário
            if (session.fresh) {
                const sessionCookie = lucia.createSessionCookie(session.id);
                reply.setCookie(sessionCookie.name, sessionCookie.value, {
                    path: sessionCookie.attributes.path || "/",
                    httpOnly: true,
                    secure: sessionCookie.attributes.secure,
                    sameSite: sessionCookie.attributes.sameSite as "lax" | "strict" | "none",
                    maxAge: sessionCookie.attributes.maxAge
                });
            }

            const sessionExtras = getSessionExtras(session.id);

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
                sectorIds: user.sectorIds || [],
                isImpersonating: !!(sessionExtras?.impersonated_by)
            };
        } catch (error) {
            console.error("Erro ao validar sessão:", error);
            return reply.status(401).send({ error: "Sessão inválida" });
        }
    });

    // ============================================
    // IMPERSONAR USUÁRIO (admin only)
    // ============================================
    app.post("/auth/impersonate/:userId", { preHandler: requireAdmin }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        const { userId } = request.params;
        const adminUser = request.user!;
        const adminSessionId = request.sessionId!;

        if (userId === adminUser.id) {
            return reply.status(400).send({ error: "Não pode impersonar a si mesmo" });
        }

        const targetUser = getUserById(userId);
        if (!targetUser) {
            return reply.status(404).send({ error: "Usuário não encontrado" });
        }

        if (targetUser.role === "admin") {
            return reply.status(403).send({ error: "Não é possível impersonar outro administrador" });
        }

        const session = await lucia.createSession(userId, {});
        setSessionImpersonation(session.id, adminUser.id, adminSessionId);

        console.log(`[IMPERSONATION] Admin ${adminUser.email} passou a visualizar como ${targetUser.email}`);

        const sessionCookie = lucia.createSessionCookie(session.id);
        reply.setCookie(sessionCookie.name, sessionCookie.value, {
            path: sessionCookie.attributes.path || "/",
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: sessionCookie.attributes.maxAge
        });

        return { success: true };
    });

    // ============================================
    // PARAR IMPERSONAÇÃO
    // ============================================
    app.post("/auth/stop-impersonate", { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
        const currentSessionId = request.sessionId!;
        const extras = getSessionExtras(currentSessionId);

        if (!extras?.impersonated_by || !extras?.original_session_id) {
            return reply.status(400).send({ error: "Sessão atual não é de impersonação" });
        }

        await lucia.invalidateSession(currentSessionId);

        const { session: originalSession } = await lucia.validateSession(extras.original_session_id);

        if (!originalSession) {
            const blankCookie = lucia.createBlankSessionCookie();
            reply.setCookie(blankCookie.name, blankCookie.value, {
                path: blankCookie.attributes.path || "/",
                httpOnly: true,
                secure: blankCookie.attributes.secure,
                sameSite: blankCookie.attributes.sameSite as "lax" | "strict" | "none"
            });
            return { success: true, redirectToLogin: true };
        }

        const sessionCookie = lucia.createSessionCookie(extras.original_session_id);
        reply.setCookie(sessionCookie.name, sessionCookie.value, {
            path: sessionCookie.attributes.path || "/",
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: sessionCookie.attributes.maxAge
        });

        return { success: true };
    });

    // Logout
    app.post("/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
        const sessionId = request.cookies.axis_session;

        if (sessionId) {
            await lucia.invalidateSession(sessionId);
        }

        const blankCookie = lucia.createBlankSessionCookie();
        reply.setCookie(blankCookie.name, blankCookie.value, {
            path: blankCookie.attributes.path || "/",
            httpOnly: true,
            secure: blankCookie.attributes.secure,
            sameSite: blankCookie.attributes.sameSite as "lax" | "strict" | "none"
        });

        return { success: true };
    });
}
