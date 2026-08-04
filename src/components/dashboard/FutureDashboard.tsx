import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, Loader2 } from 'lucide-react';
import type { City, ClimateMetric, TimelineYear } from '../../types';
import { TIMELINE_LABELS } from '../../types';
import { MetricCard } from '../ui/MetricCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { cn, riskColor } from '../../utils/formatters';
import {
  computeOverallRiskScore,
  countWorseningMetrics,
  getCategoryLabel,
  getMetricCategory,
  getMetricSparkline,
  getTodayMetricValue,
  overallRiskLevel,
  type MetricCategory,
} from '../../utils/metrics';
import { CATEGORY_STYLES, RISK_PANEL_STYLES } from '../../utils/metricThemes';

interface FutureDashboardProps {
  city: City;
  year: TimelineYear;
  metrics: ClimateMetric[];
  loading?: boolean;
  timelineMetrics?: Map<TimelineYear, ClimateMetric[]> | null;
  timelineLoading?: boolean;
  scenarioLabel?: string;
}

const CATEGORY_ORDER: MetricCategory[] = ['climate', 'risk', 'projection'];

export function FutureDashboard({
  city,
  year,
  metrics,
  loading = false,
  timelineMetrics,
  timelineLoading = false,
  scenarioLabel = '🌍 Current Trajectory',
}: FutureDashboardProps) {
  const overallScore = useMemo(() => computeOverallRiskScore(metrics), [metrics]);
  const riskLevel = overallRiskLevel(overallScore);
  const panelStyle = RISK_PANEL_STYLES[riskLevel];
  const worseningCount = useMemo(() => countWorseningMetrics(metrics), [metrics]);

  const groupedMetrics = useMemo(() => {
    const groups = new Map<MetricCategory, ClimateMetric[]>();

    for (const category of CATEGORY_ORDER) {
      groups.set(category, []);
    }

    for (const metric of metrics) {
      const category = getMetricCategory(metric.id);
      groups.get(category)?.push(metric);
    }

    return CATEGORY_ORDER.map((category) => ({
      category,
      metrics: groups.get(category) ?? [],
    })).filter((group) => group.metrics.length > 0);
  }, [metrics]);

  let cardIndex = 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-400/15 bg-gradient-to-br from-sky-950/30 via-transparent to-blue-950/20 p-1">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/8 blur-3xl" />
      <div className="relative rounded-[22px] bg-surface/40 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/30 to-violet-500/30 ring-1 ring-white/15">
              <Activity className="h-4 w-4 text-sky-300" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Future Dashboard
            </h2>
          </div>
          <p className="text-xs text-white/55">
            Live projections for {city.name} — metrics animate as you move through the timeline
          </p>
        </div>

        <motion.div
          key={year}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="inline-flex items-center gap-2 self-start rounded-full border border-sky-400/50 bg-gradient-to-r from-sky-500/25 to-violet-500/25 px-4 py-2 text-xs font-semibold text-sky-100 shadow-[0_0_20px_-4px_rgba(56,189,248,0.45)]"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-300" />
          </span>
          Viewing {TIMELINE_LABELS[year]}
        </motion.div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          `Scenario: ${scenarioLabel}`,
          'Baseline: Open-Meteo 1991–2020',
          'Risk models: NASA · Copernicus · regional CMIP6 factors',
        ].map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/55"
          >
            {label}
          </span>
        ))}
      </div>

      <div
        className={cn(
          'mb-5 rounded-2xl border p-5 backdrop-blur-xl',
          panelStyle.bg,
          panelStyle.border,
          panelStyle.glow
        )}
      >
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Composite risk index
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={cn('text-4xl font-bold tabular-nums', panelStyle.score)}>
                <AnimatedNumber value={overallScore} />
              </span>
              <span className="text-sm font-medium text-white/45">/ 100</span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
                  riskColor(riskLevel),
                  panelStyle.bg,
                  'ring-1 ring-current/30'
                )}
              >
                {riskLevel.replace('-', ' ')}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/70">
              <span className="font-semibold text-orange-300">{worseningCount}</span> of{' '}
              {metrics.length} indicators trending worse than today
            </p>
          </div>

          <div className="min-w-[240px]">
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
              <span className="text-emerald-300">Low</span>
              <span className="flex items-center gap-1 text-white/60">
                <TrendingUp className="h-3 w-3 text-orange-300" />
                Risk trajectory
              </span>
              <span className="text-red-300">Critical</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', panelStyle.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${overallScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {(loading || timelineLoading) && (
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-sky-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating projections…
        </div>
      )}

      <div className="space-y-8">
        {groupedMetrics.map(({ category, metrics: categoryMetrics }) => {
          const style = CATEGORY_STYLES[category];
          return (
            <div key={category}>
              <div
                className={cn(
                  'mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
                  style.bg,
                  style.border
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', style.dot)} />
                <h3 className={cn('text-xs font-semibold uppercase tracking-wider', style.accent)}>
                  {getCategoryLabel(category)}
                </h3>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryMetrics.map((metric) => {
                    const index = cardIndex++;
                    return (
                      <MetricCard
                        key={metric.id}
                        metric={metric}
                        year={year}
                        index={index}
                        loading={loading}
                        sparklineValues={getMetricSparkline(timelineMetrics, metric.id)}
                        todayValue={getTodayMetricValue(timelineMetrics, metric.id)}
                      />
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
