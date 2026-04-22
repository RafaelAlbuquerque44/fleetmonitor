import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CarFront, 
  Users, 
  MapPin, 
  Leaf, 
  Wrench,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import TopBar from '../components/TopBar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useVehicles } from '../lib/VehicleContext';
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Veículos', href: '/vehicles', icon: CarFront },
  { name: 'Motoristas', href: '/drivers', icon: Users },
  { name: 'Rastreamento', href: '/tracking', icon: MapPin },
  { name: 'IA & Oficina', href: '/maintenance', icon: Wrench },
  { name: 'ESG & Relatórios', href: '/reports', icon: Leaf },
  { name: 'Controle Financeiro', href: '/finance', icon: Wallet },
];

export default function MainLayout() {
  const location = useLocation();
  const { vehicles } = useVehicles();
  
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const totalVehicles = Math.max(vehicles.length, 1); // Prevents division by zero

  return (
    <div className="min-h-screen bg-[#e2e8f0] dark:bg-fleet-900 flex overflow-hidden transition-colors duration-500">
      {/* Premium Sidebar */}
      <motion.div 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
        className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-[#f1f5f9] dark:bg-fleet-600 shadow-sm  z-50 border-r border-indigo-100 dark:border-fleet-700 font-sans transition-colors duration-500"
      >
        <div className="flex-1 flex flex-col min-h-0 bg-transparent dark:bg-gradient-to-b dark:from-fleet-600 dark:to-fleet-800 relative transition-colors duration-500">
          
          {/* Brand Header */}
          <div className="flex items-center h-20 flex-shrink-0 px-8 border-b border-gray-200/60 dark:border-white/10 relative overflow-hidden transition-colors duration-500">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-fleet-500/5 dark:bg-white/5 rounded-full blur-2xl"></div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight z-10 antialiased"
            >
              <div className="w-10 h-10 rounded-xl bg-fleet-50 dark:bg-white/10 flex items-center justify-center border border-fleet-100 dark:border-white/20">
                <Leaf className="w-6 h-6 text-fleet-600 dark:text-white" />
              </div>
              FleetMonitor
            </motion.h1>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto px-4 py-8 space-y-1 scrollbar-hide">
            <p className="px-4 text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4 transition-colors duration-500">Menu Principal</p>
            <nav className="flex-1 space-y-2">
              {navigation.map((item, index) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <NavLink
                      to={item.href}
                      className={cn(
                        isActive
                          ? 'bg-gradient-to-r from-fleet-600 to-fleet-500 text-white shadow-md shadow-fleet-500/20 border border-fleet-400 dark:bg-white/10 dark:text-white dark:shadow-lg dark:border-white/10  dark:from-white/10 dark:to-white/5'
                          : 'text-slate-600 hover:bg-gray-50 hover:text-slate-800 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white',
                        'group flex items-center justify-between px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={cn(
                            isActive ? 'text-white dark:text-alert' : 'text-slate-400 group-hover:text-slate-600 dark:text-white/50 dark:group-hover:text-white/90',
                            'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-300'
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                          aria-hidden="true"
                        />
                        {item.name}
                      </div>
                      {isActive && (
                        <motion.div layoutId="activeNavIndicator">
                          <ChevronRight className="w-4 h-4 text-white dark:text-white/50 transition-colors duration-300" />
                        </motion.div>
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}
            </nav>

            {/* Quick Status Mini Widget */}
            <div className="mt-8 mb-4 px-4">
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200/80 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-colors duration-500 hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    Frota em Tempo Real
                  </h5>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Em Rota</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{activeVehicles} de {vehicles.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(activeVehicles / totalVehicles) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Manutenção</span>
                      <span className="text-amber-600 dark:text-amber-400">{maintenanceVehicles} de {vehicles.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(maintenanceVehicles / totalVehicles) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-amber-500 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Premium Bottom Widget */}
          <div className="p-4 shrink-0 transition-colors duration-500 pb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group cursor-pointer hover:shadow-indigo-500/40 transition-shadow">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-colors duration-500"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent rounded-tl-full"></div>
              
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20  flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base leading-tight drop-shadow-sm">FleetAI</h4>
                    <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                      Status: Ativo
                    </span>
                  </div>
                </div>
                
                <p className="text-xs font-semibold text-indigo-50/90 leading-relaxed mt-1">
                  Sua inteligência artificial integrada está monitorando a frota e gerando predições ao vivo.
                </p>
                
                <button 
                  onClick={() => window.dispatchEvent(new Event('open-fleet-ai'))}
                  className="w-full mt-2 py-2 bg-white/20 hover:bg-white/30  border border-white/20 rounded-xl text-xs font-bold text-white transition-colors duration-300"
                >
                  Abrir Assistente
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Main content with page transitions */}
      <div className="md:pl-72 flex flex-col flex-1 min-h-screen relative overflow-hidden transition-colors duration-500">
        <AnimatedBackground />
        
        <div className="flex flex-col flex-1 relative z-10 w-full h-full">
          <TopBar />
          
          <main className="flex-1 p-6 md:p-8 overflow-y-auto relative w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full max-w-7xl mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
