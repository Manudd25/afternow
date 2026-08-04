import { useState, useMemo, useCallback } from 'react';
import type { City } from '../types';
import { FEATURED_CITIES, searchCities, cityFromGeocoding } from '../data/cities';
import { searchGeocoding } from '../services/openMeteo';

export function useCitySearch() {
  const [query, setQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);

  const localResults = useMemo(() => searchCities(query), [query]);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setRemoteResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchGeocoding(q);
      setRemoteResults(results.map(cityFromGeocoding));
    } catch {
      setRemoteResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const results = query.length >= 2
    ? [...localResults, ...remoteResults.filter(
        (r) => !localResults.some((l) => l.name === r.name && l.country === r.country)
      )]
    : FEATURED_CITIES;

  return { query, setQuery, search, results, searching, featuredCities: FEATURED_CITIES };
}
