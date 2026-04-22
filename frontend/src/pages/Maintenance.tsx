import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, AlertTriangle, ShieldCheck, Cpu, ArrowRight, Calendar, CheckCircle2, Factory } from 'lucide-react';
import { useVehicles } from '../lib/VehicleContext';

const mockPredictiveAlerts = [
  { id: 1, plate: 'XYZ-9876', model: 'Scania R450', issue: 'Aviso Pneu Dianteiro Esquerdo', risk: 'high', chance: 85, costPrevention: 450, costCorrective: 2300, daysLeft: 3 },
  { id: 2, plate: 'GHI-9012', model: 'Volvo FH 460', issue: 'Baixa Pressão Óleo Motor', risk: 'medium', chance: 65, costPrevention: 200, costCorrective: 8900, daysLeft: 7 },
  { id: 3, plate: 'DEF-5678', model: 'Mercedes Actros', issue: 'Desgaste Pastilha Freio Traseiro', risk: 'low', chance: 40, costPrevention: 350, costCorrective: 1100, daysLeft: 14 },
];

export default function Maintenance() {
  const { vehicles } = useVehicles();
  const [activeBoard, setActiveBoard] = useState<'preditiva' | 'ordens'>('preditiva');

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
              <Cpu className="w-8 h-8 text-fleet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Manutenção AI</h1>
              <p className="text-slate-500 dark:text-fleet-200 mt-1 font-medium">Previsão de falhas e controle de O.S guiado por Machine Learning.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="bg-[#f1f5f9]  dark:bg-white/5 backdrop-blur-sm p-1.5 rounded-2xl shadow-inner border border-gray-200 dark:border-white/10 flex w-full sm:w-auto">
            <button 
              onClick={() => setActiveBoard('preditiva')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeBoard === 'preditiva' ? 'bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white shadow-sm border border-gray-300 dark:border-white/20' : 'text-slate-500 dark:text-fleet-200/70 hover:text-slate-800 dark:text-white hover:bg-white  dark:bg-white/5'}`}
            >
              <Cpu className="w-5 h-5"/> Preditiva
            </button>
            <button 
              onClick={() => setActiveBoard('ordens')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeBoard === 'ordens' ? 'bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white shadow-sm border border-gray-300 dark:border-white/20' : 'text-slate-500 dark:text-fleet-200/70 hover:text-slate-800 dark:text-white hover:bg-white  dark:bg-white/5'}`}
            >
              <Wrench className="w-5 h-5"/> Execução
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeBoard === 'preditiva' ? (
          <motion.div 
            key="preditiva"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pr-2"
          >
            {/* Machine Learning Status Banner */}
            <div className="relative bg-gradient-to-br from-indigo-50 to-fleet-50 dark:from-indigo-900 dark:to-fleet-800 rounded-3xl p-8 text-slate-800 dark:text-white shadow-lg dark:shadow-2xl overflow-hidden border border-indigo-100 dark:border-white/10  transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/80 dark:bg-white/10  rounded-2xl border border-indigo-100 dark:border-white/20 shadow-sm dark:shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-fleet-100" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-indigo-900 dark:text-white">Motor de Previsão FleetAI™</h3>
                    <p className="text-indigo-700 dark:text-fleet-100 font-medium mt-1">Analisando 1.2M de pontos de dados telemétricos dinâmicos.</p>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm px-6 py-4 rounded-2xl border border-indigo-100 dark:border-white/10 w-full md:w-auto text-center md:text-right shadow-sm dark:shadow-inner">
                  <p className="text-indigo-600 dark:text-fleet-200 text-xs font-bold uppercase tracking-widest mb-1">Economia Prevista (YTD)</p>
                  <p className="text-4xl font-black text-indigo-950 dark:text-white">R$ 145.2<span className="text-2xl text-indigo-400 dark:text-fleet-200">K</span></p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-3 mt-8">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-fleet-400" />
                 Linha do Tempo de Risco Iminente
              </h2>
              <span className="text-sm font-bold text-slate-500 dark:text-fleet-200 bg-[#f1f5f9]  dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm">Próximos 15 dias</span>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockPredictiveAlerts.map((alert, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={alert.id} 
                  className="bg-[#f1f5f9]  dark:bg-white/5  rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className={`h-2.5 w-full ${alert.risk === 'high' ? 'bg-red-500' : alert.risk === 'medium' ? 'bg-yellow-400' : 'bg-fleet-400'}`}></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white text-2xl tracking-tight uppercase group-hover:text-slate-600 dark:text-fleet-300 transition-colors">{alert.plate}</h4>
                        <p className="text-sm font-bold text-slate-500 dark:text-fleet-200/60 mt-1">{alert.model}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm border ${
                        alert.risk === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                        alert.risk === 'medium' ? 'bg-alert/20 text-yellow-300 border-alert/30' : 
                        'bg-fleet-500/20 text-slate-600 dark:text-fleet-300 border-fleet-500/30'
                      }`}>
                        {alert.chance}% RISCO
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 mb-6 bg-[#f1f5f9]  dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-inner">
                      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.risk === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
                      <span className="text-sm font-black text-slate-800 dark:text-white leading-tight">{alert.issue}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 dark:border-white/10 pb-3">
                        <span className="font-bold text-slate-500 dark:text-fleet-200/70">Bloqueio Crítico em:</span>
                        <span className="font-black text-slate-800 dark:text-white flex items-center gap-1.5 bg-gray-50 dark:bg-white/10 px-2 py-1 rounded shadow-sm border border-white/5">
                          <Calendar className="w-4 h-4 text-slate-600 dark:text-fleet-300" /> ~{alert.daysLeft} dias
                        </span>
                      </div>
                      
                      <div className="bg-[#f1f5f9]  dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-fleet-200/60 mb-2">
                          <span>Prevenção (Hoje)</span>
                          <span>Corretiva (Falha)</span>
                        </div>
                        <div className="flex justify-between items-center font-black text-lg">
                          <span className="text-green-400">R$ {alert.costPrevention}</span>
                          <ArrowRight className="w-5 h-5 text-slate-800 dark:text-white/20 mx-2" />
                          <span className="text-red-400">R$ {alert.costCorrective}</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-6 bg-fleet-500 text-slate-800 dark:text-white py-3.5 rounded-xl text-sm font-bold shadow-md shadow-fleet-500/20 hover:bg-fleet-400 transition-all">
                      Agendar Oficina Agora
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="ordens"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="bg-[#f1f5f9]  dark:bg-white/5  rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 p-8 h-full flex flex-col overflow-hidden">
              <div className="text-center mb-8 shrink-0">
                <div className="mx-auto w-20 h-20 bg-gray-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-5 border border-gray-300 dark:border-white/20 shadow-inner">
                   <Factory className="w-10 h-10 text-fleet-400" />
                </div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Quadro Kanban de Oficina</h3>
                <p className="text-slate-500 dark:text-fleet-200 font-medium max-w-lg mx-auto">Arraste e solte os veículos entre as colunas para atualizar seu status operacional em tempo real por todo o sistema.</p>
              </div>
              
              {/* Kanban layout mock */}
              <div className="flex flex-col lg:flex-row gap-6 mx-auto w-full max-w-6xl text-left flex-1 min-h-0 overflow-y-auto lg:overflow-visible custom-scrollbar">
                {/* Col 1 */}
                <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-3xl p-5 border border-gray-200 dark:border-white/10 shadow-inner flex flex-col">
                  <h4 className="font-black text-slate-800 dark:text-white flex justify-between items-center mb-5 text-lg">
                    Fila de Oficina <span className="text-sm font-bold bg-[#f1f5f9] dark:bg-white/20 text-slate-800 dark:text-white w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">1</span>
                  </h4>
                  <div className="flex-1 space-y-4">
                     <div className="bg-[#f1f5f9]  dark:bg-fleet-800/80  p-5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 overflow-hidden relative cursor-grab hover:border-white/30 hover:shadow-lg transition-all group">
                       <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                       <div className="flex justify-between items-start mb-3 pl-2">
                         <span className="text-[10px] font-black px-2 py-1 bg-red-500/20 text-red-300 rounded uppercase tracking-widest border border-red-500/20">Urgente</span>
                         <span className="text-xs font-bold text-slate-800 dark:text-white/50 bg-black/20 px-2 py-1 rounded shadow-inner">OS-1029</span>
                       </div>
                       <p className="font-black text-slate-800 dark:text-white text-2xl pl-2 group-hover:text-slate-600 dark:text-fleet-300 transition-colors">XYZ-9876</p>
                       <p className="text-sm font-bold text-slate-500 dark:text-fleet-200/70 mt-1 pl-2">Aviso Pneu Dianteiro - IA</p>
                     </div>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="flex-1 bg-yellow-50 dark:bg-yellow-500/10 rounded-3xl p-5 border border-yellow-200 dark:border-yellow-500/20 shadow-inner flex flex-col">
                  <h4 className="font-black text-yellow-600 dark:text-yellow-500 flex justify-between items-center mb-5 text-lg drop-shadow-sm">
                    Em Manutenção <span className="text-sm font-bold bg-[#f1f5f9] dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 w-8 h-8 rounded-full flex items-center justify-center border border-yellow-200 dark:border-yellow-500/20 shadow-sm dark:shadow-none">{vehicles.filter(v => v.status === 'maintenance').length}</span>
                  </h4>
                  <div className="flex-1 space-y-4">
                    {vehicles.filter(v => v.status === 'maintenance').map(v => (
                      <div key={v.id} className="bg-[#f1f5f9]  dark:bg-fleet-800/80  p-5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 overflow-hidden relative cursor-grab hover:border-yellow-400/50 hover:shadow-lg transition-all group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500"></div>
                        <div className="flex justify-between items-start mb-3 pl-2">
                          <span className="text-[10px] font-black px-2 py-1 bg-blue-500/20 text-blue-300 rounded uppercase tracking-widest border border-blue-500/20">Serviço Oficina</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white/50 bg-black/20 px-2 py-1 rounded shadow-inner">OS-{v.id + 1000}</span>
                        </div>
                        <p className="font-black text-slate-800 dark:text-white text-2xl pl-2 group-hover:text-yellow-400 transition-colors">{v.plate}</p>
                        <p className="text-sm font-bold text-slate-500 dark:text-fleet-200/70 mt-1 pl-2">{v.maintenanceDetails || 'Manutenção em andamento'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 3 */}
                <div className="flex-1 bg-green-50 dark:bg-green-500/10 rounded-3xl p-5 border border-green-200 dark:border-green-500/20 shadow-inner flex flex-col">
                  <h4 className="font-black text-green-600 dark:text-green-400 flex justify-between items-center mb-5 text-lg drop-shadow-sm">
                    Liberado <span className="text-sm font-bold bg-[#f1f5f9] dark:bg-green-500/20 text-green-600 dark:text-green-400 w-8 h-8 rounded-full flex items-center justify-center border border-green-200 dark:border-green-500/20 shadow-sm dark:shadow-none">0</span>
                  </h4>
                  <div className="flex-1 border-2 border-dashed border-green-300 dark:border-green-500/30 rounded-2xl flex flex-col items-center justify-center text-sm font-bold text-green-500/50 dark:text-green-400/50 bg-green-100/30 dark:bg-green-500/5">
                     <CheckCircle2 className="w-10 h-10 mb-3 opacity-50" />
                     Arraste cards para cá
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
