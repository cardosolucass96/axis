import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Sector } from '../types';
import { dataService } from '../src/services/dataService';
import { Button } from '../components/Button';
import { PageHeader, LoadingSpinner, Modal, Input, Select, Badge, IconButton } from '../components/ui';
import { ds } from '../styles/design-tokens';
import { Trash2, Edit, UserPlus, Shield, User as UserIcon, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserManagementPage: React.FC = () => {
  const { user: currentAuthUser, impersonateUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [usersData, sectorsData] = await Promise.all([
          dataService.getUsers(),
          dataService.getSectors()
        ]);
        setUsers(usersData);
        setSectors(sectorsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshUsers = async () => {
    const usersData = await dataService.getUsers();
    setUsers(usersData);
  };

  const handleSave = async () => {
    if (!editingUser.name || !editingUser.email || !editingUser.role) return;

    if (editingUser.id) {
      await dataService.updateUser(editingUser as User);
    } else {
      await dataService.addUser(editingUser as Omit<User, 'id' | 'avatarInitials'>);
    }

    setIsModalOpen(false);
    setEditingUser({});
    await refreshUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      await dataService.deleteUser(id);
      await refreshUsers();
    }
  };

  const handleImpersonate = async (user: User) => {
    await impersonateUser(user.id);
    navigate('/dashboard');
  };

  const openNewUserModal = () => {
    setEditingUser({ role: 'leader' }); // Default role
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando usuários..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Controle de acesso e hierarquia da equipe."
        actions={
          <Button onClick={openNewUserModal}>
            <UserPlus className="w-4 h-4" /> Adicionar Usuário
          </Button>
        }
      />

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Função / Permissão</th>
              <th className="px-6 py-4">Setor Responsável</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      {user.avatarInitials}
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300'
                    }`}>
                    {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                    {user.role === 'admin' ? 'CEO / Admin' : 'Líder / Gestor'}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {user.sectorIds && user.sectorIds.length > 0
                    ? user.sectorIds.map(sid => sectors.find(s => s.id === sid)?.name || 'Setor Removido').join(', ')
                    : <span className="text-zinc-400 italic">Todos / Nenhum</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {user.role !== 'admin' && user.id !== currentAuthUser?.id && (
                      <button
                        onClick={() => handleImpersonate(user)}
                        title="Acessar como este usuário"
                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(user)} className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome Completo"
            type="text"
            value={editingUser.name || ''}
            onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
            placeholder="Digite o nome completo"
          />

          <Input
            label="Email"
            type="email"
            value={editingUser.email || ''}
            onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
            placeholder="email@empresa.com"
          />

          <Select
            label="Função"
            value={editingUser.role || 'leader'}
            onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
            options={[
              { value: 'leader', label: 'Líder / Gestor' },
              { value: 'admin', label: 'CEO / Admin' }
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Setores Responsáveis (Opcional)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {sectors.map(s => {
                const isChecked = (editingUser.sectorIds || []).includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded px-2 py-1.5 transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const current = editingUser.sectorIds || [];
                        const updated = isChecked
                          ? current.filter(id => id !== s.id)
                          : [...current, s.id];
                        setEditingUser({ ...editingUser, sectorIds: updated });
                      }}
                      className="w-4 h-4 text-amber-500 border-zinc-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{s.name}</span>
                  </label>
                );
              })}
              {sectors.length === 0 && (
                <span className="text-sm text-zinc-400 italic">Nenhum setor cadastrado</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Selecione um ou mais setores. Sem seleção = acesso geral.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};