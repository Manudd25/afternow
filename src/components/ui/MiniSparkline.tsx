import { motion } from 'framer-motion';
import { TIMELINE_YEARS } from '../../types';
import { cn } from '../../utils/formatters';

interface MiniSparklineProps {
  values: number[];
  activeIndex: number;
  className?: string;
  invert?: boolean;
}

export function MiniSparkline({
  values,
  activeIndex,
  className,
  invert = false,
}: MiniSparklineProps) {
  if (values.length < 2) return null;

  const width = 88;
  const height = 28;
  const padding = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const normalized = invert ? max - value : value - min;
    const y = padding + (1 - normalized / range) * (height - padding * 2);
    return { x, y, index };
  });

  const linePath = points.map((p) => `${p.x},${p.y}`).join(' ');
  const activePoint = points[activeIndex] ?? points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      <polyline
        points={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white/35"
      />
      <motion.polyline
        key={linePath}
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        points={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent/90"
      />
      {points.map((point) => (
        <circle
          key={TIMELINE_YEARS[point.index]}
          cx={point.x}
          cy={point.y}
          r={point.index === activeIndex ? 3 : 1.5}
          className={cn(
            point.index === activeIndex ? 'fill-current' : 'fill-white/40'
          )}
        />
      ))}
      <circle cx={activePoint.x} cy={activePoint.y} r={5} className="fill-current opacity-30" />
    </svg>
  );
}
