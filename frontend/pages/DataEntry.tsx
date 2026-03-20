import React, { useState, useEffect, useMemo } from 'react';
import { KPI, KpiEntry, Sector, FiveWTwoH, MONTHS, User } from '../types';
import { dataService } from '../src/services/dataService';
import { Button } from '../components/Button';
import { FiveWhys } from '../components/FiveWhys';
import { FiveWTwoHInput } from '../components/FiveWTwoH';
import { MonthlyTargetConfig } from '../components/MonthlyTargetConfig';
import { LoadingSpinner, EmptyState } from '../components/ui';
import {
  ChevronDown, ChevronRight, Save, AlertTriangle, Check, Loader2,
  Download, Settings, X, Calendar, CalendarDays, Send
} from 'lucide-react';
import { api } from '../src/services/api';
import { getWeeksForMonth, getCurrentMonth, getCurrentWeek, getDaysInWeek, getDaysArrayForWeek, extractDayRange } from '../utils/weekCalculator';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'week' | 'day';

export const DataEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [entries, setEntries] = useState<Record<string, KpiEntry>>({});
  const [weekEntries, setWeekEntries] = useState<Record<string, KpiEntry>>({}); // Entries semanais para referência
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [showTargetConfig, setShowTargetConfig] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Contador de requisições para evitar race conditions
  const loadRequestCounter = React.useRef(0);

  // Semanas disponíveis
  const availableWeeks = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return getWeeksForMonth(selectedMonth, currentYear);
  }, [selectedMonth]);

  // Dias disponíveis na semana selecionada
  const availableDays = useMemo(() => {
    if (!selectedWeek) return [];
    return getDaysArrayForWeek(selectedWeek);
  }, [selectedWeek]);

  // Número de dias na semana selecionada
  const daysCountInWeek = useMemo(() => {
    if (!selectedWeek) return 7;
    return getDaysInWeek(selectedWeek);
  }, [selectedWeek]);

  // Atualizar semana selecionada
  useEffect(() => {
    if (availableWeeks.length > 0 && !selectedWeek) {
      const currentWeek = getCurrentWeek(selectedMonth);
      setSelectedWeek(currentWeek && availableWeeks.includes(currentWeek) ? currentWeek : availableWeeks[0]);
    } else if (selectedWeek && !availableWeeks.includes(selectedWeek)) {
      const currentWeek = getCurrentWeek(selectedMonth);
      setSelectedWeek(currentWeek && availableWeeks.includes(currentWeek) ? currentWeek : availableWeeks[0]);
    }
  }, [availableWeeks, selectedWeek, selectedMonth]);

  // Atualizar dia selecionado quando muda a semana ou modo
  useEffect(() => {
    if (viewMode === 'day' && availableDays.length > 0) {
      // Selecionar o dia atual se estiver na semana, senão o primeiro dia
      const today = new Date().getDate();
      if (availableDays.includes(today)) {
        setSelectedDay(today);
      } else if (!selectedDay || !availableDays.includes(selectedDay)) {
        setSelectedDay(availableDays[0]);
      }
    }
  }, [viewMode, availableDays]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [sectorsData, usersData] = await Promise.all([
          dataService.getSectors(),
          dataService.getUsers()
        ]);
        
        const userSectorIds = user?.sectorIds || [];
        const filteredSectors = user?.role === 'leader' && userSectorIds.length > 0
          ? sectorsData.filter(s => userSectorIds.includes(s.id))
          : sectorsData;

        setSectors(filteredSectors);
        setAvailableUsers(usersData);

        if (!selectedSector) {
          if (user?.role === 'admin') {
            setSelectedSector('Todos');
          } else if (filteredSectors.length > 1) {
            setSelectedSector('Todos');
          } else if (filteredSectors.length === 1) {
            setSelectedSector(filteredSectors[0].id);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [user]);

  // Carregar entries quando seleção mudar
  useEffect(() => {
    if (selectedWeek && selectedSector) {
      // No modo dia, só carregar quando um dia estiver selecionado
      if (viewMode === 'day' && !selectedDay) return;
      loadData();
    }
  }, [selectedSector, selectedMonth, selectedWeek, viewMode, selectedDay]);

  const loadData = async () => {
    if (!selectedSector) return;
    // Incrementar contador para detectar chamadas obsoletas
    const requestId = ++loadRequestCounter.current;
    
    try {
      const sectorsToLoad = selectedSector === 'Todos' ? sectors : sectors.filter(s => s.id === selectedSector);
      
      // Sempre carregar entries semanais (day=null) para referência
      const allWeekEntries = await Promise.all(
        sectorsToLoad.map(s => dataService.getEntries(s.id, selectedMonth, 'null', selectedWeek))
      );
      
      // Se uma nova chamada foi feita enquanto esperávamos, ignorar esta resposta
      if (requestId !== loadRequestCounter.current) return;
      
      const weekEntriesMap: Record<string, KpiEntry> = {};
      allWeekEntries.flat().forEach(entry => {
        weekEntriesMap[entry.kpiId] = entry;
      });
      setWeekEntries(weekEntriesMap);

      if (viewMode === 'day' && selectedDay) {
        // Modo dia: carregar entries do dia específico (filtrado por semana + dia no backend)
        const allDayEntries = await Promise.all(
          sectorsToLoad.map(s => dataService.getEntries(s.id, selectedMonth, String(selectedDay), selectedWeek))
        );
        
        // Verificar novamente se a resposta ainda é relevante
        if (requestId !== loadRequestCounter.current) return;
        
        const dayEntriesMap: Record<string, KpiEntry> = {};
        allDayEntries.flat().forEach(entry => {
          // Backend já filtra por week + day, mapear direto por kpiId
          if (entry.kpiId) {
            dayEntriesMap[entry.kpiId] = entry;
          }
        });
        setEntries(dayEntriesMap);
      } else if (viewMode === 'week') {
        // Modo semana: usar entries semanais (NUNCA setar weekEntries em modo dia)
        setEntries(weekEntriesMap);
      }

      // Carregar metas mensais
      const allTargets = await Promise.all(
        sectorsToLoad.map(s => dataService.getMonthlyTargets(s.id, selectedMonth))
      );
      
      const targetsMap: Record<string, number> = {};
      allTargets.flat().forEach((target: any) => {
        targetsMap[target.kpiId] = target.target;
      });
      setMonthlyTargets(targetsMap);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
    }
  };

  const activeSectors = selectedSector === 'Todos' 
    ? sectors 
    : sectors.filter(s => s.id === selectedSector);
  const activeSector = activeSectors[0];

  // Calcular meta diária a partir da meta semanal
  const getDailyTarget = (weeklyTarget: number): number => {
    return daysCountInWeek > 0 ? weeklyTarget / daysCountInWeek : 0;
  };

  // Handler para input de realizado
  const handleRealizedChange = (kpiId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const kpi = activeSector?.kpis.find(k => k.id === kpiId) || 
                activeSectors.flatMap(s => s.kpis).find(k => k.id === kpiId);

    setEntries(prev => {
      const existing = prev[kpiId] || createEmptyEntry(kpiId);
      const newData = { ...existing, realized: numValue };

      // Calcular target correto (diário ou semanal)
      const baseTarget = viewMode === 'day' 
        ? getDailyTarget(weekEntries[kpiId]?.target ?? 0) 
        : (newData.target ?? 0);

      if (numValue !== null) {
        const target = baseTarget;
        const realized = numValue;

        if (kpi?.isInverse) {
          newData.gap = target - realized;
          newData.gapPercentage = target !== 0 ? ((target - realized) / target + 1) * 100 : 0;
        } else {
          newData.gap = realized - target;
          newData.gapPercentage = target !== 0 ? (realized / target) * 100 : 0;
        }
      } else {
        newData.gap = 0;
        newData.gapPercentage = 0;
      }

      return { ...prev, [kpiId]: newData };
    });
  };

  const createEmptyEntry = (kpiId: string): KpiEntry => {
    // Encontrar o setor correto do KPI (importante no modo "Todos Setores")
    let sectorId = selectedSector === 'Todos' ? '' : selectedSector;
    if (selectedSector === 'Todos') {
      const ownerSector = activeSectors.find(s => s.kpis.some(k => k.id === kpiId));
      sectorId = ownerSector?.id || activeSectors[0]?.id || '';
    }
    
    if (viewMode === 'day' && selectedDay) {
      const weeklyTarget = weekEntries[kpiId]?.target ?? 0;
      const dailyTarget = getDailyTarget(weeklyTarget);
      return {
        id: dataService.createEntryId(sectorId, kpiId, selectedMonth, selectedWeek, selectedDay),
        sectorId,
        kpiId,
        month: selectedMonth,
        week: selectedWeek,
        day: selectedDay,
        target: dailyTarget,
        realized: null,
        gap: 0,
        gapPercentage: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return {
      id: dataService.createEntryId(sectorId, kpiId, selectedMonth, selectedWeek),
      sectorId,
      kpiId,
      month: selectedMonth,
      week: selectedWeek,
      day: null,
      target: 0,
      realized: null,
      gap: 0,
      gapPercentage: 0,
      lastUpdated: new Date().toISOString()
    };
  };

  const updateCauses = (kpiId: string, index: number, value: string) => {
    setEntries(prev => {
      const entry = prev[kpiId];
      if (!entry) return prev;
      const newCauses = [...(entry.causes || [])];
      newCauses[index] = value;
      return { ...prev, [kpiId]: { ...entry, causes: newCauses } };
    });
  };

  const updateActionPlan = (kpiId: string, field: keyof FiveWTwoH, value: string) => {
    setEntries(prev => {
      const entry = prev[kpiId];
      if (!entry) return prev;
      const emptyPlan: FiveWTwoH = { what: '', why: '', where: '', who: '', when: '', how: '', howMuch: '' };
      const newPlan = { ...emptyPlan, ...(entry.actionPlan || {}), [field]: value };
      return { ...prev, [kpiId]: { ...entry, actionPlan: newPlan, actionPlanStatus: entry.actionPlanStatus || 'a_fazer' } };
    });
  };

  const handleSave = async (kpiId: string) => {
    const entry = entries[kpiId];
    if (!entry) return;

    setSavingStates(prev => ({ ...prev, [kpiId]: true }));
    try {
      // Preparar dados para envio
      const entryToSave = { ...entry };
      
      // Garantir sectorId correto (no modo "Todos Setores" pode ter sido criado com setor errado)
      if (selectedSector === 'Todos') {
        const ownerSector = activeSectors.find(s => s.kpis.some(k => k.id === kpiId));
        if (ownerSector) entryToSave.sectorId = ownerSector.id;
      }
      
      // Se é modo dia, garantir que o campo day está correto e a meta é a diária
      if (viewMode === 'day' && selectedDay) {
        entryToSave.day = selectedDay;
        const weeklyTarget = weekEntries[kpiId]?.target ?? 0;
        entryToSave.target = getDailyTarget(weeklyTarget);
      }

      const savedEntry = await dataService.saveEntry(entryToSave);
      setEntries(prev => ({ ...prev, [kpiId]: savedEntry }));
      
      setSuccessStates(prev => ({ ...prev, [kpiId]: true }));
      setTimeout(() => setSuccessStates(prev => ({ ...prev, [kpiId]: false })), 2000);

      // Recarregar dados para atualizar agregações
      await new Promise(r => setTimeout(r, 500));
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [kpiId]: false }));
    }
  };

  const handleSaveMonthlyTarget = async (kpiId: string, monthlyTarget: number) => {
    try {
      await dataService.setMonthlyTargetAndDistribute(selectedSector, kpiId, selectedMonth, monthlyTarget);
      await new Promise(r => setTimeout(r, 300));
      await loadData();
    } catch (error) {
      console.error('Erro ao distribuir meta:', error);
    }
  };

  const handleExport = () => {
    if (!activeSector) return;
    const headers = ['KPI', 'Tipo', 'Meta', 'Realizado', 'GAP', 'Atingimento'];
    const rows = activeSector.kpis.map(kpi => {
      const entry = entries[kpi.id];
      const hasRealized = entry?.realized !== null && entry?.realized !== undefined;
      return [
        `"${kpi.name}"`,
        kpi.isInverse ? 'Teto' : 'Piso',
        entry?.target ?? 0,
        hasRealized ? entry.realized : '-',
        hasRealized ? entry.gap : '-',
        hasRealized ? `${entry.gapPercentage?.toFixed(1)}%` : '-'
      ].join(',');
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const suffix = viewMode === 'day' && selectedDay ? `_dia${selectedDay}` : '';
    link.download = `kpis_${selectedMonth}_${selectedWeek.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}.csv`;
    link.click();
  };

  // Verificar se precisa de análise (GAP ruim E realizado preenchido) — só nível de semana
  const needsAnalysis = (kpi: KPI, entry: KpiEntry | undefined): boolean => {
    if (viewMode === 'day') return false; // Nunca mostrar análise no modo dia
    if (!entry || entry.realized === null || entry.realized === undefined) return false;
    if (entry.target <= 0) return false;
    return entry.gap < 0;
  };

  // Obter nome do dia da semana
  const getDayOfWeekName = (day: number, month: string): string => {
    const monthMap: Record<string, number> = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    const monthNum = monthMap[month.toLowerCase()];
    if (monthNum === undefined) return '';
    const date = new Date(new Date().getFullYear(), monthNum, day);
    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return names[date.getDay()];
  };

  const handleSendReport = async () => {
    if (isSendingReport) return;
    setIsSendingReport(true);
    try {
      await api.report.send();
      setReportSent(true);
      setTimeout(() => setReportSent(false), 3000);
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      alert('Erro ao enviar relatório. Tente novamente.');
    } finally {
      setIsSendingReport(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando KPIs..." />;
  }

  if (sectors.length === 0) {
    return (
      <EmptyState
        icon={<Settings className="w-8 h-8 text-zinc-400" />}
        title="Nenhum Setor Configurado"
        description="Configure setores e KPIs na gestão de estrutura."
      />
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header compacto */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Gestão de KPIs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {selectedSector === 'Todos' ? 'Todos os Setores' : activeSector?.name} • {selectedMonth} • {selectedWeek}
            {viewMode === 'day' && selectedDay && ` • Dia ${selectedDay}`}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedSector !== 'Todos' && (
            <Button variant="ghost" size="sm" onClick={() => setShowTargetConfig(!showTargetConfig)}>
              <Settings className="w-4 h-4" />
              Metas
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant={reportSent ? "ghost" : "outline"}
            size="sm"
            onClick={handleSendReport}
            disabled={isSendingReport}
            title="Enviar relatório via WhatsApp"
          >
            {isSendingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : reportSent ? <Check className="w-4 h-4 text-emerald-500" /> : <Send className="w-4 h-4" />}
            {reportSent ? 'Enviado' : 'WhatsApp'}
          </Button>
        </div>
      </div>

      {/* Filtros inline */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Setor */}
        {(user?.role === 'admin' || sectors.length > 1) && (
          <div className="relative">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 pr-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-amber-500"
            >
              {(user?.role === 'admin' || sectors.length > 1) && <option value="Todos">Todos Setores</option>}
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Mês */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-amber-500"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Semana */}
        <div className="relative">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-amber-500"
          >
            {availableWeeks.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Toggle Semana/Dia */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => { setViewMode('week'); setSelectedDay(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Semana
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'day'
                ? 'bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Dia
          </button>
        </div>

        {/* Seletor de dia (aparece apenas no modo dia) */}
        {viewMode === 'day' && availableDays.length > 0 && (
          <div className="flex items-center gap-1">
            {availableDays.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center min-w-[40px] px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedDay === day
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:border-amber-400 dark:hover:border-amber-500'
                }`}
              >
                <span className="text-[10px] opacity-70">{getDayOfWeekName(day, selectedMonth)}</span>
                <span>{day}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Indicador de modo */}
      {viewMode === 'day' && selectedDay && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
          <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-700 dark:text-amber-300 font-medium">
            Modo diário — Dia {selectedDay} ({getDayOfWeekName(selectedDay, selectedMonth)})
          </span>
          <span className="text-amber-600/70 dark:text-amber-400/70">
            • Meta = meta semanal ÷ {daysCountInWeek} dias • Realizado diário soma para o semanal
          </span>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-700 dark:text-blue-300 font-medium">
            Modo semanal — Realizado é a soma dos dias preenchidos
          </span>
          <span className="text-blue-600/70 dark:text-blue-400/70">
            • Preencha valores no modo Dia • Análise de causa e plano de ação disponíveis aqui
          </span>
        </div>
      )}

      {/* Config de metas mensais - colapsável */}
      {showTargetConfig && activeSector && selectedSector !== 'Todos' && (
        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Configurar Metas Mensais</h3>
            <button onClick={() => setShowTargetConfig(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <MonthlyTargetConfig
            kpis={activeSector.kpis}
            sectorId={selectedSector}
            month={selectedMonth}
            onSave={handleSaveMonthlyTarget}
            existingTargets={monthlyTargets}
          />
        </div>
      )}

      {/* Tabela de KPIs - Compacta */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-950 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left px-4 py-3">KPI</th>
              <th className="text-right px-4 py-3 w-32">Meta{viewMode === 'day' ? ' (dia)' : ''}</th>
              <th className="text-center px-4 py-3 w-40">Realizado</th>
              <th className="text-right px-4 py-3 w-36">GAP</th>
              <th className="text-right px-4 py-3 w-24">%</th>
              <th className="text-center px-4 py-3 w-28">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {activeSectors.map(sector => (
              <React.Fragment key={sector.id}>
                {selectedSector === 'Todos' && (
                  <tr className="bg-amber-50 dark:bg-amber-900/20">
                    <td colSpan={6} className="px-4 py-2 font-semibold text-amber-700 dark:text-amber-300 text-sm">
                      {sector.name}
                    </td>
                  </tr>
                )}
                {sector.kpis.map(kpi => {
              const entry = entries[kpi.id];
              const weekEntry = weekEntries[kpi.id];
              const isDayMode = viewMode === 'day';
              
              // No modo dia, calcular a meta diária a partir da meta semanal
              const displayTarget = isDayMode 
                ? getDailyTarget(weekEntry?.target ?? 0)
                : (entry?.target ?? 0);
              
              const hasRealized = entry?.realized !== null && entry?.realized !== undefined;
              const requires = needsAnalysis(kpi, isDayMode ? weekEntry : entry);
              const isExpanded = expandedKpi === kpi.id;
              const isSaving = savingStates[kpi.id];
              const isSuccess = successStates[kpi.id];

              // No modo semana, mostrar o realizado agregado (read-only)
              const weeklyRealized = weekEntry?.realized;
              const weeklyHasRealized = weeklyRealized !== null && weeklyRealized !== undefined;

              return (
                <React.Fragment key={kpi.id}>
                  {/* Linha principal */}
                  <tr className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                    !isDayMode && requires ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                  }`}>
                    {/* Nome do KPI */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {requires && !isDayMode && (
                          <button
                            onClick={() => setExpandedKpi(isExpanded ? null : kpi.id)}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                            aria-label={isExpanded ? 'Recolher análise' : 'Expandir análise'}
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                          </button>
                        )}
                        <span className="font-medium text-zinc-900 dark:text-white">{kpi.name}</span>
                        {kpi.isInverse && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                            TETO
                          </span>
                        )}
                        {!isDayMode && weekEntry?.isCompleted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                            🔒
                          </span>
                        )}
                        {requires && !isDayMode && !isExpanded && (
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium animate-pulse">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />
                            Análise
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Meta */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-zinc-600 dark:text-zinc-300">
                        {kpi.format}{displayTarget.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Realizado */}
                    <td className="px-4 py-3">
                      {isDayMode ? (
                        /* Modo dia: input editável */
                        <input
                          type="number"
                          step="0.01"
                          placeholder="—"
                          value={hasRealized ? entry.realized : ''}
                          onChange={(e) => handleRealizedChange(kpi.id, e.target.value)}
                          className="w-full text-center px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                        />
                      ) : (
                        /* Modo semana: read-only, mostra soma dos dias */
                        <div className="text-center">
                          {weeklyHasRealized ? (
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {kpi.format}{Number(weeklyRealized).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-500 text-sm italic">
                              Preencha no modo Dia
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* GAP */}
                    <td className="px-4 py-3 text-right">
                      {isDayMode ? (
                        hasRealized ? (
                          <span className={`font-semibold ${entry.gap >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {entry.gap >= 0 ? '+' : ''}{kpi.format}{entry.gap.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">—</span>
                        )
                      ) : (
                        weeklyHasRealized ? (
                          <span className={`font-semibold ${(weekEntry?.gap ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {(weekEntry?.gap ?? 0) >= 0 ? '+' : ''}{kpi.format}{(weekEntry?.gap ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">—</span>
                        )
                      )}
                    </td>

                    {/* Atingimento % */}
                    <td className="px-4 py-3 text-right">
                      {isDayMode ? (
                        hasRealized ? (
                          <span className={`font-semibold ${entry.gapPercentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {entry.gapPercentage.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">—</span>
                        )
                      ) : (
                        weeklyHasRealized ? (
                          <span className={`font-semibold ${(weekEntry?.gapPercentage ?? 0) >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {(weekEntry?.gapPercentage ?? 0).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">—</span>
                        )
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-center">
                      {isDayMode ? (
                        <button
                          onClick={() => handleSave(kpi.id)}
                          disabled={isSaving}
                          className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isSuccess 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95'
                          }`}
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isSuccess ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                          {isSuccess ? 'Salvo' : 'Salvar'}
                        </button>
                      ) : (
                        /* Modo semana: botão de salvar análise (se aplicável) */
                        requires ? (
                          <button
                            onClick={() => handleSave(kpi.id)}
                            disabled={isSaving}
                            className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isSuccess 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95'
                            }`}
                          >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isSuccess ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                            {isSuccess ? 'Salvo' : 'Salvar'}
                          </button>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )
                      )}
                    </td>
                  </tr>

                  {/* Linha de análise expandida (apenas modo semana) */}
                  {!isDayMode && requires && isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-zinc-100 dark:bg-zinc-950 px-4 py-4 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 5 Porquês */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Análise de Causa (5 Porquês)</h4>
                            </div>
                            <FiveWhys
                              causes={weekEntry?.causes || []}
                              onChange={(idx, val) => updateCauses(kpi.id, idx, val)}
                            />
                          </div>

                          {/* 5W2H */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Plano de Ação</h4>
                            </div>
                            <FiveWTwoHInput
                              data={weekEntry?.actionPlan}
                              onChange={(field, val) => updateActionPlan(kpi.id, field, val)}
                              availableUsers={availableUsers}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
                          <Button size="sm" onClick={() => handleSave(kpi.id)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Análise
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Resumo no rodapé */}
        {(() => {
          const allKpis = activeSectors.flatMap(s => s.kpis);
          // No modo semana, usar weekEntries para contagem; no modo dia, usar entries
          const refEntries = viewMode === 'week' ? weekEntries : entries;
          return (
            <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-zinc-600 dark:text-zinc-400">No alvo:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {allKpis.filter(k => {
                    const e = refEntries[k.id];
                    return e && e.realized !== null && e.gap >= 0;
                  }).length || 0}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-zinc-600 dark:text-zinc-400">Abaixo:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {allKpis.filter(k => {
                    const e = refEntries[k.id];
                    return e && e.realized !== null && e.gap < 0;
                  }).length || 0}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                <span className="text-zinc-600 dark:text-zinc-400">Pendente:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {allKpis.filter(k => {
                    const e = refEntries[k.id];
                    return !e || e.realized === null || e.realized === undefined;
                  }).length || 0}
                </span>
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};