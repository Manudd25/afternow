import { motion } from 'framer-motion';
import type { TimelineYear } from '../../types';
import { TIMELINE_YEARS, TIMELINE_LABELS } from '../../types';
import { cn } from '../../utils/formatters';

interface TimelineSliderProps {
  year: TimelineYear;
  onChange: (year: TimelineYear) => void;
}

export function TimelineSlider({ year, onChange }: TimelineSliderProps) {
  const currentIndex = TIMELINE_YEARS.indexOf(year);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-secondary">Future Timeline</span>
        <motion.span
          key={year}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-semibold text-accent"
        >
          {TIMELINE_LABELS[year]}
        </motion.span>
      </div>

      <div className="relative px-1">
        <input
          type="range"
          min={0}
          max={TIMELINE_YEARS.length - 1}
          step={1}
          value={currentIndex}
          onChange={(e) => onChange(TIMELINE_YEARS[Number(e.target.value)])}
          className="w-full"
          aria-label="Future timeline slider"
        />

        <div className="flex justify-between mt-3">
          {TIMELINE_YEARS.map((y, i) => (
            <button
              key={y}
              onClick={() => onChange(y)}
              className={cn(
                'text-xs transition-colors duration-200',
                i === currentIndex
                  ? 'text-accent font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {TIMELINE_LABELS[y]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
