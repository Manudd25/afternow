import { useState, useCallback } from 'react';
import type { TimelineYear } from '../types';
import { TIMELINE_YEARS } from '../types';

export function useTimeline(initialYear: TimelineYear = 2025) {
  const [year, setYear] = useState<TimelineYear>(initialYear);

  const setYearIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(TIMELINE_YEARS.length - 1, index));
    setYear(TIMELINE_YEARS[clamped]);
  }, []);

  const yearIndex = TIMELINE_YEARS.indexOf(year);

  return { year, setYear, setYearIndex, yearIndex, years: TIMELINE_YEARS };
}
