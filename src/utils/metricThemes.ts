import type { MetricCategory } from './metrics';

export interface MetricTheme {
  icon: string;
  iconBg: string;
  cardBg: string;
  border: string;
  spark: string;
  value: string;
  glow: string;
}

export const METRIC_THEMES: Record<string, MetricTheme> = {
  temperature: {
    icon: 'text-orange-300',
    iconBg: 'bg-orange-500/25 ring-1 ring-orange-400/40',
    cardBg: 'bg-orange-500/[0.07]',
    border: 'border-orange-400/35',
    spark: 'text-orange-400',
    value: 'text-orange-100',
    glow: 'bg-orange-500/25',
  },
  heatwaves: {
    icon: 'text-amber-300',
    iconBg: 'bg-amber-500/25 ring-1 ring-amber-400/40',
    cardBg: 'bg-amber-500/[0.07]',
    border: 'border-amber-400/35',
    spark: 'text-amber-400',
    value: 'text-amber-100',
    glow: 'bg-amber-500/25',
  },
  rainfall: {
    icon: 'text-sky-300',
    iconBg: 'bg-sky-500/25 ring-1 ring-sky-400/40',
    cardBg: 'bg-sky-500/[0.07]',
    border: 'border-sky-400/35',
    spark: 'text-sky-400',
    value: 'text-sky-100',
    glow: 'bg-sky-500/25',
  },
  flood: {
    icon: 'text-blue-300',
    iconBg: 'bg-blue-500/25 ring-1 ring-blue-400/40',
    cardBg: 'bg-blue-500/[0.07]',
    border: 'border-blue-400/35',
    spark: 'text-blue-400',
    value: 'text-blue-100',
    glow: 'bg-blue-500/25',
  },
  wildfire: {
    icon: 'text-red-300',
    iconBg: 'bg-red-500/25 ring-1 ring-red-400/40',
    cardBg: 'bg-red-500/[0.07]',
    border: 'border-red-400/35',
    spark: 'text-red-400',
    value: 'text-red-100',
    glow: 'bg-red-500/25',
  },
  drought: {
    icon: 'text-yellow-300',
    iconBg: 'bg-yellow-600/25 ring-1 ring-yellow-500/40',
    cardBg: 'bg-yellow-600/[0.07]',
    border: 'border-yellow-500/35',
    spark: 'text-yellow-400',
    value: 'text-yellow-100',
    glow: 'bg-yellow-600/25',
  },
  'air-quality': {
    icon: 'text-teal-300',
    iconBg: 'bg-teal-500/25 ring-1 ring-teal-400/40',
    cardBg: 'bg-teal-500/[0.07]',
    border: 'border-teal-400/35',
    spark: 'text-teal-400',
    value: 'text-teal-100',
    glow: 'bg-teal-500/25',
  },
  'water-stress': {
    icon: 'text-cyan-300',
    iconBg: 'bg-cyan-500/25 ring-1 ring-cyan-400/40',
    cardBg: 'bg-cyan-500/[0.07]',
    border: 'border-cyan-400/35',
    spark: 'text-cyan-400',
    value: 'text-cyan-100',
    glow: 'bg-cyan-500/25',
  },
  'sea-level': {
    icon: 'text-indigo-300',
    iconBg: 'bg-indigo-500/25 ring-1 ring-indigo-400/40',
    cardBg: 'bg-indigo-500/[0.07]',
    border: 'border-indigo-400/35',
    spark: 'text-indigo-400',
    value: 'text-indigo-100',
    glow: 'bg-indigo-500/25',
  },
  population: {
    icon: 'text-violet-300',
    iconBg: 'bg-violet-500/25 ring-1 ring-violet-400/40',
    cardBg: 'bg-violet-500/[0.07]',
    border: 'border-violet-400/35',
    spark: 'text-violet-400',
    value: 'text-violet-100',
    glow: 'bg-violet-500/25',
  },
  'urban-expansion': {
    icon: 'text-fuchsia-300',
    iconBg: 'bg-fuchsia-500/25 ring-1 ring-fuchsia-400/40',
    cardBg: 'bg-fuchsia-500/[0.07]',
    border: 'border-fuchsia-400/35',
    spark: 'text-fuchsia-400',
    value: 'text-fuchsia-100',
    glow: 'bg-fuchsia-500/25',
  },
};

export const DEFAULT_METRIC_THEME: MetricTheme = {
  icon: 'text-accent',
  iconBg: 'bg-accent/20 ring-1 ring-accent/40',
  cardBg: 'bg-accent/[0.06]',
  border: 'border-accent/35',
  spark: 'text-accent',
  value: 'text-white',
  glow: 'bg-accent/20',
};

export function getMetricTheme(metricId: string): MetricTheme {
  return METRIC_THEMES[metricId] ?? DEFAULT_METRIC_THEME;
}

export const CATEGORY_STYLES: Record<
  MetricCategory,
  { accent: string; border: string; bg: string; dot: string }
> = {
  climate: {
    accent: 'text-sky-300',
    border: 'border-sky-400/40',
    bg: 'bg-sky-500/10',
    dot: 'bg-sky-400',
  },
  risk: {
    accent: 'text-orange-300',
    border: 'border-orange-400/40',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-400',
  },
  projection: {
    accent: 'text-violet-300',
    border: 'border-violet-400/40',
    bg: 'bg-violet-500/10',
    dot: 'bg-violet-400',
  },
};

export const RISK_PANEL_STYLES: Record<
  string,
  { bg: string; border: string; score: string; glow: string; bar: string }
> = {
  low: {
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-400/45',
    score: 'text-emerald-300',
    glow: 'shadow-[0_0_40px_-8px_rgba(52,211,153,0.45)]',
    bar: 'from-emerald-400 via-emerald-300 to-teal-300',
  },
  moderate: {
    bg: 'bg-amber-500/12',
    border: 'border-amber-400/45',
    score: 'text-amber-300',
    glow: 'shadow-[0_0_40px_-8px_rgba(251,191,36,0.45)]',
    bar: 'from-amber-400 via-orange-400 to-orange-300',
  },
  high: {
    bg: 'bg-orange-500/12',
    border: 'border-orange-400/45',
    score: 'text-orange-300',
    glow: 'shadow-[0_0_40px_-8px_rgba(251,146,60,0.5)]',
    bar: 'from-orange-400 via-red-400 to-red-400',
  },
  'very-high': {
    bg: 'bg-red-500/12',
    border: 'border-red-400/45',
    score: 'text-red-300',
    glow: 'shadow-[0_0_40px_-8px_rgba(248,113,113,0.55)]',
    bar: 'from-red-500 via-red-400 to-rose-300',
  },
};
