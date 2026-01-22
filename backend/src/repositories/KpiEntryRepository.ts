import { AppDataSource } from "../data-source";
import { KpiEntry } from "../entities/KpiEntry";

export class KpiEntryRepository {
    private repository = AppDataSource.getRepository(KpiEntry);

    async findAll(): Promise<KpiEntry[]> {
        return await this.repository.find({
            relations: ["kpi", "sector", "actionPlan", "rootCauses"],
        });
    }

    async findById(id: string): Promise<KpiEntry | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["kpi", "sector", "actionPlan", "rootCauses"],
        });
    }

    async findBySector(sectorId: string): Promise<KpiEntry[]> {
        return await this.repository.find({
            where: { sectorId },
            relations: ["kpi", "sector", "actionPlan", "rootCauses"],
        });
    }

    async findByMonth(month: string): Promise<KpiEntry[]> {
        return await this.repository.find({
            where: { month },
            relations: ["kpi", "sector", "actionPlan", "rootCauses"],
        });
    }

    async findByFilters(
        sectorId?: string,
        month?: string,
        week?: string
    ): Promise<KpiEntry[]> {
        const query = this.repository.createQueryBuilder("entry");

        if (sectorId) {
            query.where("entry.sectorId = :sectorId", { sectorId });
        }

        if (month) {
            query.andWhere("entry.month = :month", { month });
        }

        if (week) {
            query.andWhere("entry.week = :week", { week });
        }

        return await query
            .leftJoinAndSelect("entry.kpi", "kpi")
            .leftJoinAndSelect("entry.sector", "sector")
            .leftJoinAndSelect("entry.actionPlan", "actionPlan")
            .leftJoinAndSelect("entry.rootCauses", "rootCauses")
            .getMany();
    }

    async create(entry: Partial<KpiEntry>): Promise<KpiEntry> {
        const newEntry = this.repository.create(entry);
        return await this.repository.save(newEntry);
    }

    async update(id: string, entry: Partial<KpiEntry>): Promise<KpiEntry | null> {
        await this.repository.update(id, entry);
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
