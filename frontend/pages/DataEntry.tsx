import React, { useState, useEffect } from 'react';
import { KPI, KpiEntry, Sector, FiveWTwoH, MONTHS, WEEKS, User } from '../types';
import { dataService } from '../src/services/dataService';
import { Button } from '../components/Button';
import { FiveWhys } from '../components/FiveWhys';
import { FiveWTwoHInput } from '../components/FiveWTwoH';
import { ChevronDown, Save, AlertTriangle, Check, Loader2, Download } from 'lucide-react';

export const DataEntryPage: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[1]);
  const [selectedWeek, setSelectedWeek] = useState<string>(WEEKS[0]);
  const [entries, setEntries] = useState<Record<string, KpiEntry>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load sectors and users on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [sectorsData, usersData] = await Promise.all([
          dataService.getSectors(),
          dataService.getUsers()
        ]);
        setSectors(sectorsData);
        setAvailableUsers(usersData);
        if (sectorsData.length > 0 && !selectedSector) {
          setSelectedSector(sectorsData[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Load existing data when selection changes
  useEffect(() => {
    loadData();
  }, [selectedSector, selectedMonth, selectedWeek]);

  const loadData = async () => {
    if (!selectedSector) return;
    try {
      const data = await dataService.getEntries(selectedSector, selectedMonth);
      const entriesMap: Record<string, KpiEntry> = {};
      data.forEach(entry => {
        if (entry.week === selectedWeek) {
          entriesMap[entry.kpiId] = entry;
        }
      });
      setEntries(entriesMap);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
    }
  };

  const activeSector = sectors.find(s => s.id === selectedSector);

  const handleInputChange = (kpiId: string, field: 'target' | 'realized', value: string) => {
    const numValue = parseFloat(value) || 0;

    setEntries(prev => {
      const existing = prev[kpiId] || {
        id: dataService.createEntryId(selectedSector, kpiId, selectedMonth, selectedWeek),
        sectorId: selectedSector,
        kpiId,
        month: selectedMonth,
        week: selectedWeek,
        target: 0,
        realized: 0,
        gap: 0,
        gapPercentage: 0,
        lastUpdated: new Date().toISOString()
      };

      const newData = { ...existing, [field]: numValue };

      // Auto calculate gap
      const target = field === 'target' ? numValue : newData.target;
      const realized = field === 'realized' ? numValue : newData.realized;

      newData.gap = realized - target;
      newData.gapPercentage = target !== 0 ? (realized / target) * 100 : 0;

      return { ...prev, [kpiId]: newData };
    });
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

      const emptyPlan: FiveWTwoH = {
        what: '', why: '', where: '', who: '', when: '', how: '', howMuch: ''
      };

      const currentPlan = { ...emptyPlan, ...(entry.actionPlan || {}) };
      const newPlan = { ...currentPlan, [field]: value };

      return { ...prev, [kpiId]: { ...entry, actionPlan: newPlan, actionPlanStatus: entry.actionPlanStatus || 'a_fazer' } };
    });
  };

  const handleSaveIndividual = async (kpiId: string) => {
    const entry = entries[kpiId];
    if (!entry) return;

    setSavingStates(prev => ({ ...prev, [kpiId]: true }));

    try {
      const savedEntry = await dataService.saveEntry(entry);

      // Atualizar o estado local com a entry salva (contendo o ID real do banco)
      setEntries(prev => ({
        ...prev,
        [kpiId]: savedEntry
      }));

      setSavingStates(prev => ({ ...prev, [kpiId]: false }));
      setSuccessStates(prev => ({ ...prev, [kpiId]: true }));
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, [kpiId]: false }));
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSavingStates(prev => ({ ...prev, [kpiId]: false }));
    }
  };

  const handleExport = () => {
    if (!activeSector) return;

    const headers = ['Mês', 'Semana', 'Setor', 'KPI', 'Unidade', 'Meta', 'Realizado', 'Gap', 'Atingimento %'];

    const csvContent = activeSector.kpis.map(kpi => {
      const entry = entries[kpi.id] || { target: 0, realized: 0, gap: 0, gapPercentage: 0 };

      return [
        `"${selectedMonth}"`,
        `"${selectedWeek}"`,
        `"${activeSector.name}"`,
        `"${kpi.name}"`,
        `"${kpi.unit}"`,
        `"${entry.target.toString().replace('.', ',')}"`,
        `"${entry.realized.toString().replace('.', ',')}"`,
        `"${entry.gap.toString().replace('.', ',')}"`,
        `"${entry.gapPercentage.toFixed(2).replace('.', ',')}%"`
      ].join(',');
    });

    const csvString = '\uFEFF' + [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kpis_${activeSector.name.replace(/\s+/g, '_')}_${selectedMonth}.csv`;
    link.click();
  };

  if (!activeSector && sectors.length > 0) {
    return <div>Carregando...</div>;
  }

  if (sectors.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Nenhum Setor Configurado</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Peça para um administrador configurar a estrutura de setores e KPIs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestão de KPI</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Preencha os resultados semanais e justifique os GAPs.</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="mt-4 md:mt-0 flex items-center gap-2">
          <Download className="w-4 h-4" /> Exportar Planilha
        </Button>
      </div>

      {/* Filters - Dark Mode: Zinc-900 BG, Zinc-800 Border */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors">
        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Setor</label>
          <div className="relative">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-black border border-zinc-400 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 pr-8 shadow-sm font-medium transition-colors"
            >
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Mês de Referência</label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-black border border-zinc-400 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 pr-8 shadow-sm font-medium transition-colors"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Período (Semana)</label>
          <div className="relative">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-black border border-zinc-400 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 pr-8 shadow-sm font-medium transition-colors"
            >
              {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="space-y-6">
        {activeSector?.kpis.length === 0 && (
          <div className="text-center py-8 text-zinc-400">Nenhum KPI configurado para este setor.</div>
        )}
        {activeSector?.kpis.map(kpi => {
          const entry: KpiEntry = entries[kpi.id] || {
            id: '',
            sectorId: selectedSector,
            kpiId: kpi.id,
            month: selectedMonth,
            week: selectedWeek,
            target: 0,
            realized: 0,
            gap: 0,
            gapPercentage: 0,
            lastUpdated: new Date().toISOString()
          };
          const hasNegativeGap = entry.gap < 0 && kpi.id !== 'revenue_churn';
          const isChurnBad = kpi.id === 'revenue_churn' && entry.gap > 0;
          const needsAnalysis = (hasNegativeGap || isChurnBad) && entry.target > 0;

          const isSaving = savingStates[kpi.id];
          const isSuccess = successStates[kpi.id];

          return (
            <div key={kpi.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
              <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between md:items-center">
                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  {kpi.name}
                  {needsAnalysis && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 animate-pulse">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Requer Análise
                    </span>
                  )}
                </h3>
                <div className="mt-2 md:mt-0 text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedMonth} • {selectedWeek}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  {/* Inputs - Dark Mode: bg-black (darker than card), light text */}
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Meta ({kpi.format})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2.5 border border-zinc-400 dark:border-zinc-600 bg-white dark:bg-black text-zinc-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-zinc-500 font-medium transition-colors"
                      value={entry.target || ''}
                      onChange={(e) => handleInputChange(kpi.id, 'target', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Realizado ({kpi.format})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2.5 border border-zinc-400 dark:border-zinc-600 bg-white dark:bg-black text-zinc-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-zinc-500 font-medium transition-colors"
                      value={entry.realized || ''}
                      onChange={(e) => handleInputChange(kpi.id, 'realized', e.target.value)}
                    />
                  </div>

                  {/* Calculated Display */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">GAP</span>
                    <span className={`text-lg font-bold ${entry.gap < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {kpi.format} {entry.gap.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Atingimento</span>
                    <span className={`text-lg font-bold ${entry.gapPercentage < 100 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                      {entry.gapPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Qualitative Analysis Section */}
                {(entry.target > 0 || entry.realized > 0) && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 mt-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: 5 Whys */}
                    <div className={needsAnalysis ? 'block' : 'opacity-50 pointer-events-none grayscale'}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${needsAnalysis ? 'bg-red-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Análise de Causa</h4>
                      </div>
                      <FiveWhys
                        causes={entry.causes || []}
                        onChange={(idx, val) => updateCauses(kpi.id, idx, val)}
                      />
                    </div>

                    {/* Right Column: 5W2H */}
                    <div className={needsAnalysis ? 'block' : 'opacity-50 pointer-events-none grayscale'}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${needsAnalysis ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Plano de Ação (Resolução)</h4>
                      </div>
                      <FiveWTwoHInput
                        data={entry.actionPlan}
                        onChange={(field, val) => updateActionPlan(kpi.id, field, val)}
                        availableUsers={availableUsers}
                      />
                    </div>
                  </div>
                )}

                {!needsAnalysis && entry.target > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm rounded border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                    <Check className="w-4 h-4 mr-2" />
                    Meta atingida! Não é necessário preencher análise de causa.
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-6 flex justify-end items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  {isSuccess && <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center animate-fade-in"><Check className="w-4 h-4 mr-1" /> Salvo!</span>}
                  <Button
                    onClick={() => handleSaveIndividual(kpi.id)}
                    disabled={isSaving}
                    className="w-full md:w-auto flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar KPI'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};