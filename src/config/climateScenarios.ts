export type ClimateScenarioId = 'optimistic' | 'current-policies' | 'high-emissions';

export interface ClimateScenarioMultipliers {
  temperatureMultiplier: number;
  heatDayMultiplier: number;
  heatwaveMultiplier: number;
  vegetationMultiplier: number;
  waterAvailabilityMultiplier: number;
  airQualityMultiplier: number;
  riskMultiplier: number;
}

export interface ClimateScenarioDefinition {
  id: ClimateScenarioId;
  emoji: string;
  label: string;
  shortLabel: string;
  description: string;
  multipliers: ClimateScenarioMultipliers;
}

export const CLIMATE_SCENARIO_STORAGE_KEY = 'afternow-climate-scenario';

export const DEFAULT_CLIMATE_SCENARIO_ID: ClimateScenarioId = 'current-policies';

export const CLIMATE_SCENARIO_ORDER: ClimateScenarioId[] = [
  'optimistic',
  'current-policies',
  'high-emissions',
];

export const CLIMATE_SCENARIOS: Record<ClimateScenarioId, ClimateScenarioDefinition> = {
  optimistic: {
    id: 'optimistic',
    emoji: '🌱',
    label: 'Optimistic',
    shortLabel: 'Optimistic',
    description:
      'Strong global climate action significantly limits future warming and reduces the frequency of extreme heat events.',
    multipliers: {
      temperatureMultiplier: 0.75,
      heatDayMultiplier: 0.65,
      heatwaveMultiplier: 0.7,
      vegetationMultiplier: 1.15,
      waterAvailabilityMultiplier: 1.1,
      airQualityMultiplier: 0.85,
      riskMultiplier: 0.7,
    },
  },
  'current-policies': {
    id: 'current-policies',
    emoji: '🌍',
    label: 'Current Trajectory',
    shortLabel: 'Current Trajectory',
    description:
      "Future conditions based on today's global emissions trajectory continuing without major shifts.",
    multipliers: {
      temperatureMultiplier: 1.0,
      heatDayMultiplier: 1.0,
      heatwaveMultiplier: 1.0,
      vegetationMultiplier: 1.0,
      waterAvailabilityMultiplier: 1.0,
      airQualityMultiplier: 1.0,
      riskMultiplier: 1.0,
    },
  },
  'high-emissions': {
    id: 'high-emissions',
    emoji: '🔥',
    label: 'High Emissions',
    shortLabel: 'High Emissions',
    description:
      'Represents a future where greenhouse gas emissions remain high, leading to stronger warming and more frequent extreme weather.',
    multipliers: {
      temperatureMultiplier: 1.35,
      heatDayMultiplier: 1.5,
      heatwaveMultiplier: 1.6,
      vegetationMultiplier: 0.85,
      waterAvailabilityMultiplier: 0.8,
      airQualityMultiplier: 1.25,
      riskMultiplier: 1.35,
    },
  },
};

export function isClimateScenarioId(value: string | null): value is ClimateScenarioId {
  return value !== null && value in CLIMATE_SCENARIOS;
}

export function getClimateScenario(id: ClimateScenarioId): ClimateScenarioDefinition {
  return CLIMATE_SCENARIOS[id];
}
