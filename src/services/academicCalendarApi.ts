import { schoolApi } from './apiClient';

export interface AcademicSession {
  id: string;
  name: string; // e.g., "2025/2026"
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: 'pending' | 'upcoming' | 'active' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicTerm {
  id: string;
  name: string;
  termNumber: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  session_id: string;
  isCurrent: boolean;
  status: 'pending' | 'upcoming' | 'active' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type RawSession = {
  session_id?: string;
  session_name?: string;
  session_start_date?: string;
  session_end_date?: string;
  session_status?: AcademicSession['status'];
  created_at?: string;
  updated_at?: string;
};

type RawTerm = {
  term_id?: string;
  term_name?: string;
  term_number?: number;
  term_start_date?: string;
  term_end_date?: string;
  session_id?: string;
  is_current?: boolean;
  term_status?: AcademicTerm['status'];
  created_at?: string;
  updated_at?: string;
};

const unwrapData = <T>(payload: ApiEnvelope<T> | T | undefined, fallback: T): T => {
  if (!payload) return fallback;
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? fallback) as T;
  }
  return payload as T;
};

const mapSession = (raw: RawSession): AcademicSession => ({
  id: raw.session_id || '',
  name: raw.session_name || '',
  startDate: raw.session_start_date || '',
  endDate: raw.session_end_date || '',
  status: raw.session_status || 'upcoming',
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

const mapTerm = (raw: RawTerm): AcademicTerm => ({
  id: raw.term_id || '',
  name: raw.term_name || '',
  termNumber: raw.term_number || 1,
  startDate: raw.term_start_date || '',
  endDate: raw.term_end_date || '',
  session_id: raw.session_id || '',
  isCurrent: Boolean(raw.is_current),
  status: raw.term_status || 'upcoming',
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

// ========== SESSIONS ==========
export const getSessions = async (): Promise<AcademicSession[]> => {
  const response = await schoolApi.get<ApiEnvelope<RawSession[]> | RawSession[]>('/school/sessions');
  const rawSessions = unwrapData<RawSession[]>(response.data, []);
  return Array.isArray(rawSessions) ? rawSessions.map(mapSession) : [];
};

export const createSession = async (data: {
  name: string;
  startDate: string;
  endDate: string;
}) => {
  const response = await schoolApi.post<ApiEnvelope<RawSession> | RawSession>('/school/sessions', {
    session_name: data.name,
    session_start_date: data.startDate,
    session_end_date: data.endDate,
  });
  const rawSession = unwrapData<RawSession>(response.data, {});
  return mapSession(rawSession);
};

export const updateSession = async (
  sessionId: string,
  data: Partial<Pick<AcademicSession, 'name' | 'startDate' | 'endDate' | 'status'>>,
) => {
  const payload: {
    session_name?: string;
    session_start_date?: string;
    session_end_date?: string;
    session_status?: AcademicSession['status'];
  } = {};

  if (data.name !== undefined) payload.session_name = data.name;
  if (data.startDate !== undefined) payload.session_start_date = data.startDate;
  if (data.endDate !== undefined) payload.session_end_date = data.endDate;
  if (data.status !== undefined) payload.session_status = data.status;

  const response = await schoolApi.patch<ApiEnvelope<RawSession> | RawSession>(
    `/school/sessions/${sessionId}`,
    payload,
  );
  const rawSession = unwrapData<RawSession>(response.data, {});
  return mapSession(rawSession);
};

export const deleteSession = async (sessionId: string) => {
  await schoolApi.delete(`/school/sessions/${sessionId}`);
};

export const updateSessionStatus = async (
  sessionId: string,
  status: AcademicSession['status'],
) => {
  const response = await schoolApi.patch<ApiEnvelope<RawSession> | RawSession>(
    `/school/sessions/${sessionId}/status`,
    { status },
  );
  const rawSession = unwrapData<RawSession>(response.data, {});
  return mapSession(rawSession);
};

// ========== TERMS ==========
export const getTerms = async (params?: { session_id?: string; name?: string }) => {
  const response = await schoolApi.get<ApiEnvelope<RawTerm[]> | RawTerm[]>('/school/terms', { params });
  const rawTerms = unwrapData<RawTerm[]>(response.data, []);
  return Array.isArray(rawTerms) ? rawTerms.map(mapTerm) : [];
};

export const createTerm = async (
  data: Omit<AcademicTerm, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
) => {
  const response = await schoolApi.post<ApiEnvelope<RawTerm> | RawTerm>('/school/terms', {
    term_name: data.name,
    term_number: data.termNumber,
    term_start_date: data.startDate,
    term_end_date: data.endDate,
    session_id: data.session_id,
    is_current: data.isCurrent,
  });
  const rawTerm = unwrapData<RawTerm>(response.data, {});
  return mapTerm(rawTerm);
};

export const updateTerm = async (
  termId: string,
  data: Partial<Omit<AcademicTerm, 'id'>>,
) => {
  const payload: {
    term_name?: string;
    term_number?: number;
    term_start_date?: string;
    term_end_date?: string;
    session_id?: string;
    is_current?: boolean;
    term_status?: AcademicTerm['status'];
  } = {};

  if (data.name !== undefined) payload.term_name = data.name;
  if (data.termNumber !== undefined) payload.term_number = data.termNumber;
  if (data.startDate !== undefined) payload.term_start_date = data.startDate;
  if (data.endDate !== undefined) payload.term_end_date = data.endDate;
  if (data.session_id !== undefined) payload.session_id = data.session_id;
  if (data.isCurrent !== undefined) payload.is_current = data.isCurrent;
  if (data.status !== undefined) payload.term_status = data.status;

  const response = await schoolApi.patch<ApiEnvelope<RawTerm> | RawTerm>(`/school/terms/${termId}`, payload);
  const rawTerm = unwrapData<RawTerm>(response.data, {});
  return mapTerm(rawTerm);
};

export const updateTermStatus = async (
  termId: string,
  status: AcademicTerm['status'],
) => {
  const response = await schoolApi.patch<ApiEnvelope<RawTerm> | RawTerm>(
    `/school/terms/${termId}/status`,
    { term_status: status },
  );
  const rawTerm = unwrapData<RawTerm>(response.data, {});
  return mapTerm(rawTerm);
};

export const deleteTerm = async (termId: string) => {
  await schoolApi.delete(`/school/terms/${termId}`);
};
