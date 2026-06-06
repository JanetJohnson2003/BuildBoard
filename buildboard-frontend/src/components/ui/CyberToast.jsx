import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

let toastCounter = 0;
let addToastFn = null;

// Global toast manager for programmatic usage
export const toast = {
  success: (message) => addToastFn?.({ id: ++toastCounter, type: 'success', message }),
  error: (message) => addToastFn?.({ id: ++toastCounter, type: 'error', message }),
  info: (message) => addToastFn?.({ id: ++toastCounter, type: 'info', message }),
  warning: (message) => addToastFn?.({ id: ++toastCounter, type: 'warning', message }),
};

export function CyberToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const icons = {
    success: <CheckCircle className="text-[var(--brand-success)]" size={20} />,
    error: <AlertCircle className="text-[var(--brand-danger)]" size={20} />,
    info: <Info className="text-[var(--brand-primary)]" size={20} />,
    warning: <AlertTriangle className="text-[var(--brand-warning)]" size={20} />,
  };

  const borders = {
    success: 'border-[var(--brand-success)]',
    error: 'border-[var(--brand-danger)]',
    info: 'border-[var(--brand-primary)]',
    warning: 'border-[var(--brand-warning)]',
  };

  const glows = {
    success: 'shadow-[0_0_15px_rgba(6,255,199,0.3)]',
    error: 'shadow-[0_0_15px_rgba(255,62,154,0.3)]',
    info: 'shadow-[0_0_15px_rgba(0,212,255,0.3)]',
    warning: 'shadow-[0_0_15px_rgba(255,107,53,0.3)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      className={twMerge(
        'glass-panel border-l-4 pointer-events-auto flex items-start gap-3 p-4 min-w-[300px] max-w-[400px]',
        borders[toast.type],
        glows[toast.type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium text-[var(--text-main)]">
        {toast.message}
      </div>
      <button 
        onClick={onRemove}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
