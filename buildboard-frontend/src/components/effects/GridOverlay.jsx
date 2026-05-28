export function GridOverlay() {
  return (
    <div 
      className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
      style={{
        backgroundImage: `
          linear-gradient(to right, var(--text-main) 1px, transparent 1px),
          linear-gradient(to bottom, var(--text-main) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
      }}
    />
  );
}
