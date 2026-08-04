import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Columns2, SlidersHorizontal, Loader2, Sparkles } from 'lucide-react';
import type { CityVisualizationPair, VisualizationViewMode, CityVisualScenario } from '../../types/visualization';
import type { GenerationProgress } from '../../hooks/useFutureVisualization';
import { getYearDisplayLabel } from '../../services/visualizationPromptBuilder';
import { TIMELINE_YEARS } from '../../types';
import { cn } from '../../utils/formatters';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { CityScenarioOverlay } from './CityScenarioOverlay';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { VisualizationDisclaimer } from './VisualizationDisclaimer';

interface FutureCityVisualizationProps {
  cityName: string;
  year: number;
  visualization: CityVisualizationPair | null;
  scenario: CityVisualScenario | null;
  mockLoading: boolean;
  aiGenerating: boolean;
  isAiGenerated: boolean;
  fallbackMessage: string | null;
  generationProgress: GenerationProgress | null;
  cachedYearsCount: number;
  allYearsCached: boolean;
  allFutureAiCached: boolean;
  aiGenerationCount: number;
  hasPresentDayPhoto: boolean;
  viewMode: VisualizationViewMode;
  onViewModeChange: (mode: VisualizationViewMode) => void;
  onGenerateAi: () => void;
  canGenerateAi: boolean;
  cooldownRemainingMs: number;
  aiGenerationEnabled: boolean;
}

const VIEW_MODES: { id: VisualizationViewMode; label: string; icon: typeof Image }[] = [
  { id: 'single', label: 'Single View', icon: Image },
  { id: 'side-by-side', label: 'Side-by-Side', icon: Columns2 },
  { id: 'comparison', label: 'Comparison Slider', icon: SlidersHorizontal },
];

interface CityImageFrameProps {
  imageUrl: string;
  effects: CityVisualScenario['effects'];
  label: string;
  alt: string;
  className?: string;
}

const FALLBACK_IMAGE = '/images/cities/generic.svg';

function CityImageFrame({ imageUrl, effects, label, alt, className }: CityImageFrameProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  return (
    <div className={cn('relative aspect-[21/9] w-full overflow-hidden bg-surface-elevated', className)}>
      <img
        src={failed ? FALLBACK_IMAGE : imageUrl}
        alt={alt}
        className="h-full w-full object-cover transition-all duration-700"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <CityScenarioOverlay effects={effects} />
      <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
}

function formatCooldown(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return seconds <= 1 ? '1s' : `${seconds}s`;
}

export function FutureCityVisualization({
  cityName,
  year,
  visualization,
  scenario,
  mockLoading,
  aiGenerating,
  isAiGenerated,
  fallbackMessage,
  generationProgress,
  cachedYearsCount,
  allYearsCached,
  allFutureAiCached,
  aiGenerationCount,
  hasPresentDayPhoto,
  viewMode,
  onViewModeChange,
  onGenerateAi,
  canGenerateAi,
  cooldownRemainingMs,
  aiGenerationEnabled,
}: FutureCityVisualizationProps) {
  const futureLabel = getYearDisplayLabel(year);
  const presentLabel = 'Today';
  const isLoading = mockLoading && !visualization;

  const aiButtonLabel =
    aiGenerationCount === TIMELINE_YEARS.length
      ? `Generate AI views (${aiGenerationCount} scenarios)`
      : `Generate AI views (${aiGenerationCount} future years)`;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
            Future City Visualization
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {aiGenerationEnabled
              ? allYearsCached && allFutureAiCached
                ? 'All scenarios ready — scroll the timeline to explore'
                : allYearsCached
                  ? 'Loading scenarios…'
                : aiGenerating
                  ? generationProgress
                    ? `Generating ${generationProgress.current} of ${generationProgress.total} — ${generationProgress.label}. You can scroll the timeline while you wait.`
                    : 'Preparing AI scenarios…'
                  : cachedYearsCount > 0
                    ? `${cachedYearsCount}/${TIMELINE_YEARS.length} ready — tap to generate ${aiGenerationCount} AI view${aiGenerationCount === 1 ? '' : 's'}`
                    : hasPresentDayPhoto
                      ? 'Real photo for Today — CSS climate effects sync with the timeline instantly'
                      : 'Illustrative preview — generate AI views for all timeline years when ready'
              : 'Illustrative scenario — CSS effects sync with timeline instantly'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {aiGenerationEnabled && !allYearsCached && (
            <Button
              size="md"
              onClick={onGenerateAi}
              disabled={!canGenerateAi}
              className="shrink-0 bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {generationProgress
                    ? `${generationProgress.current}/${generationProgress.total} — ${generationProgress.label}`
                    : 'Generating…'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {aiButtonLabel}
                </>
              )}
            </Button>
          )}

          {aiGenerationEnabled && allYearsCached && allFutureAiCached && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              All scenarios ready
            </span>
          )}

          {aiGenerationEnabled && allYearsCached && !allFutureAiCached && !aiGenerating && (
            <Button
              size="md"
              onClick={onGenerateAi}
              disabled={!canGenerateAi}
              className="shrink-0 bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500"
            >
              <Sparkles className="h-4 w-4" />
              {aiButtonLabel}
            </Button>
          )}

          <div className="flex rounded-xl border border-white/8 bg-white/3 p-1">
            {VIEW_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onViewModeChange(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  viewMode === id
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {fallbackMessage && (
        <p className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/90">
          {fallbackMessage}
        </p>
      )}

      {aiGenerationEnabled && !canGenerateAi && cooldownRemainingMs > 0 && !aiGenerating && (
        <p className="mb-3 text-[11px] text-text-muted">
          Cooldown active — try again in {formatCooldown(cooldownRemainingMs)}
        </p>
      )}

      <GlassPanel className="relative overflow-hidden">
        {aiGenerating && generationProgress && (
          <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/5">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{
                width: `${(generationProgress.current / generationProgress.total) * 100}%`,
              }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {isLoading || !visualization || !scenario ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex aspect-[21/9] items-center justify-center bg-surface-elevated"
            >
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </motion.div>
          ) : (
            <motion.div
              key={`${viewMode}-${year}-${isAiGenerated ? 'ai' : 'mock'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {viewMode === 'single' && (
                <CityImageFrame
                  imageUrl={visualization.future.imageUrl}
                  effects={scenario.effects}
                  label={futureLabel}
                  alt={`Illustrative visualization of ${cityName} in ${futureLabel}`}
                />
              )}

              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <CityImageFrame
                    imageUrl={visualization.present.imageUrl}
                    effects={visualization.present.scenario.effects}
                    label={presentLabel}
                    alt={`Present-day ${cityName}`}
                    className="md:rounded-r-none"
                  />
                  <CityImageFrame
                    imageUrl={visualization.future.imageUrl}
                    effects={scenario.effects}
                    label={futureLabel}
                    alt={`Future ${cityName} in ${futureLabel}`}
                    className="md:rounded-l-none border-t md:border-t-0 md:border-l border-white/8"
                  />
                </div>
              )}

              {viewMode === 'comparison' && (
                <BeforeAfterSlider
                  beforeLabel={presentLabel}
                  afterLabel={futureLabel}
                  className="aspect-[21/9]"
                  before={
                    <CityImageFrame
                      imageUrl={visualization.present.imageUrl}
                      effects={visualization.present.scenario.effects}
                      label={presentLabel}
                      alt={`Present-day ${cityName}`}
                    />
                  }
                  after={
                    <CityImageFrame
                      imageUrl={visualization.future.imageUrl}
                      effects={scenario.effects}
                      label={futureLabel}
                      alt={`Future ${cityName} in ${futureLabel}`}
                    />
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {visualization && scenario && !isLoading && (
          <div className="border-t border-white/8 p-4 space-y-4">
            <VisualizationDisclaimer
              metadata={visualization.future.metadata}
              assumptions={scenario.assumptions}
              isAiGenerated={isAiGenerated}
            />

            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-text-secondary hover:text-white transition-colors list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                View generated image prompt
              </summary>
              <p className="mt-2 rounded-lg bg-white/3 p-3 text-xs leading-relaxed text-text-muted italic">
                {visualization.prompt.text}
              </p>
            </details>
          </div>
        )}
      </GlassPanel>
    </section>
  );
}
