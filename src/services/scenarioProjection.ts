import type { ClimateBaseline, TimelineYear } from '../types';
import {
  CLIMATE_SCENARIOS,
  DEFAULT_CLIMATE_SCENARIO_ID,
  type ClimateScenarioId,
} from '../config/climateScenarios';

const BASE_YEAR = 2025;

/** Scale a projected value relative to today's baseline — unchanged for present/historical years. */
export function scaleProjectedDelta(
  year: TimelineYear,
  todayValue: number,
  projectedValue: number,
  multiplier: number
): number {
  if (year <= BASE_YEAR) return projectedValue;
  return todayValue + (projectedValue - todayValue) * multiplier;
}

export function applyClimateScenarioToBaseline(
  year: TimelineYear,
  todayBaseline: ClimateBaseline,
  projectedBaseline: ClimateBaseline,
  scenarioId: ClimateScenarioId = DEFAULT_CLIMATE_SCENARIO_ID
): ClimateBaseline {
  if (year <= BASE_YEAR) return projectedBaseline;

  const m = CLIMATE_SCENARIOS[scenarioId].multipliers;

  return {
    ...projectedBaseline,
    avgTemperature: round(
      scaleProjectedDelta(
        year,
        todayBaseline.avgTemperature,
        projectedBaseline.avgTemperature,
        m.temperatureMultiplier
      )
    ),
    maxTemperature: round(
      scaleProjectedDelta(
        year,
        todayBaseline.maxTemperature,
        projectedBaseline.maxTemperature,
        m.temperatureMultiplier
      )
    ),
    minTemperature: round(
      scaleProjectedDelta(
        year,
        todayBaseline.minTemperature,
        projectedBaseline.minTemperature,
        m.temperatureMultiplier
      )
    ),
    heatwaveDays: round(
      scaleProjectedDelta(
        year,
        todayBaseline.heatwaveDays,
        projectedBaseline.heatwaveDays,
        m.heatDayMultiplier
      )
    ),
    rainfall: round(
      scaleProjectedDelta(
        year,
        todayBaseline.rainfall,
        projectedBaseline.rainfall,
        m.waterAvailabilityMultiplier
      )
    ),
    airQualityIndex: round(
      scaleProjectedDelta(
        year,
        todayBaseline.airQualityIndex,
        projectedBaseline.airQualityIndex,
        m.airQualityMultiplier
      )
    ),
    humidity: round(
      scaleProjectedDelta(
        year,
        todayBaseline.humidity,
        projectedBaseline.humidity,
        m.waterAvailabilityMultiplier
      )
    ),
  };
}

export function applyClimateScenarioToRisk(
  year: TimelineYear,
  todayRisk: number,
  projectedRisk: number,
  scenarioId: ClimateScenarioId = DEFAULT_CLIMATE_SCENARIO_ID
): number {
  const multiplier = CLIMATE_SCENARIOS[scenarioId].multipliers.riskMultiplier;
  return round(scaleProjectedDelta(year, todayRisk, projectedRisk, multiplier));
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
