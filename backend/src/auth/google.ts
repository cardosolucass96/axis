import { Google } from "arctic";
import "dotenv/config";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configurados no .env");
}

export const google = new Google(
    process.env.GOOGLE_CLIENT_ID || "",
    process.env.GOOGLE_CLIENT_SECRET || "",
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback"
);

export interface GoogleUser {
    sub: string;          // Google ID único
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error("Falha ao obter informações do usuário do Google");
    }

    return response.json();
}
