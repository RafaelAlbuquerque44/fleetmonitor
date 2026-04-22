import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Zap, Factory, Trees, ArrowDownToLine, Droplets, Target, Award } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const mockCO2Data = [
  { month: 'Jul', co2: 800, meta: 850 },
  { month: 'Ago', co2: 750, meta: 800 },
  { month: 'Set', co2: 690, meta: 750 },
  { month: 'Out', co2: 620, meta: 700 },
  { month: 'Nov', co2: 580, meta: 650 },
  { month: 'Dez', co2: 450, meta: 600 },
];

const mockEfficiencyData = [
  { name: 'Volvo FH', performance: 92, fill: '#3b82f6' }, // blue-500
  { name: 'Scania R', performance: 85, fill: '#60a5fa' }, // blue-400
  { name: 'M.Benz Actros', performance: 78, fill: '#93c5fd' }, // blue-300
  { name: 'DAF XF', performance: 71, fill: '#bfdbfe' }, // blue-200
];

const mockEmissionsTypes = [
  { name: 'Combustão', value: 75, color: '#3b82f6' }, // blue-500
  { name: 'Ociosidade (Idling)', value: 15, color: '#eab308' }, // yellow-500
  { name: 'Manutenção Pobre', value: 10, color: '#ef4444' }, // red-500
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'geral' | 'frota'>('geral');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#f1f5f9]  dark:bg-white/5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 ">
              <Leaf className="w-8 h-8 text-fleet-400" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Relatórios ESG e Impacto</h1>
               <p className="text-slate-500 dark:text-fleet-200 mt-1 font-medium">Painel executivo de sustentabilidade, compensação ambiental e emissões.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="bg-[#f1f5f9]  dark:bg-white/5 backdrop-blur-sm p-1.5 rounded-2xl shadow-inner border border-gray-200 dark:border-white/10 flex w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('geral')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'geral' ? 'bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white shadow-sm border border-gray-300 dark:border-white/20' : 'text-slate-500 dark:text-fleet-200/70 hover:text-slate-800 dark:text-white hover:bg-white  dark:bg-white/5'}`}
            >
              Visão Geral
            </button>
            <button 
              onClick={() => setActiveTab('frota')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'frota' ? 'bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white shadow-sm border border-gray-300 dark:border-white/20' : 'text-slate-500 dark:text-fleet-200/70 hover:text-slate-800 dark:text-white hover:bg-white  dark:bg-white/5'}`}
            >
              Ranking Mensal
            </button>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 bg-fleet-500 text-slate-800 dark:text-white px-6 py-2.5 rounded-xl font-bold hover:bg-fleet-400 transition shadow-md shadow-fleet-500/20 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isExporting ? (
              <div className="h-5 w-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowDownToLine className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            )}
            Exportar PDF
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'geral' ? (
          <motion.div 
            key="geral"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pr-2"
          >
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-gradient-to-br from-indigo-50 to-fleet-50 dark:from-indigo-900 dark:to-fleet-800 rounded-3xl p-8 text-slate-800 dark:text-white shadow-lg dark:shadow-2xl relative overflow-hidden md:col-span-2 border border-indigo-100 dark:border-white/10 ">
                <Leaf className="absolute right-[-30px] bottom-[-30px] w-56 h-56 text-indigo-900/5 dark:text-white/5 mix-blend-overlay" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-indigo-800 dark:text-fleet-100 font-bold flex items-center gap-2 uppercase tracking-widest text-sm">
                       Atingimento da Meta Anual ESG <Target className="w-4 h-4"/>
                    </h3>
                    <div className="flex items-end gap-4 mt-3">
                      <p className="text-6xl font-black tracking-tighter text-indigo-950 dark:text-white">92<span className="text-4xl text-indigo-400 dark:text-fleet-200">%</span></p>
                      <div className="mb-2 bg-white/80 dark:bg-white/10 px-3 py-1.5 rounded-lg  border border-indigo-100 dark:border-white/20 shadow-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500 dark:text-yellow-400"/> 
                        <span className="text-sm font-bold tracking-wide text-indigo-900 dark:text-white">Selo Ouro Iminente</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right bg-indigo-900/5 dark:bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-indigo-100 dark:border-white/10">
                     <p className="text-xs text-indigo-500 dark:text-fleet-200 uppercase tracking-widest font-bold mb-0.5">Ano Base</p>
                     <p className="text-2xl font-black text-indigo-950 dark:text-white">2026</p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <div className="flex justify-between text-xs font-bold text-indigo-800 dark:text-fleet-100 mb-2 px-1 uppercase tracking-widest">
                     <span>Progresso Atualizado</span>
                     <span>Faltam 8% para Metas Q4</span>
                  </div>
                  <div className="w-full bg-indigo-900/10 dark:bg-black/30 rounded-full h-3 overflow-hidden  shadow-inner border border-indigo-100 dark:border-white/10">
                    <div className="bg-fleet-500 dark:bg-fleet-400 h-full rounded-full relative shadow-[0_0_10px_rgba(34,197,94,0.4)] dark:shadow-[0_0_15px_rgba(7ade80,0.5)] transition-all duration-1000 ease-out" style={{ width: '92%' }}>
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/60 w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f1f5f9]  dark:bg-white/5  rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-gray-300 dark:border-white/20 transition-colors">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#f1f5f9]  dark:bg-white/5 rounded-full group-hover:bg-gray-50 dark:bg-white/10 transition-colors duration-700 ease-out z-0"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <h3 className="text-slate-500 dark:text-fleet-200/80 font-bold text-xs uppercase tracking-widest">Redução de Emissões</h3>
                    <div className="p-2 bg-gray-50 dark:bg-white/10 rounded-lg text-slate-800 dark:text-white group-hover:bg-white/20 transition-colors border border-transparent group-hover:border-gray-200 dark:border-white/10">
                       <Factory className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-slate-800 dark:text-white mt-2 tracking-tight">12.4 <span className="text-lg font-bold text-slate-500 dark:text-fleet-200/60">Ton CO₂</span></p>
                  <div className="mt-4">
                     <span className="text-xs text-green-300 font-black bg-green-500/20 border border-green-500/30 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-sm">
                       <ArrowDownToLine className="w-3.5 h-3.5"/> 15% vs 2025
                     </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f1f5f9]  dark:bg-white/5  rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/5 rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700 ease-out z-0"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <h3 className="text-slate-500 dark:text-fleet-200/80 font-bold text-xs uppercase tracking-widest">Compensação Mensal</h3>
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors">
                       <Trees className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-slate-800 dark:text-white mt-2 tracking-tight">620 <span className="text-lg font-bold text-slate-500 dark:text-fleet-200/60">Árvores</span></p>
                  <div className="mt-4">
                     <span className="text-xs text-emerald-300 font-black bg-emerald-500/20 border border-emerald-500/30 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg shadow-sm">
                       Equivalente Plantado
                     </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#f1f5f9]  dark:bg-white/5  rounded-3xl p-8 shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 lg:col-span-2">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                     <div className="p-2 bg-gray-50 dark:bg-white/10 rounded-lg text-slate-800 dark:text-white border border-transparent shadow-inner">
                        <Factory className="w-5 h-5" />
                     </div>
                     Histórico de Emissões vs Meta (H2)
                   </h3>
                   <select className="text-sm font-bold bg-[#f1f5f9] dark:bg-fleet-900 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-fleet-500 cursor-pointer">
                     <option>Últimos 6 Meses</option>
                     <option>Último Ano</option>
                   </select>
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockCO2Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', backgroundColor: '#1E3A8A', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', fontWeight: 'bold', padding: '12px 16px' }}
                        cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" name="Emissões (Ton)" dataKey="co2" stroke="#60a5fa" strokeWidth={4} fillOpacity={1} fill="url(#colorCo2)" />
                      <Area type="step" name="Meta Limite" dataKey="meta" stroke="#f87171" strokeWidth={3} strokeDasharray="6 6" fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#f1f5f9]  dark:bg-white/5  rounded-3xl p-8 shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gray-50 dark:bg-white/10 rounded-lg text-slate-800 dark:text-white border border-transparent shadow-inner">
                     <PieChart className="w-5 h-5" />
                  </div>
                  Fontes de Emissão
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
                   <div className="absolute inset-0">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={mockEmissionsTypes}
                           cx="50%"
                           cy="50%"
                           innerRadius={75}
                           outerRadius={95}
                           paddingAngle={4}
                           dataKey="value"
                           stroke="none"
                         >
                           {mockEmissionsTypes.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#1E3A8A', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">100%</span>
                     <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-fleet-200/60">Mapeado</span>
                   </div>
                </div>
                
                <div className="mt-8 space-y-4">
                  {mockEmissionsTypes.map(item => (
                    <div key={item.name} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: item.color }}></div>
                        <span className="font-bold text-slate-700 dark:text-fleet-100">{item.name}</span>
                      </div>
                      <span className="font-black text-slate-800 dark:text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="frota"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pr-2"
          >
            <div className="bg-[#f1f5f9]  dark:bg-white/5  rounded-3xl p-8 shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10">
               <div className="flex justify-between items-center mb-10">
                 <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                     <div className="p-2 bg-fleet-500/20 rounded-xl text-slate-600 dark:text-fleet-300 border border-fleet-500/30 shadow-inner">
                        <Award className="w-6 h-6" />
                     </div>
                     Ranking de Eficiência H2
                   </h3>
                   <p className="text-sm font-medium text-slate-500 dark:text-fleet-200/80 mt-2">Comparativo de performance ambiental (km/L e emissões) por linha de montagem e modelo.</p>
                 </div>
               </div>
               
               <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={mockEfficiencyData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis type="number" domain={[0, 100]} hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontWeight: 900, fontSize: 13 }} width={140} />
                     <Tooltip 
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                       contentStyle={{ borderRadius: '12px', backgroundColor: '#1E3A8A', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', fontWeight: 'bold', padding: '12px 16px' }}
                       itemStyle={{ color: '#fff' }}
                       formatter={(value: any) => [`${value}% Eficiência Global`, 'Performance']}
                     />
                     <Bar dataKey="performance" radius={[0, 8, 8, 0]} barSize={40}>
                       {
                         mockEfficiencyData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))
                       }
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-500/20 rounded-3xl p-8 relative overflow-hidden group hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors ">
                <Droplets className="absolute -right-10 -bottom-10 w-48 h-48 text-blue-500/10 dark:text-blue-500/30 group-hover:scale-110 transition-transform duration-700 ease-out" />
                <h3 className="text-xl font-black text-blue-800 dark:text-blue-300 mb-3 tracking-tight">Desperdício de Combustível</h3>
                <p className="text-sm font-medium text-blue-900/70 dark:text-blue-100/80 mb-6 max-w-sm leading-relaxed">
                  Cerca de 15% das emissões da frota vêm de veículos ociosos com o motor ligado. Considere implementar a ferramenta de <strong className="text-blue-950 dark:text-white">Desligamento Automático Inteligente</strong> através da configuração no painel do administrador.
                </p>
                <button className="text-sm font-black bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 px-6 py-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-blue-300 dark:border-blue-500/30">
                  Ver Recomendações
                </button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-500/20 rounded-3xl p-8 relative overflow-hidden group hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors ">
                <Zap className="absolute -right-10 -bottom-10 w-48 h-48 text-yellow-500/10 dark:text-yellow-500/30 group-hover:scale-110 transition-transform duration-700 ease-out" />
                <h3 className="text-xl font-black text-yellow-800 dark:text-yellow-400 mb-3 tracking-tight">Potencial de Eletrificação (EVs)</h3>
                <p className="text-sm font-medium text-yellow-900/70 dark:text-yellow-100/80 mb-6 max-w-sm leading-relaxed">
                  Baseado nas rotas urbanas curtas (abaixo de 100km/dia) na região de SP, <strong className="text-yellow-950 dark:text-white">4 caminhões DAF XF</strong> podem ser substituídos por modelos elétricos com ROI em 24 meses corporativo.
                </p>
                <button className="text-sm font-black bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-6 py-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-yellow-300 dark:border-yellow-500/30">
                  Simular Transição EV
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
