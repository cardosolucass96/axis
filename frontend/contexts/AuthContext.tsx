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
    return "http://localhost:3000";
};

const API_URL = getApiUrl();

interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "leader";
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
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

    const login = () => {
        // Redireciona para o endpoint de login do Google
        window.location.href = `${API_URL}/auth/google`;
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

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshUser
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
