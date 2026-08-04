import type { City, TimelineYear } from '../types';
import { TIMELINE_YEARS } from '../types';

/** Bundled present-day photos — reliable local assets for the "Today" baseline */
const PRESENT_DAY_PHOTOS: Record<string, string> = {
  berlin: '/images/cities/photos/berlin.jpg',
  rome: '/images/cities/photos/rome.jpg',
};

export function getPresentDayPhotoUrl(cityId: string, cityName?: string): string | null {
  const key = cityId.split('-')[0];
  return (
    PRESENT_DAY_PHOTOS[key] ??
    PRESENT_DAY_PHOTOS[cityName?.toLowerCase() ?? ''] ??
    null
  );
}

export function hasPresentDayPhoto(city: City): boolean {
  return getPresentDayPhotoUrl(city.id, city.name) !== null;
}

/** Cities with a reference photo skip AI for 2025; others get all 5 timeline years */
export function getAiGenerationYears(city: City): TimelineYear[] {
  if (hasPresentDayPhoto(city)) {
    return TIMELINE_YEARS.filter((y) => y !== 2025);
  }
  return [...TIMELINE_YEARS];
}

export function getAiGenerationCount(city: City): number {
  return getAiGenerationYears(city).length;
}
