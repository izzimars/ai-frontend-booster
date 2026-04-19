import { schoolApi } from './apiClient';

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type StaffRole =
  | 'admin'
  | 'principal'
  | 'secretary'
  | 'teacher'
  | 'helper'
  | 'bursar'
  | 'accountant';

export type StaffStatus = 'active' | 'inactive' | 'suspended' | 'deleted' | 'pending';

export type StaffLevel = {
  id: string;
  name: string;
};

export type StaffUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: StaffRole;
  status: StaffStatus;
  levelIds: string[];
  levels: StaffLevel[];
};

export type InviteStaffPayload = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: StaffRole;
  levelIds: string[];
};

export type UpdateStaffInfoPayload = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  levelIds?: string[];
};

const unwrapEnvelope = <T>(payload: unknown): T => {
  const envelope = payload as Partial<ApiEnvelope<T>>;
  if (typeof envelope === 'object' && envelope !== null && 'data' in envelope) {
    return envelope.data as T;
  }
  return payload as T;
};

const normalizeRole = (value: unknown): StaffRole => {
  const role = String(value || '').toLowerCase() as StaffRole;
  const allowed: StaffRole[] = ['admin', 'principal', 'secretary', 'teacher', 'helper', 'bursar', 'accountant'];
  return allowed.includes(role) ? role : 'teacher';
};

const normalizeStatus = (value: unknown): StaffStatus => {
  const status = String(value || '').toLowerCase() as StaffStatus;
  const allowed: StaffStatus[] = ['active', 'inactive', 'suspended', 'deleted', 'pending'];
  return allowed.includes(status) ? status : 'active';
};

const normalizeLevels = (raw: unknown): StaffLevel[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const record = item as Record<string, unknown>;
      const id = String(record.id || record.levelId || record.uuid || '');
      const name = String(record.name || record.levelName || record.title || '');
      if (!id) return null;
      return { id, name: name || id };
    })
    .filter((item): item is StaffLevel => Boolean(item));
};

const normalizeLevelIds = (raw: unknown, levels: StaffLevel[]): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item)).filter(Boolean);
  }
  return levels.map((level) => level.id);
};

const normalizeStaffUser = (raw: unknown): StaffUser => {
  const record = raw as Record<string, unknown>;
  const levels = normalizeLevels(record.levels);
  const firstName = String(record.firstName || record.firstname || '').trim();
  const lastName = String(record.lastName || record.lastname || '').trim();
  const fallbackName = String(record.name || '').trim();
  const [fallbackFirst = '', ...fallbackLast] = fallbackName.split(' ');

  return {
    id: String(record.id || record.staffId || record._id || ''),
    firstName: firstName || fallbackFirst,
    lastName: lastName || fallbackLast.join(' '),
    email: String(record.email || ''),
    phoneNumber: record.phoneNumber ? String(record.phoneNumber) : undefined,
    role: normalizeRole(record.role),
    status: normalizeStatus(record.status),
    levels,
    levelIds: normalizeLevelIds(record.levelIds, levels),
  };
};

const request = async <T>(path: string, options?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; params?: Record<string, string | undefined> }): Promise<T> => {
  const response = await schoolApi.request({
    url: path,
    method: options?.method || 'GET',
    data: options?.body,
    params: options?.params,
  });
  return unwrapEnvelope<T>(response.data);
};

const requestWithFallback = async <T>(paths: string[], options?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; params?: Record<string, string | undefined> }): Promise<T> => {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await request<T>(path, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export const listStaff = async (levelId: string): Promise<StaffUser[]> => {
  const payload = await request<unknown[]>(`/staff/${encodeURIComponent(levelId)}`);
  return (Array.isArray(payload) ? payload : []).map(normalizeStaffUser).filter((item) => item.id);
};

export const inviteStaff = async (levelId: string, body: InviteStaffPayload): Promise<StaffUser> => {
  const payload = await request<unknown>(`/staff/${encodeURIComponent(levelId)}/invite`, {
    method: 'POST',
    body,
  });
  return normalizeStaffUser(payload);
};

export const updateStaffInfo = async (staffId: string, body: UpdateStaffInfoPayload): Promise<StaffUser> => {
  const payload = await requestWithFallback<unknown>([
    `/staff/${encodeURIComponent(staffId)}/info`,
    `/${encodeURIComponent(staffId)}/info`,
  ], {
    method: 'PATCH',
    body,
  });
  return normalizeStaffUser(payload);
};

export const updateStaffRole = async (staffId: string, newRole: StaffRole): Promise<StaffUser> => {
  const payload = await requestWithFallback<unknown>([
    `/staff/${encodeURIComponent(staffId)}/role`,
    `/${encodeURIComponent(staffId)}/role`,
  ], {
    method: 'PATCH',
    body: { newRole },
  });
  return normalizeStaffUser(payload);
};

export const updateStaffStatus = async (staffId: string, newStatus: StaffStatus): Promise<StaffUser> => {
  const payload = await requestWithFallback<unknown>([
    `/staff/${encodeURIComponent(staffId)}/status`,
    `/${encodeURIComponent(staffId)}/status`,
  ], {
    method: 'PATCH',
    body: { newStatus },
  });
  return normalizeStaffUser(payload);
};

export const removeStaff = async (staffId: string): Promise<void> => {
  await requestWithFallback<unknown>([
    `/staff/${encodeURIComponent(staffId)}`,
    `/${encodeURIComponent(staffId)}`,
  ], {
    method: 'DELETE',
  });
};

export const getLevels = async (levelId: string): Promise<StaffLevel[]> => {
  const payload = await request<unknown[]>(`/levels`, {
    params: { levelId },
  });

  return normalizeLevels(payload);
};
