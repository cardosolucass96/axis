import React, { useState, useEffect } from 'react';
import { KPI } from '../types';
import { Save, Loader2, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { distributeMonthlyTarget, getTotalDaysInMonth, getWeeksForMonth } from '../utils/weekCalculator';

interface MonthlyTargetConfigProps {
  kpis: KPI[];
  sectorId: string;
  month: string;
  onSave: (kpiId: string, monthlyTarget: number) => Promise<void>;
  existingTargets?: Record<string, number>;
}

export const MonthlyTargetConfig: React.FC<MonthlyTargetConfigProps> = ({
  kpis,
  sectorId,
  month,
  onSave,
  existingTargets = {}
}) => {
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);

  useEffect(() => {
    const initialTargets: Record<string, string> = {};
    kpis.forEach(kpi => {
      if (existingTargets[kpi.id]) {
        initialTargets[kpi.id] = existingTargets[kpi.id].toString();
      }
    });
    setTargets(initialTargets);
  }, [kpis, existingTargets]);

  const handleTargetChange = (kpiId: string, value: string) => {
    setTargets(prev => ({ ...prev, [kpiId]: value }));
  };

  const handleSave = async (kpiId: string) => {
    const targetValue = parseFloat(targets[kpiId]);
    if (isNaN(targetValue) || targetValue <= 0) return;

    setSaving(prev => ({ ...prev, [kpiId]: true }));

    try {
      await onSave(kpiId, targetValue);
      setSuccess(prev => ({ ...prev, [kpiId]: true }));
      setTimeout(() => setSuccess(prev => ({ ...prev, [kpiId]: false })), 2000);
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
    } finally {
      setSaving(prev => ({ ...prev, [kpiId]: false }));
    }
  };

  const getDistributionPreview = (kpiId: string) => {
    const targetValue = parseFloat(targets[kpiId]);
    if (isNaN(targetValue) || targetValue <= 0) return null;

    const kpi = kpis.find(k => k.id === kpiId);
    const currentYear = new Date().getFullYear();
    const distribution = distributeMonthlyTarget(targetValue, month, currentYear, kpi?.unit);
    const weeks = getWeeksForMonth(month, currentYear);
    const totalDays = getTotalDaysInMonth(month, currentYear);

    return { distribution, weeks, totalDays };
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
        Defina metas mensais — serão distribuídas proporcionalmente pelas semanas.
      </p>

      {/* Tabela compacta */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-600">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              <th className="text-left px-3 py-2">KPI</th>
              <th className="text-left px-3 py-2 w-32">Tipo</th>
              <th className="text-center px-3 py-2 w-40">Meta Mensal</th>
              <th className="text-center px-3 py-2 w-28">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
            {kpis.map(kpi => {
              const isSaving = saving[kpi.id];
              const isSuccess = success[kpi.id];
              const hasValue = !!targets[kpi.id];
              const isExpanded = expandedKpi === kpi.id;
              const preview = isExpanded ? getDistributionPreview(kpi.id) : null;

              return (
                <React.Fragment key={kpi.id}>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {/* Nome do KPI */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {hasValue && (
                          <button
                            onClick={() => setExpandedKpi(isExpanded ? null : kpi.id)}
                            className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                            aria-label="Ver distribuição"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                          </button>
                        )}
                        <span className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                          {kpi.name}
                        </span>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        kpi.isInverse 
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {kpi.isInverse ? 'TETO' : 'PISO'}
                      </span>
                    </td>

                    {/* Input Meta Mensal */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {kpi.format && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            {kpi.format}
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          className="w-full text-center px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                          value={targets[kpi.id] || ''}
                          onChange={(e) => handleTargetChange(kpi.id, e.target.value)}
                        />
                      </div>
                    </td>

                    {/* Botão Salvar */}
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleSave(kpi.id)}
                        disabled={isSaving || !hasValue}
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSuccess 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95'
                        }`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isSuccess ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        {isSuccess ? 'OK' : 'Salvar'}
                      </button>
                    </td>
                  </tr>

                  {/* Preview da distribuição expandida */}
                  {isExpanded && preview && (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 bg-zinc-50 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                            Distribuição ({preview.totalDays} dias)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {preview.weeks.map(week => {
                            const weekName = week.replace(/\(.*\)/, '').trim();
                            const days = week.match(/\((\d+-\d+)\)/)?.[1] || '';
                            return (
                              <div
                                key={week}
                                className="flex-1 min-w-[100px] text-xs bg-white dark:bg-zinc-900 px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700"
                              >
                                <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                                  {weekName} <span className="opacity-60">({days})</span>
                                </div>
                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                  {kpi.format}{preview.distribution[week].toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
