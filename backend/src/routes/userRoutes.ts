import { FastifyInstance } from "fastify";
import { UserService } from "../services/UserService";
import { updateUserSectorIds } from "../auth/lucia";

const userService = new UserService();

export async function userRoutes(app: FastifyInstance) {
    // GET /users - Listar todos os usuários
    app.get("/users", async (request, reply) => {
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

    // GET /users/:id - Obter usuário por ID
    app.get("/users/:id", async (request, reply) => {
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

    // POST /users - Criar novo usuário
    app.post("/users", async (request, reply) => {
        try {
            const body = request.body as any;
            const user = await userService.createUser({
                name: body.name,
                email: body.email,
                role: body.role,
                sectorIds: body.sectorIds || (body.sectorId ? [body.sectorId] : []),
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

    // PUT /users/:id - Atualizar usuário
    app.put("/users/:id", async (request, reply) => {
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

            // Sincroniza sector_id na tabela de autenticação (Lucia) se vier no body
            if (body.sectorIds !== undefined) {
                updateUserSectorIds(id, body.sectorIds || []);
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

    // DELETE /users/:id - Deletar usuário
    app.delete("/users/:id", async (request, reply) => {
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

    // POST /users/:userId/link-sector - Vincular usuário a setores
    app.post("/users/:userId/link-sector", async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const body = request.body as { sectorId?: string; sectorIds?: string[] };

            // Suporta tanto sectorId (string) quanto sectorIds (array) para backward compat
            const sectorIds = body.sectorIds || (body.sectorId ? [body.sectorId] : []);

            const user = await userService.linkUserToSectors(userId, sectorIds);

            if (!user) {
                return reply.code(404).send({
                    status: "error",
                    message: "Usuário não encontrado",
                });
            }

            // Sincroniza sector_id na tabela de autenticação (Lucia)
            updateUserSectorIds(userId, sectorIds);

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
