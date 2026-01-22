import { SECTORS as INITIAL_SECTORS, INITIAL_ENTRIES as SEEDED_ENTRIES } from '../constants';
import { KpiEntry as IKpiEntry, User, Sector, KPI } from '../types';

// State simulation
let entries: IKpiEntry[] = [...SEEDED_ENTRIES];
let sectors: Sector[] = [...INITIAL_SECTORS];

// Seed Initial Users
let users: User[] = [
  { id: '1', name: 'Roberto (CEO)', email: 'ceo@vorp.com', role: 'admin', avatarInitials: 'RO' },
  { id: '2', name: 'Fernanda (CoS)', email: 'cos@vorp.com', role: 'admin', avatarInitials: 'FE' },
  { id: '3', name: 'Allef (Líder)', email: 'allef@vorp.com', role: 'leader', avatarInitials: 'AL', sectorId: 'comercial_allef' },
  { id: '4', name: 'Lais (Líder)', email: 'lais@vorp.com', role: 'leader', avatarInitials: 'LA', sectorId: 'comercial_lais' },
  { id: '5', name: 'Sena (Vendas)', email: 'sena@vorp.com', role: 'leader', avatarInitials: 'SE' },
];

export const dataService = {
  // --- Structure Logic (Sectors & KPIs) ---
  getSectors: (): Sector[] => {
    return sectors;
  },

  saveSector: (sector: Sector) => {
    const index = sectors.findIndex(s => s.id === sector.id);
    if (index >= 0) {
      sectors[index] = sector;
    } else {
      sectors.push(sector);
    }
    return sector;
  },

  deleteSector: (sectorId: string) => {
    sectors = sectors.filter(s => s.id !== sectorId);
    // Optional: Clean up orphaned entries/users here if needed
  },

  saveKPI: (sectorId: string, kpi: KPI) => {
    const sectorIndex = sectors.findIndex(s => s.id === sectorId);
    if (sectorIndex >= 0) {
      const sector = sectors[sectorIndex];
      const kpiIndex = sector.kpis.findIndex(k => k.id === kpi.id);
      
      const newKpis = [...sector.kpis];
      if (kpiIndex >= 0) {
        newKpis[kpiIndex] = kpi;
      } else {
        newKpis.push(kpi);
      }
      
      sectors[sectorIndex] = { ...sector, kpis: newKpis };
    }
  },

  deleteKPI: (sectorId: string, kpiId: string) => {
    const sectorIndex = sectors.findIndex(s => s.id === sectorId);
    if (sectorIndex >= 0) {
      const sector = sectors[sectorIndex];
      const newKpis = sector.kpis.filter(k => k.id !== kpiId);
      sectors[sectorIndex] = { ...sector, kpis: newKpis };
    }
  },

  // --- Entries Logic ---
  getEntries: (sectorId?: string, month?: string): IKpiEntry[] => {
    let filtered = entries;
    if (sectorId) filtered = filtered.filter(e => e.sectorId === sectorId);
    if (month) filtered = filtered.filter(e => e.month === month);
    return filtered;
  },

  getAllActionPlans: () => {
    // Safety check: ensure 'what' exists before accessing length
    return entries.filter(e => e.actionPlan && e.actionPlan.what && e.actionPlan.what.length > 0);
  },

  saveEntry: (entry: IKpiEntry) => {
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    return entry;
  },
  
  removeActionPlan: (entryId: string) => {
    const existingIndex = entries.findIndex(e => e.id === entryId);
    if (existingIndex >= 0) {
      const entry = entries[existingIndex];
      const updatedEntry: IKpiEntry = {
        ...entry,
        actionPlan: undefined,
        actionPlanStatus: undefined
      };
      entries[existingIndex] = updatedEntry;
    }
  },

  createEntryId: (sectorId: string, kpiId: string, month: string, week: string) => {
    return `${sectorId}-${kpiId}-${month}-${week}`.replace(/\s+/g, '').toLowerCase();
  },

  // --- User Logic ---
  getUsers: (): User[] => {
    return users;
  },

  addUser: (user: Omit<User, 'id' | 'avatarInitials'>) => {
    const initials = user.name.substring(0, 2).toUpperCase();
    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      avatarInitials: initials
    };
    users.push(newUser);
    return newUser;
  },

  updateUser: (user: User) => {
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    }
  },

  deleteUser: (userId: string) => {
    users = users.filter(u => u.id !== userId);
  }
};