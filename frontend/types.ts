
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
  target: number;
  realized: number;
  gap: number;
  gapPercentage: number;
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
}

export interface Sector {
  id: string;
  name: string;
  kpis: KPI[];
}

export const MONTHS = [
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
  'Janeiro'
];

export const WEEKS = [
  'Semana 1',
  'Semana 2',
  'Semana 3',
  'Semana 4',
  'Mês Geral'
];
