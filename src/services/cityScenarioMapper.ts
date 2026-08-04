import type { City, CityProjection, ClimateMetric, TimelineYear } from '../types';
import type { CityVisualScenario, VisualEffects } from '../types/visualization';
import type { ClimateScenarioDefinition } from '../config/climateScenarios';

const ARCHITECTURAL_IDENTITY: Record<string, string> = {
  berlin: 'Berlin architecture with Brandenburg Gate proportions, wide boulevards, mix of historic and modern buildings',
  rome: 'Roman architecture with terracotta rooftops, baroque churches, ancient ruins integrated into urban fabric',
  madrid: 'Madrid architecture with grand plazas, neoclassical facades, warm-toned stone buildings',
  amsterdam: 'Amsterdam canal houses with narrow gabled facades, brick construction, bicycle-friendly streets',
  tokyo: 'Tokyo skyline blending traditional temples with modern high-rises and dense urban corridors',
  sydney: 'Sydney harbour architecture mixing colonial sandstone with contemporary glass towers',
  stockholm: 'Stockholm waterfront with colorful Nordic buildings and clean Scandinavian design',
  london: 'London architecture with Victorian terraces, modern glass skyscrapers, and historic landmarks',
  'new-york': 'New York architecture with art deco towers, brownstones, and iconic Manhattan skyline',
  mumbai: 'Mumbai architecture with colonial-era buildings, dense residential blocks, and coastal promenades',
  cairo: 'Cairo architecture with Islamic geometric patterns, minarets, and sandstone-colored buildings',
};

const DEFAULT_IDENTITY =
  'Recognizable urban architecture preserving local building materials, street layout and cultural character';

function metricValue(metrics: ClimateMetric[], id: string): number {
  const m = metrics.find((x) => x.id === id);
  return m ? Number(m.value) : 0;
}

function inferSeason(avgTemp: number): CityVisualScenario['season'] {
  if (avgTemp >= 22) return 'summer';
  if (avgTemp >= 12) return 'spring';
  if (avgTemp >= 5) return 'autumn';
  return 'winter';
}

function rainfallTrend(
  projection: CityProjection,
  todayProjection: CityProjection
): CityVisualScenario['rainfallTrend'] {
  const delta = projection.baseline.rainfall - todayProjection.baseline.rainfall;
  if (delta > 30) return 'increasing';
  if (delta < -30) return 'decreasing';
  return 'stable';
}

function buildAdaptationMeasures(
  city: City,
  year: TimelineYear,
  effects: VisualEffects,
  floodRisk: number,
  droughtRisk: number
): string[] {
  const measures: string[] = [];

  if (year > 2025) {
    if (effects.urbanGreenery > 0.2) measures.push('expanded urban tree canopy');
    if (effects.shadedPedestrianAreas > 0.2) measures.push('shaded pedestrian walkways and pergolas');
    if (effects.reflectiveRoofs > 0.2) measures.push('reflective and green roof installations');
    if (effects.sustainableTransit > 0.2) measures.push('electric buses and expanded cycling infrastructure');
  }

  if (floodRisk > 30) {
    measures.push('water-retention gardens and permeable paving');
    if (city.coastal || floodRisk > 50) measures.push('flood barriers and elevated walkways');
  }

  if (droughtRisk > 35) {
    measures.push('drought-resistant landscaping and rainwater harvesting');
  }

  if (city.coastal && effects.coastalAdaptation > 0.2) {
    measures.push('coastal wetlands restoration and seawall reinforcement');
  }

  if (effects.wildfireHaze > 0.15 && year > 2035) {
    measures.push('wildfire buffer zones and improved air filtration in public buildings');
  }

  if (year === 2025) {
    measures.push('current urban conditions based on present-day observations');
  }

  return measures;
}

function computeEffects(
  city: City,
  year: TimelineYear,
  projection: CityProjection,
  todayProjection: CityProjection,
  floodRisk: number,
  wildfireRisk: number,
  droughtRisk: number,
  seaLevelRisk: number,
  climateScenario?: ClimateScenarioDefinition
): VisualEffects {
  const yearProgress = Math.max(0, (year - 2025) / 75);
  const tempDelta = projection.baseline.avgTemperature - todayProjection.baseline.avgTemperature;
  const heatNorm = Math.min(1, Math.max(0, tempDelta / 4));
  const heatwaveNorm = Math.min(1, projection.baseline.heatwaveDays / 40);

  const isFuture = year > 2025;
  const multipliers = climateScenario?.multipliers;
  const heatwaveMult = isFuture ? (multipliers?.heatwaveMultiplier ?? 1) : 1;
  const vegetationMult = isFuture ? (multipliers?.vegetationMultiplier ?? 1) : 1;
  const airQualityMult = isFuture ? (multipliers?.airQualityMultiplier ?? 1) : 1;
  const waterMult = isFuture ? (multipliers?.waterAvailabilityMultiplier ?? 1) : 1;

  // Adaptation increases with time — hopeful, not dystopian
  const adaptation = Math.min(1, yearProgress * 1.2);

  const baseVegetation = Math.max(0.15, Math.min(1, 0.5 + adaptation * 0.4 - droughtRisk / 200));
  const baseHeatIntensity = Math.min(0.65, heatNorm * 0.5 + heatwaveNorm * 0.3);
  const baseWildfireHaze = Math.min(0.45, wildfireRisk / 220);
  const baseDrought = Math.min(0.55, droughtRisk / 180);

  return {
    vegetationDensity: Math.max(0.1, Math.min(1, baseVegetation * vegetationMult)),
    urbanGreenery: Math.min(1, (adaptation * 0.8 + (year > 2035 ? 0.15 : 0)) * vegetationMult),
    heatIntensity: Math.min(0.85, baseHeatIntensity * heatwaveMult),
    droughtDryness: Math.min(0.75, baseDrought * (2 - waterMult)),
    wildfireHaze: Math.min(0.65, baseWildfireHaze * airQualityMult),
    waterLevel: Math.min(0.6, (floodRisk / 200 + seaLevelRisk / 250) * (2 - waterMult)),
    floodInfrastructure: floodRisk > 25 || seaLevelRisk > 20 ? Math.min(0.7, adaptation * 0.6 + floodRisk / 300) : 0,
    reflectiveRoofs: year > 2035 ? Math.min(0.6, adaptation * 0.5) : 0,
    shadedPedestrianAreas: year > 2035 ? Math.min(0.65, adaptation * 0.55 + heatNorm * 0.2) : 0,
    sustainableTransit: year > 2035 ? Math.min(0.5, adaptation * 0.45) : 0.1,
    coastalAdaptation: city.coastal ? Math.min(0.7, adaptation * 0.5 + seaLevelRisk / 300) : 0,
    yearProgress,
  };
}

export function mapCityScenario(
  city: City,
  year: TimelineYear,
  projection: CityProjection,
  todayProjection: CityProjection,
  climateScenario?: ClimateScenarioDefinition
): CityVisualScenario {
  const floodRisk = metricValue(projection.metrics, 'flood');
  const wildfireRisk = metricValue(projection.metrics, 'wildfire');
  const droughtRisk =
    metricValue(projection.metrics, 'drought') ||
    metricValue(projection.metrics, 'water-stress');
  const seaLevelRisk = city.coastal ? metricValue(projection.metrics, 'sea-level') : 0;
  const tempChange = projection.baseline.avgTemperature - todayProjection.baseline.avgTemperature;

  const effects = computeEffects(
    city,
    year,
    projection,
    todayProjection,
    floodRisk,
    wildfireRisk,
    droughtRisk,
    seaLevelRisk,
    climateScenario
  );

  const adaptationMeasures = buildAdaptationMeasures(city, year, effects, floodRisk, droughtRisk);

  const cityKey = city.id.split('-')[0];
  const architecturalIdentity =
    ARCHITECTURAL_IDENTITY[cityKey] ??
    ARCHITECTURAL_IDENTITY[city.name.toLowerCase()] ??
    `${city.name} ${DEFAULT_IDENTITY}`;

  return {
    year,
    season: inferSeason(projection.baseline.avgTemperature),
    temperatureChange: tempChange,
    heatwaveFrequency: projection.baseline.heatwaveDays,
    rainfallTrend: rainfallTrend(projection, todayProjection),
    floodRisk,
    wildfireRisk,
    droughtRisk,
    seaLevelRisk,
    effects,
    adaptationMeasures,
    architecturalIdentity,
    assumptions: [
      climateScenario
        ? `${climateScenario.emoji} ${climateScenario.label} emissions pathway (illustrative, IPCC-inspired)`
        : 'IPCC AR6 SSP2-4.5 intermediate emission scenario',
      'Gradual urban climate adaptation without catastrophic disruption',
      'Preservation of recognizable architectural identity',
      year === 2025 ? 'Present-day baseline from Open-Meteo climate normals' : `Projected conditions for ${year}`,
    ],
    sources: ['Open-Meteo', 'IPCC', 'Copernicus', 'NASA'],
  };
}
