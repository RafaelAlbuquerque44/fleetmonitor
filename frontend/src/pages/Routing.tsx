import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Map as MapIcon, 
  MapPin, 
  Navigation, 
  Fuel, 
  Clock, 
  DollarSign, 
  Calculator,
  Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useVehicles } from '../lib/VehicleContext';

// --- Leaflet Icons Setup ---
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const gasStationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/481/481233.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});
// -----------------------------

const FUEL_PRICE_BASE = 5.89;

const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [
  [5.27, -73.98],
  [-33.75, -34.79]
];

function MapViewUpdater({ routeData }: { routeData: any }) {
  const map = useMap();
  useEffect(() => {
    if (routeData && routeData.geometry && routeData.geometry.length > 0) {
      const bounds = L.latLngBounds(routeData.geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.fitBounds(BRAZIL_BOUNDS);
    }
  }, [routeData, map]);
  return null;
}

export default function Routing() {
  const { vehicles } = useVehicles();
  const activeVehicles = vehicles.filter(v => v.status === 'active' || v.status === 'available');

  // IBGE State
  const [states, setStates] = useState<{ id: number, sigla: string, nome: string }[]>([]);
  
  // Origin State
  const [originUF, setOriginUF] = useState('');
  const [originCities, setOriginCities] = useState<{ id: number, nome: string }[]>([]);
  const [originCity, setOriginCity] = useState('');

  // Destination State
  const [destUF, setDestUF] = useState('');
  const [destCities, setDestCities] = useState<{ id: number, nome: string }[]>([]);
  const [destCity, setDestCity] = useState('');

  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState<{
    distance: number;
    time: number;
    cost: number;
    consumption: number;
    originName: string;
    destName: string;
    geometry: [number, number][]; // Rota principal
    alternatives: { geometry: [number, number][], distance: number, time: number }[]; // Rotas alternativas
  } | null>(null);

  // 1. Fetch States on Mount
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStates(data))
      .catch(err => console.error("Erro ao buscar estados", err));
  }, []);

  // 2. Fetch Origin Cities when UF changes
  useEffect(() => {
    if (!originUF) {
      setOriginCities([]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${originUF}/municipios?orderBy=nome`)
      .then(res => res.json())
      .then(data => setOriginCities(data))
      .catch(err => console.error("Erro ao buscar cidades origem", err));
  }, [originUF]);

  // 3. Fetch Dest Cities when UF changes
  useEffect(() => {
    if (!destUF) {
      setDestCities([]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${destUF}/municipios?orderBy=nome`)
      .then(res => res.json())
      .then(data => setDestCities(data))
      .catch(err => console.error("Erro ao buscar cidades destino", err));
  }, [destUF]);

  const handleCalculate = async () => {
    if (!originCity || !originUF || !destCity || !destUF || !selectedVehicle) return;
    
    setIsLoading(true);
    setRouteData(null);

    try {
      // 1. Geocoding com Nominatim
      const originRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(originCity)}&state=${encodeURIComponent(originUF)}&country=Brazil&format=json&limit=1`);
      const originData = await originRes.json();
      
      const destRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(destCity)}&state=${encodeURIComponent(destUF)}&country=Brazil&format=json&limit=1`);
      const destData = await destRes.json();

      if (!originData.length || !destData.length) {
        alert("Não foi possível encontrar as coordenadas para uma das cidades no mapa.");
        setIsLoading(false);
        return;
      }

      const oLat = parseFloat(originData[0].lat);
      const oLon = parseFloat(originData[0].lon);
      const dLat = parseFloat(destData[0].lat);
      const dLon = parseFloat(destData[0].lon);

      // 2. OSRM Routing com Alternativas
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=full&geometries=geojson&alternatives=true`;
      const routeRes = await fetch(osrmUrl);
      const routeJson = await routeRes.json();

      if (routeJson.code !== 'Ok' || !routeJson.routes.length) {
        alert("Não foi possível traçar uma rota por rodovia entre estas cidades.");
        setIsLoading(false);
        return;
      }

      // Rota Principal
      const primaryRoute = routeJson.routes[0];
      const distanceKm = primaryRoute.distance / 1000;
      const durationHours = primaryRoute.duration / 3600;
      const primaryLeafletCoords: [number, number][] = primaryRoute.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);

      // Rotas Alternativas (se existirem)
      const alternatives = routeJson.routes.slice(1).map((alt: any) => ({
        geometry: alt.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]) as [number, number][],
        distance: alt.distance / 1000,
        time: alt.duration / 3600
      }));

      // 3. Cálculos de Custos (Baseados na Rota Principal)
      const vehicle = vehicles.find(v => String(v.id) === String(selectedVehicle))!;
      const efficiency = vehicle.efficiency || 10;
      const litersNeeded = distanceKm / efficiency;
      const totalCost = litersNeeded * FUEL_PRICE_BASE;

      setRouteData({
        distance: distanceKm,
        time: durationHours,
        cost: totalCost,
        consumption: litersNeeded,
        originName: `${originCity} - ${originUF}`,
        destName: `${destCity} - ${destUF}`,
        geometry: primaryLeafletCoords,
        alternatives: alternatives
      });

    } catch (err) {
      console.error(err);
      alert("Houve um erro ao se comunicar com os servidores de GPS.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-fleet-600 dark:text-fleet-400" />
            Roteirização Inteligente
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Integração OSRM e IBGE para trajetos reais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        
        {/* Painel Esquerdo */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 dark:bg-fleet-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 mb-6">
              <Navigation className="w-5 h-5 text-indigo-500" />
              Configurar Viagem
            </h2>

            <div className="space-y-5">
              
              {/* --- ORIGEM --- */}
              <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                <label className="text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Origem
                </label>
                <div className="flex gap-2">
                  <select 
                    className="w-1/3 bg-white dark:bg-fleet-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-white outline-none"
                    value={originUF}
                    onChange={(e) => { setOriginUF(e.target.value); setOriginCity(''); }}
                  >
                    <option value="">UF</option>
                    {states.map(s => <option key={s.id} value={s.sigla}>{s.sigla}</option>)}
                  </select>
                  <select 
                    className="w-2/3 bg-white dark:bg-fleet-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-white outline-none disabled:opacity-50"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    disabled={!originUF}
                  >
                    <option value="">Cidade...</option>
                    {originCities.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              {/* --- DESTINO --- */}
              <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                <label className="text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Destino
                </label>
                <div className="flex gap-2">
                  <select 
                    className="w-1/3 bg-white dark:bg-fleet-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-white outline-none"
                    value={destUF}
                    onChange={(e) => { setDestUF(e.target.value); setDestCity(''); }}
                  >
                    <option value="">UF</option>
                    {states.map(s => <option key={s.id} value={s.sigla}>{s.sigla}</option>)}
                  </select>
                  <select 
                    className="w-2/3 bg-white dark:bg-fleet-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-white outline-none disabled:opacity-50"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    disabled={!destUF}
                  >
                    <option value="">Cidade...</option>
                    {destCities.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              {/* Veículo */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 dark:text-fleet-200 uppercase tracking-widest mb-1.5 block">
                  Veículo Alocado
                </label>
                <select 
                  className="w-full bg-slate-50 dark:bg-fleet-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                >
                  <option value="">Selecione o Veículo...</option>
                  {activeVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.model} ({v.efficiency || 10} km/l)</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleCalculate}
                disabled={!originCity || !destCity || !selectedVehicle || isLoading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                {isLoading ? 'Consultando GPS...' : 'Traçar Rota Real'}
              </button>
            </div>
          </div>

          {/* Card de Resultados */}
          {routeData && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <h3 className="text-white/90 font-black text-lg mb-6 flex items-center gap-2 relative z-10">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Resumo da Rota
              </h3>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><Navigation className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Distância Real (OSRM)</p>
                      <p className="text-xl font-black text-white">{routeData.distance.toFixed(0)} <span className="text-sm font-medium text-white/60">km</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><Clock className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Duração Estimada</p>
                      <p className="text-xl font-black text-white">{Math.floor(routeData.time)}h {Math.round((routeData.time % 1) * 60)}m</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><Fuel className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-0.5">Consumo Previsto</p>
                      <p className="text-xl font-black text-white">{routeData.consumption.toFixed(1)} <span className="text-sm font-medium text-white/60">Litros</span></p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Custo Total Previsto</p>
                  <p className="text-4xl font-black text-white tracking-tighter flex items-center gap-1">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                    {routeData.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Mapa Direito */}
        <div className="lg:col-span-2 bg-white dark:bg-fleet-800 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm relative h-[500px] lg:h-auto z-0 border-4 border-indigo-50 dark:border-fleet-700/50">
          <MapContainer 
            bounds={BRAZIL_BOUNDS}
            maxBounds={BRAZIL_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={4}
            className="w-full h-full absolute inset-0 z-0"
            zoomControl={true}
          >
            <MapViewUpdater routeData={routeData} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
            />
            
            {routeData && (
              <>
                {/* Marker Inicial */}
                <Marker position={routeData.geometry[0]}>
                  <Popup className="font-bold text-slate-800">
                    <span className="block text-xs uppercase text-slate-400 tracking-widest mb-1">Partida</span>
                    {routeData.originName}
                  </Popup>
                </Marker>
                
                {/* Marker Final */}
                <Marker position={routeData.geometry[routeData.geometry.length - 1]}>
                  <Popup className="font-bold text-slate-800">
                    <span className="block text-xs uppercase text-slate-400 tracking-widest mb-1">Chegada</span>
                    {routeData.destName}
                  </Popup>
                </Marker>
                
                {/* Traçados das Rotas Alternativas */}
                {routeData.alternatives.map((alt, index) => (
                  <Polyline 
                    key={index}
                    positions={alt.geometry}
                    color="#94a3b8" // Cinza para rotas secundárias
                    weight={5} 
                    opacity={0.6}
                    dashArray="5, 10"
                  >
                    <Popup className="font-bold text-slate-800">
                      <span className="block text-xs uppercase text-slate-400 tracking-widest mb-1">Rota Alternativa {index + 1}</span>
                      <span className="block mb-1">Distância: {alt.distance.toFixed(0)} km</span>
                      <span>Duração: {Math.floor(alt.time)}h {Math.round((alt.time % 1) * 60)}m</span>
                    </Popup>
                  </Polyline>
                ))}

                {/* Traçado REAL da rodovia Principal (Por cima das alternativas) */}
                <Polyline 
                  positions={routeData.geometry}
                  color="#4f46e5" 
                  weight={6} 
                  opacity={0.9}
                >
                  <Popup className="font-bold text-slate-800">
                    <span className="block text-xs uppercase text-indigo-500 tracking-widest mb-1">Rota Principal (Mais Rápida)</span>
                    <span className="block mb-1">Distância: {routeData.distance.toFixed(0)} km</span>
                    <span>Duração: {Math.floor(routeData.time)}h {Math.round((routeData.time % 1) * 60)}m</span>
                  </Popup>
                </Polyline>
              </>
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
