import { useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import type { Variants } from 'framer-motion';
import { 
  ArrowRightCircle, 
  ArrowLeftCircle, 
  Wrench, 
  X,
  History,
  CarFront
} from 'lucide-react';
import { useVehicles } from '../lib/VehicleContext';
import type { Vehicle } from '../lib/VehicleContext';
import { useDrivers } from '../lib/DriverContext';

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

export default function Portaria() {
  const { vehicles, registrarSaida, registrarRetorno, registrarChegadaDestino, registrarSaidaDestino } = useVehicles();
  const { drivers } = useDrivers();
  
  // Controle de Pátio States
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSaidaModalOpen, setIsSaidaModalOpen] = useState(false);
  const [isRetornoModalOpen, setIsRetornoModalOpen] = useState(false);
  const [novoKm, setNovoKm] = useState('');
  const [saidaKm, setSaidaKm] = useState('');
  const [saidaMotorista, setSaidaMotorista] = useState('');
  const [saidaDestino, setSaidaDestino] = useState('');
  const [maintenanceAlert, setMaintenanceAlert] = useState<{ plate: string; tasks: string[] } | null>(null);
  
  const [portariaHistory, setPortariaHistory] = useState<{ id: number, type: 'saida' | 'retorno' | 'chegada' | 'saida_destino', plate: string, time: string, details: string }[]>([
    { id: 1, type: 'saida', plate: 'ABC-1234', time: '10:30', details: 'Saída p/ Rota Sul' },
    { id: 2, type: 'retorno', plate: 'XYZ-9876', time: '09:15', details: 'Retornou c/ 198.000km' },
    { id: 3, type: 'saida', plate: 'DEF-5678', time: '08:00', details: 'Saída p/ Cliente X' }
  ]);

  const handleRegistrarSaida = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle && saidaKm) {
      const parsedSaidaKm = parseInt(saidaKm);
      registrarSaida(selectedVehicle.id, parsedSaidaKm);
      
      setPortariaHistory(prev => [{
        id: Date.now(), 
        type: 'saida' as const, 
        plate: selectedVehicle.plate, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        details: `Saída p/ ${saidaDestino}`
      }, ...prev].slice(0, 10));
      
      setIsSaidaModalOpen(false);
      setSaidaMotorista('');
      setSaidaDestino('');
      setSaidaKm('');
    }
  };

  const handleRegistrarRetorno = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle && novoKm) {
      const currentKm = selectedVehicle.kmAtual || 0;
      const parsedNovoKm = parseInt(novoKm);
      
      if (parsedNovoKm >= currentKm) {
        registrarRetorno(selectedVehicle.id, parsedNovoKm);
        
        setPortariaHistory(prev => [{
          id: Date.now(), 
          type: 'retorno' as const, 
          plate: selectedVehicle.plate, 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
          details: `Retornou c/ ${parsedNovoKm}km`
        }, ...prev].slice(0, 10));
        
        const crossed10k = Math.floor(parsedNovoKm / 10000) > Math.floor(currentKm / 10000);
        const crossed50k = Math.floor(parsedNovoKm / 50000) > Math.floor(currentKm / 50000);
        
        const tasks: string[] = [];
        if (crossed10k) tasks.push('Troca de Óleo e Filtros');
        if (crossed50k) tasks.push('Verificação de Discos e Pastilhas de Freio', 'Alinhamento e Balanceamento');
        
        if (tasks.length > 0) {
          setMaintenanceAlert({ plate: selectedVehicle.plate, tasks });
        }
        
        setIsRetornoModalOpen(false);
        setNovoKm('');
      } else {
        alert('O KM de retorno deve ser maior ou igual ao KM de saída.');
      }
    }
  };
  
  const handleChegadaDestino = (vehicle: Vehicle) => {
    registrarChegadaDestino(vehicle.id);
    setPortariaHistory(prev => [{
      id: Date.now(), 
      type: 'chegada' as const, 
      plate: vehicle.plate, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      details: 'Chegou no destino'
    }, ...prev].slice(0, 10));
  };

  const handleSaidaDestino = (vehicle: Vehicle) => {
    registrarSaidaDestino(vehicle.id);
    setPortariaHistory(prev => [{
      id: Date.now(), 
      type: 'saida_destino' as const, 
      plate: vehicle.plate, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      details: 'Retornando p/ Central'
    }, ...prev].slice(0, 10));
  };

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
            Gestão de Pátio e Portaria
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-fleet-200 mt-1 font-medium transition-colors duration-500"
          >
            Controle de entrada e saída, liberação de veículos e monitoramento de frota.
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo - Painel de Controle de Veículos (Ocupa 2 colunas na grade) */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="bg-[#f1f5f9] dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <CarFront className="w-5 h-5 text-fleet-500" />
              Liberação e Controle de Veículos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-bold text-slate-700 dark:text-white bg-slate-100 dark:bg-black/40 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 uppercase">
                        {vehicle.plate}
                      </span>
                      {vehicle.statusPatio === 'em_rota' ? (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">Em Rota (Ida)</span>
                      ) : vehicle.statusPatio === 'no_destino' ? (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">No Destino</span>
                      ) : vehicle.statusPatio === 'retornando' ? (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded">Em Rota (Retorno)</span>
                      ) : (
                        <span className="text-xs font-bold text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded">No Pátio</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{vehicle.model}</p>
                    <p className="text-xs text-slate-500 dark:text-fleet-300 mb-4">KM Atual: <span className="font-bold">{vehicle.kmAtual?.toLocaleString('pt-BR') || 'N/D'}</span> km</p>
                  </div>
                  
                  <div className="mt-auto">
                    {vehicle.statusPatio === 'em_rota' ? (
                      <button 
                        onClick={() => handleChegadaDestino(vehicle)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowRightCircle className="w-4 h-4" /> Chegou no Destino
                      </button>
                    ) : vehicle.statusPatio === 'no_destino' ? (
                      <button 
                        onClick={() => handleSaidaDestino(vehicle)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowLeftCircle className="w-4 h-4" /> Saindo p/ Central
                      </button>
                    ) : vehicle.statusPatio === 'retornando' ? (
                      <button 
                        onClick={() => { setSelectedVehicle(vehicle); setIsRetornoModalOpen(true); }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowLeftCircle className="w-4 h-4" /> Retornou (Central)
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setSelectedVehicle(vehicle); setSaidaKm(vehicle.kmAtual?.toString() || ''); setIsSaidaModalOpen(true); }}
                        className="w-full py-2 bg-slate-800 dark:bg-white/10 hover:bg-slate-700 dark:hover:bg-white/20 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowRightCircle className="w-4 h-4" /> Saiu p/ Destino
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Lado Direito - Histórico de Portaria (Ocupa 1 coluna na grade) */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div variants={itemVariants} className="bg-[#f1f5f9] dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200/60 dark:border-white/10 h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-fleet-500" />
              Histórico Recente
            </h3>
            
            <div className="space-y-4">
              {portariaHistory.length > 0 ? portariaHistory.map(history => (
                <div key={history.id} className="p-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-start gap-3 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    history.type === 'saida' ? 'bg-slate-800 dark:bg-white/30' : 
                    history.type === 'chegada' ? 'bg-amber-500' :
                    history.type === 'saida_destino' ? 'bg-indigo-500' :
                    'bg-blue-500'
                  }`}></div>
                  
                  <div className="flex-1 ml-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-white uppercase bg-slate-100 dark:bg-black/30 px-1.5 py-0.5 rounded">
                        {history.plate}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-fleet-300/80">{history.time}</span>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-fleet-100/90 font-medium leading-snug">{history.details}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 dark:text-fleet-200">Nenhum registro hoje.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Registro de Saída */}
      <Dialog open={isSaidaModalOpen} onClose={() => setIsSaidaModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-fleet-800 p-6 shadow-2xl border border-gray-200 dark:border-white/10">
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <ArrowRightCircle className="w-5 h-5 text-fleet-500" />
              Registrar Saída - {selectedVehicle?.plate}
            </DialogTitle>
            <form onSubmit={handleRegistrarSaida} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-fleet-200 mb-1">KM Atual de Saída</label>
                <input type="number" required value={saidaKm} onChange={e => setSaidaKm(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-fleet-200 mb-1">Motorista Responsável</label>
                <select required value={saidaMotorista} onChange={e => setSaidaMotorista(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white">
                  <option value="">Selecione o motorista</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-fleet-200 mb-1">Destino</label>
                <input type="text" required value={saidaDestino} onChange={e => setSaidaDestino(e.target.value)} placeholder="Ex: Rota Sul / Cliente X" className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsSaidaModalOpen(false)} className="flex-1 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold rounded-lg transition">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-fleet-600 hover:bg-fleet-700 text-white font-bold rounded-lg transition">Confirmar Saída</button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal de Registro de Retorno */}
      <Dialog open={isRetornoModalOpen} onClose={() => setIsRetornoModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-fleet-800 p-6 shadow-2xl border border-gray-200 dark:border-white/10">
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <ArrowLeftCircle className="w-5 h-5 text-blue-500" />
              Registrar Retorno - {selectedVehicle?.plate}
            </DialogTitle>
            <form onSubmit={handleRegistrarRetorno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-fleet-200 mb-1">KM de Saída</label>
                <input type="text" disabled value={selectedVehicle?.kmAtual || ''} className="w-full px-3 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-fleet-300 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-fleet-200 mb-1">Novo KM (Hodômetro Atual)</label>
                <input type="number" required min={selectedVehicle?.kmAtual || 0} value={novoKm} onChange={e => setNovoKm(e.target.value)} placeholder="Ex: 15500" className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white font-mono" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsRetornoModalOpen(false)} className="flex-1 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold rounded-lg transition">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">Confirmar Retorno</button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Alerta de Manutenção (Toast) */}
      <Transition show={maintenanceAlert !== null} as={Fragment}>
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white dark:bg-fleet-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-500/20 overflow-hidden transform transition-all duration-300">
          <div className="bg-red-50 dark:bg-red-500/10 p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300">Atenção Necessária!</h4>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">Veículo {maintenanceAlert?.plate} atingiu a marca de revisão.</p>
                </div>
              </div>
              <button onClick={() => setMaintenanceAlert(null)} className="text-red-400 hover:text-red-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 bg-white dark:bg-black/20 rounded-lg p-3 border border-red-100 dark:border-red-500/10">
              <p className="text-sm font-semibold text-slate-700 dark:text-fleet-200 mb-2">Ações recomendadas:</p>
              <ul className="list-disc pl-5 space-y-1">
                {maintenanceAlert?.tasks.map((task, idx) => (
                  <li key={idx} className="text-sm font-medium text-slate-600 dark:text-fleet-300">{task}</li>
                ))}
              </ul>
              <button onClick={() => setMaintenanceAlert(null)} className="mt-3 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition">
                Agendar Oficina
              </button>
            </div>
          </div>
        </div>
      </Transition>

    </motion.div>
  );
}
