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
  Download, Settings, X
} from 'lucide-react';
import { getWeeksForMonth, getCurrentMonth, getCurrentWeek } from '../utils/weekCalculator';
import { useAuth } from '../contexts/AuthContext';

export const DataEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [entries, setEntries] = useState<Record<string, KpiEntry>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [showTargetConfig, setShowTargetConfig] = useState(false);

  // Semanas disponíveis
  const availableWeeks = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return getWeeksForMonth(selectedMonth, currentYear);
  }, [selectedMonth]);

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

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [sectorsData, usersData] = await Promise.all([
          dataService.getSectors(),
          dataService.getUsers()
        ]);
        
        // Admin vê todos os setores, líder vê só o seu
        const filteredSectors = user?.role === 'leader' && user?.sectorId
          ? sectorsData.filter(s => s.id === user.sectorId)
          : sectorsData;
        
        setSectors(filteredSectors);
        setAvailableUsers(usersData);
        
        // Para admin, iniciar com "Todos", para líder, iniciar com seu setor
        if (!selectedSector) {
          if (user?.role === 'admin') {
            setSelectedSector('Todos');
          } else if (filteredSectors.length > 0) {
            setSelectedSector(user?.sectorId || filteredSectors[0].id);
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
    if (selectedWeek && selectedSector) loadData();
  }, [selectedSector, selectedMonth, selectedWeek]);

  const loadData = async () => {
    if (!selectedSector) return;
    try {
      // Se "Todos" selecionado, carregar de todos os setores
      const sectorsToLoad = selectedSector === 'Todos' ? sectors : sectors.filter(s => s.id === selectedSector);
      
      const allEntries = await Promise.all(
        sectorsToLoad.map(s => dataService.getEntries(s.id, selectedMonth))
      );
      const allTargets = await Promise.all(
        sectorsToLoad.map(s => dataService.getMonthlyTargets(s.id, selectedMonth))
      );
      
      const entriesMap: Record<string, KpiEntry> = {};
      allEntries.flat().forEach(entry => {
        if (entry.week === selectedWeek) {
          entriesMap[entry.kpiId] = entry;
        }
      });
      setEntries(entriesMap);

      const targetsMap: Record<string, number> = {};
      allTargets.flat().forEach((target: any) => {
        targetsMap[target.kpiId] = target.target;
      });
      setMonthlyTargets(targetsMap);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
    }
  };

  // Se "Todos" está selecionado, retorna todos os setores, senão apenas o selecionado
  const activeSectors = selectedSector === 'Todos' 
    ? sectors 
    : sectors.filter(s => s.id === selectedSector);
  const activeSector = activeSectors[0];

  // Handler para input de realizado
  const handleRealizedChange = (kpiId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const kpi = activeSector?.kpis.find(k => k.id === kpiId);

    setEntries(prev => {
      const existing = prev[kpiId] || createEmptyEntry(kpiId);
      const newData = { ...existing, realized: numValue };

      // Só calcular GAP se realizado foi preenchido
      if (numValue !== null) {
        const target = newData.target ?? 0;
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

  const createEmptyEntry = (kpiId: string): KpiEntry => ({
    id: dataService.createEntryId(selectedSector, kpiId, selectedMonth, selectedWeek),
    sectorId: selectedSector,
    kpiId,
    month: selectedMonth,
    week: selectedWeek,
    target: 0,
    realized: null,
    gap: 0,
    gapPercentage: 0,
    lastUpdated: new Date().toISOString()
  });

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
      const savedEntry = await dataService.saveEntry(entry);
      setEntries(prev => ({ ...prev, [kpiId]: savedEntry }));
      
      setSuccessStates(prev => ({ ...prev, [kpiId]: true }));
      setTimeout(() => setSuccessStates(prev => ({ ...prev, [kpiId]: false })), 2000);

      if (entry.realized !== null && !entry.isCompleted) {
        await new Promise(r => setTimeout(r, 500));
        await loadData();
      }
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
    link.download = `kpis_${selectedMonth}_${selectedWeek.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
  };

  // Verificar se precisa de análise (GAP ruim E realizado preenchido)
  const needsAnalysis = (kpi: KPI, entry: KpiEntry | undefined): boolean => {
    if (!entry || entry.realized === null || entry.realized === undefined) return false;
    if (entry.target <= 0) return false;
    return entry.gap < 0;
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
              {user?.role === 'admin' && <option value="Todos">Todos Setores</option>}
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
      </div>

      {/* Config de metas mensais - colapsável (não disponível quando "Todos" selecionado) */}
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
              <th className="text-right px-4 py-3 w-32">Meta</th>
              <th className="text-center px-4 py-3 w-40">Realizado</th>
              <th className="text-right px-4 py-3 w-36">GAP</th>
              <th className="text-right px-4 py-3 w-24">%</th>
              <th className="text-center px-4 py-3 w-28">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {activeSectors.map(sector => (
              <React.Fragment key={sector.id}>
                {/* Cabeçalho do setor (apenas quando "Todos" está selecionado) */}
                {selectedSector === 'Todos' && (
                  <tr className="bg-amber-50 dark:bg-amber-900/20">
                    <td colSpan={6} className="px-4 py-2 font-semibold text-amber-700 dark:text-amber-300 text-sm">
                      {sector.name}
                    </td>
                  </tr>
                )}
                {sector.kpis.map(kpi => {
              const entry = entries[kpi.id];
              const hasRealized = entry?.realized !== null && entry?.realized !== undefined;
              const requires = needsAnalysis(kpi, entry);
              const isExpanded = expandedKpi === kpi.id;
              const isSaving = savingStates[kpi.id];
              const isSuccess = successStates[kpi.id];

              return (
                <React.Fragment key={kpi.id}>
                  {/* Linha principal */}
                  <tr className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${requires ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    {/* Nome do KPI */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {requires && (
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
                        {entry?.isCompleted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                            🔒
                          </span>
                        )}
                        {requires && !isExpanded && (
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
                        {kpi.format}{(entry?.target ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Realizado - Input */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={hasRealized ? entry.realized : ''}
                        onChange={(e) => handleRealizedChange(kpi.id, e.target.value)}
                        className="w-full text-center px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                      />
                    </td>

                    {/* GAP - só mostra se tem realizado */}
                    <td className="px-4 py-3 text-right">
                      {hasRealized ? (
                        <span className={`font-semibold ${entry.gap >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {entry.gap >= 0 ? '+' : ''}{kpi.format}{entry.gap.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Atingimento % */}
                    <td className="px-4 py-3 text-right">
                      {hasRealized ? (
                        <span className={`font-semibold ${entry.gapPercentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {entry.gapPercentage.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-center">
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
                    </td>
                  </tr>

                  {/* Linha de análise expandida */}
                  {requires && isExpanded && (
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
                              causes={entry?.causes || []}
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
                              data={entry?.actionPlan}
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
          return (
            <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-zinc-600 dark:text-zinc-400">No alvo:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {allKpis.filter(k => {
                    const e = entries[k.id];
                    return e && e.realized !== null && e.gap >= 0;
                  }).length || 0}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-zinc-600 dark:text-zinc-400">Abaixo:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {allKpis.filter(k => {
                    const e = entries[k.id];
                    return e && e.realized !== null && e.gap < 0;
                  }).length || 0}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                <span className="text-zinc-600 dark:text-zinc-400">Pendente:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {allKpis.filter(k => {
                    const e = entries[k.id];
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