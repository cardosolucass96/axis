import "reflect-metadata";
import dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import cron from "node-cron";
import { AppDataSource } from "./data-source.js";
import { userRoutes } from "./routes/userRoutes.js";
import { sectorRoutes, kpiRoutes } from "./routes/sectorRoutes.js";
import { entryRoutes } from "./routes/entryRoutes.js";
import { actionPlanRoutes } from "./routes/actionPlanRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { monthlyTargetRoutes } from "./routes/monthlyTargetRoutes.js";
import { sendDailyReport } from "./services/WhatsAppReportService.js";

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do servidor
const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:5173", "http://127.0.0.1:3001", "https://dev.cardosolucas.com"];

const fastify = Fastify({
    logger: process.env.NODE_ENV === "development"
});

// Handler de erro global
fastify.setErrorHandler((error: any, request, reply) => {
    const statusCode = error?.statusCode || 500;
    const message = error?.message || "Erro interno do servidor";
    
    console.error("❌ Erro na rota:", {
        method: request.method,
        url: request.url,
        statusCode,
        message,
        stack: error?.stack
    });

    reply.status(statusCode).send({
        status: "error",
        message,
        statusCode
    });
});

// Register CORS plugin
fastify.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

// Register Cookie plugin
fastify.register(cookie, {
    secret: process.env.SESSION_SECRET || "sua_chave_secreta_muito_segura_aqui_123",
    parseOptions: {}
});

// --- Rota de Health Check ---
fastify.get("/health", async (request, reply) => {
    console.log("🏥 Health check chamado");
    
    // Verifica se a conexão com o banco está ativa
    if (!AppDataSource.isInitialized) {
        console.log("❌ Health check: banco não inicializado");
        return reply.code(503).send({
            status: "error",
            message: "Serviço indisponível: Banco de dados desconectado"
        });
    }

    console.log("✅ Health check: OK");
    // Retorna status OK e dados úteis de monitoramento
    return {
        status: "ok",
        uptime: process.uptime(), // Tempo que o servidor está rodando (em segundos)
        timestamp: new Date().toISOString()
    };
});

// Rota para preview do relatório WhatsApp
fastify.get("/api/report/preview", async (request, reply) => {
    try {
        const { generateDailyReport: genReport } = await import("./services/WhatsAppReportService.js");
        const report = await genReport();
        return { status: "ok", report };
    } catch (error: any) {
        return reply.code(500).send({ status: "error", message: error.message });
    }
});

// Rota para enviar o relatório WhatsApp
fastify.post("/api/report/send", async (request, reply) => {
    try {
        const { generateDailyReport: genReport, sendWhatsAppMessage: sendMsg } = await import("./services/WhatsAppReportService.js");
        const report = await genReport();
        const success = await sendMsg(report);

        if (!success) {
            return reply.code(500).send({ status: "error", message: "Falha ao enviar relatório via WhatsApp" });
        }

        return { status: "ok", message: "Relatório enviado com sucesso" };
    } catch (error: any) {
        return reply.code(500).send({ status: "error", message: error.message });
    }
});

// Registrar rotas com prefixo /api
fastify.register(authRoutes, { prefix: "/api" });
fastify.register(userRoutes, { prefix: "/api" });
fastify.register(sectorRoutes, { prefix: "/api" });
fastify.register(kpiRoutes, { prefix: "/api" });
fastify.register(entryRoutes, { prefix: "/api" });
fastify.register(actionPlanRoutes, { prefix: "/api" });
fastify.register(dashboardRoutes, { prefix: "/api" });
fastify.register(monthlyTargetRoutes, { prefix: "/api" });

const start = async () => {
    try {
        await AppDataSource.initialize();
        console.log("✅ Banco de dados conectado!");

        await fastify.listen({ port: PORT, host: HOST });
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📡 CORS habilitado para: ${CORS_ORIGIN.join(", ")}`);

        // Cron job: relatório diário via WhatsApp às 12h (horário de São Paulo)
        cron.schedule("0 12 * * 1-5", () => {
            console.log("⏰ Executando relatório diário programado...");
            sendDailyReport();
        }, {
            timezone: "America/Sao_Paulo"
        });
        console.log("⏰ Cron job configurado: relatório diário às 12h (seg-sex)");
    } catch (err: any) {
        console.error("❌ Erro ao iniciar servidor:", err?.message || err);
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

// Captura erros não tratados
process.on('unhandledRejection', (reason: any) => {
    console.error('❌ Rejeição não tratada:', reason);
});

process.on('uncaughtException', (error: any) => {
    console.error('❌ Exceção não capturada:', error?.message || error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 Encerrando servidor...');
    await fastify.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📴 Encerrando servidor...');
    await fastify.close();
    process.exit(0);
});