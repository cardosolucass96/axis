import { FastifyInstance } from "fastify";
import { UserService } from "../services/UserService";

const userService = new UserService();

export async function userRoutes(app: FastifyInstance) {
    // GET /api/users - Listar todos os usuários
    app.get("/api/users", async (request, reply) => {
        try {
            const users = await userService.getAllUsers();
            return reply.send({
                status: "success",
                data: users,
            });
        } catch (error) {
            return reply.code(500).send({
                status: "error",
                message: "Erro ao buscar usuários",
            });
        }
    });

    // GET /api/users/:id - Obter usuário por ID
    app.get("/api/users/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = await userService.getUserById(id);
            
            if (!user) {
                return reply.code(404).send({
                    status: "error",
                    message: "Usuário não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: user,
            });
        } catch (error) {
            return reply.code(500).send({
                status: "error",
                message: "Erro ao buscar usuário",
            });
        }
    });

    // POST /api/users - Criar novo usuário
    app.post("/api/users", async (request, reply) => {
        try {
            const body = request.body as any;
            const user = await userService.createUser({
                name: body.name,
                email: body.email,
                role: body.role,
                sectorId: body.sectorId,
            });

            return reply.code(201).send({
                status: "success",
                data: user,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao criar usuário",
            });
        }
    });

    // PUT /api/users/:id - Atualizar usuário
    app.put("/api/users/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const body = request.body as any;
            
            const user = await userService.updateUser(id, body);
            
            if (!user) {
                return reply.code(404).send({
                    status: "error",
                    message: "Usuário não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: user,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao atualizar usuário",
            });
        }
    });

    // DELETE /api/users/:id - Deletar usuário
    app.delete("/api/users/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const success = await userService.deleteUser(id);
            
            if (!success) {
                return reply.code(404).send({
                    status: "error",
                    message: "Usuário não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: null,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao deletar usuário",
            });
        }
    });

    // POST /api/users/:userId/link-sector - Vincular usuário a setor
    app.post("/api/users/:userId/link-sector", async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const { sectorId } = request.body as { sectorId: string };
            
            const user = await userService.linkUserToSector(userId, sectorId);
            
            if (!user) {
                return reply.code(404).send({
                    status: "error",
                    message: "Usuário não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: user,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao vincular usuário",
            });
        }
    });
}
