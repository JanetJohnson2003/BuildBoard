import { useSmoothCounter } from '../../hooks/useSmoothCounter';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function AnimatedCounter({ value, prefix = '', suffix = '', className, duration = 2000 }) {
  const { count, ref } = useSmoothCounter(value, duration);

  return (
    <span ref={ref} className={twMerge('inline-block font-display', className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
