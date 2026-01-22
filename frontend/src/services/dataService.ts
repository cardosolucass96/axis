import { KpiEntry as IKpiEntry, User, Sector, KPI } from '../../types';
import { api, HttpError } from './api';

/**
 * DataService - Camada de acesso a dados
 * Comunica com backend via API REST
 * 
 * Cache local para reduzir requisições
 */

// Cache local para dados
let cachedUsers: User[] | null = null;
let cachedSectors: Sector[] | null = null;
let cachedEntries: IKpiEntry[] | null = null;
let lastFetchTime = {
  users: 0,
  sectors: 0,
  entries: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Verifica se cache é válido
 */
function isCacheValid(key: keyof typeof lastFetchTime): boolean {
  return Date.now() - lastFetchTime[key] < CACHE_DURATION;
}

export const dataService = {
  // ===== SECTORS =====
  getSectors: async (): Promise<Sector[]> => {
    try {
      if (cachedSectors && isCacheValid('sectors')) {
        return cachedSectors;
      }

      const sectors = await api.sectors.getAll();
      cachedSectors = sectors;
      lastFetchTime.sectors = Date.now();
      return sectors;
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
      // Fallback: retornar cache antigo se houver
      return cachedSectors || [];
    }
  },

  saveSector: async (sector: Sector): Promise<Sector> => {
    try {
      const result = sector.id
        ? await api.sectors.update(sector.id, sector)
        : await api.sectors.create({ name: sector.name });

      // Invalidar cache
      cachedSectors = null;

      return result;
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      throw error;
    }
  },

  deleteSector: async (sectorId: string): Promise<void> => {
    try {
      await api.sectors.delete(sectorId);
      // Invalidar cache
      cachedSectors = null;
    } catch (error) {
      console.error('Erro ao deletar setor:', error);
      throw error;
    }
  },

  // ===== KPIs =====
  saveKPI: async (sectorId: string, kpi: KPI): Promise<void> => {
    try {
      if (kpi.id) {
        await api.kpis.update(kpi.id, kpi);
      } else {
        await api.kpis.create(sectorId, kpi);
      }
      // Invalidar cache
      cachedSectors = null;
    } catch (error) {
      console.error('Erro ao salvar KPI:', error);
      throw error;
    }
  },

  deleteKPI: async (sectorId: string, kpiId: string): Promise<void> => {
    try {
      await api.kpis.delete(kpiId);
      // Invalidar cache
      cachedSectors = null;
    } catch (error) {
      console.error('Erro ao deletar KPI:', error);
      throw error;
    }
  },

  // ===== ENTRIES =====
  getEntries: async (sectorId?: string, month?: string): Promise<IKpiEntry[]> => {
    try {
      if (!sectorId && !month && cachedEntries && isCacheValid('entries')) {
        return cachedEntries;
      }

      const entries = await api.entries.getAll({ sectorId, month });

      if (!sectorId && !month) {
        cachedEntries = entries;
        lastFetchTime.entries = Date.now();
      }

      return entries;
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      return cachedEntries || [];
    }
  },

  getAllActionPlans: async (): Promise<IKpiEntry[]> => {
    try {
      const plans = await api.actionPlans.getAll();
      return plans.filter(p => p.what && p.what.length > 0);
    } catch (error) {
      console.error('Erro ao buscar planos de ação:', error);
      return [];
    }
  },

  saveEntry: async (entry: IKpiEntry): Promise<IKpiEntry> => {
    try {
      const result = entry.id
        ? await api.entries.update(entry.id, entry)
        : await api.entries.create(entry);

      // Invalidar cache
      cachedEntries = null;

      return result;
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      throw error;
    }
  },

  removeActionPlan: async (entryId: string): Promise<void> => {
    try {
      const plans = await api.actionPlans.getAll();
      const plan = plans.find(p => p.entryId === entryId);

      if (plan) {
        await api.actionPlans.delete(plan.id);
        cachedEntries = null;
      }
    } catch (error) {
      console.error('Erro ao remover plano de ação:', error);
      throw error;
    }
  },

  createEntryId: (sectorId: string, kpiId: string, month: string, week: string) => {
    return `${sectorId}-${kpiId}-${month}-${week}`.replace(/\s+/g, '').toLowerCase();
  },

  // ===== USERS =====
  getUsers: async (): Promise<User[]> => {
    try {
      if (cachedUsers && isCacheValid('users')) {
        return cachedUsers;
      }

      const users = await api.users.getAll();
      cachedUsers = users;
      lastFetchTime.users = Date.now();
      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return cachedUsers || [];
    }
  },

  addUser: async (user: Omit<User, 'id' | 'avatarInitials'>): Promise<User> => {
    try {
      const result = await api.users.create({
        ...user,
        avatarInitials: user.name.substring(0, 2).toUpperCase(),
      });

      // Invalidar cache
      cachedUsers = null;

      return result;
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      throw error;
    }
  },

  updateUser: async (user: User): Promise<void> => {
    try {
      await api.users.update(user.id, user);
      // Invalidar cache
      cachedUsers = null;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await api.users.delete(userId);
      // Invalidar cache
      cachedUsers = null;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },

  // ===== DASHBOARD ANALYTICS =====
  getDashboardHealthIndex: async (month?: string, week?: string) => {
    try {
      return await api.dashboard.healthIndex({ month, week });
    } catch (error) {
      console.error('Erro ao buscar health index:', error);
      return { onTrack: 0, warning: 0, critical: 0 };
    }
  },

  getDashboardTrendAnalysis: async (months: number = 6) => {
    try {
      return await api.dashboard.trendAnalysis({ months });
    } catch (error) {
      console.error('Erro ao buscar trend analysis:', error);
      return [];
    }
  },

  getDashboardFinancialBridge: async (month?: string, week?: string) => {
    try {
      return await api.dashboard.financialBridge({ month, week });
    } catch (error) {
      console.error('Erro ao buscar financial bridge:', error);
      return { data: [], totalTarget: 0, totalRealized: 0 };
    }
  },

  getDashboardPlanStats: async (month?: string) => {
    try {
      return await api.dashboard.planStats({ month });
    } catch (error) {
      console.error('Erro ao buscar plan stats:', error);
      return { total: 0, a_fazer: 0, fazendo: 0, feito: 0, stand_by: 0 };
    }
  },

  getDashboardAgingPlans: async (month?: string) => {
    try {
      return await api.dashboard.agingPlans({ month });
    } catch (error) {
      console.error('Erro ao buscar aging plans:', error);
      return [];
    }
  },

  getDashboardRootCauseCloud: async (month?: string) => {
    try {
      return await api.dashboard.rootCauseCloud({ month });
    } catch (error) {
      console.error('Erro ao buscar root cause cloud:', error);
      return [];
    }
  },

  // ===== HEALTH CHECK =====
  checkHealth: async (): Promise<boolean> => {
    try {
      await api.health();
      return true;
    } catch (error) {
      console.error('Erro ao conectar com servidor:', error);
      return false;
    }
  },

  // ===== CACHE MANAGEMENT =====
  invalidateCache: () => {
    cachedUsers = null;
    cachedSectors = null;
    cachedEntries = null;
    lastFetchTime = { users: 0, sectors: 0, entries: 0 };
  },
};