import { KpiEntryRepository } from "../repositories/KpiEntryRepository";
import { KPIRepository } from "../repositories/KPIRepository";
import { RootCauseRepository } from "../repositories/RootCauseRepository";
import { KpiEntry } from "../entities/KpiEntry";

export class KpiEntryService {
    private entryRepository = new KpiEntryRepository();
    private kpiRepository = new KPIRepository();
    private rootCauseRepository = new RootCauseRepository();

    async getAllEntries(): Promise<KpiEntry[]> {
        return await this.entryRepository.findAll();
    }

    async getEntryById(id: string): Promise<KpiEntry | null> {
        return await this.entryRepository.findById(id);
    }

    async getEntriesBySector(sectorId: string): Promise<KpiEntry[]> {
        return await this.entryRepository.findBySector(sectorId);
    }

    async getEntriesByFilters(
        sectorId?: string,
        month?: string,
        week?: string
    ): Promise<KpiEntry[]> {
        return await this.entryRepository.findByFilters(sectorId, month, week);
    }

    // Alias para compatibilidade com as rotas
    async findByFilters(filters: {
        sectorId?: string;
        month?: string;
        week?: string;
        kpiId?: string;
    }): Promise<KpiEntry[]> {
        return await this.entryRepository.findByFilters(
            filters.sectorId,
            filters.month,
            filters.week
        );
    }

    async findById(id: string): Promise<KpiEntry | null> {
        return await this.entryRepository.findById(id);
    }

    async create(data: any): Promise<KpiEntry> {
        return await this.createEntry(data);
    }

    async update(id: string, data: any): Promise<KpiEntry | null> {
        return await this.updateEntry(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return await this.deleteEntry(id);
    }

    async createEntry(data: any): Promise<KpiEntry> {
        // Verify KPI exists
        const kpi = await this.kpiRepository.findById(data.kpiId);
        if (!kpi) {
            throw new Error("KPI não encontrado");
        }

        const entryData: any = { ...data };

        // Mapear 'causes' para 'rootCauses'
        if (data.causes && Array.isArray(data.causes)) {
            entryData.rootCauses = data.causes.map((cause: string, index: number) => ({
                cause,
                order: index
            }));
            delete entryData.causes;
        }

        // Se houver actionPlanStatus, podemos inicializar o actionPlan com esse status
        if (data.actionPlanStatus && !data.actionPlan) {
            entryData.actionPlan = { status: data.actionPlanStatus };
        } else if (data.actionPlanStatus && data.actionPlan) {
            entryData.actionPlan = { ...data.actionPlan, status: data.actionPlanStatus };
        }

        // Calcular GAP
        const target = parseFloat(data.target || 0);
        const realized = parseFloat(data.realized || 0);
        entryData.gap = realized - target;
        entryData.gapPercentage = target !== 0 ? (realized / target) * 100 : 0;
        entryData.target = target;
        entryData.realized = realized;

        return await this.entryRepository.create(entryData);
    }

    async updateEntry(
        id: string,
        data: any
    ): Promise<KpiEntry | null> {
        console.log(`[SERVICE] Buscando entry no banco: ${id}`);
        const entry = await this.entryRepository.findById(id);

        if (!entry) {
            console.error(`[SERVICE] Entry não encontrada: ${id}`);
            throw new Error("Entrada de KPI não encontrada");
        }

        const updateData: any = { ...data };
        // Evitar que o campo id no body conflite com o id do path
        delete updateData.id;

        // Mapear 'causes' (frontend strings) para 'rootCauses' (backend entities)
        if (data.causes && Array.isArray(data.causes)) {
            updateData.rootCauses = data.causes.map((cause: string, index: number) => ({
                cause,
                order: index,
                entryId: id
            }));
            delete updateData.causes;
        }

        // Recalcular GAP se necessário
        if (data.realized !== undefined || data.target !== undefined) {
            const realized = parseFloat(String(data.realized ?? entry.realized));
            const target = parseFloat(String(data.target ?? entry.target));
            updateData.gap = realized - target;
            updateData.gapPercentage = target !== 0 ? (realized / target) * 100 : 0;
            updateData.realized = realized;
            updateData.target = target;
        }

        // Mapear status do plano de ação enviado de forma plana pelo frontend
        if (data.actionPlanStatus) {
            if (updateData.actionPlan) {
                updateData.actionPlan.status = data.actionPlanStatus;
            } else if (entry.actionPlan) {
                // Se o actionPlan já existe no banco mas não veio no updateData
                updateData.actionPlan = { ...entry.actionPlan, status: data.actionPlanStatus };
            } else {
                // Se não existe, cria um objeto básico para o cascade save
                updateData.actionPlan = { status: data.actionPlanStatus };
            }
        }

        return await this.entryRepository.update(id, updateData);
    }

    async deleteEntry(id: string): Promise<boolean> {
        const entry = await this.entryRepository.findById(id);
        if (!entry) {
            throw new Error("Entrada de KPI não encontrada");
        }

        return await this.entryRepository.delete(id);
    }

    async addRootCause(
        entryId: string,
        cause: string,
        order: number = 0
    ): Promise<any> {
        const entry = await this.entryRepository.findById(entryId);
        if (!entry) {
            throw new Error("Entrada de KPI não encontrada");
        }

        return await this.rootCauseRepository.create({
            entryId,
            cause,
            order,
        });
    }

    async getRootCauses(entryId: string): Promise<any[]> {
        return await this.rootCauseRepository.findByEntryId(entryId);
    }

    async deleteRootCause(id: string): Promise<boolean> {
        return await this.rootCauseRepository.delete(id);
    }
}
