import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const { theme } = useTheme();
  // Ensure we only render the random DOM elements after mounting to avoid hydration mismatch if SSR
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  const isDark = theme === 'dark';
  
  // Dynamic variables for themes
  const particleColor = isDark ? 'bg-white/10' : 'bg-slate-300/40';
  const glow1 = isDark ? 'from-fleet-600/30 to-fleet-900/0' : 'from-transparent to-transparent';
  const glow2 = isDark ? 'from-alert/10 to-fleet-900/0' : 'from-transparent to-transparent';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent';

  // Generate 15 static random positions for the particles to start at, 
  // so every re-render doesn't jump them (except when first mounting)
  const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700">
      
      {/* Premium Cinematic Grid */}
      <div 
        className="absolute inset-0"
        style={{
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 10%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 10%, transparent 100%)',
        }}
      >
        <motion.div 
          animate={{
            y: [0, 40],
            x: [0, 40]
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "linear"
          }}
          className="w-[120%] h-[120%] -top-[10%] -left-[10%] absolute"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Giant Ambient Orbs for Glassmorphism Depth */}
      <motion.div
        animate={{
          y: [0, -40, 0],
          x: [0, 30, 0],
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -top-32 -left-32 w-[45rem] h-[45rem] rounded-full bg-gradient-to-br ${glow1} blur-3xl`}
        style={{ mixBlendMode: isDark ? 'screen' : 'normal' }}
      />
      
      <motion.div
        animate={{
          y: [0, 60, 0],
          x: [0, -50, 0],
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className={`absolute -bottom-32 -right-32 w-[55rem] h-[55rem] rounded-full bg-gradient-to-tl ${glow2} blur-3xl`}
        style={{ mixBlendMode: isDark ? 'screen' : 'normal' }}
      />

      {/* Floating Sparkles/Nodes (Data Visualization Concept) */}
      {[...Array(15)].map((_, i) => {
        const size = getRandom(3, 10);
        const duration = getRandom(15, 30);
        return (
          <motion.div
            key={i}
            initial={{
              y: getRandom(0, window.innerHeight),
              x: getRandom(0, window.innerWidth),
            }}
            animate={{
              y: [null, getRandom(0, window.innerHeight)],
              x: [null, getRandom(0, window.innerWidth)],
              opacity: [0, 0.6, 0],
              scale: [0, getRandom(1, 2), 0]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
              delay: getRandom(0, 5),
            }}
            className={`absolute rounded-full ${particleColor} shadow-[0_0_15px_rgba(255,255,255,0.4)] backdrop-blur-sm`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        );
      })}
      
      {/* Telemetry Radar Scanning Line */}
      <motion.div
        animate={{
          top: ['-10%', '110%']
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
          delay: 2
        }}
        className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-fleet-400/30 to-transparent"
        style={{
          boxShadow: '0 0 25px rgba(96, 165, 250, 0.5)'
        }}
      />
    </div>
  );
}
