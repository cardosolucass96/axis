import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: "admin" | "leader";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated, login } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Acesso Restrito
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Você precisa estar logado para acessar esta página.
                    </p>
                    <button
                        onClick={login}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Fazer Login
                    </button>
                </div>
            </div>
        );
    }

    if (requiredRole && user?.role !== requiredRole && user?.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Acesso Negado
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Você não tem permissão para acessar esta página.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
