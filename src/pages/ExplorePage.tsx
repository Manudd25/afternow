import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, MapPin } from 'lucide-react';
import type { City, TimelineYear } from '../types';
import { FEATURED_CITIES } from '../data/cities';
import { resolveCityById, storeCity } from '../utils/cityStorage';
import { useCityData } from '../hooks/useCityData';
import { useCitySearch } from '../hooks/useCitySearch';
import { useTimeline } from '../hooks/useTimeline';
import { SearchBar } from '../components/ui/SearchBar';
import { TimelineSlider } from '../components/ui/TimelineSlider';
import { GlassPanel } from '../components/ui/GlassPanel';
import { CityMap } from '../components/map/CityMap';
import { AISummary } from '../components/ai/AISummary';
import { StoryMode } from '../components/ai/StoryMode';
import { FutureCityVisualization } from '../components/visualization/FutureCityVisualization';
import { FutureDashboard } from '../components/dashboard/FutureDashboard';
import { useFutureVisualization } from '../hooks/useFutureVisualization';
import { ClimateScenarioSelector } from '../components/ui/ClimateScenarioSelector';
import { useClimateScenario } from '../context/ClimateScenarioContext';
import { useTimelineMetrics } from '../hooks/useTimelineMetrics';

function resolveInitialCity(searchParams: URLSearchParams): City {
  const cityId = searchParams.get('city');
  if (cityId) {
    const city = resolveCityById(cityId);
    if (city) return city;
  }
  return FEATURED_CITIES[0];
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState<City>(() => resolveInitialCity(searchParams));
  const { scenario } = useClimateScenario();
  const { year, setYear } = useTimeline(2025);
  const { projection, loading, error } = useCityData(selectedCity, year);
  const { projection: todayProjection } = useCityData(selectedCity, 2025);
  const { timelineMetrics, loading: timelineMetricsLoading } = useTimelineMetrics(selectedCity);
  const { results, search, searching } = useCitySearch();
  const {
    visualization,
    scenario: visualScenario,
    mockLoading: visualMockLoading,
    aiGenerating,
    isAiGenerated,
    fallbackMessage,
    viewMode,
    setViewMode,
    generateAiVisualization,
    canGenerateAi,
    cooldownRemainingMs,
    aiGenerationEnabled,
    generationProgress,
    cachedYearsCount,
    allYearsCached,
    allFutureAiCached,
    aiGenerationCount,
    hasPresentDayPhoto,
  } = useFutureVisualization({
    city: selectedCity,
    year,
    projection,
    todayProjection,
  });

  useEffect(() => {
    const cityId = searchParams.get('city');
    if (cityId) {
      const city = resolveCityById(cityId);
      if (city) setSelectedCity(city);
    }
  }, [searchParams]);

  const handleCitySelect = (city: City) => {
    storeCity(city);
    setSelectedCity(city);
    setSearchParams({ city: city.id });
  };

  const handleTimelineChange = (newYear: TimelineYear) => {
    setYear(newYear);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Hero bar */}
      <div className="relative overflow-hidden border-b border-sky-400/10 bg-gradient-to-r from-sky-950/50 via-surface-elevated/80 to-blue-950/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-accent" />
                <h1 className="text-2xl font-semibold tracking-tight">
                  {selectedCity.name}
                </h1>
                <span className="text-text-muted">{selectedCity.country}</span>
              </div>
              <p className="text-sm text-text-muted">
                {selectedCity.region.charAt(0).toUpperCase() + selectedCity.region.slice(1)} climate
                {selectedCity.coastal ? ' · Coastal' : ''}
                {selectedCity.population
                  ? ` · ${(selectedCity.population / 1_000_000).toFixed(1)}M people`
                  : ''}
              </p>
            </div>

            <SearchBar
              onSelect={handleCitySelect}
              results={results}
              onSearch={search}
              searching={searching}
            />
          </div>

          <div className="mt-8 space-y-6">
            <ClimateScenarioSelector />
            <TimelineSlider year={year} onChange={handleTimelineChange} />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <GlassPanel className="p-4 mb-6 border-red-400/20 bg-red-400/5">
            <p className="text-sm text-red-400">{error}</p>
          </GlassPanel>
        )}

        {loading && !projection ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : projection ? (
          <motion.div
            key={`${selectedCity.id}-${year}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Future city visualization */}
            <FutureCityVisualization
              cityName={selectedCity.name}
              year={year}
              visualization={visualization}
              scenario={visualScenario}
              mockLoading={visualMockLoading}
              aiGenerating={aiGenerating}
              isAiGenerated={isAiGenerated}
              fallbackMessage={fallbackMessage}
              generationProgress={generationProgress}
              cachedYearsCount={cachedYearsCount}
              allYearsCached={allYearsCached}
              allFutureAiCached={allFutureAiCached}
              aiGenerationCount={aiGenerationCount}
              hasPresentDayPhoto={hasPresentDayPhoto}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onGenerateAi={generateAiVisualization}
              canGenerateAi={canGenerateAi}
              cooldownRemainingMs={cooldownRemainingMs}
              aiGenerationEnabled={aiGenerationEnabled}
            />

            {/* Metrics grid */}
            <FutureDashboard
              city={selectedCity}
              year={year}
              metrics={projection.metrics}
              loading={loading}
              timelineMetrics={timelineMetrics}
              timelineLoading={timelineMetricsLoading}
              scenarioLabel={`${scenario.emoji} ${scenario.label}`}
            />

            {/* Map + AI */}
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CityMap city={selectedCity} riskZones={projection.riskZones} />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <AISummary
                  summary={projection.summary}
                  cityName={selectedCity.name}
                  year={year}
                  loading={loading}
                />
                <StoryMode
                  story={projection.story}
                  cityName={selectedCity.name}
                  year={year}
                  loading={loading}
                />
              </div>
            </div>

            {/* Sources */}
            <GlassPanel className="p-5">
              <h3 className="text-sm font-medium mb-3">Scientific Sources</h3>
              <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                <div>
                  <span className="text-text-secondary font-medium">Temperature & Rainfall:</span>{' '}
                  Open-Meteo Climate API (EC-Earth3P-HR, 1991–2020 baseline)
                </div>
                <div>
                  <span className="text-text-secondary font-medium">Projections:</span>{' '}
                  {scenario.emoji} {scenario.label} — illustrative scenario inspired by IPCC pathways
                </div>
                <div>
                  <span className="text-text-secondary font-medium">Risk Models:</span>{' '}
                  NASA Earth Observatory, Copernicus Emergency Management
                </div>
                <div>
                  <span className="text-text-secondary font-medium">Narratives:</span>{' '}
                  AI-generated from regional climate sensitivity factors
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
