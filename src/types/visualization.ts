import type { City, CityProjection, TimelineYear, DataSource } from './index';

export type VisualizationViewMode = 'single' | 'side-by-side' | 'comparison';

export type ImageGenerationStatus = 'ready' | 'generating' | 'fallback' | 'error';

export interface CityVisualScenario {
  year: TimelineYear;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  temperatureChange: number;
  heatwaveFrequency: number;
  rainfallTrend: 'increasing' | 'decreasing' | 'stable';
  floodRisk: number;
  wildfireRisk: number;
  droughtRisk: number;
  seaLevelRisk: number;
  /** 0–1 effect intensities for CSS overlays */
  effects: VisualEffects;
  adaptationMeasures: string[];
  architecturalIdentity: string;
  assumptions: string[];
  sources: DataSource[];
}

export interface VisualEffects {
  vegetationDensity: number;
  urbanGreenery: number;
  heatIntensity: number;
  droughtDryness: number;
  wildfireHaze: number;
  waterLevel: number;
  floodInfrastructure: number;
  reflectiveRoofs: number;
  shadedPedestrianAreas: number;
  sustainableTransit: number;
  coastalAdaptation: number;
  yearProgress: number;
}

export interface VisualizationPrompt {
  text: string;
  cityName: string;
  year: TimelineYear;
  season: string;
}

export interface FutureImageRequest {
  city: City;
  year: TimelineYear;
  scenario: CityVisualScenario;
  prompt: VisualizationPrompt;
  referenceImageUrl?: string;
  projection: CityProjection;
}

export interface FutureImageResult {
  imageUrl: string;
  status: ImageGenerationStatus;
  scenario: CityVisualScenario;
  prompt: VisualizationPrompt;
  metadata: FutureImageMetadata;
}

export interface FutureImageMetadata {
  provider: string;
  timestamp: string;
  sources: string[];
  assumptions: string[];
  isIllustrative: boolean;
  isAiGenerated?: boolean;
}

export interface FutureImageProvider {
  readonly name: string;
  getImage(request: FutureImageRequest): Promise<FutureImageResult>;
}

export interface CityVisualizationPair {
  present: FutureImageResult;
  future: FutureImageResult;
  prompt: VisualizationPrompt;
}
