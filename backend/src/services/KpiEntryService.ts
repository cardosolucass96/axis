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
        sectorId?: number;
        month?: string;
        week?: string;
        kpiId?: number;
    }): Promise<KpiEntry[]> {
        return await this.entryRepository.findByFilters(
            filters.sectorId?.toString(),
            filters.month,
            filters.week
        );
    }

    async findById(id: number): Promise<KpiEntry | null> {
        return await this.entryRepository.findById(id.toString());
    }

    async create(data: any): Promise<KpiEntry> {
        return await this.createEntry(data);
    }

    async update(id: number, data: any): Promise<KpiEntry | null> {
        return await this.updateEntry(id.toString(), data);
    }

    async delete(id: number): Promise<boolean> {
        return await this.deleteEntry(id.toString());
    }

    async createEntry(data: {
        sectorId: string;
        kpiId: string;
        month: string;
        week: string;
        target: number;
        realized: number;
    }): Promise<KpiEntry> {
        // Verify KPI exists
        const kpi = await this.kpiRepository.findById(data.kpiId);
        if (!kpi) {
            throw new Error("KPI não encontrado");
        }

        // Calculate gap and gapPercentage
        const gap = data.realized - data.target;
        const gapPercentage = (data.realized / data.target) * 100;

        return await this.entryRepository.create({
            ...data,
            gap,
            gapPercentage,
        });
    }

    async updateEntry(
        id: string,
        data: Partial<KpiEntry>
    ): Promise<KpiEntry | null> {
        const entry = await this.entryRepository.findById(id);
        if (!entry) {
            throw new Error("Entrada de KPI não encontrada");
        }

        // Recalculate gap if realized or target changed
        const updateData = { ...data };
        if (data.realized !== undefined || data.target !== undefined) {
            const realized = data.realized ?? entry.realized;
            const target = data.target ?? entry.target;
            updateData.gap = realized - target;
            updateData.gapPercentage = (realized / target) * 100;
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
