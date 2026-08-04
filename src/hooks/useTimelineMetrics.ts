import { useState, useEffect } from 'react';
import type { City, ClimateMetric, TimelineYear } from '../types';
import { buildAllYearProjections } from '../services/cityProjectionBuilder';
import { useClimateScenario } from '../context/ClimateScenarioContext';

interface UseTimelineMetricsResult {
  timelineMetrics: Map<TimelineYear, ClimateMetric[]> | null;
  loading: boolean;
}

export function useTimelineMetrics(city: City | null): UseTimelineMetricsResult {
  const { scenarioId } = useClimateScenario();
  const [timelineMetrics, setTimelineMetrics] = useState<Map<TimelineYear, ClimateMetric[]> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setTimelineMetrics(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    buildAllYearProjections(city, scenarioId)
      .then((projections) => {
        if (cancelled) return;

        const map = new Map<TimelineYear, ClimateMetric[]>();
        for (const [year, projection] of projections) {
          map.set(year, projection.metrics);
        }
        setTimelineMetrics(map);
      })
      .catch(() => {
        if (!cancelled) setTimelineMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city?.id, scenarioId]);

  return { timelineMetrics, loading };
}
