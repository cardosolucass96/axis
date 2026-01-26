import { FastifyInstance } from "fastify";
import { MonthlyTargetService } from "../services/MonthlyTargetService";
import { KpiEntryService } from "../services/KpiEntryService";

const monthlyTargetService = new MonthlyTargetService();
const kpiEntryService = new KpiEntryService();

export async function monthlyTargetRoutes(fastify: FastifyInstance) {
  // GET /monthly-targets - Listar todas as metas mensais (com filtros)
  fastify.get("/monthly-targets", async (request, reply) => {
    try {
      const { sectorId, kpiId, month } = request.query as {
        sectorId?: string;
        kpiId?: string;
        month?: string;
      };

      const targets = await monthlyTargetService.getByFilters(
        sectorId,
        kpiId,
        month
      );

      return reply.send({ status: "success", data: targets });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar metas mensais",
      });
    }
  });

  // GET /monthly-targets/:id - Obter detalhes de uma meta mensal
  fastify.get("/monthly-targets/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const target = await monthlyTargetService.getById(id);

      if (!target) {
        return reply.status(404).send({
          status: "error",
          message: "Meta mensal não encontrada",
        });
      }

      return reply.send({ status: "success", data: target });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar meta mensal",
      });
    }
  });

  // POST /monthly-targets - Criar nova meta mensal
  fastify.post("/monthly-targets", async (request, reply) => {
    try {
      const targetData = request.body as any;
      const target = await monthlyTargetService.create(targetData);
      return reply.status(201).send({ status: "success", data: target });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao criar meta mensal",
      });
    }
  });

  // POST /monthly-targets/distribute - Definir meta mensal e distribuir automaticamente
  fastify.post("/monthly-targets/distribute", async (request, reply) => {
    try {
      const { sectorId, kpiId, month, target } = request.body as {
        sectorId: string;
        kpiId: string;
        month: string;
        target: number;
      };

      if (!sectorId || !kpiId || !month || target === undefined) {
        return reply.status(400).send({
          status: "error",
          message: "Parâmetros obrigatórios: sectorId, kpiId, month, target",
        });
      }

      const result = await monthlyTargetService.setMonthlyTargetAndDistribute(
        sectorId,
        kpiId,
        month,
        target
      );

      return reply.status(200).send({
        status: "success",
        data: result,
        message: `Meta mensal definida e distribuída para ${result.entriesUpdated} semanas`,
      });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao distribuir meta mensal",
      });
    }
  });

  // POST /monthly-targets/recalculate - Recalcular metas das semanas futuras baseado nos realizados
  // Este endpoint força o recálculo dinâmico das metas das semanas não concluídas
  fastify.post("/monthly-targets/recalculate", async (request, reply) => {
    try {
      const { sectorId, kpiId, month } = request.body as {
        sectorId: string;
        kpiId: string;
        month: string;
      };

      if (!sectorId || !kpiId || !month) {
        return reply.status(400).send({
          status: "error",
          message: "Parâmetros obrigatórios: sectorId, kpiId, month",
        });
      }

      const result = await kpiEntryService.recalculateRemainingTargets(
        sectorId,
        kpiId,
        month
      );

      return reply.status(200).send({
        status: "success",
        data: result,
        message: `Metas recalculadas: ${result.updated} semanas atualizadas`,
      });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao recalcular metas",
      });
    }
  });

  // PUT /monthly-targets/:id - Atualizar meta mensal
  fastify.put("/monthly-targets/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const targetData = request.body as any;

      const target = await monthlyTargetService.update(id, targetData);

      if (!target) {
        return reply.status(404).send({
          status: "error",
          message: "Meta mensal não encontrada",
        });
      }

      return reply.send({ status: "success", data: target });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao atualizar meta mensal",
      });
    }
  });

  // DELETE /monthly-targets/:id - Deletar meta mensal
  fastify.delete("/monthly-targets/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const success = await monthlyTargetService.delete(id);

      if (!success) {
        return reply.status(404).send({
          status: "error",
          message: "Meta mensal não encontrada",
        });
      }

      return reply.send({
        status: "success",
        message: "Meta mensal excluída com sucesso",
      });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao excluir meta mensal",
      });
    }
  });
}
