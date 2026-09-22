export type AssessmentCategory = 'grading' | 'homework' | 'test';
export type AssessmentStatus = 'pending' | 'graded' | 'approved';

export type AssessmentStudentResult = {
  studentId: string;
  studentName: string;
  score: number | null;
  comment: string;
};

export type AssessmentRecord = {
  id: string;
  classId: string;
  className: string;
  subject: string;
  sessionId: string;
  sessionDate: string;
  title: string;
  maxScore: number;
  weighting: number;
  useForCumulativeResult: boolean;
  category: AssessmentCategory;
  typeLabel: string;
  status: AssessmentStatus;
  createdAt: string;
  staff: string;
  studentResults: AssessmentStudentResult[];
  updatedAt: string;
};

export type AssessmentSummary = AssessmentRecord & {
  averageScore: number | null;
  scoredStudents: number;
};

export type AssessmentRosterEntry = {
  id: string;
  name: string;
};

export type AssessmentClassMeta = {
  id: string;
  className: string;
  teacherRole: 'classTeacher' | 'subjectTeacher';
  mySubject?: string;
  subjectOversight: Array<{
    subject: string;
    teacher: string;
    syllabusStatus: 'approved' | 'submitted' | 'rejected';
  }>;
  studentRoster: AssessmentRosterEntry[];
};

type AssessmentSeed = Omit<AssessmentRecord, 'updatedAt'>;

const ASSESSMENT_STORAGE_PREFIX = 'assessment-detail:';

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getAssessmentStorageKey(assessmentId: string) {
  return `${ASSESSMENT_STORAGE_PREFIX}${assessmentId}`;
}

export function buildAssessmentId(
  classId: string,
  sessionId: string,
  category: AssessmentCategory,
  sourceId: string,
) {
  return [classId, sessionId, category, sourceId].join('::');
}

export function getAssessmentTypeLabel(category: AssessmentCategory) {
  if (category === 'grading') return 'Grade';
  if (category === 'homework') return 'Homework';
  return 'Test';
}

export function formatAssessmentStatus(status: AssessmentStatus) {
  return status === 'pending' ? 'Pending' : status === 'graded' ? 'Graded' : 'Approved';
}

export function formatAssessmentTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getAssessmentAverageScore(
  studentResults: AssessmentStudentResult[],
  maxScore: number,
) {
  const scoredResults = studentResults.filter((item) => typeof item.score === 'number' && !Number.isNaN(item.score));
  if (!scoredResults.length || maxScore <= 0) return null;

  const average = scoredResults.reduce((sum, item) => sum + (item.score || 0), 0) / scoredResults.length;
  return Number.isFinite(average) ? Math.round(average * 100) / 100 : null;
}

export function getAssessmentPercentage(score: number | null, maxScore: number) {
  if (score === null || maxScore <= 0) return null;
  return Math.round((score / maxScore) * 100);
}

export function buildDefaultStudentResults(
  roster: AssessmentRosterEntry[],
  initialScores?: Record<string, number | null>,
) {
  return roster.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    score: initialScores?.[student.id] ?? null,
    comment: '',
  }));
}

export function createAssessmentSeed(input: {
  id: string;
  classId: string;
  className: string;
  subject: string;
  sessionId: string;
  sessionDate: string;
  title: string;
  maxScore: number;
  weighting: number;
  useForCumulativeResult: boolean;
  category: AssessmentCategory;
  typeLabel: string;
  status: AssessmentStatus;
  createdAt: string;
  staff: string;
  studentResults: AssessmentStudentResult[];
}): AssessmentSeed {
  return {
    ...input,
  };
}

export function normalizeAssessmentRecord(raw: unknown, fallback?: AssessmentSeed): AssessmentRecord {
  const fallbackStudentResults = fallback?.studentResults ?? [];
  const rawObject = raw as Partial<AssessmentRecord> | null | undefined;
  const studentResults = Array.isArray(rawObject?.studentResults)
    ? rawObject.studentResults
        .map((entry) => ({
          studentId: String(entry?.studentId ?? ''),
          studentName: String(entry?.studentName ?? ''),
          score: entry?.score === null || entry?.score === undefined ? null : Number(entry.score),
          comment: String(entry?.comment ?? ''),
        }))
        .filter((entry) => entry.studentId && entry.studentName)
    : fallbackStudentResults;

  return {
    id: String(rawObject?.id ?? fallback?.id ?? crypto.randomUUID()),
    classId: String(rawObject?.classId ?? fallback?.classId ?? ''),
    className: String(rawObject?.className ?? fallback?.className ?? ''),
    subject: String(rawObject?.subject ?? fallback?.subject ?? ''),
    sessionId: String(rawObject?.sessionId ?? fallback?.sessionId ?? ''),
    sessionDate: String(rawObject?.sessionDate ?? fallback?.sessionDate ?? new Date().toISOString()),
    title: String(rawObject?.title ?? fallback?.title ?? 'Untitled Assessment'),
    maxScore: Number(rawObject?.maxScore ?? fallback?.maxScore ?? 100),
    weighting: Number(rawObject?.weighting ?? fallback?.weighting ?? 0),
    useForCumulativeResult: Boolean(rawObject?.useForCumulativeResult ?? fallback?.useForCumulativeResult ?? false),
    category:
      rawObject?.category === 'grading' || rawObject?.category === 'homework' || rawObject?.category === 'test'
        ? rawObject.category
        : fallback?.category ?? 'grading',
    typeLabel: String(rawObject?.typeLabel ?? fallback?.typeLabel ?? 'Assessment'),
    status:
      rawObject?.status === 'pending' || rawObject?.status === 'graded' || rawObject?.status === 'approved'
        ? rawObject.status
        : fallback?.status ?? 'pending',
    createdAt: String(rawObject?.createdAt ?? fallback?.createdAt ?? new Date().toISOString()),
    staff: String(rawObject?.staff ?? fallback?.staff ?? 'Unknown'),
    studentResults,
    updatedAt: String(rawObject?.updatedAt ?? fallback?.createdAt ?? new Date().toISOString()),
  };
}

export function summarizeAssessment(record: AssessmentRecord | AssessmentSeed): AssessmentSummary {
  const updatedAt = 'updatedAt' in record ? record.updatedAt : record.createdAt;

  return {
    ...record,
    updatedAt,
    averageScore: getAssessmentAverageScore(record.studentResults, record.maxScore),
    scoredStudents: record.studentResults.filter((entry) => typeof entry.score === 'number').length,
  };
}

export function loadAssessmentRecord(assessmentId: string) {
  if (!isBrowser()) return null;

  const stored = localStorage.getItem(getAssessmentStorageKey(assessmentId));
  if (!stored) return null;

  try {
    return normalizeAssessmentRecord(JSON.parse(stored) as unknown);
  } catch {
    return null;
  }
}

export function saveAssessmentRecord(record: AssessmentRecord) {
  if (!isBrowser()) return;
  localStorage.setItem(getAssessmentStorageKey(record.id), JSON.stringify(record));
}

export function upsertAssessmentRecord(seed: AssessmentSeed) {
  const current = loadAssessmentRecord(seed.id);
  if (current) return current;

  const next = normalizeAssessmentRecord(seed, seed);
  saveAssessmentRecord(next);
  return next;
}

export function updateAssessmentRecord(
  assessmentId: string,
  updater: (current: AssessmentRecord) => AssessmentRecord,
) {
  const current = loadAssessmentRecord(assessmentId);
  if (!current) return null;

  const next = updater(current);
  saveAssessmentRecord(next);
  return next;
}
