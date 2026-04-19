import { schoolApi } from './apiClient';

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type SchoolSummary = {
  passRate: number;
  averageScore: number;
  attendanceRate: number;
  totalStudents: number;
  [key: string]: unknown;
};

export type ClassPerformanceRow = {
  classId?: string;
  className: string;
  averageScore: number;
  passRate: number;
  attendanceRate: number;
  rank?: number;
};

export type SubjectPerformanceRow = {
  subject: string;
  average: number;
  passRate: number;
};

export type AttendancePoint = {
  week: string;
  present: number;
  absent?: number;
  late?: number;
};

export type MedicationException = {
  student: string;
  class: string;
  medication: string;
  timeDue: string;
  status?: string;
  reason?: string;
};

export type TransportMode = {
  mode: string;
  count: number;
};

export type ClassInfo = {
  classId: string;
  className: string;
};

export type SubjectInfo = {
  subjectId: string;
  subjectName: string;
};

export type ClassAnalyticsSummary = {
  className: string;
  averageScore: number;
  passRate: number;
  attendanceRate: number;
  rank?: number;
  [key: string]: unknown;
};

export type SubjectSummary = {
  subjectAverage: number;
  highestScore: number;
  lowestScore: number;
  teacherComplianceRate: number | null;
};

export type AtRiskStudent = {
  id: string;
  name: string;
  cumulativeAverage: number;
};

export type DeepDivePoint = {
  week: string;
  average: number;
};

export type GradeDistribution = {
  grade: string;
  count: number;
};

export type SubjectTrend = {
  termLabel: string;
  average: number;
  passRate: number;
};

export type AttendanceTrendParams = {
  fromDate?: string;
  toDate?: string;
  classId?: string;
  granularity?: 'day' | 'week';
};

export type MedicationExceptionsParams = {
  date?: string;
};

export type TransportDistributionParams = {
  termId?: string;
  date?: string;
  classId?: string;
};

const unwrapEnvelope = <T>(payload: unknown): T => {
  const envelope = payload as Partial<ApiEnvelope<T>>;
  if (typeof envelope === 'object' && envelope !== null && 'data' in envelope) {
    return envelope.data as T;
  }
  return payload as T;
};

const request = async <T>(path: string, params?: Record<string, string | undefined>): Promise<T> => {
  const response = await schoolApi.get(path, { params });
  return unwrapEnvelope<T>(response.data);
};

export const getCurrentTermId = () => {
  if (typeof window === 'undefined') return null;

  const candidates = ['currentTermId', 'selectedTermId', 'selected-term-id', 'current-term-id'];
  for (const key of candidates) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
};

export const getSchoolSummary = (levelId: string) =>
  request<SchoolSummary>(`/analysis/${encodeURIComponent(levelId)}/summary`);

export const getClassPerformance = (levelId: string) =>
  request<ClassPerformanceRow[]>(`/analysis/${encodeURIComponent(levelId)}/class/performance`);

export const getSubjectPerformance = (levelId: string) =>
  request<SubjectPerformanceRow[]>(`/analysis/${encodeURIComponent(levelId)}/subject/performance`);

export const getAttendanceTrend = (levelId: string, params?: AttendanceTrendParams) =>
  request<AttendancePoint[]>(`/analysis/${encodeURIComponent(levelId)}/attendance/trend`, {
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    classId: params?.classId,
    granularity: params?.granularity,
  });

export const getMedicationExceptions = (levelId: string, params?: MedicationExceptionsParams) =>
  request<MedicationException[]>(`/analysis/${encodeURIComponent(levelId)}/health/medication-exceptions`, {
    date: params?.date,
  });

export const getTransportDistribution = (levelId: string, params?: TransportDistributionParams) =>
  request<TransportMode[]>(`/analysis/${encodeURIComponent(levelId)}/transport/distribution`, {
    termId: params?.termId,
    date: params?.date,
    classId: params?.classId,
  });

export const getClassesList = (levelId: string) =>
  request<ClassInfo[]>(`/analysis/${encodeURIComponent(levelId)}/classes`);

export const getSubjectsForClass = (classId: string) =>
  request<SubjectInfo[]>(`/analysis/${encodeURIComponent(classId)}/subjects`);

export const getClassAnalytics = (classId: string) =>
  request<ClassAnalyticsSummary>(`/analysis/class/${encodeURIComponent(classId)}/performance`);

export const getSubjectAnalytics = (subjectId: string) =>
  request<SubjectSummary>(`/analysis/subject/${encodeURIComponent(subjectId)}/performance`);

export const getAtRiskStudents = (classId: string) =>
  request<AtRiskStudent[]>(`/analysis/class/${encodeURIComponent(classId)}/at-risk-students`);

export const getDeepDiveTrend = (classId: string) =>
  request<DeepDivePoint[]>(`/analysis/class/${encodeURIComponent(classId)}/deep-dive/trend`);

export const getGradeDistribution = (classId: string) =>
  request<GradeDistribution[]>(`/analysis/class/${encodeURIComponent(classId)}/deep-dive/grade-distribution`);

export const getClassSubjectSummary = (classId: string, subjectId: string) =>
  request<SubjectSummary>(`/analysis/class/${encodeURIComponent(classId)}/subject/${encodeURIComponent(subjectId)}/summary`);

export const getClassSubjectTrends = (classId: string, subjectId: string) =>
  request<SubjectTrend[]>(`/analysis/class/${encodeURIComponent(classId)}/subject/${encodeURIComponent(subjectId)}/trends`);

export const exportClassPerformance = async (levelId: string): Promise<Blob> => {
  const response = await schoolApi.get(`/analysis/${encodeURIComponent(levelId)}/class/performance/export`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};
