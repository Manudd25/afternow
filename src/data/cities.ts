import type { City, ClimateRegion } from '../types';

/** Curated cities with climate region metadata for projection modeling */
export const FEATURED_CITIES: City[] = [
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    lat: 52.52,
    lng: 13.405,
    population: 3645000,
    coastal: false,
    region: 'temperate',
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    lat: 41.9028,
    lng: 12.4964,
    population: 2873000,
    coastal: false,
    region: 'mediterranean',
  },
  {
    id: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    lat: 40.4168,
    lng: -3.7038,
    population: 3223000,
    coastal: false,
    region: 'mediterranean',
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.3676,
    lng: 4.9041,
    population: 921000,
    coastal: true,
    region: 'oceanic',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    population: 13960000,
    coastal: true,
    region: 'subtropical',
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lng: 151.2093,
    population: 5312000,
    coastal: true,
    region: 'oceanic',
  },
  {
    id: 'stockholm',
    name: 'Stockholm',
    country: 'Sweden',
    lat: 59.3293,
    lng: 18.0686,
    population: 975000,
    coastal: true,
    region: 'temperate',
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    population: 8982000,
    coastal: true,
    region: 'oceanic',
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    lat: 40.7128,
    lng: -74.006,
    population: 8336000,
    coastal: true,
    region: 'continental',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    lat: 19.076,
    lng: 72.8777,
    population: 20411000,
    coastal: true,
    region: 'tropical',
  },
  {
    id: 'cairo',
    name: 'Cairo',
    country: 'Egypt',
    lat: 30.0444,
    lng: 31.2357,
    population: 10230000,
    coastal: false,
    region: 'arid',
  },
];

export function inferClimateRegion(lat: number, lng: number): ClimateRegion {
  const absLat = Math.abs(lat);

  if (absLat < 15) return 'tropical';
  if (absLat < 23.5) return 'subtropical';
  if (absLat > 55) return 'temperate';

  // Mediterranean belt
  if (absLat >= 30 && absLat <= 45 && lng >= -10 && lng <= 40) {
    return 'mediterranean';
  }

  // Arid regions
  if (absLat >= 15 && absLat <= 35 && ((lng >= -20 && lng <= 60) || (lng >= 100 && lng <= 140))) {
    return 'arid';
  }

  // Oceanic (western coasts mid-latitudes)
  if (absLat >= 40 && absLat <= 60 && lng >= -15 && lng <= 5) {
    return 'oceanic';
  }

  if (absLat >= 40 && absLat <= 55) return 'continental';
  return 'temperate';
}

export function cityFromGeocoding(
  result: { id: number; name: string; country: string; latitude: number; longitude: number; population?: number }
): City {
  return {
    id: `${result.name.toLowerCase().replace(/\s+/g, '-')}-${result.id}`,
    name: result.name,
    country: result.country,
    lat: result.latitude,
    lng: result.longitude,
    population: result.population,
    coastal: isCoastal(result.latitude, result.longitude),
    region: inferClimateRegion(result.latitude, result.longitude),
  };
}

/** Rough heuristic: within ~50km of a major coastline */
function isCoastal(lat: number, lng: number): boolean {
  const coastalChecks: [number, number, number][] = [
    [52.5, 4.5, 3],   // North Sea
    [41.0, 12.5, 2],  // Mediterranean
    [35.7, 139.7, 2], // Pacific Japan
    [-33.9, 151.2, 2],// Pacific Australia
    [40.7, -74.0, 2], // Atlantic US
    [51.5, 0.1, 2],   // Thames
    [19.1, 72.9, 2],  // Arabian Sea
  ];

  return coastalChecks.some(([cLat, cLng, threshold]) => {
    const dist = Math.sqrt((lat - cLat) ** 2 + (lng - cLng) ** 2);
    return dist < threshold;
  });
}

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return FEATURED_CITIES;

  return FEATURED_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
  );
}
