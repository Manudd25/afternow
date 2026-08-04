import type { City, CityProjection } from '../types';
import type { CityVisualScenario, VisualizationPrompt } from '../types/visualization';
import { TIMELINE_LABELS } from '../types';

function describeTemperatureChange(delta: number): string {
  if (delta <= 0.2) return 'temperatures broadly similar to today';
  if (delta <= 1.5) return 'moderately warmer summers';
  if (delta <= 3) return 'noticeably warmer summers';
  return 'significantly warmer summers';
}

function describeHeatwaves(days: number, todayDays: number): string {
  const delta = days - todayDays;
  if (delta <= 1) return 'heatwave frequency similar to present levels';
  if (delta <= 5) return 'somewhat more frequent heatwaves';
  if (delta <= 12) return 'more frequent heatwaves';
  return ' notably more frequent heatwaves';
}

function describeRainfall(trend: CityVisualScenario['rainfallTrend']): string {
  switch (trend) {
    case 'increasing':
      return 'increasing rainfall with occasional heavy downpours';
    case 'decreasing':
      return 'a trend toward drier conditions';
    default:
      return 'relatively stable rainfall patterns';
  }
}

function describeRisk(label: string, value: number): string | null {
  if (value < 25) return null;
  if (value < 50) return `moderate ${label}`;
  if (value < 75) return `elevated ${label}`;
  return `significant ${label}`;
}

function describeAdaptation(measures: string[]): string {
  if (measures.length === 0) return '';
  const listed = measures.slice(0, 5).join(', ');
  return `Show ${listed}.`;
}

export function buildVisualizationPrompt(
  city: City,
  scenario: CityVisualScenario,
  todayProjection: CityProjection
): VisualizationPrompt {
  const yearLabel = scenario.year === 2025 ? 'the present day' : `${scenario.year}`;
  const seasonLabel = scenario.season;

  const tempDesc = describeTemperatureChange(scenario.temperatureChange);
  const heatDesc = describeHeatwaves(scenario.heatwaveFrequency, todayProjection.baseline.heatwaveDays);
  const rainDesc = describeRainfall(scenario.rainfallTrend);

  const risks = [
    describeRisk('flood risk', scenario.floodRisk),
    describeRisk('wildfire risk', scenario.wildfireRisk),
    describeRisk('drought risk', scenario.droughtRisk),
    scenario.seaLevelRisk > 20 ? describeRisk('sea-level risk', scenario.seaLevelRisk) : null,
  ].filter(Boolean);

  const riskSentence =
    risks.length > 0
      ? `The scenario indicates ${tempDesc}, ${heatDesc.replace(/^ /, '')} and ${risks.join(', ')}.`
      : `The scenario indicates ${tempDesc}, ${heatDesc.replace(/^ /, '')} and ${rainDesc}.`;

  const adaptationSentence = describeAdaptation(scenario.adaptationMeasures);

  const text = [
    `Create a realistic, documentary-style visualization of ${city.name} in the ${seasonLabel} of ${yearLabel}.`,
    `Preserve recognizable ${city.name} architecture and urban identity: ${scenario.architecturalIdentity}.`,
    riskSentence,
    adaptationSentence,
    'The image should appear scientifically plausible, calm and realistic rather than futuristic or dystopian.',
    'Use natural daylight, believable urban scale, and avoid exaggerated destruction or apocalyptic imagery.',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    text,
    cityName: city.name,
    year: scenario.year,
    season: seasonLabel,
  };
}

export function getYearDisplayLabel(year: number): string {
  return TIMELINE_LABELS[year as keyof typeof TIMELINE_LABELS] ?? String(year);
}
