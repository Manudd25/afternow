import type {
  City,
  ClimateBaseline,
  ClimateMetric,
  MapRiskZone,
  TimelineYear,
  RiskLevel,
  ConfidenceLevel,
} from '../types';
import type { ClimateScenarioId } from '../config/climateScenarios';
import { DEFAULT_CLIMATE_SCENARIO_ID } from '../config/climateScenarios';
import { applyClimateScenarioToRisk } from './scenarioProjection';
import type { OpenMeteoClimate } from './openMeteo';

const BASE_YEAR = 2025;

/**
 * CMIP6 runs under-count recent European heat (2022–2025 omega blocks).
 * Present-day floors reflect observed ≥30 °C frequency in the 2020s.
 */
const RECENT_HEAT_CALIBRATION: Record<City['region'], number> = {
  temperate: 2.5,
  continental: 2.3,
  mediterranean: 1.8,
  tropical: 1.4,
  arid: 1.3,
  oceanic: 2.0,
  subtropical: 1.6,
};

/** Minimum extreme-heat days for "Today" — anchored to 2020s observations, not 1991–2020 */
const PRESENT_HEAT_FLOOR: Record<City['region'], number> = {
  temperate: 12,
  continental: 14,
  mediterranean: 22,
  tropical: 18,
  arid: 35,
  oceanic: 8,
  subtropical: 16,
};

/**
 * Extra ≥threshold days added per decade — extremes grow faster than mean temperature
 * (IPCC AR6 Central Europe, SSP2-4.5 tail behaviour).
 */
const HEAT_DAYS_PER_DECADE: Record<City['region'], number> = {
  temperate: 10,
  continental: 12,
  mediterranean: 15,
  tropical: 7,
  arid: 9,
  oceanic: 6,
  subtropical: 11,
};

const MAX_HEAT_DAYS: Record<City['region'], number> = {
  temperate: 95,
  continental: 100,
  mediterranean: 130,
  tropical: 120,
  arid: 180,
  oceanic: 70,
  subtropical: 110,
};

function projectHeatwaveDays(
  city: City,
  decades: number,
  raw: OpenMeteoClimate
): number {
  const dataPresent =
    (raw.recentHeatwaveDays || raw.heatwaveDays) * RECENT_HEAT_CALIBRATION[city.region];
  const presentBase = Math.max(dataPresent, PRESENT_HEAT_FLOOR[city.region]);

  // Quadratic acceleration — heat extremes widen faster than averages
  const acceleration = 1 + decades * 0.15;
  const added = HEAT_DAYS_PER_DECADE[city.region] * decades * acceleration;

  return Math.min(MAX_HEAT_DAYS[city.region], presentBase + added);
}

/** Regional climate sensitivity factors based on IPCC AR6 regional assessments */
const REGION_FACTORS: Record<
  City['region'],
  {
    tempPerDecade: number;
    rainChangePerDecade: number;
    heatwaveMultiplier: number;
    wildfireBase: number;
    floodBase: number;
    droughtBase: number;
    waterStressBase: number;
  }
> = {
  temperate: { tempPerDecade: 0.25, rainChangePerDecade: 0.02, heatwaveMultiplier: 1.15, wildfireBase: 15, floodBase: 25, droughtBase: 10, waterStressBase: 20 },
  mediterranean: { tempPerDecade: 0.35, rainChangePerDecade: -0.03, heatwaveMultiplier: 1.25, wildfireBase: 45, floodBase: 30, droughtBase: 40, waterStressBase: 50 },
  tropical: { tempPerDecade: 0.2, rainChangePerDecade: 0.04, heatwaveMultiplier: 1.1, wildfireBase: 20, floodBase: 55, droughtBase: 15, waterStressBase: 35 },
  continental: { tempPerDecade: 0.4, rainChangePerDecade: 0.01, heatwaveMultiplier: 1.2, wildfireBase: 25, floodBase: 20, droughtBase: 20, waterStressBase: 25 },
  arid: { tempPerDecade: 0.45, rainChangePerDecade: -0.02, heatwaveMultiplier: 1.3, wildfireBase: 15, floodBase: 10, droughtBase: 60, waterStressBase: 70 },
  oceanic: { tempPerDecade: 0.2, rainChangePerDecade: 0.03, heatwaveMultiplier: 1.12, wildfireBase: 10, floodBase: 35, droughtBase: 5, waterStressBase: 15 },
  subtropical: { tempPerDecade: 0.3, rainChangePerDecade: 0.01, heatwaveMultiplier: 1.18, wildfireBase: 30, floodBase: 40, droughtBase: 25, waterStressBase: 30 },
};

export function projectClimate(
  city: City,
  year: TimelineYear,
  raw: OpenMeteoClimate
): ClimateBaseline {
  const decades = (year - BASE_YEAR) / 10;
  const f = REGION_FACTORS[city.region];

  const tempDelta = f.tempPerDecade * decades;
  const rainMultiplier = 1 + f.rainChangePerDecade * decades;

  return {
    avgTemperature: round(raw.avgTemperature + tempDelta),
    maxTemperature: round(raw.maxTemperature + tempDelta * 1.3),
    minTemperature: round(raw.minTemperature + tempDelta * 0.7),
    rainfall: round(Math.max(100, raw.rainfall * rainMultiplier)),
    heatwaveDays: round(projectHeatwaveDays(city, decades, raw)),
    heatwaveThreshold: raw.heatwaveThreshold,
    airQualityIndex: projectAirQuality(city, decades),
    humidity: round(Math.max(20, raw.humidity - decades * 1.5)),
  };
}

interface RawRiskScores {
  flood: number;
  wildfire: number;
  seaLevel: number;
  waterStress: number;
  drought: number;
}

function computeRawRiskScores(
  city: City,
  year: TimelineYear,
  baseline: ClimateBaseline
): RawRiskScores {
  const decades = (year - BASE_YEAR) / 10;
  const f = REGION_FACTORS[city.region];

  return {
    flood: clamp(f.floodBase + (city.coastal ? 15 : 0) + decades * 3, 0, 100),
    wildfire: clamp(
      f.wildfireBase + decades * 4 + (baseline.avgTemperature > 25 ? 10 : 0),
      0,
      100
    ),
    seaLevel: city.coastal ? clamp(20 + decades * 8, 0, 100) : 0,
    waterStress: clamp(
      f.waterStressBase + decades * 3 - (baseline.rainfall > 600 ? 5 : 0),
      0,
      100
    ),
    drought: clamp(f.droughtBase + decades * 3 - baseline.rainfall / 50, 0, 100),
  };
}

export function buildMetrics(
  city: City,
  year: TimelineYear,
  baseline: ClimateBaseline,
  todayBaseline: ClimateBaseline,
  scenarioId: ClimateScenarioId = DEFAULT_CLIMATE_SCENARIO_ID
): ClimateMetric[] {
  const decades = (year - BASE_YEAR) / 10;
  const f = REGION_FACTORS[city.region];
  const tempDelta = baseline.avgTemperature - todayBaseline.avgTemperature;
  const heatDelta = baseline.heatwaveDays - todayBaseline.heatwaveDays;
  const heatThreshold = baseline.heatwaveThreshold ?? 30;

  const rawRisks = computeRawRiskScores(city, year, baseline);
  const todayRisks = computeRawRiskScores(city, 2025, todayBaseline);

  const floodRisk = applyClimateScenarioToRisk(year, todayRisks.flood, rawRisks.flood, scenarioId);
  const wildfireRisk = applyClimateScenarioToRisk(
    year,
    todayRisks.wildfire,
    rawRisks.wildfire,
    scenarioId
  );
  const seaLevelRisk = applyClimateScenarioToRisk(
    year,
    todayRisks.seaLevel,
    rawRisks.seaLevel,
    scenarioId
  );
  const waterStress = applyClimateScenarioToRisk(
    year,
    todayRisks.waterStress,
    rawRisks.waterStress,
    scenarioId
  );
  const droughtRisk = applyClimateScenarioToRisk(
    year,
    todayRisks.drought,
    rawRisks.drought,
    scenarioId
  );

  const metrics: ClimateMetric[] = [
    {
      id: 'temperature',
      label: 'Average Temperature',
      value: baseline.avgTemperature,
      unit: '°C',
      trend: tempDelta > 0.1 ? 'up' : tempDelta < -0.1 ? 'down' : 'stable',
      trendValue: tempDelta > 0 ? `+${round(tempDelta)}°C` : `${round(tempDelta)}°C`,
      confidence: confidenceForYear(year),
      source: 'IPCC',
      icon: 'thermometer',
    },
    {
      id: 'heatwaves',
      label: `Extreme Heat Days (≥${heatThreshold}°C)`,
      value: Math.round(baseline.heatwaveDays),
      unit: 'days/yr',
      trend: heatDelta > 0.5 ? 'up' : heatDelta < -0.5 ? 'down' : 'stable',
      trendValue:
        heatDelta > 0
          ? `+${Math.round(heatDelta)} days`
          : heatDelta < 0
            ? `${Math.round(heatDelta)} days`
            : 'Similar to today',
      confidence: confidenceForYear(year),
      riskLevel: riskFromScore(baseline.heatwaveDays * 3),
      source: 'Copernicus',
      icon: 'sun',
      description:
        heatThreshold < 35
          ? `Days above ${heatThreshold}°C per year. Present day reflects 2020s summers; future years use accelerated tail-risk growth (omega-block patterns, 40°C+ peaks).`
          : undefined,
    },
    {
      id: 'rainfall',
      label: 'Annual Rainfall',
      value: Math.round(baseline.rainfall),
      unit: 'mm',
      trend:
        baseline.rainfall > todayBaseline.rainfall
          ? 'up'
          : baseline.rainfall < todayBaseline.rainfall
            ? 'down'
            : 'stable',
      trendValue: `${baseline.rainfall > todayBaseline.rainfall ? '+' : ''}${Math.round(baseline.rainfall - todayBaseline.rainfall)} mm`,
      confidence: confidenceForYear(year),
      source: 'Open-Meteo',
      icon: 'cloud-rain',
    },
    {
      id: 'flood',
      label: 'Flood Risk',
      value: Math.round(floodRisk),
      unit: '%',
      trend: floodRisk > f.floodBase ? 'up' : 'stable',
      trendValue: riskLabel(floodRisk),
      confidence: confidenceForYear(year),
      riskLevel: riskFromScore(floodRisk),
      source: 'NASA',
      icon: 'waves',
    },
    {
      id: 'wildfire',
      label: 'Wildfire Risk',
      value: Math.round(wildfireRisk),
      unit: '%',
      trend: wildfireRisk > f.wildfireBase ? 'up' : 'stable',
      trendValue: riskLabel(wildfireRisk),
      confidence: confidenceForYear(year),
      riskLevel: riskFromScore(wildfireRisk),
      source: 'Copernicus',
      icon: 'flame',
    },
    {
      id: 'drought',
      label: 'Drought Risk',
      value: Math.round(droughtRisk),
      unit: '%',
      trend: droughtRisk > f.droughtBase ? 'up' : 'stable',
      trendValue: riskLabel(droughtRisk),
      confidence: confidenceForYear(year),
      riskLevel: riskFromScore(droughtRisk),
      source: 'NASA',
      icon: 'cloud-off',
    },
    {
      id: 'air-quality',
      label: 'Air Quality Index',
      value: Math.round(baseline.airQualityIndex),
      unit: 'AQI',
      trend: baseline.airQualityIndex > 50 ? 'up' : 'down',
      trendValue: baseline.airQualityIndex <= 50 ? 'Good' : baseline.airQualityIndex <= 100 ? 'Moderate' : 'Poor',
      confidence: confidenceForYear(year),
      source: 'Copernicus',
      icon: 'wind',
    },
    {
      id: 'water-stress',
      label: 'Water Stress',
      value: Math.round(waterStress),
      unit: '%',
      trend: waterStress > f.waterStressBase ? 'up' : 'stable',
      trendValue: riskLabel(waterStress),
      confidence: confidenceForYear(year),
      riskLevel: riskFromScore(waterStress),
      source: 'NASA',
      icon: 'droplets',
    },
  ];

  if (city.coastal) {
    metrics.splice(5, 0, {
      id: 'sea-level',
      label: 'Sea Level Risk',
      value: Math.round(seaLevelRisk),
      unit: '%',
      trend: 'up',
      trendValue: riskLabel(seaLevelRisk),
      confidence: confidenceForYear(year),
      riskLevel: riskFromScore(seaLevelRisk),
      source: 'NASA',
      icon: 'anchor',
    });
  }

  if (year >= 2035) {
    metrics.push(
      {
        id: 'population',
        label: 'Population Growth',
        value: `+${Math.round(decades * 4)}`,
        unit: '%',
        trend: 'up',
        trendValue: 'Projected',
        confidence: 'low',
        source: 'IPCC',
        icon: 'users',
      },
      {
        id: 'urban-expansion',
        label: 'Urban Expansion',
        value: `+${Math.round(decades * 6)}`,
        unit: '%',
        trend: 'up',
        trendValue: 'Projected',
        confidence: 'low',
        source: 'IPCC',
        icon: 'building',
      }
    );
  }

  return metrics;
}

export function buildRiskZones(
  city: City,
  year: TimelineYear,
  metrics: ClimateMetric[]
): MapRiskZone[] {
  const zones: MapRiskZone[] = [];
  const decades = (year - BASE_YEAR) / 10;
  const spread = 0.02 + decades * 0.005;

  const flood = metrics.find((m) => m.id === 'flood');
  const wildfire = metrics.find((m) => m.id === 'wildfire');
  const heat = metrics.find((m) => m.id === 'heatwaves');
  const water = metrics.find((m) => m.id === 'water-stress');

  if (flood && Number(flood.value) > 20) {
    zones.push({
      id: 'flood-1',
      type: 'flood',
      lat: city.lat - spread,
      lng: city.lng + spread * 0.5,
      radius: 800 + decades * 200,
      intensity: Number(flood.value) / 100,
      label: 'Flood-prone area',
    });
  }

  if (wildfire && Number(wildfire.value) > 25) {
    zones.push({
      id: 'wildfire-1',
      type: 'wildfire',
      lat: city.lat + spread,
      lng: city.lng - spread,
      radius: 1200 + decades * 300,
      intensity: Number(wildfire.value) / 100,
      label: 'Wildfire risk zone',
    });
  }

  if (heat && Number(heat.value) > 5) {
    zones.push({
      id: 'heat-1',
      type: 'heat',
      lat: city.lat,
      lng: city.lng,
      radius: 1500 + decades * 400,
      intensity: Math.min(1, Number(heat.value) / 30),
      label: 'Urban heat island',
    });
  }

  if (water && Number(water.value) > 30) {
    zones.push({
      id: 'drought-1',
      type: 'drought',
      lat: city.lat + spread * 0.7,
      lng: city.lng + spread * 0.7,
      radius: 2000 + decades * 500,
      intensity: Number(water.value) / 100,
      label: 'Water stress region',
    });
  }

  return zones;
}

function projectAirQuality(city: City, decades: number): number {
  const base = city.region === 'arid' ? 65 : city.region === 'tropical' ? 55 : 35;
  // Green transition improves air quality over time in most scenarios
  return round(Math.max(20, base + decades * 2 - decades * 3));
}

function confidenceForYear(year: TimelineYear): ConfidenceLevel {
  if (year <= 2035) return 'high';
  if (year <= 2050) return 'medium';
  return 'low';
}

function riskFromScore(score: number): RiskLevel {
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'very-high';
}

function riskLabel(score: number): string {
  return riskFromScore(score).replace('-', ' ');
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
