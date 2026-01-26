import { KpiEntryRepository } from "../repositories/KpiEntryRepository";
import { KPIRepository } from "../repositories/KPIRepository";
import { RootCauseRepository } from "../repositories/RootCauseRepository";
import { MonthlyTargetRepository } from "../repositories/MonthlyTargetRepository";
import { KpiEntry } from "../entities/KpiEntry";
import { recalculateRemainingWeeklyTargets, WeeklyEntry, getWeeksForMonth } from "../utils/weekCalculator";

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

        // Calcular GAP (considerando se é KPI inverso/de teto)
        const target = parseFloat(data.target || 0);
        // Preservar null para realized - significa "não preenchido"
        const hasRealized = data.realized !== null && data.realized !== undefined;
        const realized = hasRealized ? parseFloat(data.realized) : null;
        const realizedForCalc = realized ?? 0;
        
        if (kpi.isInverse) {
            // KPI inverso: meta é o teto (máximo permitido)
            // GAP positivo = bom (abaixo do limite), GAP negativo = ruim (ultrapassou)
            entryData.gap = target - realizedForCalc;
            // Atingimento: estar abaixo é bom, estar acima é ruim
            entryData.gapPercentage = target !== 0 ? ((target - realizedForCalc) / target + 1) * 100 : 0;
        } else {
            // KPI normal: meta é o piso (mínimo a atingir)
            entryData.gap = realizedForCalc - target;
            entryData.gapPercentage = target !== 0 ? (realizedForCalc / target) * 100 : 0;
        }
        entryData.target = target;
        entryData.realized = realized; // Manter null se não foi preenchido

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

        // Buscar KPI para verificar se é inverso
        const kpi = await this.kpiRepository.findById(entry.kpiId);

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

        // Recalcular GAP se necessário (considerando se é KPI inverso/de teto)
        let shouldRecalculate = false;
        if (data.realized !== undefined || data.target !== undefined) {
            // Verificar se realized foi explicitamente definido (não undefined)
            const hasNewRealized = data.realized !== undefined;
            const newRealizedIsNull = data.realized === null;
            
            // Se realized veio no request
            let realized: number | null;
            if (hasNewRealized) {
                realized = newRealizedIsNull ? null : parseFloat(String(data.realized));
            } else {
                realized = entry.realized;
            }
            
            const target = parseFloat(String(data.target ?? entry.target));
            const realizedForCalc = realized ?? 0;
            
            if (kpi?.isInverse) {
                // KPI inverso: meta é o teto (máximo permitido)
                updateData.gap = target - realizedForCalc;
                updateData.gapPercentage = target !== 0 ? ((target - realizedForCalc) / target + 1) * 100 : 0;
            } else {
                // KPI normal: meta é o piso (mínimo a atingir)
                updateData.gap = realizedForCalc - target;
                updateData.gapPercentage = target !== 0 ? (realizedForCalc / target) * 100 : 0;
            }
            updateData.realized = realized;
            updateData.target = target;
            
            // RECÁLCULO DINÂMICO: Sempre recalcular quando o realizado é atualizado (mesmo se já estava concluída)
            if (hasNewRealized && !newRealizedIsNull) {
                // Marcar como concluída se ainda não estava
                if (!entry.isCompleted) {
                    updateData.isCompleted = true;
                    console.log(`[SERVICE] Semana ${entry.week} marcada como concluída.`);
                }
                // Sempre recalcular as metas das semanas futuras quando o realizado muda
                shouldRecalculate = true;
                console.log(`[SERVICE] Recálculo será executado após save (realized atualizado para ${realized}).`);
            }
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

        const result = await this.entryRepository.update(id, updateData);

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
        
        // Buscar todas as entries do mês para este KPI
        const entries = await this.entryRepository.findByFilters(sectorId, month);
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
