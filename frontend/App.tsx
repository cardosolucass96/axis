import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DataEntryPage } from './pages/DataEntry';
import { ActionPlansPage } from './pages/ActionPlans';
import { UserManagementPage } from './pages/UserManagement';
import { StructureManagementPage } from './pages/StructureManagement';
import { dataService } from './src/services/dataService';
import { User } from './types';
import { TrendingUp, User as UserIcon, Shield, X } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';

// Google Logo Component for brand consistency
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.23856)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
);

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGoogleLoginOpen, setIsGoogleLoginOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Carregar usuários ao montar o componente
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const users = await dataService.getUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsGoogleLoginOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Componente de Login
  const LoginPage: React.FC = () => (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[128px] opacity-20 dark:opacity-20"></div>
        <div className="absolute top-[60%] -left-[10%] w-[40%] h-[40%] bg-zinc-400 dark:bg-zinc-800 rounded-full blur-[128px] opacity-20 dark:opacity-20"></div>
      </div>

      <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-lg max-w-sm w-full rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center transition-colors duration-300">
        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <TrendingUp className="w-8 h-8 text-black" />
        </div>

        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Axis</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 text-center">Gestão de KPIs de Alta Performance</p>

        <button
          onClick={() => setIsGoogleLoginOpen(true)}
          disabled={isLoadingUsers}
          className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg border border-zinc-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleLogo />
          <span>{isLoadingUsers ? 'Carregando...' : 'Entrar com Google'}</span>
        </button>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Axis.
          </p>
        </div>
      </div>

      {/* Mock Google Account Chooser Modal */}
      {isGoogleLoginOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <div className="p-6 pb-4">
              <div className="flex justify-center mb-4">
                <GoogleLogo />
              </div>
              <h2 className="text-xl text-center font-medium text-zinc-900 dark:text-white mb-2">Fazer login com o Google</h2>
              <p className="text-center text-zinc-600 dark:text-zinc-400 text-sm mb-6">Ir para <span className="font-semibold text-amber-600">Axis</span></p>

              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {allUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleLogin(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors border-b border-transparent hover:border-zinc-100 dark:hover:border-zinc-700 text-left group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.role === 'admin' ? 'bg-amber-600' : 'bg-zinc-700'}`}>
                      {user.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate">{user.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 border-t border-zinc-100 dark:border-zinc-700 flex justify-end">
              <button
                onClick={() => setIsGoogleLoginOpen(false)}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Componente de Acesso Negado
  const AccessDenied: React.FC = () => (
    <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
      Acesso negado.
    </div>
  );

  // Se não está logado, mostrar página de login
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <Routes>
        <Route
          path="/"
          element={<Navigate to={currentUser.role === 'admin' ? '/dashboard' : '/entry'} replace />}
        />
        <Route
          path="/dashboard"
          element={currentUser.role === 'admin' ? <Dashboard /> : <AccessDenied />}
        />
        <Route path="/entry" element={<DataEntryPage />} />
        <Route path="/actions" element={<ActionPlansPage />} />
        <Route
          path="/users"
          element={currentUser.role === 'admin' ? <UserManagementPage /> : <AccessDenied />}
        />
        <Route
          path="/structure"
          element={currentUser.role === 'admin' ? <StructureManagementPage /> : <AccessDenied />}
        />
        {/* Rota padrão - redirecionar para dashboard ou entry baseado no role */}
        <Route
          path="*"
          element={<Navigate to={currentUser.role === 'admin' ? '/dashboard' : '/entry'} replace />}
        />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <Router>
          <AppContent />
        </Router>
      </LoadingProvider>
    </ThemeProvider>
  );
};

export default App;