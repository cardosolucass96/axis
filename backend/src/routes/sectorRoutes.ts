import { FastifyInstance } from "fastify";
import { SectorService } from "../services/SectorService";
import { KPIService } from "../services/KPIService";

const sectorService = new SectorService();
const kpiService = new KPIService();

export async function sectorRoutes(app: FastifyInstance) {
    // GET /sectors - Listar todos os setores
    app.get("/sectors", async (request, reply) => {
        try {
            const sectors = await sectorService.getAllSectors();
            return reply.send({
                status: "success",
                data: sectors,
            });
        } catch (error) {
            return reply.code(500).send({
                status: "error",
                message: "Erro ao buscar setores",
            });
        }
    });

    // GET /sectors/:id - Obter setor por ID
    app.get("/sectors/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const sector = await sectorService.getSectorById(id);
            
            if (!sector) {
                return reply.code(404).send({
                    status: "error",
                    message: "Setor não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: sector,
            });
        } catch (error) {
            return reply.code(500).send({
                status: "error",
                message: "Erro ao buscar setor",
            });
        }
    });

    // POST /sectors - Criar novo setor
    app.post("/sectors", async (request, reply) => {
        try {
            const { name } = request.body as { name: string };
            const sector = await sectorService.createSector(name);

            return reply.code(201).send({
                status: "success",
                data: sector,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao criar setor",
            });
        }
    });

    // PUT /sectors/:id - Atualizar setor
    app.put("/sectors/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { name } = request.body as { name: string };
            
            const sector = await sectorService.updateSector(id, name);
            
            if (!sector) {
                return reply.code(404).send({
                    status: "error",
                    message: "Setor não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: sector,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao atualizar setor",
            });
        }
    });

    // DELETE /sectors/:id - Deletar setor
    app.delete("/sectors/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const success = await sectorService.deleteSector(id);
            
            if (!success) {
                return reply.code(404).send({
                    status: "error",
                    message: "Setor não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: null,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao deletar setor",
            });
        }
    });

    // GET /sectors/:sectorId/kpis - Listar KPIs de um setor
    app.get("/sectors/:sectorId/kpis", async (request, reply) => {
        try {
            const { sectorId } = request.params as { sectorId: string };
            const kpis = await kpiService.getKPIsBySector(sectorId);

            return reply.send({
                status: "success",
                data: kpis,
            });
        } catch (error) {
            return reply.code(500).send({
                status: "error",
                message: "Erro ao buscar KPIs",
            });
        }
    });

    // PUT /sectors/:sectorId/kpis/reorder - Reordenar KPIs
    app.put("/sectors/:sectorId/kpis/reorder", async (request, reply) => {
        try {
            const { sectorId } = request.params as { sectorId: string };
            const { orderedIds } = request.body as { orderedIds: string[] };

            if (!Array.isArray(orderedIds)) {
                return reply.code(400).send({ status: "error", message: "orderedIds deve ser um array" });
            }

            await kpiService.reorderKPIs(sectorId, orderedIds);
            return reply.send({ status: "success", data: null });
        } catch (error: any) {
            return reply.code(500).send({ status: "error", message: error.message || "Erro ao reordenar KPIs" });
        }
    });

    // POST /sectors/:sectorId/kpis - Criar novo KPI
    app.post("/sectors/:sectorId/kpis", async (request, reply) => {
        try {
            const { sectorId } = request.params as { sectorId: string };
            const body = request.body as any;
            
            const kpi = await kpiService.createKPI({
                name: body.name,
                unit: body.unit,
                format: body.format,
                sectorId,
                isInverse: body.isInverse ?? false,
            });

            return reply.code(201).send({
                status: "success",
                data: kpi,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao criar KPI",
            });
        }
    });
}

export async function kpiRoutes(app: FastifyInstance) {
    // GET /kpis - Listar todos os KPIs
    app.get("/kpis", async (request, reply) => {
        try {
            const kpis = await kpiService.getAllKPIs();
            return reply.send({
                status: "success",
                data: kpis,
            });
        } catch (error) {
            return reply.code(500).send({
                status: "error",
                message: "Erro ao buscar KPIs",
            });
        }
    });

    // GET /kpis/:id - Obter KPI por ID
    app.get("/kpis/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const kpi = await kpiService.getKPIById(id);
            
            if (!kpi) {
                return reply.code(404).send({
                    status: "error",
                    message: "KPI não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: kpi,
            });
        } catch (error) {
            return reply.code(500).send({
                status: "error",
                message: "Erro ao buscar KPI",
            });
        }
    });

    // PUT /kpis/:id - Atualizar KPI
    app.put("/kpis/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const body = request.body as any;
            
            const kpi = await kpiService.updateKPI(id, body);
            
            if (!kpi) {
                return reply.code(404).send({
                    status: "error",
                    message: "KPI não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: kpi,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao atualizar KPI",
            });
        }
    });

    // DELETE /kpis/:id - Deletar KPI
    app.delete("/kpis/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const success = await kpiService.deleteKPI(id);
            
            if (!success) {
                return reply.code(404).send({
                    status: "error",
                    message: "KPI não encontrado",
                });
            }

            return reply.send({
                status: "success",
                data: null,
            });
        } catch (error: any) {
            return reply.code(400).send({
                status: "error",
                message: error.message || "Erro ao deletar KPI",
            });
        }
    });
}
