export type TimelineYear = 2025 | 2035 | 2050 | 2075 | 2100;

export type TrendDirection = 'up' | 'down' | 'stable';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';

export type DataSource = 'Open-Meteo' | 'NASA' | 'Copernicus' | 'IPCC' | 'CMIP6';

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  population?: number;
  coastal?: boolean;
  region: ClimateRegion;
}

export type ClimateRegion =
  | 'temperate'
  | 'mediterranean'
  | 'tropical'
  | 'continental'
  | 'arid'
  | 'oceanic'
  | 'subtropical';

export interface ClimateBaseline {
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  rainfall: number;
  heatwaveDays: number;
  airQualityIndex: number;
  humidity: number;
  heatwaveThreshold?: number;
}

export interface ClimateMetric {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  trend: TrendDirection;
  trendValue: string;
  confidence: ConfidenceLevel;
  riskLevel?: RiskLevel;
  source: DataSource;
  icon: string;
  description?: string;
}

export interface MapRiskZone {
  id: string;
  type: 'flood' | 'wildfire' | 'heat' | 'drought';
  lat: number;
  lng: number;
  radius: number;
  intensity: number;
  label: string;
}

export interface CityProjection {
  city: City;
  year: TimelineYear;
  baseline: ClimateBaseline;
  metrics: ClimateMetric[];
  riskZones: MapRiskZone[];
  summary: string;
  story: string;
}

export interface GeocodingResult {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population?: number;
}

export interface ComparisonData {
  cityA: CityProjection;
  cityB: CityProjection;
}

export const TIMELINE_YEARS: TimelineYear[] = [2025, 2035, 2050, 2075, 2100];

export const TIMELINE_LABELS: Record<TimelineYear, string> = {
  2025: 'Today',
  2035: '2035',
  2050: '2050',
  2075: '2075',
  2100: '2100',
};
