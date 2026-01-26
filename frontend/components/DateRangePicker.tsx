import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(startDate || new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
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

  // Gerar dias do mês
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; isDisabled: boolean }> = [];
    
    // Dias do mês anterior
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: (minDate && date < minDate) || (maxDate && date > maxDate)
      });
    }
    
    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: (minDate && date < minDate) || (maxDate && date > maxDate)
      });
    }
    
    // Dias do próximo mês para completar a grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: (minDate && date < minDate) || (maxDate && date > maxDate)
      });
    }
    
    return days;
  }, [viewDate, minDate, maxDate]);

  // Verificar se uma data está no range
  const isInRange = (date: Date) => {
    if (!startDate) return false;
    const end = selectingEnd && hoverDate ? hoverDate : endDate;
    if (!end) return false;
    
    const start = startDate <= end ? startDate : end;
    const finish = startDate <= end ? end : startDate;
    
    return date >= start && date <= finish;
  };

  const isStartDate = (date: Date) => startDate && isSameDay(date, startDate);
  const isEndDate = (date: Date) => endDate && isSameDay(date, endDate);

  const isSameDay = (a: Date, b: Date) => {
    return a.getDate() === b.getDate() && 
           a.getMonth() === b.getMonth() && 
           a.getFullYear() === b.getFullYear();
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const handleDayClick = (date: Date, isDisabled: boolean) => {
    if (isDisabled) return;
    
    if (!selectingEnd) {
      // Selecionando início
      onChange(date, null);
      setSelectingEnd(true);
    } else {
      // Selecionando fim
      if (date < startDate!) {
        onChange(date, startDate);
      } else {
        onChange(startDate, date);
      }
      setSelectingEnd(false);
      setIsOpen(false);
    }
  };

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const formatDisplayDate = () => {
    if (!startDate && !endDate) return 'Selecionar período';
    
    const formatDate = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
    
    if (startDate && endDate) {
      if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        return `${startDate.getDate()}-${endDate.getDate()} ${MONTHS_SHORT[startDate.getMonth()]}`;
      }
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    
    if (startDate) return `${formatDate(startDate)} - ...`;
    return 'Selecionar período';
  };

  // Quick select presets
  const presets = [
    { label: 'Esta semana', getValue: () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return { start, end: today };
    }},
    { label: 'Últimos 7 dias', getValue: () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end: today };
    }},
    { label: 'Últimos 14 dias', getValue: () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 13);
      return { start, end: today };
    }},
    { label: 'Últimos 30 dias', getValue: () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { start, end: today };
    }},
    { label: 'Este mês', getValue: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: today };
    }},
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    const { start, end } = preset.getValue();
    onChange(start, end);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onChange(null, null);
    setSelectingEnd(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
      >
        <Calendar className="w-4 h-4 text-amber-500" />
        <span>{formatDisplayDate()}</span>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            className="ml-1 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
          >
            <X className="w-3 h-3 text-zinc-400" />
          </button>
        )}
      </button>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-4 min-w-[340px]">
          <div className="flex gap-4">
            {/* Presets */}
            <div className="border-r border-zinc-200 dark:border-zinc-700 pr-4">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Atalhos
              </div>
              <div className="space-y-1">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(preset)}
                    className="block w-full text-left px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 rounded transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPrevMonth}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {MONTHS_PT[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-semibold text-zinc-400 uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ date, isCurrentMonth, isDisabled }, i) => {
                  const inRange = isInRange(date);
                  const isStart = isStartDate(date);
                  const isEnd = isEndDate(date);
                  const today = isToday(date);

                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(date, isDisabled)}
                      onMouseEnter={() => selectingEnd && setHoverDate(date)}
                      onMouseLeave={() => setHoverDate(null)}
                      disabled={isDisabled}
                      className={`
                        relative w-8 h-8 text-xs font-medium rounded-lg transition-all
                        ${isDisabled ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'hover:bg-amber-100 dark:hover:bg-amber-900/30'}
                        ${!isCurrentMonth && !isDisabled ? 'text-zinc-400 dark:text-zinc-600' : ''}
                        ${isCurrentMonth && !isDisabled && !inRange ? 'text-zinc-700 dark:text-zinc-300' : ''}
                        ${inRange && !isStart && !isEnd ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : ''}
                        ${isStart || isEnd ? 'bg-amber-500 text-white font-bold' : ''}
                        ${today && !isStart && !isEnd ? 'ring-2 ring-amber-400 ring-inset' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Selection hint */}
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 text-center">
                  {selectingEnd 
                    ? '📅 Clique na data final' 
                    : startDate && endDate 
                      ? '✓ Período selecionado' 
                      : '📅 Clique na data inicial'
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
