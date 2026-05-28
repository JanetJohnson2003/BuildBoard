import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function CyberTable({ headers, children, className }) {
  return (
    <div className={twMerge("w-full overflow-x-auto glass-panel cyber-scrollbar", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-highlight)]">
            {headers.map((header, i) => (
              <th 
                key={i} 
                className="px-4 py-3 text-sm font-medium text-[var(--text-muted)] whitespace-nowrap first:pl-6 last:pr-6"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--glass-border)]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function CyberTableRow({ children, className, onClick }) {
  return (
    <tr 
      onClick={onClick}
      className={twMerge(
        "transition-colors hover:bg-[var(--glass-highlight)] group",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function CyberTableCell({ children, className }) {
  return (
    <td className={twMerge("px-4 py-3 text-sm text-[var(--text-main)] first:pl-6 last:pr-6", className)}>
      {children}
    </td>
  );
}
