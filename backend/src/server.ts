import Fastify from "fastify";
import { AppDataSource } from "./data-source.js";
import { User } from "./entities/User.js";

const fastify = Fastify({ logger: true });

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

// Rota de usuários (existente)
fastify.get("/users", async (request, reply) => {
    const userRepository = AppDataSource.getRepository(User);
    return await userRepository.find();
});

const start = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Banco de dados conectado!");

        await fastify.listen({ port: 3000 });
        console.log("Servidor rodando em http://localhost:3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();