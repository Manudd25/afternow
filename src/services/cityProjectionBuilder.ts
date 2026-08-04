import type { City, CityProjection, TimelineYear } from '../types';
import { TIMELINE_YEARS } from '../types';
import type { ClimateScenarioId } from '../config/climateScenarios';
import { DEFAULT_CLIMATE_SCENARIO_ID, getClimateScenario } from '../config/climateScenarios';
import { fetchClimateBaseline } from './openMeteo';
import type { OpenMeteoClimate } from './openMeteo';
import { projectClimate, buildMetrics, buildRiskZones } from './projections';
import { applyClimateScenarioToBaseline } from './scenarioProjection';
import { generateSummary, generateStory } from './narrative';

export function buildProjectionFromRaw(
  city: City,
  year: TimelineYear,
  raw: OpenMeteoClimate,
  scenarioId: ClimateScenarioId = DEFAULT_CLIMATE_SCENARIO_ID
): CityProjection {
  const todayBaseline = projectClimate(city, 2025, raw);
  const neutralBaseline = projectClimate(city, year, raw);
  const baseline = applyClimateScenarioToBaseline(year, todayBaseline, neutralBaseline, scenarioId);
  const scenario = getClimateScenario(scenarioId);
  const metrics = buildMetrics(city, year, baseline, todayBaseline, scenarioId);
  const riskZones = buildRiskZones(city, year, metrics);

  return {
    city,
    year,
    baseline,
    metrics,
    riskZones,
    summary: generateSummary(city, year, baseline, todayBaseline, scenario),
    story: generateStory(city, year, baseline, scenario),
  };
}

/** Build a full city projection for a given year (single Open-Meteo fetch per call) */
export async function buildCityProjection(
  city: City,
  year: TimelineYear,
  scenarioId: ClimateScenarioId = DEFAULT_CLIMATE_SCENARIO_ID
): Promise<CityProjection> {
  const raw = await fetchClimateBaseline(city.lat, city.lng, city.region);
  return buildProjectionFromRaw(city, year, raw, scenarioId);
}

/** Build projections for every timeline year with one climate API fetch */
export async function buildAllYearProjections(
  city: City,
  scenarioId: ClimateScenarioId = DEFAULT_CLIMATE_SCENARIO_ID
): Promise<Map<TimelineYear, CityProjection>> {
  const raw = await fetchClimateBaseline(city.lat, city.lng, city.region);
  const map = new Map<TimelineYear, CityProjection>();

  for (const year of TIMELINE_YEARS) {
    map.set(year, buildProjectionFromRaw(city, year, raw, scenarioId));
  }

  return map;
}
