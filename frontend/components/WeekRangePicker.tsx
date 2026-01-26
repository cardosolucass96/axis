import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { getWeeksForMonth, extractDayRange, getMonthAbbrev } from '../utils/weekCalculator';

interface WeekInfo {
  label: string;           // "JAN Sem1 (1-4)"
  month: string;           // "Janeiro"
  monthAbbr: string;       // "JAN"
  weekNumber: number;      // 1
  startDay: number;        // 1
  endDay: number;          // 4
  year: number;            // 2026
}

interface WeekRangePickerProps {
  startWeek: string | null;
  endWeek: string | null;
  onChange: (startWeek: string | null, endWeek: string | null) => void;
  months: { month: string; year: number }[];
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_ABBR_TO_INDEX: Record<string, number> = {
  'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
  'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Cores para semanas alternadas
const WEEK_COLORS = [
  'bg-amber-100 dark:bg-amber-900/40',
  'bg-blue-100 dark:bg-blue-900/40',
  'bg-emerald-100 dark:bg-emerald-900/40',
  'bg-purple-100 dark:bg-purple-900/40',
  'bg-pink-100 dark:bg-pink-900/40',
  'bg-cyan-100 dark:bg-cyan-900/40',
];

export const WeekRangePicker: React.FC<WeekRangePickerProps> = ({
  startWeek,
  endWeek,
  onChange,
  months
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonthIndex, setViewMonthIndex] = useState(0);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [hoverWeek, setHoverWeek] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mês atual sendo visualizado
  const currentViewMonth = useMemo(() => {
    if (!months.length) return null;
    return months[Math.min(viewMonthIndex, months.length - 1)];
  }, [months, viewMonthIndex]);

  // Gerar semanas para o mês atual
  const weeksInfo = useMemo((): WeekInfo[] => {
    if (!currentViewMonth) return [];
    
    const weekLabels = getWeeksForMonth(currentViewMonth.month, currentViewMonth.year);
    const abbr = getMonthAbbrev(currentViewMonth.month);
    
    return weekLabels.map((label, index) => {
      const range = extractDayRange(label);
      return {
        label,
        month: currentViewMonth.month,
        monthAbbr: abbr,
        weekNumber: index + 1,
        startDay: range?.start || 1,
        endDay: range?.end || 7,
        year: currentViewMonth.year
      };
    });
  }, [currentViewMonth]);

  // Gerar grid do calendário com dias e suas semanas
  const calendarDays = useMemo(() => {
    if (!currentViewMonth) return [];
    
    const year = currentViewMonth.year;
    const monthIndex = MONTHS_PT.indexOf(currentViewMonth.month);
    if (monthIndex === -1) return [];

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<{
      date: Date;
      day: number;
      isCurrentMonth: boolean;
      weekLabel: string | null;
      weekIndex: number;
    }> = [];

    // Dias do mês anterior (padding)
    const prevMonth = new Date(year, monthIndex, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, monthIndex - 1, prevMonth.getDate() - i),
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        weekLabel: null,
        weekIndex: -1
      });
    }

    // Dias do mês atual - associar cada dia à sua semana
    for (let d = 1; d <= totalDays; d++) {
      const weekIdx = weeksInfo.findIndex(w => d >= w.startDay && d <= w.endDay);
      days.push({
        date: new Date(year, monthIndex, d),
        day: d,
        isCurrentMonth: true,
        weekLabel: weekIdx >= 0 ? weeksInfo[weekIdx].label : null,
        weekIndex: weekIdx
      });
    }

    // Dias do próximo mês (padding para completar grid)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, monthIndex + 1, i),
        day: i,
        isCurrentMonth: false,
        weekLabel: null,
        weekIndex: -1
      });
    }

    return days;
  }, [currentViewMonth, weeksInfo]);

  // Comparar semanas por índice global
  const getWeekGlobalIndex = (weekLabel: string): number => {
    const match = weekLabel.match(/^([A-Z]{3})\s+Sem(\d+)/);
    if (!match) return -1;
    const monthIdx = MONTH_ABBR_TO_INDEX[match[1]] ?? 0;
    const weekNum = parseInt(match[2]);
    return monthIdx * 10 + weekNum; // Aproximação simples
  };

  // Verificar se uma semana está no range selecionado
  const isWeekInRange = (weekLabel: string): boolean => {
    if (!startWeek) return false;
    const end = selectingEnd && hoverWeek ? hoverWeek : endWeek;
    if (!end) return weekLabel === startWeek;

    const startIdx = getWeekGlobalIndex(startWeek);
    const endIdx = getWeekGlobalIndex(end);
    const currentIdx = getWeekGlobalIndex(weekLabel);

    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    return currentIdx >= minIdx && currentIdx <= maxIdx;
  };

  const isStartWeek = (weekLabel: string) => startWeek === weekLabel;
  const isEndWeek = (weekLabel: string) => endWeek === weekLabel;

  // Ao clicar em uma semana
  const handleWeekClick = (weekLabel: string) => {
    if (!selectingEnd) {
      // Primeira seleção
      onChange(weekLabel, null);
      setSelectingEnd(true);
    } else {
      // Segunda seleção
      const startIdx = getWeekGlobalIndex(startWeek!);
      const clickedIdx = getWeekGlobalIndex(weekLabel);
      
      if (clickedIdx < startIdx) {
        onChange(weekLabel, startWeek);
      } else {
        onChange(startWeek, weekLabel);
      }
      setSelectingEnd(false);
      setIsOpen(false);
    }
  };

  const goToPrevMonth = () => {
    if (viewMonthIndex > 0) {
      setViewMonthIndex(viewMonthIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonthIndex < months.length - 1) {
      setViewMonthIndex(viewMonthIndex + 1);
    }
  };

  // Formatar texto do display
  const formatDisplayText = (): string => {
    if (!startWeek && !endWeek) return 'Selecionar semanas';
    
    const formatWeek = (w: string) => {
      const match = w.match(/^([A-Z]{3})\s+Sem(\d+)/);
      return match ? `${match[1]} S${match[2]}` : w;
    };
    
    if (startWeek && endWeek) {
      if (startWeek === endWeek) {
        return formatWeek(startWeek);
      }
      return `${formatWeek(startWeek)} → ${formatWeek(endWeek)}`;
    }
    
    if (startWeek) return `${formatWeek(startWeek)} → ...`;
    return 'Selecionar semanas';
  };

  // Presets rápidos
  const presets = useMemo(() => {
    if (!months.length) return [];
    
    const allWeeks: string[] = [];
    months.forEach(m => {
      allWeeks.push(...getWeeksForMonth(m.month, m.year));
    });
    
    const currentMonthWeeks = getWeeksForMonth(months[0].month, months[0].year);
    
    return [
      { 
        label: 'Semana atual', 
        getValue: () => {
          const week = currentMonthWeeks[0] || allWeeks[0];
          return { start: week, end: week };
        }
      },
      { 
        label: 'Últimas 2 semanas', 
        getValue: () => {
          const idx = Math.min(1, currentMonthWeeks.length - 1);
          return { 
            start: currentMonthWeeks[Math.max(0, idx - 1)] || allWeeks[0], 
            end: currentMonthWeeks[idx] || allWeeks[1] || allWeeks[0] 
          };
        }
      },
      { 
        label: 'Mês atual', 
        getValue: () => ({
          start: currentMonthWeeks[0],
          end: currentMonthWeeks[currentMonthWeeks.length - 1]
        })
      },
      { 
        label: 'Últimas 4 semanas', 
        getValue: () => {
          let count = 0;
          let startW = allWeeks[0];
          let endW = allWeeks[0];
          
          for (let i = 0; i < months.length && count < 4; i++) {
            const mWeeks = getWeeksForMonth(months[i].month, months[i].year);
            for (let j = 0; j < mWeeks.length && count < 4; j++) {
              if (count === 0) startW = mWeeks[j];
              endW = mWeeks[j];
              count++;
            }
          }
          return { start: startW, end: endW };
        }
      },
    ];
  }, [months]);

  const applyPreset = (preset: typeof presets[0]) => {
    const { start, end } = preset.getValue();
    onChange(start, end);
    setSelectingEnd(false);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onChange(null, null);
    setSelectingEnd(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selecionar período de semanas"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
      >
        <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="truncate max-w-[150px] sm:max-w-none">{formatDisplayText()}</span>
        {(startWeek || endWeek) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            aria-label="Limpar seleção"
            className="ml-1 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X className="w-3 h-3 text-zinc-400" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="Seletor de semanas"
          className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-3 sm:p-4 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[420px] max-w-[420px] max-h-[80vh] overflow-y-auto"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Presets - horizontal em mobile, vertical em desktop */}
            <div className="flex sm:flex-col gap-1 sm:border-r border-zinc-200 dark:border-zinc-700 pb-3 sm:pb-0 sm:pr-4 border-b sm:border-b-0 overflow-x-auto sm:overflow-visible sm:min-w-[130px]">
              <div className="hidden sm:block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Atalhos
              </div>
              <div className="flex sm:flex-col gap-1 sm:space-y-1">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(preset)}
                    className="flex-shrink-0 whitespace-nowrap sm:whitespace-normal sm:block sm:w-full text-left px-2 py-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 rounded transition-colors border sm:border-0 border-zinc-200 dark:border-zinc-600"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar + Week List */}
            <div className="flex-1">
              {/* Header navegação */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goToPrevMonth}
                  disabled={viewMonthIndex === 0}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {currentViewMonth?.month} {currentViewMonth?.year}
                </span>
                <button
                  onClick={goToNextMonth}
                  disabled={viewMonthIndex >= months.length - 1}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-semibold text-zinc-400 uppercase py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid - mostra semanas visualmente */}
              <div className="grid grid-cols-7 gap-0.5 mb-3">
                {calendarDays.map(({ date, day, isCurrentMonth, weekLabel, weekIndex }, i) => {
                  const inRange = weekLabel && isWeekInRange(weekLabel);
                  const isStart = weekLabel && isStartWeek(weekLabel);
                  const isEnd = weekLabel && isEndWeek(weekLabel);
                  const today = isToday(date);
                  
                  // Cor da semana baseada no índice
                  const weekColor = weekIndex >= 0 ? WEEK_COLORS[weekIndex % WEEK_COLORS.length] : '';

                  return (
                    <button
                      key={i}
                      onClick={() => weekLabel && handleWeekClick(weekLabel)}
                      onMouseEnter={() => selectingEnd && weekLabel && setHoverWeek(weekLabel)}
                      onMouseLeave={() => setHoverWeek(null)}
                      disabled={!isCurrentMonth}
                      className={`
                        relative w-8 h-8 text-xs font-medium transition-all
                        ${!isCurrentMonth ? 'text-zinc-300 dark:text-zinc-700 cursor-default' : 'cursor-pointer'}
                        ${isCurrentMonth && weekColor && !inRange ? weekColor : ''}
                        ${inRange && !isStart && !isEnd ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200' : ''}
                        ${isStart || isEnd ? 'bg-amber-500 text-white font-bold' : ''}
                        ${today ? 'ring-2 ring-amber-400 ring-inset rounded' : ''}
                        ${isCurrentMonth && !inRange ? 'hover:ring-2 hover:ring-amber-300 hover:ring-inset' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Lista de semanas do mês */}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Semanas de {currentViewMonth?.month}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {weeksInfo.map((week, idx) => {
                    const inRange = isWeekInRange(week.label);
                    const isStart = isStartWeek(week.label);
                    const isEnd = isEndWeek(week.label);
                    const weekColor = WEEK_COLORS[idx % WEEK_COLORS.length];

                    return (
                      <button
                        key={week.label}
                        onClick={() => handleWeekClick(week.label)}
                        onMouseEnter={() => selectingEnd && setHoverWeek(week.label)}
                        onMouseLeave={() => setHoverWeek(null)}
                        className={`
                          flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${inRange 
                            ? 'bg-amber-500 text-white' 
                            : `${weekColor} text-zinc-700 dark:text-zinc-300 hover:ring-2 hover:ring-amber-400`
                          }
                        `}
                      >
                        <span className="font-bold">S{week.weekNumber}</span>
                        <span className="text-[10px] opacity-75">
                          {week.startDay}-{week.endDay}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selection hint */}
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 text-center">
                  {selectingEnd 
                    ? '📅 Clique na semana final' 
                    : startWeek && endWeek 
                      ? '✓ Período selecionado' 
                      : '📅 Clique na semana inicial'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
