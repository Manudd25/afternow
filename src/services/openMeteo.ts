import type { ClimateRegion, GeocodingResult } from '../types';

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const CLIMATE_API = 'https://climate-api.open-meteo.com/v1/climate';

/** Daily max temp above this = one extreme heat day (regional WMO-style threshold) */
const HEATWAVE_THRESHOLDS: Record<ClimateRegion, number> = {
  temperate: 30,
  continental: 30,
  mediterranean: 35,
  tropical: 32,
  arid: 38,
  oceanic: 28,
  subtropical: 33,
};

const SCORCHING_THRESHOLD = 35;

export async function searchGeocoding(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const res = await fetch(`${GEOCODING_API}?${params}`);
  if (!res.ok) throw new Error('Geocoding request failed');

  const data = await res.json();
  return (data.results ?? []) as GeocodingResult[];
}

export interface OpenMeteoClimate {
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  rainfall: number;
  /** 1991–2020 average extreme heat days per year */
  heatwaveDays: number;
  /** 2015–2024 average extreme heat days per year (closer to present) */
  recentHeatwaveDays: number;
  /** 2015–2024 average days ≥35 °C (omega-block / record heat) */
  scorchingDaysRecent: number;
  heatwaveThreshold: number;
  humidity: number;
}

/** Fetch historical climate normals (1991–2020) plus recent window (2015–2024) */
export async function fetchClimateBaseline(
  lat: number,
  lng: number,
  region: ClimateRegion = 'temperate'
): Promise<OpenMeteoClimate> {
  const threshold = HEATWAVE_THRESHOLDS[region];

  try {
    const [historical, recent] = await Promise.all([
      fetchClimateWindow(lat, lng, '1991-01-01', '2020-12-31'),
      fetchClimateWindow(lat, lng, '2015-01-01', '2024-12-31'),
    ]);

    const heatwaveDays = computeHeatwaveDays(historical.maxTemps, threshold, 30);
    const recentHeatwaveDays = computeHeatwaveDays(recent.maxTemps, threshold, 10);
    const scorchingDaysRecent = computeHeatwaveDays(recent.maxTemps, SCORCHING_THRESHOLD, 10);

    const avgMax = average(historical.maxTemps);
    const avgMin = average(historical.minTemps);
    const avgTemp = (avgMax + avgMin) / 2;
    const totalRain = historical.precip.reduce((a, b) => a + b, 0);
    const annualRain = totalRain / 30;

    return {
      avgTemperature: round(avgTemp),
      maxTemperature: round(avgMax),
      minTemperature: round(avgMin),
      rainfall: round(annualRain),
      heatwaveDays: round(heatwaveDays),
      recentHeatwaveDays: round(recentHeatwaveDays),
      scorchingDaysRecent: round(scorchingDaysRecent, 1),
      heatwaveThreshold: threshold,
      humidity: estimateHumidity(lat, avgTemp),
    };
  } catch {
    return getFallbackClimate(lat, region);
  }
}

async function fetchClimateWindow(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<{ maxTemps: number[]; minTemps: number[]; precip: number[] }> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    start_date: startDate,
    end_date: endDate,
    models: 'EC_Earth3P_HR',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
  });

  const res = await fetch(`${CLIMATE_API}?${params}`);
  if (!res.ok) throw new Error('Climate API unavailable');

  const data = await res.json();
  const daily = data.daily;

  return {
    maxTemps: daily.temperature_2m_max ?? [],
    minTemps: daily.temperature_2m_min ?? [],
    precip: daily.precipitation_sum ?? [],
  };
}

function computeHeatwaveDays(
  maxTemps: number[],
  threshold: number,
  yearCount: number
): number {
  if (!maxTemps.length || !yearCount) return 0;

  const daysPerYear = maxTemps.length / yearCount;
  let total = 0;

  for (let y = 0; y < yearCount; y++) {
    const start = Math.floor(y * daysPerYear);
    const end = Math.floor((y + 1) * daysPerYear);
    total += maxTemps.slice(start, end).filter((t) => t > threshold).length;
  }

  return total / yearCount;
}

/** Fetch current conditions for live data enrichment */
export async function fetchCurrentWeather(lat: number, lng: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: 'temperature_2m,relative_humidity_2m,precipitation',
    timezone: 'auto',
  });

  try {
    const res = await fetch(`${WEATHER_API}?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getFallbackClimate(lat: number, region: ClimateRegion): OpenMeteoClimate {
  const absLat = Math.abs(lat);
  const baseTemp = 30 - absLat * 0.5;
  const threshold = HEATWAVE_THRESHOLDS[region];
  const heatwaveEstimate = Math.max(2, (baseTemp - threshold + 10) * 0.4);

  return {
    avgTemperature: round(baseTemp),
    maxTemperature: round(baseTemp + 8),
    minTemperature: round(baseTemp - 6),
    rainfall: round(800 - absLat * 10),
    heatwaveDays: round(heatwaveEstimate),
    recentHeatwaveDays: round(heatwaveEstimate * 1.4),
    scorchingDaysRecent: region === 'temperate' || region === 'continental' ? 1.5 : 0.5,
    heatwaveThreshold: threshold,
    humidity: estimateHumidity(lat, baseTemp),
  };
}

function estimateHumidity(lat: number, temp: number): number {
  const absLat = Math.abs(lat);
  if (absLat < 20) return 75;
  if (absLat < 35) return 55;
  if (temp > 25) return 45;
  return 65;
}

function average(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round(n: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
