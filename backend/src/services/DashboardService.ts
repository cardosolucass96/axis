import { KpiEntryRepository } from "../repositories/KpiEntryRepository";
import { ActionPlanRepository } from "../repositories/ActionPlanRepository";
import { RootCauseRepository } from "../repositories/RootCauseRepository";
import { SectorRepository } from "../repositories/SectorRepository";
import { KPIRepository } from "../repositories/KPIRepository";

interface HealthIndexData {
    onTrack: number;
    warning: number;
    critical: number;
}

interface TrendDataPoint {
    month: string;
    performance: number;
}

interface FinancialBridgeData {
    data: Array<{
        name: string;
        uv: [number, number];
        value: number;
        fill: string;
        isTotal: boolean;
    }>;
    totalTarget: number;
    totalRealized: number;
}

interface PlanStatsData {
    total: number;
    a_fazer: number;
    fazendo: number;
    feito: number;
    stand_by: number;
}

interface AgingDataPoint {
    name: string;
    healthy: number;
    warning: number;
    critical: number;
}

interface RootCauseWord {
    name: string;
    value: number;
}

export class DashboardService {
    private entryRepository = new KpiEntryRepository();
    private actionPlanRepository = new ActionPlanRepository();
    private rootCauseRepository = new RootCauseRepository();
    private sectorRepository = new SectorRepository();
    private kpiRepository = new KPIRepository();

    /**
     * Calcula o índice de saúde dos KPIs
     * Retorna quantidade de KPIs em cada categoria: onTrack, warning, critical
     */
    async getHealthIndex(month?: string, week?: string): Promise<HealthIndexData> {
        const entries = await this.entryRepository.findByFilters(undefined, month, week);

        let onTrack = 0;
        let warning = 0;
        let critical = 0;

        for (const entry of entries) {
            // Verificar se é KPI de churn (comportamento invertido)
            const kpi = await this.kpiRepository.findById(entry.kpiId);
            const isChurn = kpi?.name?.toLowerCase().includes('churn') || kpi?.name?.toLowerCase().includes('revenue_churn');

            if (isChurn) {
                // Para churn, menor é melhor
                if (entry.gap <= 0) onTrack++;
                else critical++;
            } else {
                // Para KPIs normais, maior é melhor
                if (entry.gapPercentage >= 100) onTrack++;
                else if (entry.gapPercentage >= 90) warning++;
                else critical++;
            }
        }

        return { onTrack, warning, critical };
    }

    /**
     * Análise de tendência histórica
     * Retorna performance média por mês (últimos N meses)
     */
    async getTrendAnalysis(months: number = 6): Promise<TrendDataPoint[]> {
        const allEntries = await this.entryRepository.findAll();

        // Agrupar por mês
        const monthsMap: Record<string, { totalGapPct: number; count: number }> = {};

        allEntries.forEach((entry) => {
            if (!monthsMap[entry.month]) {
                monthsMap[entry.month] = { totalGapPct: 0, count: 0 };
            }
            // Normalizar para evitar outliers
            const normalizedPct = Math.min(entry.gapPercentage, 120);
            monthsMap[entry.month].totalGapPct += normalizedPct;
            monthsMap[entry.month].count += 1;
        });

        // Converter para array e ordenar
        const MONTHS = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        const trendData = Object.keys(monthsMap)
            .sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
            .map((month) => ({
                month: month.substring(0, 3), // Abreviar
                performance: Math.round(monthsMap[month].totalGapPct / monthsMap[month].count),
            }))
            .slice(-months); // Pegar últimos N meses

        return trendData;
    }

    /**
     * Ponte Financeira (Waterfall Chart)
     * Retorna dados para visualização de gap financeiro por setor
     */
    async getFinancialBridge(month?: string, week?: string): Promise<FinancialBridgeData> {
        const entries = await this.entryRepository.findByFilters(undefined, month, week);
        const sectors = await this.sectorRepository.findAll();

        // Filtrar apenas KPIs financeiros (unit = 'currency')
        const financialEntries = [];
        for (const entry of entries) {
            const kpi = await this.kpiRepository.findById(entry.kpiId);
            if (kpi?.unit === 'currency') {
                financialEntries.push(entry);
            }
        }

        const totalTarget = financialEntries.reduce((acc, e) => acc + e.target, 0);
        const totalRealized = financialEntries.reduce((acc, e) => acc + e.realized, 0);

        // Agrupar gaps por setor
        const gapsBySector: Record<string, number> = {};
        financialEntries.forEach((entry) => {
            if (!gapsBySector[entry.sectorId]) {
                gapsBySector[entry.sectorId] = 0;
            }
            gapsBySector[entry.sectorId] += entry.realized - entry.target;
        });

        const data: any[] = [];

        // Barra inicial (Meta)
        data.push({
            name: 'Meta',
            uv: [0, totalTarget],
            value: totalTarget,
            fill: '#52525b', // Zinc 600
            isTotal: true,
        });

        let currentLevel = totalTarget;

        // Barras intermediárias (por setor)
        Object.keys(gapsBySector).forEach((sectorId) => {
            const gap = gapsBySector[sectorId];
            const sector = sectors.find((s) => s.id === sectorId);
            const sectorName = sector?.name.split('-')[0].trim() || sectorId;
            const start = currentLevel;
            const end = currentLevel + gap;

            data.push({
                name: sectorName,
                uv: [Math.min(start, end), Math.max(start, end)],
                value: gap,
                fill: gap >= 0 ? '#10b981' : '#ef4444', // Green or Red
                isTotal: false,
            });

            currentLevel = end;
        });

        // Barra final (Realizado)
        data.push({
            name: 'Real.',
            uv: [0, totalRealized],
            value: totalRealized,
            fill: totalRealized >= totalTarget ? '#f59e0b' : '#3f3f46', // Amber or Zinc 700
            isTotal: true,
        });

        return { data, totalTarget, totalRealized };
    }

    /**
     * Estatísticas de Planos de Ação
     * Retorna contagem por status
     */
    async getPlanStats(month?: string): Promise<PlanStatsData> {
        let plans = await this.actionPlanRepository.findAll();

        // Filtrar por mês se fornecido
        if (month) {
            plans = plans.filter((plan) => {
                // Assumir que o plano tem relação com entry que tem month
                // Para simplificar, vamos filtrar todos os planos
                return true; // TODO: Implementar filtro por mês via entry
            });
        }

        const stats = {
            total: plans.length,
            a_fazer: plans.filter((p) => p.status === 'a_fazer').length,
            fazendo: plans.filter((p) => p.status === 'fazendo').length,
            feito: plans.filter((p) => p.status === 'feito').length,
            stand_by: plans.filter((p) => p.status === 'stand_by').length,
        };

        return stats;
    }

    /**
     * Envelhecimento de Planos de Ação
     * Retorna distribuição de planos por tempo sem atualização
     */
    async getAgingPlans(month?: string): Promise<AgingDataPoint[]> {
        let plans = await this.actionPlanRepository.findAll();

        // Filtrar apenas planos ativos (a_fazer e fazendo)
        plans = plans.filter((p) => p.status === 'a_fazer' || p.status === 'fazendo');

        const today = new Date();
        const data: AgingDataPoint[] = [
            { name: 'A Fazer', healthy: 0, warning: 0, critical: 0 },
            { name: 'Fazendo', healthy: 0, warning: 0, critical: 0 },
        ];

        plans.forEach((plan) => {
            const updatedDate = new Date(plan.updatedAt);
            const diffTime = Math.abs(today.getTime() - updatedDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const category = diffDays < 7 ? 'healthy' : diffDays <= 15 ? 'warning' : 'critical';
            const rowIndex = plan.status === 'a_fazer' ? 0 : 1;

            data[rowIndex][category]++;
        });

        return data;
    }

    /**
     * Nuvem de Causas Raiz
     * Retorna as palavras mais frequentes nas causas raiz
     */
    async getRootCauseCloud(month?: string): Promise<RootCauseWord[]> {
        const entries = await this.entryRepository.findByFilters(undefined, month);
        const stopwords = [
            'de', 'a', 'o', 'as', 'os', 'em', 'para', 'com', 'por',
            'um', 'uma', 'e', 'do', 'da', 'que', 'não', 'na', 'no', 'ao', 'se'
        ];
        const wordCounts: Record<string, number> = {};

        // Buscar causas raiz para cada entry
        for (const entry of entries) {
            const causes = await this.rootCauseRepository.findByEntryId(entry.id.toString());

            causes.forEach((causeObj) => {
                const cause = causeObj.cause;
                // Tokenização simples
                const words = cause
                    .toLowerCase()
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
                    .split(/\s+/);

                words.forEach((word) => {
                    if (word.length > 3 && !stopwords.includes(word)) {
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                    }
                });
            });
        }

        // Converter para array e ordenar
        const rootCauseData = Object.entries(wordCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10

        return rootCauseData;
    }
}
