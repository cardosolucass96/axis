import { KPIRepository } from "../repositories/KPIRepository";
import { SectorRepository } from "../repositories/SectorRepository";
import { KPI } from "../entities/KPI";

export class KPIService {
    private kpiRepository = new KPIRepository();
    private sectorRepository = new SectorRepository();

    async getAllKPIs(): Promise<KPI[]> {
        return await this.kpiRepository.findAll();
    }

    async getKPIById(id: string): Promise<KPI | null> {
        return await this.kpiRepository.findById(id);
    }

    async getKPIsBySector(sectorId: string): Promise<KPI[]> {
        return await this.kpiRepository.findBySector(sectorId);
    }

    async createKPI(data: {
        name: string;
        unit: "currency" | "number" | "percent";
        format: string;
        sectorId: string;
        isInverse?: boolean;
    }): Promise<KPI> {
        // Verify sector exists
        const sector = await this.sectorRepository.findById(data.sectorId);
        if (!sector) {
            throw new Error("Setor não encontrado");
        }

        return await this.kpiRepository.create({
            ...data,
            isInverse: data.isInverse ?? false
        });
    }

    async updateKPI(
        id: string,
        data: Partial<KPI>
    ): Promise<KPI | null> {
        const kpi = await this.kpiRepository.findById(id);
        if (!kpi) {
            throw new Error("KPI não encontrado");
        }

        return await this.kpiRepository.update(id, data);
    }

    async reorderKPIs(sectorId: string, orderedIds: string[]): Promise<void> {
        await this.kpiRepository.reorderKPIs(sectorId, orderedIds);
    }

    async deleteKPI(id: string): Promise<boolean> {
        const kpi = await this.kpiRepository.findById(id);
        if (!kpi) {
            throw new Error("KPI não encontrado");
        }

        return await this.kpiRepository.delete(id);
    }
}
