import { motion } from 'framer-motion';
import {
  Thermometer,
  Sun,
  CloudRain,
  Waves,
  Flame,
  Wind,
  Anchor,
  Droplets,
  CloudOff,
  Users,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import type { ClimateMetric, TimelineYear } from '../../types';
import { TIMELINE_LABELS, TIMELINE_YEARS } from '../../types';
import { GlassPanel } from './GlassPanel';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceBadge } from './SourceBadge';
import { AnimatedNumber } from './AnimatedNumber';
import { MiniSparkline } from './MiniSparkline';
import { cn, riskBgColor, riskColor, riskBarColor, trendIcon } from '../../utils/formatters';
import { parseMetricNumber, formatMetricDisplay } from '../../utils/metrics';
import { getMetricTheme } from '../../utils/metricThemes';

const ICON_MAP: Record<string, LucideIcon> = {
  thermometer: Thermometer,
  sun: Sun,
  'cloud-rain': CloudRain,
  waves: Waves,
  flame: Flame,
  wind: Wind,
  anchor: Anchor,
  droplets: Droplets,
  'cloud-off': CloudOff,
  users: Users,
  building: Building2,
};

interface MetricCardProps {
  metric: ClimateMetric;
  year: TimelineYear;
  index?: number;
  sparklineValues?: number[];
  todayValue?: string | number | null;
  loading?: boolean;
}

export function MetricCard({
  metric,
  year,
  index = 0,
  sparklineValues = [],
  todayValue = null,
  loading = false,
}: MetricCardProps) {
  const Icon = ICON_MAP[metric.icon] ?? Thermometer;
  const theme = getMetricTheme(metric.id);
  const numericValue = parseMetricNumber(metric);
  const activeIndex = TIMELINE_YEARS.indexOf(year);
  const showRiskBar = metric.unit === '%' && numericValue !== null;
  const invertSparkline = metric.id === 'rainfall' || metric.id === 'air-quality';

  const trendColors = {
    up: 'text-orange-300 bg-orange-500/15 ring-1 ring-orange-400/30',
    down: 'text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-400/30',
    stable: 'text-slate-300 bg-slate-500/15 ring-1 ring-slate-400/25',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
    >
      <GlassPanel
        hover
        className={cn(
          'relative h-full overflow-hidden border p-5 transition-all duration-300 hover:shadow-lg',
          metric.riskLevel ? riskBgColor(metric.riskLevel) : cn(theme.cardBg, theme.border),
          loading && 'opacity-70'
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl',
            metric.riskLevel === 'very-high' && 'bg-red-500/25',
            metric.riskLevel === 'high' && 'bg-orange-500/25',
            metric.riskLevel === 'moderate' && 'bg-amber-500/25',
            metric.riskLevel === 'low' && 'bg-emerald-500/25',
            !metric.riskLevel && theme.glow
          )}
          aria-hidden
        />

        {metric.riskLevel && (
          <motion.div
            className={cn(
              'absolute inset-x-0 top-0 h-1',
              metric.riskLevel === 'very-high' && 'bg-red-400',
              metric.riskLevel === 'high' && 'bg-orange-400',
              metric.riskLevel === 'moderate' && 'bg-amber-400',
              metric.riskLevel === 'low' && 'bg-emerald-400'
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: index * 0.04 }}
            style={{ transformOrigin: 'left' }}
          />
        )}

        <div className="relative mb-4 flex items-start justify-between gap-3">
          <motion.div
            key={`${year}-${metric.id}-icon`}
            initial={{ rotate: -8, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              theme.iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', theme.icon)} />
          </motion.div>

          {sparklineValues.length > 1 && (
            <MiniSparkline
              values={sparklineValues}
              activeIndex={activeIndex}
              invert={invertSparkline}
              className={cn('h-7 w-[88px] shrink-0', theme.spark)}
            />
          )}
        </div>

        <div className="relative mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-white/90">{metric.label}</p>
            {metric.description && (
              <p className="mt-1 text-[10px] leading-relaxed text-white/45">{metric.description}</p>
            )}
          </div>
          <SourceBadge source={metric.source} />
        </div>

        <div className="relative mb-3 flex items-baseline gap-1.5">
          {numericValue !== null ? (
            <span className={cn('text-3xl font-bold tracking-tight tabular-nums', theme.value)}>
              <AnimatedNumber value={numericValue} decimals={numericValue % 1 ? 1 : 0} />
            </span>
          ) : (
            <motion.span
              key={`${year}-${metric.id}-value`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('text-3xl font-bold tracking-tight', theme.value)}
            >
              {metric.value}
            </motion.span>
          )}
          <span className="text-sm font-medium text-white/50">{metric.unit}</span>
        </div>

        {year !== 2025 && todayValue !== null && todayValue !== undefined && (
          <p className="relative mb-3 text-[11px] leading-relaxed text-white/55">
            <span className="text-white/40">Today</span>{' '}
            <span className="font-medium text-white/70">
              {formatMetricDisplay(todayValue, metric.unit)}
            </span>
            <span className="mx-1.5 text-white/30">→</span>
            <span className="text-white/40">{TIMELINE_LABELS[year]}</span>{' '}
            <span className="font-medium text-white/85">
              {formatMetricDisplay(metric.value, metric.unit)}
            </span>
          </p>
        )}

        {showRiskBar && (
          <div className="relative mb-3">
            <div className="h-2 overflow-hidden rounded-full bg-black/30 ring-1 ring-white/10">
              <motion.div
                className={cn('h-full rounded-full', riskBarColor(metric.riskLevel))}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, numericValue!)}%` }}
                transition={{ duration: 0.7, delay: index * 0.04, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-between gap-2">
          <motion.span
            key={`${year}-${metric.id}-trend`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
              trendColors[metric.trend]
            )}
          >
            {trendIcon(metric.trend)} {metric.trendValue}
          </motion.span>
          <ConfidenceBadge level={metric.confidence} />
        </div>

        {metric.riskLevel && (
          <motion.p
            key={`${year}-${metric.id}-risk`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('relative mt-2 text-xs font-semibold capitalize', riskColor(metric.riskLevel))}
          >
            {metric.riskLevel.replace('-', ' ')} risk
          </motion.p>
        )}
      </GlassPanel>
    </motion.div>
  );
}
