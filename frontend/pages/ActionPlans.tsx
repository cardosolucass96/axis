import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { SECTORS } from '../constants';
import { PlanStatus, KpiEntry, FiveWTwoH, MONTHS, WEEKS } from '../types';
import { Edit, Trash2, X, Save, Calendar, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, PauseCircle, LayoutList, KanbanSquare, ArrowRight, Filter, GripVertical, Download, User } from 'lucide-react';
import { Button } from '../components/Button';
import { FiveWTwoHInput } from '../components/FiveWTwoH';

export const ActionPlansPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [plans, setPlans] = useState(dataService.getAllActionPlans());
  const [editingPlan, setEditingPlan] = useState<KpiEntry | null>(null);
  
  // Drag and Drop States
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PlanStatus | null>(null);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState<string>('Todos');
  const [filterWeek, setFilterWeek] = useState<string>('Todas');
  const [filterLeader, setFilterLeader] = useState<string>('Todos');

  const availableUsers = dataService.getUsers();
  const sectors = dataService.getSectors();

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

  const refreshPlans = () => {
    setPlans(dataService.getAllActionPlans());
  };

  const handleStatusChange = (entry: KpiEntry, newStatus: PlanStatus) => {
    const updatedEntry = { ...entry, actionPlanStatus: newStatus };
    dataService.saveEntry(updatedEntry);
    refreshPlans();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano de ação? O KPI original será mantido, mas o plano será removido.')) {
      dataService.removeActionPlan(id);
      refreshPlans();
    }
  };

  const handleEdit = (entry: KpiEntry) => {
    setEditingPlan({ ...entry });
  };

  const handleSaveEdit = () => {
    if (editingPlan) {
      dataService.saveEntry(editingPlan);
      setEditingPlan(null);
      refreshPlans();
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
      const matchWeek = filterWeek === 'Todas' || plan.week === filterWeek;
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Check if it matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    // Fallback for legacy text
    return dateStr;
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20 h-full flex flex-col">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestão de Planos de Ação</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Acompanhamento tático e resolução de problemas.</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto items-start lg:items-center">
          
          {/* Enhanced Filter Bar */}
          <div className="flex bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-800 shadow-sm p-1 gap-1 items-center overflow-x-auto max-w-full">
             <div className="px-3 py-1.5 text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Filtros</span>
             </div>

             {/* Leader Filter */}
             <select
                value={filterLeader}
                onChange={(e) => setFilterLeader(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-32 md:w-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md"
                style={{ backgroundImage: 'none' }} 
             >
                <option value="Todos">Todos os Líderes</option>
                {availableUsers.map(u => <option key={u.id} value={u.name}>{u.name.split(' ')[0]}</option>)}
             </select>
             
             <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

             {/* Month Filter */}
             <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-32 md:w-36 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md"
                style={{ backgroundImage: 'none' }}
             >
                <option value="Todos">Todos os Meses</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
             </select>

             <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

             {/* Week Filter */}
             <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-32 md:w-36 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md"
                style={{ backgroundImage: 'none' }}
             >
                <option value="Todas">Todas as Semanas</option>
                {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
             </select>

             {/* Clear Filters Button */}
             {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="ml-1 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 rounded-md transition-colors"
                  title="Limpar filtros"
                >
                   <X className="w-4 h-4" />
                </button>
             )}
          </div>

          <div className="hidden lg:block w-px h-8 bg-zinc-300 dark:bg-zinc-700"></div>

          {/* Actions */}
          <div className="flex gap-2 w-full lg:w-auto justify-end">
            <Button variant="outline" onClick={handleExport} title="Exportar para Excel/CSV" className="px-3 bg-white dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-amber-500">
              <Download className="w-4 h-4" />
            </Button>

            {/* View Switcher */}
            <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-600 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                <LayoutList className="w-4 h-4" /> <span className="hidden sm:inline">Lista</span>
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-zinc-600 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                <KanbanSquare className="w-4 h-4" /> <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Filter className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Nenhum plano encontrado</h3>
          <p className="text-zinc-500 dark:text-zinc-400">Tente ajustar os filtros para encontrar o que procura.</p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Limpar Filtros
            </Button>
          )}
        </div>
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
                                    bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 group relative
                                    cursor-move select-none transition-all duration-200
                                    ${isDragging ? 'opacity-50 scale-95 shadow-none' : 'hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700'}
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
                                           {entry.actionPlan?.who.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400" title="Prazo">
                                           <Calendar className="w-3 h-3 mr-1" />
                                           {formatDate(entry.actionPlan?.when)}
                                        </div>
                                     </div>
                                  </div>

                                  {/* Quick Status Change Footer */}
                                  <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800 flex justify-between items-center pl-2">
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
                      <div key={weekGroup.week} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300">
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
                          <div className="overflow-x-auto border-t border-zinc-100 dark:border-zinc-800">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-white dark:bg-zinc-950 text-zinc-500 font-medium border-b border-zinc-100 dark:border-zinc-800 text-xs uppercase tracking-wider">
                                <tr>
                                  <th className="px-6 py-3 w-32">Status</th>
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
                                            {entry.actionPlan?.who.substring(0,2).toUpperCase()}
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
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Editar Plano de Ação</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {sectors.find(s => s.id === editingPlan.sectorId)?.name} • {sectors.find(s => s.id === editingPlan.sectorId)?.kpis.find(k => k.id === editingPlan.kpiId)?.name}
                </p>
              </div>
              <button onClick={() => setEditingPlan(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Status Atual</label>
                <div className="flex gap-2">
                  {(Object.keys(statusConfig) as PlanStatus[]).map((status) => (
                     <button
                        key={status}
                        onClick={() => setEditingPlan({...editingPlan, actionPlanStatus: status})}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${
                          editingPlan.actionPlanStatus === status 
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

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end gap-3 rounded-b-xl sticky bottom-0">
              <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};