import React, { useMemo, useState, useEffect } from 'react';
import { dataService } from '../src/services/dataService';
import {
  BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { 
  AlertCircle, CheckCircle2, Clock, PauseCircle, TrendingUp, TrendingDown, 
  Target, ArrowUpRight, ArrowDownRight, BarChart3, Activity,
  Building2, Zap, Hash, Percent, DollarSign
} from 'lucide-react';
import { Button } from '../components/Button';
import { WeekRangePicker } from '../components/WeekRangePicker';
import { LoadingSpinner, EmptyState } from '../components/ui';
import { MONTHS } from '../types';
import type { KpiEntry, Sector, KPI } from '../types';
import { getNextMonths, getWeeksForMonth, extractDayRange, getMonthAbbrev, getDaysArrayForWeek } from '../utils/weekCalculator';
import { useAuth } from '../contexts/AuthContext';

// Mapa de meses abreviados para índice
const MONTH_ABBR_TO_INDEX: Record<string, number> = {
  'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
  'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
};

// Obter índice global de uma semana para comparação
const getWeekGlobalIndex = (weekLabel: string): number => {
  const match = weekLabel.match(/^([A-Z]{3})\s+Sem(\d+)/);
  if (!match) return -1;
  const monthIdx = MONTH_ABBR_TO_INDEX[match[1]] ?? 0;
  const weekNum = parseInt(match[2]);
  return monthIdx * 10 + weekNum;
};

// Verificar se uma semana está no range selecionado
const isWeekInRange = (weekLabel: string, startWeek: string, endWeek: string): boolean => {
  const startIdx = getWeekGlobalIndex(startWeek);
  const endIdx = getWeekGlobalIndex(endWeek);
  const currentIdx = getWeekGlobalIndex(weekLabel);
  const minIdx = Math.min(startIdx, endIdx);
  const maxIdx = Math.max(startIdx, endIdx);
  return currentIdx >= minIdx && currentIdx <= maxIdx;
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // State for Filters - usando semanas
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [startWeek, setStartWeek] = useState<string | null>(null);
  const [endWeek, setEndWeek] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // e.g. "Março 2026"
  const [filterSector, setFilterSector] = useState<string>('Todos');
  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [allWeekEntries, setAllWeekEntries] = useState<KpiEntry[]>([]); // entradas da semana selecionada (modo dia)
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [initialFiltersSet, setInitialFiltersSet] = useState(false);

  // Meses disponíveis para WeekRangePicker (6 meses a partir de agora)
  const availableMonths = useMemo(() => getNextMonths(6), []);

  // Meses disponíveis extraídos dos dados reais (para modo mês)
  const entryMonths = useMemo(() => {
    const monthSet = new Set<string>();
    entries.forEach(e => { if (e.month) monthSet.add(e.month); });
    // Ordenar cronologicamente usando o índice em MONTHS
    return Array.from(monthSet).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
  }, [entries]);

  // Sincronizar selectedMonth quando entryMonths muda ou modo mês é ativado
  useEffect(() => {
    if (viewMode !== 'month') return;
    if (entryMonths.length === 0) return;
    // Se o mês selecionado atual não existe nos dados reais, usar o último mês disponível
    if (!entryMonths.includes(selectedMonth)) {
      setSelectedMonth(entryMonths[entryMonths.length - 1]);
    }
  }, [viewMode, entryMonths, selectedMonth]);

  // Definir filtros iniciais
  useEffect(() => {
    if (!initialFiltersSet && availableMonths.length > 0) {
      // Período padrão: mês atual (todas as semanas)
      const currentMonth = availableMonths[0];
      const weeks = getWeeksForMonth(currentMonth.month, currentMonth.year);

      if (weeks.length > 0) {
        setStartWeek(weeks[0]);
        setEndWeek(weeks[weeks.length - 1]);
      }

      // Mês padrão para modo mês (mesmo formato do banco: apenas nome)
      setSelectedMonth(currentMonth.month);

      // Se for líder, filtrar pelo seu setor
      if (user?.role === 'leader' && user?.sectorId) {
        setFilterSector(user.sectorId);
      }

      setInitialFiltersSet(true);
    }
  }, [initialFiltersSet, user, availableMonths]);

  // Carregar dados ao montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [entriesData, sectorsData] = await Promise.all([
          dataService.getEntries(undefined, undefined, 'null'), // só entradas semanais (day=null)
          dataService.getSectors()
        ]);
        
        // Se for líder, filtrar entries pelo seu setor
        const filteredByRole = user?.role === 'leader' && user?.sectorId
          ? entriesData.filter(e => e.sectorId === user.sectorId)
          : entriesData;
        
        setEntries(filteredByRole);
        setSectors(sectorsData);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Carregar entradas diárias quando modo dia está ativo
  useEffect(() => {
    if (viewMode !== 'day' || !startWeek) {
      setAllWeekEntries([]);
      return;
    }

    const loadDayData = async () => {
      try {
        setIsDayLoading(true);
        const data = await dataService.getEntries(undefined, undefined, undefined, startWeek);
        const filteredByRole = user?.role === 'leader' && user?.sectorId
          ? data.filter((e: KpiEntry) => e.sectorId === user.sectorId)
          : data;
        setAllWeekEntries(filteredByRole);
      } catch (err) {
        console.error('Erro ao carregar dados diários:', err);
      } finally {
        setIsDayLoading(false);
      }
    };

    loadDayData();
  }, [viewMode, startWeek, user]);

  // Setores disponíveis para filtro
  const availableSectors = useMemo(() => {
    if (user?.role === 'leader' && user?.sectorId) {
      return sectors.filter(s => s.id === user.sectorId);
    }
    return sectors;
  }, [sectors, user]);

  // Handler para mudança de semanas
  const handleWeekRangeChange = (start: string | null, end: string | null) => {
    if (viewMode === 'day') {
      // modo dia: sempre semana única (usa start como âncora)
      setStartWeek(start);
      setEndWeek(start);
    } else {
      setStartWeek(start);
      setEndWeek(end);
    }
  };

  // Handler para troca de modo de visualização
  const handleViewModeChange = (mode: 'month' | 'week' | 'day') => {
    setViewMode(mode);
    if (mode === 'day' && startWeek) {
      setEndWeek(startWeek); // colapsa range para 1 semana
    }
    // Ao entrar no modo mês, garantir que selectedMonth seja um mês com dados reais
    if (mode === 'month' && entryMonths.length > 0 && !entryMonths.includes(selectedMonth)) {
      setSelectedMonth(entryMonths[entryMonths.length - 1]);
    }
  };

  // --- Filter Logic ---
  const filteredEntries = useMemo(() => {
    if (viewMode === 'month') {
      // Se não há meses disponíveis nos dados, mostrar tudo filtrado apenas por setor
      if (!selectedMonth || entryMonths.length === 0) {
        return entries.filter(e => filterSector === 'Todos' || e.sectorId === filterSector);
      }
      return entries.filter(e => {
        const matchMonth = e.month === selectedMonth;
        const matchSector = filterSector === 'Todos' || e.sectorId === filterSector;
        return matchMonth && matchSector;
      });
    }

    if (!startWeek || !endWeek) return entries;

    return entries.filter(e => {
      const inRange = isWeekInRange(e.week, startWeek, endWeek);
      const matchSector = filterSector === 'Todos' || e.sectorId === filterSector;
      return inRange && matchSector;
    });
  }, [entries, viewMode, selectedMonth, startWeek, endWeek, filterSector]);

  // Label do período selecionado
  const periodLabel = useMemo(() => {
    if (viewMode === 'month') return selectedMonth || '';
    if (!startWeek || !endWeek) return '';
    if (viewMode === 'day') return startWeek;
    const startIdx = getWeekGlobalIndex(startWeek);
    const endIdx = getWeekGlobalIndex(endWeek);
    const count = Math.abs(endIdx - startIdx) + 1;
    return `${count} semana${count > 1 ? 's' : ''}`;
  }, [startWeek, endWeek, viewMode, selectedMonth]);

  const clearFilters = () => {
    if (availableMonths.length > 0) {
      const currentMonth = availableMonths[0];
      const weeks = getWeeksForMonth(currentMonth.month, currentMonth.year);
      if (weeks.length > 0) {
        setStartWeek(weeks[0]);
        setEndWeek(weeks[weeks.length - 1]);
      }
      // Para modo mês: preferir o último mês com dados reais
      if (viewMode === 'month' && entryMonths.length > 0) {
        setSelectedMonth(entryMonths[entryMonths.length - 1]);
      } else {
        setSelectedMonth(currentMonth.month);
      }
    }
    setFilterSector('Todos');
  };

  // ==========================================
  // MÉTRICAS PRINCIPAIS
  // ==========================================

  // Saúde dos KPIs
  const healthMetrics = useMemo(() => {
    let onTrack = 0;
    let warning = 0;
    let critical = 0;
    let total = 0;

    filteredEntries.forEach(e => {
      if (e.realized === null) return;
      total++;
      
      const sector = sectors.find(s => s.id === e.sectorId);
      const kpi = sector?.kpis.find(k => k.id === e.kpiId);

      if (kpi?.isInverse) {
        if (e.gap >= 0) onTrack++;
        else if (e.gap > -e.target * 0.1) warning++;
        else critical++;
      } else {
        if (e.gapPercentage >= 100) onTrack++;
        else if (e.gapPercentage >= 90) warning++;
        else critical++;
      }
    });

    const healthScore = total > 0 ? Math.round((onTrack / total) * 100) : 0;
    return { onTrack, warning, critical, total, healthScore };
  }, [filteredEntries, sectors]);

  // Status dos planos de ação
  const planStats = useMemo(() => {
    const plansWithAction = filteredEntries.filter(e => e.actionPlan?.what);
    const completed = plansWithAction.filter(p => p.actionPlanStatus === 'feito').length;
    const inProgress = plansWithAction.filter(p => p.actionPlanStatus === 'fazendo').length;
    const toDo = plansWithAction.filter(p => p.actionPlanStatus === 'a_fazer').length;
    const standBy = plansWithAction.filter(p => p.actionPlanStatus === 'stand_by').length;
    const total = plansWithAction.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, inProgress, toDo, standBy, total, completionRate };
  }, [filteredEntries]);

  // Performance por setor
  const sectorPerformance = useMemo(() => {
    const sectorData: Record<string, { target: number; realized: number; name: string }> = {};

    filteredEntries.forEach(e => {
      if (e.realized === null) return;
      
      const sector = sectors.find(s => s.id === e.sectorId);
      if (!sector) return;

      if (!sectorData[e.sectorId]) {
        sectorData[e.sectorId] = { target: 0, realized: 0, name: sector.name };
      }
      sectorData[e.sectorId].target += Number(e.target) || 0;
      sectorData[e.sectorId].realized += Number(e.realized) || 0;
    });

    return Object.values(sectorData).map(s => ({
      name: s.name,
      atingimento: s.target > 0 ? Math.round((s.realized / s.target) * 100) : 0,
      meta: 100
    })).sort((a, b) => b.atingimento - a.atingimento);
  }, [filteredEntries, sectors]);

  // Tendência mensal
  const trendData = useMemo(() => {
    const monthsMap: Record<string, { totalGapPct: number; count: number }> = {};

    entries.forEach(e => {
      if (e.realized === null) return;
      if (!monthsMap[e.month]) monthsMap[e.month] = { totalGapPct: 0, count: 0 };
      const normalizedPct = Math.min(e.gapPercentage, 150);
      monthsMap[e.month].totalGapPct += normalizedPct;
      monthsMap[e.month].count += 1;
    });

    return Object.keys(monthsMap)
      .sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
      .map(month => ({
        month: month.substring(0, 3),
        performance: Math.round(monthsMap[month].totalGapPct / monthsMap[month].count)
      }));
  }, [entries]);

  // Dados diários para o gráfico de tendência no modo dia
  const dayTrendData = useMemo(() => {
    if (viewMode !== 'day' || !startWeek) return [];
    const days = getDaysArrayForWeek(startWeek);

    const weeklyEntries = allWeekEntries.filter(e =>
      (e.day === null || e.day === undefined) &&
      e.realized !== null &&
      (filterSector === 'Todos' || e.sectorId === filterSector)
    );

    return days.map(day => {
      const dayEntries = allWeekEntries.filter(e =>
        e.day === day &&
        e.realized !== null &&
        (filterSector === 'Todos' || e.sectorId === filterSector)
      );

      if (dayEntries.length > 0) {
        const totalGapPct = dayEntries.reduce((sum, e) => sum + Math.min(e.gapPercentage, 150), 0);
        return {
          label: String(day),
          performance: Math.round(totalGapPct / dayEntries.length),
          isEstimated: false
        };
      }

      // Fallback: gapPercentage da entrada semanal é invariante à divisão linear
      if (weeklyEntries.length > 0) {
        const totalGapPct = weeklyEntries.reduce((sum, e) => sum + Math.min(e.gapPercentage, 150), 0);
        return {
          label: `${day}*`,
          performance: Math.round(totalGapPct / weeklyEntries.length),
          isEstimated: true
        };
      }

      return { label: String(day), performance: 0, isEstimated: true };
    });
  }, [viewMode, startWeek, allWeekEntries, filterSector]);

  const hasEstimatedDayData = dayTrendData.some(d => d.isEstimated);

  // Dados de tendência por semana dentro do mês selecionado (modo mês)
  // Agrupa pelos valores reais de week nas entries ao invés de calcular semanas teóricas
  // (evita mismatch de day-ranges entre anos diferentes)
  const monthTrendData = useMemo(() => {
    if (viewMode !== 'month') return [];

    // Coletar semanas únicas das entries filtradas, ordenadas pelo número da semana
    const weekMap = new Map<string, { totalGapPct: number; count: number }>();

    filteredEntries.forEach(e => {
      if (e.realized === null) return;
      if (!weekMap.has(e.week)) weekMap.set(e.week, { totalGapPct: 0, count: 0 });
      const entry = weekMap.get(e.week)!;
      entry.totalGapPct += Math.min(e.gapPercentage, 150);
      entry.count += 1;
    });

    // Ordenar semanas pelo índice global (mês + número da semana)
    const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => {
      return getWeekGlobalIndex(a) - getWeekGlobalIndex(b);
    });

    return sortedWeeks.map(weekLabel => {
      const data = weekMap.get(weekLabel)!;
      return {
        label: weekLabel.replace(/^[A-Z]{3}\s+/, ''), // "Sem1 (1-6)"
        fullLabel: weekLabel,
        performance: Math.round(data.totalGapPct / data.count),
        count: data.count
      };
    });
  }, [viewMode, filteredEntries]);

  // Dados para gráfico de saúde
  const healthChartData = [
    { name: 'Batidos', value: healthMetrics.onTrack, color: '#10b981' },
    { name: 'Atenção', value: healthMetrics.warning, color: '#f59e0b' },
    { name: 'Críticos', value: healthMetrics.critical, color: '#ef4444' }
  ];

  // ==========================================
  // MÉTRICAS DE KPIs POR SETOR (Aleatórias)
  // ==========================================
  const sectorKpiMetrics = useMemo(() => {
    const metrics: Array<{
      sectorName: string;
      kpiName: string;
      realized: number;
      target: number;
      percentage: number;
      unit: string;
      format: string;
      isInverse: boolean;
      trend: 'up' | 'down' | 'neutral';
    }> = [];

    // Agrupar entries por setor e KPI
    const grouped: Record<string, Record<string, { realized: number; target: number; kpi: KPI; sectorName: string }>> = {};

    filteredEntries.forEach(e => {
      if (e.realized === null) return;
      
      const sector = sectors.find(s => s.id === e.sectorId);
      const kpi = sector?.kpis.find(k => k.id === e.kpiId);
      if (!sector || !kpi) return;

      const sectorKey = e.sectorId;
      const kpiKey = e.kpiId;

      if (!grouped[sectorKey]) grouped[sectorKey] = {};
      if (!grouped[sectorKey][kpiKey]) {
        grouped[sectorKey][kpiKey] = { 
          realized: 0, 
          target: 0, 
          kpi, 
          sectorName: sector.name 
        };
      }
      grouped[sectorKey][kpiKey].realized += Number(e.realized) || 0;
      grouped[sectorKey][kpiKey].target += Number(e.target) || 0;
    });

    // Coletar todos os KPIs disponíveis de todos os setores
    const allKpis: Array<{ realized: number; target: number; kpi: KPI; sectorName: string }> = [];
    Object.entries(grouped).forEach(([sectorId, kpis]) => {
      Object.values(kpis).forEach(kpiData => {
        allKpis.push(kpiData);
      });
    });

    // Selecionar 6 KPIs distribuídos, priorizando variedade de setores
    const sectorIds = Object.keys(grouped);
    const selectedKpis: Array<{ realized: number; target: number; kpi: KPI; sectorName: string }> = [];
    let sectorIndex = 0;
    
    // Primeiro, pegar 1 KPI de cada setor (round-robin)
    while (selectedKpis.length < 6 && sectorIndex < sectorIds.length) {
      const sectorId = sectorIds[sectorIndex];
      const sectorKpis = Object.values(grouped[sectorId]);
      if (sectorKpis.length > 0) {
        const randomKpi = sectorKpis[Math.floor(Math.random() * sectorKpis.length)];
        selectedKpis.push(randomKpi);
      }
      sectorIndex++;
    }
    
    // Se ainda não temos 6, pegar mais KPIs dos setores que têm mais
    if (selectedKpis.length < 6) {
      const remaining = allKpis.filter(k => !selectedKpis.includes(k));
      const shuffled = remaining.sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length && selectedKpis.length < 6; i++) {
        selectedKpis.push(shuffled[i]);
      }
    }
    
    // Processar os KPIs selecionados
    selectedKpis.forEach(randomKpi => {
      const { realized, target, kpi, sectorName } = randomKpi;
        
        let percentage: number;
        if (kpi.isInverse) {
          percentage = target !== 0 ? Math.round(((target - realized) / target + 1) * 100) : 0;
        } else {
          percentage = target !== 0 ? Math.round((realized / target) * 100) : 0;
        }

      metrics.push({
        sectorName,
        kpiName: kpi.name,
        realized,
        target,
        percentage,
        unit: kpi.unit,
        format: kpi.format || '',
        isInverse: kpi.isInverse,
        trend: percentage >= 100 ? 'up' : percentage >= 90 ? 'neutral' : 'down'
      });
    });

    return metrics;
  }, [filteredEntries, sectors]);

  // Formatar valor baseado na unidade
  const formatValue = (value: number, unit: string, format: string) => {
    if (unit === 'currency') {
      return `${format}${(value / 1000).toFixed(0)}k`;
    }
    if (unit === 'percent') {
      return `${value.toFixed(1)}${format}`;
    }
    return `${format}${value.toFixed(0)}`;
  };

  // Ícone baseado na unidade
  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case 'currency': return <DollarSign className="w-4 h-4" />;
      case 'percent': return <Percent className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Visão geral do desempenho {user?.role === 'leader' ? 'do seu setor' : 'da organização'}
            {periodLabel && <span className="ml-2 text-amber-600 dark:text-amber-400">• {periodLabel}</span>}
          </p>
        </div>

        {/* Filtros de Período Dinâmico */}
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'admin' && (
            <div className="relative z-10">
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="Todos">Todos Setores</option>
                {availableSectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle modo mês / semana / dia */}
          <div className="flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden text-sm font-medium">
            <button
              onClick={() => handleViewModeChange('month')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'month'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => handleViewModeChange('week')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'week'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => handleViewModeChange('day')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'day'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Dia
            </button>
          </div>

          {/* Seletor de Mês (modo mês) ou Semanas (modo semana/dia) */}
          {viewMode === 'month' ? (
            entryMonths.length > 0 ? (
            <select
              value={entryMonths.includes(selectedMonth) ? selectedMonth : entryMonths[entryMonths.length - 1]}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {entryMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            ) : (
            <span className="text-sm text-zinc-400 dark:text-zinc-500 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg">
              Todos os dados
            </span>
            )
          ) : (
            <WeekRangePicker
              startWeek={startWeek}
              endWeek={endWeek}
              onChange={handleWeekRangeChange}
              months={availableMonths}
            />
          )}

          <Button variant="ghost" onClick={clearFilters} className="text-xs">
            Resetar
          </Button>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-8 h-8 text-zinc-400" />}
          title="Sem dados para este período"
          description="Não encontramos KPIs registrados para os filtros selecionados."
          action={<Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>}
        />
      ) : (
        <>
          {/* CARDS DE RESUMO - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Saúde dos KPIs */}
            <div className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-xl p-5 shadow-lg border border-zinc-300 dark:border-zinc-700 transition-colors duration-150">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">Saúde KPIs</span>
                <Activity className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-3xl font-bold ${
                  healthMetrics.healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 
                  healthMetrics.healthScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {healthMetrics.healthScore}%
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">saudável</span>
              </div>
              <div className="flex gap-4 text-sm mt-3">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> {healthMetrics.onTrack}
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" /> {healthMetrics.warning}
                </span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" /> {healthMetrics.critical}
                </span>
              </div>
            </div>

            {/* Planos de Ação */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Planos de Ação</span>
                <Target className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-zinc-800 dark:text-white">
                  {planStats.completed}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">de {planStats.total} concluídos</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 mt-3">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${planStats.completionRate}%` }}
                />
              </div>
            </div>

            {/* Em Execução */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Em Andamento</span>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {planStats.inProgress}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">em execução</span>
              </div>
              <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400 mt-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {planStats.toDo} a fazer
                </span>
                <span className="flex items-center gap-1">
                  <PauseCircle className="w-4 h-4" /> {planStats.standBy} pausados
                </span>
              </div>
            </div>
          </div>

          {/* MÉTRICAS DE KPIs POR SETOR */}
          {sectorKpiMetrics.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sectorKpiMetrics.map((metric, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate max-w-[80%]"
                      title={metric.sectorName}
                    >
                      {metric.sectorName}
                    </span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      metric.percentage >= 100 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                      metric.percentage >= 90 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                      'bg-red-100 dark:bg-red-900/30 text-red-600'
                    }`}>
                      {getUnitIcon(metric.unit)}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 truncate" title={metric.kpiName}>
                    {metric.kpiName}
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white">
                    {formatValue(metric.realized, metric.unit, metric.format)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs font-medium ${
                      metric.percentage >= 100 ? 'text-emerald-600' :
                      metric.percentage >= 90 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {metric.percentage}%
                    </span>
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    ) : null}
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      de {formatValue(metric.target, metric.unit, metric.format)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GRÁFICOS PRINCIPAIS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico de Tendência / Performance Diária / Performance Mensal */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {viewMode === 'month' ? 'Performance Semanal do Mês' : viewMode === 'day' ? 'Performance Diária' : 'Tendência de Performance'}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {viewMode === 'month'
                      ? `Atingimento por semana — ${selectedMonth}`
                      : viewMode === 'day'
                      ? `Atingimento dia a dia — ${startWeek}`
                      : 'Evolução do atingimento de metas ao longo do tempo'}
                  </p>
                </div>
                {viewMode === 'week' && trendData.length > 1 && (
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                    trendData[trendData.length - 1]?.performance >= (trendData[trendData.length - 2]?.performance || 0)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {trendData[trendData.length - 1]?.performance >= (trendData[trendData.length - 2]?.performance || 0)
                      ? <TrendingUp className="w-4 h-4" />
                      : <TrendingDown className="w-4 h-4" />
                    }
                    <span>
                      {Math.abs((trendData[trendData.length - 1]?.performance || 0) - (trendData[trendData.length - 2]?.performance || 0))}%
                    </span>
                  </div>
                )}
              </div>

              <div className="h-64">
                {viewMode === 'month' ? (
                  monthTrendData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                      Sem dados para este mês
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} unit="%" domain={[0, 150]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--tooltip-bg, #18181b)', borderRadius: '8px', border: '1px solid var(--tooltip-border, #3f3f46)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                          itemStyle={{ color: 'var(--tooltip-text, #fff)' }}
                          formatter={(value: number, _name: string, props: any) => [
                            `${value}% (${props.payload?.count || 0} KPIs)`,
                            'Atingimento'
                          ]}
                        />
                        <ReferenceLine y={100} stroke="#52525b" strokeDasharray="3 3" />
                        <Bar dataKey="performance" radius={[4, 4, 0, 0]} barSize={40}>
                          {monthTrendData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.performance >= 100 ? '#10b981' : entry.performance >= 90 ? '#f59e0b' : entry.performance > 0 ? '#ef4444' : '#3f3f46'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : viewMode === 'week' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} unit="%" domain={[0, 150]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--tooltip-bg, #18181b)', borderRadius: '8px', border: '1px solid var(--tooltip-border, #3f3f46)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        itemStyle={{ color: 'var(--tooltip-text, #fff)' }}
                        formatter={(value: number) => [`${value}%`, 'Atingimento']}
                      />
                      <ReferenceLine y={100} stroke="#52525b" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="performance"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPerformance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : isDayLoading ? (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                    Carregando dados diários...
                  </div>
                ) : dayTrendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-400">
                    Sem dados para esta semana
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} unit="%" domain={[0, 150]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--tooltip-bg, #18181b)', borderRadius: '8px', border: '1px solid var(--tooltip-border, #3f3f46)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                          itemStyle={{ color: 'var(--tooltip-text, #fff)' }}
                          formatter={(value: number, _name: string, props: any) => [
                            `${value}%${props.payload?.isEstimated ? ' (média estimada)' : ''}`,
                            'Atingimento'
                          ]}
                        />
                        <ReferenceLine y={100} stroke="#52525b" strokeDasharray="3 3" />
                        <Bar dataKey="performance" radius={[4, 4, 0, 0]} barSize={32}>
                          {dayTrendData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isEstimated ? '#a16207' : entry.performance >= 100 ? '#10b981' : entry.performance >= 90 ? '#f59e0b' : '#ef4444'}
                              opacity={entry.isEstimated ? 0.6 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {hasEstimatedDayData && (
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
                        * Dias sem entrada diária cadastrada — valor estimado pela média semanal
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Gráfico de Saúde (Pizza) */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Distribuição KPIs</h3>
                <p className="text-sm text-zinc-500">Status das metas no período</p>
              </div>

              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {healthChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--tooltip-bg, #18181b)', border: '1px solid var(--tooltip-border, #3f3f46)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--tooltip-text, #fff)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centro */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="block text-2xl font-bold text-zinc-900 dark:text-white">
                    {healthMetrics.total}
                  </span>
                  <span className="text-xs text-zinc-500">KPIs</span>
                </div>
              </div>

              {/* Legenda */}
              <div className="flex justify-center gap-4 mt-4">
                {healthChartData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PERFORMANCE POR SETOR */}
          {sectorPerformance.length > 0 && user?.role === 'admin' && filterSector === 'Todos' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-zinc-400" />
                    Performance por Setor
                  </h3>
                  <p className="text-sm text-zinc-500">Comparativo de atingimento entre setores</p>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                    <XAxis type="number" domain={[0, 150]} axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} unit="%" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12 }} 
                      width={100} 
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--tooltip-bg, #18181b)', border: '1px solid var(--tooltip-border, #3f3f46)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--tooltip-text, #fff)' }}
                      formatter={(value: number) => [`${value}%`, 'Atingimento']}
                    />
                    <ReferenceLine x={100} stroke="#52525b" strokeDasharray="3 3" />
                    <Bar dataKey="atingimento" radius={[0, 4, 4, 0]} barSize={24}>
                      {sectorPerformance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.atingimento >= 100 ? '#10b981' : entry.atingimento >= 90 ? '#f59e0b' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* STATUS DOS PLANOS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-zinc-800 dark:text-white">{planStats.completed}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Concluídos</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-zinc-800 dark:text-white">{planStats.inProgress}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Em Execução</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm text-center">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-zinc-800 dark:text-white">{planStats.toDo}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">A Fazer</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm text-center">
              <PauseCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-zinc-800 dark:text-white">{planStats.standBy}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Stand By</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
