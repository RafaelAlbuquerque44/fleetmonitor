import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Map, TrendingUp, Zap, Target, CheckCircle2, ChevronDown, ArrowRight, Smartphone } from 'lucide-react';

const features = [
  {
    icon: <Map className="w-10 h-10 text-fleet-600 dark:text-fleet-400" />,
    title: 'Monitoramento em Tempo Real',
    description: 'Acompanhe a localização exata de cada veículo da sua frota 24/7 com precisão de GPS.'
  },
  {
    icon: <TrendingUp className="w-10 h-10 text-fleet-600 dark:text-fleet-400" />,
    title: 'Controle Financeiro Completo',
    description: 'Painéis detalhados de lucros, custos operacionais e ROI por veículo.'
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-fleet-600 dark:text-fleet-400" />,
    title: 'Manutenção Preditiva com IA',
    description: 'Previna falhas antes que aconteçam e reduza o tempo de inatividade da frota.'
  },
  {
    icon: <Zap className="w-10 h-10 text-fleet-600 dark:text-fleet-400" />,
    title: 'Alta Performance',
    description: 'Sistema rápido e confiável, otimizado para lidar com grandes volumes de dados.'
  },
  {
    icon: <Target className="w-10 h-10 text-fleet-600 dark:text-fleet-400" />,
    title: 'Rotas Otimizadas',
    description: 'Crie e siga as melhores rotas, economizando combustível e diminuindo o desgaste.'
  },
  {
    icon: <Smartphone className="w-10 h-10 text-fleet-600 dark:text-fleet-400" />,
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

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white dark:bg-fleet-900 text-slate-800 dark:text-white font-sans overflow-x-hidden">
      
      {/* Navigation - Usina Santa Lucia Style: Solid corporate blue */}
      <nav className="fixed w-full z-50 top-0 bg-fleet-800 dark:bg-fleet-950 shadow-md">
        <div className="w-full flex items-stretch justify-between h-[70px] px-6 lg:px-12">
          {/* Logo Left */}
          <div className="flex items-center gap-2">
            <Truck className="text-white w-8 h-8" />
            <span className="text-3xl font-black text-white tracking-widest italic uppercase">
              FleetMonitor
            </span>
          </div>

          {/* Nav Links Right (Traditional Blocky Links) */}
          <div className="hidden md:flex items-stretch h-full">
            <a href="#inicio" className="flex items-center px-6 h-full text-[13px] font-bold text-fleet-800 bg-white transition-colors uppercase cursor-pointer">Início</a>
            <a href="#institucional" className="flex items-center px-6 h-full text-[13px] font-bold text-white hover:bg-fleet-700 transition-colors uppercase cursor-pointer">Institucional</a>
            <a href="#produtos" className="flex items-center px-6 h-full text-[13px] font-bold text-white hover:bg-fleet-700 transition-colors uppercase cursor-pointer">Produtos</a>
            <a href="#contato" className="flex items-center px-6 h-full text-[13px] font-bold text-white hover:bg-fleet-700 transition-colors uppercase cursor-pointer">Contato</a>
            
            <div className="flex h-full items-center justify-center ml-4 border-l border-white/20 pl-8">
              <Link
                to="/login"
                className="flex items-center justify-center w-28 h-[38px] text-[13px] font-bold text-white hover:text-white bg-transparent border border-white hover:bg-white/10 transition-colors uppercase tracking-widest text-center"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Background Video, Left Aligned Text */}
      <section id="inicio" className="relative w-full h-[90vh] min-h-[600px] flex items-center pt-20 border-b-4 border-[#2e5fa1]">
        
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/bg-video.mp4" type="video/mp4" />
          </video>
          {/* Subtle dark gradient overlay on the left to keep text readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent"></div>
        </div>

        <div className="max-w-7xl w-full mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col items-start text-left max-w-3xl">
            
            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl lg:text-[75px] leading-none font-bold text-white mb-6 tracking-tight drop-shadow-lg uppercase font-sans"
            >
              GESTÃO<br /> INTELIGENTE<br /> DE FROTAS.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl lg:text-2xl text-white font-bold mb-10 drop-shadow-md"
            >
              Acompanhando as rodovias do Brasil desde o início de sua operação. Tecnologias vitais de monitoramento.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-10 py-3 text-sm font-medium text-white bg-[#2e5fa1] hover:bg-[#1a4073] border border-transparent shadow-xl transition-all uppercase tracking-wide"
              >
                Acessar o Sistema
              </Link>
              <a
                href="#contato"
                className="inline-flex items-center justify-center px-10 py-3 text-sm font-medium text-white bg-transparent hover:bg-white/10 border border-white transition-all shadow-xl uppercase tracking-wide"
              >
                Agende uma Demonstração
              </a>
            </motion.div>
          </div>
        </div>
      </section>


      {/* About Section */}
      <section id="institucional" className="py-24 bg-white dark:bg-fleet-900 border-b border-gray-100 dark:border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl md:text-[40px] font-medium text-[#2d5f9e] dark:text-fleet-400 mb-12 tracking-wide uppercase">
            Sobre a Fundação FleetMonitor
          </h2>
          <div className="max-w-4xl mx-auto text-lg text-slate-600 dark:text-gray-300 space-y-6 text-left leading-relaxed">
            <p>
              Em um mundo movido a dados gigantescos diários, as melhores decisões logísticas são tomadas com base em informações sólidas e precisamente capturadas. O FleetMonitor atua diretamente no monitoramento de tráfego denso nas estradas corporativas, produzindo e garantindo eficiência para frotistas.
            </p>
            <p>
              A nossa tecnologia de ponta foi inteiramente arquitetada para integrar hardware embarcado, gestores C-level de logística, manutenção mecânica das unidades e condutores em rodovia debaixo do mesmo teto de software de maneira veloz.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="produtos" className="py-24 bg-gray-50 dark:bg-fleet-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-fleet-800 dark:text-white uppercase tracking-widest">Nossas Ferramentas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-10 border-t-4 border-fleet-600 bg-white dark:bg-fleet-800 shadow-sm hover:shadow-lg transition-all flex flex-col"
              >
                <div className="mb-6 opacity-90">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black mb-4 text-[#1a3d6e] dark:text-white uppercase tracking-wider">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-fleet-100/70 leading-relaxed font-medium text-[15px] flex-grow">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NOVO: Dashboard System Previews (Mockup) */}
      <section className="py-28 bg-[#0a182e] dark:bg-fleet-950 text-white relative overflow-hidden">
        {/* decor */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#1b3459] blur-[150px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-20 items-center">
          <div className="lg:col-span-6">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight uppercase text-white leading-tight">O controle total nas<br/>suas mãos.</h2>
            <p className="text-lg text-white/70 mb-10 font-medium leading-relaxed">
              Mergulhe em uma interface projetada inteiramente para garantir máxima claridade para que o frotista assuma o leme com rapidez através da nossa plataforma em Dark Mode de alto impacto logístico!
            </p>
            <ul className="space-y-5 mb-10">
              <li className="flex items-center gap-4">
                <CheckCircle2 className="w-7 h-7 text-[#4c81c9]" />
                <span className="font-bold text-white text-lg">Dashboard C-Level executivo online</span>
              </li>
              <li className="flex items-center gap-4">
                <CheckCircle2 className="w-7 h-7 text-[#4c81c9]" />
                <span className="font-bold text-white text-lg">Mapas vetorizados de rotas contínuas</span>
              </li>
              <li className="flex items-center gap-4">
                <CheckCircle2 className="w-7 h-7 text-[#4c81c9]" />
                <span className="font-bold text-white text-lg">App celular para cada motorista em trânsito</span>
              </li>
            </ul>
            <Link to="/login" className="text-[#4c81c9] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">
               Visualizar Módulos Internos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-6 relative group flex justify-end xl:pl-10">
             <img src="/imac_mockup.png" alt="FleetMonitor Dashboard Screen" className="w-full max-w-xl xl:max-w-2xl h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] block mx-auto" />
          </div>
        </div>
      </section>

      {/* NOVO: KPI Impact Statistics Banner */}
      <section className="bg-[#2e5fa1] dark:bg-[#15345c] py-16 border-y-4 border-[#1b3459] shadow-inner">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-white/20">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="text-center px-4">
                 <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-md">
                   {kpi.value}
                 </div>
                 <div className="text-xs md:text-sm font-bold text-[#b4d1f5] uppercase tracking-widest">
                   {kpi.label}
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOVO: Perguntas Frequentes (FAQ) Accordion */}
      <section className="py-24 bg-white dark:bg-fleet-900 border-b border-gray-100 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-medium text-fleet-800 dark:text-white uppercase tracking-widest">Dúvidas Frequentes</h2>
             <div className="w-16 h-1 bg-fleet-600 mx-auto mt-6"></div>
           </div>
           
           <div className="space-y-4">
             {faqs.map((faq, idx) => (
               <div key={idx} className="border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-fleet-800/30 overflow-hidden transition-all duration-300 hover:border-fleet-600/50">
                 <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center bg-transparent focus:outline-none cursor-pointer"
                 >
                   <span className="font-bold text-fleet-800 dark:text-white lg:text-lg pr-8">{faq.question}</span>
                   <ChevronDown className={`w-5 h-5 flex-shrink-0 text-[#2e5fa1] transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                 </button>
                 <AnimatePresence>
                   {openFaq === idx && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                     >
                       <div className="px-8 pb-6 pt-0 text-slate-600 dark:text-fleet-100/70 leading-relaxed font-medium">
                         {faq.answer}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* NOVO: Formulário de Contato Lead Capture (Agendar Demonstração) */}
      <section id="contato" className="py-24 bg-[#0a182e] relative z-10 overflow-hidden border-t-2 border-white/5">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 relative z-20">
           
           <div className="bg-fleet-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
              <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-[#3a73c3] rounded-full blur-[120px] pointer-events-none opacity-50"></div>
              
              {/* Esquerda: Info Texto Base */}
              <div className="w-full md:w-5/12 bg-[#1b3459] p-12 flex flex-col justify-between text-white relative z-10 border-r border-[#2e5fa1]">
                 <div>
                   <h3 className="text-3xl font-black mb-6 leading-tight uppercase tracking-wide">Planeje o<br/>futuro da sua<br/>frota hoje.</h3>
                   <p className="text-white/70 font-medium mb-12 leading-relaxed">Nossos especialistas e comerciais logísticos estão prontos para desenhar um projeto robusto e sob medida na nossa tecnologia.</p>
                 </div>
                 <div className="space-y-5">
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-white/10 rounded-xl"><CheckCircle2 className="w-6 h-6 text-[#71a1e3]" /></div>
                       <span className="text-sm font-bold text-white uppercase tracking-wider">Demonstração Gratuita</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-white/10 rounded-xl"><TrendingUp className="w-6 h-6 text-[#71a1e3]" /></div>
                       <span className="text-sm font-bold text-white uppercase tracking-wider">Análise de Lucratividade</span>
                    </div>
                 </div>
              </div>
              
              {/* Direita: O Forms em Si */}
              <div className="w-full md:w-7/12 p-12 bg-fleet-900 border-l border-white/5 relative z-10">
                 <h4 className="text-2xl font-bold text-white mb-8">Solicitar um Contato Comercial</h4>
                 <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                   <div>
                     <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 pl-1">Nome do Gestor / Empresa</label>
                     <input type="text" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#2e5fa1] transition-all font-medium" placeholder="Ex: Viação São Paulo S.A" required />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 pl-1">E-mail Corporativo</label>
                       <input type="email" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#2e5fa1] transition-all font-medium" placeholder="contato@empresa.com" required />
                     </div>
                     <div>
                       <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 pl-1">Telefone Fixo / Cel</label>
                       <input type="tel" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#2e5fa1] transition-all font-medium" placeholder="(11) 90000-0000" required />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 pl-1">Tamanho da sua Frota</label>
                     <select className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#2e5fa1] transition-all font-medium text-sm appearance-none">
                       <option className="bg-fleet-900">Frota Menor (De 1 a 20 veículos pesados)</option>
                       <option className="bg-fleet-900">Frota Média (De 21 a 100 veículos pesados)</option>
                       <option className="bg-fleet-900">Frota Maior (Acima de 100 caminhões rodando)</option>
                     </select>
                   </div>
                   <button className="w-full mt-4 bg-[#2e5fa1] hover:bg-[#1a4073] text-white font-black text-sm uppercase tracking-widest py-5 rounded-xl transition-all shadow-xl hover:shadow-[0_0_30px_rgba(46,95,161,0.4)] hover:-translate-y-0.5">
                     Agendar Vistoria Completa
                   </button>
                 </form>
              </div>
           </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#1b3459] dark:bg-fleet-950 text-center text-white/50 font-medium border-t border-[#152a4a]">
        <div className="flex flex-col items-center justify-center gap-2 mb-8 text-white/80">
           <Truck className="w-10 h-10 text-white/50" />
           <span className="text-2xl font-black italic tracking-tighter uppercase">FleetMonitor S.A.</span>
        </div>
        <p className="text-sm font-light tracking-wide">&copy; {new Date().getFullYear()} FleetMonitor Sistema Logístico. Todos os direitos reservados para a operação.</p>
        <div className="mt-4 text-xs tracking-widest uppercase text-white/30 flex gap-4 justify-center">
           <span className="cursor-pointer hover:text-white/60 transition-colors">Política de Privacidade</span>
           <span className="cursor-pointer hover:text-white/60 transition-colors">Termos de Uso</span>
        </div>
      </footer>
    </div>
  );
}
