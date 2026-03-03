import { KpiEntryRepository } from "../repositories/KpiEntryRepository";
import { KPIRepository } from "../repositories/KPIRepository";
import { RootCauseRepository } from "../repositories/RootCauseRepository";
import { MonthlyTargetRepository } from "../repositories/MonthlyTargetRepository";
import { KpiEntry } from "../entities/KpiEntry";
import { recalculateRemainingWeeklyTargets, WeeklyEntry, getWeeksForMonth, getDaysInWeek, extractDayRange } from "../utils/weekCalculator";

export class KpiEntryService {
    private entryRepository = new KpiEntryRepository();
    private kpiRepository = new KPIRepository();
    private rootCauseRepository = new RootCauseRepository();
    private monthlyTargetRepository = new MonthlyTargetRepository();

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
        week?: string,
        day?: number | null
    ): Promise<KpiEntry[]> {
        return await this.entryRepository.findByFilters(sectorId, month, week, day);
    }

    // Alias para compatibilidade com as rotas
    async findByFilters(filters: {
        sectorId?: string;
        month?: string;
        week?: string;
        kpiId?: string;
        day?: number | null;
    }): Promise<KpiEntry[]> {
        return await this.entryRepository.findByFilters(
            filters.sectorId,
            filters.month,
            filters.week,
            filters.day
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

        // Mapear 'causes' para 'rootCauses' (apenas para entries semanais)
        if (data.causes && Array.isArray(data.causes) && !data.day) {
            entryData.rootCauses = data.causes.map((cause: string, index: number) => ({
                cause,
                order: index
            }));
            delete entryData.causes;
        } else {
            delete entryData.causes;
        }

        // Entries diárias não devem ter plano de ação
        if (data.day) {
            delete entryData.actionPlan;
            delete entryData.actionPlanStatus;
            delete entryData.rootCauses;
            delete entryData.causes;
        }

        // Se houver actionPlanStatus, podemos inicializar o actionPlan com esse status
        if (!data.day) {
            if (data.actionPlanStatus && !data.actionPlan) {
                entryData.actionPlan = { status: data.actionPlanStatus };
            } else if (data.actionPlanStatus && data.actionPlan) {
                entryData.actionPlan = { ...data.actionPlan, status: data.actionPlanStatus };
            }
        }

        // Calcular GAP (considerando se é KPI inverso/de teto)
        const target = parseFloat(data.target || 0);
        // Preservar null para realized - significa "não preenchido"
        const hasRealized = data.realized !== null && data.realized !== undefined;
        const realized = hasRealized ? parseFloat(data.realized) : null;
        const realizedForCalc = realized ?? 0;
        
        if (kpi.isInverse) {
            entryData.gap = target - realizedForCalc;
            entryData.gapPercentage = target !== 0 ? ((target - realizedForCalc) / target + 1) * 100 : 0;
        } else {
            entryData.gap = realizedForCalc - target;
            entryData.gapPercentage = target !== 0 ? (realizedForCalc / target) * 100 : 0;
        }
        entryData.target = target;
        entryData.realized = realized;

        // Preservar o campo day (null para semanal, número para diária)
        entryData.day = data.day ?? null;

        const createdEntry = await this.entryRepository.create(entryData);

        // Se é uma entrada diária com realized preenchido, agregar para a semanal
        if (data.day && hasRealized) {
            await this.aggregateDailyToWeekly(data.sectorId, data.kpiId, data.month, data.week);
        }

        return createdEntry;
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

        // Buscar KPI para verificar se é inverso
        const kpi = await this.kpiRepository.findById(entry.kpiId);
        const isDailyEntry = entry.day !== null && entry.day !== undefined;

        const updateData: any = { ...data };
        // Evitar que o campo id no body conflite com o id do path
        delete updateData.id;

        // Entries diárias não devem ter plano de ação ou causas
        if (isDailyEntry) {
            delete updateData.actionPlan;
            delete updateData.actionPlanStatus;
            delete updateData.rootCauses;
            delete updateData.causes;
        } else {
            // Mapear 'causes' (frontend strings) para 'rootCauses' (backend entities)
            if (data.causes && Array.isArray(data.causes)) {
                updateData.rootCauses = data.causes.map((cause: string, index: number) => ({
                    cause,
                    order: index,
                    entryId: id
                }));
                delete updateData.causes;
            }
        }

        // Recalcular GAP se necessário (considerando se é KPI inverso/de teto)
        let shouldRecalculate = false;
        let shouldAggregateDaily = false;

        if (data.realized !== undefined || data.target !== undefined) {
            const hasNewRealized = data.realized !== undefined;
            const newRealizedIsNull = data.realized === null;
            
            let realized: number | null;
            if (hasNewRealized) {
                realized = newRealizedIsNull ? null : parseFloat(String(data.realized));
            } else {
                realized = entry.realized;
            }
            
            const target = parseFloat(String(data.target ?? entry.target));
            const realizedForCalc = realized ?? 0;
            
            if (kpi?.isInverse) {
                updateData.gap = target - realizedForCalc;
                updateData.gapPercentage = target !== 0 ? ((target - realizedForCalc) / target + 1) * 100 : 0;
            } else {
                updateData.gap = realizedForCalc - target;
                updateData.gapPercentage = target !== 0 ? (realizedForCalc / target) * 100 : 0;
            }
            updateData.realized = realized;
            updateData.target = target;
            
            if (isDailyEntry) {
                // Entry diária: marcar como concluída se realized preenchido
                if (hasNewRealized && !newRealizedIsNull) {
                    updateData.isCompleted = true;
                    shouldAggregateDaily = true;
                    console.log(`[SERVICE] Entry diária dia ${entry.day} atualizada, agregação será executada.`);
                }
            } else {
                // Entry semanal: lógica existente de recálculo
                if (hasNewRealized && !newRealizedIsNull) {
                    if (!entry.isCompleted) {
                        updateData.isCompleted = true;
                        console.log(`[SERVICE] Semana ${entry.week} marcada como concluída.`);
                    }
                    shouldRecalculate = true;
                    console.log(`[SERVICE] Recálculo será executado após save (realized atualizado para ${realized}).`);
                }
            }
        }

        // Mapear status do plano de ação (apenas para entries semanais)
        if (!isDailyEntry && data.actionPlanStatus) {
            if (updateData.actionPlan) {
                updateData.actionPlan.status = data.actionPlanStatus;
            } else if (entry.actionPlan) {
                updateData.actionPlan = { ...entry.actionPlan, status: data.actionPlanStatus };
            } else {
                updateData.actionPlan = { status: data.actionPlanStatus };
            }
        }

        const result = await this.entryRepository.update(id, updateData);

        // Se é entry diária, agregar para a semanal
        if (shouldAggregateDaily) {
            await this.aggregateDailyToWeekly(entry.sectorId, entry.kpiId, entry.month, entry.week);
        }

        // RECÁLCULO DINÂMICO: Executar APÓS o save para garantir que a entry está atualizada
        if (shouldRecalculate) {
            try {
                console.log(`[SERVICE] Iniciando recálculo dinâmico para KPI ${entry.kpiId} no mês ${entry.month}...`);
                const recalcResult = await this.recalculateRemainingTargets(entry.sectorId, entry.kpiId, entry.month);
                console.log(`[SERVICE] Recálculo concluído: ${recalcResult.updated} entradas atualizadas.`);
            } catch (err) {
                console.error('[SERVICE] Erro no recálculo dinâmico:', err);
            }
        }

        return result;
    }

    /**
     * Recalcula as metas das semanas futuras baseado no desempenho das semanas já concluídas.
     * Esta função é chamada automaticamente quando um realizado é preenchido.
     */
    async recalculateRemainingTargets(
        sectorId: string,
        kpiId: string,
        month: string
    ): Promise<{ updated: number; newTargets: Record<string, number> }> {
        console.log(`[SERVICE] Recalculando metas para KPI ${kpiId} no mês ${month}...`);
        
        // Buscar meta mensal
        const monthlyTarget = await this.monthlyTargetRepository.findByKpiAndMonth(kpiId, month);
        if (!monthlyTarget) {
            console.log('[SERVICE] Meta mensal não encontrada, recálculo cancelado.');
            return { updated: 0, newTargets: {} };
        }
        
        // Buscar KPI para verificar tipo
        const kpi = await this.kpiRepository.findById(kpiId);
        if (!kpi) {
            console.log('[SERVICE] KPI não encontrado, recálculo cancelado.');
            return { updated: 0, newTargets: {} };
        }
        
        // Buscar apenas entries semanais (day IS NULL) do mês para este KPI
        const entries = await this.entryRepository.findByFilters(sectorId, month, undefined, null);
        const kpiEntries = entries.filter(e => e.kpiId === kpiId);
        
        // Mapear entries para o formato esperado pelo recálculo
        const weeklyEntries: WeeklyEntry[] = kpiEntries.map(e => {
            const realizedValue = e.realized !== null && e.realized !== undefined 
                ? parseFloat(String(e.realized)) 
                : null;
            return {
                week: e.week,
                realized: realizedValue ?? 0,
                target: parseFloat(String(e.target)) || 0,
                isCompleted: e.isCompleted || (realizedValue !== null)
            };
        });
        
        // Calcular novas metas
        const currentYear = new Date().getFullYear();
        const newTargets = recalculateRemainingWeeklyTargets(
            parseFloat(String(monthlyTarget.target)),
            month,
            weeklyEntries,
            currentYear,
            kpi.unit
        );
        
        console.log('[SERVICE] Novas metas calculadas:', newTargets);
        
        // Atualizar entries das semanas não concluídas
        let updated = 0;
        const weeks = getWeeksForMonth(month, currentYear);
        
        for (const week of weeks) {
            const entry = kpiEntries.find(e => e.week === week);
            const newTarget = newTargets[week];
            
            // Verificar se realized está vazio (null ou undefined, não 0)
            const hasRealized = entry?.realized !== null && entry?.realized !== undefined;
            
            // Se a entry existe e NÃO está concluída e NÃO tem realized preenchido, atualizar a meta
            if (entry && !entry.isCompleted && !hasRealized && newTarget !== undefined) {
                const target = newTarget;
                const realized = parseFloat(String(entry.realized)) || 0;
                
                let gap: number;
                let gapPercentage: number;
                
                if (kpi.isInverse) {
                    gap = target - realized;
                    gapPercentage = target !== 0 ? ((target - realized) / target + 1) * 100 : 0;
                } else {
                    gap = realized - target;
                    gapPercentage = target !== 0 ? (realized / target) * 100 : 0;
                }
                
                // Atualização direta sem passar pelo merge (evita conflitos com relações)
                await this.entryRepository.updateTarget(entry.id, target, gap, gapPercentage);
                
                console.log(`[SERVICE] Semana ${week}: meta atualizada para ${target.toFixed(2)}`);
                updated++;
            }
        }
        
        console.log(`[SERVICE] Recálculo concluído: ${updated} entradas atualizadas.`);
        return { updated, newTargets };
    }

    /**
     * Agrega os valores realizados das entries diárias para a entry semanal.
     * - Soma todos os realized diários → atualiza o realized semanal
     * - Recalcula GAP e % na entry semanal
     * - Marca semanal como isCompleted quando TODOS os dias têm realized preenchido
     * - Dispara recálculo de semanas futuras se semanal ficou completed
     */
    async aggregateDailyToWeekly(
        sectorId: string,
        kpiId: string,
        month: string,
        week: string
    ): Promise<void> {
        console.log(`[SERVICE] Agregando entries diárias para semanal: ${week}`);

        // Buscar todas as entries diárias da semana
        const dailyEntries = await this.entryRepository.findDailyEntriesForWeek(sectorId, kpiId, month, week);
        
        // Buscar a entry semanal (ou criar uma se não existir)
        let weeklyEntry = await this.entryRepository.findWeeklyEntry(sectorId, kpiId, month, week);
        if (!weeklyEntry) {
            console.log('[SERVICE] Entry semanal não encontrada, criando uma automaticamente...');
            weeklyEntry = await this.entryRepository.create({
                sectorId,
                kpiId,
                month,
                week,
                day: null,
                target: 0,
                realized: null,
                gap: 0,
                gapPercentage: 0,
                isCompleted: false
            } as any);
            console.log(`[SERVICE] Entry semanal criada: ${weeklyEntry.id}`);
        }

        // Buscar KPI para saber se é inverso
        const kpi = await this.kpiRepository.findById(kpiId);

        // Calcular soma dos realizados diários (ignorar entries sem realized)
        const filledDailyEntries = dailyEntries.filter(e => e.realized !== null && e.realized !== undefined);
        const totalRealized = filledDailyEntries.reduce((sum, e) => sum + parseFloat(String(e.realized)), 0);
        
        // Calcular quantos dias a semana tem
        const daysInWeek = getDaysInWeek(week);
        
        // Verificar se TODOS os dias foram preenchidos
        const allDaysFilled = filledDailyEntries.length >= daysInWeek;
        
        // Se nenhum dia foi preenchido, manter null no semanal
        const weeklyRealized = filledDailyEntries.length > 0 ? totalRealized : null;
        
        // Calcular GAP/% da entry semanal
        const weeklyTarget = parseFloat(String(weeklyEntry.target));
        const realizedForCalc = weeklyRealized ?? 0;
        let gap: number;
        let gapPercentage: number;
        
        if (kpi?.isInverse) {
            gap = weeklyTarget - realizedForCalc;
            gapPercentage = weeklyTarget !== 0 ? ((weeklyTarget - realizedForCalc) / weeklyTarget + 1) * 100 : 0;
        } else {
            gap = realizedForCalc - weeklyTarget;
            gapPercentage = weeklyTarget !== 0 ? (realizedForCalc / weeklyTarget) * 100 : 0;
        }

        // Determinar isCompleted: todos os dias preenchidos
        const wasCompleted = weeklyEntry.isCompleted;
        const isNowCompleted = allDaysFilled;

        // Atualizar entry semanal
        await this.entryRepository.updateWeeklyRealized(
            weeklyEntry.id,
            weeklyRealized,
            gap,
            gapPercentage,
            isNowCompleted
        );

        console.log(`[SERVICE] Semanal atualizada: realized=${weeklyRealized}, gap=${gap.toFixed(2)}, completed=${isNowCompleted} (${filledDailyEntries.length}/${daysInWeek} dias)`);

        // Se a semana acabou de ser completada, executar recálculo de semanas futuras
        if (isNowCompleted && !wasCompleted) {
            try {
                console.log(`[SERVICE] Semana ${week} completada! Iniciando recálculo de semanas futuras...`);
                const recalcResult = await this.recalculateRemainingTargets(sectorId, kpiId, month);
                console.log(`[SERVICE] Recálculo concluído: ${recalcResult.updated} entradas atualizadas.`);
            } catch (err) {
                console.error('[SERVICE] Erro no recálculo dinâmico:', err);
            }
        }
    }

    /**
     * Busca entries diárias de uma semana para um setor
     */
    async getDailyEntriesForWeek(
        sectorId: string,
        month: string,
        week: string
    ): Promise<KpiEntry[]> {
        return await this.entryRepository.findByFilters(sectorId, month, week);
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
