import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PenTool, ClipboardList, Menu, X, TrendingUp, Users, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { User } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Define navigation items with required roles
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard CEO', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'entry', label: 'Gestão de KPI', icon: PenTool, roles: ['admin', 'leader'] },
    { id: 'actions', label: 'Planos de Ação', icon: ClipboardList, roles: ['admin', 'leader'] },
    { id: 'structure', label: 'Gestão de Estrutura', icon: Settings, roles: ['admin'] },
    { id: 'users', label: 'Gestão de Usuários', icon: Users, roles: ['admin'] },
  ];

  // Filter items based on user role
  const navItems = allNavItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col md:flex-row font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-700 p-4 flex justify-between items-center sticky top-0 z-20 shadow-md transition-colors duration-150">
        <div className="flex items-center gap-2 font-bold text-xl text-amber-500">
          <TrendingUp className="w-6 h-6" />
          <span>Axis</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 transition-colors duration-150"
          >
             {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isSidebarOpen}
            className="text-zinc-900 dark:text-white p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar - Light in Light Mode, Black in Dark Mode */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 transform transition-[transform] duration-300 ease-in-out border-r border-zinc-200 dark:border-zinc-900
        bg-white dark:bg-black text-zinc-900 dark:text-white
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-xl dark:shadow-2xl
      `}>
        {/* Inner wrapper for color transitions */}
        <div className="flex flex-col h-full transition-colors duration-150">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between transition-colors duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white transition-colors duration-150">Axis</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const path = `/${item.id}`;
            const isActive = location.pathname === path;
            return (
              <Link
                key={item.id}
                to={path}
                onClick={() => setIsSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-amber-600 dark:hover:text-amber-500'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black transition-colors duration-150">
          <div className="flex flex-col gap-4">
             {/* Theme Toggle Desktop */}
             <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Modo</span>
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-150 flex items-center gap-2"
                >
                  {theme === 'dark' ? (
                     <>
                       <Sun className="w-4 h-4" /> <span className="text-xs">Light</span>
                     </>
                  ) : (
                     <>
                       <Moon className="w-4 h-4" /> <span className="text-xs">Dark</span>
                     </>
                  )}
                </button>
             </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-amber-600 dark:text-amber-500 transition-colors duration-150">
                  {currentUser?.avatarInitials}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-900 dark:text-white transition-colors duration-150">{currentUser?.name}</p>
                  <p className="text-zinc-500 capitalize transition-colors duration-150">{currentUser?.role === 'admin' ? 'Admin' : 'Líder'}</p>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="p-1.5 text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors duration-150"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-150">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-0 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};