import type { City } from '../types';
import { FEATURED_CITIES } from '../data/cities';

const STORAGE_PREFIX = 'afternow:city:';

export function storeCity(city: City): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${city.id}`, JSON.stringify(city));
  } catch {
    // sessionStorage unavailable — featured cities still work via id
  }
}

export function resolveCityById(cityId: string): City | null {
  const featured = FEATURED_CITIES.find((c) => c.id === cityId);
  if (featured) return featured;

  try {
    const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${cityId}`);
    if (stored) return JSON.parse(stored) as City;
  } catch {
    return null;
  }

  return null;
}

export function navigateToCity(city: City): { pathname: string; search: string } {
  storeCity(city);
  return { pathname: '/explore', search: `?city=${encodeURIComponent(city.id)}` };
}
