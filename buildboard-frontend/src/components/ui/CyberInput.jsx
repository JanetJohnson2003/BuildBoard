import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

export const CyberInput = forwardRef(({ 
  label, 
  error, 
  icon: Icon, 
  className, 
  containerClassName,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={twMerge('flex flex-col gap-1.5 w-full', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-muted)] ml-1">
          {label}
        </label>
      )}
      
      <div className="relative group">
        <div className={twMerge(
          "absolute -inset-[1px] rounded-lg transition-opacity duration-300 pointer-events-none",
          isFocused ? "opacity-100" : "opacity-0",
          error ? "bg-[var(--brand-danger)] blur-[4px]" : "bg-[var(--brand-primary)] blur-[4px]"
        )} />
        
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none group-focus-within:text-[var(--brand-primary)] transition-colors">
              <Icon size={18} />
            </div>
          )}
          
          <input
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={twMerge(
              'w-full bg-[var(--bg-main)] border text-[var(--text-main)] rounded-lg px-4 py-2.5 outline-none transition-colors shadow-sm',
              'placeholder:text-[var(--text-muted)]/50',
              Icon ? 'pl-10' : '',
              error 
                ? 'border-[var(--brand-danger)] focus:border-[var(--brand-danger)]' 
                : 'border-[var(--border-main)] hover:border-[var(--border-accent)] focus:border-[var(--brand-primary)]',
              className
            )}
            {...props}
          />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-[var(--brand-danger)] font-medium ml-1"
          >
            {error.message || error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

CyberInput.displayName = 'CyberInput';
