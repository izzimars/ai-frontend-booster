import { schoolApi } from './apiClient';

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type FeeDashboardMetrics = {
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  collectionRate: number;
  pendingReceipts?: number;
  overdueTotal?: number;
};

export type FeeItemStatus = 'pending_approval' | 'approved' | 'rejected';

export type FeeItem = {
  id: number;
  name: string;
  category: string;
  amount: number;
  term: string;
  classId?: string | null;
  armId?: string | null;
  dueDate: string;
  isCompulsory: boolean;
  isActive?: boolean;
  status: FeeItemStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
};

export type Arm = {
  id: string;
  name: string;
  className?: string;
  teacherName?: string;
  studentCount?: number;
};

export type ArmSubjectPerformance = {
  subject: string;
  average: number;
  passRate: number;
};

export type ArmGradeDistribution = {
  grade: string;
  count: number;
};

export type ArmMetrics = {
  armId: string;
  armName: string;
  billed?: number;
  paid?: number;
  outstanding?: number;
  collectionRate?: number;
  averageScore?: number;
  passRate?: number;
  attendanceRate?: number;
  rank?: number;
  subjectPerformance?: ArmSubjectPerformance[];
  gradeDistribution?: ArmGradeDistribution[];
  subjectKpis?: Record<
    string,
    {
      subjectAverage: number;
      highestScore: number;
      lowestScore: number;
      teacherComplianceRate: number | null;
    }
  >;
};

export type StudentFeeSummary = {
  id: string;
  name: string;
  cumulativeAverage?: number;
  feeStatus?: string;
  attendanceRate?: number;
  subjectScores?: Array<{ subject: string; score: number }>;
  [key: string]: unknown;
};

export type StudentDetails = {
  id: string;
  name: string;
  feeStatus?: string;
  cumulativeAverage?: number;
  [key: string]: unknown;
};

type FeeItemFilters = {
  status?: string;
  term?: string;
  armId?: string;
};

const unwrapEnvelope = <T>(payload: unknown): T => {
  const envelope = payload as Partial<ApiEnvelope<T>>;
  if (typeof envelope === 'object' && envelope !== null && 'data' in envelope) {
    return envelope.data as T;
  }
  return payload as T;
};

const request = async <T>(path: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }): Promise<T> => {
  const response = await schoolApi.request({
    url: path,
    method: options?.method || 'GET',
    data: options?.body,
  });

  return unwrapEnvelope<T>(response.data);
};

const toQuery = (params?: Record<string, string | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
};

export const getFeeDashboardMetrics = (levelId: string) =>
  request<FeeDashboardMetrics>(`/fee/${encodeURIComponent(levelId)}/fee-dashboard/metrics`);

export const getFeeItems = (levelId: string, params?: FeeItemFilters) =>
  request<FeeItem[]>(
    `/fee/${encodeURIComponent(levelId)}/fee-items${toQuery({
      status: params?.status,
      term: params?.term,
      armId: params?.armId,
    })}`,
  );

export const getFeeItemById = (levelId: string, feeItemId: number) =>
  request<FeeItem>(`/fee/${encodeURIComponent(levelId)}/fee-items/${feeItemId}`);

export const updateFeeItemStatus = (
  levelId: string,
  feeItemId: number,
  status: 'approved' | 'rejected',
  reason?: string,
) =>
  request<FeeItem>(`/fee/${encodeURIComponent(levelId)}/fee-items/${feeItemId}/status`, {
    method: 'PUT',
    body: {
      status,
      rejectionReason: reason,
    },
  });

export const getArms = () => request<Arm[]>('/fee/fee-dashboard/metrics/arms');

export const getArmMetrics = (armId: string) =>
  request<ArmMetrics>(`/fee/fee-dashboard/metrics/arms/${encodeURIComponent(armId)}`);

export const getArmStudents = (armId: string) =>
  request<StudentFeeSummary[]>(`/fee/fee-dashboard/metrics/arms/${encodeURIComponent(armId)}/students`);

export const getStudentDetails = (armId: string, studentId: string) =>
  request<StudentDetails>(`/fee/fee-dashboard/metrics/arms/${encodeURIComponent(armId)}/students/${encodeURIComponent(studentId)}`);
