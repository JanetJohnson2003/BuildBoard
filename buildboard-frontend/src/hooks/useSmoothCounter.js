import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { useInView } from 'framer-motion';

export function useSmoothCounter(end, duration = 2000, start = 0) {
  const [count, setCount] = useState(start);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress / duration, 4);
      
      if (progress < duration) {
        setCount(Math.floor(start + (end - start) * easeProgress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [end, duration, start, isInView, prefersReducedMotion]);

  return { count, ref };
}
