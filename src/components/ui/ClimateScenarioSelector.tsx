import { motion, AnimatePresence } from 'framer-motion';
import {
  CLIMATE_SCENARIOS,
  CLIMATE_SCENARIO_ORDER,
  type ClimateScenarioId,
} from '../../config/climateScenarios';
import { useClimateScenario } from '../../context/ClimateScenarioContext';
import { cn } from '../../utils/formatters';

export function ClimateScenarioSelector() {
  const { scenarioId, scenario, setScenarioId } = useClimateScenario();

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text-secondary">Climate Scenario</span>
        <span className="text-[10px] text-text-muted hidden sm:inline">
          IPCC-inspired illustrative pathways
        </span>
      </div>

      {/* Desktop: segmented control */}
      <div
        className="hidden sm:grid sm:grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1"
        role="radiogroup"
        aria-label="Climate scenario"
      >
        {CLIMATE_SCENARIO_ORDER.map((id) => (
          <ScenarioOption
            key={id}
            id={id}
            selected={scenarioId === id}
            onSelect={setScenarioId}
            variant="segment"
          />
        ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div
        className="sm:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
        role="radiogroup"
        aria-label="Climate scenario"
      >
        {CLIMATE_SCENARIO_ORDER.map((id) => (
          <ScenarioOption
            key={id}
            id={id}
            selected={scenarioId === id}
            onSelect={setScenarioId}
            variant="pill"
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={scenarioId}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-sky-400/15 bg-sky-950/25 px-4 py-3"
        >
          <p className="text-xs font-medium text-sky-100">
            {scenario.emoji} {scenario.label}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{scenario.description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface ScenarioOptionProps {
  id: ClimateScenarioId;
  selected: boolean;
  onSelect: (id: ClimateScenarioId) => void;
  variant: 'segment' | 'pill';
}

function ScenarioOption({ id, selected, onSelect, variant }: ScenarioOptionProps) {
  const config = CLIMATE_SCENARIOS[id];

  if (variant === 'segment') {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => onSelect(id)}
        className={cn(
          'relative rounded-lg px-3 py-2.5 text-left transition-colors duration-200',
          selected
            ? 'bg-gradient-to-br from-sky-500/30 to-violet-500/20 text-white shadow-[0_0_16px_-4px_rgba(56,189,248,0.4)] ring-1 ring-sky-400/40'
            : 'text-text-muted hover:bg-white/5 hover:text-text-secondary'
        )}
      >
        <span className="block text-sm font-medium">
          {config.emoji} {config.label}
        </span>
        <span className="mt-0.5 block text-[10px] leading-snug opacity-70 line-clamp-2">
          {id === 'optimistic' && 'Rapid global emissions reductions.'}
          {id === 'current-policies' && "Today's emissions trajectory continues."}
          {id === 'high-emissions' && 'Continued high emissions with limited mitigation.'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(id)}
      className={cn(
        'snap-start shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors duration-200',
        selected
          ? 'border-sky-400/50 bg-sky-500/25 text-sky-100'
          : 'border-white/10 bg-white/[0.04] text-text-muted'
      )}
    >
      {config.emoji} {config.shortLabel}
    </button>
  );
}
