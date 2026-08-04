import type { CityVisualScenario } from '../types/visualization';
import { TIMELINE_YEARS } from '../types';

interface CacheEntry {
  imageUrl: string;
  provider: string;
  timestamp: string;
}

const cache = new Map<string, CacheEntry>();
const managedObjectUrls = new Set<string>();

/** Build a stable cache key from city, year, and scenario indicators */
export function buildImageCacheKey(
  cityId: string,
  year: number,
  scenario: CityVisualScenario
): string {
  const fingerprint = [
    scenario.temperatureChange.toFixed(1),
    scenario.floodRisk,
    scenario.wildfireRisk,
    scenario.droughtRisk,
    scenario.seaLevelRisk,
    scenario.rainfallTrend,
    scenario.season,
  ].join('|');

  return `${cityId}:${year}:${fingerprint}`;
}

export function getCachedImage(key: string): CacheEntry | undefined {
  return cache.get(key);
}

export function isAiCacheEntry(entry: CacheEntry): boolean {
  return (
    entry.provider === 'cloudflare' ||
    entry.provider === 'netlify-function' ||
    entry.imageUrl.startsWith('blob:')
  );
}

export function isUsableCacheEntry(entry: CacheEntry): boolean {
  return isAiCacheEntry(entry) || entry.provider === 'reference-photo';
}

/** Find the best AI cache entry for a city/year (handles scenario fingerprint drift). */
export function getCachedImageForCityYear(
  cityId: string,
  year: number
): CacheEntry | undefined {
  const prefix = `${cityId}:${year}:`;
  let best: CacheEntry | undefined;

  for (const [key, entry] of cache.entries()) {
    if (!key.startsWith(prefix) || !isUsableCacheEntry(entry)) continue;
    if (!best || entry.timestamp > best.timestamp) {
      best = entry;
    }
  }

  return best;
}

export function setCachedImage(key: string, imageUrl: string, provider: string): void {
  const existing = cache.get(key);
  if (existing?.imageUrl.startsWith('blob:')) {
    revokeObjectUrl(existing.imageUrl);
  }

  cache.set(key, {
    imageUrl,
    provider,
    timestamp: new Date().toISOString(),
  });

  if (imageUrl.startsWith('blob:')) {
    managedObjectUrls.add(imageUrl);
  }
}

export function countCachedForCity(cityId: string): number {
  return TIMELINE_YEARS.filter((y) => getCachedImageForCityYear(cityId, y)).length;
}

export function allTimelineYearsCachedForCity(cityId: string): boolean {
  return TIMELINE_YEARS.every((y) => Boolean(getCachedImageForCityYear(cityId, y)));
}

export function revokeObjectUrl(url: string): void {
  if (managedObjectUrls.has(url)) {
    URL.revokeObjectURL(url);
    managedObjectUrls.delete(url);
  }
}

export function clearImageCache(): void {
  for (const url of managedObjectUrls) {
    URL.revokeObjectURL(url);
  }
  managedObjectUrls.clear();
  cache.clear();
}
