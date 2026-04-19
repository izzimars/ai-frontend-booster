import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelectedLevel } from '../components/auth/LevelSelectionContext';

export function useLevelContext() {
  const location = useLocation();
  const { selectedLevel } = useSelectedLevel();

  const levelId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const queryLevel = params.get('categoryUuid');
    if (queryLevel) return queryLevel;

    if (selectedLevel?.levelUuid) return selectedLevel.levelUuid;

    const stored = localStorage.getItem('selected-school-level');
    if (!stored) return '';

    try {
      const parsed = JSON.parse(stored) as { levelUuid?: string };
      return parsed.levelUuid || '';
    } catch {
      return '';
    }
  }, [location.search, selectedLevel?.levelUuid]);

  return {
    levelId,
    levelName: selectedLevel?.levelName || null,
  };
}
