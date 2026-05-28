import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function NeonButton({ 
  children, 
  variant = 'primary', 
  className, 
  onClick,
  disabled = false,
  loading = false,
  magnetic = true,
  ...props 
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!magnetic || disabled || loading) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.2;
    const y = (clientY - (top + height / 2)) * 0.2;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variants = {
    primary: 'bg-[var(--brand-primary)] text-[#0a0a0f] hover:shadow-[0_0_20px_var(--brand-primary)] border-transparent',
    secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]',
    danger: 'bg-[var(--bg-tertiary)] text-[var(--brand-danger)] border border-[var(--border-main)] hover:border-[var(--brand-danger)] hover:bg-[var(--brand-danger)] hover:text-white hover:shadow-[0_0_15px_var(--brand-danger)]',
    ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-tertiary)] border-transparent'
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={twMerge(
        'relative px-5 py-2 rounded-lg font-medium transition-all duration-300 overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] flex items-center justify-center gap-2',
        variants[variant],
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <span className="relative z-10 flex items-center gap-2">{children}</span>
          {/* Ripple effect overlay */}
          {!disabled && !loading && (
            <span className="absolute inset-0 z-0 bg-white opacity-0 group-active:opacity-20 transition-opacity" />
          )}
        </>
      )}
    </motion.button>
  );
}
