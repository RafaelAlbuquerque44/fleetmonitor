import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User as UserIcon, LogIn, Compass, Zap, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // Mock validation
      if (username === 'admin' && password === 'admin') {
        login();
        navigate('/dashboard');
      } else {
        setError('Credenciais inválidas. Tente: admin / admin');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-fleet-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-fleet-500/20 rounded-full blur-[120px]"></motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-900/40 rounded-full blur-[120px]"></motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] left-[50%] w-[20%] h-[20%] bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-[80px]"></motion.div>

        {/* Subtle Truck Animations */}
        {/* Layer 1 (Back, Slowest, Lowest Opacity) */}
        <motion.div
           initial={{ x: '-20vw' }}
           animate={{ x: '120vw' }}
           transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
           className="absolute top-[15%] text-slate-400 dark:text-white/20"
         >
           <Truck className="w-48 h-48 opacity-[0.03]" strokeWidth={0.5} />
        </motion.div>
        <motion.div
           initial={{ x: '120vw', scaleX: -1 }}
           animate={{ x: '-20vw', scaleX: -1 }}
           transition={{ duration: 80, repeat: Infinity, ease: 'linear', delay: 10 }}
           className="absolute top-[65%] text-slate-400 dark:text-white/20"
         >
           <Truck className="w-56 h-56 opacity-[0.03]" strokeWidth={0.5} />
        </motion.div>

        {/* Layer 2 (Middle) */}
        <motion.div
           initial={{ x: '-20vw' }}
           animate={{ x: '120vw' }}
           transition={{ duration: 45, repeat: Infinity, ease: 'linear', delay: 5 }}
           className="absolute top-[35%] text-slate-400 dark:text-white/20"
         >
           <Truck className="w-64 h-64 opacity-5" strokeWidth={0.5} />
        </motion.div>
        <motion.div
           initial={{ x: '120vw', scaleX: -1 }}
           animate={{ x: '-20vw', scaleX: -1 }}
           transition={{ duration: 55, repeat: Infinity, ease: 'linear', delay: 15 }}
           className="absolute top-[8%] text-slate-400 dark:text-white/20"
         >
           <Truck className="w-40 h-40 opacity-5" strokeWidth={0.5} />
        </motion.div>

        {/* Layer 3 (Front, Fastest, Higher Opacity but still subtle) */}
        <motion.div
           initial={{ x: '-20vw' }}
           animate={{ x: '120vw' }}
           transition={{ duration: 35, repeat: Infinity, ease: 'linear', delay: 2 }}
           className="absolute bottom-[10%] text-slate-400 dark:text-white/20"
         >
           <Truck className="w-72 h-72 opacity-10" strokeWidth={0.5} />
        </motion.div>
        <motion.div
           initial={{ x: '120vw', scaleX: -1 }}
           animate={{ x: '-20vw', scaleX: -1 }}
           transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: 12 }}
           className="absolute top-[45%] text-slate-400 dark:text-white/20"
         >
           <Truck className="w-80 h-80 opacity-[0.08]" strokeWidth={0.5} />
        </motion.div>
        <motion.div
           initial={{ x: '-20vw' }}
           animate={{ x: '120vw' }}
           transition={{ duration: 40, repeat: Infinity, ease: 'linear', delay: 20 }}
           className="absolute top-[25%] text-slate-400 dark:text-white/20"
         >
           <Truck className="w-32 h-32 opacity-10" strokeWidth={0.5} />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl bg-[#f1f5f9] dark:bg-white/5  rounded-3xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 flex flex-col md:flex-row relative z-10"
      >
        {/* Left Side: Branding / Intro */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-900 to-fleet-800 p-12 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }} className="flex items-center gap-3 mb-12">
              <div className="bg-white/10 p-2.5 rounded-xl  shadow-inner border border-white/20">
                <Compass className="w-8 h-8 text-white drop-shadow-md" />
              </div>
              <span className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                FleetMonitor
              </span>
            </motion.div>
            
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }} className="text-4xl font-black mb-6 leading-tight">A plataforma definitiva de<br/>Gestão de Frotas.</motion.h1>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }} className="text-fleet-100 text-lg font-medium leading-relaxed max-w-sm">
              Potencializado por Inteligência Artificial, gerencie caminhões, rotas e manutenções preditivas em um único ecossistema seguro.
            </motion.p>
          </div>

          <div className="relative z-10 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }} className="flex items-center gap-3 bg-white/10 w-max px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
              <Zap className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-bold text-white/90">Monitoramento 24/7 em Tempo Real</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }} className="flex items-center gap-3 bg-white/10 w-max px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white/90">Ecossistema Seguro & Criptografado</span>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:hidden flex items-center gap-3 mb-8 justify-center">
             <div className="bg-indigo-600 p-2 rounded-xl shadow-lg">
                <Compass className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                FleetMonitor
             </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }} className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Bem-vindo de volta</h2>
            <p className="text-slate-500 dark:text-fleet-200 mt-2 font-medium">Faça login para acessar o painel de comando.</p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }} className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest pl-1">Usuário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400 dark:text-fleet-300/50" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all font-medium"
                  placeholder="admin"
                  required
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }} className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-fleet-300 uppercase tracking-widest pl-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-fleet-300/50" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 dark:text-red-400 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 text-center">
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar no Sistema
                </>
              )}
            </motion.button>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-400 dark:text-fleet-200/50 uppercase tracking-widest">Acesso de Demonstração</p>
            <p className="text-sm font-medium text-slate-500 dark:text-fleet-300 mt-1">Utilize usuário <b className="text-indigo-500 dark:text-indigo-400">admin</b> e senha <b className="text-indigo-500 dark:text-indigo-400">admin</b></p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
