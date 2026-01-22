import { FastifyRequest, FastifyReply } from "fastify";
import { lucia } from "../auth/lucia";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
}

declare module "fastify" {
    interface FastifyRequest {
        user?: AuthUser;
        sessionId?: string;
    }
}

// Middleware que verifica autenticação (requer login)
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    const sessionId = request.cookies.axis_session;

    if (!sessionId) {
        return reply.status(401).send({ error: "Autenticação necessária" });
    }

    try {
        const { session, user } = await lucia.validateSession(sessionId);

        if (!session || !user) {
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

        // Adiciona usuário à request
        request.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl
        };
        request.sessionId = session.id;
    } catch (error) {
        console.error("Erro no middleware de auth:", error);
        return reply.status(401).send({ error: "Erro de autenticação" });
    }
}

// Middleware que verifica se é admin
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    await requireAuth(request, reply);

    if (reply.sent) return;

    if (request.user?.role !== "admin") {
        return reply.status(403).send({ error: "Acesso negado. Apenas administradores." });
    }
}

// Middleware opcional - adiciona usuário se autenticado, mas não bloqueia
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
    const sessionId = request.cookies.axis_session;

    if (!sessionId) {
        return;
    }

    try {
        const { session, user } = await lucia.validateSession(sessionId);

        if (session && user) {
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

            request.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl
            };
            request.sessionId = session.id;
        }
    } catch (error) {
        // Ignora erros em auth opcional
    }
}
