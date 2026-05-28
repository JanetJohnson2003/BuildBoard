import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function CyberDropdown({ trigger, children, align = 'right', className }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={twMerge(
              'absolute z-50 mt-2 min-w-[200px] glass-panel p-1 border-t-[var(--brand-primary)] overflow-hidden',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              className
            )}
          >
            <div className="flex flex-col gap-1 py-1" onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CyberDropdownItem({ children, onClick, icon: Icon, className, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors outline-none',
        danger 
          ? 'text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/10 focus-visible:bg-[var(--brand-danger)]/10' 
          : 'text-[var(--text-main)] hover:bg-[var(--glass-highlight)] hover:text-[var(--brand-primary)] focus-visible:bg-[var(--glass-highlight)]',
        className
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
