import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function CyberBadge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  glow = false
}) {
  const variants = {
    primary: 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30',
    success: 'bg-[var(--brand-success)]/10 text-[var(--brand-success)] border border-[var(--brand-success)]/30',
    danger: 'bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] border border-[var(--brand-danger)]/30',
    warning: 'bg-[var(--brand-warning)]/10 text-[var(--brand-warning)] border border-[var(--brand-warning)]/30',
    purple: 'bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] border border-[var(--brand-purple)]/30',
    neutral: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-main)]',
  };

  const glowStyles = {
    primary: 'shadow-[0_0_10px_rgba(0,212,255,0.4)]',
    success: 'shadow-[0_0_10px_rgba(6,255,199,0.4)]',
    danger: 'shadow-[0_0_10px_rgba(255,62,154,0.4)]',
    warning: 'shadow-[0_0_10px_rgba(255,107,53,0.4)]',
    purple: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]',
    neutral: '',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span 
      className={twMerge(
        'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        glow && glowStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
