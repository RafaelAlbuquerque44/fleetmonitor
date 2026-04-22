import { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Sun, Moon, PlusCircle, Settings, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AIChat from './AIChat';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener('open-fleet-ai', handleOpenChat);
    return () => window.removeEventListener('open-fleet-ai', handleOpenChat);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateAccount = () => {
    // In a real app, this would open a modal or navigate to a creation form
    alert("Redirecionando para criação de nova conta...");
  };

  return (
    <div className="w-full h-20 flex items-center justify-end px-6 md:px-8 z-40 bg-transparent border-b border-gray-200/50 dark:border-white/5 backdrop-blur-sm relative transition-colors duration-500">
      
      <div className="flex items-center gap-2 md:gap-4">
        {/* IA Assistant Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold transition-all shadow-md shadow-indigo-500/20"
          title="FleetMonitor AI Assistant"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="hidden md:inline text-sm">IA Assistente</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-[#f1f5f9]  dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-fleet-200 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-fleet-600 dark:hover:text-white transition-all shadow-sm"
          title="Alternar Tema"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Account Switcher Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-[#f1f5f9]  dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-fleet-600 to-fleet-400 dark:from-fleet-400 dark:to-fleet-300 flex items-center justify-center text-white dark:text-fleet-900 font-bold shadow-sm">
              A
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Admin Global</p>
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50">Diretoria</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-white/40 group-hover:text-gray-600 dark:group-hover:text-white/60 transition-colors ml-1" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-[#f1f5f9]  dark:bg-fleet-800 border border-gray-200/60 dark:border-white/10 shadow-2xl ring-1 ring-black/5 focus:outline-none divide-y divide-gray-100 dark:divide-white/5">
              
              {/* Account List */}
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider">
                  Suas Contas
                </p>
                <Menu.Item>
                  {({ active }) => (
                    <button className={`${active ? 'bg-gray-50 dark:bg-white/5' : ''} flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white rounded-xl transition-colors`}>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-fleet-600 to-fleet-400 dark:from-fleet-400 dark:to-fleet-300 flex items-center justify-center text-white dark:text-fleet-900 font-bold mr-3 shadow-sm text-xs">A</div>
                      <div className="text-left flex-1"><p>Admin Global</p><p className="text-xs font-medium text-gray-500 dark:text-white/50">Sessão Atual</p></div>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button className={`${active ? 'bg-gray-50 dark:bg-white/5' : ''} flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/70 rounded-xl transition-colors`}>
                      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/40 font-bold mr-3 text-xs">O</div>
                      <div className="text-left flex-1"><p>Operacional SP</p><p className="text-xs font-medium text-gray-400 dark:text-white/40">Alternar</p></div>
                    </button>
                  )}
                </Menu.Item>
              </div>

              {/* Actions */}
              <div className="p-2">
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={handleCreateAccount}
                      className={`${active ? 'bg-fleet-50 dark:bg-fleet-500/10 text-fleet-600 dark:text-fleet-400' : 'text-gray-700 dark:text-white/80'} group flex w-full items-center rounded-xl font-semibold px-3 py-2.5 text-sm transition-colors`}
                    >
                      <PlusCircle className="mr-3 h-5 w-5 text-fleet-500 dark:text-fleet-400" aria-hidden="true" />
                      Criar Nova Conta
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button className={`${active ? 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/80'} group flex w-full items-center rounded-xl font-semibold px-3 py-2.5 text-sm transition-colors`}>
                      <Settings className="mr-3 h-5 w-5 text-gray-400 dark:text-white/50 group-hover:text-gray-600 dark:group-hover:text-white/80" aria-hidden="true" />
                      Configurações do Perfil
                    </button>
                  )}
                </Menu.Item>
              </div>

              {/* Logout */}
              <div className="p-2">
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={handleLogout}
                      className={`${active ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'text-red-500/80 dark:text-red-400/80'} group flex w-full items-center rounded-xl font-semibold px-3 py-2.5 text-sm transition-colors`}
                    >
                      <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
                      Encerrar Sessão
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
