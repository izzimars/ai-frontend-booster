import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  BookOpen,
  BriefcaseMedical,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Pill,
  Receipt,
  Upload,
  FileText,
  Minus,
  Phone,
  Bus,
  Car,
  Clock3,
  KeyRound,
  MapPinned,
  ShieldCheck,
  Megaphone,
  Search,
  TrendingUp,
  User,
  Utensils,
  XCircle,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card } from '../Card';
import { FinanceFeeManagementView } from './FinanceFeeManagementView';
import { MedicalProfileEditor } from './MedicalProfileEditor';
import { Modal } from '../Modal';
import { SubjectMasteryView } from './SubjectMasteryView';

type AttendanceStatus = 'Present' | 'Late' | 'Absent';
type ActivityType = 'academic' | 'medical' | 'logistics' | 'communication';
type AlertKind = 'safety' | 'compliance' | 'financial';
type SubscriptionStatus = 'Trial' | 'Active' | 'Expired' | 'Pending Confirmation';
type GuardianTab = 'overview' | 'academic' | 'medical' | 'transport' | 'communications' | 'subscription' | 'finance' | 'attendance';
type TrendDirection = 'up' | 'down' | 'flat';
type BehaviorType = 'Positive' | 'Needs improvement' | 'Neutral';
type AttendanceDayStatus = 'present' | 'absent' | 'late' | 'no_school' | 'no_data';

interface HomeworkTask {
  subject: string;
  title: string;
}

interface DailyPulse {
  attendance: AttendanceStatus;
  behaviorNote: string;
  homeworkDue: HomeworkTask[];
  mealStatus?: string;
}

interface ActivityEvent {
  id: string;
  type: ActivityType;
  summary: string;
  detail: string;
  timestamp: string;
  actor: string;
}

interface AlertItem {
  id: string;
  kind: AlertKind;
  message: string;
  deepLinkTab: GuardianTab;
}

interface StudentRecord {
  id: string;
  name: string;
  grade: string;
  parentAbsenceNote: boolean;
  weeklyAttendanceRate: number;
  outstandingBalance: number;
  subscriptionStatus: SubscriptionStatus;
  dailyPulse: DailyPulse;
  activityFeed: ActivityEvent[];
  sourceSync: {
    teacherDailyLog: string;
    bursarLedger: string;
    assessmentStore: string;
  };
  academicByTerm: AcademicTermRecord[];
}

interface SubjectSummary {
  subject: string;
  teacherName: string;
  averageScore: number;
  highestScore: number;
  classAverage?: number;
  trend: TrendDirection;
  assessments: AssessmentDetail[];
}

interface AssessmentDetail {
  date: string;
  assessmentName: string;
  type: 'Quiz' | 'Test' | 'Exam';
  score: number;
  classAverage?: number;
  teacherComment?: string;
}

interface AcademicTrendPoint {
  label: string;
  date: string;
  averageScore: number;
  subject: string;
}

interface AcademicTermRecord {
  termLabel: string;
  isCurrent: boolean;
  totalAssessmentsTaken: number;
  termAverageScore: number;
  classRank?: {
    rank: number;
    totalStudents: number;
  };
  proprietorApproved: boolean;
  resultGatePolicy: 'full_access' | 'partial' | 'blocked';
  subjectSummaries: SubjectSummary[];
  globalTrend: AcademicTrendPoint[];
}

interface AttendanceDayLog {
  date: string;
  status: AttendanceDayStatus;
  arrivalTime?: string;
  departureTime?: string;
  teacherNote?: string;
}

interface AttendanceWeeklyTrendPoint {
  weekLabel: string;
  rate: number;
  present: number;
  absent: number;
  late: number;
}

interface BehaviorLogEntry {
  id: string;
  date: string;
  type: BehaviorType;
  teacherName: string;
  comment: string;
  visibility: 'parent' | 'private';
  insightTag: string;
}

interface AttendanceBehaviorTermData {
  termLabel: string;
  totalSchoolDays: number;
  attendanceDays: AttendanceDayLog[];
  weeklyTrend: AttendanceWeeklyTrendPoint[];
  behaviorEvents: BehaviorLogEntry[];
}

interface MedicalAllergy {
  allergen: string;
  severity: 'Severe' | 'Moderate' | 'Mild';
}

interface ChronicConditionRecord {
  condition: string;
  managementNote: string;
}

interface MedicationScheduleRow {
  id: string;
  medication: string;
  dosage: string;
  scheduledTime: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  specialInstructions?: string;
}

interface MedicalHistoryEntry {
  id: string;
  timestamp: string;
  medication: string;
  dosage: string;
  administeredBy: string;
  administrationNote?: string;
}

interface YesterdayMedicationRecord {
  id: string;
  medication: string;
  dosage: string;
  scheduledTime: string;
  wasGiven: boolean;
}

interface MedicalPortalData {
  bloodType: string;
  genotype: string;
  allergies: MedicalAllergy[];
  chronicConditions: ChronicConditionRecord[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  parentCanEditProfile: boolean;
  todaySchedule: MedicationScheduleRow[];
  history: MedicalHistoryEntry[];
  yesterdaySchedule: YesterdayMedicationRecord[];
  teacherMedicalLogSyncAt: string;
}

type DepartureStatus = 'waiting' | 'picked_up' | 'in_transit';
type TransportMode = 'School Bus' | 'Parent Pickup' | 'Walk Home' | 'Private Driver';

interface AuthorizedCollector {
  id: string;
  name: string;
  relation: string;
}

interface DepartureRecord {
  id: string;
  dateTime: string;
  method: string;
  authorizedBy: string;
  collector: string;
}

interface TransportPortalData {
  status: DepartureStatus;
  pickedUpAt?: string;
  pickedUpBy?: string;
  authorizedCollectorsToday: AuthorizedCollector[];
  defaultMode: TransportMode;
  busDetails?: {
    routeId: string;
    eta: string;
  };
  departureHistory: DepartureRecord[];
}

type SenderRole = 'Proprietor' | 'Admin' | 'Class Teacher' | 'Bursar';

interface CommunicationMessage {
  id: string;
  targetType: 'all' | 'student';
  targetId?: string;
  senderName: string;
  senderRole: SenderRole;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'normal';
  repliesEnabled: boolean;
}

interface SchoolAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  priority: 'high' | 'normal';
  whatsappUrl?: string;
}

interface SchoolReply {
  id: string;
  messageId: string;
  studentId: string;
  parentName: string;
  replyText: string;
  createdAt: string;
}

interface NotificationMatrixRow {
  email: boolean;
  sms: boolean;
  inAppPush: boolean;
}

interface GuardianNotificationPreferences {
  highPriorityAlerts: NotificationMatrixRow;
  attendanceAlerts: NotificationMatrixRow;
  paymentReminders: NotificationMatrixRow;
  medicationHealth: NotificationMatrixRow;
}

type PaymentStatus = 'paid' | 'pending_confirmation' | 'failed';

interface UploadedReceipt {
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface PaymentHistoryEntry {
  id: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  senderName?: string;
  receipt?: UploadedReceipt;
}

interface GuardianSubscriptionProfile {
  status: SubscriptionStatus;
  trialEndsAt?: string;
  activeUntil?: string;
  autoRenewalEnabled: boolean;
  paymentHistory: PaymentHistoryEntry[];
}

const MOCK_ATTENDANCE_BEHAVIOR: Record<string, AttendanceBehaviorTermData[]> = {
  'stu-israel': [
    {
      termLabel: 'Term 2, 2026',
      totalSchoolDays: 30,
      attendanceDays: [
        { date: '2026-03-31', status: 'present', arrivalTime: '07:58', departureTime: '15:24' },
        { date: '2026-04-01', status: 'late', arrivalTime: '08:26', departureTime: '15:26', teacherNote: 'Traffic delay shared by parent.' },
        { date: '2026-04-02', status: 'present', arrivalTime: '07:55', departureTime: '15:31' },
        { date: '2026-04-03', status: 'absent', teacherNote: 'No call from home before noon.' },
        { date: '2026-04-04', status: 'no_school' },
        { date: '2026-04-05', status: 'no_school' },
        { date: '2026-04-06', status: 'present', arrivalTime: '08:00', departureTime: '15:20' },
        { date: '2026-04-07', status: 'present', arrivalTime: '07:59', departureTime: '15:28' },
        { date: '2026-04-08', status: 'late', arrivalTime: '08:18', departureTime: '15:30', teacherNote: 'Late due to clinic visit.' },
        { date: '2026-04-09', status: 'present', arrivalTime: '07:57', departureTime: '15:29' },
        { date: '2026-04-10', status: 'absent', teacherNote: 'Marked absent at first period.' },
      ],
      weeklyTrend: [
        { weekLabel: 'Week 1', rate: 80, present: 4, absent: 1, late: 0 },
        { weekLabel: 'Week 2', rate: 60, present: 3, absent: 1, late: 1 },
        { weekLabel: 'Week 3', rate: 75, present: 3, absent: 1, late: 1 },
      ],
      behaviorEvents: [
        {
          id: 'beh-isr-1',
          date: '2026-04-02',
          type: 'Positive',
          teacherName: 'Mrs. Adeyemi',
          comment: 'Helped classmates set up science materials.',
          visibility: 'parent',
          insightTag: 'Helped classmates',
        },
        {
          id: 'beh-isr-2',
          date: '2026-04-03',
          type: 'Needs improvement',
          teacherName: 'Mr. Bello',
          comment: 'Late submission of homework in English.',
          visibility: 'parent',
          insightTag: 'Late submission of homework',
        },
        {
          id: 'beh-isr-3',
          date: '2026-04-08',
          type: 'Neutral',
          teacherName: 'Ms. Danjuma',
          comment: 'Needed reminders to stay focused during lab cleanup.',
          visibility: 'parent',
          insightTag: 'Needs focus reminders',
        },
        {
          id: 'beh-isr-4',
          date: '2026-04-09',
          type: 'Needs improvement',
          teacherName: 'Mrs. Adeyemi',
          comment: 'Private note: ongoing peer conflict mediation.',
          visibility: 'private',
          insightTag: 'Peer conflict',
        },
      ],
    },
    {
      termLabel: 'Term 1, 2026',
      totalSchoolDays: 28,
      attendanceDays: [
        { date: '2026-01-20', status: 'present', arrivalTime: '07:56', departureTime: '15:20' },
        { date: '2026-01-21', status: 'present', arrivalTime: '07:54', departureTime: '15:22' },
        { date: '2026-01-22', status: 'absent', teacherNote: 'Parent reported mild fever.' },
      ],
      weeklyTrend: [
        { weekLabel: 'Week 1', rate: 66, present: 2, absent: 1, late: 0 },
        { weekLabel: 'Week 2', rate: 83, present: 5, absent: 0, late: 1 },
      ],
      behaviorEvents: [
        {
          id: 'beh-isr-t1-1',
          date: '2026-01-26',
          type: 'Positive',
          teacherName: 'Mr. Bello',
          comment: 'Volunteered to read aloud for the class.',
          visibility: 'parent',
          insightTag: 'Class participation',
        },
      ],
    },
  ],
  'stu-demola': [
    {
      termLabel: 'Term 2, 2026',
      totalSchoolDays: 30,
      attendanceDays: [
        { date: '2026-03-31', status: 'present', arrivalTime: '07:50', departureTime: '15:35' },
        { date: '2026-04-01', status: 'present', arrivalTime: '07:52', departureTime: '15:33' },
        { date: '2026-04-02', status: 'present', arrivalTime: '07:55', departureTime: '15:38' },
        { date: '2026-04-03', status: 'present', arrivalTime: '07:51', departureTime: '15:36' },
        { date: '2026-04-04', status: 'no_school' },
        { date: '2026-04-05', status: 'no_school' },
        { date: '2026-04-06', status: 'present', arrivalTime: '07:49', departureTime: '15:32' },
        { date: '2026-04-07', status: 'present', arrivalTime: '07:50', departureTime: '15:31' },
        { date: '2026-04-08', status: 'present', arrivalTime: '07:52', departureTime: '15:35' },
        { date: '2026-04-09', status: 'present', arrivalTime: '07:53', departureTime: '15:34' },
        { date: '2026-04-10', status: 'present', arrivalTime: '07:50', departureTime: '15:33' },
      ],
      weeklyTrend: [
        { weekLabel: 'Week 1', rate: 100, present: 5, absent: 0, late: 0 },
        { weekLabel: 'Week 2', rate: 100, present: 5, absent: 0, late: 0 },
        { weekLabel: 'Week 3', rate: 100, present: 5, absent: 0, late: 0 },
      ],
      behaviorEvents: [
        {
          id: 'beh-dem-1',
          date: '2026-04-03',
          type: 'Positive',
          teacherName: 'Mr. Okonkwo',
          comment: 'Supported peers during practical class setup.',
          visibility: 'parent',
          insightTag: 'Helped classmates',
        },
        {
          id: 'beh-dem-2',
          date: '2026-04-07',
          type: 'Neutral',
          teacherName: 'Mr. Okonkwo',
          comment: 'Quiet in group discussion but attentive.',
          visibility: 'parent',
          insightTag: 'Quiet participation',
        },
      ],
    },
    {
      termLabel: 'Term 1, 2026',
      totalSchoolDays: 28,
      attendanceDays: [
        { date: '2026-01-22', status: 'present', arrivalTime: '07:54', departureTime: '15:30' },
        { date: '2026-01-23', status: 'late', arrivalTime: '08:10', departureTime: '15:28', teacherNote: 'Heavy rain and traffic.' },
      ],
      weeklyTrend: [
        { weekLabel: 'Week 1', rate: 90, present: 4, absent: 0, late: 1 },
        { weekLabel: 'Week 2', rate: 95, present: 5, absent: 0, late: 0 },
      ],
      behaviorEvents: [
        {
          id: 'beh-dem-t1-1',
          date: '2026-01-24',
          type: 'Needs improvement',
          teacherName: 'Mr. Okonkwo',
          comment: 'Late submission of homework.',
          visibility: 'parent',
          insightTag: 'Late submission of homework',
        },
      ],
    },
  ],
};

const ATTENDANCE_FIXED_NOW = new Date('2026-04-10T12:00:00Z');

const MOCK_MEDICAL_PORTAL: Record<string, MedicalPortalData> = {
  'stu-israel': {
    bloodType: 'O+',
    genotype: 'AS',
    allergies: [
      { allergen: 'Peanuts', severity: 'Severe' },
      { allergen: 'Dust', severity: 'Mild' },
    ],
    chronicConditions: [
      { condition: 'Asthma', managementNote: 'Keep inhaler in bag; avoid strenuous exercise in afternoon heat.' },
      { condition: 'Sickle Cell Trait', managementNote: 'Hydrate often; report unusual fatigue immediately.' },
    ],
    emergencyContact: {
      name: 'Mrs. Ojo',
      relationship: 'Mother',
      phone: '+234 803 000 1021',
    },
    parentCanEditProfile: false,
    todaySchedule: [
      { id: 'm1', medication: 'Ventolin Inhaler', dosage: '2 puffs', scheduledTime: '10:00' },
      { id: 'm2', medication: 'Folic Acid', dosage: '1 tablet', scheduledTime: '14:00' },
      { id: 'm3', medication: 'Paracetamol', dosage: '500mg', scheduledTime: '09:00' },
    ],
    history: [
      {
        id: 'h1',
        timestamp: '2026-04-10T10:03:00Z',
        medication: 'Ventolin Inhaler',
        dosage: '2 puffs',
        administeredBy: 'Nurse Williams',
        administrationNote: 'Child reported mild wheeze before PE. Symptoms settled after dose.',
      },
      {
        id: 'h2',
        timestamp: '2026-04-09T14:08:00Z',
        medication: 'Folic Acid',
        dosage: '1 tablet',
        administeredBy: 'Mrs. Adeyemi',
      },
      {
        id: 'h3',
        timestamp: '2026-04-09T09:05:00Z',
        medication: 'Paracetamol',
        dosage: '500mg',
        administeredBy: 'Nurse Williams',
        administrationNote: 'Dose deferred by 20 minutes because child was sleeping in sick bay.',
      },
    ],
    yesterdaySchedule: [
      { id: 'y1', medication: 'Ventolin Inhaler', dosage: '2 puffs', scheduledTime: '10:00', wasGiven: true },
      { id: 'y2', medication: 'Folic Acid', dosage: '1 tablet', scheduledTime: '14:00', wasGiven: false },
    ],
    teacherMedicalLogSyncAt: '2026-04-10T10:04:00Z',
  },
  'stu-demola': {
    bloodType: 'A+',
    genotype: 'AA',
    allergies: [{ allergen: 'None reported', severity: 'Mild' }],
    chronicConditions: [{ condition: 'None', managementNote: 'No chronic condition on file.' }],
    emergencyContact: {
      name: 'Mr. Ojo',
      relationship: 'Father',
      phone: '+234 803 000 2044',
    },
    parentCanEditProfile: true,
    todaySchedule: [{ id: 'm4', medication: 'Multivitamin', dosage: '1 tablet', scheduledTime: '13:30' }],
    history: [
      {
        id: 'h4',
        timestamp: '2026-04-09T13:35:00Z',
        medication: 'Multivitamin',
        dosage: '1 tablet',
        administeredBy: 'Mr. Okonkwo',
      },
    ],
    yesterdaySchedule: [{ id: 'y3', medication: 'Multivitamin', dosage: '1 tablet', scheduledTime: '13:30', wasGiven: true }],
    teacherMedicalLogSyncAt: '2026-04-10T08:12:00Z',
  },
};

const MOCK_TRANSPORT_PORTAL: Record<string, TransportPortalData> = {
  'stu-israel': {
    status: 'waiting',
    authorizedCollectorsToday: [
      { id: 'c1', name: 'Mrs. Ojo', relation: 'Mother' },
      { id: 'c2', name: 'Uncle Jude', relation: 'Uncle' },
    ],
    defaultMode: 'Parent Pickup',
    departureHistory: [
      {
        id: 'd1',
        dateTime: '2026-04-09T15:15:00Z',
        method: 'Private Vehicle',
        authorizedBy: 'Gate Officer Musa',
        collector: 'Uncle Jude',
      },
      {
        id: 'd2',
        dateTime: '2026-04-08T15:25:00Z',
        method: 'School Bus #4',
        authorizedBy: 'Gate Officer Musa',
        collector: 'School Bus Attendant',
      },
    ],
  },
  'stu-demola': {
    status: 'in_transit',
    authorizedCollectorsToday: [{ id: 'c3', name: 'Mr. Ojo', relation: 'Father' }],
    defaultMode: 'School Bus',
    busDetails: {
      routeId: 'Route 12 - Lekki Phase 1',
      eta: 'Estimated arrival at your stop: 4:45 PM.',
    },
    departureHistory: [
      {
        id: 'd3',
        dateTime: '2026-04-09T15:05:00Z',
        method: 'School Bus #4',
        authorizedBy: 'Gate Officer Kunle',
        collector: 'School Bus Attendant',
      },
      {
        id: 'd4',
        dateTime: '2026-04-08T15:08:00Z',
        method: 'School Bus #4',
        authorizedBy: 'Gate Officer Kunle',
        collector: 'School Bus Attendant',
      },
    ],
  },
};

const DEFAULT_COMMUNICATION_MESSAGES: CommunicationMessage[] = [
  {
    id: 'msg-1',
    targetType: 'all',
    senderName: 'Dr. Okafor',
    senderRole: 'Proprietor',
    subject: 'Emergency Closure: Heavy Rainfall Warning',
    content: 'School will close early by 12:30 PM today due to severe weather advisory from local authorities.',
    timestamp: '2026-04-10T07:15:00Z',
    isRead: false,
    priority: 'high',
    repliesEnabled: false,
  },
  {
    id: 'msg-2',
    targetType: 'student',
    targetId: 'stu-israel',
    senderName: 'Mrs. Adeyemi',
    senderRole: 'Class Teacher',
    subject: 'Math Project Reminder',
    content: 'Please remind Israel to bring his math model for presentation on Monday.',
    timestamp: '2026-04-09T15:12:00Z',
    isRead: false,
    priority: 'normal',
    repliesEnabled: true,
  },
  {
    id: 'msg-3',
    targetType: 'student',
    targetId: 'stu-demola',
    senderName: 'Mr. Okonkwo',
    senderRole: 'Class Teacher',
    subject: 'Excellent Lab Conduct',
    content: 'Demola demonstrated excellent safety and leadership in today\'s lab practical.',
    timestamp: '2026-04-08T13:05:00Z',
    isRead: true,
    priority: 'normal',
    repliesEnabled: true,
  },
];

const DEFAULT_ANNOUNCEMENTS: SchoolAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Mid-term Break Dates',
    body: 'Mid-term break runs from April 17 to April 21. Resumption is April 22.',
    createdAt: '2026-04-09T10:00:00Z',
    priority: 'normal',
    whatsappUrl: 'https://wa.me/2348000000000',
  },
  {
    id: 'ann-2',
    title: 'Inter-house Sports Update',
    body: 'Final practice sessions begin next week. House coordinators will send final schedules.',
    createdAt: '2026-04-08T11:20:00Z',
    priority: 'normal',
  },
  {
    id: 'ann-3',
    title: 'Uniform Price Adjustment Notice',
    body: 'Please note revised uniform pricing effective from next term due to supplier changes.',
    createdAt: '2026-04-07T09:30:00Z',
    priority: 'high',
  },
];

const DEFAULT_NOTIFICATION_PREFERENCES: GuardianNotificationPreferences = {
  highPriorityAlerts: { email: true, sms: true, inAppPush: true },
  attendanceAlerts: { email: false, sms: true, inAppPush: true },
  paymentReminders: { email: true, sms: false, inAppPush: true },
  medicationHealth: { email: false, sms: true, inAppPush: true },
};

function readJsonFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function communicationsStoreKey() {
  return 'school_communications';
}

function announcementsStoreKey() {
  return 'school_announcements';
}

function repliesStoreKey() {
  return 'school_replies';
}

function parentProfileStoreKey() {
  return 'parent_profile';
}

function subscriptionsStoreKey() {
  return 'parent_subscriptions';
}

function studentMedicalProfileStoreKey() {
  return 'studentMedicalProfile';
}

function getTodayDateKey() {
  const year = ATTENDANCE_FIXED_NOW.getFullYear();
  const month = `${ATTENDANCE_FIXED_NOW.getMonth() + 1}`.padStart(2, '0');
  const day = `${ATTENDANCE_FIXED_NOW.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeToDate(time: string, dateKey: string) {
  const [hour, minute] = time.split(':').map(Number);
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function generateDailyPickupToken(studentId: string, dateKey: string) {
  const raw = `${studentId}-${dateKey}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) % 1000000;
  }
  const digits = `${Math.abs(hash)}`.padStart(6, '0');
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

function readTransportDepartureLog(studentId: string) {
  const key = `departureLog:${studentId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [] as DepartureRecord[];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as DepartureRecord[];
    }
    return parsed
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry, index) => ({
        id: String(entry.id ?? `local-${index}`),
        dateTime: String(entry.dateTime ?? entry.timestamp ?? ''),
        method: String(entry.method ?? 'Unknown Method'),
        authorizedBy: String(entry.authorizedBy ?? 'Unknown Staff'),
        collector: String(entry.collector ?? 'Unknown Collector'),
      }))
      .filter((entry) => entry.dateTime);
  } catch {
    return [] as DepartureRecord[];
  }
}

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

function getDefaultMonthForAttendance(termData?: AttendanceBehaviorTermData) {
  if (!termData || termData.attendanceDays.length === 0) {
    return formatMonthKey(ATTENDANCE_FIXED_NOW);
  }
  const latest = [...termData.attendanceDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  return formatMonthKey(new Date(`${latest.date}T00:00:00`));
}

function getAttendanceBehaviorTerm(studentId: string, termLabel: string) {
  const terms = MOCK_ATTENDANCE_BEHAVIOR[studentId] ?? [];
  return terms.find((term) => term.termLabel === termLabel) ?? terms[0];
}

function getMostFrequentTag(entries: BehaviorLogEntry[]) {
  if (entries.length === 0) {
    return 'None recorded';
  }
  const counter = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.insightTag] = (acc[entry.insightTag] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counter).sort((a, b) => b[1] - a[1])[0][0];
}

const MOCK_STUDENTS: StudentRecord[] = [
  {
    id: 'stu-israel',
    name: 'Israel Ojo',
    grade: 'Primary 6',
    parentAbsenceNote: false,
    weeklyAttendanceRate: 75,
    outstandingBalance: 15000,
    subscriptionStatus: 'Active',
    dailyPulse: {
      attendance: 'Absent',
      behaviorNote: 'Israel was very helpful during the science experiment today.',
      homeworkDue: [
        { subject: 'Mathematics', title: 'Word Problems Worksheet 4B' },
        { subject: 'English', title: 'Write a short story on teamwork' },
      ],
      mealStatus: 'Medication Administered',
    },
    activityFeed: [
      {
        id: 'act-1',
        type: 'academic',
        summary: 'New Grade: 85% in Math Quiz.',
        detail: 'Math Quiz - Fractions and Ratios. Scored 17/20 with strong showing in ratio word problems.',
        timestamp: '2026-04-10T08:20:00Z',
        actor: 'Mrs. Adeyemi',
      },
      {
        id: 'act-2',
        type: 'medical',
        summary: 'Paracetamol administered for headache at 1:15 PM.',
        detail: 'Dose: 500mg. Student rested for 20 mins and returned to class stable.',
        timestamp: '2026-04-09T12:15:00Z',
        actor: 'Nurse Williams',
      },
      {
        id: 'act-3',
        type: 'logistics',
        summary: 'Checked out of school by Mother at 4:30 PM.',
        detail: 'Pickup verified at gate with approved guardian QR code.',
        timestamp: '2026-04-08T15:30:00Z',
        actor: 'Gate Desk',
      },
      {
        id: 'act-4',
        type: 'communication',
        summary: 'New announcement from the Proprietor.',
        detail: 'PTA meeting moved to Friday, 2:00 PM at the school hall.',
        timestamp: '2026-04-07T09:10:00Z',
        actor: 'Proprietor Office',
      },
    ],
    sourceSync: {
      teacherDailyLog: '2026-04-10T07:55:00Z',
      bursarLedger: '2026-04-10T07:50:00Z',
      assessmentStore: '2026-04-10T07:48:00Z',
    },
    academicByTerm: [
      {
        termLabel: 'Term 2, 2026',
        isCurrent: true,
        totalAssessmentsTaken: 9,
        termAverageScore: 78,
        classRank: { rank: 12, totalStudents: 35 },
        proprietorApproved: true,
        resultGatePolicy: 'full_access',
        subjectSummaries: [
          {
            subject: 'Mathematics',
            teacherName: 'Mrs. Adeyemi',
            averageScore: 81,
            highestScore: 90,
            classAverage: 72,
            trend: 'up',
            assessments: [
              {
                date: '2026-02-16',
                assessmentName: 'Fractions Quiz',
                type: 'Quiz',
                score: 74,
                classAverage: 69,
                teacherComment: 'Good start, revise ratio conversion.',
              },
              {
                date: '2026-03-03',
                assessmentName: 'Algebra Test',
                type: 'Test',
                score: 79,
                classAverage: 71,
                teacherComment: 'Improved confidence in symbolic steps.',
              },
              {
                date: '2026-03-26',
                assessmentName: 'Mid-Term Exam',
                type: 'Exam',
                score: 90,
                classAverage: 76,
                teacherComment: 'Excellent performance.',
              },
            ],
          },
          {
            subject: 'English',
            teacherName: 'Mr. Bello',
            averageScore: 73,
            highestScore: 82,
            classAverage: 74,
            trend: 'flat',
            assessments: [
              {
                date: '2026-02-20',
                assessmentName: 'Reading Quiz',
                type: 'Quiz',
                score: 71,
                classAverage: 72,
                teacherComment: 'Needs stronger inferencing.',
              },
              {
                date: '2026-03-08',
                assessmentName: 'Essay Test',
                type: 'Test',
                score: 82,
                classAverage: 76,
                teacherComment: 'Clear structure and ideas.',
              },
              {
                date: '2026-03-30',
                assessmentName: 'Grammar Exam',
                type: 'Exam',
                score: 66,
                classAverage: 74,
                teacherComment: 'Practice punctuation rules weekly.',
              },
            ],
          },
          {
            subject: 'Science',
            teacherName: 'Ms. Danjuma',
            averageScore: 80,
            highestScore: 88,
            classAverage: 75,
            trend: 'down',
            assessments: [
              {
                date: '2026-02-18',
                assessmentName: 'Matter Quiz',
                type: 'Quiz',
                score: 88,
                classAverage: 78,
                teacherComment: 'Strong concept retention.',
              },
              {
                date: '2026-03-14',
                assessmentName: 'Lab Test',
                type: 'Test',
                score: 84,
                classAverage: 74,
                teacherComment: 'Very practical and accurate.',
              },
              {
                date: '2026-03-28',
                assessmentName: 'Energy Exam',
                type: 'Exam',
                score: 68,
                classAverage: 73,
                teacherComment: 'Revise formulas and units.',
              },
            ],
          },
        ],
        globalTrend: [
          { label: 'Wk 1', date: '2026-02-16', averageScore: 74, subject: 'Mathematics' },
          { label: 'Wk 1', date: '2026-02-18', averageScore: 88, subject: 'Science' },
          { label: 'Wk 1', date: '2026-02-20', averageScore: 71, subject: 'English' },
          { label: 'Wk 3', date: '2026-03-03', averageScore: 79, subject: 'Mathematics' },
          { label: 'Wk 3', date: '2026-03-08', averageScore: 82, subject: 'English' },
          { label: 'Wk 4', date: '2026-03-14', averageScore: 84, subject: 'Science' },
          { label: 'Wk 6', date: '2026-03-26', averageScore: 90, subject: 'Mathematics' },
          { label: 'Wk 6', date: '2026-03-28', averageScore: 68, subject: 'Science' },
          { label: 'Wk 6', date: '2026-03-30', averageScore: 66, subject: 'English' },
        ],
      },
      {
        termLabel: 'Term 1, 2026',
        isCurrent: false,
        totalAssessmentsTaken: 7,
        termAverageScore: 71,
        classRank: { rank: 18, totalStudents: 35 },
        proprietorApproved: false,
        resultGatePolicy: 'partial',
        subjectSummaries: [
          {
            subject: 'Mathematics',
            teacherName: 'Mrs. Adeyemi',
            averageScore: 70,
            highestScore: 78,
            classAverage: 68,
            trend: 'up',
            assessments: [
              {
                date: '2026-01-20',
                assessmentName: 'Decimals Quiz',
                type: 'Quiz',
                score: 64,
                classAverage: 66,
                teacherComment: 'Work on speed and confidence.',
              },
              {
                date: '2026-02-02',
                assessmentName: 'Number Sense Test',
                type: 'Test',
                score: 78,
                classAverage: 70,
                teacherComment: 'Solid progress.',
              },
            ],
          },
        ],
        globalTrend: [
          { label: 'Wk 1', date: '2026-01-20', averageScore: 64, subject: 'Mathematics' },
          { label: 'Wk 3', date: '2026-02-02', averageScore: 78, subject: 'Mathematics' },
        ],
      },
    ],
  },
  {
    id: 'stu-demola',
    name: 'Demola Ojo',
    grade: 'JSS 1',
    parentAbsenceNote: true,
    weeklyAttendanceRate: 92,
    outstandingBalance: 0,
    subscriptionStatus: 'Expired',
    dailyPulse: {
      attendance: 'Present',
      behaviorNote: 'Demola asked thoughtful questions during literature discussion.',
      homeworkDue: [{ subject: 'Basic Science', title: 'Lab safety checklist' }],
      mealStatus: 'Ate Lunch',
    },
    activityFeed: [
      {
        id: 'act-5',
        type: 'communication',
        summary: 'New announcement from the Proprietor.',
        detail: 'Inter-house sports registration closes tomorrow.',
        timestamp: '2026-04-10T10:00:00Z',
        actor: 'Proprietor Office',
      },
      {
        id: 'act-6',
        type: 'academic',
        summary: 'New Grade: 91% in Civic Education.',
        detail: 'Excellent analysis on civic responsibilities and citizenship.',
        timestamp: '2026-04-09T10:45:00Z',
        actor: 'Mr. Bako',
      },
    ],
    sourceSync: {
      teacherDailyLog: '2026-04-10T08:10:00Z',
      bursarLedger: '2026-04-10T08:00:00Z',
      assessmentStore: '2026-04-10T08:02:00Z',
    },
    academicByTerm: [
      {
        termLabel: 'Term 2, 2026',
        isCurrent: true,
        totalAssessmentsTaken: 6,
        termAverageScore: 84,
        classRank: { rank: 5, totalStudents: 35 },
        proprietorApproved: true,
        resultGatePolicy: 'partial',
        subjectSummaries: [
          {
            subject: 'Basic Science',
            teacherName: 'Mr. Okonkwo',
            averageScore: 86,
            highestScore: 91,
            classAverage: 79,
            trend: 'up',
            assessments: [
              {
                date: '2026-03-10',
                assessmentName: 'Lab Safety Test',
                type: 'Test',
                score: 81,
                classAverage: 76,
                teacherComment: 'Great awareness and detail.',
              },
              {
                date: '2026-03-29',
                assessmentName: 'Systems Exam',
                type: 'Exam',
                score: 91,
                classAverage: 82,
                teacherComment: 'Excellent use of scientific terms.',
              },
            ],
          },
        ],
        globalTrend: [
          { label: 'Wk 3', date: '2026-03-10', averageScore: 81, subject: 'Basic Science' },
          { label: 'Wk 6', date: '2026-03-29', averageScore: 91, subject: 'Basic Science' },
        ],
      },
      {
        termLabel: 'Term 1, 2026',
        isCurrent: false,
        totalAssessmentsTaken: 5,
        termAverageScore: 77,
        classRank: { rank: 9, totalStudents: 35 },
        proprietorApproved: true,
        resultGatePolicy: 'full_access',
        subjectSummaries: [
          {
            subject: 'Basic Science',
            teacherName: 'Mr. Okonkwo',
            averageScore: 77,
            highestScore: 84,
            classAverage: 74,
            trend: 'flat',
            assessments: [
              {
                date: '2026-01-22',
                assessmentName: 'Ecology Quiz',
                type: 'Quiz',
                score: 70,
                classAverage: 72,
                teacherComment: 'Improve examples in explanations.',
              },
              {
                date: '2026-02-05',
                assessmentName: 'Unit Test',
                type: 'Test',
                score: 84,
                classAverage: 76,
                teacherComment: 'Good retention of class notes.',
              },
            ],
          },
        ],
        globalTrend: [
          { label: 'Wk 2', date: '2026-01-22', averageScore: 70, subject: 'Basic Science' },
          { label: 'Wk 4', date: '2026-02-05', averageScore: 84, subject: 'Basic Science' },
        ],
      },
    ],
  },
];

function buildDefaultSubscriptions() {
  const now = ATTENDANCE_FIXED_NOW.getTime();
  const inDays = (days: number) => new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

  return MOCK_STUDENTS.reduce<Record<string, GuardianSubscriptionProfile>>((acc, student) => {
    if (student.subscriptionStatus === 'Active') {
      acc[student.id] = {
        status: 'Active',
        activeUntil: inDays(30),
        autoRenewalEnabled: false,
        paymentHistory: [
          {
            id: `pay-${student.id}-paid-1`,
            date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 1000,
            status: 'paid',
          },
        ],
      };
      return acc;
    }

    if (student.subscriptionStatus === 'Trial') {
      acc[student.id] = {
        status: 'Trial',
        trialEndsAt: inDays(3),
        autoRenewalEnabled: false,
        paymentHistory: [],
      };
      return acc;
    }

    acc[student.id] = {
      status: 'Expired',
      activeUntil: inDays(-2),
      autoRenewalEnabled: false,
      paymentHistory: [
        {
          id: `pay-${student.id}-failed-1`,
          date: new Date(now - 33 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 1000,
          status: 'failed',
        },
      ],
    };
    return acc;
  }, {});
}

const DEFAULT_SUBSCRIPTIONS = buildDefaultSubscriptions();

function getTrendIcon(direction: TrendDirection) {
  if (direction === 'up') {
    return <ArrowUp size={16} className="text-green-600" />;
  }
  if (direction === 'down') {
    return <ArrowDown size={16} className="text-red-600" />;
  }
  return <Minus size={16} className="text-muted-foreground" />;
}

function buildAutomatedAlerts(student: StudentRecord): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (student.dailyPulse.attendance === 'Absent' && !student.parentAbsenceNote) {
    alerts.push({
      id: `${student.id}-safety-absence`,
      kind: 'safety',
      message: 'Absence Unexplained: Student is marked absent with no parent note.',
      deepLinkTab: 'attendance',
    });
  }

  if (student.weeklyAttendanceRate < 80) {
    alerts.push({
      id: `${student.id}-compliance-attendance`,
      kind: 'compliance',
      message: `Attendance Alert: ${student.name}'s attendance is ${student.weeklyAttendanceRate}% this week (Target: 80%).`,
      deepLinkTab: 'attendance',
    });
  }

  if (student.outstandingBalance > 0) {
    alerts.push({
      id: `${student.id}-finance-balance`,
      kind: 'financial',
      message: `Outstanding Balance: ₦${student.outstandingBalance.toLocaleString()}.`,
      deepLinkTab: 'finance',
    });
  }

  return alerts;
}

function getAttendanceVisual(status: AttendanceStatus) {
  if (status === 'Present') {
    return {
      icon: CheckCircle2,
      badgeClass: 'text-green-700 bg-green-50 border-green-200',
      iconClass: 'text-green-600',
    };
  }
  if (status === 'Late') {
    return {
      icon: CalendarClock,
      badgeClass: 'text-yellow-800 bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-600',
    };
  }
  return {
    icon: XCircle,
    badgeClass: 'text-red-700 bg-red-50 border-red-200',
    iconClass: 'text-red-600',
  };
}

function getTimelineStyle(type: ActivityType) {
  if (type === 'academic') {
    return { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Academic' };
  }
  if (type === 'medical') {
    return { icon: BriefcaseMedical, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Medical' };
  }
  if (type === 'logistics') {
    return { icon: ClipboardList, color: 'text-amber-700', bg: 'bg-amber-100', label: 'Logistics' };
  }
  return { icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Communication' };
}

export function ParentDashboard() {
  const [activeStudentId, setActiveStudentId] = useState(MOCK_STUDENTS[0].id);
  const [activeTab, setActiveTab] = useState<GuardianTab>('overview');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [selectedTermLabel, setSelectedTermLabel] = useState(
    MOCK_STUDENTS[0].academicByTerm.find((term) => term.isCurrent)?.termLabel ?? MOCK_STUDENTS[0].academicByTerm[0].termLabel,
  );
  const [selectedTrendSubject, setSelectedTrendSubject] = useState('All subjects');
  const [selectedSubject, setSelectedSubject] = useState<SubjectSummary | null>(null);
  const [behaviorFilter, setBehaviorFilter] = useState<'All' | BehaviorType>('All');
  const [selectedAttendanceDay, setSelectedAttendanceDay] = useState<AttendanceDayLog | null>(null);
  const [selectedAttendanceWeek, setSelectedAttendanceWeek] = useState<string | null>(null);
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(
    getDefaultMonthForAttendance(
      getAttendanceBehaviorTerm(
        MOCK_STUDENTS[0].id,
        MOCK_STUDENTS[0].academicByTerm.find((term) => term.isCurrent)?.termLabel ?? MOCK_STUDENTS[0].academicByTerm[0].termLabel,
      ),
    ),
  );
  const [transportPreferenceOverrides, setTransportPreferenceOverrides] = useState<Record<string, TransportMode>>({});
  const [preAuthorizedStudentIds, setPreAuthorizedStudentIds] = useState<Record<string, boolean>>({});
  const [localDepartureLogByStudent, setLocalDepartureLogByStudent] = useState<Record<string, DepartureRecord[]>>({});
  const [communications, setCommunications] = useState<CommunicationMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<GuardianNotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [communicationsSearch, setCommunicationsSearch] = useState('');
  const [communicationsHighPriorityOnly, setCommunicationsHighPriorityOnly] = useState(false);
  const [communicationsDateFrom, setCommunicationsDateFrom] = useState('');
  const [communicationsDateTo, setCommunicationsDateTo] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<CommunicationMessage | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [subscriptionsByStudent, setSubscriptionsByStudent] = useState<Record<string, GuardianSubscriptionProfile>>({});
  const [medicalProfilesByStudent, setMedicalProfilesByStudent] = useState<Record<string, MedicalPortalData>>({});
  const [receiptDraftByStudent, setReceiptDraftByStudent] = useState<Record<string, UploadedReceipt | null>>({});
  const [receiptSenderNameByStudent, setReceiptSenderNameByStudent] = useState<Record<string, string>>({});
  const [receiptAmountByStudent, setReceiptAmountByStudent] = useState<Record<string, string>>({});
  const [receiptStatusByStudent, setReceiptStatusByStudent] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});
  const [receiptMessageByStudent, setReceiptMessageByStudent] = useState<Record<string, string>>({});
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<PaymentHistoryEntry | null>(null);
  const [isReceiptDragActive, setIsReceiptDragActive] = useState(false);
  const [selectedSubjectForMastery, setSelectedSubjectForMastery] = useState<{ subject: string; subjectId: string } | null>(null);
  const [isEditingMedicalProfile, setIsEditingMedicalProfile] = useState(false);
  const [isViewingFinanceDetails, setIsViewingFinanceDetails] = useState(false);

  const activeStudent = useMemo(
    () => MOCK_STUDENTS.find((student) => student.id === activeStudentId) ?? MOCK_STUDENTS[0],
    [activeStudentId],
  );

  const activeTerm = useMemo(() => {
    return (
      activeStudent.academicByTerm.find((term) => term.termLabel === selectedTermLabel) ??
      activeStudent.academicByTerm.find((term) => term.isCurrent) ??
      activeStudent.academicByTerm[0]
    );
  }, [activeStudent, selectedTermLabel]);

  useEffect(() => {
    const refresh = () => {
      const next: Record<string, DepartureRecord[]> = {};
      MOCK_STUDENTS.forEach((student) => {
        next[student.id] = readTransportDepartureLog(student.id);
      });
      setLocalDepartureLogByStudent(next);
    };

    refresh();

    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith('departureLog:')) {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(studentMedicalProfileStoreKey())) {
      writeJsonToStorage(studentMedicalProfileStoreKey(), MOCK_MEDICAL_PORTAL);
    }

    const refresh = () => {
      const all = readJsonFromStorage<Record<string, MedicalPortalData>>(
        studentMedicalProfileStoreKey(),
        MOCK_MEDICAL_PORTAL,
      );
      setMedicalProfilesByStudent(all);
    };

    refresh();

    const onStorage = (event: StorageEvent) => {
      if (event.key === studentMedicalProfileStoreKey()) {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(subscriptionsStoreKey())) {
      writeJsonToStorage(subscriptionsStoreKey(), DEFAULT_SUBSCRIPTIONS);
    }

    const refresh = () => {
      const all = readJsonFromStorage<Record<string, GuardianSubscriptionProfile>>(
        subscriptionsStoreKey(),
        DEFAULT_SUBSCRIPTIONS,
      );
      setSubscriptionsByStudent(all);
    };

    refresh();

    const onStorage = (event: StorageEvent) => {
      if (event.key === subscriptionsStoreKey()) {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(communicationsStoreKey())) {
      writeJsonToStorage(communicationsStoreKey(), DEFAULT_COMMUNICATION_MESSAGES);
    }
    if (!localStorage.getItem(announcementsStoreKey())) {
      writeJsonToStorage(announcementsStoreKey(), DEFAULT_ANNOUNCEMENTS);
    }
    if (!localStorage.getItem(repliesStoreKey())) {
      writeJsonToStorage<SchoolReply[]>(repliesStoreKey(), []);
    }

    const profile = readJsonFromStorage<{ notificationPreferences?: GuardianNotificationPreferences }>(
      parentProfileStoreKey(),
      {},
    );
    if (!profile.notificationPreferences) {
      const seededProfile = { ...profile, notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES };
      writeJsonToStorage(parentProfileStoreKey(), seededProfile);
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      const inbox = readJsonFromStorage<CommunicationMessage[]>(communicationsStoreKey(), DEFAULT_COMMUNICATION_MESSAGES);
      const board = readJsonFromStorage<SchoolAnnouncement[]>(announcementsStoreKey(), DEFAULT_ANNOUNCEMENTS);
      const profile = readJsonFromStorage<{ notificationPreferences?: GuardianNotificationPreferences }>(
        parentProfileStoreKey(),
        {},
      );

      setCommunications(inbox);
      setAnnouncements(board);
      setNotificationPreferences(profile.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES);
    };

    refresh();
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === communicationsStoreKey() ||
        event.key === announcementsStoreKey() ||
        event.key === parentProfileStoreKey()
      ) {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  const activeAttendanceTerm = useMemo(() => {
    return getAttendanceBehaviorTerm(activeStudent.id, activeTerm.termLabel);
  }, [activeStudent.id, activeTerm.termLabel]);

  const automatedAlerts = useMemo(() => buildAutomatedAlerts(activeStudent), [activeStudent]);
  const attendanceVisual = useMemo(
    () => getAttendanceVisual(activeStudent.dailyPulse.attendance),
    [activeStudent.dailyPulse.attendance],
  );
  const timelineItems = useMemo(
    () =>
      [...activeStudent.activityFeed]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20),
    [activeStudent.activityFeed],
  );
  const latestSync = useMemo(() => {
    const dates = [
      activeStudent.sourceSync.teacherDailyLog,
      activeStudent.sourceSync.bursarLedger,
      activeStudent.sourceSync.assessmentStore,
    ];
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [activeStudent]);

  const trendSubjects = useMemo(() => {
    return ['All subjects', ...new Set(activeTerm.subjectSummaries.map((item) => item.subject))];
  }, [activeTerm]);

  const filteredGlobalTrend = useMemo(() => {
    if (selectedTrendSubject === 'All subjects') {
      return activeTerm.globalTrend;
    }
    return activeTerm.globalTrend.filter((item) => item.subject === selectedTrendSubject);
  }, [activeTerm, selectedTrendSubject]);

  const teacherComments = useMemo(() => {
    return activeTerm.subjectSummaries.flatMap((summary) =>
      summary.assessments
        .filter((assessment) => assessment.teacherComment)
        .map((assessment) => ({
          subject: summary.subject,
          date: assessment.date,
          comment: assessment.teacherComment as string,
        })),
    );
  }, [activeTerm]);

  const canDownloadReportCard = activeTerm.proprietorApproved && activeTerm.resultGatePolicy !== 'blocked';

  const activeTransportPortal = useMemo(() => {
    return MOCK_TRANSPORT_PORTAL[activeStudent.id] ?? MOCK_TRANSPORT_PORTAL['stu-israel'];
  }, [activeStudent.id]);

  const activeTransportPreference = useMemo(() => {
    return transportPreferenceOverrides[activeStudent.id] ?? activeTransportPortal.defaultMode;
  }, [activeStudent.id, activeTransportPortal.defaultMode, transportPreferenceOverrides]);

  const pickupToken = useMemo(() => {
    return generateDailyPickupToken(activeStudent.id, getTodayDateKey());
  }, [activeStudent.id]);

  const isPreAuthorizedToday = preAuthorizedStudentIds[activeStudent.id] ?? false;

  const combinedDepartureHistory = useMemo(() => {
    const fromPortal = activeTransportPortal.departureHistory;
    const fromLocal = localDepartureLogByStudent[activeStudent.id] ?? [];
    return [...fromLocal, ...fromPortal]
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .slice(0, 10);
  }, [activeStudent.id, activeTransportPortal.departureHistory, localDepartureLogByStudent]);

  const filteredCommunications = useMemo(() => {
    const normalizedSearch = communicationsSearch.trim().toLowerCase();
    return communications
      .filter((msg) => msg.targetType === 'all' || msg.targetId === activeStudentId)
      .filter((msg) => {
        if (!normalizedSearch) {
          return true;
        }
        return (
          msg.subject.toLowerCase().includes(normalizedSearch) ||
          msg.senderName.toLowerCase().includes(normalizedSearch)
        );
      })
      .filter((msg) => (communicationsHighPriorityOnly ? msg.priority === 'high' : true))
      .filter((msg) => {
        const timestamp = new Date(msg.timestamp).getTime();
        const fromOk = communicationsDateFrom ? timestamp >= new Date(`${communicationsDateFrom}T00:00:00`).getTime() : true;
        const toOk = communicationsDateTo ? timestamp <= new Date(`${communicationsDateTo}T23:59:59`).getTime() : true;
        return fromOk && toOk;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [communications, communicationsDateFrom, communicationsDateTo, communicationsHighPriorityOnly, communicationsSearch, activeStudentId]);

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [announcements]);

  const activeSubscription = useMemo(() => {
    return subscriptionsByStudent[activeStudent.id] ?? DEFAULT_SUBSCRIPTIONS[activeStudent.id];
  }, [activeStudent.id, subscriptionsByStudent]);

  const trialCountdown = useMemo(() => {
    if (activeSubscription.status !== 'Trial' || !activeSubscription.trialEndsAt) {
      return null;
    }
    const diffMs = new Date(activeSubscription.trialEndsAt).getTime() - ATTENDANCE_FIXED_NOW.getTime();
    const safeMs = Math.max(0, diffMs);
    const totalHours = Math.floor(safeMs / (60 * 60 * 1000));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return {
      days,
      hours,
      totalHours,
      isEndingSoon: totalHours <= 72,
    };
  }, [activeSubscription]);

  const shouldShowPaymentSection = useMemo(() => {
    if (activeSubscription.status === 'Expired' || activeSubscription.status === 'Pending Confirmation') {
      return true;
    }
    return activeSubscription.status === 'Trial' && Boolean(trialCountdown?.isEndingSoon);
  }, [activeSubscription.status, trialCountdown]);

  const activeReceiptDraft = receiptDraftByStudent[activeStudent.id] ?? null;
  const activeReceiptSenderName = receiptSenderNameByStudent[activeStudent.id] ?? '';
  const activeReceiptAmount = receiptAmountByStudent[activeStudent.id] ?? '';
  const activeReceiptStatus = receiptStatusByStudent[activeStudent.id] ?? 'pending';
  const receiptSubmissionMessage = receiptMessageByStudent[activeStudent.id] ?? '';

  const openMessage = (message: CommunicationMessage) => {
    const inbox = readJsonFromStorage<CommunicationMessage[]>(communicationsStoreKey(), DEFAULT_COMMUNICATION_MESSAGES);
    const nextInbox = inbox.map((msg) => (msg.id === message.id ? { ...msg, isRead: true } : msg));
    writeJsonToStorage(communicationsStoreKey(), nextInbox);
    setCommunications(nextInbox);
    setSelectedMessage({ ...message, isRead: true });
    setReplyDraft('');
  };

  const sendReply = () => {
    if (!selectedMessage || !replyDraft.trim()) {
      return;
    }
    const replies = readJsonFromStorage<SchoolReply[]>(repliesStoreKey(), []);
    const nextReplies: SchoolReply[] = [
      {
        id: `reply-${Date.now()}`,
        messageId: selectedMessage.id,
        studentId: activeStudentId,
        parentName: 'Parent User',
        replyText: replyDraft.trim(),
        createdAt: new Date().toISOString(),
      },
      ...replies,
    ];
    writeJsonToStorage(repliesStoreKey(), nextReplies);
    setReplyDraft('');
    window.alert('Reply sent to school communications queue.');
  };

  const updateNotificationPreference = (
    eventKey: keyof GuardianNotificationPreferences,
    channelKey: keyof NotificationMatrixRow,
    checked: boolean,
  ) => {
    const nextPrefs: GuardianNotificationPreferences = {
      ...notificationPreferences,
      [eventKey]: {
        ...notificationPreferences[eventKey],
        [channelKey]: checked,
      },
    };
    setNotificationPreferences(nextPrefs);
    const profile = readJsonFromStorage<{ notificationPreferences?: GuardianNotificationPreferences }>(
      parentProfileStoreKey(),
      {},
    );
    writeJsonToStorage(parentProfileStoreKey(), { ...profile, notificationPreferences: nextPrefs });
  };

  const updateSubscriptionForStudent = (
    studentId: string,
    updater: (current: GuardianSubscriptionProfile) => GuardianSubscriptionProfile,
  ) => {
    setSubscriptionsByStudent((prev) => {
      const current = prev[studentId] ?? DEFAULT_SUBSCRIPTIONS[studentId];
      const next = updater(current);
      const all = { ...prev, [studentId]: next };
      writeJsonToStorage(subscriptionsStoreKey(), all);
      return all;
    });
  };

  const onReceiptFileSelected = (file: File | null) => {
    if (!file) {
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      window.alert('Please upload a PNG, JPG, or PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        return;
      }

      setReceiptDraftByStudent((prev) => ({
        ...prev,
        [activeStudent.id]: {
          name: file.name,
          mimeType: file.type,
          dataUrl,
        },
      }));
      setReceiptMessageByStudent((prev) => ({ ...prev, [activeStudent.id]: '' }));
    };
    reader.readAsDataURL(file);
  };

  const submitReceiptForConfirmation = () => {
    if (!activeReceiptDraft) {
      return;
    }

    const numericAmount = Number(activeReceiptAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      window.alert('Please provide a valid receipt amount.');
      return;
    }

    if (!activeReceiptSenderName.trim()) {
      window.alert("Please provide the sender's name.");
      return;
    }

    const mappedStatus: PaymentStatus =
      activeReceiptStatus === 'approved'
        ? 'paid'
        : activeReceiptStatus === 'rejected'
          ? 'failed'
          : 'pending_confirmation';

    const nowIso = new Date().toISOString();
    updateSubscriptionForStudent(activeStudent.id, (current) => ({
      ...current,
      status: mappedStatus === 'pending_confirmation' ? 'Pending Confirmation' : current.status,
      paymentHistory: [
        {
          id: `pay-${activeStudent.id}-${Date.now()}`,
          date: nowIso,
          amount: numericAmount,
          status: mappedStatus,
          senderName: activeReceiptSenderName.trim(),
          receipt: activeReceiptDraft,
        },
        ...current.paymentHistory,
      ],
    }));

    setReceiptDraftByStudent((prev) => ({ ...prev, [activeStudent.id]: null }));
    setReceiptSenderNameByStudent((prev) => ({ ...prev, [activeStudent.id]: '' }));
    setReceiptAmountByStudent((prev) => ({ ...prev, [activeStudent.id]: '' }));
    setReceiptStatusByStudent((prev) => ({ ...prev, [activeStudent.id]: 'pending' }));
    setReceiptMessageByStudent((prev) => ({
      ...prev,
      [activeStudent.id]: 'Receipt submitted. We will confirm within 24 hours.',
    }));
  };

  const activeMedicalPortal = useMemo(() => {
    return medicalProfilesByStudent[activeStudent.id] ?? MOCK_MEDICAL_PORTAL[activeStudent.id] ?? MOCK_MEDICAL_PORTAL['stu-israel'];
  }, [activeStudent.id, medicalProfilesByStudent]);

  const medicationScheduleToday = useMemo(() => {
    const todayKey = getTodayDateKey();
    const nowMs = ATTENDANCE_FIXED_NOW.getTime();

    return activeMedicalPortal.todaySchedule.map((row) => {
      const scheduledAt = timeToDate(row.scheduledTime, todayKey);
      const historyEntry = activeMedicalPortal.history.find((entry) => {
        const entryDate = new Date(entry.timestamp);
        const entryKey = `${entryDate.getFullYear()}-${`${entryDate.getMonth() + 1}`.padStart(2, '0')}-${`${entryDate.getDate()}`.padStart(2, '0')}`;
        return entryKey === todayKey && entry.medication === row.medication;
      });

      const diffMs = scheduledAt.getTime() - nowMs;
      const status: 'Given' | 'Not Yet Due' | 'Missed' = historyEntry
        ? 'Given'
        : diffMs > 0
          ? 'Not Yet Due'
          : 'Missed';

      return {
        ...row,
        scheduledAt,
        status,
        administeredBy: historyEntry?.administeredBy,
      };
    });
  }, [activeMedicalPortal]);

  const medicalSafetyAlerts = useMemo(() => {
    const severeAllergies = activeMedicalPortal.allergies.filter((entry) => entry.severity === 'Severe');
    const dueSoon = medicationScheduleToday.filter((row) => {
      if (row.status === 'Given') {
        return false;
      }
      const diffMs = row.scheduledAt.getTime() - ATTENDANCE_FIXED_NOW.getTime();
      return diffMs >= 0 && diffMs <= 30 * 60 * 1000;
    });

    const missedYesterday = activeMedicalPortal.yesterdaySchedule.filter((item) => !item.wasGiven);

    return {
      severeAllergies,
      dueSoon,
      missedYesterday,
    };
  }, [activeMedicalPortal, medicationScheduleToday]);

  const medicalHistory = useMemo(() => {
    return [...activeMedicalPortal.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activeMedicalPortal]);

  const attendanceSummary = useMemo(() => {
    if (!activeAttendanceTerm) {
      return { present: 0, absent: 0, late: 0, totalSchoolDays: 0, rate: 0, perfect: false };
    }
    const present = activeAttendanceTerm.attendanceDays.filter((day) => day.status === 'present').length;
    const absent = activeAttendanceTerm.attendanceDays.filter((day) => day.status === 'absent').length;
    const late = activeAttendanceTerm.attendanceDays.filter((day) => day.status === 'late').length;
    const totalSchoolDays = activeAttendanceTerm.totalSchoolDays;
    const rate = totalSchoolDays > 0 ? (present / totalSchoolDays) * 100 : 0;
    return { present, absent, late, totalSchoolDays, rate, perfect: absent === 0 && late === 0 };
  }, [activeAttendanceTerm]);

  const visibleBehaviorEvents = useMemo(() => {
    if (!activeAttendanceTerm) {
      return [];
    }
    return activeAttendanceTerm.behaviorEvents
      .filter((entry) => entry.visibility === 'parent')
      .filter((entry) => behaviorFilter === 'All' || entry.type === behaviorFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeAttendanceTerm, behaviorFilter]);

  const behaviorInsights = useMemo(() => {
    if (!activeAttendanceTerm) {
      return {
        mostFrequentPositive: 'None recorded',
        mostFrequentConcern: 'None recorded',
      };
    }
    const parentVisible = activeAttendanceTerm.behaviorEvents.filter((event) => event.visibility === 'parent');
    return {
      mostFrequentPositive: getMostFrequentTag(parentVisible.filter((event) => event.type === 'Positive')),
      mostFrequentConcern: getMostFrequentTag(parentVisible.filter((event) => event.type === 'Needs improvement')),
    };
  }, [activeAttendanceTerm]);

  const selectedAttendanceWeekDetail = useMemo(() => {
    if (!activeAttendanceTerm || !selectedAttendanceWeek) {
      return null;
    }
    return activeAttendanceTerm.weeklyTrend.find((point) => point.weekLabel === selectedAttendanceWeek) ?? null;
  }, [activeAttendanceTerm, selectedAttendanceWeek]);

  const calendarMonthDate = useMemo(() => {
    const [year, month] = selectedAttendanceMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedAttendanceMonth]);

  const attendanceDaysByDate = useMemo(() => {
    const map = new Map<string, AttendanceDayLog>();
    if (activeAttendanceTerm) {
      activeAttendanceTerm.attendanceDays.forEach((day) => {
        map.set(day.date, day);
      });
    }
    return map;
  }, [activeAttendanceTerm]);

  const monthCells = useMemo(() => {
    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = firstDay.getDay();

    const cells: Array<Date | null> = [];
    for (let i = 0; i < leading; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [calendarMonthDate]);

  const isLocked =
    (activeSubscription.status === 'Expired' || activeSubscription.status === 'Pending Confirmation') &&
    activeTab !== 'overview' &&
    activeTab !== 'subscription';
  const AttendanceIcon = attendanceVisual.icon;

  if (isEditingMedicalProfile) {
    return (
      <MedicalProfileEditor
        studentId={activeStudent.id}
        studentName={activeStudent.name}
        initialProfile={activeMedicalPortal}
        onBack={() => setIsEditingMedicalProfile(false)}
        onSaved={(updatedProfile) => {
          setMedicalProfilesByStudent((prev) => {
            const next = { ...prev, [activeStudent.id]: updatedProfile };
            writeJsonToStorage(studentMedicalProfileStoreKey(), next);
            return next;
          });
          setIsEditingMedicalProfile(false);
          setActiveTab('medical');
          window.alert('Health profile updated successfully.');
        }}
      />
    );
  }

  if (isViewingFinanceDetails) {
    return (
      <FinanceFeeManagementView
        studentId={activeStudent.id}
        studentName={activeStudent.name}
        outstandingBalance={activeStudent.outstandingBalance}
        onBack={() => {
          setIsViewingFinanceDetails(false);
          setActiveTab('finance');
        }}
      />
    );
  }

  if (selectedSubjectForMastery) {
    const subject = activeTerm.subjectSummaries.find((s) => s.subject === selectedSubjectForMastery.subject);
    if (subject) {
      return (
        <SubjectMasteryView
          studentId={activeStudent.id}
          studentName={activeStudent.name}
          subjectName={selectedSubjectForMastery.subject}
          teacherName={subject.teacherName}
          classSize={38}
          currentAverage={subject.averageScore}
          classLabel={activeStudent.grade}
          classId={activeStudent.grade.toLowerCase().replace(/\s+/g, '-')}
          onBack={() => setSelectedSubjectForMastery(null)}
        />
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <Card className="bg-gradient-to-r from-slate-50 via-white to-amber-50 border-amber-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Personalized Student Insight Dashboard</p>
              <h2 className="text-2xl font-semibold">Parent Overview</h2>
            </div>
            <div className="text-sm text-muted-foreground">Last sync: {new Date(latestSync).toLocaleString()}</div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Switch active child</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {MOCK_STUDENTS.map((student) => {
                const isActive = activeStudentId === student.id;
                return (
                  <button
                    key={student.id}
                    onClick={() => {
                      setActiveStudentId(student.id);
                      setActiveTab('overview');
                      setSelectedTrendSubject('All subjects');
                      const currentTerm =
                        student.academicByTerm.find((term) => term.isCurrent)?.termLabel ?? student.academicByTerm[0].termLabel;
                      setSelectedTermLabel(currentTerm);
                      setSelectedSubject(null);
                      const attendanceTerm = getAttendanceBehaviorTerm(student.id, currentTerm);
                      setSelectedAttendanceMonth(getDefaultMonthForAttendance(attendanceTerm));
                      setSelectedAttendanceDay(null);
                      setSelectedAttendanceWeek(null);
                      setBehaviorFilter('All');
                      setSelectedMessage(null);
                      setReplyDraft('');
                      setIsViewingFinanceDetails(false);
                    }}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-accent'
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                        isActive ? 'bg-primary-foreground/20' : 'bg-accent'
                      }`}
                    >
                      <User size={16} />
                    </span>
                    <span>
                      {student.name} - {student.grade}
                    </span>
                  </button>
                );
              })}
            </div>
            <select
              value={activeStudentId}
              onChange={(event) => {
                setActiveStudentId(event.target.value);
                setActiveTab('overview');
                setSelectedTrendSubject('All subjects');
                const selectedStudent =
                  MOCK_STUDENTS.find((student) => student.id === event.target.value) ?? MOCK_STUDENTS[0];
                const currentTerm =
                  selectedStudent.academicByTerm.find((term) => term.isCurrent)?.termLabel ??
                  selectedStudent.academicByTerm[0].termLabel;
                setSelectedTermLabel(currentTerm);
                setSelectedSubject(null);
                const attendanceTerm = getAttendanceBehaviorTerm(selectedStudent.id, currentTerm);
                setSelectedAttendanceMonth(getDefaultMonthForAttendance(attendanceTerm));
                setSelectedAttendanceDay(null);
                setSelectedAttendanceWeek(null);
                setBehaviorFilter('All');
                setSelectedMessage(null);
                setReplyDraft('');
                setIsViewingFinanceDetails(false);
              }}
              className="md:hidden w-full p-2 border border-border rounded-lg bg-input-background"
            >
              {MOCK_STUDENTS.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Subscription:</span>
            <Badge
              variant={
                activeSubscription.status === 'Active'
                  ? 'approved'
                  : activeSubscription.status === 'Trial' || activeSubscription.status === 'Pending Confirmation'
                    ? 'pending'
                    : 'rejected'
              }
            >
              {activeSubscription.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeSubscription.status === 'Expired'
              ? 'Overview and Subscription tabs are visible. Other tabs are locked until renewal.'
              : activeSubscription.status === 'Pending Confirmation'
                ? 'Payment is under review. Overview and Subscription tabs remain available.'
                : 'All parent tabs are available for this student.'}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Attendance Status</p>
              <p className="text-2xl font-semibold mt-1">{activeStudent.dailyPulse.attendance}</p>
            </div>
            <div className={`rounded-full border p-3 ${attendanceVisual.badgeClass}`}>
              <AttendanceIcon className={attendanceVisual.iconClass} size={28} />
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-muted-foreground text-sm mb-2">Behavior Highlight</p>
          <blockquote className="border-l-4 border-primary pl-3 italic">
            "{activeStudent.dailyPulse.behaviorNote}"
          </blockquote>
        </Card>

        <Card>
          <p className="text-muted-foreground text-sm mb-2">Meal / Care Status</p>
          <div className="flex items-center gap-2">
            {activeStudent.dailyPulse.mealStatus?.toLowerCase().includes('medication') ? (
              <Pill className="text-rose-600" size={20} />
            ) : (
              <Utensils className="text-emerald-600" size={20} />
            )}
            <span className="font-medium">{activeStudent.dailyPulse.mealStatus ?? 'No care update yet'}</span>
          </div>
        </Card>

        <Card>
          <p className="text-muted-foreground text-sm mb-2">Homework Due Today</p>
          <ul className="space-y-1">
            {activeStudent.dailyPulse.homeworkDue.length > 0 ? (
              activeStudent.dailyPulse.homeworkDue.map((task) => (
                <li key={`${task.subject}-${task.title}`} className="text-sm">
                  <span className="font-medium">{task.subject}:</span> {task.title}
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No homework due today.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {(['overview', 'academic', 'medical', 'transport', 'communications', 'subscription', 'finance', 'attendance'] as GuardianTab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
      </Card>

      <div className="relative">
        <div className={`${isLocked ? 'blur-[1px] pointer-events-none select-none' : ''} space-y-4`}>
          {activeTab === 'overview' && (
            <>
              {automatedAlerts.length > 0 && (
                <Card className="border-orange-300 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50">
                  <div className="flex items-center gap-2 mb-3 text-red-700">
                    <AlertTriangle size={18} />
                    <h3 className="font-semibold">Intelligence Banner: Urgent Alerts</h3>
                  </div>
                  <div className="space-y-2">
                    {automatedAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-orange-200 rounded-lg bg-white/80 p-3"
                      >
                        <p className="text-sm">{alert.message}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab(alert.deepLinkTab)}
                          className="w-fit"
                        >
                          View Details <ArrowRight size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card title="Activity Feed (Last 7 Days)">
                <div className="space-y-4">
                  {timelineItems.map((event) => {
                    const style = getTimelineStyle(event.type);
                    const EventIcon = style.icon;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left flex gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <span className={`rounded-full p-2 ${style.bg}`}>
                            <EventIcon size={16} className={style.color} />
                          </span>
                          <span className="h-full w-px bg-border mt-2" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="default">{style.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium">{event.summary}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </>
          )}

          {activeTab === 'academic' && (
            <>
              <Card title="Academic Performance">
                <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Select term</p>
                    <select
                      value={activeTerm.termLabel}
                      onChange={(event) => {
                        setSelectedTermLabel(event.target.value);
                        setSelectedTrendSubject('All subjects');
                        setSelectedSubject(null);
                        const attendanceTerm = getAttendanceBehaviorTerm(activeStudent.id, event.target.value);
                        setSelectedAttendanceMonth(getDefaultMonthForAttendance(attendanceTerm));
                        setSelectedAttendanceDay(null);
                        setSelectedAttendanceWeek(null);
                        setBehaviorFilter('All');
                      }}
                      className="p-2 border border-border rounded-lg bg-input-background"
                    >
                      {activeStudent.academicByTerm.map((term) => (
                        <option key={term.termLabel} value={term.termLabel}>
                          {term.termLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Changing term reloads subject summaries, trends and comments for that term.
                  </p>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card>
                  <p className="text-sm text-muted-foreground">Term Average</p>
                  <p className="text-3xl font-semibold mt-1">{activeTerm.termAverageScore}%</p>
                </Card>
                <Card>
                  <p className="text-sm text-muted-foreground">Class Rank</p>
                  <p className="text-xl font-semibold mt-1">
                    {activeTerm.classRank
                      ? `Rank: ${activeTerm.classRank.rank} out of ${activeTerm.classRank.totalStudents}`
                      : 'Rank not enabled by school'}
                  </p>
                </Card>
                <Card>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-xl font-semibold mt-1 ${activeTerm.termAverageScore >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {activeTerm.termAverageScore >= 50 ? 'Passing' : 'Needs improvement'}
                  </p>
                </Card>
                <Card>
                  <p className="text-sm text-muted-foreground">Assessments Taken</p>
                  <p className="text-3xl font-semibold mt-1">{activeTerm.totalAssessmentsTaken}</p>
                </Card>
              </div>

              <Card title="Subject-wise Performance">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Subject</th>
                        <th className="text-left py-2">Teacher</th>
                        <th className="text-right py-2">Average</th>
                        <th className="text-right py-2">Highest</th>
                        <th className="text-right py-2">Class Avg</th>
                        <th className="text-center py-2">Trend</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTerm.subjectSummaries.map((summary) => (
                        <tr
                          key={summary.subject}
                          className="border-b cursor-pointer hover:bg-accent"
                          onClick={() => setSelectedSubject(summary)}
                        >
                          <td className="py-3">{summary.subject}</td>
                          <td className="py-3 text-muted-foreground">{summary.teacherName}</td>
                          <td className="py-3 text-right">{summary.averageScore}%</td>
                          <td className="py-3 text-right">{summary.highestScore}%</td>
                          <td className="py-3 text-right">{summary.classAverage !== undefined ? `${summary.classAverage}%` : 'N/A'}</td>
                          <td className="py-3">
                            <div className="flex justify-center">{getTrendIcon(summary.trend)}</div>
                          </td>
                          <td className="py-3 text-right">
                            <Button size="sm" variant="outline" onClick={() => setSelectedSubject(summary)}>
                              View details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card
                title="Performance Trend"
                action={
                  <select
                    value={selectedTrendSubject}
                    onChange={(event) => setSelectedTrendSubject(event.target.value)}
                    className="p-2 border border-border rounded-lg bg-input-background text-sm"
                  >
                    {trendSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                }
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredGlobalTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line dataKey="averageScore" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Report Card">
                {canDownloadReportCard ? (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Available because proprietor approval is complete and parent access is allowed by fee-gating policy.
                    </p>
                    <Button onClick={() => window.alert('Report card download would start here')}>
                      Download Term Report Card
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Report card will be available after school approval.</p>
                )}
              </Card>

              <Card title="Daily Class Logs">
                {teacherComments.length > 0 ? (
                  <div className="space-y-3">
                    {teacherComments.map((comment) => (
                      <button
                        key={`${comment.subject}-${comment.date}-${comment.comment}`}
                        onClick={() => setSelectedSubjectForMastery({ subject: comment.subject, subjectId: comment.subject })}
                        className="w-full text-left p-3 border rounded-lg hover:bg-accent hover:border-primary transition-colors cursor-pointer"
                      >
                        <p className="font-medium">{comment.subject}</p>
                        <p className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</p>
                        <p className="text-sm mt-1">{comment.comment}</p>
                        <p className="text-xs text-primary mt-2 font-medium">→ View full subject HQ</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No teacher comments for this term yet.</p>
                )}
              </Card>
            </>
          )}

          {activeTab === 'medical' && (
            <>
              <Card className="border-red-200 bg-red-50/40" title="Safety Banners & Urgent Alerts">
                <div className="space-y-2">
                  {medicalSafetyAlerts.severeAllergies.map((allergy) => (
                    <div key={allergy.allergen} className="p-3 rounded-lg border border-red-300 bg-red-100 text-red-800 flex items-center gap-2">
                      <AlertCircle size={16} /> Severe Allergy Alert: {allergy.allergen}
                    </div>
                  ))}

                  {medicalSafetyAlerts.dueSoon.map((due) => (
                    <div key={due.id} className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
                      Action Alert: {due.medication} due in 30 minutes.
                    </div>
                  ))}

                  {medicalSafetyAlerts.missedYesterday.map((missed) => (
                    <div key={missed.id} className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-900">
                      Incident Alert: Dose missed yesterday ({missed.medication}, {missed.scheduledTime}).
                    </div>
                  ))}

                  {medicalSafetyAlerts.severeAllergies.length === 0 &&
                    medicalSafetyAlerts.dueSoon.length === 0 &&
                    medicalSafetyAlerts.missedYesterday.length === 0 && (
                      <p className="text-sm text-muted-foreground">No active safety alerts at this time.</p>
                    )}
                </div>
              </Card>

              <Card title="Medical Profile (Baseline)">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Vitals</p>
                    <p>
                      <span className="font-medium">Blood Type:</span> {activeMedicalPortal.bloodType}
                    </p>
                    <p>
                      <span className="font-medium">Genotype:</span> {activeMedicalPortal.genotype}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {activeMedicalPortal.allergies.map((allergy) => (
                        <Badge
                          key={allergy.allergen}
                          variant={allergy.severity === 'Severe' ? 'rejected' : allergy.severity === 'Moderate' ? 'pending' : 'default'}
                        >
                          {allergy.severity}: {allergy.allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p>{activeMedicalPortal.emergencyContact.name} ({activeMedicalPortal.emergencyContact.relationship})</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.alert(`Calling ${activeMedicalPortal.emergencyContact.phone}...`)}
                    >
                      <Phone size={14} /> Call Emergency Contact
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Chronic Conditions & Management Notes</p>
                  <div className="space-y-2">
                    {activeMedicalPortal.chronicConditions.map((condition) => (
                      <div key={condition.condition} className="p-3 border rounded-lg">
                        <p className="font-medium">{condition.condition}</p>
                        <p className="text-sm text-muted-foreground">{condition.managementNote}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-accent/40 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                  <p>Need to make a change to medications or medical details?</p>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingMedicalProfile(true)}>
                    Update Medical Profile
                  </Button>
                </div>
              </Card>

              <Card
                title="Today's Medication Schedule (Live)"
                action={<span className="text-xs text-muted-foreground">Synced from Teacher Medical Log: {new Date(activeMedicalPortal.teacherMedicalLogSyncAt).toLocaleString()}</span>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Medication & Dosage</th>
                        <th className="text-left py-2">Scheduled Time</th>
                        <th className="text-left py-2">Today's Status</th>
                        <th className="text-right py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicationScheduleToday.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="py-3">{row.medication}, {row.dosage}</td>
                          <td className="py-3">{new Date(row.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-3">
                            {row.status === 'Given' && <Badge variant="approved">Given</Badge>}
                            {row.status === 'Not Yet Due' && <Badge variant="default">Not Yet Due</Badge>}
                            {row.status === 'Missed' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 animate-pulse">Missed</span>}
                          </td>
                          <td className="py-3 text-right">
                            {row.status === 'Missed' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.alert(`Reminder sent to teacher for ${row.medication}.`)}
                              >
                                Nudge Teacher
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Medical Fulfillment History (Read-Only)">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Time</th>
                        <th className="text-left py-2">Medication</th>
                        <th className="text-left py-2">Administered By</th>
                        <th className="text-left py-2">Administration Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalHistory.map((entry) => {
                        const timestamp = new Date(entry.timestamp);
                        return (
                          <tr key={entry.id} className="border-b">
                            <td className="py-3">{timestamp.toLocaleDateString()}</td>
                            <td className="py-3">{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="py-3">{entry.medication}, {entry.dosage}</td>
                            <td className="py-3">{entry.administeredBy}</td>
                            <td className="py-3 text-sm text-muted-foreground">{entry.administrationNote ?? 'No incident note'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'transport' && (
            <>
              <Card title="Live Departure Tracker">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="p-4 rounded-lg border bg-accent/30">
                    {activeTransportPortal.status === 'waiting' && (
                      <div className="space-y-2">
                        <p className="text-yellow-700 font-semibold text-lg">⏳ Waiting for Pickup</p>
                        <p className="text-sm text-muted-foreground">Student is still on school premises.</p>
                      </div>
                    )}
                    {activeTransportPortal.status === 'picked_up' && (
                      <div className="space-y-2">
                        <p className="text-green-700 font-semibold text-lg">✅ Picked Up</p>
                        <p className="text-sm text-muted-foreground">Student has departed.</p>
                      </div>
                    )}
                    {activeTransportPortal.status === 'in_transit' && (
                      <div className="space-y-2">
                        <p className="text-blue-700 font-semibold text-lg">🚌 In Transit</p>
                        <p className="text-sm text-muted-foreground">Student is currently on the school bus.</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 p-4 rounded-lg border">
                    {activeTransportPortal.status === 'picked_up' ? (
                      <p>
                        Picked up at <span className="font-medium">{activeTransportPortal.pickedUpAt ?? 'Time unavailable'}</span> by{' '}
                        <span className="font-medium">{activeTransportPortal.pickedUpBy ?? 'Authorized collector'}</span>.
                      </p>
                    ) : (
                      <div>
                        <p className="font-medium mb-2">Authorized to collect today</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {activeTransportPortal.authorizedCollectorsToday.map((collector) => (
                            <li key={collector.id}>- {collector.name} ({collector.relation})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Secure Pickup Verification (Daily Code)">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="p-4 rounded-lg border bg-accent/20 min-w-[220px]">
                    <p className="text-xs text-muted-foreground mb-1">Today's Pickup Token</p>
                    <p className="text-3xl font-semibold tracking-widest flex items-center gap-2">
                      <KeyRound size={22} /> {pickupToken}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Refreshes every 24 hours.</p>
                  </div>

                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Pre-authorize to flag this student as Ready for Collection in the teacher pickup app.
                    </p>
                    <Button
                      variant={isPreAuthorizedToday ? 'secondary' : 'primary'}
                      onClick={() => {
                        setPreAuthorizedStudentIds((prev) => ({ ...prev, [activeStudent.id]: !isPreAuthorizedToday }));
                        window.alert(
                          !isPreAuthorizedToday
                            ? 'Student flagged as Ready for Collection in Teacher Pickup App.'
                            : 'Pickup pre-authorization removed for today.',
                        );
                      }}
                    >
                      <ShieldCheck size={16} /> {isPreAuthorizedToday ? 'Pre-Authorized' : 'Pre-Authorize Today\'s Pickup'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Departure History (Last 10)">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date & Time</th>
                        <th className="text-left py-2">Method</th>
                        <th className="text-left py-2">Authorized By</th>
                        <th className="text-left py-2">Collector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedDepartureHistory.map((entry) => {
                        const dt = new Date(entry.dateTime);
                        return (
                          <tr key={entry.id} className="border-b">
                            <td className="py-3">{dt.toLocaleDateString(undefined, { weekday: 'long' })}, {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="py-3">{entry.method}</td>
                            <td className="py-3">{entry.authorizedBy}</td>
                            <td className="py-3">{entry.collector}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Transport Preferences & Bus Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Default return-home mode</p>
                    <select
                      value={activeTransportPreference}
                      onChange={(event) => {
                        const nextMode = event.target.value as TransportMode;
                        setTransportPreferenceOverrides((prev) => ({ ...prev, [activeStudent.id]: nextMode }));
                        window.alert(`Transport preference changed to ${nextMode}. Teacher Daily Log has been notified.`);
                      }}
                      className="w-full p-2 border border-border rounded-lg bg-input-background"
                    >
                      <option value="School Bus">School Bus</option>
                      <option value="Parent Pickup">Parent Pickup</option>
                      <option value="Walk Home">Walk Home</option>
                      <option value="Private Driver">Private Driver</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    {activeTransportPreference === 'School Bus' ? (
                      <>
                        <p className="flex items-center gap-2"><Bus size={16} /> {activeTransportPortal.busDetails?.routeId ?? 'Route not assigned'}</p>
                        <p className="flex items-center gap-2"><Clock3 size={16} /> {activeTransportPortal.busDetails?.eta ?? 'ETA unavailable'}</p>
                        <div className="h-28 rounded-lg border border-dashed border-border bg-accent/20 flex items-center justify-center text-sm text-muted-foreground">
                          <MapPinned size={16} className="mr-2" /> Live Bus Tracking activates 15 minutes before departure.
                        </div>
                      </>
                    ) : (
                      <div className="h-28 rounded-lg border bg-accent/20 flex items-center justify-center text-sm text-muted-foreground">
                        <Car size={16} className="mr-2" /> Non-bus mode selected. Gate team follows the updated pickup channel.
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'communications' && (
            <>
              <Card title="Unified Inbox (Message Center)">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                  <div className="lg:col-span-2 relative">
                    <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={communicationsSearch}
                      onChange={(event) => setCommunicationsSearch(event.target.value)}
                      placeholder="Search by subject or sender"
                      className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-input-background"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={communicationsHighPriorityOnly}
                      onChange={(event) => setCommunicationsHighPriorityOnly(event.target.checked)}
                    />
                    High Priority
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={communicationsDateFrom}
                      onChange={(event) => setCommunicationsDateFrom(event.target.value)}
                      className="w-full py-2 px-2 border border-border rounded-lg bg-input-background"
                    />
                    <input
                      type="date"
                      value={communicationsDateTo}
                      onChange={(event) => setCommunicationsDateTo(event.target.value)}
                      className="w-full py-2 px-2 border border-border rounded-lg bg-input-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredCommunications.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => openMessage(msg)}
                      className={`w-full text-left border rounded-lg p-3 hover:bg-accent ${msg.isRead ? '' : 'font-semibold'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!msg.isRead && <span className="text-blue-600">🔵</span>}
                          {msg.priority === 'high' && <span className="text-red-600">🔴!</span>}
                          <span>{msg.subject}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {msg.senderName} · {msg.senderRole}
                      </p>
                    </button>
                  ))}
                </div>

                {filteredCommunications.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">No messages match this filter.</p>
                )}
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card title="Public Announcements (Notice Board)" className="xl:col-span-2">
                  <div className="space-y-3">
                    {sortedAnnouncements.map((ann) => (
                      <div key={ann.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium flex items-center gap-2">
                            <Megaphone size={16} /> {ann.title}
                          </p>
                          {ann.priority === 'high' && <Badge variant="rejected">High Priority</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ann.body}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleString()}</span>
                          {ann.whatsappUrl && (
                            <Button size="sm" variant="outline" onClick={() => window.alert('Opening class WhatsApp link...')}>
                              Join Class WhatsApp Group
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Notification Command Center">
                  <p className="text-xs text-muted-foreground mb-3">
                    Preferences are saved to ParentProfile in localStorage.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px]">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="py-2">Event</th>
                          <th className="py-2">Email</th>
                          <th className="py-2">SMS</th>
                          <th className="py-2">In-App Push</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            ['highPriorityAlerts', 'High Priority Alerts'],
                            ['attendanceAlerts', 'Attendance Alerts'],
                            ['paymentReminders', 'Payment Reminders'],
                            ['medicationHealth', 'Medication/Health'],
                          ] as Array<[keyof GuardianNotificationPreferences, string]>
                        ).map(([eventKey, label]) => (
                          <tr key={eventKey} className="border-b">
                            <td className="py-2 text-sm">{label}</td>
                            <td className="py-2">
                              <input
                                type="checkbox"
                                checked={notificationPreferences[eventKey].email}
                                onChange={(event) => updateNotificationPreference(eventKey, 'email', event.target.checked)}
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="checkbox"
                                checked={notificationPreferences[eventKey].sms}
                                onChange={(event) => updateNotificationPreference(eventKey, 'sms', event.target.checked)}
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="checkbox"
                                checked={notificationPreferences[eventKey].inAppPush}
                                onChange={(event) => updateNotificationPreference(eventKey, 'inAppPush', event.target.checked)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'subscription' && (
            <>
              <Card title="Subscription Status">
                <div className="space-y-3">
                  {activeSubscription.status === 'Trial' && (
                    <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
                      Free trial: {trialCountdown?.days ?? 0} days {trialCountdown?.hours ?? 0} hours remaining.
                    </div>
                  )}
                  {activeSubscription.status === 'Active' && (
                    <div className="p-3 rounded-lg border border-green-300 bg-green-50 text-green-800">
                      Subscription active until{' '}
                      {activeSubscription.activeUntil
                        ? new Date(activeSubscription.activeUntil).toLocaleString()
                        : 'date not set'}
                      .
                    </div>
                  )}
                  {activeSubscription.status === 'Expired' && (
                    <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-800">
                      Access expired - subscribe now to continue.
                    </div>
                  )}
                  {activeSubscription.status === 'Pending Confirmation' && (
                    <div className="p-3 rounded-lg border border-orange-300 bg-orange-50 text-orange-900">
                      Your payment is being verified. Access will be restored within 24 hours.
                    </div>
                  )}
                </div>
              </Card>

              <Card title="Payment History">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Sender Name</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSubscription.paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="py-3">{new Date(payment.date).toLocaleString()}</td>
                          <td className="py-3">{payment.senderName ?? 'N/A'}</td>
                          <td className="py-3">₦{payment.amount.toLocaleString()}</td>
                          <td className="py-3">
                            {payment.status === 'paid' && <Badge variant="approved">Approved</Badge>}
                            {payment.status === 'pending_confirmation' && <Badge variant="pending">Pending</Badge>}
                            {payment.status === 'failed' && <Badge variant="rejected">Rejected</Badge>}
                          </td>
                          <td className="py-3">
                            {payment.receipt ? (
                              <button
                                onClick={() => setSelectedPaymentReceipt(payment)}
                                className="inline-flex items-center gap-2 rounded border px-2 py-1 hover:bg-accent"
                              >
                                {payment.receipt.mimeType.startsWith('image/') ? (
                                  <img
                                    src={payment.receipt.dataUrl}
                                    alt="Receipt thumbnail"
                                    className="h-10 w-10 rounded object-cover border"
                                  />
                                ) : (
                                  <FileText size={16} className="text-muted-foreground" />
                                )}
                                <span className="text-xs">View receipt</span>
                              </button>
                            ) : (
                              <span className="text-sm text-muted-foreground">No receipt</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {activeSubscription.paymentHistory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-sm text-muted-foreground">
                            No payment records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {shouldShowPaymentSection && (
                <Card title="Make a Payment">
                  <div className="space-y-4">
                    <div className="rounded-lg border p-3 bg-accent/20">
                      <p className="text-sm font-medium mb-2">Bank transfer instructions</p>
                      <p className="text-sm">Bank: Your Bank Name</p>
                      <p className="text-sm">Account name: Your Platform Name</p>
                      <p className="text-sm">Account number: Your Account Number</p>
                      <p className="text-sm mt-2 text-muted-foreground">
                        Reference: Please use your registered email address or phone number.
                      </p>
                    </div>

                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsReceiptDragActive(true);
                      }}
                      onDragLeave={() => setIsReceiptDragActive(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsReceiptDragActive(false);
                        onReceiptFileSelected(event.dataTransfer.files?.[0] ?? null);
                      }}
                      className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
                        isReceiptDragActive ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-medium">Upload transfer receipt</p>
                          <p className="text-sm text-muted-foreground">Drag and drop or choose PNG, JPG, or PDF file.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                          <Upload size={14} /> Select file
                          <input
                            type="file"
                            accept="image/png,image/jpeg,application/pdf"
                            className="hidden"
                            onChange={(event) => onReceiptFileSelected(event.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>

                      {activeReceiptDraft && (
                        <div className="mt-3 p-3 rounded border bg-background flex items-center gap-3">
                          {activeReceiptDraft.mimeType.startsWith('image/') ? (
                            <img
                              src={activeReceiptDraft.dataUrl}
                              alt="Selected receipt"
                              className="h-16 w-16 rounded object-cover border"
                            />
                          ) : (
                            <FileText size={20} className="text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{activeReceiptDraft.name}</p>
                            <p className="text-xs text-muted-foreground">New receipt ready for submission.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button onClick={submitReceiptForConfirmation} disabled={!activeReceiptDraft}>
                        Submit receipt for confirmation
                      </Button>
                      {receiptSubmissionMessage && <p className="text-sm text-green-700">{receiptSubmissionMessage}</p>}
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card title="Receipts Upload & Verification">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <input
                        type="number"
                        value={activeReceiptAmount}
                        onChange={(event) =>
                          setReceiptAmountByStudent((prev) => ({ ...prev, [activeStudent.id]: event.target.value }))
                        }
                        className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sender's Name</label>
                      <input
                        value={activeReceiptSenderName}
                        onChange={(event) =>
                          setReceiptSenderNameByStudent((prev) => ({ ...prev, [activeStudent.id]: event.target.value }))
                        }
                        className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
                        placeholder="Name on transfer account"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Receipt Status</label>
                      <select
                        value={activeReceiptStatus}
                        onChange={(event) =>
                          setReceiptStatusByStudent((prev) => ({
                            ...prev,
                            [activeStudent.id]: event.target.value as 'pending' | 'approved' | 'rejected',
                          }))
                        }
                        className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                      <Upload size={14} /> Upload Receipt
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        className="hidden"
                        onChange={(event) => onReceiptFileSelected(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <Button
                      onClick={submitReceiptForConfirmation}
                      disabled={!activeReceiptDraft || !activeReceiptAmount || !activeReceiptSenderName.trim()}
                    >
                      Submit Receipt
                    </Button>
                    {receiptSubmissionMessage && <p className="text-sm text-green-700">{receiptSubmissionMessage}</p>}
                  </div>
                </Card>

                <Card title="Customer Support">
                  <div className="space-y-2 text-sm">
                    <p>Need help with receipts or subscription verification? Contact support below.</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('mailto:support@yourplatform.com?subject=Subscription%20Support', '_blank')}
                      >
                        Email Support
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('https://wa.me/2348000000000', '_blank')}
                      >
                        WhatsApp Support
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'finance' && (
            <Card title="Finance Status">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Receipt size={16} /> Outstanding Balance
                  </span>
                  <span className={activeStudent.outstandingBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    ₦{activeStudent.outstandingBalance.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Data source: Bursar Ledger sync at {new Date(activeStudent.sourceSync.bursarLedger).toLocaleString()}.
                </p>
                <div className="pt-1">
                  <Button size="sm" variant="outline" onClick={() => setIsViewingFinanceDetails(true)}>
                    View More
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'attendance' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <Card>
                  <p className="text-sm text-muted-foreground">Present (This Term)</p>
                  <p className="text-3xl font-semibold mt-1">{attendanceSummary.present}</p>
                </Card>
                <Card>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-3xl font-semibold mt-1 text-red-600">{attendanceSummary.absent}</p>
                </Card>
                <Card>
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="text-3xl font-semibold mt-1 text-yellow-600">{attendanceSummary.late}</p>
                </Card>
                <Card>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-3xl font-semibold mt-1">{attendanceSummary.rate.toFixed(0)}%</p>
                </Card>
                <Card>
                  <p className="text-sm text-muted-foreground">Perfect Attendance</p>
                  {attendanceSummary.perfect ? (
                    <Badge variant="approved" className="mt-2">Perfect Attendance</Badge>
                  ) : (
                    <Badge variant="pending" className="mt-2">In Progress</Badge>
                  )}
                </Card>
              </div>

              <Card
                title="Attendance Calendar"
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const prev = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1);
                        setSelectedAttendanceMonth(formatMonthKey(prev));
                      }}
                    >
                      Prev
                    </Button>
                    <span className="text-sm font-medium min-w-[120px] text-center">
                      {calendarMonthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1);
                        setSelectedAttendanceMonth(formatMonthKey(next));
                      }}
                    >
                      Next
                    </Button>
                  </div>
                }
              >
                <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center py-1">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="h-16 rounded-md border border-transparent" />;
                    }
                    const dateKey = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
                    const record = attendanceDaysByDate.get(dateKey);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isFuture = date.getTime() > ATTENDANCE_FIXED_NOW.getTime();

                    let cellClass = 'bg-white border-border';
                    if (record?.status === 'present') {
                      cellClass = 'bg-green-100 border-green-200';
                    } else if (record?.status === 'absent') {
                      cellClass = 'bg-red-100 border-red-200';
                    } else if (record?.status === 'late') {
                      cellClass = 'bg-yellow-100 border-yellow-200';
                    } else if (record?.status === 'no_school' || isWeekend) {
                      cellClass = 'bg-gray-100 border-gray-200';
                    } else if (isFuture) {
                      cellClass = 'bg-white border-border';
                    }

                    return (
                      <button
                        key={dateKey}
                        onClick={() => {
                          const fallback: AttendanceDayLog = {
                            date: dateKey,
                            status: record?.status ?? (isWeekend ? 'no_school' : isFuture ? 'no_data' : 'no_data'),
                            arrivalTime: record?.arrivalTime,
                            departureTime: record?.departureTime,
                            teacherNote: record?.teacherNote,
                          };
                          setSelectedAttendanceDay(record ?? fallback);
                        }}
                        className={`h-16 rounded-md border p-1 text-left text-sm ${cellClass}`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Green: present, Red: absent, Yellow: late, Gray: no school, White: no data yet.
                </p>
              </Card>

              <Card title="Attendance Trend (Weekly Rate)">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={activeAttendanceTerm?.weeklyTrend ?? []}
                      onClick={(state: { activeLabel?: string } | undefined) => {
                        if (state?.activeLabel) {
                          setSelectedAttendanceWeek(state.activeLabel);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="weekLabel" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line dataKey="rate" stroke="#0d9488" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {selectedAttendanceWeekDetail && (
                  <div className="mt-3 p-3 border rounded-lg bg-accent/40">
                    <p className="font-medium">{selectedAttendanceWeekDetail.weekLabel} details</p>
                    <p className="text-sm text-muted-foreground">
                      Present: {selectedAttendanceWeekDetail.present}, Absent: {selectedAttendanceWeekDetail.absent}, Late: {selectedAttendanceWeekDetail.late}, Rate: {selectedAttendanceWeekDetail.rate}%
                    </p>
                  </div>
                )}
              </Card>

              <Card
                title="Behavior Log"
                action={
                  <select
                    value={behaviorFilter}
                    onChange={(event) => setBehaviorFilter(event.target.value as 'All' | BehaviorType)}
                    className="p-2 border border-border rounded-lg bg-input-background text-sm"
                  >
                    <option value="All">All</option>
                    <option value="Positive">Positive</option>
                    <option value="Needs improvement">Needs improvement</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                }
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Only notes flagged as parent-visible are displayed. Private notes are excluded.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Teacher</th>
                        <th className="text-left py-2">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBehaviorEvents.map((entry) => (
                        <tr key={entry.id} className="border-b">
                          <td className="py-2">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="py-2">{entry.type}</td>
                          <td className="py-2 text-muted-foreground">{entry.teacherName}</td>
                          <td className="py-2">{entry.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visibleBehaviorEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">No behavior notes match this filter.</p>
                )}
              </Card>

              <Card title="Behavior Insights">
                <div className="space-y-2 text-sm">
                  <p>
                    Most frequent positive: <span className="font-medium">{behaviorInsights.mostFrequentPositive}</span>
                  </p>
                  <p>
                    Most frequent concern: <span className="font-medium">{behaviorInsights.mostFrequentConcern}</span>
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-background/75 backdrop-blur-[1px] rounded-lg border border-border flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <h3 className="text-xl font-semibold mb-2">Renew to Continue</h3>
              <p className="text-muted-foreground mb-4">
                Overview and Subscription remain visible, but academic and school operation tabs are locked while your subscription is inactive.
              </p>
              <Button>Renew Now</Button>
            </div>
          </div>
        )}
      </div>

      <Card className="bg-muted/30">
        <p className="text-sm font-medium mb-2">Data Integrity & Sync</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <BookOpen size={14} /> Teacher Daily Log: {new Date(activeStudent.sourceSync.teacherDailyLog).toLocaleString()}
          </p>
          <p className="flex items-center gap-2">
            <Receipt size={14} /> Bursar Ledger: {new Date(activeStudent.sourceSync.bursarLedger).toLocaleString()}
          </p>
          <p className="flex items-center gap-2">
            <TrendingUp size={14} /> Assessment Store: {new Date(activeStudent.sourceSync.assessmentStore).toLocaleString()}
          </p>
        </div>
      </Card>

      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.summary ?? 'Activity Detail'}
        footer={<Button onClick={() => setSelectedEvent(null)}>Close</Button>}
      >
        {selectedEvent && (
          <div className="space-y-3">
            <p>
              <span className="font-medium">Type:</span> {getTimelineStyle(selectedEvent.type).label}
            </p>
            <p>
              <span className="font-medium">Time:</span> {new Date(selectedEvent.timestamp).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Actor:</span> {selectedEvent.actor}
            </p>
            <p className="text-muted-foreground">{selectedEvent.detail}</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={selectedSubject !== null}
        onClose={() => setSelectedSubject(null)}
        title={selectedSubject ? `${selectedSubject.subject} - Assessment Details` : 'Subject Details'}
        footer={<Button onClick={() => setSelectedSubject(null)}>Close</Button>}
      >
        {selectedSubject && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Assessment</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Score</th>
                    <th className="text-right py-2">Class Avg</th>
                    <th className="text-left py-2">Teacher Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubject.assessments.map((assessment) => (
                    <tr key={`${assessment.date}-${assessment.assessmentName}`} className="border-b">
                      <td className="py-2">{new Date(assessment.date).toLocaleDateString()}</td>
                      <td className="py-2">{assessment.assessmentName}</td>
                      <td className="py-2">{assessment.type}</td>
                      <td className="py-2 text-right">{assessment.score}%</td>
                      <td className="py-2 text-right">
                        {assessment.classAverage !== undefined ? `${assessment.classAverage}%` : 'N/A'}
                      </td>
                      <td className="py-2 text-sm text-muted-foreground">{assessment.teacherComment ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={selectedSubject.assessments.map((assessment) => ({
                    date: new Date(assessment.date).toLocaleDateString(),
                    score: assessment.score,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line dataKey="score" stroke="#0f766e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={selectedAttendanceDay !== null}
        onClose={() => setSelectedAttendanceDay(null)}
        title={selectedAttendanceDay ? `Attendance Detail - ${new Date(selectedAttendanceDay.date).toLocaleDateString()}` : 'Attendance Detail'}
        footer={<Button onClick={() => setSelectedAttendanceDay(null)}>Close</Button>}
      >
        {selectedAttendanceDay && (
          <div className="space-y-2">
            <p>
              <span className="font-medium">Status:</span> {selectedAttendanceDay.status}
            </p>
            <p>
              <span className="font-medium">Arrival Time:</span> {selectedAttendanceDay.arrivalTime ?? 'Not recorded'}
            </p>
            <p>
              <span className="font-medium">Departure Time:</span> {selectedAttendanceDay.departureTime ?? 'Not recorded'}
            </p>
            <p>
              <span className="font-medium">Teacher Note:</span> {selectedAttendanceDay.teacherNote ?? 'No note provided'}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage?.subject ?? 'Message Detail'}
        footer={<Button onClick={() => setSelectedMessage(null)}>Close</Button>}
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium">From:</span> {selectedMessage.senderName} ({selectedMessage.senderRole})
              </p>
              <p>
                <span className="font-medium">Sent:</span> {new Date(selectedMessage.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="border rounded-lg p-3 bg-accent/20 whitespace-pre-wrap text-sm">
              {selectedMessage.content}
            </div>

            {selectedMessage.repliesEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reply to School</label>
                <textarea
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  placeholder="Type your response here"
                  rows={4}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                />
                <div className="flex justify-end">
                  <Button onClick={sendReply}>Send</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={selectedPaymentReceipt !== null}
        onClose={() => setSelectedPaymentReceipt(null)}
        title={selectedPaymentReceipt?.receipt?.name ?? 'Receipt Preview'}
        footer={<Button onClick={() => setSelectedPaymentReceipt(null)}>Close</Button>}
      >
        {selectedPaymentReceipt?.receipt && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {new Date(selectedPaymentReceipt.date).toLocaleString()} - ₦{selectedPaymentReceipt.amount.toLocaleString()}
            </p>
            {selectedPaymentReceipt.receipt.mimeType.startsWith('image/') ? (
              <img
                src={selectedPaymentReceipt.receipt.dataUrl}
                alt="Full receipt"
                className="w-full max-h-[60vh] object-contain rounded border"
              />
            ) : (
              <iframe
                src={selectedPaymentReceipt.receipt.dataUrl}
                title="Receipt PDF"
                className="w-full h-[60vh] rounded border"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}