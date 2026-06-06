import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Also check local storage for performance mode
    const checkPerformanceMode = () => {
      const mode = localStorage.getItem('cyberboard-performance-mode');
      if (mode === 'true') setPrefersReducedMotion(true);
    };
    
    checkPerformanceMode();
    window.addEventListener('storage', checkPerformanceMode);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', checkPerformanceMode);
    };
  }, []);

  return prefersReducedMotion;
}
