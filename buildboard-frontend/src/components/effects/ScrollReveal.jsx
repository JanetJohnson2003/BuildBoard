import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function ScrollReveal({ 
  children, 
  variant = 'up', 
  delay = 0, 
  duration = 0.5,
  className = '',
  once = true,
  margin = "-50px"
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants[variant]}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration, delay, type: "spring", stiffness: 100, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
