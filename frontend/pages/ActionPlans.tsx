import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../src/services/dataService';
import { SECTORS } from '../constants';
import { PlanStatus, KpiEntry, FiveWTwoH, MONTHS, WEEKS, User, Sector } from '../types';
import { Edit, Trash2, X, Save, Calendar, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, PauseCircle, LayoutList, KanbanSquare, ArrowRight, Filter, GripVertical, Download, User as UserIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { FiveWTwoHInput } from '../components/FiveWTwoH';
import { PageHeader, EmptyState, FilterBar, ViewSwitcher, Modal, Badge } from '../components/ui';
import { ds } from '../styles/design-tokens';
import { getWeeksForMonth, isSameWeek, getCurrentMonth, getCurrentWeek } from '../utils/weekCalculator';
import { formatDateToBR } from '../utils/dateFormatter';
import { useAuth } from '../contexts/AuthContext';

export const ActionPlansPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [plans, setPlans] = useState<KpiEntry[]>([]);
  const [editingPlan, setEditingPlan] = useState<KpiEntry | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialFiltersSet, setInitialFiltersSet] = useState(false);

  // Drag and Drop States
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PlanStatus | null>(null);

  // Filters - Inicializar com mês e semana atuais
  const currentMonth = getCurrentMonth();
  const [filterMonth, setFilterMonth] = useState<string>(currentMonth);
  const [filterWeek, setFilterWeek] = useState<string>('Todas');
  // Filtro de líder: admins veem todos, líderes veem só seus planos
  const [filterLeader, setFilterLeader] = useState<string>('Todos');

  // Definir filtros iniciais quando usuário estiver disponível
  useEffect(() => {
    if (user && !initialFiltersSet) {
      // Definir semana atual
      const currentWeek = getCurrentWeek(currentMonth);
      if (currentWeek) {
        setFilterWeek(currentWeek);
      }
      
      // Líder: pré-selecionar seu próprio nome
      // Admin: manter "Todos" para ver todos os planos
      if (user.role === 'leader' && user.name) {
        setFilterLeader(user.name);
      }
      
      setInitialFiltersSet(true);
    }
  }, [user, initialFiltersSet, currentMonth]);

  // Calcular semanas disponíveis baseado no mês selecionado
  const availableWeeks = useMemo(() => {
    if (filterMonth === 'Todos') {
      return WEEKS; // Retornar todas as semanas padrão
    }
    const currentYear = new Date().getFullYear();
    return getWeeksForMonth(filterMonth, currentYear);
  }, [filterMonth]);

  // Atualizar semana quando o mês mudar
  useEffect(() => {
    if (filterMonth !== 'Todos' && availableWeeks.length > 0) {
      // Se a semana atual não está nas semanas disponíveis, resetar para "Todas"
      if (filterWeek !== 'Todas' && !availableWeeks.includes(filterWeek)) {
        setFilterWeek('Todas');
      }
    }
  }, [filterMonth, availableWeeks, filterWeek]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, usersData, sectorsData] = await Promise.all([
        dataService.getAllActionPlans(),
        dataService.getUsers(),
        dataService.getSectors()
      ]);
      
      // Se for líder, filtrar apenas planos do seu setor
      const filteredPlans = user?.role === 'leader' && user?.sectorId
        ? plansData.filter(plan => plan.sectorId === user.sectorId)
        : plansData;
      
      setPlans(filteredPlans);
      setAvailableUsers(usersData);
      setSectors(sectorsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // State to toggle visibility of months/weeks for List View
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const statusConfig: Record<PlanStatus, { label: string, color: string, border: string, bg: string, darkBg: string, icon: any }> = {
    'a_fazer': { label: 'A Fazer', color: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-400 dark:border-zinc-600', bg: 'bg-zinc-100', darkBg: 'dark:bg-zinc-800', icon: AlertCircle },
    'fazendo': { label: 'Fazendo', color: 'text-black dark:text-amber-500', border: 'border-amber-400', bg: 'bg-amber-400', darkBg: 'dark:bg-amber-900/30', icon: Clock },
    'feito': { label: 'Feito', color: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20', icon: CheckCircle2 },
    'stand_by': { label: 'Stand By', color: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-300 dark:border-zinc-600', bg: 'bg-white', darkBg: 'dark:bg-zinc-800/50', icon: PauseCircle },
  };

  const refreshPlans = async () => {
    await loadData();
  };

  const handleStatusChange = async (entry: KpiEntry, newStatus: PlanStatus) => {
    const updatedEntry = { ...entry, actionPlanStatus: newStatus };
    try {
      await dataService.saveEntry(updatedEntry);
      await refreshPlans();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano de ação? O KPI original será mantido, mas o plano será removido.')) {
      try {
        await dataService.removeActionPlan(id);
        await refreshPlans();
      } catch (error) {
        console.error('Erro ao deletar plano:', error);
      }
    }
  };

  const handleEdit = (entry: KpiEntry) => {
    setEditingPlan({ ...entry });
  };

  const handleSaveEdit = async () => {
    if (editingPlan) {
      try {
        await dataService.saveEntry(editingPlan);
        setEditingPlan(null);
        await refreshPlans();
      } catch (error) {
        console.error('Erro ao salvar edição:', error);
      }
    }
  };

  const updateEditForm = (field: keyof FiveWTwoH, value: string) => {
    if (editingPlan && editingPlan.actionPlan) {
      setEditingPlan({
        ...editingPlan,
        actionPlan: {
          ...editingPlan.actionPlan,
          [field]: value
        }
      });
    }
  };

  const clearFilters = () => {
    setFilterMonth('Todos');
    setFilterWeek('Todas');
    setFilterLeader('Todos');
  };

  const hasActiveFilters = filterMonth !== 'Todos' || filterWeek !== 'Todas' || filterLeader !== 'Todos';

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPlanId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: PlanStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDrop = (e: React.DragEvent, status: PlanStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedPlanId) {
      const plan = plans.find(p => p.id === draggedPlanId);
      if (plan && plan.actionPlanStatus !== status) {
        handleStatusChange(plan, status);
      }
      setDraggedPlanId(null);
    }
  };

  // --- Filter Logic ---
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchMonth = filterMonth === 'Todos' || plan.month === filterMonth;
      const matchWeek = filterWeek === 'Todas' || isSameWeek(plan.week, filterWeek);
      const matchLeader = filterLeader === 'Todos' || plan.actionPlan?.who === filterLeader;
      return matchMonth && matchWeek && matchLeader;
    });
  }, [plans, filterMonth, filterWeek, filterLeader]);

  // --- Export Logic ---
  const handleExport = () => {
    const headers = ['Mês', 'Semana', 'Setor', 'KPI', 'Status', 'O Que (What)', 'Por Que (Why)', 'Quem (Who)', 'Onde (Where)', 'Quando (When)', 'Como (How)', 'Quanto (How Much)'];

    const csvContent = filteredPlans.map(plan => {
      const sector = sectors.find(s => s.id === plan.sectorId);
      const kpiName = sector?.kpis.find(k => k.id === plan.kpiId)?.name || 'N/A';

      return [
        `"${plan.month}"`,
        `"${plan.week}"`,
        `"${sector?.name || ''}"`,
        `"${kpiName}"`,
        `"${statusConfig[plan.actionPlanStatus || 'a_fazer'].label}"`,
        `"${plan.actionPlan?.what?.replace(/"/g, '""') || ''}"`,
        `"${plan.actionPlan?.why?.replace(/"/g, '""') || ''}"`,
        `"${plan.actionPlan?.who?.replace(/"/g, '""') || ''}"`,
        `"${plan.actionPlan?.where?.replace(/"/g, '""') || ''}"`,
        `"${plan.actionPlan?.when?.replace(/"/g, '""') || ''}"`,
        `"${plan.actionPlan?.how?.replace(/"/g, '""') || ''}"`,
        `"${plan.actionPlan?.howMuch?.replace(/"/g, '""') || ''}"`
      ].join(',');
    });

    const csvString = '\uFEFF' + [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `planos_acao_vorp_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // --- List View Grouping Logic (uses filteredPlans) ---
  const groupedPlans = useMemo(() => {
    const groups: Record<string, Record<string, KpiEntry[]>> = {};

    filteredPlans.forEach(plan => {
      if (!groups[plan.month]) groups[plan.month] = {};
      if (!groups[plan.month][plan.week]) groups[plan.month][plan.week] = [];
      groups[plan.month][plan.week].push(plan);
    });

    const sortedMonths = Object.keys(groups).sort((a, b) => {
      return MONTHS.indexOf(b) - MONTHS.indexOf(a);
    });

    return sortedMonths.map(month => {
      const weeksInMonth = groups[month];
      const sortedWeeks = Object.keys(weeksInMonth).sort((a, b) => {
        return WEEKS.indexOf(a) - WEEKS.indexOf(b);
      });

      return {
        month,
        weeks: sortedWeeks.map(week => ({
          week,
          items: weeksInMonth[week]
        }))
      };
    });
  }, [filteredPlans]);

  // --- Kanban Grouping Logic (uses filteredPlans) ---
  const kanbanColumns = useMemo(() => {
    const columns: Record<PlanStatus, KpiEntry[]> = {
      'a_fazer': [],
      'fazendo': [],
      'feito': [],
      'stand_by': []
    };

    filteredPlans.forEach(plan => {
      const status = plan.actionPlanStatus || 'a_fazer';
      if (columns[status]) {
        columns[status].push(plan);
      }
    });

    return columns;
  }, [filteredPlans]);

  const getStatusSummary = (items: KpiEntry[]) => {
    const counts = { done: 0, doing: 0, todo: 0 };
    items.forEach(i => {
      if (i.actionPlanStatus === 'feito') counts.done++;
      else if (i.actionPlanStatus === 'fazendo') counts.doing++;
      else counts.todo++;
    });
    return counts;
  };

  // Usar função utilitária de formatação de data
  const formatDate = formatDateToBR;

  return (
    <div className="space-y-6 animate-fade-in relative pb-20 h-full flex flex-col">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <PageHeader
          title="Gestão de Planos de Ação"
          subtitle="Acompanhamento tático e resolução de problemas."
        />

        <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto items-start lg:items-center">

          {/* Enhanced Filter Bar */}
          <FilterBar
            icon={<Filter className="w-4 h-4" />}
            filters={[
              {
                id: 'leader',
                value: filterLeader,
                options: [{ value: 'Todos', label: 'Todos os Líderes' }, ...availableUsers.map(u => ({ value: u.name, label: u.name.split(' ')[0] }))],
                onChange: setFilterLeader
              },
              {
                id: 'month',
                value: filterMonth,
                options: [{ value: 'Todos', label: 'Todos os Meses' }, ...MONTHS.map(m => ({ value: m, label: m }))],
                onChange: setFilterMonth
              },
              {
                id: 'week',
                value: filterWeek,
                options: [{ value: 'Todas', label: 'Todas as Semanas' }, ...availableWeeks.map(w => ({ value: w, label: w }))],
                onChange: setFilterWeek
              }
            ]}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />

          <div className="hidden lg:block w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

          {/* Actions */}
          <div className="flex gap-2 w-full lg:w-auto justify-end">
            <Button variant="outline" onClick={handleExport} title="Exportar para Excel/CSV" size="sm">
              <Download className="w-4 h-4" />
            </Button>

            {/* View Switcher */}
            <ViewSwitcher
              views={[
                { id: 'list' as const, label: 'Lista', icon: <LayoutList className="w-4 h-4" /> },
                { id: 'kanban' as const, label: 'Kanban', icon: <KanbanSquare className="w-4 h-4" /> }
              ]}
              activeView={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-8 h-8 text-zinc-400" />}
          title="Nenhum plano encontrado"
          description="Tente ajustar os filtros para encontrar o que procura."
          action={hasActiveFilters && <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>}
        />
      ) : (
        <>
          {/* --- KANBAN VIEW --- */}
          {viewMode === 'kanban' && (
            <div className="flex-1 overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-[1000px] h-full">
                {(Object.keys(statusConfig) as PlanStatus[]).map((status) => {
                  const config = statusConfig[status];
                  const items = kanbanColumns[status];
                  const StatusIcon = config.icon;
                  const isDragOver = dragOverColumn === status;

                  return (
                    <div
                      key={status}
                      className={`
                          flex-1 rounded-xl flex flex-col h-fit max-h-full transition-all duration-200
                          ${config.bg} ${config.darkBg} border 
                          ${isDragOver ? 'border-amber-500 ring-2 ring-amber-200 scale-[1.01]' : `${config.border} border-opacity-50`}
                        `}
                      onDragOver={(e) => handleDragOver(e, status)}
                      onDrop={(e) => handleDrop(e, status)}
                    >
                      {/* Column Header */}
                      <div className="p-4 flex items-center justify-between border-b border-black/10 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-5 h-5 ${config.color}`} />
                          <h3 className={`font-bold ${config.color}`}>{config.label}</h3>
                        </div>
                        <span className={`bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-full text-xs font-bold ${config.color}`}>
                          {items.length}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <div className="p-3 space-y-3 min-h-[150px]">
                        {items.map(entry => {
                          const sector = sectors.find(s => s.id === entry.sectorId);
                          const isDragging = draggedPlanId === entry.id;

                          return (
                            <div
                              key={entry.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, entry.id)}
                              className={`
                                    bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 group relative
                                    cursor-move select-none transition-all duration-200
                                    ${isDragging ? 'opacity-50 scale-95 shadow-none' : 'hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600'}
                                  `}
                            >
                              {/* Grip Handle for affordance */}
                              <div className="absolute top-1/2 left-1.5 -translate-y-1/2 opacity-0 group-hover:opacity-30 text-zinc-400">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {/* Top Meta */}
                              <div className="flex justify-between items-start mb-2 pl-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate max-w-[120px]">
                                  {sector?.name.replace('Comercial - ', '') || 'Setor Removido'}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-white dark:bg-zinc-900 pl-2">
                                  <button onClick={() => handleEdit(entry)} className="p-1 text-zinc-400 hover:text-amber-600">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(entry.id)} className="p-1 text-zinc-400 hover:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Content */}
                              <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm mb-3 line-clamp-3 pl-2" title={entry.actionPlan?.what}>
                                {entry.actionPlan?.what}
                              </p>

                              {/* Bottom Meta */}
                              <div className="flex items-center justify-between mt-auto pl-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300" title={entry.actionPlan?.who}>
                                    {entry.actionPlan?.who.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400" title="Prazo">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(entry.actionPlan?.when)}
                                  </div>
                                </div>
                              </div>

                              {/* Quick Status Change Footer */}
                              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700 flex justify-between items-center pl-2">
                                <span className="text-[10px] text-zinc-400">Mover para:</span>
                                <div className="flex gap-1">
                                  {(Object.keys(statusConfig) as PlanStatus[]).filter(s => s !== status).map(s => (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(entry, s)}
                                      className={`w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:scale-110 transition-transform ${statusConfig[s].bg} ${statusConfig[s].darkBg}`}
                                      title={`Mover para ${statusConfig[s].label}`}
                                    >
                                      {/* @ts-ignore */}
                                      {React.createElement(statusConfig[s].icon, { className: `w-3 h-3 ${statusConfig[s].color}` })}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- LIST VIEW --- */}
          {viewMode === 'list' && (
            <div className="space-y-8">
              {groupedPlans.map((group) => (
                <div key={group.month} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{group.month}</h2>
                  </div>

                  {group.weeks.map((weekGroup) => {
                    const groupKey = `${group.month}-${weekGroup.week}`;
                    const isExpanded = expandedGroups[groupKey] !== false;
                    const summary = getStatusSummary(weekGroup.items);

                    return (
                      <div key={weekGroup.week} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden transition-all duration-300">
                        <div
                          className="bg-zinc-50 dark:bg-zinc-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          onClick={() => toggleGroup(groupKey)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
                            <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">{weekGroup.week}</h3>
                            <span className="text-zinc-400 text-sm hidden md:inline">• {weekGroup.items.length} Ações</span>
                          </div>

                          <div className="flex gap-2 mt-2 md:mt-0">
                            {summary.done > 0 && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">{summary.done} Feito(s)</span>}
                            {summary.doing > 0 && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">{summary.doing} Fazendo</span>}
                            {summary.todo > 0 && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">{summary.todo} Pendente(s)</span>}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-700">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-700 text-xs uppercase tracking-wider">
                                <tr>
                                  <th className="px-6 py-3 w-44">Status</th>
                                  <th className="px-6 py-3">O que (What)</th>
                                  <th className="px-6 py-3">Quem (Who)</th>
                                  <th className="px-6 py-3">KPI / Setor</th>
                                  <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                {weekGroup.items.map((entry) => {
                                  const sector = sectors.find(s => s.id === entry.sectorId);
                                  const kpiName = sector?.kpis.find(k => k.id === entry.kpiId)?.name;
                                  const status = entry.actionPlanStatus || 'a_fazer';
                                  const config = statusConfig[status];
                                  const StatusIcon = config.icon;

                                  return (
                                    <tr key={entry.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors group">
                                      <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-2">
                                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold border ${config.bg.replace('50', '100')} ${config.darkBg} ${config.color} ${config.border} w-fit`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {config.label}
                                          </div>
                                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(Object.keys(statusConfig) as PlanStatus[]).map(s => (
                                              <button
                                                key={s}
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(entry, s); }}
                                                className={`w-4 h-4 rounded hover:scale-110 transition-transform border ${statusConfig[s].border} ${s === status ? statusConfig[s].bg.replace('50', '200') : 'bg-white dark:bg-zinc-800'}`}
                                                title={statusConfig[s].label}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 align-top">
                                        <p className="font-medium text-zinc-900 dark:text-zinc-200 text-base">{entry.actionPlan?.what}</p>
                                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex gap-2">
                                          {entry.actionPlan?.how && <span><span className="font-semibold">Como:</span> {entry.actionPlan.how}</span>}
                                          {entry.actionPlan?.when && <span>• <span className="font-semibold">Quando:</span> {formatDate(entry.actionPlan.when)}</span>}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                            {entry.actionPlan?.who.substring(0, 2).toUpperCase()}
                                          </div>
                                          <span className="text-zinc-700 dark:text-zinc-300">{entry.actionPlan?.who}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 align-top text-xs">
                                        <div className="font-semibold text-zinc-700 dark:text-zinc-300">{sector?.name.split('-')[0] || 'N/A'}</div>
                                        <div className="text-zinc-500 dark:text-zinc-400">{kpiName || 'N/A'}</div>
                                      </td>
                                      <td className="px-6 py-4 align-top text-right">
                                        <div className="flex justify-end gap-1">
                                          <button onClick={() => handleEdit(entry)} className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                                            <Edit className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleDelete(entry.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Modal Overlay */}
      <Modal
        isOpen={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title="Editar Plano de Ação"
        subtitle={editingPlan ? `${sectors.find(s => s.id === editingPlan.sectorId)?.name} • ${sectors.find(s => s.id === editingPlan.sectorId)?.kpis.find(k => k.id === editingPlan.kpiId)?.name}` : ''}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4" /> Salvar Alterações
            </Button>
          </>
        }
      >
        {editingPlan && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Status Atual</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(statusConfig) as PlanStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setEditingPlan({ ...editingPlan, actionPlanStatus: status })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${editingPlan.actionPlanStatus === status
                      ? `${statusConfig[status].bg.replace('50', '100')} ${statusConfig[status].darkBg} ${statusConfig[status].color} ${statusConfig[status].border} ring-2 ring-offset-1 ring-amber-200 dark:ring-amber-900`
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                      }`}
                  >
                    {/* @ts-ignore */}
                    {React.createElement(statusConfig[status].icon, { className: "w-4 h-4" })}
                    {statusConfig[status].label}
                  </button>
                ))}
              </div>
            </div>

            <FiveWTwoHInput
              data={editingPlan.actionPlan}
              onChange={updateEditForm}
              availableUsers={availableUsers}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};