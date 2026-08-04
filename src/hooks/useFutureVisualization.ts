import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { City, CityProjection, TimelineYear } from '../types';
import { TIMELINE_YEARS, TIMELINE_LABELS } from '../types';
import type { CityVisualizationPair, VisualizationViewMode } from '../types/visualization';
import { mapCityScenario } from '../services/cityScenarioMapper';
import { buildVisualizationPrompt } from '../services/visualizationPromptBuilder';
import { buildAllYearProjections } from '../services/cityProjectionBuilder';
import { useClimateScenario } from '../context/ClimateScenarioContext';
import { getPresentDayPhotoUrl, getAiGenerationYears, hasPresentDayPhoto } from '../services/cityPresentDayPhotos';
import {
  getMockImage,
  generateCloudflareImage,
  isAiGenerationEnabled,
  canAttemptGeneration,
  getGenerationCooldownRemainingMs,
  markGenerationAttempt,
} from '../services/futureImageProvider';
import {
  buildImageCacheKey,
  getCachedImageForCityYear,
  setCachedImage,
  countCachedForCity,
  allTimelineYearsCachedForCity,
  isAiCacheEntry,
} from '../services/imageGenerationCache';

interface UseFutureVisualizationOptions {
  city: City;
  year: TimelineYear;
  projection: CityProjection | null;
  todayProjection: CityProjection | null;
}

export interface GenerationProgress {
  current: number;
  total: number;
  year: TimelineYear;
  label: string;
}

interface UseFutureVisualizationResult {
  visualization: CityVisualizationPair | null;
  scenario: ReturnType<typeof mapCityScenario> | null;
  mockLoading: boolean;
  aiGenerating: boolean;
  isAiGenerated: boolean;
  fallbackMessage: string | null;
  generationProgress: GenerationProgress | null;
  cachedYearsCount: number;
  allYearsCached: boolean;
  allFutureAiCached: boolean;
  aiGenerationCount: number;
  hasPresentDayPhoto: boolean;
  viewMode: VisualizationViewMode;
  setViewMode: (mode: VisualizationViewMode) => void;
  generateAiVisualization: () => Promise<void>;
  canGenerateAi: boolean;
  cooldownRemainingMs: number;
  aiGenerationEnabled: boolean;
}

function isAiCachedForCityYear(cityId: string, year: TimelineYear): boolean {
  const entry = getCachedImageForCityYear(cityId, year);
  return Boolean(entry && isAiCacheEntry(entry));
}

function applyCachedFuture<T extends { imageUrl: string; metadata: object }>(
  base: T,
  cached: { imageUrl: string; provider: string; timestamp: string }
): T {
  const isAi =
    cached.provider === 'cloudflare' || cached.provider === 'netlify-function';

  return {
    ...base,
    imageUrl: cached.imageUrl,
    metadata: {
      ...base.metadata,
      provider: cached.provider,
      isAiGenerated: isAi,
      timestamp: cached.timestamp,
    },
  } as T;
}

export function useFutureVisualization({
  city,
  year,
  projection,
  todayProjection,
}: UseFutureVisualizationOptions): UseFutureVisualizationResult {
  const { scenarioId, scenario: climateScenario } = useClimateScenario();
  const [visualization, setVisualization] = useState<CityVisualizationPair | null>(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [viewMode, setViewMode] = useState<VisualizationViewMode>('single');
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [cacheVersion, setCacheVersion] = useState(0);
  const aiGenerationEnabled = isAiGenerationEnabled();

  const projectionsReady =
    Boolean(projection) &&
    Boolean(todayProjection) &&
    projection!.city.id === city.id &&
    todayProjection!.city.id === city.id;

  const scenario = useMemo(() => {
    if (!projectionsReady || !projection || !todayProjection) return null;
    return mapCityScenario(city, year, projection, todayProjection, climateScenario);
  }, [city, year, projection, todayProjection, projectionsReady, climateScenario]);

  const todayScenario = useMemo(() => {
    if (!projectionsReady || !todayProjection) return null;
    return mapCityScenario(city, 2025, todayProjection, todayProjection, climateScenario);
  }, [city, todayProjection, projectionsReady, climateScenario]);

  const aiGenerationYears = useMemo(
    () => getAiGenerationYears(city),
    [city.id, city.name]
  );

  const cityHasPresentDayPhoto = useMemo(
    () => hasPresentDayPhoto(city),
    [city.id, city.name]
  );

  const cachedYearsCount = useMemo(() => {
    void cacheVersion;
    return countCachedForCity(city.id);
  }, [cacheVersion, city.id]);

  const allYearsCached = useMemo(() => {
    void cacheVersion;
    return allTimelineYearsCachedForCity(city.id);
  }, [cacheVersion, city.id]);

  const allFutureAiCached = useMemo(() => {
    void cacheVersion;
    return aiGenerationYears.every((y) => isAiCachedForCityYear(city.id, y));
  }, [cacheVersion, city.id, aiGenerationYears]);

  const cacheKey = useMemo(() => {
    if (!scenario) return null;
    return buildImageCacheKey(city.id, year, scenario);
  }, [city.id, year, scenario]);

  const presentCacheKey = useMemo(() => {
    if (!todayScenario) return null;
    return buildImageCacheKey(city.id, 2025, todayScenario);
  }, [city.id, todayScenario]);

  const loadMockRef = useRef(0);
  const batchAbortRef = useRef(false);
  const batchRunningRef = useRef(false);
  const autoBatchCityRef = useRef<string | null>(null);
  const yearRef = useRef(year);
  const cityRef = useRef(city);

  useEffect(() => {
    yearRef.current = year;
    cityRef.current = city;
  }, [year, city]);

  useEffect(() => {
    autoBatchCityRef.current = null;
    batchAbortRef.current = true;
    batchRunningRef.current = false;
    setAiGenerating(false);
    setGenerationProgress(null);
    setIsAiGenerated(false);
    setFallbackMessage(null);
    setVisualization(null);
  }, [city.id]);

  // Today: real reference photo where available (AI batch skips 2025)
  useEffect(() => {
    if (!todayScenario) return;
    const photo = getPresentDayPhotoUrl(city.id, city.name);
    if (!photo || getCachedImageForCityYear(city.id, 2025)) return;

    const key = buildImageCacheKey(city.id, 2025, todayScenario);
    setCachedImage(key, photo, 'reference-photo');
    setCacheVersion((v) => v + 1);
  }, [city.id, city.name, todayScenario]);

  // Update visualization when timeline/city changes — use cached AI if available
  useEffect(() => {
    if (!projectionsReady || !scenario || !todayScenario) {
      return;
    }

    const requestId = ++loadMockRef.current;
    let cancelled = false;

    async function loadVisualization() {
      setMockLoading(true);

      try {
        const prompt = buildVisualizationPrompt(city, scenario!, todayProjection!);
        const todayPrompt = buildVisualizationPrompt(city, todayScenario!, todayProjection!);

        const present = await getMockImage({
          city,
          year: 2025,
          scenario: todayScenario!,
          prompt: todayPrompt,
          projection: todayProjection!,
        });

        const future = await getMockImage({
          city,
          year,
          scenario: scenario!,
          prompt,
          projection: projection!,
        });

        if (cancelled || requestId !== loadMockRef.current) return;

        const cachedPresent = getCachedImageForCityYear(city.id, 2025);
        const cachedFuture = getCachedImageForCityYear(city.id, year);

        const presentResult = cachedPresent
          ? applyCachedFuture(present, cachedPresent)
          : present;

        const futureResult = cachedFuture
          ? applyCachedFuture(future, cachedFuture)
          : future;

        setVisualization({ present: presentResult, future: futureResult, prompt });
        setIsAiGenerated(Boolean(cachedFuture && isAiCacheEntry(cachedFuture)));
      } finally {
        if (!cancelled && requestId === loadMockRef.current) {
          setMockLoading(false);
        }
      }
    }

    loadVisualization();
    return () => {
      cancelled = true;
    };
  }, [
    city,
    year,
    projection,
    todayProjection,
    scenario,
    todayScenario,
    cacheKey,
    presentCacheKey,
    cacheVersion,
    projectionsReady,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownRemainingMs(getGenerationCooldownRemainingMs(city.id));
    }, 500);
    return () => clearInterval(interval);
  }, [city.id]);

  const handleGenerationError = useCallback((err: unknown) => {
    const code = err instanceof Error ? err.message : '';

    if (code === 'QUOTA_EXCEEDED') {
      setFallbackMessage(
        'Daily AI generation quota reached. Showing an illustrative scenario instead.'
      );
    } else if (code === 'TIMEOUT') {
      setFallbackMessage('AI generation timed out. Showing an illustrative scenario instead.');
    } else if (code === 'WORKER_NOT_CONFIGURED' || code === 'WORKER_UNREACHABLE') {
      setFallbackMessage(
        'AI image service is not configured on the server. Add Cloudflare credentials to your hosting environment, then redeploy.'
      );
    } else if (code === 'NOT_CONFIGURED' || code.toLowerCase().includes('not configured')) {
      setFallbackMessage(
        'AI generation is not configured in production. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Netlify environment variables, then redeploy.'
      );
    } else if (code === 'AUTH_FAILED' || code.toLowerCase().includes('authentication failed')) {
      setFallbackMessage(
        'AI image service authentication failed. Verify Workers AI permissions on the server.'
      );
    } else {
      setFallbackMessage(
        'Live AI generation is currently unavailable. Showing an illustrative scenario instead.'
      );
    }
  }, []);

  const runBatchGeneration = useCallback(async (): Promise<boolean> => {
    if (!projectionsReady || !aiGenerationEnabled || batchRunningRef.current) {
      return false;
    }

    batchRunningRef.current = true;
    batchAbortRef.current = false;
    const batchCityId = city.id;
    autoBatchCityRef.current = batchCityId;
    setAiGenerating(true);
    setFallbackMessage(null);
    markGenerationAttempt(batchCityId);

    try {
      const allProjections = await buildAllYearProjections(city, scenarioId);
      if (batchAbortRef.current || batchCityId !== cityRef.current.id) return false;

      const todayProj = allProjections.get(2025)!;
      const scenarioMap = new Map<TimelineYear, ReturnType<typeof mapCityScenario>>();

      for (const y of TIMELINE_YEARS) {
        const proj = allProjections.get(y)!;
        scenarioMap.set(y, mapCityScenario(city, y, proj, todayProj, climateScenario));
      }

      const toGenerate = aiGenerationYears.filter((y) => !isAiCachedForCityYear(city.id, y));

      if (toGenerate.length === 0) {
        setCacheVersion((v) => v + 1);
        setIsAiGenerated(true);
        return true;
      }

      let completed = aiGenerationYears.length - toGenerate.length;

      for (const y of toGenerate) {
        if (batchAbortRef.current || batchCityId !== cityRef.current.id) break;

        const proj = allProjections.get(y)!;
        const s = scenarioMap.get(y)!;
        const key = buildImageCacheKey(city.id, y, s);

        setGenerationProgress({
          current: completed + 1,
          total: aiGenerationYears.length,
          year: y,
          label: TIMELINE_LABELS[y],
        });

        const prompt = buildVisualizationPrompt(city, s, todayProj);

        const aiResult = await generateCloudflareImage(
          {
            city,
            year: y,
            scenario: s,
            prompt,
            projection: proj,
          },
          { skipCooldownMark: true }
        );

        if (batchAbortRef.current || batchCityId !== cityRef.current.id) break;

        setCachedImage(key, aiResult.imageUrl, 'cloudflare');
        completed++;
        setCacheVersion((v) => v + 1);

        const activeYear = yearRef.current;
        const includePresentUpdate = y === 2025 && !cityHasPresentDayPhoto;

        if (y === activeYear || includePresentUpdate) {
          setVisualization((prev) => {
            if (!prev) return prev;
            if (y === activeYear && y === 2025) {
              return { ...prev, present: aiResult, future: aiResult, prompt };
            }
            if (y === activeYear) {
              return { ...prev, future: aiResult, prompt };
            }
            return { ...prev, present: aiResult };
          });
          if (y === activeYear) {
            setIsAiGenerated(true);
          }
        }
      }

      setFallbackMessage(null);
      return true;
    } catch (err) {
      if (!batchAbortRef.current && batchCityId === cityRef.current.id) {
        autoBatchCityRef.current = null;
        handleGenerationError(err);
      }
      return false;
    } finally {
      batchRunningRef.current = false;
      setAiGenerating(false);
      setGenerationProgress(null);
      setCooldownRemainingMs(getGenerationCooldownRemainingMs(cityRef.current.id));
    }
  }, [projectionsReady, aiGenerationEnabled, city, cityHasPresentDayPhoto, aiGenerationYears, handleGenerationError, scenarioId, climateScenario]);

  const generateAiVisualization = useCallback(async () => {
    if (aiGenerating || !canAttemptGeneration(city.id)) return;
    await runBatchGeneration();
  }, [aiGenerating, runBatchGeneration, city.id]);

  return {
    visualization,
    scenario,
    mockLoading,
    aiGenerating,
    isAiGenerated,
    fallbackMessage,
    generationProgress,
    cachedYearsCount,
    allYearsCached,
    allFutureAiCached,
    aiGenerationCount: aiGenerationYears.length,
    hasPresentDayPhoto: cityHasPresentDayPhoto,
    viewMode,
    setViewMode,
    generateAiVisualization,
    canGenerateAi:
      aiGenerationEnabled &&
      !aiGenerating &&
      !mockLoading &&
      projectionsReady &&
      canAttemptGeneration(city.id) &&
      !allYearsCached,
    cooldownRemainingMs,
    aiGenerationEnabled,
  };
}
