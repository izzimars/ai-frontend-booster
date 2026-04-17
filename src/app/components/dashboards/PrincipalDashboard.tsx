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
  Trophy, ClipboardCheck, CheckCircle2, UserCheck, UserX, BookOpen, Edit, RefreshCw,
  ChevronRight, ChevronDown, Flag, LogOut, School, TabletSmartphone
} from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { ClassSubjectAnalytics } from '../ClassSubjectAnalytics';
import {
  approveFeeItem,
  type FeeItemCatalog,
  loadFeeCatalog,
  rejectFeeItem,
  subscribeFeeCatalogUpdates,
} from '../../state/feeCatalogStore';

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

// ========== MOCK DATA (extended) ==========
const pendingSyllabus: SyllabusItem[] = [
  { id: 1, teacher: 'Mrs. Johnson', class: 'Math 10A', subject: 'Mathematics', week: 3, title: 'Quadratic Functions', submittedDate: '2026-04-05', status: 'submitted', content: 'Outline: quadratic equations, factoring, quadratic formula. Objectives: Solve quadratics. Resources: textbook chapter 4.', statusHistory: [{ status: 'submitted', at: '2026-04-05' }] },
  { id: 2, teacher: 'Mr. Thompson', class: 'Science 9B', subject: 'Biology', week: 2, title: 'Cell Biology', submittedDate: '2026-04-06', status: 'submitted', content: 'Cell structure, organelles, cell theory.', statusHistory: [{ status: 'submitted', at: '2026-04-06' }] },
];
const pendingLessonNotes: LessonNoteItem[] = [
  { id: 1, teacher: 'Mrs. Davis', class: 'English 11A', subject: 'English', title: 'Shakespeare Analysis', submittedDate: '2026-04-05', status: 'submitted', type: 'AI Generated', content: 'Lesson content: Hamlet soliloquy. Activities: group discussion. Assessment: short essay.', statusHistory: [{ status: 'submitted', at: '2026-04-05' }] },
];

const attendanceTrend = [
  { week: 'Week 1', present: 92, absent: 5, late: 3 },
  { week: 'Week 2', present: 88, absent: 7, late: 5 },
  { week: 'Week 3', present: 94, absent: 3, late: 3 },
];
const medicationExceptions = [
  { student: 'Sarah Johnson', class: 'Grade 5A', medication: 'Ibuprofen', timeDue: '08:00', status: 'missed', reason: 'Parent pickup' },
  { student: 'Michael Brown', class: 'Grade 5A', medication: 'Vitamin D', timeDue: '09:00', status: 'missed', reason: 'Absent' },
];
const transportDistribution = [
  { mode: 'Self Pickup', count: 120 },
  { mode: 'Parent Pickup', count: 200 },
  { mode: 'School Bus', count: 98 },
  { mode: 'Authorized Person', count: 40 },
];
const classPerformance = [
  { class: 'Math 10A', average: 78, passRate: 85, attendanceRate: 92, rank: 3 },
  { class: 'Science 9B', average: 82, passRate: 90, attendanceRate: 88, rank: 1 },
  { class: 'English 11A', average: 75, passRate: 80, attendanceRate: 85, rank: 5 },
  { class: 'History 10B', average: 80, passRate: 87, attendanceRate: 90, rank: 2 },
];
const subjectAverages = [
  { subject: 'Math', average: 75, passRate: 82, assessments: 4 },
  { subject: 'Science', average: 78, passRate: 88, assessments: 3 },
  { subject: 'English', average: 72, passRate: 75, assessments: 5 },
  { subject: 'History', average: 76, passRate: 80, assessments: 2 },
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

const mockDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const gradeBuckets = ['A', 'B', 'C', 'D', 'F'] as const;

const getClassSeed = (className: string) =>
  className.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

const buildMockSubjectListForClass = async (className: string) => {
  await mockDelay(160);
  const seed = getClassSeed(className);
  const allSubjects = subjectAverages.map((subject) => subject.subject);
  const shift = seed % allSubjects.length;
  return allSubjects.slice(shift).concat(allSubjects.slice(0, shift));
};

const buildMockSubjectPerformanceForClass = async (className: string) => {
  await mockDelay(200);
  const seed = getClassSeed(className);
  return subjectAverages.map((item, index) => {
    const offset = ((seed + index * 3) % 7) - 3;
    const average = Math.max(40, Math.min(98, item.average + offset));
    const passRate = Math.max(50, Math.min(99, item.passRate + offset));
    return {
      subject: item.subject,
      average,
      passRate,
    };
  });
};

const buildMockGradeDistribution = async (className: string) => {
  await mockDelay(150);
  const seed = getClassSeed(className);
  return gradeBuckets.map((grade, index) => ({
    grade,
    count: Math.max(2, ((seed + (index + 2) * 11) % 15) + (index === 2 ? 6 : 0)),
  }));
};

const buildMockAtRiskStudents = async (className: string, subjectId: string | null = null) => {
  await mockDelay(170);
  const classSeed = getClassSeed(className);
  const subjectSeed = subjectId
    ? subjectId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    : 0;

  const base = [
    { id: `${className}-sarah`, name: 'Sarah Johnson', baseline: 38 },
    { id: `${className}-michael`, name: 'Michael Brown', baseline: 35 },
    { id: `${className}-amad`, name: 'Amad Bello', baseline: 41 },
    { id: `${className}-chisom`, name: 'Chisom Okoye', baseline: 37 },
  ];

  return base
    .map((student, index) => {
      const adjustment = ((classSeed + subjectSeed + index * 5) % 7) - 3;
      const cumulativeAverage = Math.max(0, Math.min(100, student.baseline + adjustment));
      return {
        id: student.id,
        name: student.name,
        cumulativeAverage,
      };
    })
    .filter((student) => student.cumulativeAverage < 40);
};

const buildMockSubjectKpis = async (subjectId: string, subjectList: PrincipalSubjectPerformance[]) => {
  await mockDelay(180);
  const selected = subjectList.find((entry) => entry.subject === subjectId);
  const average = selected?.average ?? 0;
  const spread = 9;
  return {
    subjectAverage: average,
    highestScore: Math.min(100, average + spread),
    lowestScore: Math.max(0, average - spread),
    teacherComplianceRate: Math.max(0, Math.min(100, average + 8)),
  };
};

const buildMockSubjectTrend = async (subjectId: string, average: number) => {
  await mockDelay(140);
  const seed = subjectId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const offsets = [-4, 1, 3];

  return offsets.map((offset, index) => {
    const adjustedAverage = Math.max(0, Math.min(100, average + offset + ((seed + index) % 3)));
    return {
      termLabel: `Term ${index + 1}`,
      average: adjustedAverage,
      passRate: Math.max(0, Math.min(100, adjustedAverage + 6)),
    };
  });
};

const buildMockDeepDiveTrend = async (subjectId: string, average: number) => {
  await mockDelay(140);
  const seed = subjectId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: 6 }).map((_, index) => ({
    week: `W${index + 1}`,
    average: Math.max(0, Math.min(100, average + ((seed + index * 3) % 6) - 3)),
  }));
};

// ========== HELPER FUNCTIONS ==========
const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
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
  const [activeMainTab, setActiveMainTab] = useState<'fee' | 'kpi' | 'approvals' | 'resultApproval' | 'parentEngagement'>('fee');
  
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
  const [subjectsForSelectedClass, setSubjectsForSelectedClass] = useState<string[]>([]);
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
  const [selectedFeeTerm, setSelectedFeeTerm] = useState('');
  const [selectedFinanceClass, setSelectedFinanceClass] = useState<string | null>(null);
  const [feeCatalog, setFeeCatalog] = useState<FeeItemCatalog[]>(() => loadFeeCatalog());
  const [selectedFeeItemDetailId, setSelectedFeeItemDetailId] = useState<number | null>(null);
  const [feeFilter, setFeeFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('all');
  
  // Refs for scrolling
  const approvalsSectionRef = useRef<HTMLDivElement | null>(null);
  const attendanceSectionRef = useRef<HTMLDivElement | null>(null);
  const performanceSectionRef = useRef<HTMLDivElement | null>(null);
  
  // Mock fee data (same as before, simplified for brevity)
  const feeClassRows = [
    { className: 'Grade 5A', billed: 150000, paid: 95000, outstanding: 55000, overdueAmount: 20000, collectionRate: 63.3 },
    { className: 'Grade 5B', billed: 140000, paid: 120000, outstanding: 20000, overdueAmount: 0, collectionRate: 85.7 },
  ];

  useEffect(() => {
    const unsubscribe = subscribeFeeCatalogUpdates(() => {
      setFeeCatalog(loadFeeCatalog());
    });

    return unsubscribe;
  }, []);

  const pendingFeeItems = useMemo(
    () => feeCatalog.filter((item) => item.isActive && item.status === 'pending_approval'),
    [feeCatalog],
  );

  const approvedFeeItems = useMemo(
    () => feeCatalog.filter((item) => item.isActive && item.status === 'approved'),
    [feeCatalog],
  );

  const feeExecutiveKpi = useMemo(() => {
    const totalBilled = approvedFeeItems.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = Math.round(totalBilled * 0.741);
    const outstandingBalance = Math.max(0, totalBilled - totalPaid);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 1000) / 10 : 0;
    const overdueTotal = Math.round(outstandingBalance * 0.3);

    return {
      totalBilled,
      totalPaid,
      outstandingBalance,
      collectionRate,
      pendingReceipts: pendingFeeItems.length,
      overdueTotal,
    };
  }, [approvedFeeItems, pendingFeeItems.length]);

  const approvePendingFeeItem = (feeItemId: number) => {
    const next = approveFeeItem(feeItemId);
    setFeeCatalog(next);
  };

  const rejectPendingFeeItem = (feeItemId: number) => {
    const reason = window.prompt('Provide rejection reason:');
    if (reason === null) return;

    const next = rejectFeeItem(feeItemId, reason);
    setFeeCatalog(next);
  };

  const viewFeeItemDetails = (feeItemId: number) => {
    setSelectedFeeItemDetailId(feeItemId);
  };

  const selectedFeeItemDetail = useMemo(
    () => feeCatalog.find((item) => item.id === selectedFeeItemDetailId) || null,
    [feeCatalog, selectedFeeItemDetailId],
  );

  const filteredFeeItems = useMemo(
    () =>
      feeCatalog.filter((item) => {
        if (feeFilter === 'all') return true;
        return item.status === feeFilter;
      }),
    [feeCatalog, feeFilter],
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

  useEffect(() => {
    let isMounted = true;

    const loadPrincipalAnalytics = async () => {
      if (!selectedClassForPrincipal) {
        setSubjectsForSelectedClass([]);
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
        const [subjects, subjectPerformance, gradeDist, classWideAtRisk] = await Promise.all([
          buildMockSubjectListForClass(selectedClassForPrincipal.className),
          buildMockSubjectPerformanceForClass(selectedClassForPrincipal.className),
          buildMockGradeDistribution(selectedClassForPrincipal.className),
          buildMockAtRiskStudents(selectedClassForPrincipal.className),
        ]);

        if (!isMounted) return;

        setSubjectsForSelectedClass(subjects);
        setPrincipalSubjectPerformanceList(subjectPerformance);
        setPrincipalGradeDist(gradeDist);

        if (selectedSubjectForPrincipal) {
          const [subjectKpis, subjectTrend, deepDiveTrend, subjectAtRisk] = await Promise.all([
            buildMockSubjectKpis(selectedSubjectForPrincipal, subjectPerformance),
            buildMockSubjectTrend(
              selectedSubjectForPrincipal,
              subjectPerformance.find((entry) => entry.subject === selectedSubjectForPrincipal)?.average ?? 0,
            ),
            buildMockDeepDiveTrend(
              selectedSubjectForPrincipal,
              subjectPerformance.find((entry) => entry.subject === selectedSubjectForPrincipal)?.average ?? 0,
            ),
            buildMockAtRiskStudents(selectedClassForPrincipal.className, selectedSubjectForPrincipal),
          ]);

          if (!isMounted) return;

          setPrincipalSubjectKpis(subjectKpis);
          setPrincipalSubjectTrend(subjectTrend);
          setPrincipalDeepDiveTrend(deepDiveTrend);
          setPrincipalAtRisk(subjectAtRisk);
        } else {
          setPrincipalSubjectKpis(null);
          setPrincipalSubjectTrend([]);
          setPrincipalDeepDiveTrend([]);
          setPrincipalAtRisk(classWideAtRisk);
        }
      } catch {
        if (!isMounted) return;
        setPrincipalAnalyticsError('Unable to load detailed analytics at the moment.');
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
  }, [selectedClassForPrincipal, selectedSubjectForPrincipal]);
  
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
      <div className="flex flex-wrap border-b border-border gap-1">
        {[
          { id: 'fee', label: 'Fee Oversight' },
          { id: 'kpi', label: 'School KPI' },
          { id: 'approvals', label: 'Approval Workflow' },
          { id: 'resultApproval', label: 'Result Approval' },
          { id: 'parentEngagement', label: 'Parent Engagement' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeMainTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* ========== TAB 1: FEE OVERSIGHT ========== */}
      {activeMainTab === 'fee' && (
        <>
          <Card title="Fee Oversight (Executive View)" action={
            <select value={selectedFeeTerm} onChange={e => setSelectedFeeTerm(e.target.value)} className="border p-1 rounded">
              <option>Term 3, 2026</option><option>Term 2, 2026</option>
            </select>
          }>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="p-3 border rounded"><p className="text-sm">Total Billed</p><p className="text-xl font-bold">{formatCurrency(feeExecutiveKpi.totalBilled)}</p></div>
              <div className="p-3 border rounded bg-green-50"><p className="text-sm">Total Paid</p><p className="text-xl font-bold text-green-700">{formatCurrency(feeExecutiveKpi.totalPaid)}</p></div>
              <div className="p-3 border rounded"><p className="text-sm">Outstanding</p><p className="text-xl font-bold">{formatCurrency(feeExecutiveKpi.outstandingBalance)}</p></div>
              <div className="p-3 border rounded"><p className="text-sm">Collection Rate</p><p className="text-xl font-bold">{feeExecutiveKpi.collectionRate}%</p></div>
            </div>
            <Card title="Class-Level Fee Performance">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th>Class</th><th>Billed</th><th>Paid</th><th>Outstanding</th><th>Collection Rate</th><th>Action</th></tr></thead>
                <tbody>{feeClassRows.map(row => <tr key={row.className} className="border-b"><td>{row.className}</td><td>{formatCurrency(row.billed)}</td><td>{formatCurrency(row.paid)}</td><td>{formatCurrency(row.outstanding)}</td><td>{row.collectionRate}%</td><td><Button size="sm" variant="outline" onClick={() => setSelectedFinanceClass(row.className)}><Eye size={14} /> View</Button></td></tr>)}</tbody>
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
                        <td>{item.term} • {item.classId ? `Class ${item.classId}` : 'All Classes'}</td>
                        <td>{item.dueDate}</td>
                        <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approvePendingFeeItem(item.id)}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectPendingFeeItem(item.id)}>Reject</Button>
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
                      <td>{item.term} • {item.classId ? `Class ${item.classId}` : 'All Classes'}</td>
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
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded p-3"><div className="flex justify-between"><span>Pass Rate</span><Trophy size={16}/></div><p className="text-2xl font-bold">82%</p></div>
            <div className="border rounded p-3"><div className="flex justify-between"><span>Avg Score</span><TrendingUp size={16}/></div><p className="text-2xl font-bold">76.5%</p></div>
            <div className="border rounded p-3"><div className="flex justify-between"><span>Attendance</span><Activity size={16}/></div><p className="text-2xl font-bold">91%</p></div>
            <div className="border rounded p-3"><div className="flex justify-between"><span>Students</span><Users size={16}/></div><p className="text-2xl font-bold">342</p></div>
          </div>
          
          {/* Subject Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Subject Performance">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectAverages}><CartesianGrid /><XAxis dataKey="subject" /><YAxis domain={[0,100]} /><Tooltip formatter={(value, name) => [`${value}%`, name]} /><Bar dataKey="average" fill="#3b82f6" /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Class Performance" action={<Button variant="outline" size="sm" onClick={() => alert('Export CSV')}><Download size={14} /> Export</Button>}>
              <table className="w-full text-sm"><thead><tr><th>Class</th><th>Avg Score</th><th>Pass Rate</th><th>Attendance</th><th>Rank</th></tr></thead><tbody>{classPerformance.map(c => <tr key={c.class}><td>{c.class}</td><td>{c.average}%</td><td>{c.passRate}%</td><td>{c.attendanceRate}%</td><td>{c.rank}</td></tr>)}</tbody></table>
            </Card>
          </div>
          
          {/* Attendance Trend & Medication Exceptions & Transport */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Attendance Trend (Last 30 days)">
              <ResponsiveContainer width="100%" height={200}><LineChart data={attendanceTrend}><CartesianGrid /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line type="monotone" dataKey="present" stroke="#10b981" /></LineChart></ResponsiveContainer>
            </Card>
            <Card title="Medication Exceptions Today">
              {medicationExceptions.map((ex,i) => <div key={i} className="flex items-center gap-2 p-2 border-b"><Heart size={14} className="text-red-500"/><div><p className="text-sm">{ex.student} ({ex.class}) - {ex.medication}</p><p className="text-xs text-muted-foreground">Missed at {ex.timeDue} - {ex.reason}</p></div></div>)}
            </Card>
            <Card title="Transport Distribution">
              <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={transportDistribution} dataKey="count" nameKey="mode" cx="50%" cy="50%" outerRadius={60} label><Cell fill="#3b82f6"/><Cell fill="#10b981"/><Cell fill="#f59e0b"/><Cell fill="#8b5cf6"/></Pie><Tooltip /></PieChart></ResponsiveContainer>
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
                    const classObj = classPerformance.find((c) => c.class === e.target.value);
                    setSelectedClassForPrincipal(classObj ? { id: classObj.class, className: classObj.class } : null);
                    setSelectedSubjectForPrincipal(null);
                  }}
                >
                  <option value="">-- Choose a class --</option>
                  {classPerformance.map((c) => (
                    <option key={c.class} value={c.class}>{c.class}</option>
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
                    <option key={subj} value={subj}>{subj}</option>
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
                selectedSubjectId={selectedSubjectForPrincipal}
                onSelectSubject={setSelectedSubjectForPrincipal}
                subjectKpis={principalSubjectKpis ?? undefined}
                subjectTrendData={principalSubjectTrend}
                classPerformanceData={classPerformance.map((c) => ({
                  className: c.class,
                  averageScore: c.average,
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
            <p><strong>Scope:</strong> {selectedFeeItemDetail.term} • {selectedFeeItemDetail.classId ? `Class ${selectedFeeItemDetail.classId}` : 'All Classes'}</p>
            <p><strong>Due Date:</strong> {selectedFeeItemDetail.dueDate}</p>
            <p><strong>Status:</strong> {selectedFeeItemDetail.status}</p>
            <p><strong>Submitted At:</strong> {selectedFeeItemDetail.submittedAt ? new Date(selectedFeeItemDetail.submittedAt).toLocaleString() : '-'}</p>
            <p><strong>Approved At:</strong> {selectedFeeItemDetail.approvedAt ? new Date(selectedFeeItemDetail.approvedAt).toLocaleString() : '-'}</p>
            <p><strong>Rejection Reason:</strong> {selectedFeeItemDetail.rejectionReason || '-'}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
