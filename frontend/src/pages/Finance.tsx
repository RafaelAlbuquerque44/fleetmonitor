
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Landmark, 
  Banknote,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { useVehicles } from '../lib/VehicleContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Finance() {
  const { vehicles } = useVehicles();
  const { theme } = useTheme();

  // Basic Financial Global Calc
  const totalPurchasePrice = vehicles.reduce((sum, v) => sum + (v.purchasePrice || 0), 0);
  const totalRevenue = vehicles.reduce((sum, v) => sum + (v.monthlyRevenue || 0), 0);
  const totalMaintenance = vehicles.reduce((sum, v) => sum + (v.monthlyMaintenance || 0), 0);
  const totalFuel = vehicles.reduce((sum, v) => sum + (v.monthlyFuel || 0), 0);
  
  const totalCosts = totalMaintenance + totalFuel;
  const netProfit = totalRevenue - totalCosts;
  const globalROI = totalPurchasePrice > 0 ? (netProfit / totalPurchasePrice) * 100 : 0;

  // Formatting utils
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Prepare data for BarChart
  const chartData = vehicles.map(v => {
    const revenue = v.monthlyRevenue || 0;
    const cost = (v.monthlyMaintenance || 0) + (v.monthlyFuel || 0);
    return {
      plate: v.plate,
      Receita: revenue,
      Custo: cost,
      Lucro: revenue - cost
    };
  }).filter(v => v.Receita > 0 || v.Custo > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black text-slate-800 dark:text-white tracking-tight transition-colors duration-500"
          >
            Controle Financeiro
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-fleet-200 mt-1 font-medium transition-colors duration-500"
          >
            Análise consolidada de lucro líquido e custo operacional da frota.
          </motion.p>
        </div>
        <div className="mt-4 md:mt-0">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 bg-fleet-600 dark:bg-fleet-500 text-sm font-bold rounded-xl text-white hover:bg-fleet-700 dark:hover:bg-fleet-400 transition shadow-[0_2px_10px_rgba(34,197,94,0.3)]"
          >
            Exportar Fechamento
          </motion.button>
        </div>
      </div>

      {/* Financial Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white rounded-xl">
              <Landmark className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">Ativos Totais</span>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1">Preço de Aquisição</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{formatCurrency(totalPurchasePrice)}</h3>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">Mensal</span>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1">Faturamento Bruto</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{formatCurrency(totalRevenue)}</h3>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">Mensal</span>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1">Custos Operacionais</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{formatCurrency(totalCosts)}</h3>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-fleet-500/10 dark:bg-fleet-500/20 rounded-full blur-2xl group-hover:bg-fleet-500/20 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${netProfit >= 0 ? 'bg-fleet-50 dark:bg-fleet-500/20 text-fleet-600 dark:text-fleet-400' : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
              <Banknote className="w-6 h-6" />
            </div>
            {globalROI > 0 && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3"/> ROI {globalROI.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-fleet-200 uppercase tracking-widest mb-1 relative z-10">Lucro Líquido</p>
          <h3 className={`text-2xl font-black tracking-tight relative z-10 ${netProfit >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(netProfit)}
          </h3>
        </motion.div>
      </div>

      {/* Main Bar Chart: Revenue vs Costs */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
           Gasto vs Lucratividade por Veículo
           <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-white/10 border border-gray-200 dark:border-white/5 text-slate-600 dark:text-fleet-200 rounded-md font-semibold">Mensal</span>
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
              <XAxis dataKey="plate" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600, fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600, fontSize: 12}} dx={-10} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip 
                cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}}
                contentStyle={{ borderRadius: '12px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', background: theme === 'dark' ? '#1e293b' : '#ffffff', color: theme === 'dark' ? '#fff' : '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => formatCurrency(val)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="Custo" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Detail Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-white/5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-200/60 dark:border-white/10">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-500" />
            Análise Individual de Veículos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-wider">Veículo</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-wider">Aquisição</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-wider text-right">Faturamento</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-wider text-right">Custos (M/C)</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-wider text-right">Lucratividade</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const revenue = v.monthlyRevenue || 0;
                const cost = (v.monthlyMaintenance || 0) + (v.monthlyFuel || 0);
                const profit = revenue - cost;
                
                return (
                  <tr key={v.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10">
                           <Car className="w-5 h-5 text-slate-500 dark:text-white/70" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{v.plate}</p>
                          <p className="text-xs text-slate-500 dark:text-fleet-300">{v.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-white/70">
                      {v.purchasePrice ? formatCurrency(v.purchasePrice) : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(revenue)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-red-500 dark:text-red-400">
                      {formatCurrency(cost)}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-800 dark:text-white">
                      {formatCurrency(profit)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        {profit > 10000 ? (
                          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
                            Alto Lucro
                          </span>
                        ) : profit > 0 ? (
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                             Margem Baixa
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200 dark:border-red-500/20">
                            <AlertTriangle className="w-3 h-3"/> Prejuízo
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Temporary icon to avoid importing issue since I didn't import Car at the top
function Car(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}
