import { MonthlyTargetRepository } from "../repositories/MonthlyTargetRepository";
import { KPIRepository } from "../repositories/KPIRepository";
import { KpiEntryRepository } from "../repositories/KpiEntryRepository";
import { MonthlyTarget } from "../entities/MonthlyTarget";
import { distributeMonthlyTarget, getWeeksForMonth } from "../utils/weekCalculator";

export class MonthlyTargetService {
    private monthlyTargetRepository = new MonthlyTargetRepository();
    private kpiRepository = new KPIRepository();
    private kpiEntryRepository = new KpiEntryRepository();

    async getAll(): Promise<MonthlyTarget[]> {
        return await this.monthlyTargetRepository.findAll();
    }

    async getById(id: string): Promise<MonthlyTarget | null> {
        return await this.monthlyTargetRepository.findById(id);
    }

    async getBySectorAndMonth(sectorId: string, month: string): Promise<MonthlyTarget[]> {
        return await this.monthlyTargetRepository.findBySectorAndMonth(sectorId, month);
    }

    async getByKpiAndMonth(kpiId: string, month: string): Promise<MonthlyTarget | null> {
        return await this.monthlyTargetRepository.findByKpiAndMonth(kpiId, month);
    }

    async getByFilters(
        sectorId?: string,
        kpiId?: string,
        month?: string
    ): Promise<MonthlyTarget[]> {
        return await this.monthlyTargetRepository.findByFilters(sectorId, kpiId, month);
    }

    async create(data: Partial<MonthlyTarget>): Promise<MonthlyTarget> {
        // Verify KPI exists
        if (data.kpiId) {
            const kpi = await this.kpiRepository.findById(data.kpiId);
            if (!kpi) {
                throw new Error("KPI não encontrado");
            }
        }

        return await this.monthlyTargetRepository.create(data);
    }

    async update(id: string, data: Partial<MonthlyTarget>): Promise<MonthlyTarget | null> {
        return await this.monthlyTargetRepository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return await this.monthlyTargetRepository.delete(id);
    }

    /**
     * Salva meta mensal e distribui automaticamente para as semanas
     */
    async setMonthlyTargetAndDistribute(
        sectorId: string,
        kpiId: string,
        month: string,
        target: number
    ): Promise<{
        monthlyTarget: MonthlyTarget;
        weeklyDistribution: Record<string, number>;
        entriesUpdated: number;
    }> {
        // Buscar KPI para verificar o tipo
        const kpi = await this.kpiRepository.findById(kpiId);
        if (!kpi) {
            throw new Error(`KPI ${kpiId} não encontrado`);
        }

        // Salvar meta mensal
        const monthlyTarget = await this.monthlyTargetRepository.upsert(
            sectorId,
            kpiId,
            month,
            target
        );

        // Calcular distribuição semanal
        const currentYear = new Date().getFullYear();
        const weeklyDistribution = distributeMonthlyTarget(target, month, currentYear, kpi.unit);

        // Atualizar ou criar entries para cada semana
        const weeks = getWeeksForMonth(month, currentYear);
        let entriesUpdated = 0;

        for (const week of weeks) {
            const weekTarget = weeklyDistribution[week];

            // Buscar entry existente
            const entries = await this.kpiEntryRepository.findByFilters(
                sectorId,
                month,
                week
            );
            const existingEntry = entries.find(e => e.kpiId === kpiId);

            if (existingEntry) {
                // Atualizar target da entry existente (considerando se é KPI inverso)
                // Usar 0 se realized for null para cálculos
                const realized = existingEntry.realized ?? 0;
                let gap: number;
                let gapPercentage: number;
                
                if (kpi.isInverse) {
                    gap = weekTarget - realized;
                    gapPercentage = weekTarget !== 0 ? ((weekTarget - realized) / weekTarget + 1) * 100 : 0;
                } else {
                    gap = realized - weekTarget;
                    gapPercentage = weekTarget !== 0 ? (realized / weekTarget) * 100 : 0;
                }
                
                const updatedData = {
                    ...existingEntry,
                    target: weekTarget,
                    gap,
                    gapPercentage
                };
                await this.kpiEntryRepository.update(existingEntry.id, updatedData);
                entriesUpdated++;
            } else {
                // Criar nova entry (considerando se é KPI inverso)
                const initialGap = kpi.isInverse ? weekTarget : -weekTarget; // Inverso: positivo (abaixo do limite)
                const initialGapPercentage = kpi.isInverse ? 200 : 0; // Inverso: 200% (0 realizado = excelente)
                
                await this.kpiEntryRepository.create({
                    sectorId,
                    kpiId,
                    month,
                    week,
                    target: weekTarget,
                    realized: 0,
                    gap: initialGap,
                    gapPercentage: initialGapPercentage
                });
                entriesUpdated++;
            }
        }

        return {
            monthlyTarget,
            weeklyDistribution,
            entriesUpdated
        };
    }
}
