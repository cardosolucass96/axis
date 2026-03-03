
export type PlanStatus = 'a_fazer' | 'fazendo' | 'feito' | 'stand_by';
export type UserRole = 'admin' | 'leader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  sectorId?: string; // Opcional, para vincular lider a um setor
}

export interface FiveWTwoH {
  what: string;
  why: string;
  where: string;
  who: string;
  when: string;
  how: string;
  howMuch: string;
}

export interface KpiEntry {
  id: string;
  sectorId: string;
  kpiId: string;
  month: string; // e.g., "Outubro 2023"
  week: string; // e.g., "Semana 1"
  day?: number | null; // null/undefined = entrada semanal, 1-31 = entrada diária
  target: number | null;
  realized: number | null; // null = não preenchido, 0 = valor zero preenchido
  gap: number;
  gapPercentage: number;
  isCompleted?: boolean; // true quando o realizado foi preenchido e a meta está "congelada"
  causes?: string[]; // 5 Whys
  actionPlan?: FiveWTwoH;
  actionPlanStatus?: PlanStatus;
  lastUpdated: string;
}

export interface KPI {
  id: string;
  name: string;
  unit: 'currency' | 'number' | 'percent';
  format: string;
  isInverse?: boolean; // true = meta de teto (máximo permitido), false = meta de piso (mínimo a atingir)
}

export interface Sector {
  id: string;
  name: string;
  kpis: KPI[];
}

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

// WEEKS genérico - usado apenas como fallback, semanas reais são geradas dinamicamente
export const WEEKS = [
  'Sem1',
  'Sem2', 
  'Sem3',
  'Sem4',
  'Sem5'
];
