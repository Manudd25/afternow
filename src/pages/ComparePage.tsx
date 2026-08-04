import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import type { City, TimelineYear } from '../types';
import { FEATURED_CITIES } from '../data/cities';
import { useCityData } from '../hooks/useCityData';
import { useTimeline } from '../hooks/useTimeline';
import { SearchBar } from '../components/ui/SearchBar';
import { TimelineSlider } from '../components/ui/TimelineSlider';
import { ClimateScenarioSelector } from '../components/ui/ClimateScenarioSelector';
import { GlassPanel } from '../components/ui/GlassPanel';
import { ComparisonCharts } from '../components/charts/ComparisonCharts';
import { useCitySearch } from '../hooks/useCitySearch';

export function ComparePage() {
  const [cityA, setCityA] = useState<City>(FEATURED_CITIES[0]); // Berlin
  const [cityB, setCityB] = useState<City>(FEATURED_CITIES[5]); // Stockholm
  const { year, setYear } = useTimeline(2050);
  const { projection: projA, loading: loadA } = useCityData(cityA, year);
  const { projection: projB, loading: loadB } = useCityData(cityB, year);
  const { results, search, searching } = useCitySearch();
  const [activeSlot, setActiveSlot] = useState<'A' | 'B' | null>(null);

  const loading = loadA || loadB;

  const handleSelect = (city: City) => {
    if (activeSlot === 'A') setCityA(city);
    else if (activeSlot === 'B') setCityB(city);
    setActiveSlot(null);
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="border-b border-white/5 bg-surface-elevated/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <ArrowLeftRight className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-semibold tracking-tight">Compare Cities</h1>
          </div>
          <p className="text-sm text-text-muted mb-8">
            See how two cities might face the future differently.
          </p>

          <div className="space-y-6">
            <ClimateScenarioSelector />
            <TimelineSlider year={year} onChange={(y: TimelineYear) => setYear(y)} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* City selectors */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <GlassPanel className="p-5">
            <p className="text-xs text-accent font-medium mb-3 uppercase tracking-wider">City A</p>
            <button
              onClick={() => setActiveSlot('A')}
              className="text-left w-full"
            >
              <h3 className="text-xl font-semibold">{cityA.name}</h3>
              <p className="text-sm text-text-muted">{cityA.country}</p>
            </button>
            {activeSlot === 'A' && (
              <div className="mt-4">
                <SearchBar
                  onSelect={handleSelect}
                  results={results}
                  onSearch={search}
                  searching={searching}
                  placeholder="Search city A..."
                />
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-xs text-violet-400 font-medium mb-3 uppercase tracking-wider">City B</p>
            <button
              onClick={() => setActiveSlot('B')}
              className="text-left w-full"
            >
              <h3 className="text-xl font-semibold">{cityB.name}</h3>
              <p className="text-sm text-text-muted">{cityB.country}</p>
            </button>
            {activeSlot === 'B' && (
              <div className="mt-4">
                <SearchBar
                  onSelect={handleSelect}
                  results={results}
                  onSearch={search}
                  searching={searching}
                  placeholder="Search city B..."
                />
              </div>
            )}
          </GlassPanel>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : projA && projB ? (
          <motion.div
            key={`${cityA.id}-${cityB.id}-${year}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            <ComparisonCharts cityA={projA} cityB={projB} />

            {/* Side-by-side summaries */}
            <div className="grid gap-6 md:grid-cols-2">
              <GlassPanel className="p-5">
                <h3 className="text-sm font-medium text-accent mb-3">{cityA.name}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{projA.summary}</p>
              </GlassPanel>
              <GlassPanel className="p-5">
                <h3 className="text-sm font-medium text-violet-400 mb-3">{cityB.name}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{projB.summary}</p>
              </GlassPanel>
            </div>

            {/* Key differences */}
            <GlassPanel className="p-5">
              <h3 className="text-sm font-medium mb-4">Key Differences</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: 'Temperature',
                    diff: projA.baseline.avgTemperature - projB.baseline.avgTemperature,
                    unit: '°C',
                  },
                  {
                    label: 'Rainfall',
                    diff: projA.baseline.rainfall - projB.baseline.rainfall,
                    unit: 'mm',
                  },
                  {
                    label: 'Heatwave Days',
                    diff: projA.baseline.heatwaveDays - projB.baseline.heatwaveDays,
                    unit: 'days',
                  },
                ].map(({ label, diff, unit }) => (
                  <div key={label} className="rounded-xl bg-white/3 p-4">
                    <p className="text-xs text-text-muted mb-1">{label}</p>
                    <p className="text-sm">
                      <span className="font-medium">{cityA.name}</span>
                      {' is '}
                      <span className="text-accent font-semibold">
                        {Math.abs(diff).toFixed(1)} {unit}
                      </span>
                      {diff > 0 ? ' higher' : diff < 0 ? ' lower' : ' equal'}
                    </p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
