import React, { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Award, ShieldAlert, BadgeCheck, Edit2, Trash2, X, Phone, User, AlertTriangle, UserMinus } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import type { Variants } from 'framer-motion';
import { useDrivers } from '../lib/DriverContext';
import type { Driver } from '../lib/DriverContext';

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

export default function Drivers() {
  const { drivers, addDriver, removeDriver, updateDriver } = useDrivers();
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [cnh, setCnh] = useState('');
  const [category, setCategory] = useState('B');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'vacation' | 'inactive'>('active');
  const [tier, setTier] = useState<'Gold' | 'Silver' | 'Bronze' | 'Atenção'>('Bronze');

  const openNewDriver = () => {
    setEditingId(null);
    setName(''); setCnh(''); setCategory('B'); setPhone(''); setStatus('active'); setTier('Bronze');
    setIsSlideOverOpen(true);
  };

  const openEditDriver = (driver: Driver) => {
    setEditingId(driver.id);
    setName(driver.name);
    setCnh(driver.cnh);
    setCategory(driver.category);
    setPhone(driver.phone);
    setStatus(driver.status);
    setTier(driver.tier);
    setIsSlideOverOpen(true);
  };

  const handleDelete = (id: number, nameStr: string) => {
    if (window.confirm(`Tem certeza que deseja remover o motorista ${nameStr}?`)) {
      removeDriver(id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId !== null) {
        updateDriver(editingId, { name, cnh, category, phone, status, tier });
      } else {
        const newDriver: Driver = {
          id: drivers.length > 0 ? Math.max(...drivers.map(d => d.id)) + 1 : 1,
          name,
          cnh,
          category,
          phone,
          status,
          tier,
          score: 100 // New drivers start at 100
        };
        addDriver(newDriver);
      }
      setIsSlideOverOpen(false);
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar motorista");
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black text-slate-800 dark:text-white tracking-tight"
          >
            Motoristas e Ranking
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-fleet-200 mt-1 font-medium"
          >
            Visualize o engajamento e a pontuação EcoScore de sua equipe.
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openNewDriver}
          className="flex items-center gap-2 bg-fleet-500 text-slate-800 dark:text-white px-5 py-2.5 rounded-xl font-bold hover:bg-fleet-400 transition shadow-md shadow-fleet-500/20"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Novo Motorista
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {drivers.map((driver) => (
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              key={driver.id} 
              className="bg-[#f1f5f9]  dark:bg-white/5 rounded-2xl p-6 shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 hover:shadow-xl hover:shadow-fleet-500/5 transition-all relative group overflow-hidden "
            >
              {/* Decorative background blur */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#f1f5f9]  dark:bg-white/5 rounded-full blur-2xl group-hover:bg-gray-50 dark:bg-white/10 transition-colors"></div>

              <div className="absolute top-5 right-5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <button onClick={() => openEditDriver(driver)} className="p-2 text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:text-white rounded-lg hover:bg-gray-50 dark:bg-white/10 transition border border-transparent hover:border-gray-200 dark:border-white/10">
                   <Edit2 className="w-4 h-4" />
                 </button>
                 <button onClick={() => handleDelete(driver.id, driver.name)} className="p-2 text-slate-500 dark:text-fleet-200 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl font-black text-2xl shadow-sm border ${
                  driver.status === 'active' ? 'bg-gray-50 dark:bg-white/10 border-gray-300 dark:border-white/20 text-slate-800 dark:text-white' : 
                  driver.status === 'vacation' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-[#f1f5f9]  dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-800 dark:text-white/50'
                }`}>
                  {driver.name.charAt(0)}
                </div>
                
                <div className="flex flex-col items-end gap-1 justify-center h-14 pr-2">
                  {driver.tier === 'Gold' && <Award className="w-8 h-8 text-yellow-400 drop-shadow-sm filter" />}
                  {driver.tier === 'Silver' && <BadgeCheck className="w-8 h-8 text-slate-800 dark:text-white/70 drop-shadow-sm" />}
                  {driver.tier === 'Bronze' && <ShieldAlert className="w-8 h-8 text-fleet-400 drop-shadow-sm" />}
                  {driver.tier === 'Atenção' && <AlertTriangle className="w-8 h-8 text-red-400 drop-shadow-md" />}
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
                  {driver.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-widest bg-[#f1f5f9]  dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">LIGA {driver.tier}</span>
                  {driver.status === 'vacation' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm">Férias</span>}
                  {driver.status === 'inactive' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white/60 border border-gray-200 dark:border-white/10">Inativo</span>}
                </div>
              </div>
              
              <div className="mt-5 space-y-3 text-sm text-slate-500 dark:text-fleet-200/80 font-medium relative z-10">
                <p className="flex items-center gap-3"><User className="w-4 h-4 text-slate-600 dark:text-fleet-300"/> CNH: {driver.cnh} (Cat. {driver.category})</p>
                <p className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-600 dark:text-fleet-300"/> {driver.phone}</p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 relative z-10">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-800 dark:text-white text-sm">EcoScore</span>
                  <span className={`font-black text-2xl tracking-tight leading-none ${driver.score >= 90 ? 'text-green-400' : driver.score >= 75 ? 'text-blue-400' : 'text-red-400'}`}>
                    {driver.score}
                    <span className="text-sm text-slate-800 dark:text-white/40 font-bold ml-1">/100</span>
                  </span>
                </div>
                <div className="w-full bg-gray-50 dark:bg-white/10 rounded-full h-3 shadow-inner overflow-hidden border border-white/5">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 origin-left ${
                      driver.score >= 90 ? 'bg-green-400' : driver.score >= 75 ? 'bg-blue-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${driver.score}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {drivers.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-300 dark:border-white/20 rounded-3xl bg-[#f1f5f9]  dark:bg-white/5">
            <UserMinus className="mx-auto h-12 w-12 text-slate-800 dark:text-white/30" />
            <h3 className="mt-4 text-lg font-black text-slate-800 dark:text-white">Nenhum motorista</h3>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-fleet-200">Comece adicionando seu primeiro motorista à frota.</p>
            <div className="mt-6">
              <button onClick={openNewDriver} className="inline-flex items-center rounded-xl bg-fleet-500 px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-sm hover:bg-fleet-400 transition">
                <Plus className="-ml-1 mr-2 h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                Novo Motorista
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-Over Form Modal - Premium Redesign */}
      <Transition show={isSlideOverOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsSlideOverOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-[#f1f5f9] dark:bg-fleet-900/80  transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <TransitionChild
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <DialogPanel className="pointer-events-auto relative w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-[#f1f5f9]  dark:bg-fleet-800 shadow-2xl border-l border-gray-200 dark:border-white/10">
                      <div className="px-6 py-8 bg-gradient-to-br from-indigo-900 to-fleet-700 relative overflow-hidden border-b border-gray-200 dark:border-white/10">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 dark:bg-white/10 rounded-full blur-3xl opacity-50"></div>
                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <DialogTitle className="text-2xl font-black leading-6 text-slate-800 dark:text-white tracking-tight">
                              {editingId ? "Editar Motorista" : "Cadastrar Motorista"}
                            </DialogTitle>
                            <p className="text-sm font-medium text-slate-500 dark:text-fleet-200 mt-2">
                                Preencha os dados do colaborador.
                            </p>
                          </div>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-full p-2 bg-[#f1f5f9]  dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-white/50 hover:text-slate-800 dark:text-white hover:bg-gray-50 dark:bg-white/10 shadow-sm transition focus:outline-none"
                              onClick={() => setIsSlideOverOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <span className="sr-only">Fechar painel</span>
                              <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content Form */}
                      <div className="relative flex-1 px-6 py-6 border-t border-gray-200 dark:border-white/10">
                        <form id="driver-form" onSubmit={handleSave} className="space-y-6">
                          <div>
                            <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Nome Completo</label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm placeholder:text-slate-800 dark:text-white/30 focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-bold"
                              placeholder="Ex: João da Silva"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">CNH</label>
                              <input
                                type="text"
                                required
                                value={cnh}
                                onChange={(e) => setCnh(e.target.value)}
                                className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm placeholder:text-slate-800 dark:text-white/30 focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium tracking-widest"
                                placeholder="12345678900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Categoria</label>
                              <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800"
                              >
                                <option value="B">B (Carro)</option>
                                <option value="C">C (Caminhão)</option>
                                <option value="D">D (Van/Ônibus)</option>
                                <option value="E">E (Carreta)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Telefone Contato</label>
                            <input
                              type="text"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm placeholder:text-slate-800 dark:text-white/30 focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium tracking-wide"
                              placeholder="(11) 99999-9999"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Status</label>
                              <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800"
                              >
                                <option value="active">Ativo (Em Rota)</option>
                                <option value="vacation">Férias / Folga</option>
                                <option value="inactive">Inativo</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Liga (Tier Inicial)</label>
                              <select
                                value={tier}
                                onChange={(e) => setTier(e.target.value as any)}
                                className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800"
                              >
                                <option value="Gold">Ouro</option>
                                <option value="Silver">Prata</option>
                                <option value="Bronze">Bronze</option>
                                <option value="Atenção">Atenção</option>
                              </select>
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* Footer */}
                      <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-6 py-6 bg-[#f1f5f9]  dark:bg-white/5">
                        <div className="flex flex-col gap-3">
                          <button
                            type="submit"
                            form="driver-form"
                            className="w-full inline-flex justify-center rounded-xl bg-fleet-500 px-4 py-3 text-sm font-bold text-slate-800 dark:text-white shadow-md shadow-fleet-500/20 hover:bg-fleet-400 transition"
                          >
                            {editingId ? "Salvar Alterações" : "Salvar Motorista"}
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-xl bg-[#f1f5f9]  dark:bg-white/5 px-4 py-3 text-sm font-bold text-slate-800 dark:text-white shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:bg-white/10 transition"
                            onClick={() => setIsSlideOverOpen(false)}
                          >
                            Cancelar Operação
                          </button>
                        </div>
                      </div>

                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </motion.div>
  );
}
