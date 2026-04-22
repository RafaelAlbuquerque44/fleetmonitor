import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Driver {
  id: number;
  name: string;
  cnh: string;
  category: string;
  status: 'active' | 'vacation' | 'inactive';
  score: number;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Atenção';
  phone: string;
}

interface DriverContextType {
  drivers: Driver[];
  addDriver: (d: Driver) => void;
  removeDriver: (id: number) => void;
  updateDriver: (id: number, data: Partial<Driver>) => void;
}

const mockDrivers: Driver[] = [
  { id: 1, name: 'João Silva', cnh: '12345678900', category: 'D', status: 'active', score: 98, tier: 'Gold', phone: '(11) 98888-7777' },
  { id: 2, name: 'Maria Souza', cnh: '09876543211', category: 'E', status: 'active', score: 94, tier: 'Silver', phone: '(11) 97777-6666' },
  { id: 3, name: 'Carlos Pedroso', cnh: '45612378922', category: 'D', status: 'active', score: 89, tier: 'Bronze', phone: '(11) 96666-5555' },
  { id: 4, name: 'Ana Oliveira', cnh: '78945612333', category: 'C', status: 'vacation', score: 85, tier: 'Silver', phone: '(11) 95555-4444' },
  { id: 5, name: 'Marcos Santos', cnh: '32165498744', category: 'E', status: 'active', score: 82, tier: 'Bronze', phone: '(11) 94444-3333' },
  { id: 6, name: 'Luiza Mendes', cnh: '65432198755', category: 'D', status: 'active', score: 79, tier: 'Bronze', phone: '(11) 93333-2222' },
  { id: 7, name: 'Roberto Alves', cnh: '15975346866', category: 'E', status: 'inactive', score: 74, tier: 'Atenção', phone: '(11) 92222-1111' },
  { id: 8, name: 'Fernanda Costa', cnh: '35715948677', category: 'D', status: 'active', score: 71, tier: 'Atenção', phone: '(11) 91111-0000' },
];

const DriverContext = createContext<DriverContextType | undefined>(undefined);

export const DriverProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('ecoFleet_drivers');
    return saved ? JSON.parse(saved) : mockDrivers;
  });

  useEffect(() => {
    localStorage.setItem('ecoFleet_drivers', JSON.stringify(drivers));
  }, [drivers]);

  const addDriver = (newDriver: Driver) => {
    setDrivers(prev => [...prev, newDriver]);
  };

  const removeDriver = (id: number) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const updateDriver = (id: number, data: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  };

  return (
    <DriverContext.Provider value={{ drivers, addDriver, removeDriver, updateDriver }}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDrivers = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDrivers must be used within a DriverProvider');
  }
  return context;
};
