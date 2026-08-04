import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';

interface StoryModeProps {
  story: string;
  cityName: string;
  year: number;
  loading?: boolean;
}

export function StoryMode({ story, cityName, year, loading }: StoryModeProps) {
  const [expanded, setExpanded] = useState(false);

  if (year === 2025) {
    return (
      <GlassPanel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Story Mode</h3>
            <p className="text-xs text-text-muted">Move the timeline forward to unlock narratives</p>
          </div>
        </div>
        <p className="text-sm text-text-muted">
          Select a future year on the timeline to experience an immersive story of {cityName}.
        </p>
      </GlassPanel>
    );
  }

  const paragraphs = story.split('\n\n');

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Story Mode</h3>
            <p className="text-xs text-text-muted">
              {cityName} in {year}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-white/5" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${cityName}-${year}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm leading-relaxed text-text-secondary italic">
                {paragraphs[0]}
              </p>

              {expanded && paragraphs.slice(1).map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="mt-4 text-sm leading-relaxed text-text-secondary"
                >
                  {p}
                </motion.p>
              ))}
            </motion.div>
          </AnimatePresence>

          {paragraphs.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-4 -ml-2"
            >
              {expanded ? 'Show less' : 'Continue reading'}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </Button>
          )}
        </>
      )}
    </GlassPanel>
  );
}
