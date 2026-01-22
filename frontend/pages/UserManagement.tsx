import React, { useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';
import { Button } from '../components/Button';
import { Trash2, Edit, UserPlus, Shield, User as UserIcon } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(dataService.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  const sectors = dataService.getSectors();

  const refreshUsers = () => {
    setUsers([...dataService.getUsers()]);
  };

  const handleSave = () => {
    if (!editingUser.name || !editingUser.email || !editingUser.role) return;

    if (editingUser.id) {
      dataService.updateUser(editingUser as User);
    } else {
      dataService.addUser(editingUser as Omit<User, 'id' | 'avatarInitials'>);
    }
    
    setIsModalOpen(false);
    setEditingUser({});
    refreshUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      dataService.deleteUser(id);
      refreshUsers();
    }
  };

  const openNewUserModal = () => {
    setEditingUser({ role: 'leader' }); // Default role
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestão de Usuários</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Controle de acesso e hierarquia da equipe.</p>
        </div>
        <Button onClick={openNewUserModal} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Adicionar Usuário
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Função / Permissão</th>
              <th className="px-6 py-4">Setor Responsável</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300'
                  }`}>
                    {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                    {user.role === 'admin' ? 'CEO / Admin' : 'Líder / Gestor'}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {user.sectorId 
                    ? sectors.find(s => s.id === user.sectorId)?.name || 'Setor Removido'
                    : <span className="text-zinc-400 italic">Todos / Nenhum</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">{editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  value={editingUser.name || ''}
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Função</label>
                <select 
                  className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  value={editingUser.role}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                >
                  <option value="leader">Líder / Gestor</option>
                  <option value="admin">CEO / Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Setor Responsável (Opcional)</label>
                <select 
                  className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-2 bg-white dark:bg-black text-zinc-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  value={editingUser.sectorId || ''}
                  onChange={e => setEditingUser({...editingUser, sectorId: e.target.value})}
                >
                  <option value="">Sem restrição / Geral</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};