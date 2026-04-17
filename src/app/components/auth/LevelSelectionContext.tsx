import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type SelectedLevel = {
  levelUuid: string;
  levelName: string;
};

type SelectedLevelContextValue = {
  selectedLevel: SelectedLevel | null;
  setSelectedLevel: (level: SelectedLevel) => void;
  clearSelectedLevel: () => void;
};

const selectedLevelStorageKey = 'selected-school-level';

const SelectedLevelContext = createContext<SelectedLevelContextValue | null>(null);

const loadSelectedLevel = (): SelectedLevel | null => {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(selectedLevelStorageKey);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<SelectedLevel>;
    if (typeof parsed.levelUuid !== 'string' || typeof parsed.levelName !== 'string') {
      return null;
    }

    return {
      levelUuid: parsed.levelUuid,
      levelName: parsed.levelName,
    };
  } catch {
    return null;
  }
};

export function SelectedLevelProvider({ children }: { children: ReactNode }) {
  const [selectedLevel, setSelectedLevelState] = useState<SelectedLevel | null>(() => loadSelectedLevel());

  useEffect(() => {
    if (!selectedLevel) {
      window.localStorage.removeItem(selectedLevelStorageKey);
      return;
    }

    window.localStorage.setItem(selectedLevelStorageKey, JSON.stringify(selectedLevel));
  }, [selectedLevel]);

  const value = useMemo<SelectedLevelContextValue>(
    () => ({
      selectedLevel,
      setSelectedLevel: (level) => setSelectedLevelState(level),
      clearSelectedLevel: () => setSelectedLevelState(null),
    }),
    [selectedLevel],
  );

  return <SelectedLevelContext.Provider value={value}>{children}</SelectedLevelContext.Provider>;
}

export function useSelectedLevel() {
  const context = useContext(SelectedLevelContext);
  if (!context) {
    throw new Error('useSelectedLevel must be used within a SelectedLevelProvider.');
  }

  return context;
}