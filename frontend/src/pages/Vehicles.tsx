import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreVertical, Edit2, Trash2, X, Activity, Droplets, Wrench, Gauge, AlertCircle, User, Car } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { useVehicles } from '../lib/VehicleContext';
import type { Vehicle } from '../lib/VehicleContext';
import { useDrivers } from '../lib/DriverContext';

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'active' | 'maintenance'>('all');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<Vehicle | null>(null);
  const { vehicles, addVehicle, removeVehicle, updateVehicle } = useVehicles();
  const { drivers } = useDrivers();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  
  // Form State
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('SP');
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [status, setStatus] = useState('active');
  const [driverId, setDriverId] = useState<number | ''>('');
  const [fuelLevel, setFuelLevel] = useState<number>(100);
  const [tireHealth, setTireHealth] = useState<number>(100);
  const [sketchfabId, setSketchfabId] = useState<string>('314f957331344efcb574b35da7bba99f');
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);

  const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Fetch cities when UF changes
  useEffect(() => {
    async function fetchCities() {
      setIsLoadingCities(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const data = await res.json();
        const cityNames = data.map((c: any) => c.nome);
        setCities(cityNames);
        if (cityNames.length > 0 && !cityNames.includes(city)) {
          setCity(cityNames[0]); // Auto-select first city if current is invalid for new UF
        }
      } catch (err) {
        console.error("Failed to load cities", err);
      } finally {
        setIsLoadingCities(false);
      }
    }
    fetchCities();
  }, [uf]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNewVehicle = () => {
    setEditingId(null);
    setDriverId(''); setFuelLevel(100); setTireHealth(100);
    setSketchfabId('314f957331344efcb574b35da7bba99f'); setIsCustomModel(false);
    setIsSlideOverOpen(true);
  };

  const openEditVehicle = (vehicle: any) => {
    setEditingId(vehicle.id);
    setPlate(vehicle.plate);
    setModel(vehicle.model);
    setYear(vehicle.year?.toString() || '');
    setUf(vehicle.uf);
    setCity(vehicle.city);
    setStatus(vehicle.status);
    setDriverId(vehicle.driverId || '');
    setFuelLevel(vehicle.fuelLevel || 100);
    setTireHealth(vehicle.tireHealth || 100);
    setSketchfabId(vehicle.sketchfabId || '314f957331344efcb574b35da7bba99f');
    setIsCustomModel(vehicle.sketchfabId && vehicle.sketchfabId !== '314f957331344efcb574b35da7bba99f' ? true : false);
    setIsSlideOverOpen(true);
  };

  const handleDelete = (id: number, plateStr: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o veículo ${plateStr}?`)) {
      removeVehicle(id);
      if (selectedDetails?.id === id) {
        setSelectedDetails(null);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Geolocate city/state using OSM Nominatim API
      let lat = -23.5505 + (Math.random() - 0.5) * 0.1; // Default to SP bounds
      let lng = -46.6333 + (Math.random() - 0.5) * 0.1;

      if (city) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(uf)}&country=Brazil&format=json&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (err) {
          console.warn('Geocoding failed, falling back to mapping defaults.', err);
        }
      }

      if (editingId !== null) {
        updateVehicle(editingId, {
          plate, model, year: parseInt(year) || new Date().getFullYear(), status, city, uf, lat, lng,
          driverId: driverId ? Number(driverId) : null, fuelLevel, tireHealth, sketchfabId
        });
      } else {
        const newVehicle = {
          id: Math.max(...vehicles.map(v => v.id)) + 1,
          plate,
          model,
          year: parseInt(year) || new Date().getFullYear(),
          status,
          city: city || 'São Paulo',
          uf,
          lat,
          lng,
          driverId: driverId ? Number(driverId) : null,
          fuelLevel,
          tireHealth,
          sketchfabId
        };
        addVehicle(newVehicle);
      }

      setPlate(''); setModel(''); setYear(''); setCity(''); setUf('SP'); setStatus('active');
      setDriverId(''); setFuelLevel(100); setTireHealth(100);
      setSketchfabId('314f957331344efcb574b35da7bba99f'); setIsCustomModel(false);
      setEditingId(null);
      setIsSlideOverOpen(false);
    } catch (error) {
      console.error("Failed to save vehicle", error);
      alert("Falha ao salvar veículo");
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || v.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === 'all' || v.status === filterTag;
    return matchesSearch && matchesTag;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Veículos</h1>
          <p className="text-slate-500 dark:text-fleet-200 mt-1 font-medium">Gerencie a frota de veículos cadastrados.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openNewVehicle}
          className="flex items-center gap-2 bg-fleet-500 text-slate-800 dark:text-white px-5 py-2.5 rounded-xl font-bold hover:bg-fleet-400 transition shadow-md shadow-fleet-500/20"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Novo Veículo
        </motion.button>
      </div>

      <div className="bg-[#f1f5f9]  dark:bg-white/5  rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f1f5f9]  dark:bg-white/5 shrink-0">
          <div className="relative max-w-sm w-full">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-800 dark:text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar por placa ou modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#f1f5f9]  dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-800 dark:text-white/40 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fleet-500 shadow-sm"
            />
          </div>

          <div className="flex bg-[#f1f5f9]  dark:bg-white/5 p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => setFilterTag('all')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterTag === 'all' ? 'bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:text-white'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterTag('active')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterTag === 'active' ? 'bg-green-500/20 text-green-300 shadow-sm ring-1 ring-green-500/20' : 'text-slate-500 dark:text-fleet-200 hover:text-green-300'}`}
            >
              Em Rota
            </button>
            <button 
              onClick={() => setFilterTag('maintenance')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterTag === 'maintenance' ? 'bg-alert/20 text-yellow-300 shadow-sm ring-1 ring-alert/30' : 'text-slate-500 dark:text-fleet-200 hover:text-yellow-300'}`}
            >
              Manutenção
            </button>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap text-slate-800 dark:text-white">
            <thead className="bg-[#f1f5f9]  dark:bg-white/5 text-slate-500 dark:text-fleet-200 font-bold border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 shadow-sm ">
              <tr>
                <th className="px-6 py-5">Veículo</th>
                <th className="px-6 py-5">Motorista Designado</th>
                <th className="px-6 py-5">Saúde (Pneus)</th>
                <th className="px-6 py-5">Combustível</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredVehicles.map((vehicle, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    key={vehicle.id} 
                    className="hover:bg-white  dark:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedDetails(vehicle)}
                  >
                    <td className="px-6 py-4 border-l-4 border-transparent group-hover:border-fleet-400 bg-transparent transition-all">
                      <div className="font-black text-slate-800 dark:text-white text-lg uppercase">{vehicle.plate}</div>
                      <div className="font-semibold text-slate-500 dark:text-fleet-200">{vehicle.model} • {vehicle.year}</div>
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.driverId ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white border border-gray-200 dark:border-white/10 flex items-center justify-center text-sm font-black shadow-sm">
                            {drivers.find(d => d.id === vehicle.driverId)?.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-white">{drivers.find(d => d.id === vehicle.driverId)?.name || 'Desconhecido'}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-slate-600 dark:text-fleet-300/60 italic bg-[#f1f5f9]  dark:bg-white/5 border border-white/5 px-2 py-1 rounded">Sem motorista</span>
                      )}
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black w-10 ${vehicle.tireHealth! < 40 ? 'text-red-400' : 'text-slate-800 dark:text-white'}`}>{vehicle.tireHealth}%</span>
                        <div className="w-full bg-gray-50 dark:bg-white/10 rounded-full h-2 shadow-inner border border-white/5">
                          <div className={`h-2 rounded-full ${vehicle.tireHealth! >= 70 ? 'bg-green-400' : vehicle.tireHealth! >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${vehicle.tireHealth}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black w-10 ${vehicle.fuelLevel! < 20 ? 'text-red-400' : 'text-slate-800 dark:text-white'}`}>{vehicle.fuelLevel}%</span>
                        <div className="w-full bg-gray-50 dark:bg-white/10 rounded-full h-2 shadow-inner border border-white/5">
                          <div className={`h-2 rounded-full ${vehicle.fuelLevel! >= 50 ? 'bg-fleet-400' : vehicle.fuelLevel! >= 20 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${vehicle.fuelLevel}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm border ${
                        vehicle.status === 'active' 
                          ? 'bg-green-500/20 text-green-300 border-green-500/20' 
                          : 'bg-alert/20 text-yellow-300 border-alert/30'
                      }`}>
                        {vehicle.status === 'active' ? 'Ativo' : 'Manutenção'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); openEditVehicle(vehicle); }} className="p-2 text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:text-white rounded-lg hover:bg-gray-50 dark:bg-white/10 transition border border-transparent hover:border-gray-200 dark:border-white/10">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(vehicle.id, vehicle.plate); }} className="p-2 text-slate-500 dark:text-fleet-200 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedDetails(vehicle); }} className="p-2 text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:text-white rounded-lg hover:bg-gray-50 dark:bg-white/10 transition border border-transparent hover:border-gray-200 dark:border-white/10">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredVehicles.length === 0 && (
            <div className="w-full py-12 flex flex-col items-center justify-center text-slate-500 dark:text-fleet-200">
               <Car className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-bold text-lg text-slate-800 dark:text-white">Nenhum veículo encontrado</p>
               <p className="text-sm">Tente ajustar seus filtros de busca.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-overs logic kept mostly the same, just updating classes for premium look */}
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
                    <div className="flex h-full flex-col overflow-y-scroll bg-[#f1f5f9]  dark:bg-fleet-800 py-6 shadow-2xl border-l border-gray-200 dark:border-white/10">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between border-b border-gray-200 dark:border-white/10 pb-4">
                          <DialogTitle className="text-2xl font-black leading-6 text-slate-800 dark:text-white">
                            {editingId ? "Editar Veículo" : "Cadastrar Novo Veículo"}
                          </DialogTitle>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-full p-2 bg-[#f1f5f9]  dark:bg-white/5 text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:text-white hover:bg-gray-50 dark:bg-white/10 focus:outline-none transition border border-transparent hover:border-gray-200 dark:border-white/10"
                              onClick={() => setIsSlideOverOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <span className="sr-only">Fechar painel</span>
                              <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <form onSubmit={handleRegister} className="space-y-5">
                          {/* Form inputs matching original structure but with bolder fonts and rounded-xl */}
                          <div>
                            <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Placa</label>
                            <div className="mt-2">
                              <input
                                type="text"
                                required
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm placeholder:text-slate-800 dark:text-white/30 focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 uppercase font-bold"
                                placeholder="ABC-1234"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Modelo</label>
                            <div className="mt-2">
                              <input
                                type="text"
                                required
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm placeholder:text-slate-800 dark:text-white/30 focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium"
                                placeholder="Ex: Fiat Mobi 1.0"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Ano</label>
                            <div className="mt-2">
                              <input
                                type="number"
                                required
                                min="1990"
                                max="2030"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm placeholder:text-slate-800 dark:text-white/30 focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium"
                                placeholder="2024"
                              />
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <div className="w-24">
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">UF</label>
                              <div className="mt-2">
                                <select
                                  value={uf}
                                  onChange={(e) => setUf(e.target.value)}
                                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800"
                                >
                                  {ufs.map(state => <option key={state} value={state}>{state}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white flex justify-between">
                                Cidade
                                {isLoadingCities && <span className="text-xs text-fleet-400 animate-pulse">Carregando...</span>}
                              </label>
                              <div className="mt-2">
                                <select
                                  required
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  disabled={isLoadingCities || cities.length === 0}
                                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800 disabled:bg-[#f1f5f9] dark:bg-fleet-900 disabled:text-slate-800 dark:text-white/30"
                                >
                                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Status Operacional</label>
                            <div className="mt-2">
                              <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800"
                              >
                                <option value="active">Ativo (Em Rota)</option>
                                <option value="maintenance">Em Manutenção</option>
                              </select>
                            </div>
                          </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Motorista Designado</label>
                              <div className="mt-2">
                                <select
                                  value={driverId}
                                  onChange={(e) => setDriverId(e.target.value ? Number(e.target.value) : '')}
                                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800"
                                >
                                  <option value="">-- Sem Motorista Padrão --</option>
                                  {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} (CNH: {d.cnh})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Combustível (%)</label>
                                <input
                                  type="number"
                                  min="0" max="100"
                                  value={fuelLevel}
                                  onChange={(e) => setFuelLevel(Number(e.target.value))}
                                  className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Saúde Pneus (%)</label>
                                <input
                                  type="number"
                                  min="0" max="100"
                                  value={tireHealth}
                                  onChange={(e) => setTireHealth(Number(e.target.value))}
                                  className="mt-2 block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium"
                                />
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                              <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white">Modelo 3D (Sketchfab)</label>
                              <div className="mt-2">
                                <select
                                  value={isCustomModel ? 'custom' : sketchfabId}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                      setIsCustomModel(true);
                                      setSketchfabId('');
                                    } else {
                                      setIsCustomModel(false);
                                      setSketchfabId(e.target.value);
                                    }
                                  }}
                                  className="block w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium bg-[#f1f5f9]  dark:bg-fleet-800"
                                >
                                  <option value="314f957331344efcb574b35da7bba99f">Volvo FH 750</option>
                                  <option value="891ee120d3734b439a9a5e63eaa10a4c">Scania S730 2016</option>
                                  <option value="2f475fb13b1f40cdad1709135404a508">MAN TGX</option>
                                  <option value="2f2ced3e54f24b4f8bee695e3261bd30">DAF CF</option>
                                  <option value="custom">Inserir ID Customizado...</option>
                                </select>
                              </div>
                              {isCustomModel && (
                                <div className="mt-3">
                                  <input
                                    type="text"
                                    value={sketchfabId}
                                    onChange={(e) => setSketchfabId(e.target.value)}
                                    placeholder="Ex: 314f957331344efcb574b35da7bba99f"
                                    className="block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-[#f1f5f9]  dark:bg-white/5 py-2.5 text-slate-800 dark:text-white shadow-sm placeholder:text-slate-800 dark:text-white/30 focus:ring-2 focus:ring-inset focus:ring-fleet-400 sm:text-sm sm:leading-6 px-4 font-medium"
                                  />
                                  <p className="text-xs font-medium text-slate-800 dark:text-white/50 mt-1">Cole o ID de um modelo válido do Sketchfab.</p>
                                </div>
                              )}
                            </div>

                          <div className="pt-6 pb-8">
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-fleet-500 px-4 py-3 text-sm font-bold text-slate-800 dark:text-white shadow-md shadow-fleet-500/20 hover:bg-fleet-400 transition"
                            >
                              {editingId ? "Salvar Alterações" : "Salvar Veículo"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsSlideOverOpen(false)}
                              className="mt-3 w-full rounded-xl bg-[#f1f5f9]  dark:bg-white/5 px-4 py-3 text-sm font-bold text-slate-800 dark:text-white shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:bg-white/10 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Details Slide-Over Premium Re-design */}
      <Transition show={!!selectedDetails} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedDetails(null)}>
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
                      {selectedDetails && (
                        <>
                          <div className="bg-gradient-to-br from-indigo-900 to-fleet-700 px-6 py-8 relative overflow-hidden border-b border-gray-200 dark:border-white/10">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 dark:bg-white/10 rounded-full blur-3xl"></div>
                            <div className="flex items-center justify-between relative z-10">
                              <DialogTitle className="text-3xl font-black leading-6 text-slate-800 dark:text-white tracking-tight">
                                {selectedDetails.model}
                              </DialogTitle>
                              <div className="ml-3 flex h-7 items-center">
                                <button
                                  type="button"
                                  className="relative rounded-full p-2 bg-black/20 text-slate-800 dark:text-white/80 hover:text-slate-800 dark:text-white hover:bg-black/40 backdrop-blur-sm transition focus:outline-none border border-gray-200 dark:border-white/10"
                                  onClick={() => setSelectedDetails(null)}
                                >
                                  <span className="absolute -inset-2.5" />
                                  <span className="sr-only">Fechar painel</span>
                                  <X className="h-5 w-5" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-3 relative z-10">
                              <span className="text-sm text-slate-800 dark:text-white font-black uppercase tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-gray-300 dark:border-white/20 shadow-inner">
                                {selectedDetails.plate}
                              </span>
                              <span className="text-sm font-bold text-slate-700 dark:text-fleet-100 bg-gray-50 dark:bg-white/10 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10">Ano: {selectedDetails.year}</span>
                            </div>
                          </div>

                          <div className="relative flex-1 px-4 py-6 sm:px-6 space-y-6">

                            {/* 3D Visualizer Section */}
                            <div className="bg-[#f1f5f9]  dark:bg-white/5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 overflow-hidden">
                              <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-[#f1f5f9]  dark:bg-white/5">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                  <Car className="w-4 h-4 text-fleet-400"/> Visualizador 3D
                                </h3>
                              </div>
                              <div className="w-full h-80 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center relative">
                                <iframe 
                                  title={`Caminhão ${selectedDetails.model}`} 
                                  frameBorder="0" 
                                  allowFullScreen 
                                  allow="autoplay; fullscreen; xr-spatial-tracking" 
                                  className="w-full h-full"
                                  src={`https://sketchfab.com/models/${selectedDetails.sketchfabId || '314f957331344efcb574b35da7bba99f'}/embed?autostart=1&ui_theme=dark&dnt=1`}> 
                                </iframe>
                              </div>
                            </div>

                            {/* Driver Assignment Banner */}
                            <div className="bg-[#f1f5f9]  dark:bg-white/5 p-5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-inner">
                                   <User className="w-6 h-6 text-slate-800 dark:text-white" />
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest mb-0.5">Operador Atual</span>
                                   <span className="font-black text-slate-800 dark:text-white text-lg">
                                     {selectedDetails.driverId ? drivers.find(d => d.id === selectedDetails.driverId)?.name || 'Motorista Removido' : 'Chave Livre'}
                                   </span>
                                 </div>
                               </div>
                            </div>
                            
                            {/* Status Card */}
                            <div className="bg-[#f1f5f9]  dark:bg-white/5 p-5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest mb-1.5">Status Operacional</span>
                                <div className="flex items-center gap-2">
                                  {selectedDetails.status === 'active' ? (
                                    <><div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30 text-green-300 shadow-sm"><Activity className="w-4 h-4 stroke-[3]" /><span className="font-bold text-sm">Em Rota (Ativo)</span></div></>
                                  ) : (
                                    <><div className="flex items-center gap-2 bg-alert/20 px-3 py-1.5 rounded-lg border border-alert/30 text-yellow-300 shadow-sm"><AlertCircle className="w-4 h-4 stroke-[3]" /><span className="font-bold text-sm">Em Manutenção</span></div></>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest mb-1 block">Localidade</span>
                                <span className="font-black text-slate-800 dark:text-white bg-gray-50 dark:bg-white/10 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10">{selectedDetails.city} - {selectedDetails.uf}</span>
                              </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#f1f5f9]  dark:bg-white/5 p-5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 group hover:bg-gray-50 dark:bg-white/10 hover:border-gray-300 dark:border-white/20 transition">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                                    <Gauge className="w-6 h-6" />
                                  </div>
                                </div>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">12.4k <span className="text-sm font-bold text-slate-600 dark:text-fleet-300">km</span></h4>
                                <p className="text-xs font-bold text-slate-600 dark:text-fleet-300 mt-1 uppercase">Hodômetro</p>
                              </div>

                              <div className="bg-[#f1f5f9]  dark:bg-white/5 p-5 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 group hover:bg-gray-50 dark:bg-white/10 hover:border-gray-300 dark:border-white/20 transition">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="p-2 bg-gray-50 dark:bg-white/10 text-slate-800 dark:text-white rounded-lg group-hover:scale-110 transition-transform">
                                    <Droplets className="w-6 h-6" />
                                  </div>
                                </div>
                                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">14.2 <span className="text-sm font-bold text-slate-600 dark:text-fleet-300">km/l</span></h4>
                                <p className="text-xs font-bold text-slate-600 dark:text-fleet-300 mt-1 uppercase">Média</p>
                              </div>
                            </div>

                            {/* Wear & Tear progress */}
                            <div className="bg-[#f1f5f9]  dark:bg-white/5 p-6 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 space-y-6">
                              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                                <Wrench className="w-4 h-4 text-fleet-400" /> Desgaste e Saúde
                              </h3>
                              
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-slate-500 dark:text-fleet-200 font-bold">Saúde dos Pneus</span>
                                  <span className={`font-black ${selectedDetails.tireHealth! >= 70 ? 'text-green-400' : selectedDetails.tireHealth! >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{selectedDetails.tireHealth}%</span>
                                </div>
                                <div className="w-full bg-gray-50 dark:bg-white/10 rounded-full h-3 shadow-inner border border-white/5">
                                  <div className={`h-3 rounded-full ${selectedDetails.tireHealth! >= 70 ? 'bg-green-400' : selectedDetails.tireHealth! >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${selectedDetails.tireHealth}%` }}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-slate-500 dark:text-fleet-200 font-bold">Capacidade do Tanque</span>
                                  <span className={`font-black ${selectedDetails.fuelLevel! >= 20 ? 'text-fleet-400' : 'text-red-400'}`}>{selectedDetails.fuelLevel}%</span>
                                </div>
                                <div className="w-full bg-gray-50 dark:bg-white/10 rounded-full h-3 shadow-inner border border-white/5">
                                  <div className={`h-3 rounded-full ${selectedDetails.fuelLevel! >= 50 ? 'bg-fleet-400' : selectedDetails.fuelLevel! >= 20 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${selectedDetails.fuelLevel}%` }}></div>
                                </div>
                              </div>
                            </div>

                          </div>
                          
                          <div className="px-6 py-5 bg-[#f1f5f9]  dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 sticky bottom-0 ">
                            {selectedDetails.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => setIsMaintenanceModalOpen(true)}
                                className="rounded-xl bg-alert/20 text-yellow-600 dark:text-yellow-400 border border-alert/30 hover:bg-alert/30 px-5 py-2.5 text-sm font-bold shadow-sm cursor-pointer transition"
                              >
                                Enviar para Oficina
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setSelectedDetails(null); openEditVehicle(selectedDetails); }}
                              className="rounded-xl bg-gray-50 dark:bg-white/10 px-5 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-sm border border-gray-300 dark:border-white/20 hover:bg-white/20 cursor-pointer transition"
                            >
                              Editar Dados
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const id = selectedDetails.id;
                                const plateObj = selectedDetails.plate;
                                setSelectedDetails(null);
                                handleDelete(id, plateObj);
                              }}
                              className="rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 px-5 py-2.5 text-sm font-bold shadow-sm cursor-pointer transition"
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Maintenance Modal */}
      <Transition show={isMaintenanceModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsMaintenanceModalOpen(false)}>
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

          <div className="fixed inset-0 z-10 overflow-y-auto w-screen">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-[#f1f5f9]  dark:bg-fleet-800 text-left shadow-2xl transition-all w-full max-w-md border border-gray-200 dark:border-white/10">
                  <div className="bg-[#f1f5f9]  dark:bg-fleet-800 px-6 pb-6 pt-5 sm:p-6 sm:pb-6 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-alert/20 border border-alert/30 shadow-inner">
                          <Wrench className="h-6 w-6 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
                        </div>
                        <div>
                          <DialogTitle as="h3" className="text-xl font-black leading-6 text-slate-800 dark:text-white">
                            Enviar para Oficina
                          </DialogTitle>
                          <p className="text-sm font-medium text-slate-500 dark:text-fleet-200/70 mt-1">
                            {selectedDetails?.plate} • {selectedDetails?.model}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-full p-2 text-slate-500 dark:text-fleet-200 hover:text-slate-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none transition cursor-pointer"
                        onClick={() => setIsMaintenanceModalOpen(false)}
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-bold leading-6 text-slate-800 dark:text-white mb-2">
                        Detalhe da Manutenção (Obrigatório)
                      </label>
                      <textarea
                        rows={3}
                        value={maintenanceReason}
                        onChange={(e) => setMaintenanceReason(e.target.value)}
                        placeholder="Ex: Troca de óleo, Revisão de 50.000km, etc."
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 py-3 px-4 bg-gray-50 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-fleet-400 sm:text-sm shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-black/20 px-6 py-5 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10 relative z-10">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-xl bg-[#f1f5f9] dark:bg-white/10 px-4 py-3 text-sm font-bold text-slate-800 dark:text-white shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 sm:w-auto transition cursor-pointer"
                      onClick={() => setIsMaintenanceModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!maintenanceReason.trim()}
                      className="inline-flex w-full justify-center rounded-xl bg-alert px-4 py-3 text-sm font-bold text-slate-800 shadow-sm hover:bg-yellow-400 sm:w-auto transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (selectedDetails) {
                          updateVehicle(selectedDetails.id, {
                            status: 'maintenance',
                            maintenanceDetails: maintenanceReason
                          });
                          setSelectedDetails(null);
                          setIsMaintenanceModalOpen(false);
                          setMaintenanceReason('');
                        }
                      }}
                    >
                      Confirmar Envio
                    </button>
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
