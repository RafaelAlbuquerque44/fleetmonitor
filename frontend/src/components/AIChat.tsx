import { Fragment, useState, useRef, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X, Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { useVehicles } from '../lib/VehicleContext';
import { useDrivers } from '../lib/DriverContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu Assistente FleetAI. Como posso ajudar com sua frota hoje? Você pode me perguntar sobre manutenções preditivas, status de veículos ou pedir para registrar uma nova operação.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { vehicles, addVehicle, updateVehicle } = useVehicles();
  const { addDriver } = useDrivers();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Iniciar a sessão de chat do Gemini quando abrir (se a chave existir)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey && !chatSession) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "Você é o FleetAI, um assistente virtual especialista do sistema FleetMonitor de gestão de frotas, telemetria e análise de custos. Seja conciso, profissional, e ajude o usuário com dados de frota, manutenção, registro de veículos operacionais e métricas financeiras. Você está liberado para retornar tabelas formatadas em markdown quando detalhando custos financeiros.",
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "registerVehicle",
                    description: "Cadastra imediatamente um novo veículo no sistema através da placa, modelo, ano e localização informados pelo usuário. Chame esta função ASSIM QUE o usuário fornecer os dados necessários do veículo.",
                    parameters: {
                      type: SchemaType.OBJECT,
                      properties: {
                        plate: { type: SchemaType.STRING, description: "A placa do veículo (ex: ABC-1234)" },
                        model: { type: SchemaType.STRING, description: "A marca e modelo do veículo (ex: Volvo FH 540)" },
                        year: { type: SchemaType.INTEGER, description: "O ano de fabricação (ex: 2022)" },
                        city: { type: SchemaType.STRING, description: "Cidade de operação (ex: São Paulo)" },
                        uf: { type: SchemaType.STRING, description: "Estado/UF (ex: SP)" },
                      },
                      required: ["plate", "model", "year", "city", "uf"]
                    }
                  },
                  {
                    name: "getFleetInfo",
                    description: "Retorna a listagem de toda a frota de caminhões atual, com seus status, placas, modelos e níveis de combustível. Utilize esta função antes de responder qualquer pergunta sobre a quantidade, o status ou dados de veículos da frota.",
                    parameters: {
                      type: SchemaType.OBJECT,
                      properties: {}
                    }
                  },
                  {
                    name: "sendToMaintenance",
                    description: "Envia um caminhão específico para a oficina de manutenção (altera o status para 'maintenance'). Chame esta função caso o usuário solicite que um veículo precisa de reparos, troca de peças ou revisão.",
                    parameters: {
                      type: SchemaType.OBJECT,
                      properties: {
                        plate: { type: SchemaType.STRING, description: "A placa do veículo que vai para oficina (ex: ABC-1234)" },
                        reason: { type: SchemaType.STRING, description: "O motivo da manutenção, como 'troca de óleo' ou 'revisão'." }
                      },
                      required: ["plate", "reason"]
                    }
                  },
                  {
                    name: "removeFromMaintenance",
                    description: "Retira um veículo da manutenção, marcando-o de volta como ativo/pronto para operação. Chame esta função se o usuário afirmar que o conserto acabou ou mandar liberar da oficina.",
                    parameters: {
                      type: SchemaType.OBJECT,
                      properties: {
                        plate: { type: SchemaType.STRING, description: "A placa do veículo a ser liberado (ex: ABC-1234)" }
                      },
                      required: ["plate"]
                    }
                  },
                  {
                    name: "registerDriver",
                    description: "Cadastra imediatamente um novo motorista no sistema. Requer o nome, CNH, categoria da carteira e telefone informados pelo usuário. Chame esta função ASSIM QUE o usuário fornecer os dados do motorista a ser contratado/cadastrado.",
                    parameters: {
                      type: SchemaType.OBJECT,
                      properties: {
                        name: { type: SchemaType.STRING, description: "O nome completo do motorista (ex: João Santos)" },
                        cnh: { type: SchemaType.STRING, description: "O número da CNH (ex: 12345678900)" },
                        category: { type: SchemaType.STRING, description: "A categoria da CNH (ex: D ou E)" },
                        phone: { type: SchemaType.STRING, description: "O telefone de contato (ex: 11 99999-9999)" }
                      },
                      required: ["name", "cnh", "category", "phone"]
                    }
                  },
                  {
                    name: "getFinancialMetrics",
                    description: "Retorna um balanço financeiro e de custos operacionais simulados (em Reais R$) da frota atual baseado no status e contagem de veículos. Chame esta função caso o usuário pergunte sobre custos, prejuízos, faturamento, gastos com combustível ou métricas financeiras.",
                    parameters: {
                      type: SchemaType.OBJECT,
                      properties: {}
                    }
                  }
                ]
              }
            ]
          });
          
          setChatSession(model.startChat({
            history: [
              {
                role: "user",
                parts: [{ text: "Olá" }],
              },
              {
                role: "model",
                parts: [{ text: "Olá! Sou seu Assistente FleetAI. Como posso ajudar com sua frota hoje? Você pode me perguntar sobre manutenções preditivas, status de veículos ou pedir para registrar uma nova operação." }],
              },
            ],
          }));
        } catch (error) {
          console.error("Erro ao inicializar Gemini:", error);
        }
      }
    }
  }, [messages, isOpen, chatSession]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'cole_sua_chave_gemini_aqui') {
        throw new Error("⚠️ A chave da API do Gemini não foi configurada. No seu arquivo `.env.local` na pasta `frontend`, adicione a variável VITE_GEMINI_API_KEY com a sua chave real.");
      }

      if (chatSession) {
        let result = await chatSession.sendMessage(userText);
        
        // Verificar se o Gemini chamou alguma função
        const functionCalls = result.response.functionCalls();
        let finalResponseText = '';

        if (functionCalls && functionCalls.length > 0) {
          const functionResponses = [];

          for (const call of functionCalls) {
            if (call.name === "registerVehicle") {
              const args = call.args as any;
              
              const newId = Math.floor(Math.random() * 10000) + 1000;
              addVehicle({
                id: newId,
                plate: args.plate,
                model: args.model,
                year: args.year,
                city: args.city || 'Desconhecida',
                uf: args.uf || '--',
                status: 'active',
                fuelLevel: 100,
                tireHealth: 100
              });

              functionResponses.push({
                functionResponse: {
                  name: "registerVehicle",
                  response: {
                    success: true,
                    message: "Veículo de placa " + args.plate + " cadastrado com sucesso no banco de dados com ID " + newId
                  }
                }
              });
            } else if (call.name === "registerDriver") {
              const args = call.args as any;
              
              const newId = Math.floor(Math.random() * 10000) + 1000;
              addDriver({
                id: newId,
                name: args.name,
                cnh: args.cnh,
                category: args.category || 'B',
                status: 'active',
                score: 100, // Motorista novo começa com 100
                tier: 'Gold', // Motorista novo começa como Gold
                phone: args.phone || '--'
              });

              functionResponses.push({
                functionResponse: {
                  name: "registerDriver",
                  response: {
                    success: true,
                    message: "Motorista " + args.name + " cadastrado com sucesso com a CNH " + args.cnh + " no ID " + newId
                  }
                }
              });
            } else if (call.name === "getFleetInfo") {
              const safeVehicles = vehicles.map(v => ({
                id: v.id,
                plate: v.plate,
                model: v.model,
                status: v.status,
                fuelLevel: v.fuelLevel,
                maintenanceDetails: v.maintenanceDetails || 'Nenhum problema crônico detectado.'
              }));

              functionResponses.push({
                functionResponse: {
                  name: "getFleetInfo",
                  response: { fleet: safeVehicles }
                }
              });
            } else if (call.name === "sendToMaintenance") {
              const args = call.args as any;
              
              const targetVehicle = vehicles.find(v => v.plate.replace(/[^A-Za-z0-9]/g,'').toUpperCase() === args.plate.replace(/[^A-Za-z0-9]/g,'').toUpperCase());
              
              if (targetVehicle) {
                updateVehicle(targetVehicle.id, { status: 'maintenance', maintenanceDetails: args.reason });
                functionResponses.push({
                  functionResponse: {
                    name: "sendToMaintenance",
                    response: {
                      success: true,
                      message: "Status atualizado! Veículo da placa " + targetVehicle.plate + " foi removido de ativo e colocado em manutenção no Kanban por causa de: " + args.reason
                    }
                  }
                });
              } else {
                functionResponses.push({
                  functionResponse: {
                    name: "sendToMaintenance",
                    response: {
                      success: false,
                      message: "Erro: Não encontrei nenhum veículo com a placa " + args.plate + " na base de dados."
                    }
                  }
                });
              }
            } else if (call.name === "removeFromMaintenance") {
              const args = call.args as any;
              
              const targetVehicle = vehicles.find(v => v.plate.replace(/[^A-Za-z0-9]/g,'').toUpperCase() === args.plate.replace(/[^A-Za-z0-9]/g,'').toUpperCase());
              
              if (targetVehicle && targetVehicle.status === 'maintenance') {
                updateVehicle(targetVehicle.id, { status: 'active', maintenanceDetails: '' });
                functionResponses.push({
                  functionResponse: {
                    name: "removeFromMaintenance",
                    response: {
                      success: true,
                      message: "Status atualizado! Veículo da placa " + targetVehicle.plate + " foi liberado da oficina e assinado como 'ativo' no sistema novamente."
                    }
                  }
                });
              } else if (targetVehicle && targetVehicle.status !== 'maintenance') {
                functionResponses.push({
                  functionResponse: {
                    name: "removeFromMaintenance",
                    response: {
                      success: false,
                      message: "Atenção: O veículo da placa " + targetVehicle.plate + " já se encontra com status operante, ele não estava em manutenção."
                    }
                  }
                });
              } else {
                functionResponses.push({
                  functionResponse: {
                    name: "removeFromMaintenance",
                    response: {
                      success: false,
                      message: "Erro: Não encontrei nenhum veículo com a placa " + args.plate + " na base de dados do sistema."
                    }
                  }
                });
              }
            } else if (call.name === "getFinancialMetrics") {
              const activeCount = vehicles.filter(v => v.status === 'active').length;
              const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;
              const inactiveCount = vehicles.filter(v => v.status === 'inactive').length;
              const totalCount = vehicles.length;

              // Mock calculation logic
              const estimatedRevenue = activeCount * 45000;
              const fuelCost = activeCount * 12000;
              const maintenanceDeficit = maintenanceCount * 8500;
              const inactiveLoss = inactiveCount * 3000;
              const netProfit = estimatedRevenue - fuelCost - maintenanceDeficit - inactiveLoss;

              functionResponses.push({
                functionResponse: {
                  name: "getFinancialMetrics",
                  response: { 
                    metrics: {
                       totalVehicles: totalCount,
                       estimatedGrossRevenueMothly: `R$ ${estimatedRevenue.toLocaleString('pt-BR')},00`,
                       estimatedFuelCostMonthly: `R$ ${fuelCost.toLocaleString('pt-BR')},00`,
                       maintenanceDeficitMonthly: `R$ ${maintenanceDeficit.toLocaleString('pt-BR')},00`,
                       inactiveLossMonthly: `R$ ${inactiveLoss.toLocaleString('pt-BR')},00`,
                       netProfitEstimated: `R$ ${netProfit.toLocaleString('pt-BR')},00`,
                       insight: "Este é um cálculo simulado baseado nos status da frota. Veículos parados estão gerando perda de oportunidade."
                    } 
                  }
                }
              });
            }
          }

          if (functionResponses.length > 0) {
            const functionResponseResult = await chatSession.sendMessage(functionResponses);
            finalResponseText = functionResponseResult.response.text();
          }
        } else {
          // Se não chamou função, pega o texto normal
          finalResponseText = result.response.text();
        }
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalResponseText
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
         throw new Error("Sessão da Inteligência Artificial não pôde ser iniciada.");
      }
    } catch (error: any) {
      let errorMessage = error.message || "Ocorreu um erro desconhecido.";
      
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        errorMessage = "⚠️ Limite de requisições atingido (Erro 429). A chave de API do Gemini configurada excedeu a cota do plano gratuito (15 requisições por minuto). Por favor, aguarde cerca de 1 minuto para fazer novas perguntas, ou atualize sua chave para uma conta com limite maior no arquivo `.env.local`.";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-[#f1f5f9] dark:bg-fleet-900 shadow-2xl border-l border-gray-200 dark:border-white/10">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-lg font-black text-slate-800 dark:text-white leading-5">FleetMonitor AI</DialogTitle>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">Powered by Gemini</p>
                        </div>
                      </div>
                      <div className="flex h-7 items-center">
                        <button
                          type="button"
                          className="relative rounded-full p-2 text-slate-400 hover:text-slate-500 dark:text-fleet-200 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none"
                          onClick={onClose}
                        >
                          <span className="absolute -inset-2.5" />
                          <span className="sr-only">Fechar painel</span>
                          <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="relative flex-1 px-4 py-6 sm:px-6 overflow-y-auto custom-scrollbar bg-[#f1f5f9] dark:bg-fleet-900">
                      <div className="space-y-6">
                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={cn(
                              "flex gap-4 w-full",
                              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border",
                              msg.role === 'user' 
                                ? "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white border-gray-300 dark:border-white/20" 
                                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent"
                            )}>
                              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                              msg.role === 'user'
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-[#f1f5f9] dark:bg-white/10 text-slate-800 dark:text-white border border-gray-200 dark:border-white/10 rounded-tl-none"
                            )}>
                              <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        ))}

                        {isTyping && (
                          <div className="flex gap-4 w-full">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-[#f1f5f9] dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-none px-4 py-4 shadow-sm flex items-center gap-1.5 w-16">
                               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-[#f1f5f9] dark:bg-white/5 shrink-0">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Consulte a frota ou cadastre veículos..."
                          className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-shadow"
                        />
                        <button
                          onClick={handleSend}
                          disabled={!input.trim() || isTyping}
                          className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-px" />}
                        </button>
                      </div>
                      <p className="text-center text-[10px] font-bold text-slate-400 dark:text-fleet-200/50 mt-3 uppercase tracking-widest">A IA pode cometer erros na telemetria.</p>
                    </div>

                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
