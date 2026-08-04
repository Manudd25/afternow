import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  CLIMATE_SCENARIO_STORAGE_KEY,
  CLIMATE_SCENARIOS,
  DEFAULT_CLIMATE_SCENARIO_ID,
  isClimateScenarioId,
  type ClimateScenarioDefinition,
  type ClimateScenarioId,
} from '../config/climateScenarios';

interface ClimateScenarioContextValue {
  scenarioId: ClimateScenarioId;
  scenario: ClimateScenarioDefinition;
  setScenarioId: (id: ClimateScenarioId) => void;
}

const ClimateScenarioContext = createContext<ClimateScenarioContextValue | null>(null);

function readStoredScenarioId(): ClimateScenarioId {
  if (typeof window === 'undefined') return DEFAULT_CLIMATE_SCENARIO_ID;

  try {
    const stored = localStorage.getItem(CLIMATE_SCENARIO_STORAGE_KEY);
    return isClimateScenarioId(stored) ? stored : DEFAULT_CLIMATE_SCENARIO_ID;
  } catch {
    return DEFAULT_CLIMATE_SCENARIO_ID;
  }
}

export function ClimateScenarioProvider({ children }: { children: ReactNode }) {
  const [scenarioId, setScenarioIdState] = useState<ClimateScenarioId>(readStoredScenarioId);

  const setScenarioId = useCallback((id: ClimateScenarioId) => {
    setScenarioIdState(id);
    try {
      localStorage.setItem(CLIMATE_SCENARIO_STORAGE_KEY, id);
    } catch {
      // Ignore storage failures (private browsing, quota, etc.)
    }
  }, []);

  const value = useMemo(
    () => ({
      scenarioId,
      scenario: CLIMATE_SCENARIOS[scenarioId],
      setScenarioId,
    }),
    [scenarioId, setScenarioId]
  );

  return (
    <ClimateScenarioContext.Provider value={value}>{children}</ClimateScenarioContext.Provider>
  );
}

export function useClimateScenario(): ClimateScenarioContextValue {
  const context = useContext(ClimateScenarioContext);
  if (!context) {
    throw new Error('useClimateScenario must be used within ClimateScenarioProvider');
  }
  return context;
}
