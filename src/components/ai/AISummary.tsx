import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';

interface AISummaryProps {
  summary: string;
  cityName: string;
  year: number;
  loading?: boolean;
}

export function AISummary({ summary, cityName, year, loading }: AISummaryProps) {
  return (
    <GlassPanel className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/10">
          <Sparkles className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium">AI Insight</h3>
          <p className="text-xs text-text-muted">
            {cityName} · {year === 2025 ? 'Today' : year}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/5" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-white/5" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-white/5" />
        </div>
      ) : (
        <motion.p
          key={summary}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-sm leading-relaxed text-text-secondary"
        >
          {summary}
        </motion.p>
      )}

      <p className="mt-4 text-[10px] text-text-muted">
        Generated from IPCC, Copernicus, and Open-Meteo data models. Not a deterministic forecast.
      </p>
    </GlassPanel>
  );
}
