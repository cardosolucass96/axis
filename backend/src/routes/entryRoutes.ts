import { FastifyInstance } from "fastify";
import { KpiEntryService } from "../services/KpiEntryService.js";

const kpiEntryService = new KpiEntryService();

export async function entryRoutes(fastify: FastifyInstance) {
  // GET /entries - Listar todas as entradas (com filtros: sectorId, month, week, day)
  fastify.get("/entries", async (request, reply) => {
    try {
      const { sectorId, month, week, kpiId, day } = request.query as {
        sectorId?: string;
        month?: string;
        week?: string;
        kpiId?: string;
        day?: string;
      };

      const filters: any = {};
      if (sectorId) filters.sectorId = sectorId;
      if (month) filters.month = month;
      if (week) filters.week = week;
      if (kpiId) filters.kpiId = kpiId;
      // day=null → filtrar apenas entries semanais; day=N → filtrar dia N
      if (day !== undefined) {
        filters.day = day === 'null' ? null : parseInt(day);
      }

      const entries = await kpiEntryService.findByFilters(filters);
      return reply.send({ status: "success", data: entries });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar entradas",
      });
    }
  });

  // GET /entries/:id - Obter detalhes de uma entrada
  fastify.get("/entries/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const entry = await kpiEntryService.findById(id);

      if (!entry) {
        return reply.status(404).send({
          status: "error",
          message: "Entrada não encontrada",
        });
      }

      return reply.send({ status: "success", data: entry });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar entrada",
      });
    }
  });

  // POST /entries - Criar nova entrada
  fastify.post("/entries", async (request, reply) => {
    try {
      const entryData = request.body as any;
      const entry = await kpiEntryService.create(entryData);
      return reply.status(201).send({ status: "success", data: entry });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao criar entrada",
      });
    }
  });

  // PUT /entries/:id - Atualizar entrada
  fastify.put("/entries/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const entryData = request.body as any;

      console.log(`[BACKEND] Tentando atualizar entry ID: ${id}`);

      const entry = await kpiEntryService.update(id, entryData);

      if (!entry) {
        return reply.status(404).send({
          status: "error",
          message: "Entrada não encontrada",
        });
      }

      return reply.send({ status: "success", data: entry });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao atualizar entrada",
      });
    }
  });

  // DELETE /entries/:id - Deletar entrada
  fastify.delete("/entries/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const success = await kpiEntryService.delete(id);

      if (!success) {
        return reply.status(404).send({
          status: "error",
          message: "Entrada não encontrada",
        });
      }

      return reply.send({
        status: "success",
        message: "Entrada deletada com sucesso",
      });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao deletar entrada",
      });
    }
  });

  // GET /sectors/:sectorId/entries - Listar entradas de um setor
  fastify.get("/sectors/:sectorId/entries", async (request, reply) => {
    try {
      const { sectorId } = request.params as { sectorId: string };
      const { month, week, day } = request.query as {
        month?: string;
        week?: string;
        day?: string;
      };

      const filters: any = { sectorId };
      if (month) filters.month = month;
      if (week) filters.week = week;
      if (day !== undefined) {
        filters.day = day === 'null' ? null : parseInt(day);
      }

      const entries = await kpiEntryService.findByFilters(filters);
      return reply.send({ status: "success", data: entries });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar entradas do setor",
      });
    }
  });
}
