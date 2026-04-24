import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Leaf, 
  Wrench, 
  Wallet, 
  Sparkles,
  Check,
  X,
  Lock,
  ShoppingBag
} from 'lucide-react';
import { useAccount } from '../lib/AccountContext';
import type { Conta } from '../lib/AccountContext';

interface ModuleConfig {
  id: keyof Conta; // The field name in Conta
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const MODULES: ModuleConfig[] = [
  {
    id: 'produto_telemetria',
    name: 'Rastreamento',
    description: 'Monitoramento em tempo real, velocidade, alertas e análise de tempo ocioso para toda a frota.',
    icon: MapPin,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'produto_roteirizacao',
    name: 'ESG & Relatórios',
    description: 'Relatórios avançados de emissão de CO₂, cálculo de rotas eficientes e metas de sustentabilidade.',
    icon: Leaf,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  {
    id: 'produto_manutencao',
    name: 'IA & Oficina',
    description: 'Gestão completa de OS, histórico de manutenções, controle de estoque de peças e custos de oficina.',
    icon: Wrench,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  {
    id: 'produto_financeiro',
    name: 'Controle Financeiro',
    description: 'Análise de receita vs despesa, cálculo de economia de combustível e retorno sobre investimento (ROI).',
    icon: Wallet,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  {
    id: 'produto_ia_assistente',
    name: 'Widget FleetAI',
    description: 'Sua inteligência artificial integrada para monitorar a frota e gerar predições ao vivo no canto do menu.',
    icon: Sparkles,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  }
];

export default function Marketplace() {
  const { activeAccount, refreshContas } = useAccount();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // ID 999999 é a conta Admin Global (mock) que tem tudo fixo
  const isGlobalAdmin = activeAccount?.id === 999999;

  const toggleModule = async (moduleId: string, currentValue: boolean) => {
    if (isGlobalAdmin || !activeAccount) return;
    
    setIsProcessing(moduleId);
    try {
      const response = await fetch(`http://localhost:8000/contas/${activeAccount.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [moduleId]: !currentValue
        })
      });

      if (response.ok) {
        // Atualiza todo o sistema com a nova configuração de conta
        await refreshContas();
      } else {
        console.error("Erro ao atualizar módulo");
      }
    } catch (error) {
      console.error("Erro de rede:", error);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3"
          >
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <ShoppingBag className="w-8 h-8 text-indigo-500" />
            </div>
            Marketplace
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-fleet-200 mt-2 font-medium"
          >
            Gerencie as funcionalidades e módulos ativos para a conta atual.
          </motion.p>
        </div>
      </div>

      {isGlobalAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 p-4 rounded-2xl flex items-start gap-4"
        >
          <Lock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Conta de Demonstração</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Esta é a conta "Admin Global (Demo)". Todos os módulos estão nativamente habilitados para demonstração e não podem ser desativados. Para testar o bloqueio de módulos, crie ou acesse outra conta.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULES.map((module, index) => {
          const isActive = activeAccount ? !!activeAccount[module.id as keyof typeof activeAccount] : false;
          const loading = isProcessing === module.id;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                isActive 
                  ? 'bg-white dark:bg-white/10 border-gray-200 dark:border-white/20 shadow-md' 
                  : 'bg-gray-50 dark:bg-black/20 border-gray-200/50 dark:border-white/5 opacity-80'
              }`}
            >
              {/* Background Glow se Ativo */}
              {isActive && (
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50 ${module.bgColor}`}></div>
              )}

              <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl shadow-sm border border-white/20 ${module.bgColor} ${module.color}`}>
                    <module.icon className="w-6 h-6" />
                  </div>
                  {isActive ? (
                    <span className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-200 dark:border-green-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ativo
                    </span>
                  ) : (
                    <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-xs font-bold px-3 py-1 rounded-full border border-gray-300 dark:border-white/10 flex items-center gap-1">
                      <X className="w-3 h-3" /> Inativo
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{module.name}</h3>
                <p className="text-sm text-slate-500 dark:text-fleet-200/80 font-medium flex-1 mb-6 leading-relaxed">
                  {module.description}
                </p>

                <button
                  onClick={() => toggleModule(module.id, isActive)}
                  disabled={isGlobalAdmin || loading}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
                    isGlobalAdmin
                      ? 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed border border-gray-300 dark:border-white/10'
                      : loading
                        ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 cursor-wait'
                        : isActive
                          ? 'bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30'
                          : 'bg-fleet-600 hover:bg-fleet-700 dark:bg-fleet-500 dark:hover:bg-fleet-400 text-white shadow-fleet-500/25'
                  }`}
                >
                  {loading ? (
                    <span className="animate-pulse">Processando...</span>
                  ) : isGlobalAdmin ? (
                    <>
                      <Lock className="w-4 h-4" /> Bloqueado
                    </>
                  ) : isActive ? (
                    'Desativar Módulo'
                  ) : (
                    'Ativar Módulo'
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
