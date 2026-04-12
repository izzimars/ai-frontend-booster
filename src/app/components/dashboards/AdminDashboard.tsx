import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { 
  Plus, Users, BookOpen, Calendar, Settings as SettingsIcon, 
  Download, Filter, AlertTriangle, AlertCircle, Eye, TrendingUp, 
  ChevronRight, CheckCircle, XCircle, RefreshCw, 
  Mail, UserCheck, UserX, Edit, Trash2, Clock, FileText, ClipboardList, Flag,
  ShieldAlert, Info, Globe, UserPlus, ShieldCheck, MoreVertical, Settings2, Layout, CalendarDays
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../Modal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Skeleton } from '../ui/skeleton';
import { useNavigate } from 'react-router-dom';

type AtRiskStudent = {
  id: string;
  name: string;
  cumulativeAverage: number;
};

type ClassPerformanceRow = {
  classId: number;
  className: string;
  averageScore: number;
  medianScore: number;
  passRate: number;
  failRate: number;
  attendanceRate: number;
  previousAvg: number;
  delta: string;
  rank: number;
  gradeDist: { A: number; B: number; C: number; D: number; F: number };
  totalStudents: number;
  studentsAssessed: number;
  atRiskStudents: AtRiskStudent[];
};

type LessonNoteStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type LinkedMaterial = {
  id: string;
  type: 'Quiz' | 'Homework' | 'Exam';
  title: string;
};

type AdminLessonNote = {
  id: number;
  class: string;
  subject: string;
  department: string;
  week: number;
  title: string;
  teacher: string;
  generatedBy: 'AI' | 'Manual' | 'Imported';
  status: LessonNoteStatus;
  submittedDate: string;
  approvedDate: string | null;
  content: string;
  syllabusMatch: boolean;
  linkedMaterials: LinkedMaterial[];
  rejectionFeedback?: string;
  privateQualityNote?: string;
};

type SyllabusStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type SyllabusHistoryEvent = {
  status: 'draft_created' | 'submitted' | 'rejected' | 'resubmitted' | 'approved' | 'force_approved';
  at: string;
  by: string;
  note?: string;
};

type SyllabusEntry = {
  id: number;
  class: string;
  subject: string;
  department: string;
  term: 'Term 1, 2026' | 'Term 2, 2026' | 'Term 3, 2026';
  week: number;
  title: string;
  teacher: string;
  status: SyllabusStatus;
  submittedDate: string | null;
  approvedDate: string | null;
  learningObjectives: string[];
  weeklyTopics: string[];
  resources: string[];
  rejectionLogs: Array<{ at: string; reason: string; by: string }>;
  revisionCount: number;
  versionHistory: SyllabusHistoryEvent[];
};

type AuditRiskLevel = 'low' | 'medium' | 'high';

type AuditLogEntry = {
  id: number;
  timestamp: string;
  actorName: string;
  actorRole: 'admin' | 'principal' | 'teacher' | 'bursar' | 'parent' | 'student';
  module: 'syllabus' | 'lesson_notes' | 'fees' | 'results' | 'users' | 'settings' | 'assessments' | 'medical' | 'security';
  action: string;
  description: string;
  riskLevel: AuditRiskLevel;
  ipAddress?: string;
  metadata: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
};

type StaffRole = 'Admin' | 'Principal' | 'Teacher' | 'Bursar' | 'Gate Staff' | 'School Nurse';
type StaffStatus = 'active' | 'inactive' | 'pending_invitation';

type StaffMember = {
  id: number;
  name: string;
  role: StaffRole;
  email: string;
  status: StaffStatus;
  lastActive: string | null;
};

type SchoolClass = {
  id: number;
  name: string;
  category: 'Junior Secondary' | 'Senior Secondary';
  capacity: number;
  students: number;
  teacher: string;
  teacherId: number;
};

type SchoolTerm = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
};

type AssessmentTimetableItem = {
  day: string;
  time: string;
  venue: string;
  subjectOrPaper: string;
};

type AssessmentSchedule = {
  id: number;
  title: string;
  week: string;
  date: string;
  time: string;
  notes: string;
  timetable: AssessmentTimetableItem[];
};

type DataHealthRow = {
  id: string;
  teacherName: string;
  className: string;
  subject: string;
  attendanceCompliance: number;
  lessonNotesOnTime: number;
  assessmentTurnaroundDays: number;
  medicalPickupLogUsage: number;
  parentLoginRate: number;
};

type DataHealthAlert = {
  id: number;
  severity: 'warning' | 'critical';
  message: string;
  date: string;
};

// Result Approvals Types
type GradebookStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
type GradeCategory = 'Homework' | 'Exercise' | 'Lab' | 'Test' | 'Exam';

type GradeWeightingConfig = {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subject: string;
  termId: string;
  term: string;
  status: GradebookStatus;
  submittedAt: string | null;
  rejectionReason: string | null;
  categoryWeights: Record<GradeCategory, number>;
  assessmentMappings: Record<string, { category: GradeCategory; includeInCumulative: boolean }>;
  updatedAt: string;
};

type GradebookApprovalRow = {
  teacherName: string;
  subject: string;
  className: string;
  term: string;
  submissionDate: string | null;
  status: GradebookStatus;
  config: GradeWeightingConfig | null;
};

type StudentGradebookResult = {
  studentId: string;
  studentName: string;
  weightedAverage: number;
  letterGrade: string;
  isOutlier: boolean;
  outlierReason?: string;
  categoryScores: Record<GradeCategory, number>; // average score per category
};

type GradeDistributionPoint = {
  grade: string;
  count: number;
  percentage: number;
};

type ResultPreviewData = {
  config: GradeWeightingConfig;
  students: StudentGradebookResult[];
  gradeDistribution: GradeDistributionPoint[];
  classAverage: number;
  policyAligned: boolean;
};

// ========== MOCK DATA (replace with API) ==========
// Classes with teacher assignments
export const classes: SchoolClass[] = [
  { id: 1, name: 'JSS1A', category: 'Junior Secondary', capacity: 45, students: 41, teacher: 'Mrs. Johnson', teacherId: 1 },
  { id: 2, name: 'JSS2B', category: 'Junior Secondary', capacity: 42, students: 39, teacher: 'Mr. Thompson', teacherId: 2 },
  { id: 3, name: 'SS1A', category: 'Senior Secondary', capacity: 38, students: 34, teacher: 'Mrs. Davis', teacherId: 3 },
  { id: 4, name: 'SS2B', category: 'Senior Secondary', capacity: 40, students: 36, teacher: 'Mr. Wilson', teacherId: 4 },
];

// Subjects
const allSubjects = ['Further Mathematics', 'Yoruba', 'Chemistry', 'Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Biology'];

// Class-subject mapping
export const classSubjectMapping = [
  { classId: 1, subject: 'Mathematics', teacher: 'Mrs. Johnson' },
  { classId: 1, subject: 'Science', teacher: 'Mrs. Johnson' },
  { classId: 2, subject: 'Science', teacher: 'Mr. Thompson' },
  { classId: 2, subject: 'English', teacher: 'Mr. Thompson' },
  { classId: 3, subject: 'English', teacher: 'Mrs. Davis' },
  { classId: 3, subject: 'History', teacher: 'Mrs. Davis' },
  { classId: 4, subject: 'History', teacher: 'Mr. Wilson' },
];

const dataHealthRowsSeed: DataHealthRow[] = [
  {
    id: 'dh-1',
    teacherName: 'Mrs. Johnson',
    className: 'JSS1A',
    subject: 'Mathematics',
    attendanceCompliance: 92,
    lessonNotesOnTime: 84,
    assessmentTurnaroundDays: 2,
    medicalPickupLogUsage: 50,
    parentLoginRate: 78,
  },
  {
    id: 'dh-2',
    teacherName: 'Mr. Thompson',
    className: 'JSS2B',
    subject: 'Science',
    attendanceCompliance: 61,
    lessonNotesOnTime: 57,
    assessmentTurnaroundDays: 5,
    medicalPickupLogUsage: 35,
    parentLoginRate: 43,
  },
  {
    id: 'dh-3',
    teacherName: 'Mrs. Davis',
    className: 'SS1A',
    subject: 'English',
    attendanceCompliance: 74,
    lessonNotesOnTime: 63,
    assessmentTurnaroundDays: 4,
    medicalPickupLogUsage: 39,
    parentLoginRate: 57,
  },
  {
    id: 'dh-4',
    teacherName: 'Mr. Wilson',
    className: 'SS2B',
    subject: 'History',
    attendanceCompliance: 88,
    lessonNotesOnTime: 69,
    assessmentTurnaroundDays: 3,
    medicalPickupLogUsage: 42,
    parentLoginRate: 66,
  },
];

const staleDataAlertsSeed: DataHealthAlert[] = [
  {
    id: 1,
    severity: 'critical',
    message: 'No attendance for JSS2B Science since 2026-04-03.',
    date: '2026-04-09',
  },
  {
    id: 2,
    severity: 'warning',
    message: 'SS1A English lesson note overdue by 5 days.',
    date: '2026-04-09',
  },
  {
    id: 3,
    severity: 'warning',
    message: 'SS2B History assessments exceed 3-day grading SLA.',
    date: '2026-04-08',
  },
];

// Terms with editable dates
const terms: SchoolTerm[] = [
  { id: 1, name: '2025/2026 First Term', startDate: '2026-01-15', endDate: '2026-04-10', status: 'completed' },
  { id: 2, name: '2025/2026 Second Term', startDate: '2026-04-20', endDate: '2026-07-15', status: 'active' },
  { id: 3, name: '2025/2026 Third Term', startDate: '2026-08-01', endDate: '2026-11-20', status: 'upcoming' },
];

const stemSubjects = new Set(['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology']);

const inferDepartmentFromSubject = (subject: string) => {
  if (stemSubjects.has(subject)) return 'STEM';
  return 'Humanities';
};

const buildGradeDistributionFromAverage = (average: number, totalStudents: number) => {
  const safeTotal = Math.max(1, totalStudents);
  const shift = (average - 70) / 35;

  const weights = {
    A: Math.max(0.04, 0.10 + shift * 0.12),
    B: Math.max(0.08, 0.22 + shift * 0.08),
    C: Math.max(0.12, 0.32 - Math.abs(shift) * 0.06),
    D: Math.max(0.06, 0.20 - shift * 0.08),
    F: Math.max(0.03, 0.16 - shift * 0.10),
  };

  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const normalized = Object.fromEntries(
    Object.entries(weights).map(([grade, weight]) => [grade, weight / weightTotal]),
  ) as Record<'A' | 'B' | 'C' | 'D' | 'F', number>;

  const rawCounts = {
    A: Math.round(normalized.A * safeTotal),
    B: Math.round(normalized.B * safeTotal),
    C: Math.round(normalized.C * safeTotal),
    D: Math.round(normalized.D * safeTotal),
    F: Math.round(normalized.F * safeTotal),
  };

  const diff = safeTotal - Object.values(rawCounts).reduce((sum, count) => sum + count, 0);
  rawCounts.C += diff;

  return (Object.entries(rawCounts) as Array<[string, number]>).map(([grade, count]) => ({
    grade,
    count: Math.max(0, count),
  }));
};

const findClassNameById = (classId: number, sourceClasses: SchoolClass[]) => sourceClasses.find((entry) => entry.id === classId)?.name || `Class ${classId}`;

// Staff/users with status
export const staff: StaffMember[] = [
  { id: 1, name: 'Mrs. Johnson', role: 'Teacher', email: 'johnson@smfa.edu', status: 'active', lastActive: '2026-04-09T08:20:00' },
  { id: 2, name: 'Mr. Thompson', role: 'Teacher', email: 'thompson@smfa.edu', status: 'active', lastActive: '2026-04-09T09:10:00' },
  { id: 3, name: 'Mrs. Davis', role: 'Teacher', email: 'davis@smfa.edu', status: 'active', lastActive: '2026-04-08T16:40:00' },
  { id: 4, name: 'Mr. Brown', role: 'Principal', email: 'brown@smfa.edu', status: 'active', lastActive: '2026-04-09T07:50:00' },
  { id: 5, name: 'Ms. Lee', role: 'Bursar', email: 'lee@smfa.edu', status: 'inactive', lastActive: '2026-03-20T12:00:00' },
  { id: 6, name: 'Mrs. Stella Grant', role: 'Admin', email: 'stella.grant@smfa.edu', status: 'active', lastActive: '2026-04-09T09:42:00' },
  { id: 7, name: 'Mr. Kevin Jude', role: 'Gate Staff', email: 'kevin.jude@smfa.edu', status: 'pending_invitation', lastActive: null },
];

const staffRoleOptions: StaffRole[] = ['Teacher', 'Principal', 'Bursar', 'Admin', 'Gate Staff', 'School Nurse'];

// Feature flag audit trail
const flagAudit = [
  { flag: 'ai_generation', changedBy: 'Admin', from: false, to: true, changedAt: '2026-04-01 10:00' },
  { flag: 'require_approval', changedBy: 'Mr. Brown', from: true, to: false, changedAt: '2026-04-05 14:30' },
  { flag: 'result_gating', changedBy: 'Admin', from: true, to: true, changedAt: '2026-04-02 09:15' },
];

// Class Performance Data (FR-AD-05)
const classPerformanceByTerm: Record<'term1' | 'term2' | 'term3', ClassPerformanceRow[]> = {
  term1: [
    {
      classId: 1,
      className: 'Math 10A',
      averageScore: 75,
      medianScore: 76,
      passRate: 81,
      failRate: 19,
      attendanceRate: 89,
      previousAvg: 72,
      delta: '+3.0%',
      rank: 2,
      gradeDist: { A: 10, B: 15, C: 12, D: 5, F: 3 },
      totalStudents: 45,
      studentsAssessed: 45,
      atRiskStudents: [
        { id: 'm10a-01', name: 'David Cole', cumulativeAverage: 37.5 },
        { id: 'm10a-02', name: 'Nina Ross', cumulativeAverage: 34.2 },
      ],
    },
    {
      classId: 2,
      className: 'Science 9B',
      averageScore: 78,
      medianScore: 79,
      passRate: 84,
      failRate: 16,
      attendanceRate: 85,
      previousAvg: 75,
      delta: '+3.0%',
      rank: 1,
      gradeDist: { A: 12, B: 18, C: 8, D: 2, F: 2 },
      totalStudents: 42,
      studentsAssessed: 42,
      atRiskStudents: [
        { id: 's9b-01', name: 'Liam Harper', cumulativeAverage: 39.8 },
      ],
    },
    {
      classId: 3,
      className: 'English 11A',
      averageScore: 73,
      medianScore: 74,
      passRate: 77,
      failRate: 23,
      attendanceRate: 82,
      previousAvg: 75,
      delta: '-2.0%',
      rank: 4,
      gradeDist: { A: 7, B: 14, C: 10, D: 4, F: 3 },
      totalStudents: 38,
      studentsAssessed: 38,
      atRiskStudents: [
        { id: 'e11a-01', name: 'Grace Miller', cumulativeAverage: 32.1 },
        { id: 'e11a-02', name: 'Oscar Dean', cumulativeAverage: 38.7 },
      ],
    },
    {
      classId: 4,
      className: 'History 10B',
      averageScore: 74,
      medianScore: 75,
      passRate: 79,
      failRate: 21,
      attendanceRate: 86,
      previousAvg: 72,
      delta: '+2.0%',
      rank: 3,
      gradeDist: { A: 9, B: 16, C: 9, D: 4, F: 2 },
      totalStudents: 40,
      studentsAssessed: 40,
      atRiskStudents: [
        { id: 'h10b-01', name: 'James Kent', cumulativeAverage: 36.4 },
      ],
    },
  ],
  term2: [
    {
      classId: 1,
      className: 'Math 10A',
      averageScore: 78,
      medianScore: 80,
      passRate: 85,
      failRate: 15,
      attendanceRate: 92,
      previousAvg: 75,
      delta: '+3.0%',
      rank: 2,
      gradeDist: { A: 12, B: 18, C: 10, D: 3, F: 2 },
      totalStudents: 45,
      studentsAssessed: 45,
      atRiskStudents: [
        { id: 'm10a-01', name: 'David Cole', cumulativeAverage: 38.1 },
      ],
    },
    {
      classId: 2,
      className: 'Science 9B',
      averageScore: 82,
      medianScore: 84,
      passRate: 90,
      failRate: 10,
      attendanceRate: 88,
      previousAvg: 78,
      delta: '+4.0%',
      rank: 1,
      gradeDist: { A: 15, B: 20, C: 5, D: 1, F: 1 },
      totalStudents: 42,
      studentsAssessed: 42,
      atRiskStudents: [
        { id: 's9b-01', name: 'Liam Harper', cumulativeAverage: 35.5 },
      ],
    },
    {
      classId: 3,
      className: 'English 11A',
      averageScore: 75,
      medianScore: 76,
      passRate: 80,
      failRate: 20,
      attendanceRate: 85,
      previousAvg: 77,
      delta: '-2.0%',
      rank: 4,
      gradeDist: { A: 8, B: 15, C: 10, D: 3, F: 2 },
      totalStudents: 38,
      studentsAssessed: 38,
      atRiskStudents: [
        { id: 'e11a-01', name: 'Grace Miller', cumulativeAverage: 33.9 },
        { id: 'e11a-02', name: 'Oscar Dean', cumulativeAverage: 39.1 },
      ],
    },
    {
      classId: 4,
      className: 'History 10B',
      averageScore: 80,
      medianScore: 81,
      passRate: 88,
      failRate: 12,
      attendanceRate: 90,
      previousAvg: 76,
      delta: '+4.0%',
      rank: 3,
      gradeDist: { A: 10, B: 20, C: 6, D: 2, F: 2 },
      totalStudents: 40,
      studentsAssessed: 40,
      atRiskStudents: [
        { id: 'h10b-01', name: 'James Kent', cumulativeAverage: 37.4 },
      ],
    },
  ],
  term3: [
    {
      classId: 1,
      className: 'Math 10A',
      averageScore: 81,
      medianScore: 83,
      passRate: 89,
      failRate: 11,
      attendanceRate: 94,
      previousAvg: 78,
      delta: '+3.0%',
      rank: 2,
      gradeDist: { A: 14, B: 19, C: 8, D: 3, F: 1 },
      totalStudents: 45,
      studentsAssessed: 45,
      atRiskStudents: [
        { id: 'm10a-01', name: 'David Cole', cumulativeAverage: 39.2 },
      ],
    },
    {
      classId: 2,
      className: 'Science 9B',
      averageScore: 84,
      medianScore: 86,
      passRate: 92,
      failRate: 8,
      attendanceRate: 90,
      previousAvg: 82,
      delta: '+2.0%',
      rank: 1,
      gradeDist: { A: 17, B: 18, C: 5, D: 1, F: 1 },
      totalStudents: 42,
      studentsAssessed: 42,
      atRiskStudents: [],
    },
    {
      classId: 3,
      className: 'English 11A',
      averageScore: 77,
      medianScore: 79,
      passRate: 82,
      failRate: 18,
      attendanceRate: 87,
      previousAvg: 75,
      delta: '+2.0%',
      rank: 4,
      gradeDist: { A: 9, B: 16, C: 9, D: 3, F: 1 },
      totalStudents: 38,
      studentsAssessed: 38,
      atRiskStudents: [
        { id: 'e11a-02', name: 'Oscar Dean', cumulativeAverage: 38.8 },
      ],
    },
    {
      classId: 4,
      className: 'History 10B',
      averageScore: 83,
      medianScore: 84,
      passRate: 90,
      failRate: 10,
      attendanceRate: 91,
      previousAvg: 80,
      delta: '+3.0%',
      rank: 3,
      gradeDist: { A: 11, B: 21, C: 5, D: 2, F: 1 },
      totalStudents: 40,
      studentsAssessed: 40,
      atRiskStudents: [],
    },
  ],
};

// Subject performance per class (for drill-down)
const subjectPerformanceByTerm: Record<'term1' | 'term2' | 'term3', Record<number, { subject: string; average: number; passRate: number }[]>> = {
  term1: {
    1: [{ subject: 'Mathematics', average: 82, passRate: 88 }, { subject: 'Science', average: 69, passRate: 74 }],
    2: [{ subject: 'Science', average: 84, passRate: 90 }, { subject: 'English', average: 73, passRate: 82 }],
    3: [{ subject: 'English', average: 79, passRate: 84 }, { subject: 'History', average: 67, passRate: 70 }],
    4: [{ subject: 'History', average: 74, passRate: 79 }],
  },
  term2: {
    1: [{ subject: 'Mathematics', average: 85, passRate: 92 }, { subject: 'Science', average: 72, passRate: 78 }],
    2: [{ subject: 'Science', average: 88, passRate: 94 }, { subject: 'English', average: 76, passRate: 86 }],
    3: [{ subject: 'English', average: 82, passRate: 88 }, { subject: 'History', average: 68, passRate: 72 }],
    4: [{ subject: 'History', average: 80, passRate: 88 }],
  },
  term3: {
    1: [{ subject: 'Mathematics', average: 88, passRate: 94 }, { subject: 'Science', average: 75, passRate: 82 }],
    2: [{ subject: 'Science', average: 90, passRate: 96 }, { subject: 'English', average: 79, passRate: 88 }],
    3: [{ subject: 'English', average: 84, passRate: 89 }, { subject: 'History', average: 70, passRate: 76 }],
    4: [{ subject: 'History', average: 83, passRate: 90 }],
  },
};

// Enhanced audit logs with full metadata
const auditLogs: AuditLogEntry[] = [
  {
    id: 1,
    timestamp: '2026-04-09T10:22:15',
    actorName: 'Israel Macaulay',
    actorRole: 'admin',
    module: 'users',
    action: 'Role Updated for User #204',
    description: 'Changed role from Teacher to Principal.',
    riskLevel: 'high',
    ipAddress: '197.210.55.19',
    metadata: {
      before: { userId: 204, role: 'Teacher', permissions: ['grade.submit'] },
      after: { userId: 204, role: 'Principal', permissions: ['grade.submit', 'syllabus.approve', 'results.release'] },
    },
  },
  {
    id: 2,
    timestamp: '2026-04-09T09:41:08',
    actorName: 'Mr. Brown',
    actorRole: 'principal',
    module: 'syllabus',
    action: 'Approved Syllabus Week 3',
    description: 'Math 10A Week 3 approved after revision.',
    riskLevel: 'medium',
    ipAddress: '10.0.14.22',
    metadata: {
      before: { syllabusId: 3, status: 'submitted' },
      after: { syllabusId: 3, status: 'approved' },
    },
  },
  {
    id: 3,
    timestamp: '2026-04-09T08:58:43',
    actorName: 'Ms. Lee',
    actorRole: 'bursar',
    module: 'fees',
    action: 'Updated Fee Payment Record',
    description: 'Marked installment #2 as received for student #113.',
    riskLevel: 'low',
    ipAddress: '197.210.55.99',
    metadata: {
      before: { studentId: 113, installment2Paid: false, amountPaid: 45000 },
      after: { studentId: 113, installment2Paid: true, amountPaid: 90000 },
    },
  },
  {
    id: 4,
    timestamp: '2026-04-08T17:19:31',
    actorName: 'Admin',
    actorRole: 'admin',
    module: 'security',
    action: 'Password Reset Triggered',
    description: 'Forced password reset for user #302 after suspicious login attempts.',
    riskLevel: 'high',
    ipAddress: '154.73.22.8',
    metadata: {
      before: { userId: 302, resetRequired: false, failedAttempts: 4 },
      after: { userId: 302, resetRequired: true, failedAttempts: 4 },
    },
  },
  {
    id: 5,
    timestamp: '2026-04-08T14:03:57',
    actorName: 'Mrs. Johnson',
    actorRole: 'teacher',
    module: 'assessments',
    action: 'Updated Grade for Student #102',
    description: 'Assessment score adjusted after moderation.',
    riskLevel: 'medium',
    ipAddress: '10.0.10.50',
    metadata: {
      before: { studentId: 102, assessmentId: 'asm-203', score: 45 },
      after: { studentId: 102, assessmentId: 'asm-203', score: 85 },
    },
  },
  {
    id: 6,
    timestamp: '2026-04-08T12:44:20',
    actorName: 'School Nurse',
    actorRole: 'teacher',
    module: 'medical',
    action: 'Updated Medication Log',
    description: 'Medication status marked as administered for student #087.',
    riskLevel: 'low',
    ipAddress: '10.0.16.4',
    metadata: {
      before: { studentId: 87, status: 'pending', medication: 'Vitamin D' },
      after: { studentId: 87, status: 'administered', medication: 'Vitamin D' },
    },
  },
  {
    id: 7,
    timestamp: '2026-04-08T11:07:12',
    actorName: 'Mr. Brown',
    actorRole: 'principal',
    module: 'results',
    action: 'Released Term Results',
    description: 'Term 3 consolidated results published to parent portal.',
    riskLevel: 'high',
    ipAddress: '10.0.14.22',
    metadata: {
      before: { term: 'Term 3, 2026', isReleased: false },
      after: { term: 'Term 3, 2026', isReleased: true },
    },
  },
  {
    id: 8,
    timestamp: '2026-04-07T18:29:01',
    actorName: 'Admin',
    actorRole: 'admin',
    module: 'lesson_notes',
    action: 'Deleted Lesson Note Week 4',
    description: 'Removed duplicate note from Science 9B Week 4.',
    riskLevel: 'high',
    ipAddress: '197.210.55.19',
    metadata: {
      before: { noteId: 501, status: 'draft', title: 'Cell Transport Draft Copy' },
      after: { noteId: 501, deleted: true },
    },
  },
  {
    id: 9,
    timestamp: '2026-04-07T16:17:46',
    actorName: 'Mr. Thompson',
    actorRole: 'teacher',
    module: 'syllabus',
    action: 'Submitted Week 2 Syllabus',
    description: 'Science 9B Week 2 syllabus submitted for review.',
    riskLevel: 'medium',
    ipAddress: '10.0.10.62',
    metadata: {
      before: { syllabusId: 4, status: 'draft' },
      after: { syllabusId: 4, status: 'submitted' },
    },
  },
  {
    id: 10,
    timestamp: '2026-04-07T14:53:09',
    actorName: 'Admin',
    actorRole: 'admin',
    module: 'settings',
    action: 'Updated Result Gating Flag',
    description: 'Result gating changed from strict to partial.',
    riskLevel: 'medium',
    ipAddress: '197.210.55.19',
    metadata: {
      before: { resultGating: 'strict' },
      after: { resultGating: 'partial' },
    },
  },
];

// Mock Syllabus Data (for admin view)
const syllabiSeed: SyllabusEntry[] = [
  {
    id: 1,
    class: 'Math 10A',
    subject: 'Mathematics',
    department: 'STEM',
    term: 'Term 2, 2026',
    week: 1,
    title: 'Introduction to Algebra',
    status: 'approved',
    teacher: 'Mrs. Johnson',
    submittedDate: '2026-04-01',
    approvedDate: '2026-04-02',
    learningObjectives: ['Define algebraic terms', 'Solve one-step equations', 'Translate word problems into equations'],
    weeklyTopics: ['Algebra foundations', 'Variables and expressions', 'Equation balancing'],
    resources: ['Teacher slides', 'Workbook Ch. 1', 'Practice sheet A'],
    rejectionLogs: [],
    revisionCount: 0,
    versionHistory: [
      { status: 'draft_created', at: '2026-03-30T10:00:00', by: 'Mrs. Johnson' },
      { status: 'submitted', at: '2026-04-01T09:12:00', by: 'Mrs. Johnson' },
      { status: 'approved', at: '2026-04-02T12:02:00', by: 'Mr. Brown' },
    ],
  },
  {
    id: 2,
    class: 'Math 10A',
    subject: 'Mathematics',
    department: 'STEM',
    term: 'Term 2, 2026',
    week: 2,
    title: 'Linear Equations',
    status: 'approved',
    teacher: 'Mrs. Johnson',
    submittedDate: '2026-04-03',
    approvedDate: '2026-04-04',
    learningObjectives: ['Model linear relations', 'Graph in slope-intercept form'],
    weeklyTopics: ['Gradient and intercept', 'Graph construction', 'Interpretation'],
    resources: ['Graph worksheet', 'Interactive simulation'],
    rejectionLogs: [],
    revisionCount: 0,
    versionHistory: [
      { status: 'draft_created', at: '2026-04-01T11:00:00', by: 'Mrs. Johnson' },
      { status: 'submitted', at: '2026-04-03T13:10:00', by: 'Mrs. Johnson' },
      { status: 'approved', at: '2026-04-04T08:45:00', by: 'Mr. Brown' },
    ],
  },
  {
    id: 3,
    class: 'Math 10A',
    subject: 'Mathematics',
    department: 'STEM',
    term: 'Term 2, 2026',
    week: 3,
    title: 'Quadratic Functions',
    status: 'submitted',
    teacher: 'Mrs. Johnson',
    submittedDate: '2026-04-06',
    approvedDate: null,
    learningObjectives: ['Recognize quadratic forms', 'Interpret parabola characteristics'],
    weeklyTopics: ['Quadratic notation', 'Axis of symmetry', 'Vertex interpretation'],
    resources: ['Textbook pp. 24-35', 'Demo graph cards'],
    rejectionLogs: [],
    revisionCount: 0,
    versionHistory: [
      { status: 'draft_created', at: '2026-04-05T14:00:00', by: 'Mrs. Johnson' },
      { status: 'submitted', at: '2026-04-06T09:40:00', by: 'Mrs. Johnson' },
    ],
  },
  {
    id: 4,
    class: 'Science 9B',
    subject: 'Science',
    department: 'STEM',
    term: 'Term 2, 2026',
    week: 2,
    title: 'Cell Biology',
    status: 'submitted',
    teacher: 'Mr. Thompson',
    submittedDate: '2026-04-06',
    approvedDate: null,
    learningObjectives: ['Describe cell structures', 'Compare plant and animal cells'],
    weeklyTopics: ['Cell organelles', 'Microscopy practical', 'Cell transport'],
    resources: ['Lab guide', 'Slide deck', 'Microscope checklist'],
    rejectionLogs: [],
    revisionCount: 0,
    versionHistory: [
      { status: 'draft_created', at: '2026-04-04T08:10:00', by: 'Mr. Thompson' },
      { status: 'submitted', at: '2026-04-06T10:20:00', by: 'Mr. Thompson' },
    ],
  },
  {
    id: 5,
    class: 'English 11A',
    subject: 'English',
    department: 'Humanities',
    term: 'Term 2, 2026',
    week: 1,
    title: 'Shakespeare Analysis',
    status: 'rejected',
    teacher: 'Mrs. Davis',
    submittedDate: '2026-04-05',
    approvedDate: null,
    learningObjectives: ['Analyze dramatic language', 'Build evidence-based interpretation'],
    weeklyTopics: ['Context setup', 'Act structure', 'Character motives'],
    resources: ['Annotated scenes', 'Close-reading prompts'],
    rejectionLogs: [
      { at: '2026-04-05T16:30:00', reason: 'Insufficient detail on scaffolded questioning for mixed-ability learners.', by: 'Mr. Brown' },
    ],
    revisionCount: 1,
    versionHistory: [
      { status: 'draft_created', at: '2026-04-03T11:00:00', by: 'Mrs. Davis' },
      { status: 'submitted', at: '2026-04-05T09:00:00', by: 'Mrs. Davis' },
      { status: 'rejected', at: '2026-04-05T16:30:00', by: 'Mr. Brown', note: 'Add deeper textual analysis strategy.' },
      { status: 'resubmitted', at: '2026-04-06T11:00:00', by: 'Mrs. Davis', note: 'Expanded prompts and exemplars.' },
    ],
  },
  {
    id: 6,
    class: 'History 10B',
    subject: 'History',
    department: 'Humanities',
    term: 'Term 2, 2026',
    week: 2,
    title: 'Industrial Revolution Foundations',
    status: 'draft',
    teacher: 'Mr. Wilson',
    submittedDate: null,
    approvedDate: null,
    learningObjectives: ['Explain social causes of industrialization', 'Interpret timeline evidence'],
    weeklyTopics: ['Agrarian transition', 'Factory system', 'Urban migration'],
    resources: ['Primary source pack', 'Timeline kit'],
    rejectionLogs: [],
    revisionCount: 0,
    versionHistory: [{ status: 'draft_created', at: '2026-04-07T10:20:00', by: 'Mr. Wilson' }],
  },
];

// Mock Lesson Notes Data
const lessonNotesSeed: AdminLessonNote[] = [
  {
    id: 1,
    class: 'Math 10A',
    subject: 'Mathematics',
    department: 'STEM',
    week: 1,
    title: 'Algebra Lesson Plan',
    status: 'approved',
    teacher: 'Mrs. Johnson',
    generatedBy: 'AI',
    submittedDate: '2026-04-02',
    approvedDate: '2026-04-03',
    content: 'Learning objectives: solve single-variable equations and translate word problems to algebraic expressions. Includes warm-up, guided practice, and exit ticket.',
    syllabusMatch: true,
    linkedMaterials: [
      { id: 'asm-201', type: 'Quiz', title: 'Algebra Quick Check' },
      { id: 'asm-202', type: 'Homework', title: 'Linear Practice Set A' },
    ],
  },
  {
    id: 2,
    class: 'Math 10A',
    subject: 'Mathematics',
    department: 'STEM',
    week: 2,
    title: 'Linear Equations Lesson',
    status: 'approved',
    teacher: 'Mrs. Johnson',
    generatedBy: 'Manual',
    submittedDate: '2026-04-04',
    approvedDate: '2026-04-05',
    content: 'Lesson flow: concept recap, slope-intercept demonstration, peer discussion, and formative checks. Differentiated tasks for varied learner readiness.',
    syllabusMatch: true,
    linkedMaterials: [{ id: 'asm-203', type: 'Exam', title: 'Linear Mid-Topic Assessment' }],
  },
  {
    id: 3,
    class: 'Science 9B',
    subject: 'Science',
    department: 'STEM',
    week: 2,
    title: 'Cell Theory Notes',
    status: 'submitted',
    teacher: 'Mr. Thompson',
    generatedBy: 'AI',
    submittedDate: '2026-04-06',
    approvedDate: null,
    content: 'Introduces cell theory, microscope use protocol, and observation rubric. Includes practical segment and lab safety notes.',
    syllabusMatch: true,
    linkedMaterials: [{ id: 'asm-204', type: 'Homework', title: 'Cell Diagram Worksheet' }],
  },
  {
    id: 4,
    class: 'English 11A',
    subject: 'English',
    department: 'Humanities',
    week: 1,
    title: 'Shakespeare Overview',
    status: 'rejected',
    teacher: 'Mrs. Davis',
    generatedBy: 'Manual',
    submittedDate: '2026-04-05',
    approvedDate: null,
    content: 'Background context and author profile. Missing robust textual analysis strategy and differentiated questioning framework.',
    syllabusMatch: false,
    linkedMaterials: [],
    rejectionFeedback: 'Needs more examples',
  },
  {
    id: 5,
    class: 'History 10B',
    subject: 'History',
    department: 'Humanities',
    week: 2,
    title: 'Industrial Revolution Drivers',
    status: 'submitted',
    teacher: 'Mr. Wilson',
    generatedBy: 'Imported',
    submittedDate: '2026-04-07',
    approvedDate: null,
    content: 'Explores social and economic factors behind industrialization with source document analysis and timeline activity.',
    syllabusMatch: true,
    linkedMaterials: [{ id: 'asm-205', type: 'Quiz', title: 'Industrialization Causes Quiz' }],
  },
  {
    id: 6,
    class: 'Science 9B',
    subject: 'Science',
    department: 'STEM',
    week: 3,
    title: 'Photosynthesis Foundations',
    status: 'draft',
    teacher: 'Mr. Thompson',
    generatedBy: 'AI',
    submittedDate: '2026-04-08',
    approvedDate: null,
    content: 'Draft plan for introducing photosynthesis with concept map starter, chlorophyll simulation, and reflection checkpoint.',
    syllabusMatch: true,
    linkedMaterials: [],
  },
];

// Available roles for filtering
const roles = ['admin', 'principal', 'teacher', 'bursar', 'parent', 'student'];
const modules = ['syllabus', 'lesson_notes', 'fees', 'results', 'users', 'settings', 'assessments', 'medical', 'security'];

export function AdminDashboard() {
  const navigate = useNavigate();
  const hasInitializedPerformanceDefaults = useRef(false);

  const [activeSection, setActiveSection] = useState<'school' | 'users' | 'audit' | 'performance' | 'syllabus' | 'lesson_note' | 'data_health' | 'result_approvals'>('performance');
  const [selectedDateRange, setSelectedDateRange] = useState<'term1' | 'term2' | 'term3' | 'custom'>('term2');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [classSearch, setClassSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'className' | 'averageScore' | 'passRate' | 'attendanceRate' | 'delta' | 'rank'; direction: 'asc' | 'desc' }>({
    key: 'rank',
    direction: 'asc',
  });
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);
  const [lessonNotes, setLessonNotes] = useState<AdminLessonNote[]>(lessonNotesSeed);
  const [lessonNoteFilters, setLessonNoteFilters] = useState({
    department: '',
    teacher: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLessonNoteId, setSelectedLessonNoteId] = useState<number | null>(null);
  const [selectedLessonNoteIds, setSelectedLessonNoteIds] = useState<number[]>([]);
  const [showLessonPreviewModal, setShowLessonPreviewModal] = useState(false);
  const [showRejectMode, setShowRejectMode] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [qualityPrivateNote, setQualityPrivateNote] = useState('');
  const [syllabi, setSyllabi] = useState<SyllabusEntry[]>(syllabiSeed);
  const [expandedSyllabusIds, setExpandedSyllabusIds] = useState<number[]>([]);
  const [selectedSyllabusIds, setSelectedSyllabusIds] = useState<number[]>([]);
  const [criticalOverrideEnabled, setCriticalOverrideEnabled] = useState(false);
  const [syllabusRevisionNote, setSyllabusRevisionNote] = useState<Record<number, string>>({});
  const [showSyllabusHistoryModal, setShowSyllabusHistoryModal] = useState(false);
  const [selectedSyllabusHistoryEntry, setSelectedSyllabusHistoryEntry] = useState<SyllabusEntry | null>(null);
  const [syllabusFilters, setSyllabusFilters] = useState({
    term: 'Term 2, 2026',
    department: '',
    teacher: '',
    complianceStatus: '',
    missingWeek: '',
  });
  
  // Feature flags state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [resultGating, setResultGating] = useState(true);
  
  // Term editing state
  const [editingTerm, setEditingTerm] = useState<SchoolTerm | null>(null);
  const [showTermModal, setShowTermModal] = useState(false);
  
  // User management state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, setUsers] = useState<StaffMember[]>(staff);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [openUserActionId, setOpenUserActionId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('Teacher');
  const [inviteError, setInviteError] = useState('');
  const [csvImportError, setCsvImportError] = useState('');
  const [confirmDeactivateUser, setConfirmDeactivateUser] = useState<StaffMember | null>(null);
  const [roleEditTarget, setRoleEditTarget] = useState<StaffMember | null>(null);
  const [pendingRoleValue, setPendingRoleValue] = useState<StaffRole>('Teacher');

  const [schoolSection, setSchoolSection] = useState<'policy' | 'classes' | 'subjects' | 'calendar' | 'assessments'>('policy');
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>(classes);
  const [schoolSubjects, setSchoolSubjects] = useState<string[]>(allSubjects);
  const [schoolSubjectMappings, setSchoolSubjectMappings] = useState<Array<{ classId: number; subject: string }>>([
    { classId: 1, subject: 'Mathematics' },
    { classId: 1, subject: 'Science' },
    { classId: 2, subject: 'Science' },
    { classId: 2, subject: 'English' },
    { classId: 3, subject: 'English' },
    { classId: 3, subject: 'History' },
    { classId: 4, subject: 'History' },
  ]);
  const [schoolTerms, setSchoolTerms] = useState<SchoolTerm[]>(terms);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [classDraft, setClassDraft] = useState<{ name: string; category: SchoolClass['category']; capacity: string }>({
    name: '',
    category: 'Junior Secondary',
    capacity: '',
  });
  const [termDraft, setTermDraft] = useState<SchoolTerm>({
    id: 0,
    name: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
  });
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<SchoolClass | null>(null);
  const [confirmActivateTerm, setConfirmActivateTerm] = useState<SchoolTerm | null>(null);
  const [selectedSubjectsForClass, setSelectedSubjectsForClass] = useState<string[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectName, setEditingSubjectName] = useState<string | null>(null);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [confirmDeleteSubject, setConfirmDeleteSubject] = useState<string | null>(null);
  const [testSchedule, setTestSchedule] = useState<AssessmentSchedule>({
    id: 1,
    title: 'Unified Test',
    week: 'Week 7',
    date: '2026-05-08',
    time: '09:00',
    notes: 'All classes sit the same test window where applicable.',
    timetable: [
      { day: 'Monday', time: '09:00 - 10:30', venue: 'Main Hall', subjectOrPaper: 'Mathematics' },
      { day: 'Tuesday', time: '09:00 - 10:00', venue: 'Hall B', subjectOrPaper: 'English' },
    ],
  });
  const [examSchedule, setExamSchedule] = useState<AssessmentSchedule>({
    id: 2,
    title: 'Unified Exam',
    week: 'Week 12',
    date: '2026-07-10',
    time: '08:30',
    notes: 'End-of-term exam timetable for all classes.',
    timetable: [
      { day: 'Monday', time: '08:30 - 10:30', venue: 'Main Hall', subjectOrPaper: 'Mathematics' },
      { day: 'Wednesday', time: '08:30 - 10:00', venue: 'Hall C', subjectOrPaper: 'Science' },
    ],
  });
  const [assessmentForm, setAssessmentForm] = useState<{ kind: 'test' | 'exam'; day: string; time: string; venue: string; subjectOrPaper: string }>({
    kind: 'test',
    day: '',
    time: '',
    venue: '',
    subjectOrPaper: '',
  });

  // Result Approvals state
  const [gradeWeightingConfigs, setGradeWeightingConfigs] = useState<GradeWeightingConfig[]>(() => {
    try {
      const stored = localStorage.getItem('teacher-dashboard:grade-weighting-configs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [approvalFilters, setApprovalFilters] = useState({
    status: '',
    term: '',
    teacherName: '',
  });
  const [selectedReviewConfig, setSelectedReviewConfig] = useState<GradeWeightingConfig | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showResultPreviewSheet, setShowResultPreviewSheet] = useState(false);
  const [resultPreviewData, setResultPreviewData] = useState<ResultPreviewData | null>(null);
  
  // Class-subject mapping state
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedClassForMapping, setSelectedClassForMapping] = useState<any>(null);
  
  // Class performance drill-down
  const [selectedClassForDrill, setSelectedClassForDrill] = useState<any>(null);
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  // Audit log filters
  const [auditFilters, setAuditFilters] = useState({
    search: '',
    role: '',
    module: '',
    datePreset: 'custom',
    startDate: '',
    endDate: '',
    highRiskOnly: false,
  });
  const [auditPage, setAuditPage] = useState(1);
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditLogEntry | null>(null);
  const [showAuditMetadataModal, setShowAuditMetadataModal] = useState(false);
  
  // Flag audit visibility
  const [showFlagAudit, setShowFlagAudit] = useState(false);
  const [dataHealthRows] = useState<DataHealthRow[]>(dataHealthRowsSeed);
  const [staleDataAlerts] = useState<DataHealthAlert[]>(staleDataAlertsSeed);
  const [selectedDataHealthRows, setSelectedDataHealthRows] = useState<string[]>([]);
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);
  const [dataHealthSortBy, setDataHealthSortBy] = useState<'worst' | 'attendance' | 'lesson_notes' | 'turnaround'>('worst');

  const normalizeWithRank = (rows: ClassPerformanceRow[]) => {
    const ranked = [...rows]
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return ranked;
  };

  const customRangePerformance = useMemo(() => {
    const base = classPerformanceByTerm.term2;
    if (!customDateRange.start || !customDateRange.end) return normalizeWithRank(base);

    const start = new Date(customDateRange.start).getTime();
    const end = new Date(customDateRange.end).getTime();
    const dayDiff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const modifier = Math.max(-4, Math.min(4, Math.round((dayDiff - 40) / 25)));

    const adjusted = base.map((row) => {
      const avg = Math.max(40, Math.min(99, row.averageScore + modifier));
      const pass = Math.max(55, Math.min(99, row.passRate + modifier));
      const attendance = Math.max(70, Math.min(99, row.attendanceRate + Math.round(modifier / 2)));
      const trendValue = avg - row.previousAvg;

      return {
        ...row,
        averageScore: avg,
        passRate: pass,
        attendanceRate: attendance,
        failRate: 100 - pass,
        delta: `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`,
      };
    });

    return normalizeWithRank(adjusted);
  }, [customDateRange.end, customDateRange.start]);

  const classPerformance = useMemo(() => {
    if (selectedDateRange === 'custom') return customRangePerformance;
    return normalizeWithRank(classPerformanceByTerm[selectedDateRange]);
  }, [customRangePerformance, selectedDateRange]);

  const selectedSubjectPerformance = useMemo(() => {
    if (!selectedClassForDrill) return [];
    const termKey = selectedDateRange === 'custom' ? 'term2' : selectedDateRange;
    return subjectPerformanceByTerm[termKey]?.[selectedClassForDrill.classId] || [];
  }, [selectedClassForDrill, selectedDateRange]);

  const classMappedSubjectsForDrill = useMemo(() => {
    if (!selectedClassForDrill) return [];
    return Array.from(
      new Set(
        schoolSubjectMappings
          .filter((mapping) => mapping.classId === selectedClassForDrill.classId)
          .map((mapping) => mapping.subject),
      ),
    );
  }, [schoolSubjectMappings, selectedClassForDrill]);

  const selectedSubjectTrendData = useMemo(() => {
    if (!selectedClassForDrill || !selectedSubjectId) return [];

    const termSequence: Array<'term1' | 'term2' | 'term3'> = ['term1', 'term2', 'term3'];
    const termLabel: Record<'term1' | 'term2' | 'term3', string> = {
      term1: 'Term 1',
      term2: 'Term 2',
      term3: 'Term 3',
    };

    return termSequence
      .map((term) => {
        const found = (subjectPerformanceByTerm[term]?.[selectedClassForDrill.classId] || []).find(
          (entry) => entry.subject === selectedSubjectId,
        );

        if (!found) return null;

        return {
          term,
          termLabel: termLabel[term],
          average: found.average,
          passRate: found.passRate,
        };
      })
      .filter((entry): entry is { term: 'term1' | 'term2' | 'term3'; termLabel: string; average: number; passRate: number } => Boolean(entry));
  }, [selectedClassForDrill, selectedSubjectId]);

  const selectedSubjectKpis = useMemo(() => {
    if (!selectedClassForDrill || !selectedSubjectId || !selectedSubjectTrendData.length) {
      return null;
    }

    const scores = selectedSubjectTrendData.map((point) => point.average);
    const subjectAverage = Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const classNameForCompliance = schoolClasses.find((entry) => entry.id === selectedClassForDrill.classId)?.name;
    const matchingHealthRows = dataHealthRows.filter(
      (row) => row.className === classNameForCompliance && row.subject === selectedSubjectId,
    );
    const teacherComplianceRate =
      matchingHealthRows.length > 0
        ? Math.round(
            (matchingHealthRows.reduce((sum, row) => sum + row.lessonNotesOnTime, 0) / matchingHealthRows.length) * 10,
          ) / 10
        : null;

    return {
      subjectAverage,
      highestScore,
      lowestScore,
      teacherComplianceRate,
    };
  }, [dataHealthRows, schoolClasses, selectedClassForDrill, selectedSubjectId, selectedSubjectTrendData]);

  useEffect(() => {
    if (!selectedSubjectDetail) return;
    if (!classMappedSubjectsForDrill.includes(selectedSubjectDetail)) {
      setSelectedSubjectDetail('');
    }
  }, [classMappedSubjectsForDrill, selectedSubjectDetail]);

  useEffect(() => {
    if (!selectedSubjectId) {
      if (selectedSubjectDetail) setSelectedSubjectDetail('');
      return;
    }

    if (selectedSubjectDetail !== selectedSubjectId) {
      setSelectedSubjectDetail(selectedSubjectId);
    }
  }, [selectedSubjectDetail, selectedSubjectId]);

  const selectedDeepDiveSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return selectedSubjectPerformance.find((subject) => subject.subject === selectedSubjectId) || null;
  }, [selectedSubjectId, selectedSubjectPerformance]);

  const deepDiveSubjectTrendData = useMemo(() => {
    if (!selectedDeepDiveSubject) return [];

    const weeklyAdjustments = [-4, -1, 2, 0, 3, 1];

    return weeklyAdjustments.map((adjustment, index) => {
      const value = Math.max(0, Math.min(100, selectedDeepDiveSubject.average + adjustment));
      return {
        week: `W${index + 1}`,
        average: Math.round(value * 10) / 10,
      };
    });
  }, [selectedDeepDiveSubject]);

  const filteredAtRiskStudents = useMemo(() => {
    if (!selectedClassForDrill) return [] as AtRiskStudent[];
    if (!selectedSubjectId) return selectedClassForDrill.atRiskStudents as AtRiskStudent[];

    const subjectSalt = selectedSubjectId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const baseStudents = (selectedClassForDrill.atRiskStudents || []) as AtRiskStudent[];

    return baseStudents
      .map((student) => {
        const idSalt = student.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const subjectScore = Math.max(
          0,
          Math.min(100, Math.round(student.cumulativeAverage + ((subjectSalt % 11) - 5) + ((idSalt % 9) - 4))),
        );

        return {
          ...student,
          cumulativeAverage: subjectScore,
        };
      })
      .filter((student) => student.cumulativeAverage < 40);
  }, [selectedClassForDrill, selectedSubjectId]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    if (!selectedSubjectPerformance.some((subject) => subject.subject === selectedSubjectId)) {
      setSelectedSubjectId(null);
    }
  }, [selectedSubjectId, selectedSubjectPerformance]);

  useEffect(() => {
    if (activeSection !== 'performance') return;
    if (hasInitializedPerformanceDefaults.current) return;
    if (!classPerformance.length) return;

    const fallbackClass = classPerformance[0];
    const fallbackSubject = (subjectPerformanceByTerm[selectedDateRange === 'custom' ? 'term2' : selectedDateRange]?.[fallbackClass.classId] || [])[0]?.subject || null;

    setSelectedClassForDrill(fallbackClass);
    setSelectedSubjectId(fallbackSubject);
    setSelectedSubjectDetail(fallbackSubject || '');
    hasInitializedPerformanceDefaults.current = true;
  }, [activeSection, classPerformance, selectedDateRange]);

  useEffect(() => {
    if (activeSection !== 'performance') return;
    console.debug('[AdminDashboard][Performance Debug]', {
      selectedClassForDrill,
      selectedSubjectId,
      classPerformanceCount: classPerformance.length,
      selectedSubjectPerformanceCount: selectedSubjectPerformance.length,
      selectedSubjectTrendDataCount: selectedSubjectTrendData.length,
      filteredAtRiskStudentsCount: filteredAtRiskStudents.length,
    });
  }, [
    activeSection,
    classPerformance.length,
    filteredAtRiskStudents.length,
    selectedClassForDrill,
    selectedSubjectId,
    selectedSubjectPerformance.length,
    selectedSubjectTrendData.length,
  ]);

  const gradeDistributionData = useMemo(() => {
    if (!selectedClassForDrill) return [];

    if (selectedDeepDiveSubject) {
      const studentCount = selectedClassForDrill.studentsAssessed || selectedClassForDrill.totalStudents || 0;
      return buildGradeDistributionFromAverage(selectedDeepDiveSubject.average, studentCount);
    }

    const entries = Object.entries(selectedClassForDrill.gradeDist) as Array<[string, number]>;
    return entries.map(([grade, count]) => ({ grade, count }));
  }, [selectedClassForDrill, selectedDeepDiveSubject]);

  const schoolAverageScore = useMemo(() => {
    if (!classPerformance.length) return 0;
    const sum = classPerformance.reduce((acc, row) => acc + row.averageScore, 0);
    return Math.round((sum / classPerformance.length) * 10) / 10;
  }, [classPerformance]);

  const globalPassRate = useMemo(() => {
    const totals = classPerformance.reduce(
      (acc, row) => {
        const passCount = Math.round((row.passRate / 100) * row.totalStudents);
        return {
          students: acc.students + row.totalStudents,
          passed: acc.passed + passCount,
        };
      },
      { students: 0, passed: 0 },
    );

    if (!totals.students) return 0;
    return Math.round((totals.passed / totals.students) * 1000) / 10;
  }, [classPerformance]);

  const averageAttendance = useMemo(() => {
    if (!classPerformance.length) return 0;
    const sum = classPerformance.reduce((acc, row) => acc + row.attendanceRate, 0);
    return Math.round((sum / classPerformance.length) * 10) / 10;
  }, [classPerformance]);

  const parseTrend = (value: string) => Number(value.replace('%', ''));

  const filteredAndSortedClassPerformance = useMemo(() => {
    const filtered = classPerformance.filter((row) =>
      row.className.toLowerCase().includes(classSearch.toLowerCase()),
    );

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;
      if (sortConfig.key === 'className') {
        result = a.className.localeCompare(b.className);
      }
      if (sortConfig.key === 'averageScore') {
        result = a.averageScore - b.averageScore;
      }
      if (sortConfig.key === 'passRate') {
        result = a.passRate - b.passRate;
      }
      if (sortConfig.key === 'attendanceRate') {
        result = a.attendanceRate - b.attendanceRate;
      }
      if (sortConfig.key === 'delta') {
        result = parseTrend(a.delta) - parseTrend(b.delta);
      }
      if (sortConfig.key === 'rank') {
        result = a.rank - b.rank;
      }

      return sortConfig.direction === 'asc' ? result : -result;
    });

    return sorted;
  }, [classPerformance, classSearch, sortConfig.direction, sortConfig.key]);

  const handleSort = (key: 'className' | 'averageScore' | 'passRate' | 'attendanceRate' | 'delta' | 'rank') => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key,
        direction: key === 'className' || key === 'rank' ? 'asc' : 'desc',
      };
    });
  };

  const activeRangeLabel = useMemo(() => {
    if (selectedDateRange === 'custom') {
      if (!customDateRange.start || !customDateRange.end) return 'Custom Range (select dates)';
      return `${customDateRange.start} to ${customDateRange.end}`;
    }

    const labelMap = {
      term1: 'Term 1, 2026',
      term2: 'Term 2, 2026',
      term3: 'Term 3, 2026',
      custom: 'Custom Range',
    };

    return labelMap[selectedDateRange];
  }, [customDateRange.end, customDateRange.start, selectedDateRange]);

  useEffect(() => {
    if (activeSection !== 'performance') return;
    setIsPerformanceLoading(true);
    const timer = window.setTimeout(() => setIsPerformanceLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, [activeSection, selectedDateRange, customDateRange.start, customDateRange.end]);

  // Handlers
  const handleToggleFlag = (flag: string, setter: Function, value: boolean) => {
    setter(!value);
    alert(`Flag ${flag} changed to ${!value}. Audit logged.`);
  };

  const handleUpdateTerm = () => {
    setShowTermModal(false);
    setEditingTerm(null);
  };

  const handleSaveClass = () => {
    const capacity = Number(classDraft.capacity);
    if (!classDraft.name.trim() || Number.isNaN(capacity)) return;

    if (editingClassId) {
      setSchoolClasses((prev) =>
        prev.map((entry) =>
          entry.id === editingClassId
            ? { ...entry, name: classDraft.name.trim(), category: classDraft.category, capacity }
            : entry,
        ),
      );
    } else {
      const nextId = schoolClasses.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
      setSchoolClasses((prev) => [
        ...prev,
        {
          id: nextId,
          name: classDraft.name.trim(),
          category: classDraft.category,
          capacity,
          students: 0,
          teacher: 'Unassigned',
          teacherId: 0,
        },
      ]);
    }

    setShowClassModal(false);
    setEditingClassId(null);
    setClassDraft({ name: '', category: 'Junior Secondary', capacity: '' });
  };

  const handleDeleteClass = () => {
    if (!confirmDeleteClass) return;
    setSchoolClasses((prev) => prev.filter((entry) => entry.id !== confirmDeleteClass.id));
    setSchoolSubjectMappings((prev) => prev.filter((mapping) => mapping.classId !== confirmDeleteClass.id));
    setConfirmDeleteClass(null);
  };

  const handleSaveSubject = () => {
    const nextSubject = subjectDraft.trim();
    if (!nextSubject) return;

    setSchoolSubjects((prev) => {
      if (editingSubjectName) {
        return prev.map((subject) => (subject === editingSubjectName ? nextSubject : subject));
      }
      if (prev.some((subject) => subject.toLowerCase() === nextSubject.toLowerCase())) return prev;
      return [...prev, nextSubject];
    });

    setSchoolSubjectMappings((prev) =>
      prev.map((mapping) =>
        editingSubjectName && mapping.subject === editingSubjectName ? { ...mapping, subject: nextSubject } : mapping,
      ),
    );

    setSubjectDraft('');
    setEditingSubjectName(null);
    setShowSubjectModal(false);
  };

  const handleDeleteSubject = () => {
    if (!confirmDeleteSubject) return;
    setSchoolSubjects((prev) => prev.filter((subject) => subject !== confirmDeleteSubject));
    setSchoolSubjectMappings((prev) => prev.filter((mapping) => mapping.subject !== confirmDeleteSubject));
    setConfirmDeleteSubject(null);
  };

  const handleAddAssessmentTimetableItem = () => {
    if (!assessmentForm.day.trim() || !assessmentForm.time.trim() || !assessmentForm.venue.trim() || !assessmentForm.subjectOrPaper.trim()) return;

    const nextItem: AssessmentTimetableItem = {
      day: assessmentForm.day.trim(),
      time: assessmentForm.time.trim(),
      venue: assessmentForm.venue.trim(),
      subjectOrPaper: assessmentForm.subjectOrPaper.trim(),
    };

    if (assessmentForm.kind === 'test') {
      setTestSchedule((prev) => ({ ...prev, timetable: [...prev.timetable, nextItem] }));
    } else {
      setExamSchedule((prev) => ({ ...prev, timetable: [...prev.timetable, nextItem] }));
    }

    setAssessmentForm((prev) => ({ ...prev, day: '', time: '', venue: '', subjectOrPaper: '' }));
  };

  const updateAssessmentSchedule = (kind: 'test' | 'exam', field: 'week' | 'date' | 'time' | 'notes', value: string) => {
    const setter = kind === 'test' ? setTestSchedule : setExamSchedule;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const openSubjectEditor = (subject?: string) => {
    if (subject) {
      setEditingSubjectName(subject);
      setSubjectDraft(subject);
    } else {
      setEditingSubjectName(null);
      setSubjectDraft('');
    }
    setShowSubjectModal(true);
  };

  const openClassEditor = (schoolClass?: SchoolClass) => {
    if (schoolClass) {
      setEditingClassId(schoolClass.id);
      setClassDraft({
        name: schoolClass.name,
        category: schoolClass.category,
        capacity: String(schoolClass.capacity),
      });
    } else {
      setEditingClassId(null);
      setClassDraft({ name: '', category: 'Junior Secondary', capacity: '' });
    }
    setShowClassModal(true);
  };

  const openMappingEditor = (schoolClass: SchoolClass) => {
    setSelectedClassForMapping(schoolClass);
    setSelectedSubjectsForClass(
      schoolSubjectMappings.filter((mapping) => mapping.classId === schoolClass.id).map((mapping) => mapping.subject),
    );
    setShowMappingModal(true);
  };

  const handleSaveMapping = () => {
    if (!selectedClassForMapping) return;
    setSchoolSubjectMappings((prev) => {
      const remaining = prev.filter((mapping) => mapping.classId !== selectedClassForMapping.id);
      const mapped = selectedSubjectsForClass.map((subject) => ({ classId: selectedClassForMapping.id, subject }));
      return [...remaining, ...mapped];
    });
    setShowMappingModal(false);
    setSelectedClassForMapping(null);
  };

  const openTermEditor = (term?: SchoolTerm) => {
    if (term) {
      setEditingTerm(term);
      setTermDraft(term);
    } else {
      setEditingTerm(null);
      setTermDraft({
        id: schoolTerms.reduce((max, entry) => Math.max(max, entry.id), 0) + 1,
        name: '',
        startDate: '',
        endDate: '',
        status: 'upcoming',
      });
    }
    setShowTermModal(true);
  };

  const handleSaveTerm = () => {
    if (!termDraft.name.trim() || !termDraft.startDate || !termDraft.endDate) return;

    setSchoolTerms((prev) => {
      if (editingTerm) {
        return prev.map((entry) => (entry.id === editingTerm.id ? termDraft : entry));
      }
      return [...prev, termDraft];
    });
    setShowTermModal(false);
    setEditingTerm(null);
  };

  const handleSetAsCurrentTerm = (term: SchoolTerm) => {
    setConfirmActivateTerm(term);
  };

  const confirmSetCurrentTerm = () => {
    if (!confirmActivateTerm) return;
    setSchoolTerms((prev) =>
      prev.map((entry) =>
        entry.id === confirmActivateTerm.id
          ? { ...entry, status: 'active' }
          : entry.status === 'active'
            ? { ...entry, status: 'completed' }
            : entry,
      ),
    );
    setConfirmActivateTerm(null);
  };

  const handleActivateUser = (userId: number) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u)));
  };

  const handleDeactivateUser = (userId: number) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'inactive' } : u)));
  };

  const handleResendInvitation = (email: string) => {
    alert(`Invitation resent to ${email}`);
  };

  const roleBadgeClassName = (role: StaffRole) => {
    if (role === 'Teacher') return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200';
    if (role === 'Bursar') return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200';
    if (role === 'Principal') return 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200';
    if (role === 'Admin') return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  };

  const formatRelativeActivity = (value: string | null) => {
    if (!value) return 'Never logged in';
    const last = new Date(value).getTime();
    const now = Date.now();
    const diffMinutes = Math.max(1, Math.round((now - last) / (1000 * 60)));
    if (diffMinutes < 60) return `Active ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Active ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.round(diffHours / 24);
    return `Active ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const toDisplayNameFromEmail = (email: string) => {
    const username = email.split('@')[0] || 'new.user';
    return username
      .split(/[._-]/)
      .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
      .join(' ');
  };

  const initialsForName = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    return (parts[0]?.charAt(0) || 'U') + (parts[1]?.charAt(0) || '');
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (
        userSearch &&
        !user.name.toLowerCase().includes(userSearch.toLowerCase()) &&
        !user.email.toLowerCase().includes(userSearch.toLowerCase())
      ) {
        return false;
      }
      if (userRoleFilter && user.role !== userRoleFilter) return false;
      if (userStatusFilter && user.status !== userStatusFilter) return false;
      return true;
    });
  }, [userRoleFilter, userSearch, userStatusFilter, users]);

  const totalStaffCount = users.length;
  const pendingInvitesCount = users.filter((user) => user.status === 'pending_invitation').length;
  const teacherCount = users.filter((user) => user.role === 'Teacher').length;
  const nonTeachingCount = totalStaffCount - teacherCount;

  const handleInviteUser = () => {
    setInviteError('');
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setInviteError('Enter a valid email address.');
      return;
    }
    if (users.some((user) => user.email.toLowerCase() === email)) {
      setInviteError('A staff account with this email already exists.');
      return;
    }

    const nextId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
    const nextUser: StaffMember = {
      id: nextId,
      name: toDisplayNameFromEmail(email),
      email,
      role: inviteRole,
      status: 'pending_invitation',
      lastActive: null,
    };
    setUsers((prev) => [nextUser, ...prev]);
    alert(`Secure invitation sent to ${email}.`);
    setInviteEmail('');
    setInviteRole('Teacher');
  };

  const handleDownloadUserCsvTemplate = () => {
    const template = 'Name,Email,Role\nJane Doe,jane.doe@smfa.edu,Teacher\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'staff-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkImportUsers = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setCsvImportError('');
        const text = String(reader.result || '');
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length < 2) {
          setCsvImportError('CSV file is empty.');
          return;
        }
        const headers = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
        if (headers.join(',') !== 'name,email,role') {
          setCsvImportError('Invalid CSV headers. Use Name, Email, Role.');
          return;
        }

        const imported: StaffMember[] = [];
        let nextId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
        for (const line of lines.slice(1)) {
          const [nameRaw, emailRaw, roleRaw] = line.split(',').map((cell) => cell.trim());
          if (!nameRaw || !emailRaw || !roleRaw) continue;
          if (!staffRoleOptions.includes(roleRaw as StaffRole)) continue;
          if (users.some((user) => user.email.toLowerCase() === emailRaw.toLowerCase())) continue;

          imported.push({
            id: nextId,
            name: nameRaw,
            email: emailRaw.toLowerCase(),
            role: roleRaw as StaffRole,
            status: 'pending_invitation',
            lastActive: null,
          });
          nextId += 1;
        }

        if (!imported.length) {
          setCsvImportError('No valid new users found in CSV.');
          return;
        }

        setUsers((prev) => [...imported, ...prev]);
        alert(`Imported ${imported.length} staff records and sent invitations.`);
      } catch {
        setCsvImportError('Unable to process CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleManualPasswordReset = (user: StaffMember) => {
    alert(`Manual password reset initiated for ${user.name}.`);
  };

  const handleForceLogout = (user: StaffMember) => {
    alert(`Forced logout from all devices for ${user.name}.`);
  };

  const openRoleEditModal = (user: StaffMember) => {
    setRoleEditTarget(user);
    setPendingRoleValue(user.role);
  };

  const confirmRoleChange = () => {
    if (!roleEditTarget) return;
    setUsers((prev) =>
      prev.map((user) =>
        user.id === roleEditTarget.id
          ? {
              ...user,
              role: pendingRoleValue,
            }
          : user,
      ),
    );
    alert(`Role updated for ${roleEditTarget.name}.`);
    setRoleEditTarget(null);
  };

  const resolveAuditDateRange = () => {
    const now = new Date();
    if (auditFilters.datePreset === 'day') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { startDate: start.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
    }
    if (auditFilters.datePreset === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return { startDate: start.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
    }
    if (auditFilters.datePreset === 'month') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      return { startDate: start.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
    }
    if (auditFilters.datePreset === 'term') {
      const activeTerm = schoolTerms.find((entry) => entry.status === 'active') || schoolTerms[1];
      return { startDate: activeTerm.startDate, endDate: activeTerm.endDate };
    }
    return { startDate: auditFilters.startDate, endDate: auditFilters.endDate };
  };

  const filteredAuditLogs = useMemo(() => {
    const range = resolveAuditDateRange();
    const startDate = range.startDate;
    const endDate = range.endDate;

    const base = auditLogs.filter((log) => {
      const actorText = `${log.actorName} ${log.actorRole}`.toLowerCase();
      const moduleText = log.module.toLowerCase();
      const descriptionText = `${log.action} ${log.description}`.toLowerCase();

      if (
        auditFilters.search &&
        !actorText.includes(auditFilters.search.toLowerCase()) &&
        !moduleText.includes(auditFilters.search.toLowerCase()) &&
        !descriptionText.includes(auditFilters.search.toLowerCase())
      ) {
        return false;
      }
      if (auditFilters.role && log.actorRole !== auditFilters.role) return false;
      if (auditFilters.module && log.module !== auditFilters.module) return false;
      if (startDate && log.timestamp.slice(0, 10) < startDate) return false;
      if (endDate && log.timestamp.slice(0, 10) > endDate) return false;
      if (auditFilters.highRiskOnly && log.riskLevel !== 'high') return false;
      return true;
    });

    return base.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditFilters.endDate, auditFilters.highRiskOnly, auditFilters.module, auditFilters.role, auditFilters.search, auditFilters.startDate, auditFilters.datePreset]);

  const auditPageSize = 8;
  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / auditPageSize));

  const paginatedAuditLogs = useMemo(() => {
    const page = Math.min(auditPage, totalAuditPages);
    const start = (page - 1) * auditPageSize;
    return filteredAuditLogs.slice(start, start + auditPageSize);
  }, [auditPage, filteredAuditLogs, totalAuditPages]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditFilters.search, auditFilters.role, auditFilters.module, auditFilters.highRiskOnly, auditFilters.startDate, auditFilters.endDate, auditFilters.datePreset]);

  const handleOpenAuditMetadata = (entry: AuditLogEntry) => {
    setSelectedAuditEntry(entry);
    setShowAuditMetadataModal(true);
  };

  const handleDownloadAuditTrailCsv = () => {
    const headers = ['Timestamp', 'Actor', 'Module', 'Action', 'Risk Level', 'IP Address', 'Description'];
    const rows = filteredAuditLogs.map((log) => [
      log.timestamp,
      `${log.actorName} | ${log.actorRole}`,
      log.module,
      log.action,
      log.riskLevel,
      log.ipAddress || 'N/A',
      log.description,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportClassPerformance = () => {
    alert('Export class performance as CSV');
  };

  const handleDownloadPerformanceCsv = () => {
    const headers = ['Class Name', 'Average Score', 'Pass Rate', 'Attendance', 'Trend', 'Rank'];
    const rows = classPerformance.map((row) => [
      row.className,
      `${row.averageScore}%`,
      `${row.passRate}%`,
      `${row.attendanceRate}%`,
      row.delta,
      String(row.rank),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${selectedDateRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportCenter(false);
  };

  const handleDownloadPerformancePdf = () => {
    const reportRows = classPerformance
      .map(
        (row) => `<tr>
          <td style="padding:6px;border:1px solid #ccc;">${row.className}</td>
          <td style="padding:6px;border:1px solid #ccc;">${row.averageScore}%</td>
          <td style="padding:6px;border:1px solid #ccc;">${row.passRate}%</td>
          <td style="padding:6px;border:1px solid #ccc;">${row.attendanceRate}%</td>
          <td style="padding:6px;border:1px solid #ccc;">${row.delta}</td>
          <td style="padding:6px;border:1px solid #ccc;">${row.rank}</td>
        </tr>`,
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Performance Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>School Performance Report</h2>
        <p>Date Range: ${activeRangeLabel}</p>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="padding:6px;border:1px solid #ccc; text-align:left;">Class Name</th>
              <th style="padding:6px;border:1px solid #ccc; text-align:left;">Average Score</th>
              <th style="padding:6px;border:1px solid #ccc; text-align:left;">Pass Rate</th>
              <th style="padding:6px;border:1px solid #ccc; text-align:left;">Attendance</th>
              <th style="padding:6px;border:1px solid #ccc; text-align:left;">Trend</th>
              <th style="padding:6px;border:1px solid #ccc; text-align:left;">Rank</th>
            </tr>
          </thead>
          <tbody>
            ${reportRows}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setShowExportCenter(false);
  };

  const lessonNoteDepartments = useMemo(
    () => Array.from(new Set(lessonNotes.map((note) => note.department))),
    [lessonNotes],
  );

  const lessonNoteTeachers = useMemo(
    () => Array.from(new Set(lessonNotes.map((note) => note.teacher))),
    [lessonNotes],
  );

  const filteredLessonNotes = useMemo(() => {
    return lessonNotes.filter((note) => {
      if (lessonNoteFilters.department && note.department !== lessonNoteFilters.department) return false;
      if (lessonNoteFilters.teacher && note.teacher !== lessonNoteFilters.teacher) return false;
      if (lessonNoteFilters.status && note.status !== lessonNoteFilters.status) return false;
      if (lessonNoteFilters.startDate && note.submittedDate < lessonNoteFilters.startDate) return false;
      if (lessonNoteFilters.endDate && note.submittedDate > lessonNoteFilters.endDate) return false;
      return true;
    });
  }, [lessonNoteFilters.department, lessonNoteFilters.endDate, lessonNoteFilters.startDate, lessonNoteFilters.status, lessonNoteFilters.teacher, lessonNotes]);

  const selectedLessonNote = useMemo(
    () => lessonNotes.find((note) => note.id === selectedLessonNoteId) || null,
    [lessonNotes, selectedLessonNoteId],
  );

  const lessonPendingApprovals = useMemo(
    () => lessonNotes.filter((note) => note.status === 'submitted').length,
    [lessonNotes],
  );

  const currentWeek = useMemo(
    () => lessonNotes.reduce((max, note) => (note.week > max ? note.week : max), 0),
    [lessonNotes],
  );

  const complianceRate = useMemo(() => {
    const teachers = staff.filter((member) => member.role === 'Teacher').map((member) => member.name);
    const submittingTeachers = new Set(
      lessonNotes
        .filter((note) => note.week === currentWeek && note.status !== 'draft')
        .map((note) => note.teacher),
    );

    if (!teachers.length) return 0;
    return Math.round((submittingTeachers.size / teachers.length) * 1000) / 10;
  }, [currentWeek, lessonNotes]);

  const aiAdoptionRate = useMemo(() => {
    if (!lessonNotes.length) return 0;
    const aiNotes = lessonNotes.filter((note) => note.generatedBy === 'AI').length;
    return Math.round((aiNotes / lessonNotes.length) * 1000) / 10;
  }, [lessonNotes]);

  const handleOpenLessonPreview = (noteId: number) => {
    setSelectedLessonNoteId(noteId);
    setShowLessonPreviewModal(true);
    setShowRejectMode(false);
    const note = lessonNotes.find((entry) => entry.id === noteId);
    setRejectionFeedback(note?.rejectionFeedback || '');
    setQualityPrivateNote(note?.privateQualityNote || '');
  };

  const updateLessonNoteStatus = (noteId: number, status: LessonNoteStatus, feedback?: string) => {
    setLessonNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              status,
              rejectionFeedback: status === 'rejected' ? feedback || note.rejectionFeedback : undefined,
              approvedDate: status === 'approved' ? new Date().toISOString().slice(0, 10) : note.approvedDate,
            }
          : note,
      ),
    );
  };

  const handleApproveSelectedLessonNote = () => {
    if (!selectedLessonNote) return;
    updateLessonNoteStatus(selectedLessonNote.id, 'approved');
    alert(`Lesson note approved. Notification sent to ${selectedLessonNote.teacher}.`);
    setShowRejectMode(false);
  };

  const handleRejectSelectedLessonNote = () => {
    if (!selectedLessonNote || !rejectionFeedback.trim()) return;
    updateLessonNoteStatus(selectedLessonNote.id, 'rejected', rejectionFeedback.trim());
    alert(`Lesson note rejected with feedback for ${selectedLessonNote.teacher}.`);
    setShowRejectMode(false);
  };

  const handleSaveQualityFlag = () => {
    if (!selectedLessonNote) return;
    setLessonNotes((prev) =>
      prev.map((note) =>
        note.id === selectedLessonNote.id
          ? {
              ...note,
              privateQualityNote: qualityPrivateNote.trim() || undefined,
            }
          : note,
      ),
    );
    alert('Private quality note saved.');
  };

  const handleToggleLessonNoteSelection = (noteId: number) => {
    setSelectedLessonNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId],
    );
  };

  const handleSelectAllVisibleLessonNotes = () => {
    const visibleIds = filteredLessonNotes.map((note) => note.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedLessonNoteIds.includes(id));
    if (allSelected) {
      setSelectedLessonNoteIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedLessonNoteIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleBulkApproveLessonNotes = () => {
    if (!selectedLessonNoteIds.length) return;
    setLessonNotes((prev) =>
      prev.map((note) =>
        selectedLessonNoteIds.includes(note.id)
          ? {
              ...note,
              status: 'approved',
              approvedDate: new Date().toISOString().slice(0, 10),
            }
          : note,
      ),
    );
    alert(`${selectedLessonNoteIds.length} lesson notes approved.`);
    setSelectedLessonNoteIds([]);
  };

  const syllabusTeachers = useMemo(
    () => Array.from(new Set(syllabi.map((entry) => entry.teacher))),
    [syllabi],
  );

  const syllabusDepartments = useMemo(
    () => Array.from(new Set(syllabi.map((entry) => entry.department))),
    [syllabi],
  );

  const expectedSyllabusRegistry = useMemo(() => {
    return schoolSubjectMappings.map((mapping) => ({
      class: findClassNameById(mapping.classId, schoolClasses),
      subject: mapping.subject,
      department: inferDepartmentFromSubject(mapping.subject),
      teacher: schoolClasses.find((entry) => entry.id === mapping.classId)?.teacher || 'TBD',
      term: syllabusFilters.term as 'Term 1, 2026' | 'Term 2, 2026' | 'Term 3, 2026',
    }));
  }, [schoolClasses, schoolSubjectMappings, syllabusFilters.term]);

  const missingSyllabusRows = useMemo(() => {
    const week = Number(syllabusFilters.missingWeek || '0');
    if (!week) return [];

    return expectedSyllabusRegistry
      .filter((expected) => {
        const exists = syllabi.some(
          (entry) =>
            entry.class === expected.class &&
            entry.subject === expected.subject &&
            entry.week === week &&
            entry.term === expected.term,
        );
        if (exists) return false;
        if (syllabusFilters.department && expected.department !== syllabusFilters.department) return false;
        if (syllabusFilters.teacher && expected.teacher !== syllabusFilters.teacher) return false;
        return true;
      })
      .map((expected, index) => ({
        id: -1000 - index,
        class: expected.class,
        subject: expected.subject,
        department: expected.department,
        term: expected.term,
        week,
        title: `Missing submission for Week ${week}`,
        teacher: expected.teacher,
        status: 'rejected' as SyllabusStatus,
        submittedDate: null,
        approvedDate: null,
        learningObjectives: [],
        weeklyTopics: [],
        resources: [],
        rejectionLogs: [{ at: new Date().toISOString(), reason: `No submission found for Week ${week}.`, by: 'System' }],
        revisionCount: 0,
        versionHistory: [],
      }));
  }, [expectedSyllabusRegistry, syllabi, syllabusFilters.department, syllabusFilters.missingWeek, syllabusFilters.teacher]);

  const filteredSyllabi = useMemo(() => {
    const base = syllabi.filter((entry) => {
      if (entry.term !== syllabusFilters.term) return false;
      if (syllabusFilters.department && entry.department !== syllabusFilters.department) return false;
      if (syllabusFilters.teacher && entry.teacher !== syllabusFilters.teacher) return false;
      if (syllabusFilters.complianceStatus && syllabusFilters.complianceStatus !== 'missing' && entry.status !== syllabusFilters.complianceStatus) return false;
      if (syllabusFilters.missingWeek && entry.week !== Number(syllabusFilters.missingWeek)) return false;
      return true;
    });

    if (syllabusFilters.complianceStatus === 'missing') return missingSyllabusRows;
    return [...base, ...missingSyllabusRows];
  }, [missingSyllabusRows, syllabi, syllabusFilters.complianceStatus, syllabusFilters.department, syllabusFilters.missingWeek, syllabusFilters.teacher, syllabusFilters.term]);

  const expectedCount = useMemo(() => {
    return expectedSyllabusRegistry.filter((entry) => {
      if (syllabusFilters.department && entry.department !== syllabusFilters.department) return false;
      if (syllabusFilters.teacher && entry.teacher !== syllabusFilters.teacher) return false;
      return true;
    }).length;
  }, [expectedSyllabusRegistry, syllabusFilters.department, syllabusFilters.teacher]);

  const submittedCount = useMemo(() => {
    return syllabi.filter((entry) => {
      if (entry.term !== syllabusFilters.term) return false;
      if (syllabusFilters.department && entry.department !== syllabusFilters.department) return false;
      if (syllabusFilters.teacher && entry.teacher !== syllabusFilters.teacher) return false;
      return entry.status === 'submitted' || entry.status === 'approved' || entry.status === 'rejected';
    }).length;
  }, [syllabi, syllabusFilters.department, syllabusFilters.teacher, syllabusFilters.term]);

  const syllabusSubmissionRate = expectedCount === 0 ? 0 : Math.round((submittedCount / expectedCount) * 1000) / 10;

  const approvalBottleneck = useMemo(() => {
    const pending = syllabi.filter((entry) => entry.term === syllabusFilters.term && entry.status === 'submitted');
    if (!pending.length) return 'No pending reviews';

    const departmentCounts = pending.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.department] = (acc[entry.department] || 0) + 1;
      return acc;
    }, {});
    const teacherCounts = pending.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.teacher] = (acc[entry.teacher] || 0) + 1;
      return acc;
    }, {});

    const topDepartment = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1])[0];
    const topTeacher = Object.entries(teacherCounts).sort((a, b) => b[1] - a[1])[0];

    return `${topDepartment?.[0] || 'N/A'} (${topDepartment?.[1] || 0}) • ${topTeacher?.[0] || 'N/A'} (${topTeacher?.[1] || 0})`;
  }, [syllabi, syllabusFilters.term]);

  const revisionFrequency = useMemo(() => {
    const approved = syllabi.filter((entry) => entry.term === syllabusFilters.term && entry.status === 'approved');
    if (!approved.length) return 0;
    const total = approved.reduce((sum, entry) => sum + entry.revisionCount, 0);
    return Math.round((total / approved.length) * 100) / 100;
  }, [syllabi, syllabusFilters.term]);

  const toggleSyllabusExpanded = (id: number) => {
    if (id < 0) return;
    setExpandedSyllabusIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  };

  const toggleSyllabusSelection = (id: number) => {
    if (id < 0) return;
    setSelectedSyllabusIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  };

  const updateSyllabusStatus = (id: number, nextStatus: SyllabusStatus, feedback?: string, force = false) => {
    setSyllabi((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;

        const nextHistory: SyllabusHistoryEvent = {
          status: force ? 'force_approved' : nextStatus === 'approved' ? 'approved' : nextStatus === 'rejected' ? 'rejected' : 'submitted',
          at: new Date().toISOString(),
          by: 'Admin',
          note: feedback,
        };

        return {
          ...entry,
          status: nextStatus,
          approvedDate: nextStatus === 'approved' ? new Date().toISOString().slice(0, 10) : entry.approvedDate,
          rejectionLogs: nextStatus === 'rejected' && feedback
            ? [...entry.rejectionLogs, { at: new Date().toISOString(), reason: feedback, by: 'Admin' }]
            : entry.rejectionLogs,
          revisionCount: nextStatus === 'rejected' ? entry.revisionCount + 1 : entry.revisionCount,
          versionHistory: [...entry.versionHistory, nextHistory],
        };
      }),
    );
  };

  const handleRequestSyllabusRevision = (id: number) => {
    const note = (syllabusRevisionNote[id] || '').trim();
    if (!note) return;
    updateSyllabusStatus(id, 'rejected', note);
    alert('Revision requested. Immediate Action Required notification sent to teacher dashboard.');
    setSyllabusRevisionNote((prev) => ({ ...prev, [id]: '' }));
  };

  const handleForceApproveSyllabus = (id: number) => {
    if (!criticalOverrideEnabled) return;
    updateSyllabusStatus(id, 'approved', 'Force approved by Super Admin due to critical flag.', true);
    alert('Syllabus force approved via admin override.');
  };

  const handleBulkApproveSyllabi = () => {
    if (!selectedSyllabusIds.length) return;
    selectedSyllabusIds.forEach((id) => updateSyllabusStatus(id, 'approved'));
    alert(`Approved ${selectedSyllabusIds.length} syllabi.`);
    setSelectedSyllabusIds([]);
  };

  const handleBulkMarkPendingSyllabi = () => {
    if (!selectedSyllabusIds.length) return;
    setSyllabi((prev) =>
      prev.map((entry) =>
        selectedSyllabusIds.includes(entry.id) ? { ...entry, status: 'submitted', approvedDate: null } : entry,
      ),
    );
    alert(`Marked ${selectedSyllabusIds.length} syllabi as pending review.`);
    setSelectedSyllabusIds([]);
  };

  const handleOpenSyllabusHistory = (entry: SyllabusEntry) => {
    setSelectedSyllabusHistoryEntry(entry);
    setShowSyllabusHistoryModal(true);
  };

  const dataCompletenessBreakdown = useMemo(() => {
    if (!dataHealthRows.length) {
      return {
        attendanceOnTime: 0,
        lessonNotesSubmitted: 0,
        assessmentsWithinSla: 0,
        medicalPickupUsage: 0,
      };
    }

    const totals = dataHealthRows.reduce(
      (acc, row) => ({
        attendanceOnTime: acc.attendanceOnTime + row.attendanceCompliance,
        lessonNotesSubmitted: acc.lessonNotesSubmitted + row.lessonNotesOnTime,
        assessmentsWithinSla: acc.assessmentsWithinSla + (row.assessmentTurnaroundDays <= 3 ? 100 : row.assessmentTurnaroundDays <= 5 ? 60 : 30),
        medicalPickupUsage: acc.medicalPickupUsage + row.medicalPickupLogUsage,
      }),
      { attendanceOnTime: 0, lessonNotesSubmitted: 0, assessmentsWithinSla: 0, medicalPickupUsage: 0 },
    );

    return {
      attendanceOnTime: Math.round(totals.attendanceOnTime / dataHealthRows.length),
      lessonNotesSubmitted: Math.round(totals.lessonNotesSubmitted / dataHealthRows.length),
      assessmentsWithinSla: Math.round(totals.assessmentsWithinSla / dataHealthRows.length),
      medicalPickupUsage: Math.round(totals.medicalPickupUsage / dataHealthRows.length),
    };
  }, [dataHealthRows]);

  const overallDataCompletenessScore = useMemo(() => {
    const values = Object.values(dataCompletenessBreakdown);
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [dataCompletenessBreakdown]);

  const computeHealthRiskScore = (row: DataHealthRow) => {
    const turnaroundScore = row.assessmentTurnaroundDays <= 3 ? 100 : row.assessmentTurnaroundDays <= 5 ? 60 : 30;
    const positiveScore = row.attendanceCompliance * 0.35 + row.lessonNotesOnTime * 0.35 + turnaroundScore * 0.3;
    return 100 - positiveScore;
  };

  const dataHealthRowsSorted = useMemo(() => {
    const sorted = [...dataHealthRows];
    sorted.sort((a, b) => {
      if (dataHealthSortBy === 'attendance') return a.attendanceCompliance - b.attendanceCompliance;
      if (dataHealthSortBy === 'lesson_notes') return a.lessonNotesOnTime - b.lessonNotesOnTime;
      if (dataHealthSortBy === 'turnaround') return b.assessmentTurnaroundDays - a.assessmentTurnaroundDays;
      return computeHealthRiskScore(b) - computeHealthRiskScore(a);
    });
    return sorted;
  }, [dataHealthRows, dataHealthSortBy]);

  const parentEngagementByClass = useMemo(() => {
    const grouped = dataHealthRows.reduce<Record<string, { total: number; count: number }>>((acc, row) => {
      acc[row.className] = {
        total: (acc[row.className]?.total || 0) + row.parentLoginRate,
        count: (acc[row.className]?.count || 0) + 1,
      };
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([className, stat]) => ({
        className,
        engagement: Math.round(stat.total / stat.count),
      }))
      .sort((a, b) => b.engagement - a.engagement);
  }, [dataHealthRows]);

  const selectAllDataHealthRows = () => {
    const allIds = dataHealthRowsSorted.map((row) => row.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedDataHealthRows.includes(id));
    if (allSelected) {
      setSelectedDataHealthRows([]);
      return;
    }
    setSelectedDataHealthRows(allIds);
  };

  const toggleDataHealthRowSelection = (rowId: string) => {
    setSelectedDataHealthRows((prev) => (prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]));
  };

  const handleSendDataReminder = () => {
    if (!selectedDataHealthRows.length) return;
    const weeklyText = weeklySummaryEnabled ? ' Weekly bottom-performer summary is enabled for admin.' : '';
    alert(`Reminder sent to ${selectedDataHealthRows.length} selected teacher/class owner(s).${weeklyText}`);
    setSelectedDataHealthRows([]);
  };

  const metricBadgeClassName = (value: number) => {
    if (value >= 80) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-200';
    if (value >= 60) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200';
    return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-200';
  };

  const turnaroundBadgeClassName = (days: number) => {
    if (days <= 3) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-200';
    if (days <= 5) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200';
    return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-200';
  };

  // ========== Result Approvals Helpers ==========
  const gradebookStatusBadgeVariant = (status: GradebookStatus): 'draft' | 'submitted' | 'approved' | 'rejected' | 'default' => {
    switch (status) {
      case 'draft':
        return 'draft';
      case 'submitted':
        return 'submitted';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
    }
  };

  const filteredApprovals = useMemo(() => {
    return gradeWeightingConfigs.filter((config) => {
      if (approvalFilters.status && config.status !== approvalFilters.status) return false;
      if (approvalFilters.term && !config.term.includes(approvalFilters.term)) return false;
      // We'll need to extract teacher name from somewhere - for now check class name as proxy
      if (approvalFilters.teacherName && !config.className.toLowerCase().includes(approvalFilters.teacherName.toLowerCase())) return false;
      return true;
    });
  }, [gradeWeightingConfigs, approvalFilters]);

  const handleApproveGradebook = (config: GradeWeightingConfig) => {
    const updated = gradeWeightingConfigs.map((c) =>
      c.id === config.id
        ? { ...c, status: 'approved' as GradebookStatus, updatedAt: new Date().toISOString() }
        : c,
    );
    setGradeWeightingConfigs(updated);
    localStorage.setItem('teacher-dashboard:grade-weighting-configs', JSON.stringify(updated));
    setShowReviewModal(false);
    alert('Gradebook approved and marked as Final for Parent Intelligence Platform.');
  };

  const handleRejectGradebook = () => {
    if (!selectedReviewConfig || !rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    const updated = gradeWeightingConfigs.map((c) =>
      c.id === selectedReviewConfig.id
        ? {
            ...c,
            status: 'rejected' as GradebookStatus,
            rejectionReason: rejectReason,
            updatedAt: new Date().toISOString(),
          }
        : c,
    );
    setGradeWeightingConfigs(updated);
    localStorage.setItem('teacher-dashboard:grade-weighting-configs', JSON.stringify(updated));
    setShowReviewModal(false);
    setShowRejectReasonModal(false);
    setRejectReason('');
    alert('Gradebook rejected. Teacher will see feedback in their dashboard.');
  };

  const isWeightingCompliant = (config: GradeWeightingConfig): boolean => {
    // Check if weights total 100% (allowing small floating-point variance)
    const total = Object.values(config.categoryWeights).reduce((sum, weight) => sum + weight, 0);
    return Math.abs(total - 100) < 0.1;
  };

  // Result Preview Helper Functions
  const calculateLetterGrade = (score: number): string => {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const checkPolicyAlignment = (config: GradeWeightingConfig): boolean => {
    // School's default recommended weights (30% Homework, 20% Exercise, 10% Lab, 20% Test, 20% Exam)
    const defaultWeights: Record<GradeCategory, number> = {
      'Homework': 30,
      'Exercise': 20,
      'Lab': 10,
      'Test': 20,
      'Exam': 20,
    };

    // Check if all weights match school defaults within 5% tolerance
    return Object.entries(defaultWeights).every(
      ([category, defaultWeight]) =>
        Math.abs((config.categoryWeights[category as GradeCategory] || 0) - defaultWeight) <= 5,
    );
  };

  const generateMockStudentResults = (config: GradeWeightingConfig): StudentGradebookResult[] => {
    // Mock student list by class name
    const mockStudents: Record<string, string[]> = {
      'JSS1A': ['Chidi Okonkwo', 'Amara Nwosu', 'Somto Ikechukwu', 'Tunde Adeyemi', 'Grace Obi', 'Emeka Uche'],
      'JSS2B': ['Kunle Fashola', 'Zainab Hassan', 'Chioma Ejiofor', 'Ibrahim Yusuf'],
      'SS1A': ['Fatima Mohammed', 'Segun Campbell', 'Aisha Bello', 'Tolu Ajayi'],
      'SS2B': ['Kemi Johnson', 'Dayo Oladele', 'Busola Adeoye'],
    };

    const students = mockStudents[config.className] || [];
    const classAverage = 65; // Mock class average

    return students.map((name, idx) => {
      // Generate varied scores for each category
      const categoryScores: Record<GradeCategory, number> = {
        'Homework': Math.min(100, Math.max(0, classAverage + (Math.random() - 0.5) * 30)),
        'Exercise': Math.min(100, Math.max(0, classAverage + (Math.random() - 0.5) * 25)),
        'Lab': Math.min(100, Math.max(0, classAverage + (Math.random() - 0.5) * 20)),
        'Test': Math.min(100, Math.max(0, classAverage + (Math.random() - 0.5) * 35)),
        'Exam': Math.min(100, Math.max(0, classAverage + (Math.random() - 0.5) * 40)),
      };

      // Calculate weighted average
      const weightedAverage = Object.entries(config.categoryWeights).reduce(
        (sum, [category, weight]) => sum + (categoryScores[category as GradeCategory] * weight) / 100,
        0,
      );

      const letterGrade = calculateLetterGrade(Math.round(weightedAverage));
      const isLowScore = weightedAverage < 40;
      const isHighScore = weightedAverage > 90;

      return {
        studentId: `st-${config.classId}-${idx}`,
        studentName: name,
        weightedAverage: Math.round(weightedAverage * 10) / 10,
        letterGrade,
        isOutlier: isLowScore || isHighScore,
        outlierReason: isLowScore ? 'Low score' : isHighScore ? 'Exceptionally high' : undefined,
        categoryScores,
      };
    });
  };

  const generateGradeDistribution = (results: StudentGradebookResult[]): GradeDistributionPoint[] => {
    const gradeLetters = ['A', 'B', 'C', 'D', 'F'];
    const distribution = gradeLetters.map((grade) => {
      const count = results.filter((r) => r.letterGrade === grade).length;
      return {
        grade,
        count,
        percentage: results.length > 0 ? Math.round((count / results.length) * 100) : 0,
      };
    });
    return distribution;
  };

  const generateResultPreview = (config: GradeWeightingConfig): ResultPreviewData => {
    const students = generateMockStudentResults(config);
    const gradeDistribution = generateGradeDistribution(students);
    const classAverage = Math.round(
      (students.reduce((sum, s) => sum + s.weightedAverage, 0) / Math.max(1, students.length)) * 10,
    ) / 10;
    const policyAligned = checkPolicyAlignment(config);

    return {
      config,
      students,
      gradeDistribution,
      classAverage,
      policyAligned,
    };
  };

  const openResultPreview = (config: GradeWeightingConfig) => {
    const preview = generateResultPreview(config);
    setResultPreviewData(preview);
    setShowResultPreviewSheet(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        <button onClick={() => setActiveSection('performance')} className={`px-4 py-2 ${activeSection === 'performance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <TrendingUp size={16} className="inline mr-2" />Class Performance
        </button>
        <button onClick={() => setActiveSection('school')} className={`px-4 py-2 ${activeSection === 'school' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <SettingsIcon size={16} className="inline mr-2" />School Setup
        </button>
        <button onClick={() => setActiveSection('users')} className={`px-4 py-2 ${activeSection === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <Users size={16} className="inline mr-2" />User Management
        </button>
        <button onClick={() => setActiveSection('audit')} className={`px-4 py-2 ${activeSection === 'audit' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Audit Logs
        </button>
        <button onClick={() => setActiveSection('syllabus')} className={`px-4 py-2 ${activeSection === 'syllabus' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <BookOpen size={16} className="inline mr-2" />Syllabus Management
        </button>
        <button onClick={() => setActiveSection('lesson_note')} className={`px-4 py-2 ${activeSection === 'lesson_note' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <FileText size={16} className="inline mr-2" />Lesson Notes
        </button>
        <button onClick={() => setActiveSection('data_health')} className={`px-4 py-2 ${activeSection === 'data_health' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <AlertTriangle size={16} className="inline mr-2" />Data Health
        </button>
        <button onClick={() => setActiveSection('result_approvals')} className={`px-4 py-2 ${activeSection === 'result_approvals' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          <CheckCircle size={16} className="inline mr-2" />Result Approvals
        </button>
      </div>

      {/* ========== CLASS PERFORMANCE ========== */}
      {activeSection === 'performance' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">School-Wide Academic Oversight</h2>
              <p className="text-sm text-muted-foreground">Date Range: {activeRangeLabel}</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Date Range</label>
                <select
                  className="p-2 border border-border rounded bg-input-background"
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value as 'term1' | 'term2' | 'term3' | 'custom')}
                >
                  <option value="term1">Term 1, 2026</option>
                  <option value="term2">Term 2, 2026</option>
                  <option value="term3">Term 3, 2026</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {selectedDateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Start</label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange((prev) => ({ ...prev, start: e.target.value }))}
                      className="p-2 border border-border rounded bg-input-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">End</label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange((prev) => ({ ...prev, end: e.target.value }))}
                      className="p-2 border border-border rounded bg-input-background"
                    />
                  </div>
                </>
              )}
              <Button variant="outline" onClick={() => setShowExportCenter(true)}>
                <Download size={16} className="mr-2" />Export Center
              </Button>
            </div>
          </div>

          {isPerformanceLoading ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Card key={idx}>
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-1/3 mt-3" />
                  </Card>
                ))}
              </div>
              <Card title="Class Performance Comparison">
                <Skeleton className="h-10 w-full" />
                <div className="space-y-2 mt-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-8 w-full" />
                  ))}
                </div>
              </Card>
              <Card title="Specific Subject Analysis">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={`subject-kpi-${idx}`} className="h-20 w-full" />
                  ))}
                </div>
                <Skeleton className="h-[240px] w-full" />
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Score Distribution">
                  <Skeleton className="h-[260px] w-full" />
                </Card>
                <Card title="Pass Rate vs Attendance Trend">
                  <Skeleton className="h-[260px] w-full" />
                </Card>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <Card>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">School Average Score</p>
                    <TrendingUp size={16} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold mt-2">{schoolAverageScore}%</p>
                </Card>
                <Card>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Global Pass Rate</p>
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold mt-2">{globalPassRate}%</p>
                </Card>
                <Card>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Average Attendance</p>
                    <Users size={16} className="text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold mt-2">{averageAttendance}%</p>
                </Card>
                <Card>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Active Classes</p>
                    <BookOpen size={16} className="text-violet-600" />
                  </div>
                  <p className="text-2xl font-bold mt-2">{classPerformance.length}</p>
                </Card>
              </div>

              <Card title="Class Comparison Leaderboard">
                <div className="mb-3 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      placeholder="Search class name..."
                      className="p-2 border border-border rounded bg-input-background min-w-64"
                    />
                    <select
                      value={selectedSubjectDetail}
                      onChange={(e) => {
                        const nextSubject = e.target.value;
                        setSelectedSubjectDetail(nextSubject);
                        setSelectedSubjectId(nextSubject || null);
                      }}
                      className="p-2 border border-border rounded bg-input-background min-w-64"
                      disabled={!selectedClassForDrill}
                    >
                      <option value="">Select Subject for Deep-Dive</option>
                      {classMappedSubjectsForDrill.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                  <Badge variant="default">{filteredAndSortedClassPerformance.length} classes</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">
                          <button type="button" onClick={() => handleSort('className')}>Class Name</button>
                        </th>
                        <th className="text-right py-2">
                          <button type="button" onClick={() => handleSort('averageScore')}>Average Score</button>
                        </th>
                        <th className="text-right py-2">
                          <button type="button" onClick={() => handleSort('passRate')}>Pass Rate</button>
                        </th>
                        <th className="text-right py-2">
                          <button type="button" onClick={() => handleSort('attendanceRate')}>Attendance</button>
                        </th>
                        <th className="text-right py-2">
                          <button type="button" onClick={() => handleSort('delta')}>Trend</button>
                        </th>
                        <th className="text-right py-2">
                          <button type="button" onClick={() => handleSort('rank')}>Rank</button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedClassPerformance.map((cls) => (
                        <tr
                          key={cls.classId}
                          className={`border-b cursor-pointer hover:bg-muted/40 ${selectedClassForDrill?.classId === cls.classId ? 'bg-accent/40' : ''}`}
                          onClick={() => {
                            setSelectedClassForDrill(cls);
                            setSelectedSubjectDetail('');
                            setSelectedSubjectId(null);
                          }}
                        >
                          <td className="py-2">{cls.className}</td>
                          <td className="text-right">{cls.averageScore}%</td>
                          <td className="text-right">{cls.passRate}%</td>
                          <td className="text-right">{cls.attendanceRate}%</td>
                          <td className={`text-right font-medium ${cls.delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{cls.delta}</td>
                          <td className="text-right">#{cls.rank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {selectedClassForDrill && selectedSubjectId && (
                <div className="relative">
                <Card title={`Specific Subject Analysis: ${selectedSubjectId} • ${selectedClassForDrill.className}`}>
                  {selectedSubjectKpis && selectedSubjectTrendData.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Subject Average</p>
                          <p className="text-2xl font-bold mt-2">{selectedSubjectKpis.subjectAverage}%</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Highest Score</p>
                          <p className="text-2xl font-bold mt-2">{selectedSubjectKpis.highestScore}%</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Lowest Score</p>
                          <p className="text-2xl font-bold mt-2">{selectedSubjectKpis.lowestScore}%</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Teacher Compliance Rate</p>
                          <p className="text-2xl font-bold mt-2">
                            {selectedSubjectKpis.teacherComplianceRate === null ? 'N/A' : `${selectedSubjectKpis.teacherComplianceRate}%`}
                          </p>
                        </div>
                      </div>

                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={selectedSubjectTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="termLabel" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={3} name="Average Score" />
                          <Line type="monotone" dataKey="passRate" stroke="#16a34a" strokeWidth={2} strokeDasharray="6 4" name="Pass Rate" />
                        </LineChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Subject selected, but no trend records are available for the current range.
                    </div>
                  )}
                </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Score Distribution by Class">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={classPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="className" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="averageScore" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Pass Rate vs Attendance Trend">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={classPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="className" />
                      <YAxis yAxisId="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="passRate" stroke="#16a34a" strokeWidth={2} name="Pass Rate" />
                      <Line yAxisId="right" type="monotone" dataKey="attendanceRate" stroke="#f59e0b" strokeWidth={2} name="Attendance" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {selectedClassForDrill && (
                <Card
                  title={`Class Deep Dive: ${selectedClassForDrill.className}`}
                  action={
                    selectedSubjectId ? (
                      <Button size="sm" variant="outline" onClick={() => setSelectedSubjectId(null)}>
                        Clear Filter
                      </Button>
                    ) : null
                  }
                >
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Subject-Level Metrics</p>
                      <div className="space-y-2">
                        {selectedSubjectPerformance.map((subjectRow) => (
                          <div
                            key={subjectRow.subject}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              selectedSubjectId === subjectRow.subject
                                ? 'border-primary bg-accent/30'
                                : 'border-border hover:bg-muted/30'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextSubject = selectedSubjectId === subjectRow.subject ? null : subjectRow.subject;
                              setSelectedSubjectId(nextSubject);
                              setSelectedSubjectDetail(nextSubject || '');
                            }}
                          >
                            <div className="flex justify-between text-sm">
                              <span>{subjectRow.subject}</span>
                              <Badge variant="default">Avg {subjectRow.average}%</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Pass Rate: {subjectRow.passRate}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">
                        {selectedSubjectId ? `${selectedSubjectId} Performance Trend` : 'Grade Distribution Histogram'}
                      </p>
                      {selectedSubjectId ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={deepDiveSubjectTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="average" stroke="#6366f1" strokeWidth={2.5} name="Weekly Average" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={gradeDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grade" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">
                        At-Risk Students (&lt; 40%) {selectedSubjectId ? `- ${selectedSubjectId}` : ''}
                      </p>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {filteredAtRiskStudents.length > 0 ? (
                          filteredAtRiskStudents.map((student: AtRiskStudent) => (
                            <div key={student.id} className="p-2 border border-red-200 bg-red-50 dark:bg-red-950/30 rounded">
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-red-700 dark:text-red-300">
                                {selectedSubjectId ? 'Subject Average' : 'Cumulative Average'}: {student.cumulativeAverage}%
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 border border-dashed rounded text-sm text-muted-foreground">
                            No at-risk students found for this {selectedSubjectId ? 'subject' : 'class'} in the selected range.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ========== DATA HEALTH (NEW) ========== */}
      {activeSection === 'data_health' && (
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
              <div className="lg:col-span-1 rounded-xl border border-border p-5 bg-accent/20">
                <p className="text-sm text-muted-foreground">Overall Data Completeness</p>
                <p className="text-5xl font-bold mt-2">{overallDataCompletenessScore}%</p>
                <p className="text-xs mt-2 text-muted-foreground">Drives parent confidence and paid conversion after trial.</p>
              </div>
              <div className="lg:col-span-2 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Attendance marked on time</span>
                    <span className="font-medium">{dataCompletenessBreakdown.attendanceOnTime}%</span>
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${dataCompletenessBreakdown.attendanceOnTime}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Lesson notes submitted</span>
                    <span className="font-medium">{dataCompletenessBreakdown.lessonNotesSubmitted}%</span>
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${dataCompletenessBreakdown.lessonNotesSubmitted}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Assessments graded within 3 days</span>
                    <span className="font-medium">{dataCompletenessBreakdown.assessmentsWithinSla}%</span>
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${dataCompletenessBreakdown.assessmentsWithinSla}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Medical/pickup logs used</span>
                    <span className="font-medium">{dataCompletenessBreakdown.medicalPickupUsage}%</span>
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-red-400" style={{ width: `${dataCompletenessBreakdown.medicalPickupUsage}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Teacher and Class Data Compliance"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={weeklySummaryEnabled}
                    onChange={(e) => setWeeklySummaryEnabled(e.target.checked)}
                  />
                  Weekly summary email to admin
                </label>
                <Button size="sm" variant="outline" onClick={selectAllDataHealthRows}>
                  {selectedDataHealthRows.length === dataHealthRowsSorted.length ? 'Clear Selection' : 'Select All'}
                </Button>
                <Button size="sm" onClick={handleSendDataReminder} disabled={!selectedDataHealthRows.length}>
                  <Mail size={14} className="mr-1" />Send reminder ({selectedDataHealthRows.length})
                </Button>
              </div>
            }
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Button size="sm" variant={dataHealthSortBy === 'worst' ? 'primary' : 'outline'} onClick={() => setDataHealthSortBy('worst')}>Worst Performance</Button>
              <Button size="sm" variant={dataHealthSortBy === 'attendance' ? 'primary' : 'outline'} onClick={() => setDataHealthSortBy('attendance')}>Attendance</Button>
              <Button size="sm" variant={dataHealthSortBy === 'lesson_notes' ? 'primary' : 'outline'} onClick={() => setDataHealthSortBy('lesson_notes')}>Lesson Notes</Button>
              <Button size="sm" variant={dataHealthSortBy === 'turnaround' ? 'primary' : 'outline'} onClick={() => setDataHealthSortBy('turnaround')}>Assessment Turnaround</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2">Nudge</th>
                    <th className="py-2">Teacher</th>
                    <th className="py-2">Class</th>
                    <th className="py-2">Subject</th>
                    <th className="py-2">Attendance Compliance</th>
                    <th className="py-2">Lesson Notes On Time</th>
                    <th className="py-2">Assessment Turnaround</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHealthRowsSorted.map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/30">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={selectedDataHealthRows.includes(row.id)}
                          onChange={() => toggleDataHealthRowSelection(row.id)}
                        />
                      </td>
                      <td className="py-2 font-medium">{row.teacherName}</td>
                      <td className="py-2">{row.className}</td>
                      <td className="py-2">{row.subject}</td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${metricBadgeClassName(row.attendanceCompliance)}`}>
                          {row.attendanceCompliance}%
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${metricBadgeClassName(row.lessonNotesOnTime)}`}>
                          {row.lessonNotesOnTime}%
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${turnaroundBadgeClassName(row.assessmentTurnaroundDays)}`}>
                          {row.assessmentTurnaroundDays} day{row.assessmentTurnaroundDays === 1 ? '' : 's'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card title="Stale Data Alerts">
              <div className="space-y-2">
                {staleDataAlerts.map((alertItem) => (
                  <div
                    key={alertItem.id}
                    className={`p-3 rounded-lg border ${alertItem.severity === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950/30' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/30'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{alertItem.message}</p>
                      <Badge variant={alertItem.severity === 'critical' ? 'rejected' : 'pending'}>{alertItem.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Detected: {alertItem.date}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Parent Engagement Proxy (Anonymised)">
              <div className="space-y-2">
                {parentEngagementByClass.map((item) => (
                  <div key={item.className} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium">{item.className}</p>
                      <span>{item.engagement}% parent login rate</span>
                    </div>
                    <div className="mt-2 h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${item.engagement}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========== RESULT APPROVALS ========== */}
      {activeSection === 'result_approvals' && (
        <div className="space-y-4">
          <Card
            title="Gradebook Submission Registry"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by teacher name..."
                  className="px-3 py-2 border border-border rounded text-sm bg-input-background"
                  value={approvalFilters.teacherName}
                  onChange={(e) => setApprovalFilters({ ...approvalFilters, teacherName: e.target.value })}
                />
                <select
                  className="px-3 py-2 border border-border rounded text-sm bg-input-background"
                  value={approvalFilters.status}
                  onChange={(e) => setApprovalFilters({ ...approvalFilters, status: e.target.value as GradebookStatus | '' })}
                >
                  <option value="">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  className="px-3 py-2 border border-border rounded text-sm bg-input-background"
                  value={approvalFilters.term}
                  onChange={(e) => setApprovalFilters({ ...approvalFilters, term: e.target.value })}
                >
                  <option value="">All Terms</option>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
            }
          >
            {filteredApprovals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>No gradebooks match the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-2">Teacher Name</th>
                      <th className="py-2 px-2">Subject</th>
                      <th className="py-2 px-2">Class</th>
                      <th className="py-2 px-2">Term</th>
                      <th className="py-2 px-2">Submission Date</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApprovals.map((config) => (
                      <tr key={config.id} className="border-b border-border hover:bg-muted/30">
                        <td className="py-3 px-2 font-medium">Teacher Name</td>
                        <td className="py-3 px-2">{config.subject}</td>
                        <td className="py-3 px-2">{config.className}</td>
                        <td className="py-3 px-2">{config.term}</td>
                        <td className="py-3 px-2">
                          {config.submittedAt ? new Date(config.submittedAt).toLocaleDateString() : 'Not submitted'}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={gradebookStatusBadgeVariant(config.status)}>
                            {config.status.charAt(0).toUpperCase() + config.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          {config.status === 'submitted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReviewConfig(config);
                                setShowReviewModal(true);
                              }}
                            >
                              <Eye size={14} className="mr-1" />
                              Review
                            </Button>
                          )}
                          {config.status === 'rejected' && (
                            <div className="text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-200 px-2 py-1 rounded">
                              {config.rejectionReason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="text-xs text-muted-foreground p-3 bg-accent/20 rounded border border-border">
            <p className="font-medium mb-1">About Result Approvals</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Submitted gradebooks appear in this registry for admin review.</li>
              <li>Approval marks results as <strong>Final</strong> and makes them visible to the Parent Intelligence Platform.</li>
              <li>Rejection sends feedback to the teacher to revise their weighting configuration.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedReviewConfig && (
        <Modal
          isOpen
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReviewConfig(null);
          }}
          title={`Review Gradebook: ${selectedReviewConfig.subject} - ${selectedReviewConfig.className}`}
          footer={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (selectedReviewConfig) openResultPreview(selectedReviewConfig);
                }}
              >
                <Eye size={14} className="mr-1" />
                Full Preview
              </Button>
              <Button variant="destructive" onClick={() => setShowRejectReasonModal(true)}>
                <XCircle size={14} className="mr-1" />
                Reject
              </Button>
              <Button onClick={() => handleApproveGradebook(selectedReviewConfig)}>
                <CheckCircle size={14} className="mr-1" />
                Approve
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Weighting Summary */}
            <div>
              <h3 className="font-semibold mb-3">Weighting Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(selectedReviewConfig.categoryWeights).map(([category, weight]) => (
                  <div key={category} className="p-3 border border-border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-bold text-primary">{weight}%</span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${weight}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className={`font-bold ${isWeightingCompliant(selectedReviewConfig) ? 'text-green-600' : 'text-red-600'}`}>
                    {Object.values(selectedReviewConfig.categoryWeights).reduce((sum, w) => sum + w, 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Check */}
            <div>
              <h3 className="font-semibold mb-3">Compliance Check</h3>
              <div className={`p-4 rounded border-2 ${isWeightingCompliant(selectedReviewConfig) ? 'border-green-200 bg-green-50 dark:bg-green-950/30' : 'border-red-200 bg-red-50 dark:bg-red-950/30'}`}>
                <div className="flex items-start gap-2">
                  {isWeightingCompliant(selectedReviewConfig) ? (
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isWeightingCompliant(selectedReviewConfig) ? 'Weights are compliant (total 100%)' : 'Weights are NOT compliant (must total 100%)'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isWeightingCompliant(selectedReviewConfig)
                        ? 'Teacher followed the weight policy requirement.'
                        : 'Teacher weights do not sum to 100%. Request revision.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grade Preview */}
            <div>
              <h3 className="font-semibold mb-3">Grade Preview (Sample)</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Estimated distribution based on mock assessments and these weights:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-border rounded">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Grade Band</th>
                      <th className="p-2 text-right">With These Weights</th>
                      <th className="p-2 text-right">Visual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { grade: 'A (70+)', estimate: '30%' },
                      { grade: 'B (60-69)', estimate: '40%' },
                      { grade: 'C (50-59)', estimate: '20%' },
                      { grade: 'D (40-49)', estimate: '8%' },
                      { grade: 'F (<40)', estimate: '2%' },
                    ].map(({ grade, estimate }) => (
                      <tr key={grade} className="border-t border-border">
                        <td className="p-2">{grade}</td>
                        <td className="p-2 text-right font-medium">{estimate}</td>
                        <td className="p-2">
                          <div className="h-2 rounded bg-muted overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: estimate }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="p-3 bg-accent/20 rounded border border-border">
              <p className="text-xs font-medium text-muted-foreground">
                ℹ️ Once approved, this gradebook becomes visible to the Parent Intelligence Platform. Teachers cannot edit approved configurations.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {showRejectReasonModal && selectedReviewConfig && (
        <Modal
          isOpen
          onClose={() => {
            setShowRejectReasonModal(false);
            setRejectReason('');
          }}
          title="Reject Gradebook"
          footer={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectReasonModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectGradebook} disabled={!rejectReason.trim()}>
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Gradebook:</strong> {selectedReviewConfig.subject} - {selectedReviewConfig.className}
              </p>
              <p className="text-sm mb-3">Provide feedback for the teacher on why this gradebook was rejected:</p>
              <textarea
                className="w-full p-3 border border-border rounded bg-input-background text-sm min-h-[150px]"
                placeholder="E.g., Weights do not total 100%, or weights do not align with school policy..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Result Preview Sheet */}
      {showResultPreviewSheet && resultPreviewData && (
        <Sheet open={showResultPreviewSheet} onOpenChange={setShowResultPreviewSheet}>
          <SheetContent side="right" className="w-full sm:w-[90vw] lg:w-[85vw] max-w-6xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl">
                Result Preview: {resultPreviewData.config.subject} - {resultPreviewData.config.className}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 pb-24">
              {/* Teacher's Weighting Logic */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Teacher's Weighting Logic</h3>
                  <Badge variant={resultPreviewData.policyAligned ? 'approved' : 'default'}>
                    {resultPreviewData.policyAligned ? 'Policy Aligned' : 'Custom'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(resultPreviewData.config.categoryWeights).map(([category, weight]) => (
                    <div key={category} className="p-3 border border-border rounded text-center">
                      <p className="text-xs text-muted-foreground mb-2">{category}</p>
                      <p className="text-xl font-bold text-primary">{weight}%</p>
                      <div className="mt-2 h-2 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${weight}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {!isWeightingCompliant(resultPreviewData.config) && (
                  <div className="mt-3 p-3 rounded border border-red-200 bg-red-50 dark:bg-red-950/30">
                    <p className="text-xs text-red-700 dark:text-red-200">
                      ⚠️ Weights do not total 100% - Compliance check failed
                    </p>
                  </div>
                )}
              </div>

              {/* Class Average & Distribution Overview */}
              <div>
                <h3 className="font-semibold mb-3">Class Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 border border-border rounded">
                    <p className="text-sm text-muted-foreground">Class Average</p>
                    <p className="text-3xl font-bold mt-2">{resultPreviewData.classAverage}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {calculateLetterGrade(resultPreviewData.classAverage)} Grade
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded">
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-3xl font-bold mt-2">{resultPreviewData.students.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Outliers: {resultPreviewData.students.filter((s) => s.isOutlier).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grade Distribution Chart */}
              <div>
                <h3 className="font-semibold mb-3">Grade Distribution (Histogram)</h3>
                <div className="p-4 border border-border rounded bg-accent/30">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={resultPreviewData.gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'count') return [`${value} students`, 'Count'];
                          return [`${value}%`, 'Percentage'];
                        }}
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
                    {resultPreviewData.gradeDistribution.map((item) => (
                      <div key={item.grade}>
                        <p className="font-bold">{item.grade}</p>
                        <p className="text-muted-foreground">{item.count}pt ({item.percentage}%)</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Results Table */}
              <div>
                <h3 className="font-semibold mb-3">Student Results</h3>
                <div className="border border-border rounded overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Student Name</th>
                        <th className="p-3 text-right">Weighted Average</th>
                        <th className="p-3 text-center">Letter Grade</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultPreviewData.students.map((student, idx) => (
                        <tr
                          key={student.studentId}
                          className={`border-t border-border hover:bg-muted/50 ${
                            student.isOutlier ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{student.studentName}</p>
                              {student.isOutlier && (
                                <p className="text-xs text-amber-700 dark:text-amber-200">
                                  ⚠ {student.outlierReason}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`font-bold ${
                              student.weightedAverage >= 70 ? 'text-green-600' :
                              student.weightedAverage >= 50 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {student.weightedAverage}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">/ 100</span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={
                                student.letterGrade === 'A' || student.letterGrade === 'B' ? 'approved' :
                                student.letterGrade === 'C' ? 'submitted' :
                                student.letterGrade === 'D' ? 'pending' : 'rejected'
                              }
                            >
                              {student.letterGrade}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {student.isOutlier ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 text-xs font-bold">
                                !
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Outliers (highlighted in amber) have exceptionally low scores (&lt;40%) or exceptionally high scores (&gt;90%). 
                  Review these records for potential data entry errors.
                </p>
              </div>

              {/* Admin Decision Footer */}
            </div>

            <SheetFooter className="fixed bottom-0 right-0 left-0 bg-background border-t border-border p-4 gap-2 flex items-center justify-between sm:w-[90vw] lg:w-[85vw] max-w-6xl">
              <Button 
                variant="outline" 
                onClick={() => setShowResultPreviewSheet(false)}
              >
                Close Preview
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setShowResultPreviewSheet(false);
                    setShowRejectReasonModal(true);
                  }}
                >
                  <XCircle size={14} className="mr-1" />
                  Reject
                </Button>
                <Button 
                  onClick={() => {
                    if (resultPreviewData?.config) {
                      handleApproveGradebook(resultPreviewData.config);
                      setShowResultPreviewSheet(false);
                    }
                  }}
                >
                  <CheckCircle size={14} className="mr-1" />
                  Approve
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* ========== SCHOOL SETUP ========== */}
      {activeSection === 'school' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setSchoolSection('classes')}
              className={`px-3 py-2 text-sm rounded-md flex items-center gap-2 ${schoolSection === 'classes' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
            >
              <Layout size={14} /> Classes
            </button>
            <button
              type="button"
              onClick={() => setSchoolSection('subjects')}
              className={`px-3 py-2 text-sm rounded-md flex items-center gap-2 ${schoolSection === 'subjects' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
            >
              <BookOpen size={14} /> Subjects
            </button>
            <button
              type="button"
              onClick={() => setSchoolSection('calendar')}
              className={`px-3 py-2 text-sm rounded-md flex items-center gap-2 ${schoolSection === 'calendar' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
            >
              <CalendarDays size={14} /> Calendar
            </button>
            <button
              type="button"
              onClick={() => setSchoolSection('assessments')}
              className={`px-3 py-2 text-sm rounded-md flex items-center gap-2 ${schoolSection === 'assessments' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'}`}
            >
              <ClipboardList size={14} /> Tests & Exams
            </button>
          </div>

          <div className="space-y-6">
            {schoolSection === 'classes' && (
              <Card
                title="Class Configuration"
                action={<Button size="sm" onClick={() => openClassEditor()}><Plus size={16} className="mr-2" />Add Class</Button>}
              >
                <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card>
                    <p className="text-sm text-muted-foreground">Total Classes</p>
                    <p className="text-2xl font-bold mt-2">{schoolClasses.length}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-muted-foreground">Junior Secondary</p>
                    <p className="text-2xl font-bold mt-2">{schoolClasses.filter((entry) => entry.category === 'Junior Secondary').length}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-muted-foreground">Senior Secondary</p>
                    <p className="text-2xl font-bold mt-2">{schoolClasses.filter((entry) => entry.category === 'Senior Secondary').length}</p>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2">Class Name</th>
                        <th className="py-2">Category</th>
                        <th className="py-2">Capacity</th>
                        <th className="py-2">Enrolled</th>
                        <th className="py-2">Subjects</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolClasses.map((schoolClass) => (
                        <tr
                          key={schoolClass.id}
                          className="border-b border-border hover:bg-muted/30 cursor-pointer"
                          onClick={() => navigate(`/admin/classes/${schoolClass.id}`)}
                        >
                          <td className="py-2 font-medium text-primary">{schoolClass.name}</td>
                          <td className="py-2">{schoolClass.category}</td>
                          <td className="py-2">{schoolClass.capacity}</td>
                          <td className="py-2">{schoolClass.students}</td>
                          <td className="py-2">
                            <Badge variant="default">{schoolSubjectMappings.filter((mapping) => mapping.classId === schoolClass.id).length} mapped</Badge>
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openClassEditor(schoolClass); }}>
                                <Edit size={14} className="mr-1" />Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openMappingEditor(schoolClass); }}>
                                <BookOpen size={14} className="mr-1" />Map Subjects
                              </Button>
                              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setConfirmDeleteClass(schoolClass); }}>
                                <Trash2 size={14} className="mr-1" />Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {schoolSection === 'subjects' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="School Subject List" action={<Button size="sm" onClick={() => openSubjectEditor()}><Plus size={16} className="mr-2" />Add Subject</Button>}>
                  <div className="space-y-2">
                    {schoolSubjects.map((subject) => {
                      const mappedCount = schoolSubjectMappings.filter((mapping) => mapping.subject === subject).length;

                      return (
                        <div key={subject} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <div>
                            <p className="font-medium">{subject}</p>
                            <p className="text-xs text-muted-foreground">Attached to {mappedCount} class{mappedCount === 1 ? '' : 'es'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Master</Badge>
                            <Button size="sm" variant="outline" onClick={() => openSubjectEditor(subject)}>
                              <Edit size={14} className="mr-1" />Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteSubject(subject)}>
                              <Trash2 size={14} className="mr-1" />Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card title="Mapping Tool">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Select Class</label>
                      <select
                        className="w-full p-2 border border-border rounded bg-input-background"
                        value={selectedClassForMapping?.id || ''}
                        onChange={(e) => {
                          const nextClass = schoolClasses.find((entry) => String(entry.id) === e.target.value) || null;
                          if (nextClass) openMappingEditor(nextClass);
                        }}
                      >
                        <option value="">Choose a class...</option>
                        {schoolClasses.map((schoolClass) => (
                          <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
                        ))}
                      </select>
                    </div>
                    {selectedClassForMapping ? (
                      <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                        Use the modal to map subjects for {selectedClassForMapping.name}.
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                        Select a class to begin mapping its subjects.
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {schoolSection === 'calendar' && (
              <Card
                title="Academic Calendar"
                action={<Button size="sm" onClick={() => openTermEditor()}><Plus size={16} className="mr-2" />Add Term</Button>}
              >
                <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-sm">
                  Setting a new current term archives the previous active term across the school.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2">Term Name</th>
                        <th className="py-2">Start Date</th>
                        <th className="py-2">End Date</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolTerms.map((term) => (
                        <tr key={term.id} className={`border-b border-border ${term.status === 'active' ? 'bg-green-50/70 dark:bg-green-950/20' : ''}`}>
                          <td className="py-2 font-medium">{term.name}</td>
                          <td className="py-2">{term.startDate}</td>
                          <td className="py-2">{term.endDate}</td>
                          <td className="py-2">
                            <Badge variant={term.status === 'active' ? 'approved' : term.status === 'completed' ? 'default' : 'pending'}>
                              {term.status}
                            </Badge>
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => openTermEditor(term)}>
                                <Edit size={14} className="mr-1" />Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleSetAsCurrentTerm(term)}>
                                <CalendarDays size={14} className="mr-1" />Set as Current Term
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {schoolSection === 'assessments' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card>
                    <p className="text-sm text-muted-foreground">Unified Test</p>
                    <p className="text-2xl font-bold mt-2">{testSchedule.week}</p>
                    <p className="text-sm text-muted-foreground">{testSchedule.date} at {testSchedule.time}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-muted-foreground">Unified Exam</p>
                    <p className="text-2xl font-bold mt-2">{examSchedule.week}</p>
                    <p className="text-sm text-muted-foreground">{examSchedule.date} at {examSchedule.time}</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <Card title="Test Timetable">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={testSchedule.week}
                          onChange={(e) => setTestSchedule((prev) => ({ ...prev, week: e.target.value }))}
                          placeholder="Week 7"
                        />
                        <input
                          type="date"
                          className="p-2 border border-border rounded bg-input-background"
                          value={testSchedule.date}
                          onChange={(e) => updateAssessmentSchedule('test', 'date', e.target.value)}
                        />
                        <input
                          type="time"
                          className="p-2 border border-border rounded bg-input-background"
                          value={testSchedule.time}
                          onChange={(e) => updateAssessmentSchedule('test', 'time', e.target.value)}
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background md:col-span-1"
                          value={testSchedule.notes}
                          onChange={(e) => setTestSchedule((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Test notes"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'test' ? assessmentForm.day : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'test', day: e.target.value }))}
                          placeholder="Day"
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'test' ? assessmentForm.time : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'test', time: e.target.value }))}
                          placeholder="Time"
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'test' ? assessmentForm.venue : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'test', venue: e.target.value }))}
                          placeholder="Venue"
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'test' ? assessmentForm.subjectOrPaper : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'test', subjectOrPaper: e.target.value }))}
                          placeholder="Subject/Paper"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleAddAssessmentTimetableItem}>
                          <Plus size={14} className="mr-1" />Add Test Timetable Row
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="py-2">Day</th>
                              <th className="py-2">Time</th>
                              <th className="py-2">Venue</th>
                              <th className="py-2">Subject/Paper</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testSchedule.timetable.map((item) => (
                              <tr key={`${item.day}-${item.time}-${item.subjectOrPaper}`} className="border-b border-border">
                                <td className="py-2">{item.day}</td>
                                <td className="py-2">{item.time}</td>
                                <td className="py-2">{item.venue}</td>
                                <td className="py-2">{item.subjectOrPaper}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>

                  <Card title="Exam Timetable">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={examSchedule.week}
                          onChange={(e) => setExamSchedule((prev) => ({ ...prev, week: e.target.value }))}
                          placeholder="Week 12"
                        />
                        <input
                          type="date"
                          className="p-2 border border-border rounded bg-input-background"
                          value={examSchedule.date}
                          onChange={(e) => updateAssessmentSchedule('exam', 'date', e.target.value)}
                        />
                        <input
                          type="time"
                          className="p-2 border border-border rounded bg-input-background"
                          value={examSchedule.time}
                          onChange={(e) => updateAssessmentSchedule('exam', 'time', e.target.value)}
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background md:col-span-1"
                          value={examSchedule.notes}
                          onChange={(e) => setExamSchedule((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Exam notes"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'exam' ? assessmentForm.day : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'exam', day: e.target.value }))}
                          placeholder="Day"
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'exam' ? assessmentForm.time : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'exam', time: e.target.value }))}
                          placeholder="Time"
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'exam' ? assessmentForm.venue : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'exam', venue: e.target.value }))}
                          placeholder="Venue"
                        />
                        <input
                          type="text"
                          className="p-2 border border-border rounded bg-input-background"
                          value={assessmentForm.kind === 'exam' ? assessmentForm.subjectOrPaper : ''}
                          onChange={(e) => setAssessmentForm((prev) => ({ ...prev, kind: 'exam', subjectOrPaper: e.target.value }))}
                          placeholder="Subject/Paper"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleAddAssessmentTimetableItem}>
                          <Plus size={14} className="mr-1" />Add Exam Timetable Row
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="py-2">Day</th>
                              <th className="py-2">Time</th>
                              <th className="py-2">Venue</th>
                              <th className="py-2">Subject/Paper</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examSchedule.timetable.map((item) => (
                              <tr key={`${item.day}-${item.time}-${item.subjectOrPaper}`} className="border-b border-border">
                                <td className="py-2">{item.day}</td>
                                <td className="py-2">{item.time}</td>
                                <td className="py-2">{item.venue}</td>
                                <td className="py-2">{item.subjectOrPaper}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== USER MANAGEMENT ========== */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <p className="text-sm text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold mt-2">{totalStaffCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
              <p className="text-2xl font-bold mt-2">{pendingInvitesCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Role Distribution</p>
              <p className="text-sm font-medium mt-2">Teachers: {teacherCount}</p>
              <p className="text-sm font-medium">Non-Teaching: {nonTeachingCount}</p>
            </Card>
          </div>

          <Card title="Staff Identity & Access Management" action={<Button size="sm" onClick={() => setShowAddUserModal(true)}><UserPlus size={16} className="mr-2" />Invite User</Button>}>
            <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Search name or email"
                className="p-2 border border-border rounded bg-input-background md:col-span-2"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                {staffRoleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending_invitation">Pending Invitation</option>
              </select>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-10 border border-dashed border-border rounded-lg text-center">
                <Users size={32} className="mx-auto text-muted-foreground" />
                <p className="mt-3 font-medium">User not found</p>
                <p className="text-sm text-muted-foreground">Try another filter or invite a new user.</p>
                <Button className="mt-4" onClick={() => setShowAddUserModal(true)}>
                  <UserPlus size={16} className="mr-2" />Invite New User
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2">Name & Avatar</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Contact</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Last Activity</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-semibold">
                              {initialsForName(user.name)}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td className="py-2">
                          <Badge variant="default" className={roleBadgeClassName(user.role)}>{user.role}</Badge>
                        </td>
                        <td className="py-2">{user.email}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-full text-xs border ${user.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-200' : user.status === 'inactive' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-200' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200'}`}
                            onClick={() => {
                              if (user.status === 'active') {
                                setConfirmDeactivateUser(user);
                              } else {
                                handleActivateUser(user.id);
                              }
                            }}
                          >
                            {user.status === 'active' ? 'Active' : user.status === 'inactive' ? 'Inactive' : 'Pending Invitation'}
                          </button>
                        </td>
                        <td className="py-2 text-muted-foreground">{formatRelativeActivity(user.lastActive)}</td>
                        <td className="py-2 text-right">
                          <div className="relative inline-block text-left">
                            <Button size="sm" variant="outline" onClick={() => setOpenUserActionId((prev) => (prev === user.id ? null : user.id))}>
                              <MoreVertical size={14} />
                            </Button>
                            {openUserActionId === user.id && (
                              <div className="absolute right-0 mt-1 w-52 rounded-md border border-border bg-background shadow-lg z-20">
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                  onClick={() => {
                                    openRoleEditModal(user);
                                    setOpenUserActionId(null);
                                  }}
                                >
                                  <ShieldCheck size={14} className="inline mr-2" />Edit Role
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                  onClick={() => {
                                    if (user.status === 'active') {
                                      setConfirmDeactivateUser(user);
                                    } else {
                                      handleActivateUser(user.id);
                                    }
                                    setOpenUserActionId(null);
                                  }}
                                >
                                  {user.status === 'active' ? <UserX size={14} className="inline mr-2" /> : <UserCheck size={14} className="inline mr-2" />}
                                  {user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                  onClick={() => {
                                    handleResendInvitation(user.email);
                                    setOpenUserActionId(null);
                                  }}
                                >
                                  <Mail size={14} className="inline mr-2" />Resend Invitation
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                  onClick={() => {
                                    handleManualPasswordReset(user);
                                    setOpenUserActionId(null);
                                  }}
                                >
                                  <ShieldAlert size={14} className="inline mr-2" />Manual Password Reset
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                  onClick={() => {
                                    handleForceLogout(user);
                                    setOpenUserActionId(null);
                                  }}
                                >
                                  <RefreshCw size={14} className="inline mr-2" />Force Logout
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========== AUDIT LOGS ========== */}
      {activeSection === 'audit' && (
        <Card
          title="Audit Logs & Security Registry"
          action={
            <Button size="sm" variant="outline" onClick={handleDownloadAuditTrailCsv}>
              <Download size={14} className="mr-1" />Download Audit Trail
            </Button>
          }
        >
          <div className="mb-3 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded text-sm">
            Immutable View: Audit logs are read-only and cannot be edited or deleted by any user, including admins.
          </div>

          <div className="mb-3 grid grid-cols-1 md:grid-cols-6 gap-2">
            <input
              type="text"
              placeholder="Search actor, module, action..."
              className="p-2 border border-border rounded bg-input-background md:col-span-2"
              value={auditFilters.search}
              onChange={(e) => setAuditFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <select
              className="p-2 border border-border rounded bg-input-background"
              value={auditFilters.role}
              onChange={(e) => setAuditFilters((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="">All Roles</option>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
            <select
              className="p-2 border border-border rounded bg-input-background"
              value={auditFilters.module}
              onChange={(e) => setAuditFilters((prev) => ({ ...prev, module: e.target.value }))}
            >
              <option value="">All Modules</option>
              {modules.map((module) => <option key={module}>{module}</option>)}
            </select>
            <select
              className="p-2 border border-border rounded bg-input-background"
              value={auditFilters.datePreset}
              onChange={(e) => setAuditFilters((prev) => ({ ...prev, datePreset: e.target.value }))}
            >
              <option value="day">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="term">Active Term</option>
              <option value="custom">Custom</option>
            </select>
            <label className="flex items-center gap-2 p-2 border border-red-300 rounded bg-red-50 dark:bg-red-950/30 text-sm">
              <input
                type="checkbox"
                checked={auditFilters.highRiskOnly}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, highRiskOnly: e.target.checked }))}
              />
              <ShieldAlert size={14} className="text-red-600" />
              High-Risk Only
            </label>
          </div>

          {auditFilters.datePreset === 'custom' && (
            <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="date"
                className="p-2 border border-border rounded bg-input-background"
                value={auditFilters.startDate}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
              <input
                type="date"
                className="p-2 border border-border rounded bg-input-background"
                value={auditFilters.endDate}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          )}

          <div className="overflow-x-auto border border-border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30 text-left">
                  <th className="py-2 px-2">Timestamp</th>
                  <th className="py-2 px-2">Actor</th>
                  <th className="py-2 px-2">Module</th>
                  <th className="py-2 px-2">Action</th>
                  <th className="py-2 px-2">Risk Level</th>
                  <th className="py-2 px-2">IP Address</th>
                  <th className="py-2 px-2">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAuditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-2">{log.actorName} | {log.actorRole}</td>
                    <td className="py-2 px-2">{log.module}</td>
                    <td className="py-2 px-2">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.description}</p>
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant={log.riskLevel === 'high' ? 'rejected' : log.riskLevel === 'medium' ? 'pending' : 'default'}>
                        {log.riskLevel === 'high' ? <ShieldAlert size={12} className="mr-1" /> : <Info size={12} className="mr-1" />}
                        {log.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe size={12} /> {log.ipAddress || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenAuditMetadata(log)}>
                        <Eye size={14} className="mr-1" />View Metadata
                      </Button>
                    </td>
                  </tr>
                ))}
                {paginatedAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 px-2 text-center text-muted-foreground">No audit events match current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Showing {(auditPage - 1) * auditPageSize + 1}-{Math.min(auditPage * auditPageSize, filteredAuditLogs.length)} of {filteredAuditLogs.length} events</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={auditPage <= 1} onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}>Previous</Button>
              <span>Page {auditPage} / {totalAuditPages}</span>
              <Button size="sm" variant="outline" disabled={auditPage >= totalAuditPages} onClick={() => setAuditPage((prev) => Math.min(totalAuditPages, prev + 1))}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      {/* ========== SYLLABUS MANAGEMENT (NEW) ========== */}
      {activeSection === 'syllabus' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <p className="text-sm text-muted-foreground">Submission Rate</p>
              <p className="text-2xl font-bold mt-2">{syllabusSubmissionRate}%</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Approval Bottleneck</p>
              <p className="text-sm font-medium mt-2">{approvalBottleneck}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Revision Frequency</p>
              <p className="text-2xl font-bold mt-2">{revisionFrequency}</p>
            </Card>
          </div>

          <Card title="Global Curriculum Registry" action={<Badge variant="default">{filteredSyllabi.length} records</Badge>}>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Academic Term</label>
                  <select
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={syllabusFilters.term}
                    onChange={(e) => setSyllabusFilters((prev) => ({ ...prev, term: e.target.value }))}
                  >
                    <option>Term 1, 2026</option>
                    <option>Term 2, 2026</option>
                    <option>Term 3, 2026</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Department</label>
                  <select
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={syllabusFilters.department}
                    onChange={(e) => setSyllabusFilters((prev) => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">All Departments</option>
                    {syllabusDepartments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Teacher</label>
                  <select
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={syllabusFilters.teacher}
                    onChange={(e) => setSyllabusFilters((prev) => ({ ...prev, teacher: e.target.value }))}
                  >
                    <option value="">All Teachers</option>
                    {syllabusTeachers.map((teacher) => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Compliance Status</label>
                  <select
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={syllabusFilters.complianceStatus}
                    onChange={(e) => setSyllabusFilters((prev) => ({ ...prev, complianceStatus: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="missing">Missing Submissions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Missing Week</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={syllabusFilters.missingWeek}
                    onChange={(e) => setSyllabusFilters((prev) => ({ ...prev, missingWeek: e.target.value }))}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Critical Flag:</span>
                  <button
                    type="button"
                    onClick={() => setCriticalOverrideEnabled((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 rounded-full ${criticalOverrideEnabled ? 'bg-red-600' : 'bg-gray-400'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${criticalOverrideEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkMarkPendingSyllabi} disabled={!selectedSyllabusIds.length}>
                    Mark as Pending ({selectedSyllabusIds.length})
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleBulkApproveSyllabi} disabled={!selectedSyllabusIds.length}>
                    Approve All ({selectedSyllabusIds.length})
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2"></th>
                    <th className="py-2">Context</th>
                    <th className="py-2">Ownership</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Timeline</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSyllabi.map((syl) => {
                    const expanded = expandedSyllabusIds.includes(syl.id);
                    const selectable = syl.id > 0;
                    const statusLabel = syl.id < 0 ? 'missing' : syl.status;

                    return (
                      <>
                        <tr
                          key={syl.id}
                          className="border-b border-border hover:bg-muted/30"
                          onClick={() => toggleSyllabusExpanded(syl.id)}
                        >
                          <td className="py-2" onClick={(e) => e.stopPropagation()}>
                            {selectable && (
                              <input
                                type="checkbox"
                                checked={selectedSyllabusIds.includes(syl.id)}
                                onChange={() => toggleSyllabusSelection(syl.id)}
                              />
                            )}
                          </td>
                          <td className="py-2">
                            <p>{syl.class} • {syl.subject}</p>
                            <p className="text-xs text-muted-foreground">Week {syl.week} • {syl.term}</p>
                          </td>
                          <td className="py-2">{syl.teacher}</td>
                          <td className="py-2">
                            <Badge variant={statusLabel === 'approved' ? 'approved' : statusLabel === 'submitted' ? 'pending' : statusLabel === 'rejected' || statusLabel === 'missing' ? 'rejected' : 'default'}>
                              {statusLabel}
                            </Badge>
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            <p>Submitted: {syl.submittedDate || 'N/A'}</p>
                            <p>Finalized: {syl.approvedDate || 'N/A'}</p>
                          </td>
                          <td className="py-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleOpenSyllabusHistory(syl)} disabled={syl.id < 0}>
                                View Change Log
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleForceApproveSyllabus(syl.id)}
                                disabled={!criticalOverrideEnabled || syl.id < 0}
                              >
                                Force Approve
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {expanded && syl.id > 0 && (
                          <tr key={`${syl.id}-expanded`}>
                            <td colSpan={6} className="py-3 px-2 bg-accent/20 border-b border-border">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                <div className="p-3 border border-border rounded bg-background">
                                  <p className="font-medium mb-2">Learning Objectives</p>
                                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                                    {syl.learningObjectives.map((item) => <li key={item}>{item}</li>)}
                                  </ul>
                                </div>
                                <div className="p-3 border border-border rounded bg-background">
                                  <p className="font-medium mb-2">Weekly Topics</p>
                                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                                    {syl.weeklyTopics.map((item) => <li key={item}>{item}</li>)}
                                  </ul>
                                  <p className="font-medium mt-3 mb-2">Resources</p>
                                  <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                                    {syl.resources.map((item) => <li key={item}>{item}</li>)}
                                  </ul>
                                </div>
                                <div className="p-3 border border-border rounded bg-background space-y-3">
                                  <div>
                                    <p className="font-medium mb-2">Rejection Logs</p>
                                    {syl.rejectionLogs.length > 0 ? (
                                      <div className="space-y-2">
                                        {syl.rejectionLogs.map((log, idx) => (
                                          <div key={`${syl.id}-rej-${idx}`} className="text-xs border border-red-200 bg-red-50 dark:bg-red-950/30 rounded p-2">
                                            <p><strong>{new Date(log.at).toLocaleString()}</strong> by {log.by}</p>
                                            <p>{log.reason}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">No rejection logs.</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-sm mb-1">Request Revision Feedback</label>
                                    <textarea
                                      value={syllabusRevisionNote[syl.id] || ''}
                                      onChange={(e) => setSyllabusRevisionNote((prev) => ({ ...prev, [syl.id]: e.target.value }))}
                                      rows={3}
                                      className="w-full p-2 border border-border rounded bg-input-background"
                                      placeholder="Required feedback for revision..."
                                    />
                                    <div className="mt-2 flex gap-2 justify-end">
                                      <Button size="sm" variant="outline" onClick={() => handleRequestSyllabusRevision(syl.id)}>
                                        Request Revision
                                      </Button>
                                      <Button size="sm" variant="primary" onClick={() => updateSyllabusStatus(syl.id, 'approved')}>
                                        Approve
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========== LESSON NOTES (NEW) ========== */}
      {activeSection === 'lesson_note' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold mt-2">{lessonPendingApprovals}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Compliance Rate (Week {currentWeek})</p>
              <p className="text-2xl font-bold mt-2">{complianceRate}%</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">AI Adoption</p>
              <p className="text-2xl font-bold mt-2">{aiAdoptionRate}%</p>
            </Card>
          </div>

          <Card title="Lesson Notes Oversight Registry" action={<Badge variant="default">{filteredLessonNotes.length} records</Badge>}>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Department</label>
                  <select
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={lessonNoteFilters.department}
                    onChange={(e) => setLessonNoteFilters((prev) => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">All Departments</option>
                    {lessonNoteDepartments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Teacher</label>
                  <select
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={lessonNoteFilters.teacher}
                    onChange={(e) => setLessonNoteFilters((prev) => ({ ...prev, teacher: e.target.value }))}
                  >
                    <option value="">All Teachers</option>
                    {lessonNoteTeachers.map((teacher) => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Status</label>
                  <select
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={lessonNoteFilters.status}
                    onChange={(e) => setLessonNoteFilters((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Date From</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={lessonNoteFilters.startDate}
                    onChange={(e) => setLessonNoteFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Date To</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={lessonNoteFilters.endDate}
                    onChange={(e) => setLessonNoteFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAllVisibleLessonNotes}>
                  Select Visible
                </Button>
                <Button size="sm" variant="primary" onClick={handleBulkApproveLessonNotes} disabled={!selectedLessonNoteIds.length}>
                  <CheckCircle size={14} className="mr-1" />Bulk Approve ({selectedLessonNoteIds.length})
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2"><input type="checkbox" onChange={handleSelectAllVisibleLessonNotes} checked={filteredLessonNotes.length > 0 && filteredLessonNotes.every((note) => selectedLessonNoteIds.includes(note.id))} /></th>
                    <th className="py-2">Context</th>
                    <th className="py-2">Timing</th>
                    <th className="py-2">Topic</th>
                    <th className="py-2">Author</th>
                    <th className="py-2">Origin</th>
                    <th className="py-2">Syllabus Match</th>
                    <th className="py-2">Linked Materials</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLessonNotes.map((note) => (
                    <tr key={note.id} className="border-b border-border hover:bg-muted/30">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={selectedLessonNoteIds.includes(note.id)}
                          onChange={() => handleToggleLessonNoteSelection(note.id)}
                        />
                      </td>
                      <td className="py-2">
                        <p>{note.class}</p>
                        <p className="text-xs text-muted-foreground">{note.subject}</p>
                      </td>
                      <td className="py-2">
                        <p>Week {note.week}</p>
                        <p className="text-xs text-muted-foreground">{note.submittedDate}</p>
                      </td>
                      <td className="py-2 max-w-64">{note.title}</td>
                      <td className="py-2">{note.teacher}</td>
                      <td className="py-2">
                        <Badge variant="default" className={note.generatedBy === 'AI' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200' : ''}>
                          {note.generatedBy}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant={note.syllabusMatch ? 'approved' : 'rejected'}>
                          {note.syllabusMatch ? 'Matched' : 'Mismatch'}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {note.linkedMaterials.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {note.linkedMaterials.map((material) => (
                              <button
                                key={material.id}
                                type="button"
                                className="text-xs px-2 py-1 rounded border border-border hover:bg-accent"
                                onClick={() => alert(`Open ${material.type}: ${material.title}`)}
                              >
                                {material.type}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="py-2"><Badge variant={note.status as any}>{note.status}</Badge></td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleOpenLessonPreview(note.id)}>
                            <Eye size={14} className="mr-1" />Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              updateLessonNoteStatus(note.id, 'approved');
                              alert(`Lesson note approved. Notification sent to ${note.teacher}.`);
                            }}
                            disabled={note.status === 'approved'}
                          >
                            <CheckCircle size={14} className="mr-1" />Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========== MODALS ========== */}
      {showAuditMetadataModal && selectedAuditEntry && (
        <Modal
          isOpen
          onClose={() => {
            setShowAuditMetadataModal(false);
            setSelectedAuditEntry(null);
          }}
          title={`Event Metadata - ${selectedAuditEntry.action}`}
          footer={
            <Button
              variant="outline"
              onClick={() => {
                setShowAuditMetadataModal(false);
                setSelectedAuditEntry(null);
              }}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Timestamp</p>
                <p>{new Date(selectedAuditEntry.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Actor</p>
                <p>{selectedAuditEntry.actorName} | {selectedAuditEntry.actorRole}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-border rounded bg-accent/20">
                <p className="font-medium mb-2">Before</p>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(selectedAuditEntry.metadata.before, null, 2)}</pre>
              </div>
              <div className="p-3 border border-border rounded bg-accent/20">
                <p className="font-medium mb-2">After</p>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(selectedAuditEntry.metadata.after, null, 2)}</pre>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showSyllabusHistoryModal && selectedSyllabusHistoryEntry && (
        <Modal
          isOpen
          onClose={() => {
            setShowSyllabusHistoryModal(false);
            setSelectedSyllabusHistoryEntry(null);
          }}
          title={`Syllabus History - ${selectedSyllabusHistoryEntry.title}`}
          footer={
            <Button
              variant="outline"
              onClick={() => {
                setShowSyllabusHistoryModal(false);
                setSelectedSyllabusHistoryEntry(null);
              }}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-3">
            {selectedSyllabusHistoryEntry.versionHistory.length > 0 ? (
              selectedSyllabusHistoryEntry.versionHistory.map((event, index) => (
                <div key={`${selectedSyllabusHistoryEntry.id}-event-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                    {index !== selectedSyllabusHistoryEntry.versionHistory.length - 1 && <span className="w-px h-full bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium capitalize">{event.status.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.at).toLocaleString()} • {event.by}</p>
                    {event.note && <p className="text-xs mt-1">{event.note}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No timeline history available.</p>
            )}
          </div>
        </Modal>
      )}

      {showLessonPreviewModal && selectedLessonNote && (
        <Modal
          isOpen
          onClose={() => {
            setShowLessonPreviewModal(false);
            setShowRejectMode(false);
          }}
          title={`Lesson Note Preview - ${selectedLessonNote.title}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowLessonPreviewModal(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => setShowRejectMode((prev) => !prev)}>
                <XCircle size={14} className="mr-1" />Reject
              </Button>
              <Button variant="outline" onClick={handleSaveQualityFlag}>
                <Flag size={14} className="mr-1" />Flag for Quality
              </Button>
              <Button variant="primary" onClick={handleApproveSelectedLessonNote}>
                <CheckCircle size={14} className="mr-1" />Approve
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Context</p>
                <p>{selectedLessonNote.class} • {selectedLessonNote.subject}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Timing</p>
                <p>Week {selectedLessonNote.week} • Submitted {selectedLessonNote.submittedDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Author</p>
                <p>{selectedLessonNote.teacher}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Origin</p>
                <Badge variant="default">{selectedLessonNote.generatedBy}</Badge>
              </div>
            </div>

            <div className="p-3 border border-border rounded-lg bg-accent/20">
              <p className="text-sm text-muted-foreground mb-1">Full Content</p>
              <p className="text-sm leading-relaxed">{selectedLessonNote.content}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Syllabus Alignment</p>
                <Badge variant={selectedLessonNote.syllabusMatch ? 'approved' : 'rejected'}>
                  {selectedLessonNote.syllabusMatch ? 'Aligned with approved syllabus' : 'Needs syllabus alignment'}
                </Badge>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Linked Materials</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLessonNote.linkedMaterials.length > 0 ? (
                    selectedLessonNote.linkedMaterials.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-accent"
                        onClick={() => alert(`Open ${material.type}: ${material.title}`)}
                      >
                        {material.type}: {material.title}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No linked assessments for this note.</p>
                  )}
                </div>
              </div>
            </div>

            {showRejectMode && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/30">
                <label className="block text-sm mb-2">Rejection Feedback</label>
                <textarea
                  value={rejectionFeedback}
                  onChange={(e) => setRejectionFeedback(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-border rounded bg-input-background"
                  placeholder="Explain what needs to be fixed..."
                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="destructive" onClick={handleRejectSelectedLessonNote} disabled={!rejectionFeedback.trim()}>
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}

            <div className="p-3 border border-border rounded-lg">
              <label className="block text-sm mb-2">Private Quality Note (Internal)</label>
              <textarea
                value={qualityPrivateNote}
                onChange={(e) => setQualityPrivateNote(e.target.value)}
                rows={3}
                className="w-full p-2 border border-border rounded bg-input-background"
                placeholder="Add private pedagogical quality comments or warnings..."
              />
            </div>
          </div>
        </Modal>
      )}

      {showExportCenter && (
        <Modal
          isOpen
          onClose={() => setShowExportCenter(false)}
          title="Export Center"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowExportCenter(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={handleDownloadPerformancePdf}>
                <Download size={14} className="mr-2" />Download PDF
              </Button>
              <Button variant="primary" onClick={handleDownloadPerformanceCsv}>
                <Download size={14} className="mr-2" />Download CSV
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Prepare school-wide class performance reports for analysis or board meetings.</p>
            <div className="p-3 border border-border rounded bg-accent/20">
              <p><strong>Active Date Range:</strong> {activeRangeLabel}</p>
              <p><strong>Included Classes:</strong> {classPerformance.length}</p>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>CSV export is best for data analysis.</li>
              <li>PDF export opens a print-friendly board report.</li>
            </ul>
          </div>
        </Modal>
      )}

      {showMappingModal && selectedClassForMapping && (
        <Modal
          isOpen
          onClose={() => {
            setShowMappingModal(false);
            setSelectedClassForMapping(null);
          }}
          title={`Map Subjects - ${selectedClassForMapping.name}`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMappingModal(false);
                  setSelectedClassForMapping(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveMapping}>
                Save Mapping
              </Button>
            </>
          }
        >
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {schoolSubjects.map((subject) => (
              <label key={subject} className="flex items-center gap-2 rounded border border-border px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedSubjectsForClass.includes(subject)}
                  onChange={(e) => {
                    setSelectedSubjectsForClass((prev) =>
                      e.target.checked ? [...prev, subject] : prev.filter((entry) => entry !== subject),
                    );
                  }}
                />
                {subject}
              </label>
            ))}
          </div>
        </Modal>
      )}

      {showClassModal && (
        <Modal
          isOpen
          onClose={() => setShowClassModal(false)}
          title={editingClassId ? 'Edit Class' : 'Add Class'}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowClassModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveClass}>Save Class</Button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Class Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-input-background"
                value={classDraft.name}
                onChange={(e) => setClassDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="JSS1A"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Category</label>
              <select
                className="w-full p-2 border rounded bg-input-background"
                value={classDraft.category}
                onChange={(e) => setClassDraft((prev) => ({ ...prev, category: e.target.value as SchoolClass['category'] }))}
              >
                <option value="Junior Secondary">Junior Secondary</option>
                <option value="Senior Secondary">Senior Secondary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                className="w-full p-2 border rounded bg-input-background"
                value={classDraft.capacity}
                onChange={(e) => setClassDraft((prev) => ({ ...prev, capacity: e.target.value }))}
                placeholder="45"
              />
            </div>
          </div>
        </Modal>
      )}

      {showSubjectModal && (
        <Modal
          isOpen
          onClose={() => setShowSubjectModal(false)}
          title={editingSubjectName ? 'Edit Subject' : 'Add Subject'}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowSubjectModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSubject}>Save Subject</Button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Subject Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-input-background"
                value={subjectDraft}
                onChange={(e) => setSubjectDraft(e.target.value)}
                placeholder="Further Mathematics"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If the subject does not already exist in the master list, saving it will attach it to the school subject list so it can be mapped to classes.
            </p>
          </div>
        </Modal>
      )}

      {confirmDeleteSubject && (
        <Modal
          isOpen
          onClose={() => setConfirmDeleteSubject(null)}
          title="Danger Zone: Remove Subject"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmDeleteSubject(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteSubject}>Remove Subject</Button>
            </>
          }
        >
          <div className="space-y-2 text-sm">
            <p>
              Remove <strong>{confirmDeleteSubject}</strong> from the school subject list?
            </p>
            <p className="text-muted-foreground">This will also detach the subject from all class mappings.</p>
          </div>
        </Modal>
      )}

      {confirmDeleteClass && (
        <Modal
          isOpen
          onClose={() => setConfirmDeleteClass(null)}
          title="Danger Zone: Delete Class"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmDeleteClass(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteClass}>Delete Class</Button>
            </>
          }
        >
          <div className="space-y-2 text-sm">
            <p>
              Deleting <strong>{confirmDeleteClass.name}</strong> permanently removes the class configuration.
            </p>
            <p className="text-muted-foreground">Subject mappings will also be removed. Historical records remain untouched.</p>
          </div>
        </Modal>
      )}

      {confirmActivateTerm && (
        <Modal
          isOpen
          onClose={() => setConfirmActivateTerm(null)}
          title="Danger Zone: Set Active Term"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmActivateTerm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmSetCurrentTerm}>Set as Current Term</Button>
            </>
          }
        >
          <div className="space-y-2 text-sm">
            <p>
              Mark <strong>{confirmActivateTerm.name}</strong> as the active term?
            </p>
            <p className="text-muted-foreground">The previous active term will be archived automatically.</p>
          </div>
        </Modal>
      )}

      {showTermModal && (
        <Modal
          isOpen
          onClose={() => setShowTermModal(false)}
          title={editingTerm ? 'Edit Term' : 'Add Term'}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowTermModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveTerm}>Save Term</Button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Term Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-input-background"
                value={termDraft.name}
                onChange={(e) => setTermDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="2025/2026 First Term"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded bg-input-background"
                value={termDraft.startDate}
                onChange={(e) => setTermDraft((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded bg-input-background"
                value={termDraft.endDate}
                onChange={(e) => setTermDraft((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {roleEditTarget && (
        <Modal
          isOpen
          onClose={() => setRoleEditTarget(null)}
          title="Confirm Role Change"
          footer={
            <>
              <Button variant="outline" onClick={() => setRoleEditTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={confirmRoleChange}>
                <ShieldCheck size={14} className="mr-1" />Confirm Change
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p>Changing role for <strong>{roleEditTarget.name}</strong> may immediately alter platform permissions.</p>
            <div>
              <label className="block mb-1">New Role</label>
              <select
                className="w-full p-2 border rounded bg-input-background"
                value={pendingRoleValue}
                onChange={(e) => setPendingRoleValue(e.target.value as StaffRole)}
              >
                {staffRoleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {confirmDeactivateUser && (
        <Modal
          isOpen
          onClose={() => setConfirmDeactivateUser(null)}
          title="Confirm Account Deactivation"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmDeactivateUser(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeactivateUser(confirmDeactivateUser.id);
                  setConfirmDeactivateUser(null);
                }}
              >
                <UserX size={14} className="mr-1" />Deactivate Account
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-sm">
            <p>
              Are you sure you want to deactivate <strong>{confirmDeactivateUser.name}</strong>?
            </p>
            <p className="text-muted-foreground">This action revokes access immediately while preserving historical data.</p>
          </div>
        </Modal>
      )}

      {showAddUserModal && (
        <Modal
          isOpen
          onClose={() => {
            setShowAddUserModal(false);
            setInviteError('');
            setCsvImportError('');
          }}
          title="Invite New User"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>Close</Button>
              <Button variant="primary" onClick={handleInviteUser}>
                <UserPlus size={14} className="mr-1" />Send Invitation
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Individual Invitation</p>
              <div>
                <label className="block text-sm mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded bg-input-background"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff.member@smfa.edu"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Role</label>
                <select
                  className="w-full p-2 border rounded bg-input-background"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                >
                  {staffRoleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
              <p className="text-xs text-muted-foreground">Users remain as Pending Invitation until password setup is completed.</p>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Bulk Import (CSV)</p>
                <Button size="sm" variant="outline" onClick={handleDownloadUserCsvTemplate}>
                  <Download size={14} className="mr-1" />CSV Template
                </Button>
              </div>
              <label className="block p-4 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:bg-accent/30">
                Drag and drop CSV or click to upload
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleBulkImportUsers(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <p className="text-xs text-muted-foreground">Required columns: Name, Email, Role</p>
              {csvImportError && <p className="text-xs text-red-600">{csvImportError}</p>}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}