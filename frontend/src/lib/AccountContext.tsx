import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Conta {
  id: number;
  nome_cliente: string;
  documento: string;
  email_contato: string;
  status: string;
  produto_telemetria?: boolean;
  produto_manutencao?: boolean;
  produto_financeiro?: boolean;
  produto_ia_assistente?: boolean;
  produto_roteirizacao?: boolean;
  criado_em?: string;
}

interface AccountContextType {
  contas: Conta[];
  activeAccountId: number | null;
  activeAccount: Conta | null;
  setActiveAccountId: (id: number) => void;
  refreshContas: () => Promise<void>;
  addConta: (conta: Conta) => void;
  updateConta: (id: number, data: Partial<Conta>) => void;
  isLoading: boolean;
}

const ADMIN_GLOBAL_MOCK: Conta = {
  id: 999999,
  nome_cliente: "Admin Global (Demo)",
  documento: "00.000.000/0001-00",
  email_contato: "admin@fleetmonitor.com",
  status: "ativo",
  produto_telemetria: true,
  produto_manutencao: true,
  produto_financeiro: true,
  produto_ia_assistente: true,
  produto_roteirizacao: true
};

const STORAGE_KEY = 'ecoFleet_contas';

function loadContas(): Conta[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: Conta[] = JSON.parse(saved);
      // Always ensure Admin Global is present and up-to-date
      const withoutMock = parsed.filter(c => c.id !== 999999);
      return [ADMIN_GLOBAL_MOCK, ...withoutMock];
    }
  } catch {
    // ignore parse errors
  }
  return [ADMIN_GLOBAL_MOCK];
}

function saveContas(contas: Conta[]) {
  // Don't save the mock entry itself – it's always injected on load
  const toSave = contas.filter(c => c.id !== 999999);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [contas, setContas] = useState<Conta[]>(() => loadContas());
  const [isLoading] = useState(false);

  const [activeAccountId, setActiveAccountIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('fleet_active_account');
    return saved ? parseInt(saved, 10) : ADMIN_GLOBAL_MOCK.id;
  });

  // Persist whenever contas changes
  useEffect(() => {
    saveContas(contas);
  }, [contas]);

  const setActiveAccountId = (id: number) => {
    setActiveAccountIdState(id);
    localStorage.setItem('fleet_active_account', id.toString());
  };

  // refreshContas now just re-reads from localStorage (no network call)
  const refreshContas = async () => {
    setContas(loadContas());
  };

  const addConta = (conta: Conta) => {
    setContas(prev => [...prev, conta]);
  };

  const updateConta = (id: number, data: Partial<Conta>) => {
    setContas(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const activeAccount = contas.find(c => c.id === activeAccountId) || null;

  return (
    <AccountContext.Provider value={{ contas, activeAccountId, activeAccount, setActiveAccountId, refreshContas, addConta, updateConta, isLoading }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}
