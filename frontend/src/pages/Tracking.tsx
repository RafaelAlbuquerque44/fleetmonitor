import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Gauge, User, Maximize2, Minimize2 } from 'lucide-react';
import { useVehicles } from '../lib/VehicleContext';
import type { Vehicle } from '../lib/VehicleContext';
import { useDrivers } from '../lib/DriverContext';
import type { Driver } from '../lib/DriverContext';

import { useTheme } from '../contexts/ThemeContext';

// Dynamic SVG Icon for the trucks
const createTruckIcon = (color: string) => {
  return new L.DivIcon({
    html: `
      <div style="background: linear-gradient(135deg, ${color}, #000); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="14" height="10" rx="1" />
            <path d="M16 11h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4" />
            <circle cx="6" cy="17" r="2" />
            <circle cx="18" cy="17" r="2" />
            <line x1="2" y1="12" x2="22" y2="12" />
         </svg>
      </div>
    `,
    className: 'custom-truck-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Component to dynamically update map center
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Rough coordinates of Brazil bounding box
const brazilBounds: L.LatLngBoundsLiteral = [
  [5.27, -73.98], // North-West
  [-33.75, -34.79] // South-East
];

// Helper to convert Context Vehicle to Live Map Location
function convertVehicleToLocation(v: Vehicle, drivers: Driver[]) {
  const availableDrivers = drivers.filter(d => d.status === 'active');
  const matchedDriver = availableDrivers[v.id % availableDrivers.length] || null;

  return {
    id: v.id,
    plate: v.plate,
    model: v.model,
    lat: v.lat || (-23.5505 + (Math.random() - 0.5) * 0.1), 
    lng: v.lng || (-46.6333 + (Math.random() - 0.5) * 0.1),
    speed: v.status === 'active' ? (Math.floor(Math.random() * 60) + 40) : 0, 
    driver: matchedDriver ? matchedDriver.name : 'Nenhum / Desconhecido',
    driverScore: matchedDriver ? matchedDriver.score : 0,
    driverTier: matchedDriver ? matchedDriver.tier : 'Nenhum',
    city: v.city,
    uf: v.uf,
    status: v.status
  };
}

export default function Tracking() {
  const { vehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { theme } = useTheme();
  const [locations, setLocations] = useState(() => vehicles.map(v => convertVehicleToLocation(v, drivers)));
  const [mapCenter, setMapCenter] = useState<[number, number]>([-14.2350, -51.9253]); 
  const [zoomLevel, setZoomLevel] = useState(4); 
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [truckColor, setTruckColor] = useState('#22c55e'); // Default eco-500 Green

  const PRESET_COLORS = [
    { id: 'green', hex: '#22c55e' },
    { id: 'blue', hex: '#3b82f6' },
    { id: 'purple', hex: '#8b5cf6' },
    { id: 'orange', hex: '#f97316' },
    { id: 'red', hex: '#ef4444' }
  ];

  // Listen for new vehicles and set up movement simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLocations(current => current.map(loc => {
        if (loc.status === 'maintenance') {
          return { ...loc, speed: 0 }; 
        }

        const latDelta = (Math.random() - 0.5) * 0.005; 
        const lngDelta = (Math.random() - 0.5) * 0.005;
        
        let newSpeed = loc.speed + Math.floor((Math.random() - 0.5) * 15);
        if (newSpeed < 10) newSpeed = 10;
        if (newSpeed > 120) newSpeed = 120;

        return {
          ...loc,
          lat: loc.lat + latDelta,
          lng: loc.lng + lngDelta,
          speed: newSpeed
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (vehicles.length > locations.length) {
      const newVs = vehicles.slice(locations.length).map(v => convertVehicleToLocation(v, drivers));
      setLocations(prev => [...prev, ...newVs]);
    }
  }, [vehicles, drivers]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusOnVehicle = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setZoomLevel(15);
  };

  const activeCount = locations.filter(l => l.status === 'active').length;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 h-full flex flex-col"
    >
      <div className="flex justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Rastreamento Global</h1>
          <p className="text-slate-500 dark:text-fleet-200 mt-1 font-medium">Acompanhe a frota em tempo real com telemetria ativa.</p>
        </div>
        <div className="flex justify-center">
            <div className="flex items-center gap-3 bg-[#f1f5f9] dark:bg-white/5 px-4 py-2 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 ">
               <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest">Veículos em Rota</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{activeCount} / {locations.length}</span>
               </div>
               <div className="relative flex h-4 w-4">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-4 w-4 bg-green-400 shadow-sm border border-transparent"></span>
               </div>
            </div>
        </div>
      </div>

      <div className="flex-1 bg-[#f1f5f9] dark:bg-white/5 rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-200 dark:border-white/10 overflow-hidden relative z-0 flex flex-col min-h-0 ">
        {/* Decorative Top Gradient over Map */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent z-[300] pointer-events-none mix-blend-overlay"></div>

        <MapContainer 
          center={mapCenter} 
          zoom={zoomLevel} 
          minZoom={4}
          maxBounds={brazilBounds}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          style={{ height: '100%', width: '100%', zIndex: 1, background: theme === 'dark' ? '#111827' : '#f8eff4' }}
          className="rounded-3xl"
        >
          <MapUpdater center={mapCenter} zoom={zoomLevel} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={theme === 'dark' 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
          />
          {locations.map((loc) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={createTruckIcon(truckColor)}>
              <Popup className="premium-popup shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 ">
                <div className="p-0 min-w-[240px] bg-[#f1f5f9] dark:bg-fleet-900 border border-gray-200 dark:border-white/10 overflow-hidden rounded-2xl">
                  <div className="bg-gradient-to-br from-indigo-900 to-fleet-800 p-4 text-slate-800 dark:text-white relative">
                     <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 dark:bg-white/10 rounded-full blur-2xl"></div>
                     <h3 className="font-black text-xl tracking-tight uppercase relative z-10">{loc.plate}</h3>
                     <p className="text-sm font-medium text-slate-700 dark:text-fleet-100 opacity-90 relative z-10">{loc.model}</p>
                  </div>
                  <div className="p-4 space-y-4 bg-[#f1f5f9] dark:bg-white/5">
                    <div>
                        <p className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Operador Atual</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white block truncate">{loc.driver}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-[#f1f5f9] dark:bg-white/5 p-2 rounded-lg border border-gray-200 dark:border-white/10">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest mb-0.5">Velocidade</p>
                          <p className={`text-lg font-black leading-none ${loc.speed > 0 ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-white/40'}`}>
                             {loc.speed}
                             <span className="text-xs font-bold text-slate-800 dark:text-white/50 ml-1">km/h</span>
                          </p>
                       </div>
                       
                       <div className="bg-[#f1f5f9] dark:bg-white/5 p-2 rounded-lg border border-gray-200 dark:border-white/10">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest mb-0.5">EcoScore</p>
                          <p className={`text-lg font-black leading-none ${loc.driverScore >= 90 ? 'text-green-400' : loc.driverScore >= 75 ? 'text-blue-400' : 'text-red-400'}`}>
                             {loc.driverScore}
                             <span className="text-xs font-bold text-slate-800 dark:text-white/50 ml-1">pts</span>
                          </p>
                       </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                       <p className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Última Leitura</p>
                       <p className="text-sm font-bold text-slate-800 dark:text-white block">{loc.city} - {loc.uf}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Floating overlay panel with Glassmorphism Dashboard */}
        <AnimatePresence>
            <motion.div 
               layout
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               className="absolute top-6 right-6 z-[400] hidden sm:flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-[#f1f5f9] dark:bg-white/5 "
               style={{ width: '320px' }}
            >
               {/* Panel Header */}
               <div 
                  className="bg-[#f1f5f9] dark:bg-white/5 p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:bg-white/10 transition-colors"
                  onClick={() => setIsPanelExpanded(!isPanelExpanded)}
               >
                   <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                     <Navigation className="w-5 h-5 text-fleet-400 fill-fleet-400/20" />
                     Status da Frota
                   </h4>
                   <button className="p-1.5 bg-gray-50 dark:bg-white/10 hover:bg-white/20 rounded-lg text-slate-800 dark:text-white/70 transition-colors border border-transparent hover:border-gray-200 dark:border-white/10">
                     {isPanelExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                   </button>
               </div>

               {/* Color Customizer */}
               <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-500 dark:text-fleet-200">Cor da Frota:</span>
                 <div className="flex gap-2">
                   {PRESET_COLORS.map(c => (
                     <button 
                       key={c.id} 
                       onClick={() => setTruckColor(c.hex)}
                       className={`w-5 h-5 rounded-full ring-2 ring-offset-1 transition hover:scale-110 ${truckColor === c.hex ? 'ring-slate-400 dark:ring-white ring-offset-white dark:ring-offset-fleet-800' : 'ring-transparent'}`}
                       style={{ backgroundColor: c.hex }}
                     />
                   ))}
                 </div>
               </div>

               {/* Panel Body */}
               {isPanelExpanded && (
                  <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-1 p-2 bg-transparent"
                  >
                     {locations.map((loc, i) => (
                        <motion.div 
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.05 }}
                           key={loc.id} 
                           onClick={() => focusOnVehicle(loc.lat, loc.lng)}
                           className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:bg-white/10 border border-transparent shadow-sm hover:border-gray-300 dark:border-white/20 group"
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ring-2 ${loc.speed > 0 ? 'bg-green-400 ring-green-500/30' : loc.status === 'maintenance' ? 'bg-red-400 ring-red-500/30' : 'bg-white/40 ring-white/10'}`}></div>
                              <div>
                                 <div className="font-black text-slate-800 dark:text-white text-sm tracking-tight group-hover:text-slate-600 dark:text-fleet-300 transition-colors">
                                    {loc.plate}
                                 </div>
                                 <div className="text-[10px] font-bold text-slate-500 dark:text-fleet-200/70 uppercase flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 opacity-60" /> {loc.city}
                                 </div>
                              </div>
                           </div>
                           
                           <div className="text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                 <span className={`text-sm font-black tracking-tighter ${loc.speed > 0 ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-white/40'}`}>
                                    {loc.speed}
                                 </span>
                                 <Gauge className={`w-3.5 h-3.5 ${loc.speed > 0 ? 'text-fleet-400' : 'text-slate-800 dark:text-white/30'}`} />
                              </div>
                              <div className="text-[10px] font-bold text-slate-600 dark:text-fleet-300/60 uppercase mt-0.5">
                                 km/h
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </motion.div>
               )}
            </motion.div>
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .premium-popup .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 1rem;
            overflow: hidden;
            background-color: transparent;
            box-shadow: none;
            border: none;
        }
        .premium-popup .leaflet-popup-content {
            margin: 0;
            width: auto !important;
        }
        .premium-popup .leaflet-popup-tip-container {
            display: none;
        }
        .custom-truck-icon {
            transition: all 1s ease-in-out;
        }
      `}} />
    </motion.div>
  );
}
