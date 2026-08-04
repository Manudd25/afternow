import type { ClimateMetric, RiskLevel, TimelineYear } from '../types';
import { TIMELINE_YEARS } from '../types';

export type MetricCategory = 'climate' | 'risk' | 'projection';

const CATEGORY_MAP: Record<string, MetricCategory> = {
  temperature: 'climate',
  heatwaves: 'climate',
  rainfall: 'climate',
  'air-quality': 'climate',
  flood: 'risk',
  wildfire: 'risk',
  drought: 'risk',
  'sea-level': 'risk',
  'water-stress': 'risk',
  population: 'projection',
  'urban-expansion': 'projection',
};

const CATEGORY_LABELS: Record<MetricCategory, string> = {
  climate: 'Climate indicators',
  risk: 'Risk indicators',
  projection: 'Future projections',
};

export function getMetricCategory(id: string): MetricCategory {
  return CATEGORY_MAP[id] ?? 'climate';
}

export function getCategoryLabel(category: MetricCategory): string {
  return CATEGORY_LABELS[category];
}

export function parseMetricNumber(metric: ClimateMetric): number | null {
  if (typeof metric.value === 'number') return metric.value;
  const match = String(metric.value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function getTodayMetricValue(
  timelineMetrics: Map<TimelineYear, ClimateMetric[]> | null | undefined,
  metricId: string
): string | number | null {
  const metric = timelineMetrics?.get(2025)?.find((m) => m.id === metricId);
  return metric?.value ?? null;
}

export function formatMetricDisplay(value: string | number, unit: string): string {
  if (typeof value === 'number') {
    const decimals = value % 1 ? 1 : 0;
    return `${value.toLocaleString('en-US', { maximumFractionDigits: decimals })}${unit ? ` ${unit}` : ''}`;
  }
  return unit ? `${value} ${unit}` : String(value);
}

export function getMetricSparkline(
  timelineMetrics: Map<TimelineYear, ClimateMetric[]> | null | undefined,
  metricId: string
): number[] {
  if (!timelineMetrics) return [];

  return TIMELINE_YEARS.map((year) => {
    const metric = timelineMetrics.get(year)?.find((m) => m.id === metricId);
    return metric ? parseMetricNumber(metric) ?? 0 : 0;
  });
}

const RISK_LEVEL_SCORE: Record<RiskLevel, number> = {
  low: 25,
  moderate: 50,
  high: 75,
  'very-high': 100,
};

export function computeOverallRiskScore(metrics: ClimateMetric[]): number {
  const riskMetrics = metrics.filter((m) => m.riskLevel || m.unit === '%');
  if (riskMetrics.length === 0) return 0;

  const total = riskMetrics.reduce((sum, m) => {
    const numeric = parseMetricNumber(m);
    if (numeric !== null && m.unit === '%') return sum + numeric;
    if (m.riskLevel) return sum + RISK_LEVEL_SCORE[m.riskLevel];
    return sum;
  }, 0);

  return Math.round(total / riskMetrics.length);
}

export function countWorseningMetrics(metrics: ClimateMetric[]): number {
  return metrics.filter((m) => m.trend === 'up').length;
}

export function overallRiskLevel(score: number): RiskLevel {
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'very-high';
}
