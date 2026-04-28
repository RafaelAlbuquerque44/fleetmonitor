import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, TrendingUp, Zap, Target, CheckCircle2, ChevronDown, ArrowRight, Smartphone } from 'lucide-react';

const features = [
  {
    Icon: TrendingUp,
    title: 'Controle Financeiro Completo',
    description: 'Painéis detalhados de lucros, custos operacionais e ROI por veículo.'
  },
  {
    Icon: ShieldCheck,
    title: 'Manutenção Preditiva com IA',
    description: 'Previna falhas antes que aconteçam e reduza o tempo de inatividade da frota.'
  },
  {
    Icon: Zap,
    title: 'Alta Performance',
    description: 'Sistema rápido e confiável, otimizado para lidar com grandes volumes de dados.'
  },
  {
    Icon: Target,
    title: 'Rotas Otimizadas',
    description: 'Crie e siga as melhores rotas, economizando combustível e diminuindo o desgaste.'
  },
  {
    Icon: Smartphone,
    title: 'App Mobile Integrado',
    description: 'Aplicativo intuitivo para os motoristas registrarem paradas, abastecimentos e ocorrências na estrada.'
  }
];

const faqs = [
  {
    question: "O FleetMonitor necessita de instalação de hardware nos caminhões?",
    answer: "A plataforma é compatível tanto com dispositivos que você já possua instalados (via integração de API) quanto com nossos kits de hardware proprietários embarcados, permitindo enorme flexibilidade técnica e reduzindo os custos de adoção iniciais."
  },
  {
    question: "Como funciona o sistema de Manutenção Preditiva com IA?",
    answer: "Nosso motor de IA analisa constantemente o histórico de troca de peças, quilometragem diária, dados telemétricos vitais do motor e variáveis de rodovias para cruzar esses dados. O sistema avisa o gestor de frota antes que a quebra ocorra na estrada."
  },
  {
    question: "Existe um limite de usuários gerenciais na plataforma?",
    answer: "Não. Sabemos que corporações precisam envolver diversos setores nas finanças, manutenção e gestão de pessoas. O FleetMonitor não impõe limite de assentos administrativos na área restrita do sistema."
  },
  {
    question: "Qual o prazo médio de implementação (Onboarding)?",
    answer: "Dependendo da escala (quantidade de placas) da sua empresa e do seu atual sistema de rastreamento, um lançamento do FleetMonitor ocorre tipicamente entre 2 a 4 semanas úteis com o apoio integral da nossa equipe de engenharia."
  }
];

const kpis = [
  { value: "4.500+", label: "Frotas Integradas" },
  { value: "30%", label: "Economia Gerada" },
  { value: "99.8%", label: "Uptime do Sistema" },
  { value: "12M+", label: "Rotas Otimizadas" }
];

const AnimatedTruck = ({ 
  delay = 0, 
  duration = 40, 
  top, 
  bottom, 
  size = 48, 
  direction = 'right', 
  opacity = 'opacity-5 dark:opacity-10' 
}: { 
  delay?: number, duration?: number, top?: string, bottom?: string, size?: number, direction?: 'right' | 'left', opacity?: string 
}) => {
  return (
    <motion.div
       initial={{ x: direction === 'right' ? '-20vw' : '100vw', scaleX: direction === 'left' ? -1 : 1 }}
       animate={{ x: direction === 'right' ? '100vw' : '-20vw', scaleX: direction === 'left' ? -1 : 1 }}
       transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
       className={`absolute text-slate-800 dark:text-white pointer-events-none ${opacity} z-0`}
       style={{ top, bottom, left: 0 }}
     >
       <Truck size={size} strokeWidth={0.5} />
    </motion.div>
  );
};

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white dark:bg-fleet-900 text-slate-800 dark:text-white font-sans overflow-x-hidden">
      
      {/* Navigation - Glassmorphism Style */}
      <nav className="fixed w-full z-50 top-0 bg-[#0a182e]/80 backdrop-blur-lg border-b border-white/5 transition-all duration-300">
        <div className="w-full flex items-stretch justify-between h-[75px] px-6 lg:px-12">
          {/* Logo Left */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2 bg-blue-600/20 rounded-xl group-hover:bg-blue-600 transition-colors duration-300">
               <Truck className="text-blue-500 group-hover:text-white w-7 h-7 transition-colors duration-300" />
            </div>
            <span className="text-2xl font-black text-white tracking-widest italic uppercase drop-shadow-md">
              FleetMonitor
            </span>
          </div>

          {/* Nav Links Right */}
          <div className="hidden md:flex items-stretch h-full">
            <a href="#inicio" className="flex items-center px-6 h-full text-sm font-bold text-blue-400 hover:text-white transition-colors uppercase cursor-pointer relative group">
               Início
               <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="#institucional" className="flex items-center px-6 h-full text-sm font-bold text-white/70 hover:text-white transition-colors uppercase cursor-pointer relative group">
               Institucional
               <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="#produtos" className="flex items-center px-6 h-full text-sm font-bold text-white/70 hover:text-white transition-colors uppercase cursor-pointer relative group">
               Produtos
               <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            <a href="#contato" className="flex items-center px-6 h-full text-sm font-bold text-white/70 hover:text-white transition-colors uppercase cursor-pointer relative group">
               Contato
               <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </a>
            
            <div className="flex h-full items-center justify-center ml-4 border-l border-white/10 pl-8">
              <Link
                to="/login"
                className="flex items-center justify-center px-8 h-[42px] text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] uppercase tracking-widest"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center pt-20 overflow-hidden">
        
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover scale-105"
          >
            <source src="/bg-video.mp4" type="video/mp4" />
          </video>
          {/* Sofisticated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a182e]/80 via-[#020610]/60 to-[#0a182e] z-0"></div>
        </div>

        <div className="max-w-5xl w-full mx-auto px-6 lg:px-12 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 font-bold text-sm mb-8 backdrop-blur-md">
             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Sistema em Operação
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 uppercase tracking-tighter drop-shadow-2xl leading-tight">
            Gestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Inteligente</span><br />de Frotas.
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg md:text-2xl text-white/80 mb-12 font-medium max-w-3xl mx-auto drop-shadow-md leading-relaxed">
            Acompanhando as rodovias do Brasil desde o início de sua operação. Tecnologias vitais de monitoramento com precisão absoluta.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a 
              href="#contato"
              className="bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/10 hover:border-blue-500/50 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-[15px] transition-all flex items-center justify-center w-full sm:w-auto group"
            >
              Agendar Demo <TrendingUp className="w-5 h-5 ml-3 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </a>
          </motion.div>
        </div>
      </section>


      {/* About Section */}
      <section id="institucional" className="py-32 bg-white dark:bg-[#0a182e] border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
        
        {/* Animated Background Trucks */}
        <AnimatedTruck top="15%" size={200} duration={55} opacity="opacity-[0.02] dark:opacity-[0.03]" />
        <AnimatedTruck bottom="20%" direction="left" size={150} duration={45} delay={10} opacity="opacity-[0.02] dark:opacity-[0.03]" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
             <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm mb-6 border border-blue-100 dark:border-blue-800/50 shadow-sm">
               <Zap className="w-4 h-4" /> Alta Tecnologia Integrada
             </motion.div>
             <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-white mb-8 tracking-tight uppercase leading-tight">
               O Motor por trás <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">das maiores frotas.</span>
             </motion.h2>
             <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-lg text-slate-600 dark:text-fleet-100/80 space-y-6 leading-relaxed font-medium">
               <p>
                 Em um mundo movido a dados gigantescos diários, as melhores decisões logísticas são tomadas com base em informações sólidas e precisamente capturadas. O FleetMonitor atua diretamente no monitoramento de tráfego denso nas estradas corporativas, produzindo e garantindo eficiência para frotistas.
               </p>
               <p>
                 A nossa tecnologia de ponta foi inteiramente arquitetada para integrar hardware embarcado, gestores C-level de logística, manutenção mecânica das unidades e condutores em rodovia debaixo do mesmo teto de software de maneira veloz.
               </p>
             </motion.div>
          </div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="relative h-full min-h-[400px]">
             {/* Abstract Glassmorphic composition */}
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-[40px] border border-white/20 dark:border-white/10 backdrop-blur-3xl shadow-2xl p-6 lg:p-10 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-4 lg:gap-6">
                   <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-xl transform hover:-translate-y-2 transition-transform duration-500 group">
                      <div className="bg-blue-100 dark:bg-blue-900/50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-4xl font-black text-slate-800 dark:text-white mb-2">10k+</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-fleet-300 uppercase tracking-widest">Veículos Conectados</div>
                   </div>
                   <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-xl transform hover:-translate-y-2 transition-transform duration-500 group">
                      <div className="bg-amber-100 dark:bg-amber-900/50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="text-4xl font-black text-slate-800 dark:text-white mb-2">99.9%</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-fleet-300 uppercase tracking-widest">Precisão de Dados</div>
                   </div>
                   <div className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl text-white transform hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                      <ShieldCheck className="w-12 h-12 text-white/90 mb-5 group-hover:scale-110 transition-transform" />
                      <div className="text-2xl font-black mb-3 tracking-wide">Criptografia</div>
                      <div className="text-blue-100 font-medium text-sm leading-relaxed">Todos os seus dados logísticos estão protegidos por criptografia de ponta-a-ponta, imunes a interceptações.</div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="produtos" className="py-32 bg-slate-50 dark:bg-fleet-900 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-1/2 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Animated Background Trucks */}
        <AnimatedTruck top="5%" size={300} duration={70} opacity="opacity-[0.02] dark:opacity-[0.02]" delay={5} direction="left" />
        <AnimatedTruck top="50%" size={120} duration={35} opacity="opacity-[0.02] dark:opacity-[0.03]" delay={2} />
        <AnimatedTruck bottom="10%" size={250} duration={60} opacity="opacity-[0.02] dark:opacity-[0.02]" delay={15} direction="left" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-6 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
               <Target className="w-4 h-4" /> Arsenal Completo
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Módulos do Sistema
            </motion.h2>
          </div>
          {/* Top row: first 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {features.slice(0, 3).map((feature, index) => {
              const Icon = feature.Icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                  className="group relative p-8 md:p-10 bg-white dark:bg-[#112340] rounded-[32px] shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-500/50 flex flex-col overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/10 transition-all duration-500 pointer-events-none"></div>
                  <div className="mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:-translate-y-2 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-blue-500/40">
                       <Icon className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-4 text-slate-800 dark:text-white uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-fleet-100/70 leading-relaxed font-medium text-[15px] flex-grow relative z-10">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom row: last 2 cards centered */}
          <div className="flex flex-col md:flex-row justify-center gap-8">
            {features.slice(3).map((feature, index) => {
              const Icon = feature.Icon;
              return (
                <motion.div
                  key={index + 3}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: (index + 3) * 0.1, ease: "easeOut" }}
                  className="group relative p-8 md:p-10 bg-white dark:bg-[#112340] rounded-[32px] shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-500/50 flex flex-col overflow-hidden w-full lg:w-[calc(33.333%-1rem)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/10 transition-all duration-500 pointer-events-none"></div>
                  <div className="mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:-translate-y-2 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-blue-500/40">
                       <Icon className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-4 text-slate-800 dark:text-white uppercase tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-fleet-100/70 leading-relaxed font-medium text-[15px] flex-grow relative z-10">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NOVO: Dashboard System Previews (Mockup) */}
      <section className="py-32 bg-[#0a182e] dark:bg-[#050b14] text-white relative overflow-hidden border-t border-white/5">
        {/* decor */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a182e]/0 to-[#0a182e]/0 pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none"></div>
        
        {/* Animated Background Trucks */}
        <AnimatedTruck top="30%" size={180} duration={40} opacity="opacity-5 dark:opacity-[0.03]" direction="right" />
        <AnimatedTruck bottom="10%" size={220} duration={50} opacity="opacity-5 dark:opacity-[0.03]" direction="left" delay={8} />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-400 font-bold text-sm mb-8 backdrop-blur-md">
               <Smartphone className="w-4 h-4" /> Plataforma Omnichannel
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-8 tracking-tight uppercase text-white leading-tight">
              O controle total nas <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">suas mãos.</span>
            </h2>
            <p className="text-lg text-white/60 mb-10 font-medium leading-relaxed">
              Mergulhe em uma interface projetada inteiramente para garantir máxima clareza. Frotistas assumem o leme com extrema rapidez através da nossa plataforma em Dark Mode de alto impacto logístico.
            </p>
            <ul className="space-y-6 mb-12">
              {[
                "Dashboard C-Level executivo online",
                "Mapas vetorizados de rotas contínuas",
                "App celular para cada motorista em trânsito"
              ].map((item, idx) => (
                <motion.li key={idx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + idx * 0.1 }} className="flex items-center gap-4 group">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                    <CheckCircle2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="font-bold text-white/90 text-lg group-hover:text-white transition-colors">{item}</span>
                </motion.li>
              ))}
            </ul>
            <Link to="/login" className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl text-white font-bold uppercase tracking-widest text-sm transition-all group">
               Visualizar Módulos <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 2 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="lg:col-span-7 relative group flex justify-end xl:pl-10">
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-full blur-3xl group-hover:blur-2xl transition-all duration-700 opacity-50"></div>
             <img src="/imac_mockup.png" alt="FleetMonitor Dashboard Screen" className="w-full max-w-2xl h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative z-10 group-hover:-translate-y-2 transition-transform duration-700" />
          </motion.div>
        </div>
      </section>

      {/* NOVO: KPI Impact Statistics Banner */}
      <section className="bg-[#0a182e] dark:bg-[#03070c] py-20 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-blue-900/20 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-x divide-white/10">
            {kpis.map((kpi, idx) => (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} key={idx} className="text-center px-4 group">
                 <div className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-3 tracking-tighter drop-shadow-md group-hover:scale-110 transition-transform duration-500">
                   {kpi.value}
                 </div>
                 <div className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-widest">
                   {kpi.label}
                 </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NOVO: Perguntas Frequentes (FAQ) Accordion */}
      <section className="py-32 bg-[#050b14] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10">
           <div className="text-center mb-20">
             <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 font-bold text-sm mb-6 backdrop-blur-md">
                Suporte Especializado
             </motion.div>
             <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl lg:text-5xl font-black text-white uppercase tracking-widest">
               Dúvidas Frequentes
             </motion.h2>
           </div>
           
           <div className="space-y-6">
             {faqs.map((faq, idx) => (
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} key={idx} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] backdrop-blur-sm">
                 <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-7 text-left flex justify-between items-center bg-transparent focus:outline-none cursor-pointer group"
                 >
                   <span className="font-bold text-white text-lg pr-8 group-hover:text-blue-400 transition-colors">{faq.question}</span>
                   <div className={`p-2 rounded-full transition-colors duration-300 ${openFaq === idx ? 'bg-blue-600 text-white' : 'bg-white/5 text-blue-400 group-hover:bg-blue-500/20'}`}>
                     <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                   </div>
                 </button>
                 <AnimatePresence>
                   {openFaq === idx && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                     >
                       <div className="px-8 pb-8 pt-0 text-white/60 leading-relaxed font-medium text-[15px]">
                         <div className="h-px w-full bg-white/10 mb-6"></div>
                         {faq.answer}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </motion.div>
             ))}
           </div>
        </div>
      </section>

      {/* NOVO: Formulário de Contato Lead Capture (Agendar Demonstração) */}
      <section id="contato" className="py-32 bg-[#020610] relative z-10 overflow-hidden border-t border-white/5">
        {/* Animated Background Trucks */}
        <AnimatedTruck top="10%" size={160} duration={45} opacity="opacity-[0.02]" direction="right" />
        <AnimatedTruck bottom="20%" size={200} duration={55} opacity="opacity-[0.02]" direction="left" delay={12} />

        <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-20">
           
           <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-[#0a182e]/80 backdrop-blur-xl rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col lg:flex-row relative">
              <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
              
              {/* Esquerda: Info Texto Base */}
              <div className="w-full lg:w-5/12 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 p-12 lg:p-16 flex flex-col justify-between text-white relative z-10 border-r border-white/10">
                 <div>
                   <h3 className="text-4xl lg:text-5xl font-black mb-8 leading-tight uppercase tracking-tight">Planeje o<br/>futuro da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">sua frota hoje.</span></h3>
                   <p className="text-white/70 font-medium mb-12 leading-relaxed text-lg">Nossos especialistas em logística estão prontos para desenhar um projeto robusto e sob medida na nossa tecnologia para a sua empresa.</p>
                 </div>
                 <div className="space-y-6 bg-black/20 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-5">
                       <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl"><CheckCircle2 className="w-6 h-6 text-blue-400" /></div>
                       <span className="text-[15px] font-bold text-white uppercase tracking-wider">Demonstração Gratuita</span>
                    </div>
                    <div className="flex items-center gap-5">
                       <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl"><TrendingUp className="w-6 h-6 text-blue-400" /></div>
                       <span className="text-[15px] font-bold text-white uppercase tracking-wider">Análise de Lucratividade</span>
                    </div>
                 </div>
              </div>
              
              {/* Direita: O Forms em Si */}
              <div className="w-full lg:w-7/12 p-12 lg:p-16 relative z-10">
                 <h4 className="text-2xl font-black text-white mb-8 uppercase tracking-wide flex items-center gap-3">
                   <Smartphone className="w-6 h-6 text-blue-400" /> Solicitar Contato Comercial
                 </h4>
                 <form className="space-y-6" onSubmit={(e) => {
                   e.preventDefault();
                   const formData = new FormData(e.currentTarget);
                   const name = formData.get('name');
                   const email = formData.get('email');
                   const phone = formData.get('phone');
                   const fleetSize = formData.get('fleetSize');
                   
                   const subject = encodeURIComponent('Novo Contato Comercial - FleetMonitor');
                   const body = encodeURIComponent(`Nome: ${name}\nE-mail: ${email}\nTelefone: ${phone}\nTamanho da Frota: ${fleetSize}`);
                   
                   window.location.href = `mailto:fleetmonitor01@gmail.com?subject=${subject}&body=${body}`;
                 }}>
                   <div>
                     <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-3 pl-1">Nome do Gestor / Empresa</label>
                     <input name="name" type="text" className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:text-white/20" placeholder="Ex: Viação São Paulo S.A" required />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-3 pl-1">E-mail Corporativo</label>
                       <input name="email" type="email" className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:text-white/20" placeholder="contato@empresa.com" required />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-3 pl-1">Telefone Fixo / Cel</label>
                       <input name="phone" type="tel" className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:text-white/20" placeholder="(11) 90000-0000" required />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-3 pl-1">Tamanho da sua Frota</label>
                     <div className="relative">
                       <select name="fleetSize" className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm appearance-none cursor-pointer">
                         <option value="Frota Menor (De 1 a 20 veículos pesados)" className="bg-fleet-900">Frota Menor (De 1 a 20 veículos)</option>
                         <option value="Frota Média (De 21 a 100 veículos pesados)" className="bg-fleet-900">Frota Média (De 21 a 100 veículos)</option>
                         <option value="Frota Maior (Acima de 100 caminhões rodando)" className="bg-fleet-900">Frota Maior (Acima de 100 veículos)</option>
                       </select>
                       <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                     </div>
                   </div>
                   <button type="submit" className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[15px] uppercase tracking-widest py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_10px_40px_rgba(37,99,235,0.6)] hover:-translate-y-1">
                     Agendar Vistoria Completa
                   </button>
                 </form>
              </div>
           </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#020610] text-center text-white/50 font-medium border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        <div className="flex flex-col items-center justify-center gap-4 mb-10 text-white/80 relative z-10">
           <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
             <Truck className="w-8 h-8 text-blue-500" />
           </div>
           <span className="text-3xl font-black italic tracking-tighter uppercase drop-shadow-md">FleetMonitor </span>
        </div>
        <p className="text-[13px] font-medium tracking-wider text-white/40">&copy; {new Date().getFullYear()} FleetMonitor Sistema Logístico.<br className="md:hidden" /> Todos os direitos reservados.</p>
        <div className="mt-8 text-[11px] font-bold tracking-widest uppercase text-white/30 flex flex-wrap gap-6 justify-center">
           <span className="cursor-pointer hover:text-white transition-colors">Política de Privacidade</span>
           <span className="cursor-pointer hover:text-white transition-colors">Termos de Uso</span>
           <span className="cursor-pointer hover:text-white transition-colors">Central de Ajuda</span>
        </div>
      </footer>
    </div>
  );
}
