import { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function CyberTabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={twMerge('flex items-center gap-1 overflow-x-auto cyber-scrollbar pb-1 border-b border-[var(--glass-border)]', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={twMerge(
              'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors rounded-t-md outline-none focus-visible:bg-[var(--glass-highlight)]',
              isActive 
                ? 'text-[var(--text-main)]' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)]'
            )}
          >
            <div className="flex items-center gap-2">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="bg-[var(--glass-border)] text-[var(--text-main)] px-2 py-0.5 rounded-full text-xs">
                  {tab.badge}
                </span>
              )}
            </div>
            
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)] shadow-[0_-2px_10px_rgba(0,212,255,0.8)]"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
