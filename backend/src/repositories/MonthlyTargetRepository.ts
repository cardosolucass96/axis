import { AppDataSource } from "../data-source";
import { MonthlyTarget } from "../entities/MonthlyTarget";

export class MonthlyTargetRepository {
    private repository = AppDataSource.getRepository(MonthlyTarget);

    async findAll(): Promise<MonthlyTarget[]> {
        return await this.repository.find();
    }

    async findById(id: string): Promise<MonthlyTarget | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findBySectorAndMonth(sectorId: string, month: string): Promise<MonthlyTarget[]> {
        return await this.repository.find({
            where: { sectorId, month }
        });
    }

    async findByKpiAndMonth(kpiId: string, month: string): Promise<MonthlyTarget | null> {
        return await this.repository.findOne({
            where: { kpiId, month }
        });
    }

    async findByFilters(
        sectorId?: string,
        kpiId?: string,
        month?: string
    ): Promise<MonthlyTarget[]> {
        const where: any = {};
        if (sectorId) where.sectorId = sectorId;
        if (kpiId) where.kpiId = kpiId;
        if (month) where.month = month;

        return await this.repository.find({ where });
    }

    async create(data: Partial<MonthlyTarget>): Promise<MonthlyTarget> {
        const target = this.repository.create(data);
        return await this.repository.save(target);
    }

    async update(id: string, data: Partial<MonthlyTarget>): Promise<MonthlyTarget | null> {
        await this.repository.update(id, data);
        return await this.findById(id);
    }

    async upsert(
        sectorId: string,
        kpiId: string,
        month: string,
        target: number
    ): Promise<MonthlyTarget> {
        const existing = await this.findByKpiAndMonth(kpiId, month);

        if (existing) {
            await this.repository.update(existing.id, { target });
            return (await this.findById(existing.id))!;
        } else {
            return await this.create({ sectorId, kpiId, month, target });
        }
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }
}
