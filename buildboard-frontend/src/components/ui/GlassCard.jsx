import { motion } from 'framer-motion';
import { useTiltEffect } from '../../hooks/useTiltEffect';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function GlassCard({ 
  children, 
  className, 
  glowColor = 'var(--brand-primary)',
  tilt = true,
  interactive = false,
  ...props 
}) {
  const tiltConfig = useTiltEffect({ max: 10, scale: interactive ? 1.02 : 1 });
  
  return (
    <motion.div
      {...(tilt && interactive ? tiltConfig : {})}
      className={twMerge(
        'glass-panel relative overflow-hidden group',
        interactive && 'glass-panel-hover cursor-pointer',
        className
      )}
      style={{
        '--card-glow': glowColor,
        ...(tilt && interactive ? tiltConfig.style : {})
      }}
      {...props}
    >
      {/* Subtle top border highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--card-glow)] to-transparent opacity-30" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
      
      {/* Interactive hover glow */}
      {interactive && (
        <div 
          className="absolute -inset-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none blur-[50px] rounded-full"
          style={{ background: 'var(--card-glow)' }}
        />
      )}
    </motion.div>
  );
}
