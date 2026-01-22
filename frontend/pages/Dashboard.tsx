import React, { useMemo, useState } from 'react';
import { dataService } from '../services/dataService';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';
import { AlertCircle, CheckCircle2, Clock, PauseCircle, TrendingUp, TrendingDown, DollarSign, Target, Hourglass, BrainCircuit, Filter, X, Calendar } from 'lucide-react';
import { MONTHS, WEEKS } from '../types';
import { Button } from '../components/Button';

export const Dashboard: React.FC = () => {
  // State for Filters
  const [filterMonth, setFilterMonth] = useState<string>('Todos');
  const [filterWeek, setFilterWeek] = useState<string>('Todas');

  const entries = dataService.getEntries();
  const sectors = dataService.getSectors();

  // --- Filter Logic ---
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchMonth = filterMonth === 'Todos' || e.month === filterMonth;
      const matchWeek = filterWeek === 'Todas' || e.week === filterWeek;
      return matchMonth && matchWeek;
    });
  }, [entries, filterMonth, filterWeek]);

  const filteredActionPlans = useMemo(() => {
    return filteredEntries.filter(e => e.actionPlan && e.actionPlan.what && e.actionPlan.what.length > 0);
  }, [filteredEntries]);

  const clearFilters = () => {
    setFilterMonth('Todos');
    setFilterWeek('Todas');
  };

  const hasActiveFilters = filterMonth !== 'Todos' || filterWeek !== 'Todas';

  // --- 1. KPI Health Index Logic (Uses Filtered Data) ---
  const healthData = useMemo(() => {
    let onTrack = 0; // >= 100% (ou gap positivo)
    let warning = 0; // 90-99%
    let critical = 0; // < 90%

    filteredEntries.forEach(e => {
      const isChurn = e.kpiId === 'revenue_churn';
      
      if (isChurn) {
         if (e.gap <= 0) onTrack++; 
         else critical++;
      } else {
         if (e.gapPercentage >= 100) onTrack++;
         else if (e.gapPercentage >= 90) warning++;
         else critical++;
      }
    });

    return [
      { name: 'Meta Batida', value: onTrack, color: '#10b981' }, // Emerald 500
      { name: 'Atenção', value: warning, color: '#f59e0b' },     // Amber 500
      { name: 'Crítico', value: critical, color: '#ef4444' }     // Red 500
    ];
  }, [filteredEntries]);

  const healthScore = useMemo(() => {
    const total = healthData.reduce((acc, curr) => acc + curr.value, 0);
    if (total === 0) return 0;
    return Math.round((healthData[0].value / total) * 100);
  }, [healthData]);


  // --- 2. Trend Analysis Logic (ALWAYS HISTORICAL - Ignores Filters for Context) ---
  const trendData = useMemo(() => {
    const monthsMap: Record<string, { totalGapPct: number, count: number }> = {};
    
    entries.forEach(e => {
      if (!monthsMap[e.month]) monthsMap[e.month] = { totalGapPct: 0, count: 0 };
      const normalizedPct = Math.min(e.gapPercentage, 120); 
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


  // --- 3. Financial Bridge Logic (Uses Filtered Data) ---
  const bridgeData = useMemo(() => {
    const financialEntries = filteredEntries.filter(e => {
        const sector = sectors.find(s => s.id === e.sectorId);
        const kpi = sector?.kpis.find(k => k.id === e.kpiId);
        return kpi?.unit === 'currency';
    });

    const totalTarget = financialEntries.reduce((acc, e) => acc + e.target, 0);
    const totalRealized = financialEntries.reduce((acc, e) => acc + e.realized, 0);
    
    const gapsBySector: Record<string, number> = {};
    financialEntries.forEach(e => {
       if (!gapsBySector[e.sectorId]) gapsBySector[e.sectorId] = 0;
       gapsBySector[e.sectorId] += (e.realized - e.target);
    });

    const data = [];
    
    // Start Bar
    data.push({
      name: 'Meta',
      uv: [0, totalTarget],
      value: totalTarget,
      fill: '#52525b', // Zinc 600 (Neutral Grey) was Slate
      isTotal: true
    });

    let currentLevel = totalTarget;

    // Intermediate Bars
    Object.keys(gapsBySector).forEach(sectorId => {
      const gap = gapsBySector[sectorId];
      const sectorName = sectors.find(s => s.id === sectorId)?.name.split('-')[0].trim() || sectorId;
      const start = currentLevel;
      const end = currentLevel + gap;
      
      data.push({
        name: sectorName,
        uv: [Math.min(start, end), Math.max(start, end)],
        value: gap,
        fill: gap >= 0 ? '#10b981' : '#ef4444',
        isTotal: false
      });

      currentLevel = end;
    });

    // End Bar
    data.push({
      name: 'Real.',
      uv: [0, totalRealized],
      value: totalRealized,
      fill: totalRealized >= totalTarget ? '#f59e0b' : '#3f3f46', // Amber if good, Zinc 700 if bad
      isTotal: true
    });

    return { data, totalTarget, totalRealized };
  }, [filteredEntries, sectors]);


  // --- 4. Tactical Stats (Uses Filtered Plans) ---
  const planStats = useMemo(() => {
    let completed = filteredActionPlans.filter(p => p.actionPlanStatus === 'feito').length;
    let inProgress = filteredActionPlans.filter(p => p.actionPlanStatus === 'fazendo').length;
    let toDo = filteredActionPlans.filter(p => p.actionPlanStatus === 'a_fazer').length;
    let standBy = filteredActionPlans.filter(p => p.actionPlanStatus === 'stand_by').length;
    return { completed, inProgress, toDo, standBy };
  }, [filteredActionPlans]);


  // --- 5. Aging of Action Plans Logic (Uses Filtered Plans) ---
  const agingData = useMemo(() => {
    const today = new Date();
    const data = [
      { name: 'A Fazer', healthy: 0, warning: 0, critical: 0 },
      { name: 'Fazendo', healthy: 0, warning: 0, critical: 0 },
    ];

    filteredActionPlans.forEach(plan => {
      if (plan.actionPlanStatus !== 'a_fazer' && plan.actionPlanStatus !== 'fazendo') return;

      const updatedDate = new Date(plan.lastUpdated);
      const diffTime = Math.abs(today.getTime() - updatedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const category = diffDays < 7 ? 'healthy' : diffDays <= 15 ? 'warning' : 'critical';
      const rowIndex = plan.actionPlanStatus === 'a_fazer' ? 0 : 1;

      data[rowIndex][category]++;
    });

    return data;
  }, [filteredActionPlans]);

  // --- 6. Root Cause Cloud (Uses Filtered Entries) ---
  const rootCauseData = useMemo(() => {
    const stopwords = ['de', 'a', 'o', 'as', 'os', 'em', 'para', 'com', 'por', 'um', 'uma', 'e', 'do', 'da', 'que', 'não', 'na', 'no', 'ao', 'se'];
    const wordCounts: Record<string, number> = {};

    filteredEntries.forEach(entry => {
      if (entry.causes && entry.causes.length > 0) {
        entry.causes.forEach(cause => {
          // Simple tokenization
          const words = cause.toLowerCase()
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
            .split(/\s+/);
          
          words.forEach(word => {
            if (word.length > 3 && !stopwords.includes(word)) {
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
          });
        });
      }
    });

    return Object.entries(wordCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

  }, [filteredEntries]);


  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard do CEO</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Visão macro estratégica e saúde da organização.</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-800 shadow-sm p-1 gap-1 items-center overflow-x-auto max-w-full">
             <div className="px-3 py-1.5 text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Período</span>
             </div>

             {/* Month Filter */}
             <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-32 md:w-36 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md focus:bg-zinc-50 dark:focus:bg-zinc-800"
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
                className="bg-transparent border-none text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8 w-32 md:w-36 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md focus:bg-zinc-50 dark:focus:bg-zinc-800"
                style={{ backgroundImage: 'none' }}
             >
                <option value="Todas">Todas as Semanas</option>
                {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
             </select>

             {/* Clear Filters Button */}
             {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="ml-1 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 rounded-md transition-colors"
                  title="Limpar filtros"
                >
                   <X className="w-4 h-4" />
                </button>
             )}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Sem dados para este período</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">Não encontramos KPIs registrados para os filtros selecionados.</p>
            <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
          </div>
      ) : (
        <>
          {/* SECTION 1: MACRO HEALTH & TREND */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI Health Index */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-colors">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-2">Índice de Saúde (KPIs)</h3>
              <p className="text-xs text-zinc-400 mb-4">Proporção de metas atingidas vs. risco no período.</p>
              
              <div className="h-64 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {healthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#f4f4f5' }}
                        itemStyle={{ color: '#f4f4f5' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Label */}
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center -mt-4">
                    <span className="block text-3xl font-bold text-zinc-800 dark:text-white">{healthScore}%</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">Saudável</span>
                 </div>
              </div>
            </div>

            {/* Historical Trend */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm lg:col-span-2 transition-colors">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                     Tendência de Performance
                     <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-normal">Sempre Histórico (Global)</span>
                   </h3>
                   <p className="text-xs text-zinc-400">Evolução da média de atingimento de metas (últimos 6 meses).</p>
                 </div>
                 {trendData.length > 1 && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${trendData[trendData.length-1].performance >= trendData[trendData.length-2].performance ? 'text-emerald-600' : 'text-red-600'}`}>
                       {trendData[trendData.length-1].performance >= trendData[trendData.length-2].performance ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                       {Math.abs(trendData[trendData.length-1].performance - trendData[trendData.length-2].performance)}% MoM
                    </div>
                 )}
               </div>
               
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa'}} unit="%" domain={[0, 150]} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#fff' }}
                        formatter={(value: number) => [`${value}%`, 'Atingimento']}
                     />
                     <ReferenceLine y={100} stroke="#52525b" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta', fill: '#52525b', fontSize: 10 }} />
                     <Line type="monotone" dataKey="performance" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* SECTION 2: FINANCIAL BRIDGE (WATERFALL) */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
               <div>
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                     <DollarSign className="w-5 h-5 text-zinc-500" />
                     Ponte de Resultado Financeiro
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Impacto no resultado financeiro no período selecionado.</p>
               </div>
               <div className="flex gap-4 mt-4 md:mt-0">
                  <div className="text-right">
                     <span className="block text-xs text-zinc-400 uppercase font-bold">Meta Total</span>
                     <span className="text-lg font-bold text-zinc-700 dark:text-zinc-300">R$ {(bridgeData.totalTarget/1000).toFixed(1)}k</span>
                  </div>
                  <div className="w-px bg-zinc-200 dark:bg-zinc-800"></div>
                  <div className="text-right">
                     <span className="block text-xs text-zinc-400 uppercase font-bold">Realizado</span>
                     <span className={`text-lg font-bold ${bridgeData.totalRealized >= bridgeData.totalTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                        R$ {(bridgeData.totalRealized/1000).toFixed(1)}k
                     </span>
                  </div>
               </div>
            </div>

            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={bridgeData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
                   <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} tick={{fill: '#a1a1aa'}} />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const isGain = data.value >= 0;
                          return (
                            <div className="bg-white dark:bg-zinc-800 p-3 border border-zinc-100 dark:border-zinc-700 shadow-lg rounded-lg">
                              <p className="font-bold text-zinc-800 dark:text-white">{data.name}</p>
                              <p className={`text-sm ${data.isTotal ? 'text-zinc-600 dark:text-zinc-400' : (isGain ? 'text-emerald-600' : 'text-red-600')}`}>
                                 {data.isTotal ? 'Total: ' : (isGain ? '+ ' : '')} 
                                 R$ {Math.abs(data.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                   />
                   <Bar dataKey="uv" radius={[4, 4, 4, 4]}>
                     {bridgeData.data.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* SECTION 3: TACTICAL EXECUTION STATS */}
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
               <Target className="w-5 h-5 text-zinc-500" />
               Execução Tática (Planos originados no período)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between border-b-4 border-b-emerald-500 transition-colors">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Concluídos</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-400">{planStats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 />
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between border-b-4 border-b-amber-500 transition-colors">
                <div>
                  <p className="text-sm font-medium text-amber-600">Em Execução</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-400">{planStats.inProgress}</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600">
                  <Clock />
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between border-b-4 border-b-zinc-900 dark:border-b-zinc-400 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">A Fazer</p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{planStats.toDo}</p>
                </div>
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-900 dark:text-white">
                  <AlertCircle />
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between border-b-4 border-b-zinc-400 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Stand By</p>
                  <p className="text-3xl font-bold text-zinc-600 dark:text-zinc-300">{planStats.standBy}</p>
                </div>
                <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
                  <PauseCircle />
                </div>
              </div>
            </div>

            {/* SECTION 4: INTELLIGENCE & AGING */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Action Plan Aging Chart */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                       <Hourglass className="w-5 h-5 text-zinc-500" />
                       Envelhecimento dos Planos (Aging)
                     </h3>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400">Tempo sem atualização nos status abertos.</p>
                   </div>
                 </div>
                 
                 <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={agingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontWeight: 600}} width={80} />
                       <Tooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                       />
                       <Legend />
                       <Bar dataKey="healthy" name="< 7 dias (Saudável)" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                       <Bar dataKey="warning" name="7-15 dias (Atenção)" stackId="a" fill="#f59e0b" />
                       <Bar dataKey="critical" name="> 15 dias (Crítico)" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
                 {agingData.every(d => d.healthy === 0 && d.warning === 0 && d.critical === 0) && (
                    <div className="text-center text-xs text-zinc-400 mt-2 italic">
                       Nenhum plano pendente encontrado neste período.
                    </div>
                 )}
              </div>

              {/* Root Cause Cloud (Top 5) */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                       <BrainCircuit className="w-5 h-5 text-zinc-500" />
                       Causas Raiz Mais Frequentes
                     </h3>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400">Identificação de problemas sistêmicos no período (Top 5 termos).</p>
                   </div>
                 </div>

                 {rootCauseData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rootCauseData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 13}} width={100} />
                          <Tooltip 
                              cursor={{fill: '#18181b'}}
                              contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                              formatter={(value: number) => [value, 'Ocorrências']}
                          />
                          <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20}>
                            {rootCauseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#b45309' : '#f59e0b'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 ) : (
                    <div className="h-64 flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
                       Dados insuficientes para análise de causa.
                    </div>
                 )}
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};