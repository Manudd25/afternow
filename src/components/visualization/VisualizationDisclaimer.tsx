import { Info } from 'lucide-react';
import { useState } from 'react';
import type { FutureImageMetadata } from '../../types/visualization';
import { GlassPanel } from '../ui/GlassPanel';

const ILLUSTRATIVE_EXPLANATION =
  'Future projections are illustrative scenarios inspired by historical climate data and established climate research. They are intended to help visualize potential futures rather than provide exact forecasts.';

interface VisualizationDisclaimerProps {
  metadata: FutureImageMetadata;
  assumptions?: string[];
  isAiGenerated?: boolean;
}

export function VisualizationDisclaimer({
  metadata,
  assumptions,
  isAiGenerated = false,
}: VisualizationDisclaimerProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const allAssumptions = assumptions ?? metadata.assumptions;

  const badgeLabel = isAiGenerated
    ? 'AI-generated illustrative scenario'
    : 'Data-informed illustrative scenario';

  const badgeClass = isAiGenerated
    ? 'bg-violet-400/10 text-violet-300'
    : 'bg-sky-400/10 text-sky-300';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-wider ${badgeClass}`}
        >
          {badgeLabel}
        </span>

        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="About this visualization"
          >
            <Info className="h-3.5 w-3.5" />
          </button>

          {showTooltip && (
            <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-white/10 bg-surface-elevated/95 p-3 text-xs leading-relaxed text-text-secondary shadow-xl backdrop-blur-xl">
              {ILLUSTRATIVE_EXPLANATION}
            </div>
          )}
        </div>

        <span className="text-[10px] text-text-muted">
          Provider: {metadata.provider} · {new Date(metadata.timestamp).toLocaleDateString()}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-text-muted">{ILLUSTRATIVE_EXPLANATION}</p>

      <GlassPanel className="p-3">
        <p className="text-[11px] font-medium text-text-secondary mb-2">Scenario assumptions</p>
        <ul className="space-y-1">
          {allAssumptions.map((a) => (
            <li key={a} className="text-[10px] text-text-muted flex gap-1.5">
              <span className="text-accent shrink-0">·</span>
              {a}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-text-muted">
          Sources: {metadata.sources.join(', ')}
        </p>
      </GlassPanel>
    </div>
  );
}
