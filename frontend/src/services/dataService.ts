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
 * Verifica se uma string é um UUID v4 válido
 */
function isUUID(id: string | undefined): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

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
      // Se não for UUID, é um setor novo criado no frontend
      const isNew = !isUUID(sector.id);

      if (isNew) {
        // Para criar novo setor, enviamos apenas o nome (o backend gera o UUID)
        const result = await api.sectors.create({ name: sector.name });
        return result;
      } else {
        // Para atualização, enviamos o objeto completo (ou parcial)
        return await api.sectors.update(sector.id, sector);
      }
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      throw error;
    } finally {
      // Sempre invalidar o cache após uma alteração
      cachedSectors = null;
    }
  },

  deleteSector: async (sectorId: string): Promise<void> => {
    try {
      await api.sectors.delete(sectorId);
      cachedSectors = null;
    } catch (error) {
      console.error('Erro ao deletar setor:', error);
      throw error;
    }
  },

  // ===== KPIs =====
  saveKPI: async (sectorId: string, kpi: KPI): Promise<void> => {
    try {
      // Se não for UUID, é um KPI novo
      const isNew = !isUUID(kpi.id);

      if (isNew) {
        // Para criar, o backend não deve receber um ID do cliente
        const { id, ...kpiData } = kpi;
        await api.kpis.create(sectorId, kpiData as any);
      } else {
        // Update usa o ID existente
        await api.kpis.update(kpi.id, kpi);
      }
    } catch (error) {
      console.error('Erro ao salvar KPI:', error);
      throw error;
    } finally {
      cachedSectors = null;
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

      const response = await api.entries.getAll({ sectorId, month });

      // Mapear dados do backend para o formato esperado pelo frontend
      const mappedEntries = response.map((entry: any) => {
        // Garantir que sectorId e kpiId sejam strings para o frontend
        const sId = typeof entry.sectorId === 'object' ? entry.sectorId?.id : entry.sectorId;
        const kId = typeof entry.kpiId === 'object' ? entry.kpiId?.id : entry.kpiId;

        return {
          ...entry,
          sectorId: sId || entry.sector?.id,
          kpiId: kId || entry.kpi?.id,
          // Converte objetos RootCause para array de strings
          causes: entry.rootCauses ? entry.rootCauses.map((rc: any) => rc.cause) : (entry.causes || []),
          // Garante que campos de ActionPlan existam para exibição
          actionPlan: entry.actionPlan || { what: '', who: '', when: '', why: '', where: '', how: '', howMuch: '' },
          // Mapeia o status do plano para o campo de controle do frontend
          actionPlanStatus: entry.actionPlan?.status || entry.actionPlanStatus || 'a_fazer'
        };
      });

      if (!sectorId && !month) {
        cachedEntries = mappedEntries;
        lastFetchTime.entries = Date.now();
      }

      return mappedEntries;
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      return cachedEntries || [];
    }
  },

  getAllActionPlans: async (): Promise<IKpiEntry[]> => {
    try {
      const response = await api.actionPlans.getAll();

      // Mapear objetos ActionPlan do backend para o formato KpiEntry do frontend
      return response.map((plan: any) => {
        const entry = plan.entry || {};
        return {
          ...entry,
          // O ID aqui DEVE ser o entryId para que o saveEntry funcione na rota /api/entries/:id
          id: plan.entryId,
          sectorId: entry.sectorId,
          kpiId: entry.kpiId,
          month: entry.month,
          week: entry.week,
          // Mapear campos do 5W2H
          actionPlan: {
            what: plan.what,
            why: plan.why,
            where: plan.where,
            who: plan.who,
            when: plan.when,
            how: plan.how,
            howMuch: plan.howMuch
          },
          actionPlanStatus: plan.status || 'a_fazer',
          lastUpdated: entry.lastUpdated || plan.updatedAt
        };
      }).filter((p: any) => p.actionPlan?.what && p.actionPlan.what.length > 0);
    } catch (error) {
      console.error('Erro ao buscar planos de ação:', error);
      return [];
    }
  },

  saveEntry: async (entry: IKpiEntry): Promise<IKpiEntry> => {
    try {
      // Lógica de "New Entry" baseada na validade do UUID
      // Se for um ID composto (ex: "sector-kpi-month-week"), não é um UUID
      const isNewEntry = !isUUID(entry.id);

      let result;
      if (isNewEntry) {
        // Ao enviar um novo recurso via POST, não enviamos o ID gerado pelo cliente
        // O backend é o dono da verdade para IDs permanentes (Single Source of Truth)
        const { id, ...entryData } = entry;
        result = await api.entries.create(entryData);
      } else {
        // Para PUT, o ID é obrigatório para identificar o recurso
        result = await api.entries.update(entry.id, entry);
      }

      return result;
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      throw error;
    } finally {
      // Invalidar cache para forçar recarregamento na próxima listagem
      cachedEntries = null;
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