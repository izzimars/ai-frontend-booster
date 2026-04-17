import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { ArrowRight, BookOpen, Building2, GraduationCap, LayoutGrid, Loader2, School, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useSelectedLevel } from './LevelSelectionContext';

type LevelApiItem = {
  levelUuid?: string;
  uuid?: string;
  id?: string;
  levelName?: string;
  level_name?: string;
  name?: string;
  displayName?: string;
  levelType?: string;
  level_type?: string;
};

type LevelCardItem = {
  levelUuid: string;
  levelName: string;
};

type ApiErrorShape = {
  message?: string;
};

const iconMap = [
  { match: /(nursery|early|foundation)/i, icon: School },
  { match: /(kindergarten|kinder)/i, icon: Sparkles },
  { match: /(primary|elementary)/i, icon: BookOpen },
  { match: /(junior|jss|middle)/i, icon: GraduationCap },
  { match: /(senior|sss|high)/i, icon: Building2 },
];

const getLevelIcon = (levelName: string) => {
  const entry = iconMap.find((item) => item.match.test(levelName));
  return entry?.icon ?? LayoutGrid;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<ApiErrorShape>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

const normalizeLevels = (payload: unknown): LevelCardItem[] => {
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { levels?: unknown }).levels)
      ? (payload as { levels: unknown[] }).levels
      : Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: unknown[] }).data
        : Array.isArray((payload as { data?: { levels?: unknown[] } }).data?.levels)
          ? (payload as { data: { levels: unknown[] } }).data.levels
          : [];

  return rawItems
    .map((item) => {
      const level = item as LevelApiItem;
      const levelUuid = level.levelUuid || level.uuid || level.id;
      const levelName = level.levelName || level.level_name || level.name || level.displayName;

      if (!levelUuid || !levelName) return null;

      return {
        levelUuid: String(levelUuid),
        levelName: String(levelName),
      };
    })
    .filter((item): item is LevelCardItem => Boolean(item));
};

export function LevelSelectionPage() {
  const navigate = useNavigate();
  const { selectedLevel, setSelectedLevel } = useSelectedLevel();
  const [levels, setLevels] = useState<LevelCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevelUuid, setSelectedLevelUuid] = useState<string | null>(selectedLevel?.levelUuid ?? null);

  useEffect(() => {
    let isMounted = true;

    const loadLevels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get('/school/levels');
        const nextLevels = normalizeLevels(response.data);

        if (!isMounted) return;

        setLevels(nextLevels);
        setSelectedLevelUuid((current) => current ?? selectedLevel?.levelUuid ?? nextLevels[0]?.levelUuid ?? null);
      } catch (error: unknown) {
        if (!isMounted) return;

        setError(extractErrorMessage(error, 'Unable to load school levels.'));
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
  }, []);

  const sortedLevels = useMemo(() => levels, [levels]);

  const handleSelectLevel = (level: LevelCardItem) => {
    setSelectedLevel({ levelUuid: level.levelUuid, levelName: level.levelName });
    setSelectedLevelUuid(level.levelUuid);
    navigate('/dashboard');
  };

  const handleCompleteSetup = () => {
    navigate('/auth/school-setup');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_45%,#eef2ff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col justify-center">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Parent Intelligence Platform</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Select a school level</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Choose the section you want to manage. Your selection will stay active across refreshes.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Portal context</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Level scoped dashboard access</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-8">
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading levels...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : sortedLevels.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <School className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-900">No levels found</h2>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                You need to finish the school setup before you can continue to the dashboard.
              </p>
              <button
                type="button"
                onClick={handleCompleteSetup}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Complete Setup
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {sortedLevels.map((level) => {
                const Icon = getLevelIcon(level.levelName);
                const isSelected = selectedLevelUuid === level.levelUuid;

                return (
                  <button
                    key={level.levelUuid}
                    type="button"
                    onClick={() => handleSelectLevel(level)}
                    className={`group flex h-full flex-col justify-between rounded-3xl border p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Level Portal
                        </span>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">{level.levelName}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Enter this section to view the corresponding dashboard, workflows, and section-specific records.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-500">{isSelected ? 'Selected' : 'Tap to continue'}</span>
                      <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-slate-800">
                        Go to Dashboard
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading && !error && sortedLevels.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Tip: your last selected level is saved automatically and restored after refresh.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}