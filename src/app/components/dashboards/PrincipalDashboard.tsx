import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  CheckCircle, XCircle, TrendingUp, Users, DollarSign, CalendarDays, Activity,
  Download, Filter, AlertTriangle, Bus, Heart, FileText, Clock, Eye, Wallet, Banknote,
  Trophy, ClipboardCheck, CheckCircle2, UserCheck, UserX, BookOpen, Edit, RefreshCw, Plus,
  ChevronRight, ChevronDown, Flag, LogOut, School, TabletSmartphone
} from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { ClassSubjectAnalytics } from '../ClassSubjectAnalytics';
import {
  exportClassPerformance,
  getAtRiskStudents,
  getAttendanceTrend,
  getClassAnalytics,
  getClassPerformance,
  getClassesList,
  getClassSubjectSummary,
  getClassSubjectTrends,
  getDeepDiveTrend,
  getGradeDistribution,
  getMedicationExceptions,
  getSchoolSummary,
  getCurrentTermId,
  getSubjectPerformance,
  getSubjectsForClass,
  getTransportDistribution,
  type AttendancePoint,
  type AtRiskStudent,
  type ClassAnalyticsSummary,
  type ClassInfo,
  type ClassPerformanceRow,
  type DeepDivePoint,
  type GradeDistribution,
  type MedicationException,
  type SchoolSummary,
  type SubjectInfo,
  type SubjectPerformanceRow,
  type SubjectSummary,
  type SubjectTrend,
  type TransportMode,
} from '../../../services/analyticsApi';
import {
  inviteStaff,
  listStaff,
  removeStaff,
  updateStaffInfo,
  updateStaffStatus,
  type StaffLevel,
  type StaffRole,
  type StaffStatus,
  type StaffUser,
} from '../../../services/staffApi';
import {
  getArmMetrics,
  getArmStudents,
  getArms,
  getFeeItemById,
  getFeeItems,
  type Arm,
  type ArmMetrics,
  type FeeItem,
  type StudentFeeSummary,
  updateFeeItemStatus,
} from '../../../services/feeApi';
import { useLevelContext } from '../../hooks/useLevelContext';

// ========== TYPES ==========
type FeePolicy = 'full_access' | 'partial_access' | 'block';
type ApprovalStatus = 'submitted' | 'approved' | 'rejected';
type ResultApprovalStatus = 'pending' | 'approved' | 'changes_requested';

interface SyllabusItem {
  id: number;
  teacher: string;
  class: string;
  subject: string;
  week: number;
  title: string;
  submittedDate: string;
  status: ApprovalStatus;
  content: string;
  statusHistory: { status: string; at: string; reason?: string }[];
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface LessonNoteItem {
  id: number;
  teacher: string;
  class: string;
  subject: string;
  title: string;
  submittedDate: string;
  status: ApprovalStatus;
  type: string;
  content: string;
  statusHistory: { status: string; at: string; reason?: string }[];
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string;
  action: string;
  riskLevel: 'low' | 'medium' | 'high';
  details: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  browser?: string;
}

interface ClassResultApproval {
  className: string;
  teacher: string;
  assessmentCompletion: number; // %
  status: ResultApprovalStatus;
  lastUpdated: string;
  reason?: string;
}

interface ParentEngagementData {
  totalParentsActivated: number;
  weeklyActive: number;
  dailyNewActivations: { date: string; count: number }[];
  classBreakdown: {
    className: string;
    totalStudents: number;
    parentsLinked: number;
    avgLoginsPerWeek: number;
  }[];
}

type PrincipalSubjectKpi = {
  subjectAverage: number;
  highestScore: number;
  lowestScore: number;
  teacherComplianceRate: number | null;
};

type PrincipalSubjectPerformance = {
  subject: string;
  average: number;
  passRate: number;
};

type PrincipalAtRiskStudent = {
  id: string;
  name: string;
  cumulativeAverage: number;
};

type PrincipalReadOnlyUser = StaffUser;

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: StaffRole;
  levelIds: string[];
};

type PrincipalDataCheck = {
  id: string;
  severity: 'warning' | 'critical';
  category: 'Missing Scores' | 'Attendance' | 'Fees' | 'Assessments';
  status: 'open' | 'resolved';
  className: string;
  owner: string;
  issue: string;
  detectedAt: string;
};

type PrincipalSchoolSetupState = {
  schoolProfile: {
    schoolName: string;
    schoolCode: string;
    academicSession: string;
    principalName: string;
  };
  termDates: Array<{ name: string; startDate: string; endDate: string; status: 'completed' | 'active' | 'upcoming' }>;
  classConfiguration: Array<{ className: string; stream: string; capacity: number; enrolled: number }>;
  subjectOfferings: string[];
  assessmentConfig: {
    testWindow: string;
    examWindow: string;
    gradingSchema: string;
  };
};

// ========== MOCK DATA (extended) ==========
const pendingSyllabus: SyllabusItem[] = [
  { id: 1, teacher: 'Mrs. Johnson', class: 'Math 10A', subject: 'Mathematics', week: 3, title: 'Quadratic Functions', submittedDate: '2026-04-05', status: 'submitted', content: 'Outline: quadratic equations, factoring, quadratic formula. Objectives: Solve quadratics. Resources: textbook chapter 4.', statusHistory: [{ status: 'submitted', at: '2026-04-05' }] },
  { id: 2, teacher: 'Mr. Thompson', class: 'Science 9B', subject: 'Biology', week: 2, title: 'Cell Biology', submittedDate: '2026-04-06', status: 'submitted', content: 'Cell structure, organelles, cell theory.', statusHistory: [{ status: 'submitted', at: '2026-04-06' }] },
];
const pendingLessonNotes: LessonNoteItem[] = [
  { id: 1, teacher: 'Mrs. Davis', class: 'English 11A', subject: 'English', title: 'Shakespeare Analysis', submittedDate: '2026-04-05', status: 'submitted', type: 'AI Generated', content: 'Lesson content: Hamlet soliloquy. Activities: group discussion. Assessment: short essay.', statusHistory: [{ status: 'submitted', at: '2026-04-05' }] },
];

// User activity logs (mock)
let allAuditLogs: AuditLogEntry[] = [
  { id: '1', timestamp: '2026-04-07T09:10:00Z', userId: 'bursar1', userName: 'Ms. Lee', userRole: 'bursar', module: 'fees', action: 'Fee receipt approved', riskLevel: 'low', details: 'Receipt #123 for Sarah Johnson - N45,000' },
  { id: '2', timestamp: '2026-04-07T08:42:00Z', userId: 'teacher1', userName: 'Mrs. Johnson', userRole: 'teacher', module: 'syllabus', action: 'Syllabus submitted', riskLevel: 'low', details: 'Math 10A Week 3' },
  { id: '3', timestamp: '2026-04-06T13:03:00Z', userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal', module: 'results', action: 'Result release toggled', riskLevel: 'high', details: 'Term 3 results hidden', oldValue: 'visible', newValue: 'hidden' },
  { id: '4', timestamp: '2026-04-05T11:20:00Z', userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal', module: 'fees', action: 'Fee policy changed', riskLevel: 'high', details: 'Gating set to partial', oldValue: 'full_access', newValue: 'partial_access' },
];

// Result approval per class
const classResultApprovals: ClassResultApproval[] = [
  { className: 'Math 10A', teacher: 'Mrs. Johnson', assessmentCompletion: 100, status: 'pending', lastUpdated: '2026-04-07' },
  { className: 'Science 9B', teacher: 'Mr. Thompson', assessmentCompletion: 95, status: 'pending', lastUpdated: '2026-04-06' },
  { className: 'English 11A', teacher: 'Mrs. Davis', assessmentCompletion: 88, status: 'changes_requested', lastUpdated: '2026-04-05', reason: 'Missing essays for two students' },
  { className: 'History 10B', teacher: 'Mr. Adams', assessmentCompletion: 100, status: 'approved', lastUpdated: '2026-04-04' },
];

// Parent engagement mock data
const parentEngagementData: ParentEngagementData = {
  totalParentsActivated: 342,
  weeklyActive: 289,
  dailyNewActivations: [
    { date: '2026-03-10', count: 5 }, { date: '2026-03-11', count: 7 }, { date: '2026-03-12', count: 3 },
    { date: '2026-03-13', count: 9 }, { date: '2026-03-14', count: 12 }, { date: '2026-03-15', count: 6 },
    { date: '2026-03-16', count: 4 }, { date: '2026-03-17', count: 8 }, { date: '2026-03-18', count: 10 },
    { date: '2026-03-19', count: 7 }, { date: '2026-03-20', count: 11 }, { date: '2026-03-21', count: 5 },
    { date: '2026-03-22', count: 6 }, { date: '2026-03-23', count: 9 }, { date: '2026-03-24', count: 13 },
    { date: '2026-03-25', count: 8 }, { date: '2026-03-26', count: 10 }, { date: '2026-03-27', count: 6 },
    { date: '2026-03-28', count: 4 }, { date: '2026-03-29', count: 7 }, { date: '2026-03-30', count: 12 },
    { date: '2026-03-31', count: 9 }, { date: '2026-04-01', count: 14 }, { date: '2026-04-02', count: 10 },
    { date: '2026-04-03', count: 8 }, { date: '2026-04-04', count: 6 }, { date: '2026-04-05', count: 11 },
    { date: '2026-04-06', count: 7 }, { date: '2026-04-07', count: 9 }, { date: '2026-04-08', count: 5 },
  ],
  classBreakdown: [
    { className: 'Grade 5A', totalStudents: 35, parentsLinked: 28, avgLoginsPerWeek: 3.2 },
    { className: 'Grade 5B', totalStudents: 32, parentsLinked: 30, avgLoginsPerWeek: 4.1 },
    { className: 'Grade 6A', totalStudents: 38, parentsLinked: 22, avgLoginsPerWeek: 2.5 },
    { className: 'Grade 6B', totalStudents: 36, parentsLinked: 33, avgLoginsPerWeek: 3.9 },
    { className: 'Grade 7A', totalStudents: 40, parentsLinked: 25, avgLoginsPerWeek: 2.1 },
  ],
};

const principalSchoolSetupSnapshot = {
  schoolProfile: {
    schoolName: 'SMFA College',
    schoolCode: 'SMFA-001',
    academicSession: '2025/2026',
    principalName: 'Mr. Brown',
  },
  termDates: [
    { name: 'Term 1', startDate: '2026-01-15', endDate: '2026-04-10', status: 'completed' },
    { name: 'Term 2', startDate: '2026-04-20', endDate: '2026-07-15', status: 'active' },
    { name: 'Term 3', startDate: '2026-08-01', endDate: '2026-11-20', status: 'upcoming' },
  ],
  classConfiguration: [
    { className: 'Grade 5A', stream: 'Junior', capacity: 40, enrolled: 35 },
    { className: 'Grade 5B', stream: 'Junior', capacity: 40, enrolled: 32 },
    { className: 'Grade 6A', stream: 'Junior', capacity: 42, enrolled: 38 },
    { className: 'Grade 6B', stream: 'Junior', capacity: 42, enrolled: 36 },
  ],
  subjectOfferings: [
    'Mathematics',
    'English',
    'Science',
    'History',
    'Computer Studies',
  ],
  assessmentConfig: {
    testWindow: 'Week 7',
    examWindow: 'Week 12',
    gradingSchema: '40% Continuous Assessment, 60% Exam',
  },
};

const principalReadOnlyUsers: PrincipalReadOnlyUser[] = [
  {
    id: 'usr-001',
    firstName: 'Mary',
    lastName: 'Johnson',
    role: 'teacher',
    status: 'active',
    email: 'johnson@smfa.edu',
    phoneNumber: '',
    levelIds: ['cat-jss'],
    levels: [{ id: 'cat-jss', name: 'Junior Secondary' }],
  },
  {
    id: 'usr-002',
    firstName: 'Kemi',
    lastName: 'Lee',
    role: 'bursar',
    status: 'inactive',
    email: 'lee@smfa.edu',
    phoneNumber: '',
    levelIds: ['cat-jss', 'cat-sss'],
    levels: [
      { id: 'cat-jss', name: 'Junior Secondary' },
      { id: 'cat-sss', name: 'Senior Secondary' },
    ],
  },
];

const principalDataChecksSeed: PrincipalDataCheck[] = [
  {
    id: 'dc-001',
    severity: 'critical',
    category: 'Missing Scores',
    status: 'open',
    className: 'Grade 5A',
    owner: 'Mrs. Johnson',
    issue: 'Mathematics CA2 scores missing for 4 students.',
    detectedAt: '2026-04-09T09:10:00Z',
  },
  {
    id: 'dc-002',
    severity: 'warning',
    category: 'Attendance',
    status: 'open',
    className: 'Grade 6B',
    owner: 'Class Teacher',
    issue: 'Attendance not marked for 2 school days.',
    detectedAt: '2026-04-08T13:20:00Z',
  },
  {
    id: 'dc-003',
    severity: 'warning',
    category: 'Fees',
    status: 'open',
    className: 'Grade 6A',
    owner: 'Bursar',
    issue: 'Outstanding balance anomaly detected for 3 households.',
    detectedAt: '2026-04-08T11:00:00Z',
  },
  {
    id: 'dc-004',
    severity: 'critical',
    category: 'Assessments',
    status: 'open',
    className: 'Grade 5B',
    owner: 'Mr. Thompson',
    issue: 'Unified test timetable not aligned with approved window.',
    detectedAt: '2026-04-07T16:44:00Z',
  },
];

// ========== HELPER FUNCTIONS ==========
const formatCurrency = (amount?: number | null) => {
  if (amount == null) return '₦0';
  return '₦' + amount.toLocaleString();
};
const formatDate = (iso: string) => new Date(iso).toLocaleDateString();
const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

const addAuditLog = (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const newLog: AuditLogEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...log,
  };
  allAuditLogs = [newLog, ...allAuditLogs];
  if (typeof window !== 'undefined') {
    localStorage.setItem('principal-audit-logs', JSON.stringify(allAuditLogs));
  }
};

// Initialize localStorage for logs
if (typeof window !== 'undefined' && !localStorage.getItem('principal-audit-logs')) {
  localStorage.setItem('principal-audit-logs', JSON.stringify(allAuditLogs));
} else if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('principal-audit-logs');
  if (stored) allAuditLogs = JSON.parse(stored);
}

// ========== MAIN COMPONENT ==========
export function PrincipalDashboard() {
  const [activeMainTab, setActiveMainTab] = useState<
    'fee' |
    'kpi' |
    'approvals' |
    'resultApproval' |
    'parentEngagement' |
    'schoolSetup' |
    'userManagement' |
    'auditLogs' |
    'dataChecks'
  >('fee');
  
  // Block 3 state
  const [approvalTab, setApprovalTab] = useState<'syllabus' | 'lessonNotes'>('syllabus');
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<SyllabusItem | LessonNoteItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortField, setSortField] = useState<'submittedDate' | 'status'>('submittedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Block 5 state (result release + fee gating)
  const [selectedResultTerm, setSelectedResultTerm] = useState('term-3-2026');
  const [examStartDate, setExamStartDate] = useState('');
  const [examEndDate, setExamEndDate] = useState('');
  const [resultsReleased, setResultsReleased] = useState(false);
  const [feePolicy, setFeePolicy] = useState<FeePolicy>('block');
  const [showPolicyWarning, setShowPolicyWarning] = useState(false);
  
  // Block 6 filters
  const [activityFilter, setActivityFilter] = useState({ role: '', module: '', highRiskOnly: false, startDate: '', endDate: '' });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // Block 8 state
  const [selectedTermForApproval, setSelectedTermForApproval] = useState('term-3-2026');
  const [classApprovals, setClassApprovals] = useState<ClassResultApproval[]>(classResultApprovals);
  const [selectedClassApproval, setSelectedClassApproval] = useState<ClassResultApproval | null>(null);
  const [changeRequestReason, setChangeRequestReason] = useState('');

  const [selectedClassForPrincipal, setSelectedClassForPrincipal] = useState<{ id: string; className: string } | null>(null);
  const [selectedSubjectForPrincipal, setSelectedSubjectForPrincipal] = useState<string | null>(null);
  const [subjectsForSelectedClass, setSubjectsForSelectedClass] = useState<SubjectInfo[]>([]);
  const [schoolSummary, setSchoolSummary] = useState<SchoolSummary | null>(null);
  const [kpiClassPerformanceRows, setKpiClassPerformanceRows] = useState<ClassPerformanceRow[]>([]);
  const [kpiSubjectPerformanceRows, setKpiSubjectPerformanceRows] = useState<SubjectPerformanceRow[]>([]);
  const [kpiAttendanceTrend, setKpiAttendanceTrend] = useState<AttendancePoint[]>([]);
  const [kpiMedicationExceptions, setKpiMedicationExceptions] = useState<MedicationException[]>([]);
  const [kpiTransportDistribution, setKpiTransportDistribution] = useState<TransportMode[]>([]);
  const [kpiClasses, setKpiClasses] = useState<ClassInfo[]>([]);
  const [isLoadingKpiData, setIsLoadingKpiData] = useState(false);
  const [kpiDataError, setKpiDataError] = useState<string | null>(null);
  const [isExportingClassPerformance, setIsExportingClassPerformance] = useState(false);
  const [selectedClassAnalytics, setSelectedClassAnalytics] = useState<ClassAnalyticsSummary | null>(null);
  const [principalSubjectKpis, setPrincipalSubjectKpis] = useState<PrincipalSubjectKpi | null>(null);
  const [principalSubjectTrend, setPrincipalSubjectTrend] = useState<Array<{ termLabel: string; average: number; passRate: number }>>([]);
  const [principalSubjectPerformanceList, setPrincipalSubjectPerformanceList] = useState<PrincipalSubjectPerformance[]>([]);
  const [principalDeepDiveTrend, setPrincipalDeepDiveTrend] = useState<Array<{ week: string; average: number }>>([]);
  const [principalGradeDist, setPrincipalGradeDist] = useState<Array<{ grade: string; count: number }>>([]);
  const [principalAtRisk, setPrincipalAtRisk] = useState<PrincipalAtRiskStudent[]>([]);
  const [isLoadingPrincipalAnalytics, setIsLoadingPrincipalAnalytics] = useState(false);
  const [principalAnalyticsError, setPrincipalAnalyticsError] = useState<string | null>(null);
  
  // Block 7 state (no extra)
  
  // Fee oversight state (existing)
  const { levelId } = useLevelContext();
  const [selectedFeeTerm, setSelectedFeeTerm] = useState('Term 3, 2026');
  const [selectedFinanceClass, setSelectedFinanceClass] = useState<string | null>(null);
  const [selectedArmFilterId, setSelectedArmFilterId] = useState('');
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [arms, setArms] = useState<Arm[]>([]);
  const [armMetricsById, setArmMetricsById] = useState<Record<string, ArmMetrics>>({});
  const [armStudentsById, setArmStudentsById] = useState<Record<string, StudentFeeSummary[]>>({});
  const [isLoadingFeeData, setIsLoadingFeeData] = useState(false);
  const [feeDataError, setFeeDataError] = useState<string | null>(null);
  const [activeFeeActionId, setActiveFeeActionId] = useState<number | null>(null);
  const [selectedFeeItemDetailId, setSelectedFeeItemDetailId] = useState<number | null>(null);
  const [feeFilter, setFeeFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('all');
  const [principalUserRoleFilter, setPrincipalUserRoleFilter] = useState<'all' | StaffRole>('all');
  const [principalUserStatusFilter, setPrincipalUserStatusFilter] = useState<'all' | StaffStatus>('all');
  const [userManagementError, setUserManagementError] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<StaffLevel[]>([]);
  const [principalDataCheckSeverity, setPrincipalDataCheckSeverity] = useState<'all' | PrincipalDataCheck['severity']>('all');
  const [schoolSetupState, setSchoolSetupState] = useState<PrincipalSchoolSetupState>(() => {
    if (typeof window === 'undefined') return principalSchoolSetupSnapshot;
    const stored = localStorage.getItem('principal-school-setup-state');
    if (!stored) return principalSchoolSetupSnapshot;
    try {
      return JSON.parse(stored);
    } catch {
      return principalSchoolSetupSnapshot;
    }
  });
  const [principalUsers, setPrincipalUsers] = useState<PrincipalReadOnlyUser[]>(principalReadOnlyUsers);
  const [principalDataChecks, setPrincipalDataChecks] = useState<PrincipalDataCheck[]>(() => {
    if (typeof window === 'undefined') return principalDataChecksSeed;
    const stored = localStorage.getItem('principal-data-checks-state');
    if (!stored) return principalDataChecksSeed;
    try {
      return JSON.parse(stored);
    } catch {
      return principalDataChecksSeed;
    }
  });
  const [subjectDraft, setSubjectDraft] = useState('');
  const [newTermDraft, setNewTermDraft] = useState({ name: '', startDate: '', endDate: '', status: 'upcoming' as 'completed' | 'active' | 'upcoming' });
  const [newClassDraft, setNewClassDraft] = useState({ className: '', stream: 'Junior', capacity: 0, enrolled: 0 });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'teacher',
    levelIds: [],
  });
  const [isDataCheckModalOpen, setIsDataCheckModalOpen] = useState(false);
  const [editingDataCheckId, setEditingDataCheckId] = useState<string | null>(null);
  const [dataCheckForm, setDataCheckForm] = useState<Omit<PrincipalDataCheck, 'id' | 'detectedAt'>>({
    severity: 'warning',
    category: 'Missing Scores',
    status: 'open',
    className: '',
    owner: '',
    issue: '',
  });
  
  // Refs for scrolling
  const approvalsSectionRef = useRef<HTMLDivElement | null>(null);
  const attendanceSectionRef = useRef<HTMLDivElement | null>(null);
  const performanceSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('principal-school-setup-state', JSON.stringify(schoolSetupState));
    }
  }, [schoolSetupState]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('principal-data-checks-state', JSON.stringify(principalDataChecks));
    }
  }, [principalDataChecks]);

  useEffect(() => {
    let isMounted = true;

    const getFallbackLevelsFromSelection = (): StaffLevel[] => {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem('selected-school-assignment');
      if (!raw) return [];

      try {
        const parsed = JSON.parse(raw) as { categories?: Array<{ uuid?: string; name?: string }> };
        const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
        return categories
          .map((category) => ({
            id: String(category.uuid || ''),
            name: String(category.name || category.uuid || ''),
          }))
          .filter((level) => Boolean(level.id));
      } catch {
        return [];
      }
    };

    const loadUserManagementData = async () => {
      const fallbackLevels = getFallbackLevelsFromSelection();

      if (!levelId) {
        if (!isMounted) return;
        setAvailableLevels(fallbackLevels);
        setPrincipalUsers([]);
        return;
      }

      setIsLoadingUsers(true);
      setUserManagementError(null);

      try {
        const users = await listStaff(levelId);

        if (!isMounted) return;

        setPrincipalUsers(users);
        setAvailableLevels(fallbackLevels);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load staff users.';
        setUserManagementError(message);
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    };

    loadUserManagementData();

    return () => {
      isMounted = false;
    };
  }, [levelId]);

  const feeClassRows = useMemo(
    () =>
      arms.map((arm) => {
        const metrics = armMetricsById[arm.id];
        return {
          armId: arm.id,
          className: arm.name,
          billed: metrics?.billed ?? 0,
          paid: metrics?.paid ?? 0,
          outstanding: metrics?.outstanding ?? 0,
          overdueAmount: Math.max(0, (metrics?.outstanding ?? 0) * 0.3),
          collectionRate: metrics?.collectionRate ?? 0,
          average: metrics?.averageScore ?? 0,
          passRate: metrics?.passRate ?? 0,
          attendanceRate: metrics?.attendanceRate ?? 0,
          rank: metrics?.rank ?? 0,
        };
      }),
    [arms, armMetricsById],
  );

  const selectedSubjectLabelForPrincipal = useMemo(() => {
    if (!selectedSubjectForPrincipal) return null;
    const match = subjectsForSelectedClass.find((subj) => subj.subjectName === selectedSubjectForPrincipal);
    return match?.subjectName || selectedSubjectForPrincipal;
  }, [selectedSubjectForPrincipal, subjectsForSelectedClass]);

  useEffect(() => {
    let isMounted = true;

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const loadKpiData = async () => {
      if (!levelId) {
        setSchoolSummary(null);
        setKpiClassPerformanceRows([]);
        setKpiSubjectPerformanceRows([]);
        setKpiAttendanceTrend([]);
        setKpiMedicationExceptions([]);
        setKpiTransportDistribution([]);
        setKpiClasses([]);
        setSelectedClassForPrincipal(null);
        setSelectedSubjectForPrincipal(null);
        setKpiDataError('No level selected. Please choose a category first.');
        return;
      }

      setIsLoadingKpiData(true);
      setKpiDataError(null);

      try {
        const currentTermId = getCurrentTermId();
        const attendanceClassId = selectedClassForPrincipal?.id || undefined;
        const transportClassId = selectedClassForPrincipal?.id || undefined;
        const [
          summary,
          classPerformance,
          subjectPerformance,
          attendanceTrend,
          medicationRows,
          transportRows,
          classList,
        ] = await Promise.all([
          getSchoolSummary(levelId),
          getClassPerformance(levelId),
          getSubjectPerformance(levelId),
          getAttendanceTrend(levelId, {
            granularity: 'week',
            fromDate: thirtyDaysAgo,
            toDate: today,
            classId: attendanceClassId,
          }),
          getMedicationExceptions(levelId, { date: today }),
          getTransportDistribution(levelId, currentTermId ? { termId: currentTermId, classId: transportClassId } : { date: today, classId: transportClassId }),
          getClassesList(levelId),
        ]);

        if (!isMounted) return;

        setSchoolSummary(summary);
        setKpiClassPerformanceRows(classPerformance);
        setKpiSubjectPerformanceRows(subjectPerformance);
        setKpiAttendanceTrend(attendanceTrend);
        setKpiMedicationExceptions(medicationRows);
        setKpiTransportDistribution(transportRows);
        setKpiClasses(classList);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load school KPI data.';
        setKpiDataError(message);
      } finally {
        if (isMounted) {
          setIsLoadingKpiData(false);
        }
      }
    };

    loadKpiData();

    return () => {
      isMounted = false;
    };
  }, [levelId, selectedClassForPrincipal?.id]);

  const loadFeeAndArmData = async () => {
    if (!levelId) {
      setFeeDataError('No level selected. Please choose a category first.');
      return;
    }

    setIsLoadingFeeData(true);
    setFeeDataError(null);

    try {
      const [fetchedFeeItems, fetchedArms] = await Promise.all([
        getFeeItems(levelId, {
          term: selectedFeeTerm || undefined,
          armId: selectedArmFilterId || undefined,
        }),
        getArms(),
      ]);

      setFeeItems(fetchedFeeItems);
      setArms(fetchedArms);

      const metricsEntries = await Promise.all(
        fetchedArms.map(async (arm) => {
          try {
            const armMetrics = await getArmMetrics(arm.id);
            return [arm.id, armMetrics] as const;
          } catch {
            return [arm.id, {
              armId: arm.id,
              armName: arm.name,
            } as ArmMetrics] as const;
          }
        }),
      );

      setArmMetricsById(Object.fromEntries(metricsEntries));

      const studentsEntries = await Promise.all(
        fetchedArms.map(async (arm) => {
          try {
            const students = await getArmStudents(arm.id);
            return [arm.id, students] as const;
          } catch {
            return [arm.id, [] as StudentFeeSummary[]] as const;
          }
        }),
      );

      setArmStudentsById(Object.fromEntries(studentsEntries));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch fee dashboard data.';
      setFeeDataError(message);
    } finally {
      setIsLoadingFeeData(false);
    }
  };

  useEffect(() => {
    loadFeeAndArmData();
  }, [levelId, selectedFeeTerm, selectedArmFilterId]);

  const approvePendingFeeItem = async (feeItemId: number) => {
    if (!levelId) return;

    setActiveFeeActionId(feeItemId);
    try {
      await updateFeeItemStatus(levelId, feeItemId, 'approved');
      await loadFeeAndArmData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to approve fee item.';
      setFeeDataError(message);
    } finally {
      setActiveFeeActionId(null);
    }
  };

  const rejectPendingFeeItem = async (feeItemId: number) => {
    if (!levelId) return;

    const reason = window.prompt('Provide rejection reason:');
    if (reason === null) return;

    setActiveFeeActionId(feeItemId);
    try {
      await updateFeeItemStatus(levelId, feeItemId, 'rejected', reason);
      await loadFeeAndArmData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reject fee item.';
      setFeeDataError(message);
    } finally {
      setActiveFeeActionId(null);
    }
  };

  const viewFeeItemDetails = (feeItemId: number) => {
    setSelectedFeeItemDetailId(feeItemId);
  };

  useEffect(() => {
    const loadFeeDetails = async () => {
      if (!levelId || !selectedFeeItemDetailId) return;
      try {
        const details = await getFeeItemById(levelId, selectedFeeItemDetailId);
        setFeeItems((prev) => {
          const next = prev.filter((item) => item.id !== details.id);
          return [details, ...next];
        });
      } catch {
        // Keep existing table item data if the details endpoint fails.
      }
    };

    loadFeeDetails();
  }, [levelId, selectedFeeItemDetailId]);

  const selectedFeeItemDetail = useMemo(
    () => feeItems.find((item) => item.id === selectedFeeItemDetailId) || null,
    [feeItems, selectedFeeItemDetailId],
  );

  const approvedFeeItems = useMemo(
    () => (feeItems ?? []).filter((item) => (item.isActive ?? true) && item.status === 'approved'),
    [feeItems],
  );

  const pendingFeeItems = useMemo(
    () => (feeItems ?? []).filter((item) => (item.isActive ?? true) && item.status === 'pending_approval'),
    [feeItems],
  );

  const feeExecutiveKpi = useMemo(() => {
    const approved = approvedFeeItems ?? [];
    const totalBilled = approved.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const totalPaid = Math.round(totalBilled * 0.741);
    const outstandingBalance = Math.max(0, totalBilled - totalPaid);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0;

    return {
      totalBilled,
      totalPaid,
      outstandingBalance,
      collectionRate,
      pendingReceipts: (pendingFeeItems ?? []).length,
      overdueTotal: Math.round(outstandingBalance * 0.3),
    };
  }, [approvedFeeItems, pendingFeeItems]);

  const filteredFeeItems = useMemo(
    () =>
      feeItems.filter((item) => {
        if (feeFilter === 'all') return true;
        return item.status === feeFilter;
      }),
    [feeItems, feeFilter],
  );

  const filteredPrincipalUsers = useMemo(
    () =>
      principalUsers.filter((user) => {
        const roleMatch = principalUserRoleFilter === 'all' || user.role === principalUserRoleFilter;
        const statusMatch = principalUserStatusFilter === 'all' || user.status === principalUserStatusFilter;
        return roleMatch && statusMatch;
      }),
    [principalUsers, principalUserRoleFilter, principalUserStatusFilter],
  );

  const filteredPrincipalDataChecks = useMemo(
    () =>
      principalDataChecks.filter((item) => {
        if (principalDataCheckSeverity === 'all') return true;
        return item.severity === principalDataCheckSeverity;
      }),
    [principalDataChecks, principalDataCheckSeverity],
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'default';
    }
  };

  const getPrincipalUserStatusBadgeVariant = (status: PrincipalReadOnlyUser['status']) => {
    switch (status) {
      case 'active':
        return 'approved';
      case 'inactive':
        return 'rejected';
      case 'suspended':
      case 'deleted':
        return 'pending';
      default:
        return 'default';
    }
  };

  const getDataCheckSeverityBadgeVariant = (severity: PrincipalDataCheck['severity']) => {
    switch (severity) {
      case 'critical':
        return 'rejected';
      case 'warning':
        return 'pending';
      default:
        return 'default';
    }
  };

  const openAddUserModal = () => {
    setEditingUserId(null);
    setUserForm({ firstName: '', lastName: '', email: '', phoneNumber: '', role: 'teacher', levelIds: [] });
    setUserManagementError(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: PrincipalReadOnlyUser) => {
    setEditingUserId(user.id);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      levelIds: user.levelIds || [],
    });
    setUserManagementError(null);
    setIsUserModalOpen(true);
  };

  const saveUser = async () => {
    if (!userForm.firstName.trim() || !userForm.lastName.trim() || !userForm.email.trim()) {
      setUserManagementError('First name, last name, and email are required.');
      return;
    }
    if (userForm.levelIds.length === 0) {
      setUserManagementError('Select at least one level.');
      return;
    }

    setIsSavingUser(true);
    setUserManagementError(null);

    try {
      if (!levelId) {
        throw new Error('No level selected. Please choose a category first.');
      }

      if (editingUserId) {
        const updated = await updateStaffInfo(editingUserId, {
          email: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          phoneNumber: userForm.phoneNumber || undefined,
          levelIds: userForm.levelIds,
        });

        setPrincipalUsers((prev) => prev.map((user) => (user.id === editingUserId ? updated : user)));
      } else {
        const invited = await inviteStaff(levelId, {
          email: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          phoneNumber: userForm.phoneNumber || undefined,
          role: userForm.role,
          levelIds: userForm.levelIds,
        });

        setPrincipalUsers((prev) => [invited, ...prev]);
      }

      setIsUserModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save user.';
      setUserManagementError(message);
    } finally {
      setIsSavingUser(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await removeStaff(userId);
      setPrincipalUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete user.';
      setUserManagementError(message);
    }
  };

  const handleUserStatusChange = async (userId: string, nextStatus: StaffStatus) => {
    try {
      const updated = await updateStaffStatus(userId, nextStatus);
      setPrincipalUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update status.';
      setUserManagementError(message);
    }
  };

  const addTerm = () => {
    if (!newTermDraft.name || !newTermDraft.startDate || !newTermDraft.endDate) {
      alert('Term name, start date, and end date are required.');
      return;
    }
    setSchoolSetupState((prev) => ({ ...prev, termDates: [...prev.termDates, newTermDraft] }));
    setNewTermDraft({ name: '', startDate: '', endDate: '', status: 'upcoming' });
  };

  const removeTerm = (termName: string) => {
    setSchoolSetupState((prev) => ({ ...prev, termDates: prev.termDates.filter((term) => term.name !== termName) }));
  };

  const addClassConfig = () => {
    if (!newClassDraft.className.trim()) {
      alert('Class name is required.');
      return;
    }
    setSchoolSetupState((prev) => ({
      ...prev,
      classConfiguration: [...prev.classConfiguration, newClassDraft],
    }));
    setNewClassDraft({ className: '', stream: 'Junior', capacity: 0, enrolled: 0 });
  };

  const removeClassConfig = (className: string) => {
    setSchoolSetupState((prev) => ({
      ...prev,
      classConfiguration: prev.classConfiguration.filter((item) => item.className !== className),
    }));
  };

  const addSubject = () => {
    const next = subjectDraft.trim();
    if (!next) return;
    setSchoolSetupState((prev) => ({ ...prev, subjectOfferings: [...prev.subjectOfferings, next] }));
    setSubjectDraft('');
  };

  const removeSubject = (subject: string) => {
    setSchoolSetupState((prev) => ({
      ...prev,
      subjectOfferings: prev.subjectOfferings.filter((item) => item !== subject),
    }));
  };

  const openAddDataCheckModal = () => {
    setEditingDataCheckId(null);
    setDataCheckForm({
      severity: 'warning',
      category: 'Missing Scores',
      status: 'open',
      className: '',
      owner: '',
      issue: '',
    });
    setIsDataCheckModalOpen(true);
  };

  const openEditDataCheckModal = (check: PrincipalDataCheck) => {
    setEditingDataCheckId(check.id);
    setDataCheckForm({
      severity: check.severity,
      category: check.category,
      status: check.status,
      className: check.className,
      owner: check.owner,
      issue: check.issue,
    });
    setIsDataCheckModalOpen(true);
  };

  const saveDataCheck = () => {
    if (!dataCheckForm.issue.trim() || !dataCheckForm.className.trim()) {
      alert('Issue and class are required.');
      return;
    }

    if (editingDataCheckId) {
      setPrincipalDataChecks((prev) => prev.map((check) => (check.id === editingDataCheckId ? { ...check, ...dataCheckForm } : check)));
    } else {
      setPrincipalDataChecks((prev) => [
        {
          id: `dc-${Date.now()}`,
          detectedAt: new Date().toISOString(),
          ...dataCheckForm,
        },
        ...prev,
      ]);
    }
    setIsDataCheckModalOpen(false);
  };

  const resolveDataCheck = (id: string) => {
    setPrincipalDataChecks((prev) =>
      prev.map((check) => (check.id === id ? { ...check, status: check.status === 'resolved' ? 'open' : 'resolved' } : check)),
    );
  };

  const deleteDataCheck = (id: string) => {
    if (!confirm('Delete this data check?')) return;
    setPrincipalDataChecks((prev) => prev.filter((check) => check.id !== id));
  };

  useEffect(() => {
    let isMounted = true;

    const loadPrincipalAnalytics = async () => {
      if (!selectedClassForPrincipal) {
        setSubjectsForSelectedClass([]);
        setSelectedClassAnalytics(null);
        setPrincipalSubjectPerformanceList([]);
        setPrincipalGradeDist([]);
        setPrincipalAtRisk([]);
        setPrincipalSubjectKpis(null);
        setPrincipalSubjectTrend([]);
        setPrincipalDeepDiveTrend([]);
        setPrincipalAnalyticsError(null);
        return;
      }

      setIsLoadingPrincipalAnalytics(true);
      setPrincipalAnalyticsError(null);

      try {
        const classId = selectedClassForPrincipal.id;
        const [classAnalytics, subjects, classWideAtRisk, deepDiveTrend, gradeDist] = await Promise.all([
          getClassAnalytics(classId),
          getSubjectsForClass(classId),
          getAtRiskStudents(classId),
          getDeepDiveTrend(classId),
          getGradeDistribution(classId),
        ]);

        if (!isMounted) return;

        setSelectedClassAnalytics(classAnalytics);
        setSubjectsForSelectedClass(subjects);
        setPrincipalSubjectPerformanceList(
          subjects.map((subject) => {
            const matchingPerformance = kpiSubjectPerformanceRows.find((row) => row.subject === subject.subjectName);
            return {
              subject: subject.subjectName,
              average: matchingPerformance?.average ?? 0,
              passRate: matchingPerformance?.passRate ?? 0,
            };
          }),
        );
        setPrincipalGradeDist(gradeDist);
        setPrincipalDeepDiveTrend(deepDiveTrend);
        setPrincipalAtRisk(classWideAtRisk);

        if (selectedSubjectForPrincipal) {
          const selectedSubject = subjects.find((subject) => subject.subjectName === selectedSubjectForPrincipal);
          if (!selectedSubject) {
            throw new Error('Selected subject no longer exists for this class.');
          }

          const [subjectSummary, subjectTrend] = await Promise.all([
            getClassSubjectSummary(classId, selectedSubject.subjectId),
            getClassSubjectTrends(classId, selectedSubject.subjectId),
          ]);

          if (!isMounted) return;

          setPrincipalSubjectKpis(subjectSummary as SubjectSummary);
          setPrincipalSubjectTrend(subjectTrend);
          // Backend currently exposes class-level deep dive and at-risk endpoints only.
          setPrincipalDeepDiveTrend(deepDiveTrend);
          setPrincipalAtRisk(classWideAtRisk);
        } else {
          setPrincipalSubjectKpis(null);
          setPrincipalSubjectTrend([]);
          setPrincipalDeepDiveTrend(deepDiveTrend);
          setPrincipalAtRisk(classWideAtRisk);
        }

      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load detailed analytics at the moment.';
        setPrincipalAnalyticsError(message);
      } finally {
        if (isMounted) {
          setIsLoadingPrincipalAnalytics(false);
        }
      }
    };

    loadPrincipalAnalytics();

    return () => {
      isMounted = false;
    };
  }, [selectedClassForPrincipal, selectedSubjectForPrincipal, kpiSubjectPerformanceRows]);
  
  // ========== HANDLERS ==========
  const handleApproveItem = () => {
    if (!selectedApprovalItem) return;
    // Update status in mock arrays (in real app, persist to localStorage)
    if (approvalTab === 'syllabus') {
      const idx = pendingSyllabus.findIndex(i => i.id === selectedApprovalItem.id);
      if (idx !== -1) {
        pendingSyllabus[idx].status = 'approved';
        pendingSyllabus[idx].approvedBy = 'principal1';
        pendingSyllabus[idx].approvedAt = new Date().toISOString();
        pendingSyllabus[idx].statusHistory.push({ status: 'approved', at: new Date().toISOString() });
      }
    } else {
      const idx = pendingLessonNotes.findIndex(i => i.id === selectedApprovalItem.id);
      if (idx !== -1) {
        pendingLessonNotes[idx].status = 'approved';
        pendingLessonNotes[idx].approvedBy = 'principal1';
        pendingLessonNotes[idx].approvedAt = new Date().toISOString();
        pendingLessonNotes[idx].statusHistory.push({ status: 'approved', at: new Date().toISOString() });
      }
    }
    addAuditLog({
      userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
      module: approvalTab === 'syllabus' ? 'syllabus' : 'lessonNotes',
      action: `Approved ${approvalTab === 'syllabus' ? 'syllabus' : 'lesson note'}: ${selectedApprovalItem.title}`,
      riskLevel: 'low',
      details: `ID ${selectedApprovalItem.id}, class ${selectedApprovalItem.class}`,
    });
    setSelectedApprovalItem(null);
    setRejectReason('');
    // Force re-render (in real app use state)
    window.location.reload(); // quick hack; better to lift state
  };
  
  const handleRejectItem = () => {
    if (!selectedApprovalItem) return;
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    if (approvalTab === 'syllabus') {
      const idx = pendingSyllabus.findIndex(i => i.id === selectedApprovalItem.id);
      if (idx !== -1) {
        pendingSyllabus[idx].status = 'rejected';
        pendingSyllabus[idx].rejectionReason = rejectReason;
        pendingSyllabus[idx].statusHistory.push({ status: 'rejected', at: new Date().toISOString(), reason: rejectReason });
      }
    } else {
      const idx = pendingLessonNotes.findIndex(i => i.id === selectedApprovalItem.id);
      if (idx !== -1) {
        pendingLessonNotes[idx].status = 'rejected';
        pendingLessonNotes[idx].rejectionReason = rejectReason;
        pendingLessonNotes[idx].statusHistory.push({ status: 'rejected', at: new Date().toISOString(), reason: rejectReason });
      }
    }
    addAuditLog({
      userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
      module: approvalTab === 'syllabus' ? 'syllabus' : 'lessonNotes',
      action: `Rejected ${approvalTab === 'syllabus' ? 'syllabus' : 'lesson note'}: ${selectedApprovalItem.title}`,
      riskLevel: 'medium',
      details: `Reason: ${rejectReason}`,
    });
    setSelectedApprovalItem(null);
    setRejectReason('');
    window.location.reload();
  };
  
  const handleBatchApprove = () => {
    if (selectedRows.length === 0) return;
    if (confirm(`Approve ${selectedRows.length} items?`)) {
      selectedRows.forEach(id => {
        // similar to single approve
      });
      addAuditLog({
        userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
        module: approvalTab === 'syllabus' ? 'syllabus' : 'lessonNotes',
        action: `Batch approved ${selectedRows.length} items`,
        riskLevel: 'low',
        details: `IDs: ${selectedRows.join(', ')}`,
      });
      setSelectedRows([]);
      window.location.reload();
    }
  };
  
  const handleBatchReject = () => {
    if (selectedRows.length === 0) return;
    const reason = prompt('Enter rejection reason for all selected items:');
    if (!reason) return;
    // apply to each
    addAuditLog({
      userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
      module: approvalTab === 'syllabus' ? 'syllabus' : 'lessonNotes',
      action: `Batch rejected ${selectedRows.length} items`,
      riskLevel: 'medium',
      details: `Reason: ${reason}`,
    });
    setSelectedRows([]);
    window.location.reload();
  };
  
  const handleResultsToggle = () => {
    if (!examStartDate || !examEndDate) {
      alert('Set exam start and end dates first');
      return;
    }
    if (new Date() < new Date(examEndDate)) {
      alert('Results cannot be released before the exam end date.');
      return;
    }
    setResultsReleased(!resultsReleased);
    addAuditLog({
      userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
      module: 'result gating',
      action: `Result visibility toggled to ${!resultsReleased ? 'visible' : 'hidden'}`,
      riskLevel: 'high',
      details: `Term ${selectedResultTerm}, start ${examStartDate}, end ${examEndDate}`,
    });
  };
  
  const handleApplyFeePolicy = () => {
    const policy = { examStart: examStartDate, examEnd: examEndDate, feePolicy, updatedAt: new Date().toISOString(), updatedBy: 'principal1' };
    localStorage.setItem('resultGatePolicy', JSON.stringify(policy));
    addAuditLog({
      userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
      module: 'result gating',
      action: 'Fee gating policy updated',
      riskLevel: 'high',
      details: `New policy: ${feePolicy}`,
      oldValue: feePolicy, newValue: feePolicy,
    });
    alert('Result release policy updated.');
  };
  
  const handleExportLogs = () => {
    const filtered = getFilteredLogs();
    const csv = convertToCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportClassPerformance = async () => {
    if (!levelId) {
      setKpiDataError('No level selected. Please choose a category first.');
      return;
    }

    setIsExportingClassPerformance(true);
    setKpiDataError(null);

    try {
      const blob = await exportClassPerformance(levelId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class_performance_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export class performance right now.';
      setKpiDataError(message);
    } finally {
      setIsExportingClassPerformance(false);
    }
  };
  
  const getFilteredLogs = () => {
    return allAuditLogs.filter(log => {
      if (activityFilter.role && log.userRole !== activityFilter.role) return false;
      if (activityFilter.module && log.module !== activityFilter.module) return false;
      if (activityFilter.highRiskOnly && log.riskLevel !== 'high') return false;
      if (activityFilter.startDate && log.timestamp < activityFilter.startDate) return false;
      if (activityFilter.endDate && log.timestamp > activityFilter.endDate) return false;
      return true;
    });
  };
  
  const convertToCSV = (logs: AuditLogEntry[]) => {
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Risk Level', 'Details'];
    const rows = logs.map(log => [log.timestamp, log.userName, log.userRole, log.module, log.action, log.riskLevel, log.details]);
    return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  };
  
  const handleClassApproval = (cls: ClassResultApproval, action: 'approve' | 'requestChanges') => {
    if (action === 'approve') {
      setClassApprovals(prev => prev.map(c => c.className === cls.className ? { ...c, status: 'approved', lastUpdated: new Date().toISOString() } : c));
      addAuditLog({
        userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
        module: 'result approval',
        action: `Approved results for class ${cls.className}`,
        riskLevel: 'medium',
        details: `Term ${selectedTermForApproval}`,
      });
    } else {
      if (!changeRequestReason.trim()) {
        alert('Please provide a reason for requesting changes');
        return;
      }
      setClassApprovals(prev => prev.map(c => c.className === cls.className ? { ...c, status: 'changes_requested', lastUpdated: new Date().toISOString(), reason: changeRequestReason } : c));
      addAuditLog({
        userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
        module: 'result approval',
        action: `Requested changes for class ${cls.className}`,
        riskLevel: 'low',
        details: `Reason: ${changeRequestReason}`,
      });
      setSelectedClassApproval(null);
      setChangeRequestReason('');
    }
  };
  
  const handleApproveAllPending = () => {
    if (confirm('Approve all pending classes? This will release results according to the fee gating policy.')) {
      setClassApprovals(prev => prev.map(c => c.status === 'pending' ? { ...c, status: 'approved', lastUpdated: new Date().toISOString() } : c));
      addAuditLog({
        userId: 'principal1', userName: 'Mr. Brown', userRole: 'principal',
        module: 'result approval',
        action: 'Approved all pending classes',
        riskLevel: 'high',
        details: `Term ${selectedTermForApproval}`,
      });
    }
  };
  
  const exportApprovalSummary = () => {
    const csv = convertApprovalsToCSV(classApprovals);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_approval_${selectedTermForApproval}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const convertApprovalsToCSV = (approvals: ClassResultApproval[]) => {
    const headers = ['Class', 'Teacher', 'Assessment Completion (%)', 'Status', 'Last Updated', 'Reason'];
    const rows = approvals.map(a => [a.className, a.teacher, a.assessmentCompletion, a.status, a.lastUpdated, a.reason || '']);
    return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  };
  
  // Filtered items for Block 3
  const filteredSyllabus = pendingSyllabus.filter(item => 
    (filterClass === '' || item.class === filterClass) &&
    (filterSubject === '' || item.subject === filterSubject) &&
    item.status === 'submitted'
  ).sort((a,b) => sortDirection === 'desc' ? (a[sortField] > b[sortField] ? -1 : 1) : (a[sortField] < b[sortField] ? -1 : 1));
  
  const filteredLessonNotes = pendingLessonNotes.filter(item =>
    (filterClass === '' || item.class === filterClass) &&
    (filterSubject === '' || item.subject === filterSubject) &&
    item.status === 'submitted'
  ).sort((a,b) => sortDirection === 'desc' ? (a[sortField] > b[sortField] ? -1 : 1) : (a[sortField] < b[sortField] ? -1 : 1));
  
  const uniqueClasses = [...new Set([...pendingSyllabus.map(s => s.class), ...pendingLessonNotes.map(l => l.class)])];
  const uniqueSubjects = [...new Set([...pendingSyllabus.map(s => s.subject), ...pendingLessonNotes.map(l => l.subject)])];
  
  // Compute affected students for policy warning
  const affectedStudentsCount = 12; // mock
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {[
            { id: 'fee', label: 'Fee Oversight' },
            { id: 'kpi', label: 'School KPI' },
            { id: 'approvals', label: 'Approval Workflow' },
            { id: 'resultApproval', label: 'Result Approval' },
            { id: 'parentEngagement', label: 'Parent Engagement' },
            { id: 'schoolSetup', label: 'School Setup' },
            { id: 'userManagement', label: 'User Management' },
            { id: 'auditLogs', label: 'Audit Logs' },
            { id: 'dataChecks', label: 'Data Checks' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeMainTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* ========== TAB 1: FEE OVERSIGHT ========== */}
      {activeMainTab === 'fee' && (
        <>
          <Card title="Fee Oversight (Executive View)" action={
            <div className="flex gap-2">
              <select value={selectedFeeTerm} onChange={e => setSelectedFeeTerm(e.target.value)} className="border p-1 rounded">
                <option>Term 3, 2026</option><option>Term 2, 2026</option>
              </select>
              <select value={selectedArmFilterId} onChange={(e) => setSelectedArmFilterId(e.target.value)} className="border p-1 rounded">
                <option value="">All Arms</option>
                {arms.map((arm) => (
                  <option key={arm.id} value={arm.id}>{arm.name}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={loadFeeAndArmData}>Refresh</Button>
            </div>
          }>
            {isLoadingFeeData ? (
              <div className="mb-4 rounded border border-border p-3 text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading fee dashboard data...
              </div>
            ) : null}
            {feeDataError ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {feeDataError}
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="p-3 border rounded"><p className="text-sm">Total Billed</p><p className="text-xl font-bold">{formatCurrency(feeExecutiveKpi?.totalBilled)}</p></div>
              <div className="p-3 border rounded bg-green-50"><p className="text-sm">Total Paid</p><p className="text-xl font-bold text-green-700">{formatCurrency(feeExecutiveKpi?.totalPaid)}</p></div>
              <div className="p-3 border rounded"><p className="text-sm">Outstanding</p><p className="text-xl font-bold">{formatCurrency(feeExecutiveKpi?.outstandingBalance)}</p></div>
              <div className="p-3 border rounded"><p className="text-sm">Collection Rate</p><p className="text-xl font-bold">{feeExecutiveKpi?.collectionRate ?? 0}%</p></div>
            </div>
            <Card title="Class-Level Fee Performance">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th>Class</th><th>Billed</th><th>Paid</th><th>Outstanding</th><th>Collection Rate</th><th>Action</th></tr></thead>
                <tbody>{feeClassRows.map(row => <tr key={row.armId} className="border-b"><td>{row.className}</td><td>{formatCurrency(row.billed)}</td><td>{formatCurrency(row.paid)}</td><td>{formatCurrency(row.outstanding)}</td><td>{row.collectionRate}%</td><td><Button size="sm" variant="outline" onClick={() => setSelectedFinanceClass(row.className)}><Eye size={14} /> View</Button></td></tr>)}</tbody>
              </table>
            </Card>
          </Card>

          <Card title="Pending Fee Approvals">
            {pendingFeeItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No fee items awaiting approval</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th>Name</th><th>Category</th><th>Amount</th><th>Scope</th><th>Due Date</th><th>Submitted</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFeeItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="font-medium">{item.name}</td>
                        <td>{item.category}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{item.term} • {item.armId || item.classId ? `Arm ${item.armId || item.classId}` : 'All Arms'}</td>
                        <td>{item.dueDate}</td>
                        <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approvePendingFeeItem(item.id)} disabled={activeFeeActionId === item.id}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectPendingFeeItem(item.id)} disabled={activeFeeActionId === item.id}>Reject</Button>
                            <Button size="sm" variant="outline" onClick={() => viewFeeItemDetails(item.id)}>Details</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="All Fee Items (Read-Only)" className="mt-6">
            <div className="mb-4">
              <select
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value as 'all' | 'pending_approval' | 'approved' | 'rejected')}
                className="border rounded p-2 text-sm"
              >
                <option value="all">All</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th>Name &amp; Category</th>
                    <th>Amount</th>
                    <th>Scope</th>
                    <th>Due Date</th>
                    <th>Compulsory</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeeItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td>{item.term} • {item.armId || item.classId ? `Arm ${item.armId || item.classId}` : 'All Arms'}</td>
                      <td>{item.dueDate}</td>
                      <td><Badge variant={item.isCompulsory ? 'approved' : 'default'}>{item.isCompulsory ? 'Yes' : 'No'}</Badge></td>
                      <td><Badge variant={getStatusBadgeVariant(item.status)}>{item.status.replace('_', ' ')}</Badge></td>
                      <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <Button size="sm" variant="outline" onClick={() => viewFeeItemDetails(item.id)}>View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      
      {/* ========== TAB 2: SCHOOL KPI (Blocks 4 & 5) ========== */}
      {activeMainTab === 'kpi' && (
        <>
          {isLoadingKpiData ? (
            <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading school KPI data...
            </div>
          ) : null}

          {kpiDataError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {kpiDataError}
            </div>
          ) : null}

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded p-3"><div className="flex justify-between"><span>Pass Rate</span><Trophy size={16}/></div><p className="text-2xl font-bold">{schoolSummary?.passRate ?? 0}%</p></div>
            <div className="border rounded p-3"><div className="flex justify-between"><span>Avg Score</span><TrendingUp size={16}/></div><p className="text-2xl font-bold">{schoolSummary?.averageScore ?? 0}%</p></div>
            <div className="border rounded p-3"><div className="flex justify-between"><span>Attendance</span><Activity size={16}/></div><p className="text-2xl font-bold">{schoolSummary?.attendanceRate ?? 0}%</p></div>
            <div className="border rounded p-3"><div className="flex justify-between"><span>Students</span><Users size={16}/></div><p className="text-2xl font-bold">{schoolSummary?.totalStudents ?? 0}</p></div>
          </div>
          
          {/* Subject Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Subject Performance">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={kpiSubjectPerformanceRows}><CartesianGrid /><XAxis dataKey="subject" /><YAxis domain={[0,100]} /><Tooltip formatter={(value, name) => [`${value}%`, name]} /><Bar dataKey="average" fill="#3b82f6" /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Class Performance" action={<Button variant="outline" size="sm" onClick={handleExportClassPerformance} disabled={isExportingClassPerformance}>{isExportingClassPerformance ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />} Export</Button>}>
              <table className="w-full text-sm"><thead><tr><th>Class</th><th>Avg Score</th><th>Pass Rate</th><th>Attendance</th><th>Rank</th></tr></thead><tbody>{kpiClassPerformanceRows.map(c => <tr key={c.classId || c.className}><td>{c.className}</td><td>{c.averageScore}%</td><td>{c.passRate}%</td><td>{c.attendanceRate}%</td><td>{c.rank || '-'}</td></tr>)}</tbody></table>
            </Card>
          </div>
          
          {/* Attendance Trend & Medication Exceptions & Transport */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Attendance Trend (Last 30 days)">
              <ResponsiveContainer width="100%" height={200}><LineChart data={kpiAttendanceTrend}><CartesianGrid /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line type="monotone" dataKey="present" stroke="#10b981" /></LineChart></ResponsiveContainer>
            </Card>
            <Card title="Medication Exceptions Today">
              {kpiMedicationExceptions.length > 0 ? kpiMedicationExceptions.map((ex, i) => <div key={`${ex.student}-${ex.timeDue}-${i}`} className="flex items-center gap-2 p-2 border-b"><Heart size={14} className="text-red-500"/><div><p className="text-sm">{ex.student} ({ex.class}) - {ex.medication}</p><p className="text-xs text-muted-foreground">Missed at {ex.timeDue} - {ex.reason || ex.status || 'No reason provided'}</p></div></div>) : <p className="text-sm text-muted-foreground">No medication exceptions for today.</p>}
            </Card>
            <Card title="Transport Distribution">
              <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={kpiTransportDistribution} dataKey="count" nameKey="mode" cx="50%" cy="50%" outerRadius={60} label><Cell fill="#3b82f6"/><Cell fill="#10b981"/><Cell fill="#f59e0b"/><Cell fill="#8b5cf6"/></Pie><Tooltip /></PieChart></ResponsiveContainer>
            </Card>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Class & Subject Analytics</h3>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="w-64">
                <label className="text-sm font-medium">Select Class</label>
                <select
                  className="w-full border rounded p-2 mt-1"
                  value={selectedClassForPrincipal?.id || ''}
                  onChange={(e) => {
                    const selectedClass = kpiClasses.find((item) => item.classId === e.target.value);
                    setSelectedClassForPrincipal(selectedClass ? { id: selectedClass.classId, className: selectedClass.className } : null);
                    setSelectedSubjectForPrincipal(null);
                  }}
                >
                  <option value="">-- Choose a class --</option>
                  {kpiClasses.map((classInfo) => (
                    <option key={classInfo.classId} value={classInfo.classId}>{classInfo.className}</option>
                  ))}
                </select>
              </div>
              <div className="w-64">
                <label className="text-sm font-medium">Select Subject (optional)</label>
                <select
                  className="w-full border rounded p-2 mt-1"
                  value={selectedSubjectForPrincipal || ''}
                  onChange={(e) => setSelectedSubjectForPrincipal(e.target.value || null)}
                  disabled={!selectedClassForPrincipal}
                >
                  <option value="">-- All subjects --</option>
                  {subjectsForSelectedClass.map((subj) => (
                    <option key={subj.subjectId} value={subj.subjectName}>{subj.subjectName}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingPrincipalAnalytics ? (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading detailed analytics...
              </div>
            ) : null}

            {principalAnalyticsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {principalAnalyticsError}
              </div>
            ) : null}

            {selectedClassForPrincipal && !isLoadingPrincipalAnalytics && !principalAnalyticsError ? (
              <ClassSubjectAnalytics
                selectedClass={selectedClassForPrincipal}
                selectedSubjectId={selectedSubjectLabelForPrincipal}
                onSelectSubject={setSelectedSubjectForPrincipal}
                subjectKpis={principalSubjectKpis ?? undefined}
                subjectTrendData={principalSubjectTrend}
                classPerformanceData={kpiClassPerformanceRows.map((c) => ({
                  className: c.className,
                  averageScore: c.averageScore,
                  passRate: c.passRate,
                  attendanceRate: c.attendanceRate,
                }))}
                subjectPerformanceList={principalSubjectPerformanceList}
                deepDiveTrendData={principalDeepDiveTrend}
                gradeDistributionData={principalGradeDist}
                atRiskStudents={principalAtRisk}
              />
            ) : null}
          </div>
        </>
      )}
      
      {/* ========== TAB 3: APPROVAL WORKFLOW (Block 3) + User Activity (Block 6) ========== */}
      {activeMainTab === 'approvals' && (
        <>
          <div ref={approvalsSectionRef}>
            <Card title="Curriculum Approval Workflow" action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBatchApprove} disabled={selectedRows.length===0}>Approve Selected</Button>
                <Button size="sm" variant="destructive" onClick={handleBatchReject} disabled={selectedRows.length===0}>Reject Selected</Button>
              </div>
            }>
              {/* Filters and sort */}
              <div className="flex flex-wrap gap-3 mb-4 p-2 bg-muted/20 rounded">
                <select className="border rounded p-1 text-sm" value={filterClass} onChange={e=>setFilterClass(e.target.value)}><option value="">All Classes</option>{uniqueClasses.map(c=><option key={c}>{c}</option>)}</select>
                <select className="border rounded p-1 text-sm" value={filterSubject} onChange={e=>setFilterSubject(e.target.value)}><option value="">All Subjects</option>{uniqueSubjects.map(s=><option key={s}>{s}</option>)}</select>
                <select className="border rounded p-1 text-sm" value={sortField} onChange={e=>setSortField(e.target.value as any)}><option value="submittedDate">Sort by Date</option><option value="status">Sort by Status</option></select>
                <button onClick={()=>setSortDirection(prev=>prev==='asc'?'desc':'asc')} className="text-sm underline">{sortDirection==='asc'?'Ascending':'Descending'}</button>
              </div>
              
              {/* Tab switcher */}
              <div className="flex gap-2 border-b mb-3">
                <button onClick={()=>setApprovalTab('syllabus')} className={`px-3 py-1 ${approvalTab==='syllabus' ? 'border-b-2 border-primary' : ''}`}>Syllabus ({filteredSyllabus.length})</button>
                <button onClick={()=>setApprovalTab('lessonNotes')} className={`px-3 py-1 ${approvalTab==='lessonNotes' ? 'border-b-2 border-primary' : ''}`}>Lesson Notes ({filteredLessonNotes.length})</button>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th><input type="checkbox" onChange={e=>setSelectedRows(e.target.checked ? (approvalTab==='syllabus'?filteredSyllabus.map(i=>i.id):filteredLessonNotes.map(i=>i.id)) : [])} /></th><th>Class</th><th>Subject</th><th>Teacher</th><th>Submission Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(approvalTab === 'syllabus' ? filteredSyllabus : filteredLessonNotes).map(item => (
                      <tr key={item.id} className="border-b">
                        <td><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={e=>setSelectedRows(prev=>e.target.checked ? [...prev, item.id] : prev.filter(id=>id!==item.id))} /></td>
                        <td>{item.class}</td><td>{item.subject}</td><td>{item.teacher}</td><td>{formatDate(item.submittedDate)}</td><td><Badge variant="submitted">{item.status}</Badge></td>
                        <td><Button size="sm" variant="outline" onClick={()=>setSelectedApprovalItem(item)}>Review</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          
          {/* Block 6: User Activity Monitoring */}
          <Card title="User Activity Monitoring" action={
            <div className="flex flex-wrap gap-2">
              <select className="border rounded p-1 text-sm" value={activityFilter.role} onChange={e=>setActivityFilter({...activityFilter, role:e.target.value})}><option value="">All Roles</option><option>principal</option><option>bursar</option><option>teacher</option></select>
              <select className="border rounded p-1 text-sm" value={activityFilter.module} onChange={e=>setActivityFilter({...activityFilter, module:e.target.value})}><option value="">All Modules</option><option>fees</option><option>syllabus</option><option>lessonNotes</option><option>result gating</option><option>result approval</option></select>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={activityFilter.highRiskOnly} onChange={e=>setActivityFilter({...activityFilter, highRiskOnly:e.target.checked})} /> High-risk only</label>
              <input type="date" className="border rounded p-1 text-sm" value={activityFilter.startDate} onChange={e=>setActivityFilter({...activityFilter, startDate:e.target.value})} placeholder="Start" />
              <input type="date" className="border rounded p-1 text-sm" value={activityFilter.endDate} onChange={e=>setActivityFilter({...activityFilter, endDate:e.target.value})} placeholder="End" />
              <Button size="sm" variant="outline" onClick={handleExportLogs}><Download size={14}/> Export CSV</Button>
            </div>
          }>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getFilteredLogs().map(log => (
                <div key={log.id} className={`p-3 border rounded-lg ${log.riskLevel === 'high' ? 'border-red-300 bg-red-50 dark:bg-red-950' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div><span className="font-medium">{log.action}</span><span className="text-xs text-muted-foreground ml-2">{formatDateTime(log.timestamp)}</span></div>
                    <Badge variant={log.riskLevel === 'high' ? 'rejected' : 'default'}>{log.riskLevel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.details}</p>
                  <p className="text-xs">By {log.userName} ({log.userRole}) • {log.module}</p>
                  {log.riskLevel === 'high' && <div className="flex items-center gap-1 text-red-600 text-xs mt-1"><AlertTriangle size={12}/> High-risk action</div>}
                  <button className="text-xs underline mt-1" onClick={()=>setExpandedLogId(expandedLogId===log.id ? null : log.id)}>{expandedLogId===log.id ? 'Hide details' : 'Show details'}</button>
                  {expandedLogId===log.id && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      {log.oldValue && <div>Old value: {JSON.stringify(log.oldValue)}</div>}
                      {log.newValue && <div>New value: {JSON.stringify(log.newValue)}</div>}
                      <div>IP: {log.ip || '192.168.1.1 (mock)'}</div>
                      <div>Browser: {log.browser || 'Chrome 120 (mock)'}</div>
                    </div>
                  )}
                </div>
              ))}
              {getFilteredLogs().length === 0 && <p className="text-muted-foreground">No activity matches filters.</p>}
            </div>
          </Card>
        </>
      )}
      
      {/* ========== TAB 4: RESULT APPROVAL (Block 8) ========== */}
      {activeMainTab === 'resultApproval' && (
        <>
        {/* Result Release + Fee Gating (Block 5) */}
          <Card title="Result Release Control & Fee Gating">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div><label>Term</label><select className="w-full border rounded p-2" value={selectedResultTerm} onChange={e=>setSelectedResultTerm(e.target.value)}><option>Term 3, 2026</option><option>Term 2, 2026</option></select></div>
              <div><label>Exam Start Date</label><input type="date" className="w-full border rounded p-2" value={examStartDate} onChange={e=>setExamStartDate(e.target.value)} /></div>
              <div><label>Exam End Date</label><input type="date" className="w-full border rounded p-2" value={examEndDate} onChange={e=>setExamEndDate(e.target.value)} /></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-accent rounded mb-4">
              <div><p className="font-medium">Result Visibility</p><p className="text-sm text-muted-foreground">{resultsReleased ? 'Visible to parents' : 'Hidden from parents'}</p>{examEndDate && new Date() < new Date(examEndDate) && <p className="text-yellow-600 text-sm">Results will not be visible until after exam end date.</p>}</div>
              <button disabled={!examStartDate || !examEndDate} onClick={handleResultsToggle} className={`relative inline-flex h-6 w-11 rounded-full transition ${resultsReleased ? 'bg-green-600' : 'bg-gray-400'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${resultsReleased ? 'translate-x-6' : 'translate-x-1'}`} /></button>
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Fee Gating Policy</p>
              <div className="flex gap-4 mb-3">
                <label><input type="radio" name="policy" value="full_access" checked={feePolicy==='full_access'} onChange={()=>setFeePolicy('full_access')} /> Full Access (no fee block)</label>
                <label><input type="radio" name="policy" value="partial_access" checked={feePolicy==='partial_access'} onChange={()=>setFeePolicy('partial_access')} /> Partial Access (summary only)</label>
                <label><input type="radio" name="policy" value="block" checked={feePolicy==='block'} onChange={()=>setFeePolicy('block')} /> Block All Results</label>
              </div>
              <div className="bg-yellow-50 p-2 rounded text-sm mb-3"><AlertTriangle size={14} className="inline mr-1"/> {affectedStudentsCount} students have unpaid fees and will be affected by this policy.</div>
              <Button onClick={handleApplyFeePolicy}>Apply Policy</Button>
            </div>
          </Card>
        <Card title={`Result Approval – ${selectedTermForApproval}`} action={
          <div className="flex gap-2">
            <select className="border rounded p-1" value={selectedTermForApproval} onChange={e=>setSelectedTermForApproval(e.target.value)}><option>term-3-2026</option><option>term-2-2026</option></select>
            <Button size="sm" variant="outline" onClick={handleApproveAllPending}>Approve All Pending</Button>
            <Button size="sm" variant="outline" onClick={exportApprovalSummary}><Download size={14}/> Export Summary</Button>
          </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th>Class</th><th>Teacher</th><th>Assessment Completion</th><th>Status</th><th>Last Updated</th><th>Actions</th></tr></thead>
              <tbody>
                {classApprovals.map(cls => (
                  <tr key={cls.className} className="border-b">
                    <td>{cls.className}</td><td>{cls.teacher}</td><td>{cls.assessmentCompletion}%</td>
                      <td><Badge variant={cls.status === 'approved' ? 'approved' : cls.status === 'pending' ? 'pending' : 'rejected'}>{cls.status.replace('_',' ')}</Badge></td>
                    <td>{formatDate(cls.lastUpdated)}</td>
                    <td><Button size="sm" variant="outline" onClick={()=>setSelectedClassApproval(cls)}>Review</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">Note: Even after approval, fee gating policy (Block 5) still applies to parent visibility.</p>
        </Card>
        </>
      )}
      
      {/* ========== TAB 5: PARENT ENGAGEMENT (Block 7) ========== */}
      {activeMainTab === 'parentEngagement' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded p-4 bg-gradient-to-br from-blue-50 to-white"><div className="flex justify-between"><span className="text-muted-foreground">Parents Activated</span><Users size={18}/></div><p className="text-3xl font-bold">{parentEngagementData.totalParentsActivated}</p></div>
            <div className="border rounded p-4 bg-gradient-to-br from-green-50 to-white"><div className="flex justify-between"><span className="text-muted-foreground">Active Last 7 Days</span><Activity size={18}/></div><p className="text-3xl font-bold">{parentEngagementData.weeklyActive}</p></div>
            <div className="border rounded p-4 bg-gradient-to-br from-purple-50 to-white"><div className="flex justify-between"><span className="text-muted-foreground">Parent‑Student Ratio</span><UserCheck size={18}/></div><p className="text-3xl font-bold">{Math.round((parentEngagementData.totalParentsActivated / 342) * 100)}%</p></div>
            <div className="border rounded p-4 bg-gradient-to-br from-orange-50 to-white"><div className="flex justify-between"><span className="text-muted-foreground">Avg Logins/Week</span><TrendingUp size={18}/></div><p className="text-3xl font-bold">3.2</p></div>
          </div>
          
          <Card title="New Parent Activations (Last 30 days)">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={parentEngagementData.dailyNewActivations.slice(-30)}><CartesianGrid /><XAxis dataKey="date" tick={{fontSize:10}} /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} /></LineChart>
            </ResponsiveContainer>
          </Card>
          
          <Card title="Class‑Level Breakdown" action={<TabletSmartphone size={16}/>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th>Class</th><th># Students</th><th># Parents Linked</th><th>% Linked</th><th>Avg Logins/Week (7d)</th></tr></thead>
                <tbody>
                  {parentEngagementData.classBreakdown.map(c => (
                    <tr key={c.className} className="border-b">
                      <td>{c.className}</td><td>{c.totalStudents}</td><td>{c.parentsLinked}</td>
                      <td>{Math.round((c.parentsLinked/c.totalStudents)*100)}%</td>
                      <td>{c.avgLoginsPerWeek}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Classes with lowest % linked are highlighted – consider encouraging teacher promotion.</p>
          </Card>
        </>
      )}

      {/* ========== TAB 6: SCHOOL SETUP (READ-ONLY) ========== */}
      {activeMainTab === 'schoolSetup' && (
        <div className="space-y-6">
          <Card title="School Configuration" action={<Button size="sm" onClick={() => alert('School setup saved successfully.')}>Save Configuration</Button>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded border p-3">
                <p className="text-sm text-muted-foreground">School Name</p>
                <input
                  className="w-full border rounded p-2 mt-1"
                  value={schoolSetupState.schoolProfile.schoolName}
                  onChange={(e) => setSchoolSetupState((prev) => ({
                    ...prev,
                    schoolProfile: { ...prev.schoolProfile, schoolName: e.target.value },
                  }))}
                />
              </div>
              <div className="rounded border p-3">
                <p className="text-sm text-muted-foreground">School Code</p>
                <input
                  className="w-full border rounded p-2 mt-1"
                  value={schoolSetupState.schoolProfile.schoolCode}
                  onChange={(e) => setSchoolSetupState((prev) => ({
                    ...prev,
                    schoolProfile: { ...prev.schoolProfile, schoolCode: e.target.value },
                  }))}
                />
              </div>
              <div className="rounded border p-3">
                <p className="text-sm text-muted-foreground">Academic Session</p>
                <input
                  className="w-full border rounded p-2 mt-1"
                  value={schoolSetupState.schoolProfile.academicSession}
                  onChange={(e) => setSchoolSetupState((prev) => ({
                    ...prev,
                    schoolProfile: { ...prev.schoolProfile, academicSession: e.target.value },
                  }))}
                />
              </div>
              <div className="rounded border p-3">
                <p className="text-sm text-muted-foreground">Principal</p>
                <input
                  className="w-full border rounded p-2 mt-1"
                  value={schoolSetupState.schoolProfile.principalName}
                  onChange={(e) => setSchoolSetupState((prev) => ({
                    ...prev,
                    schoolProfile: { ...prev.schoolProfile, principalName: e.target.value },
                  }))}
                />
              </div>
            </div>
          </Card>

          <Card title="Academic Calendar" action={<Button size="sm" onClick={addTerm}><Plus size={14} className="mr-1" />Add Term</Button>}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
              <input className="border rounded p-2" placeholder="Term name" value={newTermDraft.name} onChange={(e) => setNewTermDraft((prev) => ({ ...prev, name: e.target.value }))} />
              <input type="date" className="border rounded p-2" value={newTermDraft.startDate} onChange={(e) => setNewTermDraft((prev) => ({ ...prev, startDate: e.target.value }))} />
              <input type="date" className="border rounded p-2" value={newTermDraft.endDate} onChange={(e) => setNewTermDraft((prev) => ({ ...prev, endDate: e.target.value }))} />
              <select className="border rounded p-2" value={newTermDraft.status} onChange={(e) => setNewTermDraft((prev) => ({ ...prev, status: e.target.value as 'completed' | 'active' | 'upcoming' }))}>
                <option value="upcoming">upcoming</option>
                <option value="active">active</option>
                <option value="completed">completed</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Term</th>
                    <th className="py-2">Start Date</th>
                    <th className="py-2">End Date</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolSetupState.termDates.map((term) => (
                    <tr key={term.name} className="border-b">
                      <td className="py-2 font-medium">{term.name}</td>
                      <td className="py-2">{term.startDate}</td>
                      <td className="py-2">{term.endDate}</td>
                      <td className="py-2">
                        <Badge variant={term.status === 'active' ? 'approved' : term.status === 'completed' ? 'default' : 'pending'}>{term.status}</Badge>
                      </td>
                      <td className="py-2">
                        <Button size="sm" variant="destructive" onClick={() => removeTerm(term.name)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Class Configuration" action={<Button size="sm" onClick={addClassConfig}><Plus size={14} className="mr-1" />Add Class</Button>}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <input className="border rounded p-2" placeholder="Class name" value={newClassDraft.className} onChange={(e) => setNewClassDraft((prev) => ({ ...prev, className: e.target.value }))} />
                <input className="border rounded p-2" placeholder="Stream" value={newClassDraft.stream} onChange={(e) => setNewClassDraft((prev) => ({ ...prev, stream: e.target.value }))} />
                <input type="number" className="border rounded p-2" placeholder="Capacity" value={newClassDraft.capacity} onChange={(e) => setNewClassDraft((prev) => ({ ...prev, capacity: Number(e.target.value) || 0 }))} />
                <input type="number" className="border rounded p-2" placeholder="Enrolled" value={newClassDraft.enrolled} onChange={(e) => setNewClassDraft((prev) => ({ ...prev, enrolled: Number(e.target.value) || 0 }))} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2">Class</th>
                      <th className="py-2">Stream</th>
                      <th className="py-2">Capacity</th>
                      <th className="py-2">Enrolled</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolSetupState.classConfiguration.map((row, index) => (
                      <tr key={row.className} className="border-b">
                        <td className="py-2 font-medium">{row.className}</td>
                        <td className="py-2">
                          <input className="border rounded p-1 w-24" value={row.stream} onChange={(e) => setSchoolSetupState((prev) => {
                            const next = [...prev.classConfiguration];
                            next[index] = { ...next[index], stream: e.target.value };
                            return { ...prev, classConfiguration: next };
                          })} />
                        </td>
                        <td className="py-2">
                          <input type="number" className="border rounded p-1 w-20" value={row.capacity} onChange={(e) => setSchoolSetupState((prev) => {
                            const next = [...prev.classConfiguration];
                            next[index] = { ...next[index], capacity: Number(e.target.value) || 0 };
                            return { ...prev, classConfiguration: next };
                          })} />
                        </td>
                        <td className="py-2">
                          <input type="number" className="border rounded p-1 w-20" value={row.enrolled} onChange={(e) => setSchoolSetupState((prev) => {
                            const next = [...prev.classConfiguration];
                            next[index] = { ...next[index], enrolled: Number(e.target.value) || 0 };
                            return { ...prev, classConfiguration: next };
                          })} />
                        </td>
                        <td className="py-2"><Button size="sm" variant="destructive" onClick={() => removeClassConfig(row.className)}>Delete</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Subject Offerings & Assessment Rules">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Subjects</p>
                  <div className="flex gap-2 mb-2">
                    <input className="border rounded p-2 flex-1" placeholder="Add subject" value={subjectDraft} onChange={(e) => setSubjectDraft(e.target.value)} />
                    <Button size="sm" onClick={addSubject}><Plus size={14} className="mr-1" />Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schoolSetupState.subjectOfferings.map((subject) => (
                      <div key={subject} className="inline-flex items-center gap-1">
                        <Badge variant="default">{subject}</Badge>
                        <Button size="sm" variant="destructive" onClick={() => removeSubject(subject)}>X</Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded border p-3 text-sm">
                  <p className="mb-2"><strong>Test Window:</strong></p>
                  <input className="border rounded p-2 w-full mb-2" value={schoolSetupState.assessmentConfig.testWindow} onChange={(e) => setSchoolSetupState((prev) => ({
                    ...prev,
                    assessmentConfig: { ...prev.assessmentConfig, testWindow: e.target.value },
                  }))} />
                  <p className="mb-2"><strong>Exam Window:</strong></p>
                  <input className="border rounded p-2 w-full mb-2" value={schoolSetupState.assessmentConfig.examWindow} onChange={(e) => setSchoolSetupState((prev) => ({
                    ...prev,
                    assessmentConfig: { ...prev.assessmentConfig, examWindow: e.target.value },
                  }))} />
                  <p className="mb-2"><strong>Grading Schema:</strong></p>
                  <input className="border rounded p-2 w-full" value={schoolSetupState.assessmentConfig.gradingSchema} onChange={(e) => setSchoolSetupState((prev) => ({
                    ...prev,
                    assessmentConfig: { ...prev.assessmentConfig, gradingSchema: e.target.value },
                  }))} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========== TAB 7: USER MANAGEMENT (READ-ONLY) ========== */}
      {activeMainTab === 'userManagement' && (
        <Card title="User Management" action={<Button size="sm" onClick={openAddUserModal}><Plus size={14} className="mr-1" />Add User</Button>}>
          {isLoadingUsers ? (
            <div className="mb-4 rounded border border-border p-3 text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : null}
          {userManagementError ? (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {userManagementError}
            </div>
          ) : null}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <select
              className="border rounded p-2 text-sm"
              value={principalUserRoleFilter}
              onChange={(e) => setPrincipalUserRoleFilter(e.target.value as 'all' | StaffRole)}
            >
              <option value="all">All Roles</option>
              <option value="admin">admin</option>
              <option value="principal">principal</option>
              <option value="secretary">secretary</option>
              <option value="teacher">teacher</option>
              <option value="helper">helper</option>
              <option value="bursar">bursar</option>
              <option value="accountant">accountant</option>
            </select>
            <select
              className="border rounded p-2 text-sm"
              value={principalUserStatusFilter}
              onChange={(e) => setPrincipalUserStatusFilter(e.target.value as 'all' | StaffStatus)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Levels</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrincipalUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-2 font-medium">{`${user.firstName} ${user.lastName}`.trim()}</td>
                    <td className="py-2">{user.email}</td>
                    <td className="py-2">{user.phoneNumber || '-'}</td>
                    <td className="py-2"><Badge variant="default">{user.role}</Badge></td>
                    <td className="py-2">
                      {(
                        (user.levels && user.levels.length
                          ? user.levels.map((level) => level.name)
                          : (user.levelIds || []).map((id) => availableLevels.find((level) => level.id === id)?.name || id)
                        ).join(', ')
                      ) || '-'}
                    </td>
                    <td className="py-2">
                      <select
                        className="border rounded p-1 text-xs"
                        value={user.status}
                        onChange={(e) => handleUserStatusChange(user.id, e.target.value as StaffStatus)}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="suspended">suspended</option>
                        <option value="deleted">deleted</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditUserModal(user)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========== TAB 8: AUDIT LOGS (READ-ONLY) ========== */}
      {activeMainTab === 'auditLogs' && (
        <Card title="Audit Logs & Security Registry" action={<Button size="sm" variant="outline" onClick={handleExportLogs}><Download size={14} className="mr-1" />Export CSV</Button>}>
          <div className="mb-3 p-3 border border-amber-200 bg-amber-50 rounded text-sm">
            Immutable View: Audit logs are read-only and cannot be edited or deleted.
          </div>
          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-accent/30 text-left">
                  <th className="py-2 px-2">Timestamp</th>
                  <th className="py-2 px-2">User</th>
                  <th className="py-2 px-2">Role</th>
                  <th className="py-2 px-2">Module</th>
                  <th className="py-2 px-2">Action</th>
                  <th className="py-2 px-2">Details</th>
                  <th className="py-2 px-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {allAuditLogs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2 px-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-2">{log.userName}</td>
                    <td className="py-2 px-2">{log.userRole}</td>
                    <td className="py-2 px-2">{log.module}</td>
                    <td className="py-2 px-2 font-medium">{log.action}</td>
                    <td className="py-2 px-2 text-muted-foreground">{log.details}</td>
                    <td className="py-2 px-2">
                      <Badge variant={log.riskLevel === 'high' ? 'rejected' : log.riskLevel === 'medium' ? 'pending' : 'default'}>{log.riskLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========== TAB 9: DATA CHECKS (READ-ONLY) ========== */}
      {activeMainTab === 'dataChecks' && (
        <div className="space-y-4">
          <Card title="Data Integrity Checks" action={<Button size="sm" onClick={openAddDataCheckModal}><Plus size={14} className="mr-1" />Add Manual Check</Button>}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Severity:</span>
              <select
                className="border rounded p-2 text-sm"
                value={principalDataCheckSeverity}
                onChange={(e) => setPrincipalDataCheckSeverity(e.target.value as 'all' | PrincipalDataCheck['severity'])}
              >
                <option value="all">All</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Severity</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Class</th>
                    <th className="py-2">Owner</th>
                    <th className="py-2">Issue</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Detected</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrincipalDataChecks.map((check) => (
                    <tr key={check.id} className="border-b">
                      <td className="py-2">
                        <Badge variant={getDataCheckSeverityBadgeVariant(check.severity)}>{check.severity}</Badge>
                      </td>
                      <td className="py-2">{check.category}</td>
                      <td className="py-2">{check.className}</td>
                      <td className="py-2">{check.owner}</td>
                      <td className="py-2 text-muted-foreground">{check.issue}</td>
                      <td className="py-2">
                        <Badge variant={check.status === 'resolved' ? 'approved' : 'pending'}>{check.status}</Badge>
                      </td>
                      <td className="py-2">{new Date(check.detectedAt).toLocaleString()}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => resolveDataCheck(check.id)}>{check.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}</Button>
                          <Button size="sm" variant="outline" onClick={() => openEditDataCheckModal(check)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteDataCheck(check.id)}>Delete</Button>
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
      {/* Review Modal for Block 3 */}
      {selectedApprovalItem && (
        <Modal isOpen onClose={()=>{setSelectedApprovalItem(null); setRejectReason('');}} title={`Review ${approvalTab === 'syllabus' ? 'Syllabus' : 'Lesson Note'}`} footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setSelectedApprovalItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectItem}><XCircle size={16} className="mr-1"/>Reject</Button>
            <Button variant="primary" onClick={handleApproveItem}><CheckCircle size={16} className="mr-1"/>Approve</Button>
          </div>
        }>
          <div className="space-y-3">
            <div><p className="font-medium">Teacher</p><p>{selectedApprovalItem.teacher}</p></div>
            <div><p className="font-medium">Class / Subject</p><p>{selectedApprovalItem.class} - {selectedApprovalItem.subject}</p></div>
            <div><p className="font-medium">Title</p><p>{selectedApprovalItem.title}</p></div>
            <div><p className="font-medium">Content</p><div className="p-3 bg-muted rounded whitespace-pre-wrap">{selectedApprovalItem.content}</div></div>
            <div><p className="font-medium">Submission History</p><ul className="text-sm list-disc pl-5">{selectedApprovalItem.statusHistory.map((h,i)=><li key={i}>{h.status} on {formatDate(h.at)}{h.reason && ` – Reason: ${h.reason}`}</li>)}</ul></div>
            <div><label className="font-medium">Rejection reason (required if rejecting)</label><textarea className="w-full border rounded p-2" rows={3} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Provide feedback to teacher..." /></div>
          </div>
        </Modal>
      )}
      
      {/* Class Approval Drill‑down Modal (Block 8) */}
      {selectedClassApproval && (
        <Modal isOpen onClose={()=>{setSelectedClassApproval(null); setChangeRequestReason('');}} title={`Review Results – ${selectedClassApproval.className}`} footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setSelectedClassApproval(null)}>Cancel</Button>
            <Button variant="destructive" onClick={()=>handleClassApproval(selectedClassApproval, 'requestChanges')}>Request Changes</Button>
            <Button variant="primary" onClick={()=>handleClassApproval(selectedClassApproval, 'approve')}>Approve Class Results</Button>
          </div>
        }>
          <div className="space-y-3">
            <p><strong>Teacher:</strong> {selectedClassApproval.teacher}</p>
            <p><strong>Assessment Completion:</strong> {selectedClassApproval.assessmentCompletion}%</p>
            <p><strong>Status:</strong> {selectedClassApproval.status}</p>
            {selectedClassApproval.status === 'changes_requested' && <p className="text-red-600"><strong>Reason for changes:</strong> {selectedClassApproval.reason}</p>}
            <div className="border rounded p-3">
              <p className="font-medium mb-2">Per‑Student Grade Summary (mock)</p>
              <table className="w-full text-sm"><thead><tr><th>Student</th><th>Math</th><th>Science</th><th>English</th><th>Comments</th></tr></thead><tbody><tr><td>Sarah Johnson</td><td>85</td><td>92</td><td>78</td><td>Good progress</td></tr><tr><td>Michael Brown</td><td>72</td><td>68</td><td>81</td><td>Needs improvement in Science</td></tr></tbody></table>
            </div>
            {selectedClassApproval.status !== 'approved' && (
              <div><label className="font-medium">Reason for requesting changes (if applicable)</label><textarea className="w-full border rounded p-2" rows={2} value={changeRequestReason} onChange={e=>setChangeRequestReason(e.target.value)} placeholder="e.g., Missing assessments for two students" /></div>
            )}
          </div>
        </Modal>
      )}
      
      {/* Fee class detail modal (simplified) */}
      {selectedFinanceClass && (
        <Modal isOpen onClose={()=>setSelectedFinanceClass(null)} title={`Fee Details – ${selectedFinanceClass}`} footer={<Button onClick={()=>setSelectedFinanceClass(null)}>Close</Button>}>
          <p>Per‑student breakdown would appear here (mock data).</p>
        </Modal>
      )}

      {selectedFeeItemDetail && (
        <Modal
          isOpen
          onClose={() => setSelectedFeeItemDetailId(null)}
          title={`Fee Item Details – ${selectedFeeItemDetail.name}`}
          footer={<Button onClick={() => setSelectedFeeItemDetailId(null)}>Close</Button>}
        >
          <div className="space-y-2 text-sm">
            <p><strong>Category:</strong> {selectedFeeItemDetail.category}</p>
            <p><strong>Amount:</strong> {formatCurrency(selectedFeeItemDetail.amount)}</p>
            <p><strong>Scope:</strong> {selectedFeeItemDetail.term} • {selectedFeeItemDetail.armId || selectedFeeItemDetail.classId ? `Arm ${selectedFeeItemDetail.armId || selectedFeeItemDetail.classId}` : 'All Arms'}</p>
            <p><strong>Due Date:</strong> {selectedFeeItemDetail.dueDate}</p>
            <p><strong>Status:</strong> {selectedFeeItemDetail.status}</p>
            <p><strong>Submitted At:</strong> {selectedFeeItemDetail.submittedAt ? new Date(selectedFeeItemDetail.submittedAt).toLocaleString() : '-'}</p>
            <p><strong>Approved At:</strong> {selectedFeeItemDetail.approvedAt ? new Date(selectedFeeItemDetail.approvedAt).toLocaleString() : '-'}</p>
            <p><strong>Rejection Reason:</strong> {selectedFeeItemDetail.rejectionReason || '-'}</p>
          </div>
        </Modal>
      )}

      {isUserModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsUserModalOpen(false)}
          title={editingUserId ? 'Edit User' : 'Add User'}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
              <Button onClick={saveUser} disabled={isSavingUser}>{editingUserId ? 'Save Changes' : 'Create User'}</Button>
            </div>
          }
        >
          <div className="space-y-3">
            {userManagementError ? <p className="text-sm text-red-600">{userManagementError}</p> : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">First Name</label>
                <input className="w-full border rounded p-2" value={userForm.firstName} onChange={(e) => setUserForm((prev) => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Last Name</label>
                <input className="w-full border rounded p-2" value={userForm.lastName} onChange={(e) => setUserForm((prev) => ({ ...prev, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input className="w-full border rounded p-2" value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Phone Number (optional)</label>
              <input className="w-full border rounded p-2" value={userForm.phoneNumber} onChange={(e) => setUserForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Role</label>
                <select
                  className="w-full border rounded p-2"
                  value={userForm.role}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value as StaffRole }))}
                  disabled={Boolean(editingUserId)}
                >
                  <option value="admin">admin</option>
                  <option value="principal">principal</option>
                  <option value="secretary">secretary</option>
                  <option value="teacher">teacher</option>
                  <option value="helper">helper</option>
                  <option value="bursar">bursar</option>
                  <option value="accountant">accountant</option>
                </select>
                {editingUserId ? <p className="text-xs text-muted-foreground mt-1">Role update is handled by a dedicated endpoint.</p> : null}
              </div>
              <div>
                <label className="text-sm">Levels</label>
                <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                  {availableLevels.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No levels available.</p>
                  ) : (
                    availableLevels.map((level) => (
                      <label key={level.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={userForm.levelIds.includes(level.id)}
                          onChange={(e) => {
                            setUserForm((prev) => ({
                              ...prev,
                              levelIds: e.target.checked
                                ? [...prev.levelIds, level.id]
                                : prev.levelIds.filter((id) => id !== level.id),
                            }));
                          }}
                        />
                        {level.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isDataCheckModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsDataCheckModalOpen(false)}
          title={editingDataCheckId ? 'Edit Data Check' : 'Add Manual Data Check'}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDataCheckModalOpen(false)}>Cancel</Button>
              <Button onClick={saveDataCheck}>{editingDataCheckId ? 'Save Changes' : 'Add Check'}</Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Severity</label>
                <select className="w-full border rounded p-2" value={dataCheckForm.severity} onChange={(e) => setDataCheckForm((prev) => ({ ...prev, severity: e.target.value as PrincipalDataCheck['severity'] }))}>
                  <option value="warning">warning</option>
                  <option value="critical">critical</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Category</label>
                <select className="w-full border rounded p-2" value={dataCheckForm.category} onChange={(e) => setDataCheckForm((prev) => ({ ...prev, category: e.target.value as PrincipalDataCheck['category'] }))}>
                  <option value="Missing Scores">Missing Scores</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Fees">Fees</option>
                  <option value="Assessments">Assessments</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Class</label>
                <input className="w-full border rounded p-2" value={dataCheckForm.className} onChange={(e) => setDataCheckForm((prev) => ({ ...prev, className: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Owner</label>
                <input className="w-full border rounded p-2" value={dataCheckForm.owner} onChange={(e) => setDataCheckForm((prev) => ({ ...prev, owner: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm">Issue</label>
              <textarea className="w-full border rounded p-2" rows={3} value={dataCheckForm.issue} onChange={(e) => setDataCheckForm((prev) => ({ ...prev, issue: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
