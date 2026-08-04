import { useState, useEffect, useMemo, useCallback } from 'react';
import type { City, CityProjection, TimelineYear } from '../types';
import { fetchClimateBaseline } from '../services/openMeteo';
import type { OpenMeteoClimate } from '../services/openMeteo';
import { buildProjectionFromRaw } from '../services/cityProjectionBuilder';
import { useClimateScenario } from '../context/ClimateScenarioContext';

interface UseCityDataResult {
  projection: CityProjection | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCityData(city: City | null, year: TimelineYear): UseCityDataResult {
  const { scenarioId } = useClimateScenario();
  const [rawClimate, setRawClimate] = useState<OpenMeteoClimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchVersion, setFetchVersion] = useState(0);

  useEffect(() => {
    if (!city) {
      setRawClimate(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchClimateBaseline(city.lat, city.lng, city.region)
      .then((raw) => {
        if (!cancelled) setRawClimate(raw);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load city data');
          setRawClimate(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city?.id, city?.lat, city?.lng, city?.region, fetchVersion]);

  const projection = useMemo(() => {
    if (!city || !rawClimate) return null;
    return buildProjectionFromRaw(city, year, rawClimate, scenarioId);
  }, [city, year, rawClimate, scenarioId]);

  const refetch = useCallback(() => {
    setFetchVersion((v) => v + 1);
  }, []);

  return { projection, loading, error, refetch };
}
