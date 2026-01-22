import { ActionPlanRepository } from "../repositories/ActionPlanRepository";
import { KpiEntryRepository } from "../repositories/KpiEntryRepository";
import { ActionPlan } from "../entities/ActionPlan";

export class ActionPlanService {
    private planRepository = new ActionPlanRepository();
    private entryRepository = new KpiEntryRepository();

    async getAllPlans(): Promise<ActionPlan[]> {
        return await this.planRepository.findAll();
    }

    async getPlanById(id: string): Promise<ActionPlan | null> {
        return await this.planRepository.findById(id);
    }

    async getPlanByEntryId(entryId: string): Promise<ActionPlan | null> {
        return await this.planRepository.findByEntryId(entryId);
    }

    async getPlansByStatus(status: string): Promise<ActionPlan[]> {
        return await this.planRepository.findByStatus(status);
    }

    async createPlan(data: {
        entryId: string;
        what: string;
        why: string;
        where: string;
        who: string;
        when: string;
        how: string;
        howMuch: string;
    }): Promise<ActionPlan> {
        // Verify entry exists
        const entry = await this.entryRepository.findById(data.entryId);
        if (!entry) {
            throw new Error("Entrada de KPI não encontrada");
        }

        // Check if plan already exists for this entry
        const existing = await this.planRepository.findByEntryId(data.entryId);
        if (existing) {
            throw new Error("Esta entrada já possui um plano de ação");
        }

        return await this.planRepository.create({
            ...data,
            status: "a_fazer",
        });
    }

    async updatePlan(
        id: string,
        data: Partial<ActionPlan>
    ): Promise<ActionPlan | null> {
        const plan = await this.planRepository.findById(id);
        if (!plan) {
            throw new Error("Plano de ação não encontrado");
        }

        return await this.planRepository.update(id, data);
    }

    async updatePlanStatus(
        id: string,
        status: "a_fazer" | "fazendo" | "feito" | "stand_by"
    ): Promise<ActionPlan | null> {
        const plan = await this.planRepository.findById(id);
        if (!plan) {
            throw new Error("Plano de ação não encontrado");
        }

        return await this.planRepository.update(id, { status });
    }

    async deletePlan(id: string): Promise<boolean> {
        const plan = await this.planRepository.findById(id);
        if (!plan) {
            throw new Error("Plano de ação não encontrado");
        }

        return await this.planRepository.delete(id);
    }

    // ===== Métodos alias para compatibilidade com as rotas =====

    async findByFilters(filters: { status?: string; sectorId?: string; month?: string }): Promise<ActionPlan[]> {
        // Por enquanto, retornar todos e filtrar no código
        // TODO: Implementar filtros no repository
        const allPlans = await this.planRepository.findAll();

        return allPlans.filter(plan => {
            if (filters.status && plan.status !== filters.status) return false;
            // Note: ActionPlan não tem sectorId ou month diretamente
            // Esses filtros precisariam ser implementados via JOIN com Entry
            return true;
        });
    }

    async findById(id: string): Promise<ActionPlan | null> {
        return await this.getPlanById(id);
    }

    async create(data: any): Promise<ActionPlan> {
        return await this.createPlan(data);
    }

    async update(id: string, data: any): Promise<ActionPlan | null> {
        return await this.updatePlan(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return await this.deletePlan(id);
    }

    async updateStatus(id: string, status: string): Promise<ActionPlan | null> {
        return await this.updatePlanStatus(id, status as any);
    }
}
