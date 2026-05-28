import { useReducedMotion } from '../../hooks/useReducedMotion';

export function AuroraBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-var(--bg-main) pointer-events-none">
      <div 
        className={`absolute -inset-[10px] opacity-30 ${!prefersReducedMotion ? 'animate-[aurora_60s_linear_infinite]' : ''}`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 50%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(6, 255, 199, 0.1) 0%, transparent 50%)
          `,
          filter: 'blur(60px)',
        }}
      />
      <style>{`
        @keyframes aurora {
          0% { transform: rotate(0deg) scale(1); }
          33% { transform: rotate(120deg) scale(1.1); }
          66% { transform: rotate(240deg) scale(0.9); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
