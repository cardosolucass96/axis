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
        week?: string,
        day?: number | null
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

        // day === undefined → não filtra (retorna tudo)
        // day === null → apenas entries semanais (day IS NULL)
        // day === número → apenas entries daquele dia
        if (day !== undefined) {
            if (day === null) {
                query.andWhere("entry.day IS NULL");
            } else {
                query.andWhere("entry.day = :day", { day });
            }
        }

        return await query
            .leftJoinAndSelect("entry.kpi", "kpi")
            .leftJoinAndSelect("entry.sector", "sector")
            .leftJoinAndSelect("entry.actionPlan", "actionPlan")
            .leftJoinAndSelect("entry.rootCauses", "rootCauses")
            .getMany();
    }

    /**
     * Busca todas as entries diárias de uma semana específica para um KPI
     */
    async findDailyEntriesForWeek(
        sectorId: string,
        kpiId: string,
        month: string,
        week: string
    ): Promise<KpiEntry[]> {
        return await this.repository.createQueryBuilder("entry")
            .where("entry.sectorId = :sectorId", { sectorId })
            .andWhere("entry.kpiId = :kpiId", { kpiId })
            .andWhere("entry.month = :month", { month })
            .andWhere("entry.week = :week", { week })
            .andWhere("entry.day IS NOT NULL")
            .leftJoinAndSelect("entry.kpi", "kpi")
            .leftJoinAndSelect("entry.sector", "sector")
            .getMany();
    }

    /**
     * Busca a entry semanal (day IS NULL) de um KPI específico
     */
    async findWeeklyEntry(
        sectorId: string,
        kpiId: string,
        month: string,
        week: string
    ): Promise<KpiEntry | null> {
        return await this.repository.createQueryBuilder("entry")
            .where("entry.sectorId = :sectorId", { sectorId })
            .andWhere("entry.kpiId = :kpiId", { kpiId })
            .andWhere("entry.month = :month", { month })
            .andWhere("entry.week = :week", { week })
            .andWhere("entry.day IS NULL")
            .leftJoinAndSelect("entry.kpi", "kpi")
            .leftJoinAndSelect("entry.sector", "sector")
            .leftJoinAndSelect("entry.actionPlan", "actionPlan")
            .leftJoinAndSelect("entry.rootCauses", "rootCauses")
            .getOne();
    }

    async create(entry: Partial<KpiEntry>): Promise<KpiEntry> {
        const newEntry = this.repository.create(entry);
        return await this.repository.save(newEntry);
    }

    async update(id: string, entry: Partial<KpiEntry>): Promise<KpiEntry | null> {
        const existing = await this.findById(id);
        if (!existing) return null;

        // Se houver actionPlanStatus no body (vindo do frontend legado), 
        // mapear para actionPlan.status se o actionPlan existir
        if ((entry as any).actionPlanStatus && existing.actionPlan) {
            existing.actionPlan.status = (entry as any).actionPlanStatus;
        }

        const merged = this.repository.merge(existing, entry);
        return await this.repository.save(merged);
    }

    /**
     * Atualização direta de target, gap e gapPercentage.
     * Usado pelo recálculo dinâmico para evitar conflitos com relações.
     */
    async updateTarget(id: string, target: number, gap: number, gapPercentage: number): Promise<void> {
        await this.repository.update(id, {
            target,
            gap,
            gapPercentage
        });
    }

    /**
     * Atualização direta do realized, gap, gapPercentage e isCompleted.
     * Usado pela agregação de entries diárias para a semanal.
     */
    async updateWeeklyRealized(
        id: string, 
        realized: number | null, 
        gap: number, 
        gapPercentage: number, 
        isCompleted: boolean
    ): Promise<void> {
        await this.repository.update(id, {
            realized,
            gap,
            gapPercentage,
            isCompleted
        });
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
