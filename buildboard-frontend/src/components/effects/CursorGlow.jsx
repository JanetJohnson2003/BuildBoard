import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMousePosition } from '../../hooks/useMousePosition';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function CursorGlow() {
  const { x, y } = useMousePosition();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (x !== null && y !== null) {
      setIsVisible(true);
    }
  }, [x, y]);

  if (prefersReducedMotion || !isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-15 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, var(--brand-primary) 0%, transparent 70%)',
          left: x - 300,
          top: y - 300,
          willChange: 'left, top'
        }}
      />
    </motion.div>
  );
}
