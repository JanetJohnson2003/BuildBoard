import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function CyberSkeleton({ className, variant = 'rect' }) {
  const variants = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded-sm h-4 w-full',
  };

  return (
    <div 
      className={twMerge(
        'relative overflow-hidden bg-[var(--bg-tertiary)]',
        variants[variant],
        className
      )}
    >
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer-neon_2s_infinite] bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.1)] to-transparent"
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  );
}
