/**
 * Utilitário para cálculo dinâmico de semanas baseado no calendário
 * Backend - TypeScript
 * 
 * Regras:
 * - Semana 1: dia 1 até a primeira sexta-feira do mês
 * - Demais semanas: sábado até sexta-feira
 * - Última semana: sábado até o último dia do mês
 * 
 * Formato: "MÊS Sem1 (dia-dia)" ex: "OUT Sem1 (1-4)"
 */

// Mapa de meses em português para número
const monthMap: Record<string, number> = {
  'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
  'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
  'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
};

// Mapa reverso: número para nome do mês
const monthNames: string[] = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Mapa de abreviações de mês
const monthAbbrev: Record<string, string> = {
  'janeiro': 'JAN', 'fevereiro': 'FEV', 'março': 'MAR', 'abril': 'ABR',
  'maio': 'MAI', 'junho': 'JUN', 'julho': 'JUL', 'agosto': 'AGO',
  'setembro': 'SET', 'outubro': 'OUT', 'novembro': 'NOV', 'dezembro': 'DEZ'
};

/**
 * Obtém a abreviação do mês
 */
export function getMonthAbbrev(month: string): string {
  return monthAbbrev[month.toLowerCase()] || month.substring(0, 3).toUpperCase();
}

/**
 * Obtém o nome completo do mês a partir do número (0-11)
 */
export function getMonthName(monthNum: number): string {
  return monthNames[monthNum] || 'Janeiro';
}

/**
 * Obtém lista de meses para os próximos N meses a partir de hoje
 */
export function getNextMonths(count: number = 6): { month: string; year: number }[] {
  const result: { month: string; year: number }[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear()
    });
  }
  
  return result;
}

/**
 * Gera lista de semanas para um mês específico
 * Formato: "MÊS Sem1 (dia-dia)" ex: "OUT Sem1 (1-4)"
 */
export function getWeeksForMonth(month: string, year?: number): string[] {
  const currentYear = year || new Date().getFullYear();
  const monthNum = monthMap[month.toLowerCase()];
  
  if (monthNum === undefined) {
    console.warn(`Mês inválido: ${month}`);
    return [];
  }

  const abbrev = getMonthAbbrev(month);
  const firstDate = new Date(currentYear, monthNum, 1);
  const lastDay = new Date(currentYear, monthNum + 1, 0).getDate();
  const firstDayOfWeek = firstDate.getDay();

  const weeks: string[] = [];
  let weekNumber = 1;
  let currentDay = 1;

  // Semana 1: dia 1 até a primeira sexta-feira
  let daysUntilFriday: number;
  if (firstDayOfWeek === 5) {
    daysUntilFriday = 0;
  } else if (firstDayOfWeek === 6) {
    daysUntilFriday = 6;
  } else {
    daysUntilFriday = (5 - firstDayOfWeek + 7) % 7;
  }
  
  const firstWeekEnd = Math.min(currentDay + daysUntilFriday, lastDay);
  weeks.push(`${abbrev} Sem${weekNumber} (${currentDay}-${firstWeekEnd})`);
  currentDay = firstWeekEnd + 1;
  weekNumber++;

  // Demais semanas: sábado até sexta-feira
  while (currentDay <= lastDay) {
    const weekEnd = Math.min(currentDay + 6, lastDay);
    weeks.push(`${abbrev} Sem${weekNumber} (${currentDay}-${weekEnd})`);
    currentDay = weekEnd + 1;
    weekNumber++;
  }
  
  return weeks;
}

/**
 * Extrai o número da semana de uma string
 * Ex: "OUT Sem1 (1-4)" -> 1
 */
export function extractWeekNumber(weekName: string): number | null {
  const match = weekName.match(/Sem(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Extrai o intervalo de dias de uma string de semana
 * Ex: "OUT Sem1 (1-4)" -> { start: 1, end: 4 }
 */
export function extractDayRange(weekName: string): { start: number; end: number } | null {
  const match = weekName.match(/\((\d+)-(\d+)\)/);
  if (!match) return null;
  return { start: parseInt(match[1]), end: parseInt(match[2]) };
}

/**
 * Obtém o número de dias em uma semana
 */
export function getDaysInWeek(weekLabel: string): number {
  const range = extractDayRange(weekLabel);
  if (!range) return 7;
  return range.end - range.start + 1;
}

/**
 * Obtém o total de dias em um mês
 */
export function getTotalDaysInMonth(month: string, year?: number): number {
  const currentYear = year || new Date().getFullYear();
  const monthNum = monthMap[month.toLowerCase()];
  if (monthNum === undefined) return 31;
  return new Date(currentYear, monthNum + 1, 0).getDate();
}

/**
 * Obtém o rótulo da semana baseado no mês e número
 */
export function getWeekLabel(month: string, weekNumber: number, year?: number): string {
  const weeks = getWeeksForMonth(month, year);
  return weeks.find(w => w.includes(`Sem${weekNumber}`)) || `${getMonthAbbrev(month)} Sem${weekNumber}`;
}

/**
 * Compara duas semanas para verificar se são a mesma
 */
export function isSameWeek(week1: string, week2: string): boolean {
  if (week1 === week2) return true;
  
  const num1 = extractWeekNumber(week1);
  const num2 = extractWeekNumber(week2);
  const range1 = extractDayRange(week1);
  const range2 = extractDayRange(week2);
  
  if (range1 && range2) {
    return range1.start === range2.start && range1.end === range2.end;
  }
  
  if (num1 !== null && num2 !== null) {
    return num1 === num2;
  }
  
  return false;
}

/**
 * Retorna um array com todos os números de dias de uma semana
 * Ex: "OUT Sem1 (1-4)" -> [1, 2, 3, 4]
 */
export function getDaysArrayForWeek(weekLabel: string): number[] {
  const range = extractDayRange(weekLabel);
  if (!range) return [];
  const days: number[] = [];
  for (let d = range.start; d <= range.end; d++) {
    days.push(d);
  }
  return days;
}

// ============================================
// INTERFACE E FUNÇÕES DE RECÁLCULO DINÂMICO
// ============================================

export interface WeeklyEntry {
  week: string;
  realized: number;
  target: number;
  isCompleted: boolean;
}

/**
 * Distribui a meta mensal pelas semanas proporcionalmente aos dias
 */
export function distributeMonthlyTarget(
  monthlyTarget: number,
  month: string,
  year?: number,
  unit?: string
): Record<string, number> {
  const weeks = getWeeksForMonth(month, year);
  const totalDays = getTotalDaysInMonth(month, year);
  const result: Record<string, number> = {};

  if (unit === 'percent') {
    weeks.forEach(week => {
      result[week] = monthlyTarget;
    });
    return result;
  }

  weeks.forEach(week => {
    const days = getDaysInWeek(week);
    result[week] = (monthlyTarget * days) / totalDays;
  });

  return result;
}

/**
 * Recalcula as metas das semanas futuras baseado no desempenho
 */
export function recalculateRemainingWeeklyTargets(
  monthlyTarget: number,
  month: string,
  entries: WeeklyEntry[],
  year?: number,
  unit?: string
): Record<string, number> {
  const weeks = getWeeksForMonth(month, year);
  const result: Record<string, number> = {};

  if (unit === 'percent') {
    weeks.forEach(week => {
      result[week] = monthlyTarget;
    });
    return result;
  }

  let totalRealized = 0;
  const completedWeeks: string[] = [];

  entries.forEach(entry => {
    if (entry.isCompleted && entry.realized > 0) {
      totalRealized += entry.realized;
      completedWeeks.push(entry.week);
    }
  });

  const remainingTarget = Math.max(0, monthlyTarget - totalRealized);

  let remainingDays = 0;
  weeks.forEach(week => {
    const isCompleted = completedWeeks.some(cw => isSameWeek(cw, week));
    if (!isCompleted) {
      remainingDays += getDaysInWeek(week);
    }
  });

  weeks.forEach(week => {
    const isCompleted = completedWeeks.some(cw => isSameWeek(cw, week));
    const entry = entries.find(e => isSameWeek(e.week, week));
    
    if (isCompleted && entry) {
      result[week] = entry.target;
    } else if (remainingDays > 0) {
      const days = getDaysInWeek(week);
      result[week] = (remainingTarget * days) / remainingDays;
    } else {
      result[week] = 0;
    }
  });

  return result;
}
