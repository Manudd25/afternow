import { cn } from '../../utils/formatters';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassPanel({ children, className, hover = false }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl',
        hover && 'transition-all duration-300 hover:border-white/15 hover:bg-white/5',
        className
      )}
    >
      {children}
    </div>
  );
}
