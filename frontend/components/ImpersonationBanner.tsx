import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Eye, LogOut } from "lucide-react";

export const ImpersonationBanner: React.FC = () => {
    const { user, isImpersonating, stopImpersonation } = useAuth();

    if (!isImpersonating || !user) return null;

    return (
        <div
            style={{ zIndex: 9999 }}
            className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between shadow-lg"
        >
            <div className="flex items-center gap-2 text-sm font-medium">
                <Eye className="w-4 h-4 shrink-0" />
                <span>
                    Visualizando como <strong>{user.name}</strong>{" "}
                    <span className="opacity-80">({user.email})</span>
                </span>
            </div>
            <button
                onClick={stopImpersonation}
                className="flex items-center gap-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
                <LogOut className="w-3.5 h-3.5" />
                Sair da conta
            </button>
        </div>
    );
};
