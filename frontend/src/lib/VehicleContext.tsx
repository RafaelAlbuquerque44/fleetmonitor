import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Vehicle {
  id: number;
  plate: string;
  model: string;
  year: number;
  status: string;
  city: string;
  uf: string;
  lat?: number;
  lng?: number;
  driverId?: number | null;
  fuelLevel?: number; // 0 to 100
  tireHealth?: number; // 0 to 100
  sketchfabId?: string;
  maintenanceDetails?: string;
  purchasePrice?: number;
  monthlyRevenue?: number;
  monthlyMaintenance?: number;
  monthlyFuel?: number;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (v: Vehicle) => void;
  removeVehicle: (id: number) => void;
  updateVehicle: (id: number, data: Partial<Vehicle>) => void;
}

const mockVehicles: Vehicle[] = [
  { id: 1, plate: 'ABC-1234', model: 'Volvo FH 540', year: 2023, status: 'active', city: 'São Paulo', uf: 'SP', lat: -23.5505, lng: -46.6333, driverId: 1, fuelLevel: 85, tireHealth: 90, purchasePrice: 580000, monthlyRevenue: 45000, monthlyMaintenance: 2000, monthlyFuel: 15000 },
  { id: 2, plate: 'XYZ-9876', model: 'Scania R450', year: 2022, status: 'maintenance', city: 'Campinas', uf: 'SP', lat: -22.9099, lng: -47.0626, driverId: null, fuelLevel: 15, tireHealth: 30, sketchfabId: '891ee120d3734b439a9a5e63eaa10a4c', maintenanceDetails: 'Revisão de 50.000km', purchasePrice: 520000, monthlyRevenue: 28000, monthlyMaintenance: 14000, monthlyFuel: 9500 },
  { id: 3, plate: 'DEF-5678', model: 'Mercedes Actros', year: 2024, status: 'active', city: 'Rio de Janeiro', uf: 'RJ', lat: -22.9068, lng: -43.1729, driverId: 2, fuelLevel: 60, tireHealth: 75, purchasePrice: 620000, monthlyRevenue: 52000, monthlyMaintenance: 1500, monthlyFuel: 16000 },
  { id: 4, plate: 'GHI-9012', model: 'MAN TGX', year: 2021, status: 'active', city: 'Belo Horizonte', uf: 'MG', lat: -19.9167, lng: -43.9345, driverId: 3, fuelLevel: 45, tireHealth: 82, sketchfabId: '2f475fb13b1f40cdad1709135404a508', purchasePrice: 480000, monthlyRevenue: 38000, monthlyMaintenance: 4500, monthlyFuel: 13000 },
  { id: 5, plate: 'JKL-3456', model: 'DAF CF', year: 2023, status: 'inactive', city: 'Curitiba', uf: 'PR', lat: -25.4284, lng: -49.2733, driverId: null, fuelLevel: 95, tireHealth: 98, sketchfabId: '2f2ced3e54f24b4f8bee695e3261bd30', purchasePrice: 510000, monthlyRevenue: 0, monthlyMaintenance: 1200, monthlyFuel: 500 },
];

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('ecoFleet_vehicles');
    return saved ? JSON.parse(saved) : mockVehicles;
  });

  useEffect(() => {
    localStorage.setItem('ecoFleet_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(v => {
          if (v.status === 'active') {
             // Caminhão na rua gera lucro alto, mas queima diesel e desgasta pneu
             const revenueGain = Math.floor(Math.random() * 800) + 200;
             const fuelCost = Math.floor(Math.random() * 150) + 50;
             const maintenanceCost = Math.floor(Math.random() * 20);
             return {
               ...v,
               monthlyRevenue: (v.monthlyRevenue || 0) + revenueGain,
               monthlyFuel: (v.monthlyFuel || 0) + fuelCost,
               monthlyMaintenance: (v.monthlyMaintenance || 0) + maintenanceCost
             };
          } 
          if (v.status === 'maintenance') {
             // Caminhão na oficina só consome dinheiro
             const mechanicCost = Math.floor(Math.random() * 500) + 100;
             return {
               ...v,
               monthlyMaintenance: (v.monthlyMaintenance || 0) + mechanicCost
             };
          }
          return v;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addVehicle = (newVehicle: Vehicle) => {
    setVehicles(prev => [...prev, newVehicle]);
  };

  const removeVehicle = (id: number) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const updateVehicle = (id: number, data: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  };

  return (
    <VehicleContext.Provider value={{ vehicles, addVehicle, removeVehicle, updateVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
}
