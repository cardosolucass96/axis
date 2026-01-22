/**
 * Cliente HTTP para comunicação com backend AXIS
 * Configuração centralizada de requisições
 */

// Fallback para a URL da API
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api";

interface ApiResponse<T> {
    data: T;
    status: string;
    message?: string;
}

interface ApiErrorResponse {
    status: string;
    message: string;
}

class HttpError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public response?: ApiErrorResponse
    ) {
        super(message);
        this.name = "HttpError";
    }
}

/**
 * Função helper para fazer requisições
 */
async function request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    endpoint: string,
    options?: {
        body?: Record<string, any>;
        query?: Record<string, string | number | boolean>;
    }
): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // Adicionar query parameters (ignorar undefined)
    if (options?.query) {
        Object.entries(options.query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    const requestInit: RequestInit = {
        method,
        headers: {} as Record<string, string>,
    };

    // Apenas adicionar Content-Type se houver body
    if (options?.body) {
        (requestInit.headers as Record<string, string>)["Content-Type"] = "application/json";
        requestInit.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url.toString(), requestInit);

        if (!response.ok) {
            let errorData: ApiErrorResponse | null = null;
            try {
                errorData = await response.json();
            } catch {
                errorData = {
                    status: "error",
                    message: `HTTP ${response.status}: ${response.statusText}`,
                };
            }

            throw new HttpError(
                errorData?.message || `HTTP ${response.status}`,
                response.status,
                errorData
            );
        }

        const data = await response.json();
        return (data as ApiResponse<T>).data || data;
    } catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }

        if (error instanceof TypeError) {
            throw new HttpError(
                "Falha na conexão com servidor",
                0,
                undefined
            );
        }

        throw error;
    }
}

/**
 * API Client - Métodos para cada recurso
 */
export const api = {
    // ===== USERS =====
    users: {
        getAll: () => request<any[]>("GET", "/users"),
        getById: (id: string) => request<any>("GET", `/users/${id}`),
        create: (user: any) => request<any>("POST", "/users", { body: user }),
        update: (id: string, user: any) =>
            request<any>("PUT", `/users/${id}`, { body: user }),
        delete: (id: string) => request<void>("DELETE", `/users/${id}`),
        linkSector: (userId: string, sectorId: string) =>
            request<any>("POST", `/users/${userId}/link-sector`, {
                body: { sectorId },
            }),
    },

    // ===== SECTORS =====
    sectors: {
        getAll: () => request<any[]>("GET", "/sectors"),
        getById: (id: string) => request<any>("GET", `/sectors/${id}`),
        create: (sector: any) =>
            request<any>("POST", "/sectors", { body: sector }),
        update: (id: string, sector: any) =>
            request<any>("PUT", `/sectors/${id}`, { body: sector }),
        delete: (id: string) => request<void>("DELETE", `/sectors/${id}`),
    },

    // ===== KPIs =====
    kpis: {
        getAll: () => request<any[]>("GET", "/kpis"),
        getById: (id: string) => request<any>("GET", `/kpis/${id}`),
        getBySector: (sectorId: string) =>
            request<any[]>("GET", `/sectors/${sectorId}/kpis`),
        create: (sectorId: string, kpi: any) =>
            request<any>("POST", `/sectors/${sectorId}/kpis`, { body: kpi }),
        update: (id: string, kpi: any) =>
            request<any>("PUT", `/kpis/${id}`, { body: kpi }),
        delete: (id: string) => request<void>("DELETE", `/kpis/${id}`),
    },

    // ===== KPI ENTRIES =====
    entries: {
        getAll: (query?: { sectorId?: string; month?: string; week?: string }) =>
            request<any[]>("GET", "/entries", { query }),
        getById: (id: string) => request<any>("GET", `/entries/${id}`),
        getBySector: (sectorId: string) =>
            request<any[]>("GET", `/sectors/${sectorId}/entries`),
        create: (entry: any) =>
            request<any>("POST", "/entries", { body: entry }),
        update: (id: string, entry: any) =>
            request<any>("PUT", `/entries/${id}`, { body: entry }),
        delete: (id: string) => request<void>("DELETE", `/entries/${id}`),
    },

    // ===== ACTION PLANS =====
    actionPlans: {
        getAll: (query?: { status?: string; sectorId?: string; month?: string }) =>
            request<any[]>("GET", "/action-plans", { query }),
        getById: (id: string) => request<any>("GET", `/action-plans/${id}`),
        getByEntry: (entryId: string) =>
            request<any>("GET", `/entries/${entryId}/action-plans`),
        create: (entryId: string, plan: any) =>
            request<any>("POST", `/entries/${entryId}/action-plans`, {
                body: plan,
            }),
        update: (id: string, plan: any) =>
            request<any>("PUT", `/action-plans/${id}`, { body: plan }),
        updateStatus: (id: string, status: string) =>
            request<any>("PATCH", `/action-plans/${id}/status`, { body: { status } }),
        delete: (id: string) => request<void>("DELETE", `/action-plans/${id}`),
    },

    // ===== ROOT CAUSES =====
    causes: {
        getByEntry: (entryId: string) =>
            request<any[]>("GET", `/entries/${entryId}/causes`),
        create: (entryId: string, cause: any) =>
            request<any>("POST", `/entries/${entryId}/causes`, { body: cause }),
        update: (id: string, cause: any) =>
            request<any>("PUT", `/causes/${id}`, { body: cause }),
        delete: (id: string) => request<void>("DELETE", `/causes/${id}`),
    },

    // ===== DASHBOARD =====
    dashboard: {
        healthIndex: (query?: { month?: string; week?: string }) =>
            request<any>("GET", "/dashboard/health-index", { query }),
        trendAnalysis: (query?: { months?: number }) =>
            request<any>("GET", "/dashboard/trend-analysis", { query }),
        financialBridge: (query?: { month?: string; week?: string }) =>
            request<any>("GET", "/dashboard/financial-bridge", { query }),
        planStats: (query?: { month?: string }) =>
            request<any>("GET", "/dashboard/plan-stats", { query }),
        agingPlans: (query?: { month?: string }) =>
            request<any>("GET", "/dashboard/aging-plans", { query }),
        rootCauseCloud: (query?: { month?: string }) =>
            request<any>("GET", "/dashboard/root-cause-cloud", { query }),
    },

    // ===== HEALTH =====
    health: () => request<any>("GET", "/health"),
};

export { HttpError };
