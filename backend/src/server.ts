import "reflect-metadata";
import dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { AppDataSource } from "./data-source.js";
import { userRoutes } from "./routes/userRoutes.js";
import { sectorRoutes, kpiRoutes } from "./routes/sectorRoutes.js";
import { entryRoutes } from "./routes/entryRoutes.js";
import { actionPlanRoutes } from "./routes/actionPlanRoutes.js";
import { entryRoutes } from "./routes/entryRoutes.js";
import { actionPlanRoutes } from "./routes/actionPlanRoutes.js";

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do servidor
const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];

const fastify = Fastify({ 
    logger: process.env.NODE_ENV === "development" 
});

// Register CORS plugin
fastify.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
});

// --- Rota de Health Check ---
fastify.get("/health", async (request, reply) => {
    // Verifica se a conexão com o banco está ativa
    if (!AppDataSource.isInitialized) {
        return reply.code(503).send({ 
            status: "error", 
            message: "Serviço indisponível: Banco de dados desconectado" 
        });
    }

    // Retorna status OK e dados úteis de monitoramento
    return {
        status: "ok",
        uptime: process.uptime(), // Tempo que o servidor está rodando (em segundos)
        timestamp: new Date().toISOString()
    };
});

// Registrar rotas
fastify.register(userRoutes);
fastify.register(sectorRoutes);
fastify.register(kpiRoutes);
fastify.register(entryRoutes);
fastify.register(actionPlanRoutes);

const start = async () => {
    try {
        await AppDataSource.initialize();
        console.log("✅ Banco de dados conectado!");

        await fastify.listen({ port: PORT, host: HOST });
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📡 CORS habilitado para: ${CORS_ORIGIN.join(", ")}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();