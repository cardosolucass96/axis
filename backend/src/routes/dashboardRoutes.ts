import { FastifyInstance } from "fastify";
import { DashboardService } from "../services/DashboardService.js";

const dashboardService = new DashboardService();

export async function dashboardRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/dashboard/health-index
     * Retorna o índice de saúde dos KPIs (onTrack, warning, critical)
     * Query params: month, week (opcionais)
     */
    fastify.get("/dashboard/health-index", async (request, reply) => {
        try {
            const { month, week } = request.query as {
                month?: string;
                week?: string;
            };

            const healthIndex = await dashboardService.getHealthIndex(month, week);
            return reply.send({ status: "success", data: healthIndex });
        } catch (error: any) {
            return reply.status(500).send({
                status: "error",
                message: error.message || "Erro ao calcular índice de saúde",
            });
        }
    });

    /**
     * GET /api/dashboard/trend-analysis
     * Retorna análise de tendência histórica (performance média por mês)
     * Query params: months (número de meses, padrão 6)
     */
    fastify.get("/dashboard/trend-analysis", async (request, reply) => {
        try {
            const { months } = request.query as { months?: string };
            const monthsNum = months ? parseInt(months) : 6;

            const trendData = await dashboardService.getTrendAnalysis(monthsNum);
            return reply.send({ status: "success", data: trendData });
        } catch (error: any) {
            return reply.status(500).send({
                status: "error",
                message: error.message || "Erro ao calcular tendência",
            });
        }
    });

    /**
     * GET /api/dashboard/financial-bridge
     * Retorna dados para ponte financeira (waterfall chart)
     * Query params: month, week (opcionais)
     */
    fastify.get("/dashboard/financial-bridge", async (request, reply) => {
        try {
            const { month, week } = request.query as {
                month?: string;
                week?: string;
            };

            const bridgeData = await dashboardService.getFinancialBridge(month, week);
            return reply.send({ status: "success", data: bridgeData });
        } catch (error: any) {
            return reply.status(500).send({
                status: "error",
                message: error.message || "Erro ao calcular ponte financeira",
            });
        }
    });

    /**
     * GET /api/dashboard/plan-stats
     * Retorna estatísticas de planos de ação por status
     * Query params: month (opcional)
     */
    fastify.get("/dashboard/plan-stats", async (request, reply) => {
        try {
            const { month } = request.query as { month?: string };

            const planStats = await dashboardService.getPlanStats(month);
            return reply.send({ status: "success", data: planStats });
        } catch (error: any) {
            return reply.status(500).send({
                status: "error",
                message: error.message || "Erro ao calcular estatísticas de planos",
            });
        }
    });

    /**
     * GET /api/dashboard/aging-plans
     * Retorna distribuição de planos por tempo sem atualização
     * Query params: month (opcional)
     */
    fastify.get("/dashboard/aging-plans", async (request, reply) => {
        try {
            const { month } = request.query as { month?: string };

            const agingData = await dashboardService.getAgingPlans(month);
            return reply.send({ status: "success", data: agingData });
        } catch (error: any) {
            return reply.status(500).send({
                status: "error",
                message: error.message || "Erro ao calcular envelhecimento de planos",
            });
        }
    });

    /**
     * GET /api/dashboard/root-cause-cloud
     * Retorna as palavras mais frequentes nas causas raiz
     * Query params: month (opcional)
     */
    fastify.get("/dashboard/root-cause-cloud", async (request, reply) => {
        try {
            const { month } = request.query as { month?: string };

            const rootCauseData = await dashboardService.getRootCauseCloud(month);
            return reply.send({ status: "success", data: rootCauseData });
        } catch (error: any) {
            return reply.status(500).send({
                status: "error",
                message: error.message || "Erro ao calcular nuvem de causas raiz",
            });
        }
    });
}
