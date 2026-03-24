import { AppDataSource } from "../data-source";
import { KPI } from "../entities/KPI";

export class KPIRepository {
    private repository = AppDataSource.getRepository(KPI);

    async findAll(): Promise<KPI[]> {
        return await this.repository.find({ relations: ["sector"] });
    }

    async findById(id: string): Promise<KPI | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["sector"],
        });
    }

    async findBySector(sectorId: string): Promise<KPI[]> {
        return await this.repository.find({
            where: { sectorId },
            relations: ["sector"],
            order: { order: "ASC" },
        });
    }

    async reorderKPIs(sectorId: string, orderedIds: string[]): Promise<void> {
        await Promise.all(
            orderedIds.map((id, index) =>
                this.repository.update({ id, sectorId }, { order: index })
            )
        );
    }

    async create(kpi: Partial<KPI>): Promise<KPI> {
        const newKPI = this.repository.create(kpi);
        return await this.repository.save(newKPI);
    }

    async update(id: string, kpi: Partial<KPI>): Promise<KPI | null> {
        await this.repository.update(id, kpi);
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
