import type { ConfidenceLevel } from '../../types';
import { confidenceLabel } from '../../utils/formatters';
import { cn } from '../../utils/formatters';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const colors = {
    high: 'text-emerald-300 bg-emerald-500/20 ring-1 ring-emerald-400/35',
    medium: 'text-amber-300 bg-amber-500/20 ring-1 ring-amber-400/35',
    low: 'text-slate-300 bg-slate-500/20 ring-1 ring-slate-400/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors[level],
        className
      )}
    >
      {confidenceLabel(level)}
    </span>
  );
}
