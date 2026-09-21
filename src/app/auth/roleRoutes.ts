import type { AppRole } from './permissions';

export const selectedSchoolRoleKey = 'selected-school-role';

const dashboardRoles: AppRole[] = ['proprietor', 'admin', 'teacher', 'secretary'];

export const getLevelDashboardRoute = (levelId: string, query = ''): string =>
  `/${encodeURIComponent(levelId)}/dashboard${query}`;

export const normalizeRoleValue = (value: string): AppRole | null => {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (normalized === 'parent' || normalized === 'guardian') return 'guardian';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'proprietor' || normalized === 'principal') return 'proprietor';
  if (normalized === 'admin' || normalized === 'administrator') return 'admin';
  if (normalized === 'secretary') return 'secretary';
  if (normalized === 'bursar' || normalized === 'accountant') return 'bursar';
  if (normalized === 'gate' || normalized === 'gate_staff' || normalized === 'gatestaff') return 'gate';
  if (normalized === 'nurse' || normalized === 'school_nurse') return 'nurse';

  return null;
};

export const getDashboardRouteForRole = (role: AppRole | null | undefined, query = ''): string | null => {
  if (!role || !dashboardRoles.includes(role)) return null;

  return `/dashboard/${role}${query}`;
};

export const getStoredRoleDashboardRoute = (query = ''): string => {
  const storedSchoolRole = localStorage.getItem(selectedSchoolRoleKey);
  const normalizedRole = typeof storedSchoolRole === 'string' ? normalizeRoleValue(storedSchoolRole) : null;

  return getDashboardRouteForRole(normalizedRole, query) || `/dashboard${query}`;
};

export const getDashboardRoleFromPath = (pathname: string): AppRole | null => {
  const match = pathname.match(/^\/dashboard\/([^/?#]+)/);
  if (!match) return null;

  const normalizedRole = normalizeRoleValue(match[1]);
  return normalizedRole && dashboardRoles.includes(normalizedRole) ? normalizedRole : null;
};
