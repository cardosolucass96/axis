import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Detecta a URL da API dinamicamente baseado no host
const getApiUrl = () => {
    // Em produção, usa a mesma origem com prefixo /api
    if (import.meta.env.PROD) {
        return `${window.location.origin}/api`;
    }
    // Em desenvolvimento, tenta a URL do túnel ou localhost
    const host = window.location.hostname;
    if (host.includes("cardosolucas.com")) {
        return "https://dev.cardosolucas.com/api";
    }
    // Fallback para localhost
    return "http://localhost:3000/api";
};

const API_URL = getApiUrl();

interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "leader";
    avatarUrl?: string;
    sectorIds?: string[]; // Setores vinculados ao líder
    isImpersonating?: boolean;
}

interface AuthResult {
    success: boolean;
    error?: string;
    message?: string;
    user?: User;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isImpersonating: boolean;
    loginWithGoogle: () => void;
    loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
    register: (name: string, email: string, password: string, confirmPassword: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    impersonateUser: (userId: string) => Promise<void>;
    stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                credentials: "include"
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const loginWithGoogle = () => {
        const host = window.location.hostname;
        
        // Em localhost, usa dev-login automático
        if (host === "localhost" || host === "127.0.0.1") {
            window.location.href = `${API_URL}/auth/dev-login`;
            return;
        }
        
        // Redireciona para o endpoint de login do Google
        window.location.href = `${API_URL}/auth/google`;
    };

    const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Atualiza o usuário após login bem-sucedido
                await refreshUser();
                return { success: true, user: data.user };
            }

            return {
                success: false,
                error: data.error,
                message: data.message
            };
        } catch (error) {
            console.error("Erro no login:", error);
            return {
                success: false,
                error: "NETWORK_ERROR",
                message: "Erro de conexão. Verifique sua internet e tente novamente."
            };
        }
    };

    const register = async (
        name: string, 
        email: string, 
        password: string, 
        confirmPassword: string
    ): Promise<AuthResult> => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ name, email, password, confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
                // Atualiza o usuário após registro bem-sucedido
                await refreshUser();
                return { 
                    success: true, 
                    user: data.user,
                    message: data.message 
                };
            }

            return {
                success: false,
                error: data.error,
                message: data.message
            };
        } catch (error) {
            console.error("Erro no registro:", error);
            return {
                success: false,
                error: "NETWORK_ERROR",
                message: "Erro de conexão. Verifique sua internet e tente novamente."
            };
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
            setUser(null);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    const impersonateUser = async (userId: string) => {
        const response = await fetch(`${API_URL}/auth/impersonate/${userId}`, {
            method: "POST",
            credentials: "include"
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Falha ao acessar conta do usuário");
        }
        await refreshUser();
    };

    const stopImpersonation = async () => {
        const response = await fetch(`${API_URL}/auth/stop-impersonate`, {
            method: "POST",
            credentials: "include"
        });
        const data = await response.json();
        if (data.redirectToLogin) {
            setUser(null);
        } else {
            await refreshUser();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                isImpersonating: !!(user?.isImpersonating),
                loginWithGoogle,
                loginWithEmail,
                register,
                logout,
                refreshUser,
                impersonateUser,
                stopImpersonation
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
}
