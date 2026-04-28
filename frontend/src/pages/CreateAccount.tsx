import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Mail, Phone, FileText, CheckCircle2, 
  ChevronRight, ArrowLeft, ShieldCheck,
  Wrench, DollarSign, BrainCircuit, Route as RouteIcon
} from 'lucide-react';
import { useAccount } from '../lib/AccountContext';

const PRODUCTS = [
  { id: 'produto_manutencao', name: 'Gestão de Manutenção', icon: Wrench, desc: 'Controle de preventivas, corretivas e estoque de peças.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'produto_financeiro', name: 'Módulo Financeiro', icon: DollarSign, desc: 'Controle de custos, receitas e relatórios de DRE da frota.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'produto_ia_assistente', name: 'IA Assistente Preditiva', icon: BrainCircuit, desc: 'Previsões de falhas e análise inteligente de dados da frota.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'produto_roteirizacao', name: 'Roteirização Inteligente', icon: RouteIcon, desc: 'Otimização de rotas para economia de combustível e tempo.', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
];

export default function CreateAccount() {
  const navigate = useNavigate();
  const { refreshContas, setActiveAccountId } = useAccount();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_cliente: '',
    documento: '',
    email_contato: '',
    telefone: '',
    produto_manutencao: false,
    produto_financeiro: false,
    produto_ia_assistente: false,
    produto_roteirizacao: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked } = e.target;
    let { value } = e.target;
    
    if (name === 'documento') {
      value = value.replace(/\D/g, ''); // Remove tudo o que não é dígito
      if (value.length > 11) {
        // Máscara de CNPJ: 00.000.000/0001-00
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        // Máscara de CPF: 000.000.000-00
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
    } else if (name === 'telefone') {
      value = value.replace(/\D/g, ''); // Remove tudo o que não é dígito
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta do DDD
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');    // Coloca hífen
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      [productId]: !prev[productId as keyof typeof prev]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/contas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const novaConta = await response.json();
        
        // Atualiza a lista de contas globalmente
        await refreshContas();
        
        // Muda para a conta recém criada (cujos arrays estarão zerados em seus respectivos contextos)
        if (novaConta && novaConta.id) {
          setActiveAccountId(novaConta.id);
        }
        
        setStep(3); // Sucesso
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg = "Verifique os dados informados.";
        if (Object.keys(errorData).length > 0) {
           errorMsg = Object.entries(errorData).map(([key, val]) => {
             const keyName = key === 'documento' ? 'CNPJ' : key === 'email_contato' ? 'E-mail' : key;
             return `${keyName}: ${val}`;
           }).join('\n');
        }
        alert(`Erro ao criar conta:\n${errorMsg}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f1f5f9] dark:bg-fleet-900 relative overflow-hidden transition-colors duration-500 text-gray-900 dark:text-white flex">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-fleet-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-900/40 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] left-[50%] w-[20%] h-[20%] bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="w-full h-full relative z-10 flex flex-col md:flex-row bg-white/40 dark:bg-black/20 backdrop-blur-3xl">
        
        {/* Sidebar / Steps Progress */}
        <div className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 min-w-[320px] bg-gradient-to-br from-indigo-900 to-fleet-800 border-r border-white/10 p-8 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10 mb-12">
            <button 
              onClick={() => window.close()}
              className="mb-8 flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-black text-white mb-2">Criar Conta</h1>
            <p className="text-fleet-200 text-sm">Configure um novo ambiente para o seu cliente.</p>
          </div>

            <div className="relative z-10 flex flex-col gap-6 mt-4">
              <div className={`flex items-center gap-5 transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${step >= 1 ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-white/10 text-white/50'}`}>
                  1
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Dados do Cliente</p>
                  <p className="text-sm text-fleet-200">Informações básicas</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-5 transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${step >= 2 ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-white/10 text-white/50'}`}>
                  2
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Produtos</p>
                  <p className="text-sm text-fleet-200">Ativação de módulos</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-5 transition-all duration-500 ${step >= 3 ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${step >= 3 ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-white/10 text-white/50'}`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Concluído</p>
                  <p className="text-sm text-fleet-200">Conta ativa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8 md:p-14 lg:p-20 flex flex-col justify-center relative">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl">
                <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Building2 className="w-8 h-8" />
                  </div>
                  Informações da Empresa
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-white/90 uppercase tracking-wide">Nome da Conta / Razão Social</label>
                    <input 
                      type="text" 
                      name="nome_cliente"
                      value={formData.nome_cliente}
                      onChange={handleChange}
                      className="w-full bg-white/80 dark:bg-black/20 border-2 border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="Ex: Transportes Silva LTDA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-white/90 uppercase tracking-wide">CNPJ / Documento</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="documento"
                        value={formData.documento}
                        onChange={handleChange}
                        maxLength={18}
                        className="w-full bg-white/80 dark:bg-black/20 border-2 border-gray-200 dark:border-white/10 rounded-2xl pl-14 pr-5 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-white/90 uppercase tracking-wide">E-mail de Contato</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                          <Mail className="w-6 h-6 text-slate-400" />
                        </div>
                        <input 
                          type="email" 
                          name="email_contato"
                          value={formData.email_contato}
                          onChange={handleChange}
                          className="w-full bg-white/80 dark:bg-black/20 border-2 border-gray-200 dark:border-white/10 rounded-2xl pl-14 pr-5 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                          placeholder="contato@empresa.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-white/90 uppercase tracking-wide">Telefone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                          <Phone className="w-6 h-6 text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          maxLength={15}
                          className="w-full bg-white/80 dark:bg-black/20 border-2 border-gray-200 dark:border-white/10 rounded-2xl pl-14 pr-5 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!formData.nome_cliente || !formData.documento}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    Próximo Passo
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl">
                <div className="mb-8">
                  <h2 className="text-3xl font-black mb-4 flex items-center gap-3 text-slate-800 dark:text-white">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    Ativação de Produtos
                  </h2>
                  <p className="text-lg text-slate-500 dark:text-white/60">
                    Selecione os módulos que estarão disponíveis para esta conta. Você poderá alterar isso depois.
                  </p>
                </div>

                <div className="grid gap-4">
                  {PRODUCTS.map(prod => {
                    const isSelected = formData[prod.id as keyof typeof formData];
                    const Icon = prod.icon;
                    return (
                      <div 
                        key={prod.id}
                        onClick={() => handleProductToggle(prod.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-5 ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10 scale-[1.01]' : 'border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/30 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10'}`}
                      >
                        <div className={`w-14 h-14 rounded-xl ${prod.bg} ${prod.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{prod.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-white/60">{prod.desc}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 dark:border-white/30'}`}>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 flex justify-between">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold text-lg transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg font-bold transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {isLoading ? 'Criando...' : 'Finalizar Criação'}
                    {!isLoading && <CheckCircle2 className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 m-auto">
                <div className="w-32 h-32 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <h2 className="text-5xl font-black mb-4 text-slate-800 dark:text-white">Conta Criada!</h2>
                <p className="text-lg text-slate-500 dark:text-white/60 mb-10 max-w-md">
                  A conta <strong>{formData.nome_cliente}</strong> foi configurada com sucesso e já está pronta para uso no sistema.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1"
                  >
                    Ir para Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      setFormData({
                        nome_cliente: '', documento: '', email_contato: '', telefone: '',
                        produto_manutencao: false, produto_financeiro: false,
                        produto_ia_assistente: false, produto_roteirizacao: false,
                      });
                      setStep(1);
                    }}
                    className="px-8 py-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-slate-700 dark:text-white border-2 border-gray-200 dark:border-white/10 font-bold text-lg transition-all hover:-translate-y-1"
                  >
                    Criar Outra
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
    </div>
  );
}
