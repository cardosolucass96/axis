import React, { createContext, useContext, useState } from "react";

interface LoadingState {
    isLoading: boolean;
    error: string | null;
}

interface LoadingContextType {
    loading: LoadingState;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [loading, setLoadingState] = useState<LoadingState>({
        isLoading: false,
        error: null,
    });

    const setLoading = (isLoading: boolean) => {
        setLoadingState((prev) => ({ ...prev, isLoading }));
    };

    const setError = (error: string | null) => {
        setLoadingState((prev) => ({ ...prev, error }));
    };

    const clearError = () => {
        setLoadingState((prev) => ({ ...prev, error: null }));
    };

    return (
        <LoadingContext.Provider value={{ loading, setLoading, setError, clearError }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
};
