import { FastifyInstance } from "fastify";
import { ActionPlanService } from "../services/ActionPlanService.js";
import { RootCauseRepository } from "../repositories/RootCauseRepository.js";

const actionPlanService = new ActionPlanService();
const rootCauseRepository = new RootCauseRepository();

export async function actionPlanRoutes(fastify: FastifyInstance) {
  // GET /api/action-plans - Listar todos os planos (com filtros)
  fastify.get("/api/action-plans", async (request, reply) => {
    try {
      const { status, sectorId, month } = request.query as {
        status?: string;
        sectorId?: string;
        month?: string;
      };

      const filters: any = {};
      if (status) filters.status = status;
      if (sectorId) filters.sectorId = sectorId;
      if (month) filters.month = month;

      const plans = await actionPlanService.findByFilters(filters);
      return reply.send({ status: "success", data: plans });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar planos de ação",
      });
    }
  });

  // GET /api/action-plans/:id - Obter detalhes de um plano
  fastify.get("/api/action-plans/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const plan = await actionPlanService.findById(id);

      if (!plan) {
        return reply.status(404).send({
          status: "error",
          message: "Plano de ação não encontrado",
        });
      }

      return reply.send({ status: "success", data: plan });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar plano de ação",
      });
    }
  });

  // POST /api/entries/:entryId/action-plans - Criar plano de ação para uma entry
  fastify.post("/api/entries/:entryId/action-plans", async (request, reply) => {
    try {
      const { entryId } = request.params as { entryId: string };
      const planData = {
        ...(request.body as any),
        entryId: entryId,
      };

      const plan = await actionPlanService.create(planData);
      return reply.status(201).send({ status: "success", data: plan });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao criar plano de ação",
      });
    }
  });

  // PUT /api/action-plans/:id - Atualizar plano de ação
  fastify.put("/api/action-plans/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const planData = request.body as any;
      const plan = await actionPlanService.update(id, planData);

      if (!plan) {
        return reply.status(404).send({
          status: "error",
          message: "Plano de ação não encontrado",
        });
      }

      return reply.send({ status: "success", data: plan });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao atualizar plano de ação",
      });
    }
  });

  // PATCH /api/action-plans/:id/status - Mudar status do plano
  fastify.patch("/api/action-plans/:id/status", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      const plan = await actionPlanService.updateStatus(id, status);

      if (!plan) {
        return reply.status(404).send({
          status: "error",
          message: "Plano de ação não encontrado",
        });
      }

      return reply.send({ status: "success", data: plan });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao atualizar status do plano",
      });
    }
  });

  // DELETE /api/action-plans/:id - Deletar plano de ação
  fastify.delete("/api/action-plans/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const success = await actionPlanService.delete(id);

      if (!success) {
        return reply.status(404).send({
          status: "error",
          message: "Plano de ação não encontrado",
        });
      }

      return reply.send({
        status: "success",
        message: "Plano de ação deletado com sucesso",
      });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao deletar plano de ação",
      });
    }
  });

  // GET /api/entries/:entryId/causes - Listar causas de uma entry
  fastify.get("/api/entries/:entryId/causes", async (request, reply) => {
    try {
      const { entryId } = request.params as { entryId: string };
      const causes = await rootCauseRepository.findByEntryId(entryId);
      return reply.send({ status: "success", data: causes });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao buscar causas",
      });
    }
  });

  // POST /api/entries/:entryId/causes - Adicionar causa
  fastify.post("/api/entries/:entryId/causes", async (request, reply) => {
    try {
      const { entryId } = request.params as { entryId: string };
      const causeData = {
        ...(request.body as any),
        entryId: entryId,
      };

      const cause = await rootCauseRepository.create(causeData);
      return reply.status(201).send({ status: "success", data: cause });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao criar causa",
      });
    }
  });

  // PUT /api/causes/:id - Atualizar causa
  fastify.put("/api/causes/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const causeData = request.body as any;
      const cause = await rootCauseRepository.update(id, causeData);

      if (!cause) {
        return reply.status(404).send({
          status: "error",
          message: "Causa não encontrada",
        });
      }

      return reply.send({ status: "success", data: cause });
    } catch (error: any) {
      return reply.status(400).send({
        status: "error",
        message: error.message || "Erro ao atualizar causa",
      });
    }
  });

  // DELETE /api/causes/:id - Deletar causa
  fastify.delete("/api/causes/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const success = await rootCauseRepository.delete(id);

      if (!success) {
        return reply.status(404).send({
          status: "error",
          message: "Causa não encontrada",
        });
      }

      return reply.send({
        status: "success",
        message: "Causa deletada com sucesso",
      });
    } catch (error: any) {
      return reply.status(500).send({
        status: "error",
        message: error.message || "Erro ao deletar causa",
      });
    }
  });
}
