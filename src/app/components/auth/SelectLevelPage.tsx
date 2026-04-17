import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, hasValidAuthToken } from '../../../api/client';

type SelectableLevel = {
  id: string;
  name: string;
  order: number;
};

type LevelsApiItem = {
  id?: string;
  uuid?: string;
  levelUuid?: string;
  name?: string;
  category_order?: number;
  order?: number;
  levelOrder?: number;
};

type LocationState = {
  levels?: SelectableLevel[];
};

const normalizeLevels = (rawItems: LevelsApiItem[]): SelectableLevel[] => {
  return rawItems
    .map((item) => {
      const id = item.uuid ?? item.levelUuid ?? item.id;
      const order = item.category_order ?? item.order ?? item.levelOrder;
      if (!id || typeof order !== 'number') return null;

      return {
        id,
        name: item.name || `Level ${order}`,
        order,
      } as SelectableLevel;
    })
    .filter((item): item is SelectableLevel => item !== null)
    .sort((a, b) => a.order - b.order);
};

export function SelectLevelPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState | null;

  const [levels, setLevels] = useState<SelectableLevel[]>(locationState?.levels || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hasValidAuthToken()) {
      navigate('/auth/login', { replace: true });
      return;
    }

    if (levels.length) return;

    let isMounted = true;

    const loadLevels = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/school/levels');
        const rawItems: LevelsApiItem[] = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        if (!isMounted) return;
        setLevels(normalizeLevels(rawItems));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLevels();

    return () => {
      isMounted = false;
    };
  }, [levels.length, navigate]);

  const handleSelectLevel = (level: SelectableLevel) => {
    navigate(`/dashboard?levelId=${encodeURIComponent(level.id)}`, {
      state: {
        selectedLevelId: level.id,
        selectedLevelName: level.name,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Select a School Level</h1>
          <p className="text-sm text-slate-600">Choose the level you want to manage first.</p>
        </div>

        {isLoading ? <p className="text-sm text-slate-500">Loading levels...</p> : null}

        {!isLoading && !levels.length ? (
          <p className="text-sm text-slate-500">No levels available. Continue to dashboard.</p>
        ) : null}

        {levels.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {levels.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => handleSelectLevel(level)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-left transition hover:border-blue-400 hover:bg-blue-50"
              >
                <p className="text-sm text-slate-500">Level {level.order}</p>
                <p className="mt-1 font-medium text-slate-900">{level.name}</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
