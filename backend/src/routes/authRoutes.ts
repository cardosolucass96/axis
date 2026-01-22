import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { generateCodeVerifier, generateState } from "arctic";
import { google, getGoogleUser } from "../auth/google";
import { lucia, createUser, getUserByGoogleId, getUserByEmail, updateUserGoogleId } from "../auth/lucia";
import { generateIdFromEntropySize } from "lucia";
import "dotenv/config";

// Detecta se está usando HTTPS
const isSecure = process.env.GOOGLE_REDIRECT_URI?.startsWith("https://") || process.env.NODE_ENV === "production";

export async function authRoutes(app: FastifyInstance) {
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

            // Verifica se usuário já existe
            let user = getUserByGoogleId(googleUser.sub);

            if (!user) {
                // Verifica se existe usuário com mesmo email
                const existingUser = getUserByEmail(googleUser.email);

                if (existingUser) {
                    // Vincula conta Google ao usuário existente
                    updateUserGoogleId(existingUser.id, googleUser.sub);
                    user = { ...existingUser, google_id: googleUser.sub };
                } else {
                    // Cria novo usuário
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
                        google_id: googleUser.sub
                    };
                }
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

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl
            };
        } catch (error) {
            console.error("Erro ao validar sessão:", error);
            return reply.status(401).send({ error: "Sessão inválida" });
        }
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
