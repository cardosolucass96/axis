import React, { useState, useEffect } from 'react';
import { Sector, KPI, User } from '../types';
import { dataService } from '../src/services/dataService';
import { Button } from '../components/Button';
import { Edit, Trash2, Plus, Settings, ChevronRight, ChevronDown, Save, X, User as UserIcon, Shield } from 'lucide-react';

export const StructureManagementPage: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [expandedSectorId, setExpandedSectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Partial<Sector>>({});
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(''); // For the modal dropdown

  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<Partial<KPI>>({});
  const [activeSectorIdForKPI, setActiveSectorIdForKPI] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sectorsData, usersData] = await Promise.all([
        dataService.getSectors(),
        dataService.getUsers()
      ]);
      setSectors(sectorsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const toggleExpand = (id: string) => {
    setExpandedSectorId(expandedSectorId === id ? null : id);
  };

  // --- Sector Handlers ---
  const handleAddSector = () => {
    setEditingSector({ name: '', kpis: [] });
    setSelectedLeaderId('');
    setIsSectorModalOpen(true);
  };

  const handleEditSector = (sector: Sector) => {
    setEditingSector({ ...sector });
    const currentLeader = users.find(u => u.sectorId === sector.id);
    setSelectedLeaderId(currentLeader ? currentLeader.id : '');
    setIsSectorModalOpen(true);
  };

  const handleSaveSector = async () => {
    if (!editingSector.name) return;

    const id = editingSector.id || Math.random().toString(36).substr(2, 9);
    const newSector: Sector = {
      id,
      name: editingSector.name,
      kpis: editingSector.kpis || []
    };

    try {
      // 1. Save the Sector
      await dataService.saveSector(newSector);

      // 2. Handle Leader Linking
      if (selectedLeaderId) {
        const userToLink = users.find(u => u.id === selectedLeaderId);
        if (userToLink) {
          // Update user to point to this new/edited sector
          const updatedUser = { ...userToLink, sectorId: id };
          await dataService.updateUser(updatedUser);
        }
      }

      setIsSectorModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
    }
  };

  const handleDeleteSector = async (id: string) => {
    if (confirm('Tem certeza? Isso apagará todos os KPIs associados a este setor.')) {
      try {
        await dataService.deleteSector(id);
        await refreshData();
      } catch (error) {
        console.error('Erro ao deletar setor:', error);
      }
    }
  };

  // --- KPI Handlers ---
  const handleAddKPI = (sectorId: string) => {
    setActiveSectorIdForKPI(sectorId);
    setEditingKPI({ name: '', unit: 'number', format: '' });
    setIsKPIModalOpen(true);
  };

  const handleEditKPI = (sectorId: string, kpi: KPI) => {
    setActiveSectorIdForKPI(sectorId);
    setEditingKPI({ ...kpi });
    setIsKPIModalOpen(true);
  };

  const handleSaveKPI = async () => {
    if (!activeSectorIdForKPI || !editingKPI.name) return;

    const id = editingKPI.id || `kpi_${Math.random().toString(36).substr(2, 6)}`;
    const newKPI: KPI = {
      id,
      name: editingKPI.name,
      unit: editingKPI.unit || 'number',
      format: editingKPI.format || ''
    };

    try {
      await dataService.saveKPI(activeSectorIdForKPI, newKPI);
      setIsKPIModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Erro ao salvar KPI:', error);
    }
  };

  const handleDeleteKPI = async (sectorId: string, kpiId: string) => {
    if (confirm('Tem certeza que deseja remover este KPI?')) {
      try {
        await dataService.deleteKPI(sectorId, kpiId);
        await refreshData();
      } catch (error) {
        console.error('Erro ao deletar KPI:', error);
      }
    }
  };

  // Helper to get users assigned to a sector
  const getSectorUsers = (sectorId: string) => {
    return users.filter(u => u.sectorId === sectorId);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestão de Estrutura</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Adicione ou edite Setores e KPIs da organização.</p>
        </div>
        <Button onClick={handleAddSector} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Setor
        </Button>
      </div>

      <div className="grid gap-4">
        {sectors.map(sector => {
          const sectorUsers = getSectorUsers(sector.id);

          return (
            <div key={sector.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
              <div className="p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
                <div
                  className="flex items-center gap-3 cursor-pointer select-none flex-1"
                  onClick={() => toggleExpand(sector.id)}
                >
                  {expandedSectorId === sector.id ? <ChevronDown className="text-zinc-400" /> : <ChevronRight className="text-zinc-400" />}
                  <div>
                    <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100">{sector.name}</div>

                    {/* Display Associated Leaders/Users */}
                    {sectorUsers.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        {sectorUsers.map(u => (
                          <div key={u.id} className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full pl-1 pr-2 py-0.5 shadow-sm">
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                              {u.avatarInitials}
                            </div>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{u.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                    {sector.kpis.length} KPIs
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditSector(sector)} className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 rounded-lg" title="Editar Setor">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteSector(sector.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg" title="Excluir Setor">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {expandedSectorId === sector.id && (
                <div className="p-4 bg-white dark:bg-zinc-900">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">KPIs do Setor</h4>
                    <Button variant="secondary" onClick={() => handleAddKPI(sector.id)} className="text-xs px-3 py-1 flex items-center gap-1 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700">
                      <Plus className="w-3 h-3" /> Adicionar KPI
                    </Button>
                  </div>

                  {sector.kpis.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      Este setor ainda não possui KPIs.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sector.kpis.map(kpi => (
                        <div key={kpi.id} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between items-center hover:shadow-sm transition-shadow bg-zinc-50 dark:bg-zinc-950/50">
                          <div>
                            <div className="font-semibold text-zinc-700 dark:text-zinc-200">{kpi.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-2">
                              <span>Tipo: {kpi.unit}</span>
                              {kpi.format && <span>Fmt: {kpi.format}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditKPI(sector.id, kpi)} className="p-1.5 text-zinc-400 hover:text-amber-600 rounded">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteKPI(sector.id, kpi.id)} className="p-1.5 text-zinc-400 hover:text-red-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- SECTOR MODAL --- */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{editingSector.id ? 'Editar Setor' : 'Novo Setor'}</h2>
              <button onClick={() => setIsSectorModalOpen(false)}><X className="text-zinc-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome do Setor</label>
                <input
                  type="text"
                  className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  value={editingSector.name || ''}
                  onChange={e => setEditingSector({ ...editingSector, name: e.target.value })}
                  placeholder="Ex: Marketing Digital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Líder Responsável</label>
                <div className="relative">
                  <select
                    className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 appearance-none bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    value={selectedLeaderId}
                    onChange={e => setSelectedLeaderId(e.target.value)}
                  >
                    <option value="">Selecione um líder (Opcional)</option>
                    {users.filter(u => u.role === 'leader' || u.role === 'admin').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'admin' ? 'Admin' : 'Líder'})
                      </option>
                    ))}
                  </select>
                  <UserIcon className="absolute right-3 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Isso vinculará o usuário selecionado a este setor.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsSectorModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveSector}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* --- KPI MODAL --- */}
      {isKPIModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{editingKPI.id ? 'Editar KPI' : 'Novo KPI'}</h2>
              <button onClick={() => setIsKPIModalOpen(false)}><X className="text-zinc-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome do KPI</label>
                <input
                  type="text"
                  className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  value={editingKPI.name || ''}
                  onChange={e => setEditingKPI({ ...editingKPI, name: e.target.value })}
                  placeholder="Ex: Custo por Lead"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tipo de Dado</label>
                  <select
                    className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    value={editingKPI.unit}
                    onChange={e => setEditingKPI({ ...editingKPI, unit: e.target.value as any })}
                  >
                    <option value="number">Número</option>
                    <option value="currency">Moeda (R$)</option>
                    <option value="percent">Porcentagem (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prefixo/Sufixo (Visual)</label>
                  <input
                    type="text"
                    className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    value={editingKPI.format || ''}
                    onChange={e => setEditingKPI({ ...editingKPI, format: e.target.value })}
                    placeholder="Ex: R$, %, un."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsKPIModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveKPI}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};