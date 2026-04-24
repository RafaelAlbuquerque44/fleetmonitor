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

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [contas, setContas] = useState<Conta[]>([ADMIN_GLOBAL_MOCK]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeAccountId, setActiveAccountIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('fleet_active_account');
    return saved ? parseInt(saved, 10) : null;
  });

  const setActiveAccountId = (id: number) => {
    setActiveAccountIdState(id);
    localStorage.setItem('fleet_active_account', id.toString());
  };

  const refreshContas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/contas/');
      if (res.ok) {
        const data = await res.json();
        const todasContas = [ADMIN_GLOBAL_MOCK, ...data];
        setContas(todasContas);
        
        // Se temos contas e não temos uma ativa, ou a ativa não existe mais
        if (todasContas.length > 0) {
          if (!activeAccountId || !todasContas.find((c: Conta) => c.id === activeAccountId)) {
            setActiveAccountId(ADMIN_GLOBAL_MOCK.id);
          }
        }
      }
    } catch (e) {
      console.error("Erro ao buscar contas", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar contas inicialmente
  useEffect(() => {
    refreshContas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeAccount = contas.find(c => c.id === activeAccountId) || null;

  return (
    <AccountContext.Provider value={{ contas, activeAccountId, activeAccount, setActiveAccountId, refreshContas, isLoading }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}
