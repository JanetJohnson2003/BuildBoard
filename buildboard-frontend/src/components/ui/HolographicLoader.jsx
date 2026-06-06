import { motion } from 'framer-motion';

export function HolographicLoader({ text = 'INITIALIZING...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-24 h-24">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent opacity-60 shadow-[0_0_15px_rgba(0,212,255,0.5)]"
        />
        
        {/* Inner reverse rotating ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
          className="absolute inset-2 rounded-full border-2 border-[var(--brand-purple)] border-b-transparent opacity-80"
        />
        
        {/* Pulsing core */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          className="absolute inset-8 rounded-full bg-[var(--brand-success)] blur-[8px]"
        />
      </div>
      
      {text && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 font-display font-bold tracking-widest text-sm text-[var(--brand-primary)] neon-text"
        >
          {text}
        </motion.div>
      )}
    </div>
  );
}
