/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DEMO_ACCOUNT_ID } from './constants';
import { readStorage, readStoredArray, writeStorage } from './storage';

export interface Conta {
  id: number;
  nome_cliente: string;
  documento: string;
  email_contato: string;
  telefone?: string;
  status: string;
  produto_telemetria?: boolean;
  produto_manutencao?: boolean;
  produto_financeiro?: boolean;
  produto_roteirizacao?: boolean;
  criado_em?: string;
}

interface AccountContextType {
  contas: Conta[];
  activeAccountId: number | null;
  activeAccount: Conta | null;
  setActiveAccountId: (id: number) => void;
  addConta: (conta: Conta) => void;
  updateConta: (id: number, data: Partial<Conta>) => void;
}

const ADMIN_GLOBAL_MOCK: Conta = {
  id: DEMO_ACCOUNT_ID,
  nome_cliente: "Admin Global (Demo)",
  documento: "00.000.000/0001-00",
  email_contato: "admin@fleetmonitor.com",
  status: "ativo",
  produto_telemetria: true,
  produto_manutencao: true,
  produto_financeiro: true,
  produto_roteirizacao: true
};

const STORAGE_KEY = 'ecoFleet_contas';

function loadContas(): Conta[] {
  const contas = readStoredArray<Conta>(STORAGE_KEY, [], (value): value is Conta => {
    if (typeof value !== 'object' || value === null) return false;
    const c = value as Record<string, unknown>;
    return typeof c.id === 'number' && Number.isSafeInteger(c.id) && c.id > 0
      && ['nome_cliente', 'documento', 'email_contato', 'status'].every(key => typeof c[key] === 'string')
      && ['produto_telemetria', 'produto_manutencao', 'produto_financeiro', 'produto_roteirizacao']
        .every(key => c[key] === undefined || typeof c[key] === 'boolean');
  });
  return [ADMIN_GLOBAL_MOCK, ...contas.filter(c => c.id !== DEMO_ACCOUNT_ID)];
}

function saveContas(contas: Conta[]) {
  // Don't save the mock entry itself – it's always injected on load
  const toSave = contas.filter(c => c.id !== DEMO_ACCOUNT_ID);
  writeStorage(STORAGE_KEY, JSON.stringify(toSave));
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [contas, setContas] = useState<Conta[]>(() => loadContas());
  const [selectedAccountId, setActiveAccountIdState] = useState<number>(() => {
    const saved = Number(readStorage('fleet_active_account'));
    return Number.isSafeInteger(saved) && saved > 0 ? saved : DEMO_ACCOUNT_ID;
  });

  // Persist whenever contas changes
  useEffect(() => {
    saveContas(contas);
  }, [contas]);

  // Accounts can be created in the separate /nova-conta tab.
  useEffect(() => {
    const syncAccounts = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setContas(loadContas());
    };
    window.addEventListener('storage', syncAccounts);
    return () => window.removeEventListener('storage', syncAccounts);
  }, []);

  const setActiveAccountId = (id: number) => {
    setActiveAccountIdState(id);
  };

  const addConta = (conta: Conta) => {
    setContas(prev => [...prev, conta]);
  };

  const updateConta = (id: number, data: Partial<Conta>) => {
    setContas(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const activeAccount = contas.find(c => c.id === selectedAccountId) ?? ADMIN_GLOBAL_MOCK;
  const activeAccountId = activeAccount.id;

  useEffect(() => {
    writeStorage('fleet_active_account', activeAccountId.toString());
  }, [activeAccountId]);

  return (
    <AccountContext.Provider value={{ contas, activeAccountId, activeAccount, setActiveAccountId, addConta, updateConta }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}
