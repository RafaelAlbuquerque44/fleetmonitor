import { useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import type { Variants } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Car, Zap, AlertTriangle, TrendingDown, DollarSign, Trophy, BrainCircuit, BellRing, Clock, AlertOctagon, Target, X, CheckCircle2, Lock } from 'lucide-react';
import { useVehicles } from '../lib/VehicleContext';
import { useAccount } from '../lib/AccountContext';
import { useTheme } from '../contexts/ThemeContext';

const mockFuelData = [
  { name: 'Seg', cons: 12 },
  { name: 'Ter', cons: 15 },
  { name: 'Qua', cons: 11 },
  { name: 'Qui', cons: 14 },
  { name: 'Sex', cons: 13 },
  { name: 'Sab', cons: 9 },
  { name: 'Dom', cons: 10 },
];

const idleTimeData = [
  { name: 'Em Rota', value: 65, color: '#3b82f6' }, // blue-500
  { name: 'Ocioso (Motor Ligado)', value: 25, color: '#facc15' }, // yellow-400
  { name: 'Desligado', value: 10, color: '#9ca3af' } // gray-400
];

const topDrivers = [
  { id: 1, name: 'João Silva', score: 98, trend: '+2', badge: 'Ouro', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 2, name: 'Maria Souza', score: 94, trend: '+1', badge: 'Prata', color: 'text-gray-300', bg: 'bg-gray-500/10' },
  { id: 3, name: 'Carlos Pedroso', score: 89, trend: '-1', badge: 'Bronze', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const extendedDrivers = [
  ...topDrivers,
  { id: 4, name: 'Ana Oliveira', score: 85, trend: '+4', badge: 'Prata', color: 'text-gray-300', bg: 'bg-gray-500/10' },
  { id: 5, name: 'Marcos Santos', score: 82, trend: '-3', badge: 'Bronze', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 6, name: 'Luiza Mendes', score: 79, trend: '+1', badge: 'Bronze', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 7, name: 'Roberto Alves', score: 74, trend: '-5', badge: 'Atenção', color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 8, name: 'Fernanda Costa', score: 71, trend: '-2', badge: 'Atenção', color: 'text-red-400', bg: 'bg-red-500/10' },
];

const liveAlerts = [
  { id: 1, time: 'Agora', title: 'Pressão dos Pneus Crítica', vehicle: 'KJH-5544', type: 'danger', icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 2, time: 'Há 5 min', title: 'Excesso de Velocidade', vehicle: 'ABC-1234', type: 'warning', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 3, time: 'Há 12 min', title: 'Entrada em Zona de Risco', vehicle: 'XYZ-9876', type: 'info', icon: Target, color: 'text-fleet-400', bg: 'bg-fleet-500/10' },
];

const extendedAlerts = [
  ...liveAlerts,
  { id: 4, time: 'Há 35 min', title: 'Manutenção Preventiva Próxima', vehicle: 'LMN-1020', type: 'info', icon: CheckCircle2, color: 'text-fleet-400', bg: 'bg-fleet-500/10' },
  { id: 5, time: 'Há 1 hora', title: 'Curva Brusca Detectada', vehicle: 'ABC-1234', type: 'warning', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 6, time: 'Há 2 horas', title: 'Tempo Ocioso > 15min', vehicle: 'QWE-4455', type: 'warning', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 7, time: 'Há 4 horas', title: 'Frenagem Rápida', vehicle: 'XYZ-9876', type: 'danger', icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10' },
];

const aiPredictions = [
  { id: 1, plate: 'ABC-1234', probability: 87, component: 'Bateria Tensão Baixa', daysLeft: 4 },
  { id: 2, plate: 'XYZ-9876', probability: 62, component: 'Desgaste Pastilhas', daysLeft: 12 },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

export default function Dashboard() {
  const { vehicles } = useVehicles();
  const { activeAccount } = useAccount();
  const { theme } = useTheme();
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

  const isGlobalAdmin = activeAccount?.id === 999999;
  const hasVehicles = totalVehicles > 0;
  
  const currentFuelData = isGlobalAdmin ? mockFuelData : [];
  const currentIdleData = isGlobalAdmin ? idleTimeData : [];
  const currentTopDrivers = isGlobalAdmin ? topDrivers : [];
  const currentExtendedDrivers = isGlobalAdmin ? extendedDrivers : [];
  const currentLiveAlerts = isGlobalAdmin ? liveAlerts : [];
  const currentExtendedAlerts = isGlobalAdmin ? extendedAlerts : [];
  const currentAiPredictions = isGlobalAdmin ? aiPredictions : [];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black text-slate-800 dark:text-white tracking-tight transition-colors duration-500"
          >
            Visão Geral da Frota
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-fleet-200 mt-1 font-medium transition-colors duration-500"
          >
            Bem-vindo(a) de volta, veja as métricas de hoje.
          </motion.p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 bg-[#f1f5f9]  dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-bold rounded-xl text-slate-700 dark:text-fleet-100 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition shadow-sm"
          >
            Exportar PDF
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 bg-fleet-600 dark:bg-fleet-500 text-sm font-bold rounded-xl text-white hover:bg-fleet-700 dark:hover:bg-fleet-400 transition shadow-md shadow-fleet-500/20"
          >
            Atualizar Dados
          </motion.button>
        </div>
      </div>

      {/* KPI Cards section - using premium glassmorphism logic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative overflow-hidden bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 transition-all hover:shadow-lg dark:hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-white/5 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-fleet-500/5 dark:bg-white/5 rounded-full blur-2xl group-hover:bg-fleet-500/10 dark:group-hover:bg-white/10 transition-colors"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3.5 bg-fleet-50 dark:bg-white/10 text-fleet-600 dark:text-white rounded-xl shadow-sm dark:shadow-inner border border-fleet-100 dark:border-white/10">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1">Veículos Ativos</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{activeVehicles} <span className="text-xl text-fleet-500 font-medium">/ {totalVehicles}</span></h3>
            </div>
          </div>
        </motion.div>
        
        {/* Econ. Semanal - Requires Financeiro */}
        {(activeAccount?.produto_financeiro || isGlobalAdmin) && (
          <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative overflow-hidden bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 transition-all hover:shadow-lg dark:hover:shadow-xl hover:shadow-green-500/10 dark:hover:shadow-green-500/5 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/10 dark:group-hover:bg-green-500/20 transition-colors"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl shadow-sm dark:shadow-inner border border-green-100 dark:border-green-500/20">
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1">Econ. Semanal</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-2">
                  {hasVehicles ? 'R$ 1.2k' : 'R$ 0,00'}
                  {hasVehicles && <span className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center bg-green-100 dark:bg-green-500/20 px-2 py-0.5 rounded-md border border-green-200 dark:border-green-500/20"><TrendingDown className="w-3 h-3 mr-1" strokeWidth={3}/>8%</span>}
                </h3>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative overflow-hidden bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 transition-all hover:shadow-lg dark:hover:shadow-xl hover:shadow-yellow-500/10 dark:hover:shadow-yellow-500/5 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-500/5 dark:bg-alert/10 rounded-full blur-2xl group-hover:bg-yellow-500/10 dark:group-hover:bg-alert/20 transition-colors"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3.5 bg-yellow-50 dark:bg-alert/20 text-yellow-600 dark:text-yellow-400 rounded-xl shadow-sm dark:shadow-inner border border-yellow-200 dark:border-alert/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1">Em Manutenção</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{maintenanceVehicles}</h3>
            </div>
          </div>
        </motion.div>

        {/* Emissões - Requires Telemetria or Roteirizacao */}
        {(activeAccount?.produto_telemetria || activeAccount?.produto_roteirizacao || isGlobalAdmin) && (
          <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative overflow-hidden bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 transition-all hover:shadow-lg dark:hover:shadow-xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/5 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-500/20 transition-colors"></div>
             <div className="relative flex items-center gap-4">
              <div className="p-3.5 bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-xl shadow-sm dark:shadow-inner border border-cyan-100 dark:border-cyan-500/20">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1">Emissões CO₂</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-2">
                  {hasVehicles ? '-4.2%' : '0%'}
                  {hasVehicles && <span className="text-xs font-bold text-slate-600 dark:text-fleet-100 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">Mês</span>}
                </h3>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             Consumo de Combustível 
             <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-fleet-200 rounded-md font-semibold">Últimos 7 dias</span>
          </h3>
          <div className="h-72 flex items-center justify-center">
            {currentFuelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentFuelData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#93c5fd' : '#64748b', fontWeight: 600, fontSize: 13}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#93c5fd' : '#64748b', fontWeight: 600, fontSize: 13}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: theme === 'dark' ? '#1E3A8A' : '#ffffff', color: theme === 'dark' ? '#fff' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    cursor={{stroke: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', strokeWidth: 2}}
                    itemStyle={{ color: theme === 'dark' ? '#fff' : '#020617' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cons" 
                    stroke="#3b82f6" 
                    strokeWidth={5}
                    dot={{ r: 4, strokeWidth: 3, fill: theme === 'dark' ? '#1E3A8A' : '#ffffff' }}
                    activeDot={{ r: 7, fill: '#3b82f6', stroke: theme === 'dark' ? '#fff' : '#1e293b', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 dark:text-fleet-300 font-medium">Aguardando dados de telemetria da frota.</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-fleet-500 dark:text-fleet-300" />
            Análise de Tempo (Hoje)
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-fleet-200/70 mb-6">Proporção ociosa vs rodando</p>
          <div className="flex-1 min-h-[200px] flex items-center justify-center">
            {currentIdleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentIdleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {currentIdleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', background: theme === 'dark' ? '#172554' : '#ffffff', color: theme === 'dark' ? '#fff' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600, color: theme === 'dark' ? '#fff' : '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 dark:text-fleet-300 font-medium">Sem dados no momento.</p>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {currentIdleData.length > 0 && currentIdleData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-600 dark:text-fleet-100 font-semibold">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Deep Analytics Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Eco-Score Ranking */}
        <motion.div variants={itemVariants} className="bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-alert" />
              Ranking Fleet-Score
            </h3>
            <button 
              onClick={() => setIsDriversModalOpen(true)}
              className="text-sm font-bold text-fleet-600 dark:text-fleet-300 hover:text-fleet-700 dark:hover:text-white hover:underline transition"
            >
              Ver Todos
            </button>
          </div>
          <div className="space-y-3">
            {currentTopDrivers.length > 0 ? currentTopDrivers.map((driver, idx) => (
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                key={driver.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200/60 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:border-white/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${driver.bg} ${driver.color} shadow-sm border border-white/50 dark:border-white/10`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{driver.name}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-fleet-300">LIGA {driver.badge.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-800 dark:text-white text-lg">{driver.score}</span>
                  <span className="text-xs font-bold text-green-700 dark:text-green-300 ml-1 bg-green-100 dark:bg-green-500/20 px-1 py-0.5 rounded border border-green-200 dark:border-green-500/20">({driver.trend})</span>
                </div>
              </motion.div>
            )) : (
              <p className="text-center text-sm text-slate-400 dark:text-fleet-300 py-4">Sua frota ainda não registrou pontuações de motoristas.</p>
            )}
          </div>
        </motion.div>

        {/* AI Predictive Maintenance */}
        {(activeAccount?.produto_ia_assistente || isGlobalAdmin) && (
          <motion.div variants={itemVariants} className="bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-sm relative overflow-hidden border border-gray-200/60 dark:border-white/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-fleet-500/5 dark:bg-white/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-fleet-500 dark:text-fleet-300" />
                IA Preditiva
              </h3>
              {hasVehicles && (
                <span className="text-xs font-black px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-fleet-200 rounded-md border border-slate-200 dark:border-white/10 backdrop-blur-sm animate-pulse">
                  ANALISANDO
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-fleet-200/70 mb-4 relative z-10">Alertas de Manutenção (Próx. 7 dias):</p>
            <div className="space-y-3 relative z-10">
              {currentAiPredictions.length > 0 ? currentAiPredictions.map((pred) => (
                <div key={pred.id} className="p-4 rounded-xl border border-gray-200/60 dark:border-white/10 bg-gray-50 dark:bg-white/5  hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-white bg-slate-200 dark:bg-black/40 px-2 py-0.5 rounded border border-gray-300 dark:border-white/10 uppercase">{pred.plate}</span>
                    <span className="text-xs font-black text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-500/20">{pred.probability}% risco</span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-white font-semibold">{pred.component}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-fleet-300">Falha em {pred.daysLeft} dias</span>
                    <button className="text-xs font-bold bg-[#f1f5f9] dark:bg-white/10 text-slate-700 dark:text-white border border-gray-200 dark:border-white/20 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white hover:text-slate-800 dark:hover:text-gray-900 transition shadow-sm">
                      Agendar
                    </button>
                  </div>
                </div>
              )) : (
                <p className="text-center text-sm text-slate-400 dark:text-fleet-300 py-4">Sua frota não apresenta anomalias ou falhas iminentes no momento.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Real-time Alerts Feed */}
        <motion.div variants={itemVariants} className="bg-[#f1f5f9]  dark:bg-white/5  p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-fleet-500 dark:text-fleet-300" />
              Feed de Alertas
            </h3>
          </div>
          <div className="relative border-l-2 border-gray-200 dark:border-white/10 ml-3 space-y-6">
            {currentLiveAlerts.length > 0 ? currentLiveAlerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div key={alert.id} className="relative pl-6">
                  <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center ${alert.bg} shadow-sm border-2 border-white dark:border-fleet-800`}>
                    <Icon className={`w-4 h-4 ${alert.color}`} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-fleet-200 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/5">{alert.vehicle}</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-fleet-400">{alert.time}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{alert.title}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="pl-6 pt-2 pb-2">
                <p className="text-sm text-slate-400 dark:text-fleet-300">Nenhum alerta recente para sua frota.</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsAlertsModalOpen(true)}
            className="w-full mt-6 py-2.5 text-sm font-bold text-slate-700 dark:text-white bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition border border-gray-200 dark:border-white/10"
          >
            Ver Histórico Completo
          </button>
        </motion.div>

      </div>

      {/* Dynamic Modals for Expanded Data */}
      <Transition show={isDriversModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDriversModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 dark:bg-fleet-900/80  transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-[#f1f5f9]  dark:bg-fleet-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200/60 dark:border-white/10">
                  <div className="bg-[#f1f5f9]  dark:bg-fleet-800 px-6 pb-6 pt-5 sm:p-6 sm:pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-alert/10 dark:bg-alert/20 border border-alert/20 dark:border-alert/30 shadow-sm dark:shadow-inner">
                          <Trophy className="h-7 w-7 text-alert" aria-hidden="true" />
                        </div>
                        <div>
                          <DialogTitle as="h3" className="text-xl font-black leading-6 text-slate-800 dark:text-white">
                            Ranking Geral Fleet-Score
                          </DialogTitle>
                          <p className="text-sm font-medium text-slate-500 dark:text-fleet-200/70 mt-1">Pontuação atualizada ao vivo da frota.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-full p-2 bg-gray-50 dark:bg-white/5 text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none transition border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                        onClick={() => setIsDriversModalOpen(false)}
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    
                    <div className="mt-8 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                       {currentExtendedDrivers.length > 0 ? currentExtendedDrivers.map((driver, idx) => (
                        <div key={driver.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-200/60 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:border-fleet-300 dark:hover:border-fleet-400 hover:bg-gray-100 dark:hover:bg-white/10 transition hover:shadow-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400 dark:text-white/50 font-black w-4 text-right">{idx + 1}º</span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${driver.bg} ${driver.color} shrink-0 border border-white/50 dark:border-white/10`}>
                              {driver.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{driver.name}</p>
                              <p className="text-xs font-bold text-slate-500 dark:text-fleet-300 uppercase">LIGA {driver.badge}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-800 dark:text-white text-lg">{driver.score}</span>
                            <span className={`text-xs font-bold ml-1 px-1 py-0.5 rounded-md border ${driver.trend.startsWith('+') ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/20 border-green-200 dark:border-green-500/20' : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/20'}`}>({driver.trend})</span>
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-sm text-slate-400">Nenhum motorista pontuado.</p>
                      )}
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition show={isAlertsModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAlertsModalOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 dark:bg-fleet-900/80  transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-[#f1f5f9]  dark:bg-fleet-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl border border-gray-200/60 dark:border-white/10">
                  <div className="bg-[#f1f5f9]  dark:bg-fleet-800 px-6 pb-6 pt-5 sm:p-6 sm:pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 shadow-sm dark:shadow-inner">
                          <BellRing className="h-7 w-7 text-slate-700 dark:text-white" aria-hidden="true" />
                        </div>
                        <div>
                          <DialogTitle as="h3" className="text-xl font-black leading-6 text-slate-800 dark:text-white">
                            Histórico de Alertas
                          </DialogTitle>
                          <p className="text-sm font-medium text-slate-500 dark:text-fleet-200/70 mt-1">Timeline completa de eventos da telemetria.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-full p-2 bg-gray-50 dark:bg-white/5 text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none transition border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                        onClick={() => setIsAlertsModalOpen(false)}
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    
                    <div className="mt-8 relative border-l-2 border-gray-200 dark:border-white/10 ml-5 space-y-8 max-h-[60vh] overflow-y-auto pr-2 pb-4 pt-2 custom-scrollbar">
                       {currentExtendedAlerts.length > 0 ? currentExtendedAlerts.map((alert) => {
                         const Icon = alert.icon;
                         return (
                           <div key={alert.id} className="relative pl-8">
                             <div className={`absolute -left-[18px] top-0 w-9 h-9 rounded-full flex items-center justify-center ${alert.bg} ring-4 ring-white dark:ring-fleet-800 shadow-sm border border-white/50 dark:border-white/10`}>
                               <Icon className={`w-4 h-4 ${alert.color}`} />
                             </div>
                             <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-200/60 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer">
                               <div className="flex justify-between items-center mb-2">
                                 <span className="font-mono text-sm font-bold text-slate-600 dark:text-fleet-200 bg-[#f1f5f9]  dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 shadow-sm uppercase">{alert.vehicle}</span>
                                 <span className="text-xs font-bold text-slate-500 dark:text-fleet-400">{alert.time}</span>
                               </div>
                               <p className="text-base font-bold text-slate-800 dark:text-white mt-2">{alert.title}</p>
                               <div className="mt-4 flex gap-3">
                                <button className="text-xs font-bold px-4 py-2 bg-[#f1f5f9]  dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition text-slate-700 dark:text-white">Ignorar</button>
                                <button className="text-xs font-bold px-4 py-2 bg-fleet-600 dark:bg-fleet-500 text-white border border-transparent rounded-lg hover:bg-fleet-700 dark:hover:bg-fleet-400 transition shadow-sm">Ver Detalhes</button>
                               </div>
                             </div>
                           </div>
                         );
                       }) : (
                         <div className="pl-8 pt-4">
                           <p className="text-sm text-slate-400">Nenhum evento registrado no histórico.</p>
                         </div>
                       )}
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

    </motion.div>
  );
}
