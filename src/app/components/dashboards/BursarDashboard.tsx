import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import {
  AlertCircle,
  AlertTriangle,
  BadgePercent,
  BellRing,
  CheckCheck,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  History,
  Link,
  Link2Off,
  List,
  PlusCircle,
  Printer,
  PieChart,
  Receipt,
  Search,
  ShieldCheck,
  Filter,
  TrendingUp,
  Trash2,
  UploadCloud,
  UserCog,
  UserCheck,
  UserPlus,
  XCircle,
  Clock,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type FeeItemCatalog,
  type FeeItemStatus,
  approveFeeItem,
  canEditFeeItem,
  feeCatalogSeed,
  loadFeeCatalog,
  rejectFeeItem,
  saveFeeCatalog,
  submitForApproval,
  subscribeFeeCatalogUpdates,
  withdrawApproval,
} from '../../state/feeCatalogStore';

type ReceiptStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'duplicate';

type ReceiptAllocation = {
  feeItemId: number;
  amount: number;
};

type ReceiptRecord = {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  className: string;
  term: string;
  parentName: string;
  declaredAmount: number;
  extractedAmount: number;
  verifiedAmount: number;
  parentEnteredDate: string;
  uploadDate: string;
  referenceNumber: string;
  receiptUrl: string;
  mismatch: boolean;
  mismatchReason: string | null;
  status: ReceiptStatus;
  allocations: ReceiptAllocation[];
  partialFlag: boolean;
  remainingBalance: number;
  bursarComment: string;
  rejectionReason: string;
  processedAt: string | null;
  verifiedByBank?: boolean;
};

type FeeBalanceItem = {
  feeItemId: number;
  name: string;
  term: string;
  dueDate: string;
  due: number;
  paid: number;
  balance: number;
};

type StudentLedgerRecord = {
  studentId: number;
  studentCode: string;
  name: string;
  className: string;
  feeItems: FeeBalanceItem[];
  lastPaymentDate: string | null;
};

type AdjustmentType = 'Discount' | 'Waiver' | 'Fine' | 'Error Correction';

type AdjustmentEntry = {
  id: number;
  studentId: number;
  term: string;
  amount: number;
  type: AdjustmentType;
  direction: 'credit' | 'debit';
  reason: string;
  createdAt: string;
};

type RemainingPerItem = {
  feeItemId: number;
  name: string;
  term: string;
  dueDate: string;
  due: number;
  paid: number;
  remaining: number;
  settled: boolean;
};

type CollectionStatus = 'partial' | 'overdue';

type CollectionRow = {
  studentId: number;
  studentName: string;
  studentCode: string;
  className: string;
  term: string;
  feeItemId: number;
  feeItemName: string;
  dueDate: string;
  totalDue: number;
  amountPaid: number;
  remainingBalance: number;
  lastPaymentDate: string | null;
  status: CollectionStatus;
};

type BankTransaction = {
  id: string;
  date: string;
  amount: number;
  reference: string;
  description: string;
  matchedReceiptId: number | null;
  matchedManually: boolean;
};

type AgeingViewMode = 'class' | 'student';

type AgeingBucketRow = {
  label: string;
  current: number;
  delinquent: number;
  critical: number;
};

type FinancialAuditActionType =
  | 'approve_receipt'
  | 'reject_receipt'
  | 'flag_receipt'
  | 'create_fee_item'
  | 'update_fee_item'
  | 'manual_adjustment'
  | 'delete_item'
  | 'bulk_approve_receipts'
  | 'bulk_reject_receipts'
  | 'mark_duplicate'
  | 'toggle_fee_item_status'
  | 'assign_fee_items'
  | 'resolve_collection'
  | 'bank_auto_match'
  | 'bank_manual_link'
  | 'create_virtual_receipt';

type FinancialAuditActorRole = 'Bursar' | 'Admin';

type FinancialAuditEntry = {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: FinancialAuditActorRole;
  actionType: FinancialAuditActionType;
  description: string;
  studentId: number | null;
  studentName: string | null;
  metadata: {
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
  };
  riskLevel: 'low' | 'high';
};

type LedgerStatus = 'paid_full' | 'partial' | 'unpaid' | 'overdue';

type ComputedLedgerRow = {
  studentId: number;
  studentCode: string;
  name: string;
  className: string;
  term: string;
  totalDue: number;
  totalPaid: number;
  creditAdjustments: number;
  debitAdjustments: number;
  balance: number;
  status: LedgerStatus;
  lastPaymentDate: string | null;
  dueDate: string | null;
  remainingPerItem: RemainingPerItem[];
  approvedReceipts: ReceiptRecord[];
  adjustments: AdjustmentEntry[];
};

const RECEIPTS_STORAGE_KEY = 'bursar-receipts-v3';
const LEDGER_STORAGE_KEY = 'bursar-ledger-v3';
const ADJUSTMENTS_STORAGE_KEY = 'bursar-adjustments-v1';
const FINANCIAL_LOGS_STORAGE_KEY = 'financial_logs';

const financialAuditSeed: FinancialAuditEntry[] = [
  {
    id: 'fal-seed-1',
    timestamp: '2026-04-08T10:32:00',
    userId: 'u-bursar-001',
    userName: 'Ms. Lee',
    userRole: 'Bursar',
    actionType: 'approve_receipt',
    description: "Approved receipt #1 for N45,000; allocated to 'Tuition Fee' and 'Lab Fee' for Sarah Johnson.",
    studentId: 1,
    studentName: 'Sarah Johnson',
    metadata: {
      oldValue: { status: 'pending', balance: 45000 },
      newValue: { status: 'approved', balance: 0 },
    },
    riskLevel: 'low',
  },
  {
    id: 'fal-seed-2',
    timestamp: '2026-04-08T13:05:00',
    userId: 'u-admin-001',
    userName: 'Israel Macaulay',
    userRole: 'Admin',
    actionType: 'manual_adjustment',
    description: 'Applied manual debit adjustment of N1,500 for Amara Collins (Late lab equipment replacement fee).',
    studentId: 3,
    studentName: 'Amara Collins',
    metadata: {
      oldValue: { balance: 40000 },
      newValue: { balance: 41500, adjustmentType: 'Fine' },
    },
    riskLevel: 'high',
  },
];

const financialActionLabels: Record<FinancialAuditActionType, string> = {
  approve_receipt: 'Approve Receipt',
  reject_receipt: 'Reject Receipt',
  flag_receipt: 'Flag Receipt',
  create_fee_item: 'Create Fee Item',
  update_fee_item: 'Update Fee Item',
  manual_adjustment: 'Manual Adjustment',
  delete_item: 'Delete Item',
  bulk_approve_receipts: 'Bulk Approve',
  bulk_reject_receipts: 'Bulk Reject',
  mark_duplicate: 'Mark Duplicate',
  toggle_fee_item_status: 'Toggle Fee Item Status',
  assign_fee_items: 'Bulk Fee Assignment',
  resolve_collection: 'Resolve Collection Row',
  bank_auto_match: 'Auto Match Bank Transaction',
  bank_manual_link: 'Manual Bank Link',
  create_virtual_receipt: 'Create Virtual Receipt',
};

const highRiskActions = new Set<FinancialAuditActionType>(['manual_adjustment', 'delete_item', 'resolve_collection']);

const classDirectory = [
  { id: 1, name: 'Math 10A' },
  { id: 2, name: 'Science 9B' },
  { id: 3, name: 'SS1A' },
];

const termDirectory = [
  { id: 1, name: 'Term 2, 2026' },
  { id: 2, name: 'Term 3, 2026' },
];

const receiptSeed: ReceiptRecord[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Sarah Johnson',
    studentCode: 'STD-001',
    className: 'Math 10A',
    term: 'Term 3, 2026',
    parentName: 'Mrs. Johnson',
    declaredAmount: 45000,
    extractedAmount: 45000,
    verifiedAmount: 45000,
    parentEnteredDate: '2026-04-05',
    uploadDate: '2026-04-05',
    referenceNumber: 'TRX-889102',
    receiptUrl: '#',
    mismatch: false,
    mismatchReason: null,
    status: 'approved',
    allocations: [
      { feeItemId: 1, amount: 35000 },
      { feeItemId: 2, amount: 10000 },
    ],
    partialFlag: false,
    remainingBalance: 0,
    bursarComment: 'Matched and cleared.',
    rejectionReason: '',
    processedAt: '2026-04-05T14:30:00',
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Michael Brown',
    studentCode: 'STD-002',
    className: 'Science 9B',
    term: 'Term 3, 2026',
    parentName: 'Mr. Brown',
    declaredAmount: 40000,
    extractedAmount: 42000,
    verifiedAmount: 42000,
    parentEnteredDate: '2026-04-06',
    uploadDate: '2026-04-06',
    referenceNumber: 'TRX-778410',
    receiptUrl: '#',
    mismatch: true,
    mismatchReason: 'Declared amount differs from extracted slip amount.',
    status: 'flagged',
    allocations: [],
    partialFlag: false,
    remainingBalance: 42000,
    bursarComment: 'Flagged by OCR mismatch rule.',
    rejectionReason: '',
    processedAt: null,
  },
  {
    id: 3,
    studentId: 3,
    studentName: 'Amara Collins',
    studentCode: 'STD-003',
    className: 'SS1A',
    term: 'Term 3, 2026',
    parentName: 'Mrs. Collins',
    declaredAmount: 30000,
    extractedAmount: 30000,
    verifiedAmount: 30000,
    parentEnteredDate: '2026-04-08',
    uploadDate: '2026-04-08',
    referenceNumber: 'TRX-221904',
    receiptUrl: '#',
    mismatch: false,
    mismatchReason: null,
    status: 'pending',
    allocations: [],
    partialFlag: false,
    remainingBalance: 30000,
    bursarComment: '',
    rejectionReason: '',
    processedAt: null,
  },
];

const ledgerSeed: StudentLedgerRecord[] = [
  {
    studentId: 1,
    studentCode: 'STD-001',
    name: 'Sarah Johnson',
    className: 'Math 10A',
    lastPaymentDate: '2026-04-05',
    feeItems: [
      { feeItemId: 1, name: 'Tuition Fee', term: 'Term 3, 2026', dueDate: '2026-03-15', due: 35000, paid: 35000, balance: 0 },
      { feeItemId: 2, name: 'Lab Fee', term: 'Term 3, 2026', dueDate: '2026-03-15', due: 10000, paid: 10000, balance: 0 },
    ],
  },
  {
    studentId: 2,
    studentCode: 'STD-002',
    name: 'Michael Brown',
    className: 'Science 9B',
    lastPaymentDate: '2026-03-30',
    feeItems: [
      { feeItemId: 1, name: 'Tuition Fee', term: 'Term 3, 2026', dueDate: '2026-03-15', due: 35000, paid: 30000, balance: 5000 },
      { feeItemId: 3, name: 'Sports Fee', term: 'Term 3, 2026', dueDate: '2026-03-15', due: 5000, paid: 0, balance: 5000 },
    ],
  },
  {
    studentId: 3,
    studentCode: 'STD-003',
    name: 'Amara Collins',
    className: 'SS1A',
    lastPaymentDate: null,
    feeItems: [
      { feeItemId: 1, name: 'Tuition Fee', term: 'Term 3, 2026', dueDate: '2026-03-15', due: 35000, paid: 0, balance: 35000 },
      { feeItemId: 3, name: 'Sports Fee', term: 'Term 3, 2026', dueDate: '2026-03-15', due: 5000, paid: 0, balance: 5000 },
    ],
  },
];

const adjustmentsSeed: AdjustmentEntry[] = [
  {
    id: 1,
    studentId: 2,
    term: 'Term 3, 2026',
    amount: 1000,
    type: 'Waiver',
    direction: 'credit',
    reason: 'Sibling discount approved by management.',
    createdAt: '2026-04-04T10:10:00',
  },
  {
    id: 2,
    studentId: 3,
    term: 'Term 3, 2026',
    amount: 1500,
    type: 'Fine',
    direction: 'debit',
    reason: 'Late lab equipment replacement fee.',
    createdAt: '2026-04-06T09:45:00',
  },
];

const parseStoredJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const isDateInCurrentWeek = (value: string | null) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - mondayOffset);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);
  return date >= weekStart && date < nextWeekStart;
};

const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsvText = (text: string) => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseCsvLine(line));
};

const parseBankDate = (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) return null;

  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const parseBankAmount = (rawValue: string) => {
  const normalized = rawValue.replace(/[^\d.-]/g, '');
  const amount = Number(normalized);
  if (Number.isNaN(amount)) return 0;
  return amount;
};

const classScopeLabel = (classId: number | null) => {
  if (classId === null) return 'All Classes';
  return classDirectory.find((entry) => entry.id === classId)?.name || `Class ${classId}`;
};

const sumAllocations = (allocations: ReceiptAllocation[]) => allocations.reduce((sum, entry) => sum + entry.amount, 0);

const buildAutoAllocation = (ledger: StudentLedgerRecord, amount: number, term: string) => {
  let remaining = amount;
  const allocations: ReceiptAllocation[] = [];

  for (const feeItem of ledger.feeItems.filter((entry) => entry.term === term)) {
    if (remaining <= 0) break;
    if (feeItem.balance <= 0) continue;
    const allocated = Math.min(feeItem.balance, remaining);
    allocations.push({ feeItemId: feeItem.feeItemId, amount: allocated });
    remaining -= allocated;
  }

  return allocations;
};

const applyAllocationsToLedger = (ledger: StudentLedgerRecord, allocations: ReceiptAllocation[]) => {
  const allocationMap = allocations.reduce<Record<number, number>>((acc, entry) => {
    acc[entry.feeItemId] = (acc[entry.feeItemId] || 0) + entry.amount;
    return acc;
  }, {});

  const nextFeeItems = ledger.feeItems.map((feeItem) => {
    const requested = allocationMap[feeItem.feeItemId] || 0;
    const applied = Math.min(requested, feeItem.balance);
    return {
      ...feeItem,
      paid: feeItem.paid + applied,
      balance: feeItem.balance - applied,
    };
  });

  return {
    ...ledger,
    feeItems: nextFeeItems,
    lastPaymentDate: new Date().toISOString().slice(0, 10),
  };
};

const statusBadge = (status: ReceiptStatus) => {
  if (status === 'approved') return { variant: 'approved' as const, text: 'Approved', className: '' };
  if (status === 'rejected') return { variant: 'rejected' as const, text: 'Rejected', className: '' };
  if (status === 'flagged') return { variant: 'default' as const, text: 'Flagged', className: 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-200' };
  if (status === 'duplicate') return { variant: 'default' as const, text: 'Duplicate', className: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-200' };
  return { variant: 'pending' as const, text: 'Pending', className: '' };
};

const feeItemStatusBadge = (status: FeeItemStatus) => {
  if (status === 'approved') return { variant: 'approved' as const, text: 'Approved' };
  if (status === 'pending_approval') return { variant: 'pending' as const, text: 'Pending Approval' };
  if (status === 'rejected') return { variant: 'rejected' as const, text: 'Rejected' };
  return { variant: 'default' as const, text: 'Draft' };
};

const ledgerStatusBadge = (status: LedgerStatus) => {
  if (status === 'paid_full') return { variant: 'approved' as const, text: 'Paid in Full', className: '' };
  if (status === 'partial') return { variant: 'pending' as const, text: 'Partially Paid', className: '' };
  if (status === 'overdue') return { variant: 'default' as const, text: 'Overdue', className: 'bg-rose-900 text-rose-100 border border-rose-700' };
  return { variant: 'rejected' as const, text: 'Unpaid', className: '' };
};

const getDefaultDirection = (type: AdjustmentType): 'credit' | 'debit' => {
  if (type === 'Discount' || type === 'Waiver') return 'credit';
  if (type === 'Fine') return 'debit';
  return 'credit';
};

export function BursarDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'ledger' | 'collections' | 'bank' | 'feeitems' | 'reports' | 'audit'>('queue');
  const [receipts, setReceipts] = useState<ReceiptRecord[]>(() => parseStoredJson(RECEIPTS_STORAGE_KEY, receiptSeed));
  const [ledgerRecords, setLedgerRecords] = useState<StudentLedgerRecord[]>(() => parseStoredJson(LEDGER_STORAGE_KEY, ledgerSeed));
  const [feeCatalog, setFeeCatalog] = useState<FeeItemCatalog[]>(() => loadFeeCatalog());
  const [feeItemStatusFilter, setFeeItemStatusFilter] = useState<'all' | FeeItemStatus>('all');
  const [adjustments, setAdjustments] = useState<AdjustmentEntry[]>(() => parseStoredJson(ADJUSTMENTS_STORAGE_KEY, adjustmentsSeed));
  const [financialLogs, setFinancialLogs] = useState<FinancialAuditEntry[]>(() => parseStoredJson(FINANCIAL_LOGS_STORAGE_KEY, financialAuditSeed));
  const [auditFilters, setAuditFilters] = useState({
    actorId: '',
    actionType: '',
    studentContext: '',
    startDate: '',
    endDate: '',
  });

  const [queueFilters, setQueueFilters] = useState({
    search: '',
    className: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const [ledgerFilters, setLedgerFilters] = useState({
    search: '',
    className: '',
    term: 'Term 3, 2026',
    status: '',
  });

  const [collectionFilters, setCollectionFilters] = useState({
    className: '',
    term: 'Term 3, 2026',
    minBalance: 0,
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [bankImportError, setBankImportError] = useState('');
  const [bankImportFileName, setBankImportFileName] = useState('');
  const [isBankDropZoneActive, setIsBankDropZoneActive] = useState(false);
  const [manualLinkTransactionId, setManualLinkTransactionId] = useState<string | null>(null);
  const [manualLinkReceiptId, setManualLinkReceiptId] = useState<number | null>(null);
  const [virtualReceiptTransactionId, setVirtualReceiptTransactionId] = useState<string | null>(null);
  const [virtualReceiptDraft, setVirtualReceiptDraft] = useState({
    studentName: '',
    className: '',
    term: 'Term 3, 2026',
    parentName: 'Offline Deposit',
  });
  const [reportsTerm, setReportsTerm] = useState('Term 3, 2026');
  const [ageingViewMode, setAgeingViewMode] = useState<AgeingViewMode>('class');

  const [selectedReceiptIds, setSelectedReceiptIds] = useState<number[]>([]);
  const [reviewReceiptId, setReviewReceiptId] = useState<number | null>(null);

  const [allocationDraft, setAllocationDraft] = useState<Record<number, number>>({});
  const [partialPaymentEnabled, setPartialPaymentEnabled] = useState(false);
  const [internalLog, setInternalLog] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const [expandedLedgerIds, setExpandedLedgerIds] = useState<number[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentTargetId, setAdjustmentTargetId] = useState<number | null>(null);
  const [adjustmentDraft, setAdjustmentDraft] = useState<{ amount: string; type: AdjustmentType; direction: 'credit' | 'debit'; reason: string }>({
    amount: '',
    type: 'Waiver',
    direction: 'credit',
    reason: '',
  });

  const [showFeeItemModal, setShowFeeItemModal] = useState(false);
  const [editingFeeItem, setEditingFeeItem] = useState<FeeItemCatalog | null>(null);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignClassId, setBulkAssignClassId] = useState<number | null>(null);
  const [bulkAssignFeeItemIds, setBulkAssignFeeItemIds] = useState<number[]>([]);
  const [feeItemDraft, setFeeItemDraft] = useState<{
    name: string;
    category: string;
    amount: string;
    termId: number;
    classId: number | null;
    dueDate: string;
    isCompulsory: boolean;
    isActive: boolean;
  }>({
    name: '',
    category: 'Academic',
    amount: '',
    termId: 2,
    classId: null,
    dueDate: '2026-03-15',
    isCompulsory: true,
    isActive: true,
  });

  const currentSessionActor = {
    userId: 'u-bursar-001',
    userName: 'Ms. Lee',
    userRole: 'Bursar' as FinancialAuditActorRole,
  };

  const updateFeeCatalog = (updater: (items: FeeItemCatalog[]) => FeeItemCatalog[]) => {
    setFeeCatalog((prev) => {
      const next = updater(prev);
      saveFeeCatalog(next);
      return next;
    });
  };

  const createAuditEntry = ({
    actionType,
    description,
    studentId,
    studentName,
    metadata,
    actor,
  }: {
    actionType: FinancialAuditActionType;
    description: string;
    studentId: number | null;
    studentName: string | null;
    metadata: { oldValue?: Record<string, unknown>; newValue?: Record<string, unknown> };
    actor?: { userId: string; userName: string; userRole: FinancialAuditActorRole };
  }) => {
    const sourceActor = actor || currentSessionActor;
    const entry: FinancialAuditEntry = {
      id: `fal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      userId: sourceActor.userId,
      userName: sourceActor.userName,
      userRole: sourceActor.userRole,
      actionType,
      description,
      studentId,
      studentName,
      metadata,
      riskLevel: highRiskActions.has(actionType) ? 'high' : 'low',
    };

    setFinancialLogs((prev) => [entry, ...prev]);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledgerRecords));
  }, [ledgerRecords]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FINANCIAL_LOGS_STORAGE_KEY, JSON.stringify(financialLogs));
  }, [financialLogs]);

  useEffect(() => {
    const unsubscribe = subscribeFeeCatalogUpdates(() => {
      setFeeCatalog(loadFeeCatalog());
    });

    return unsubscribe;
  }, []);

  const classOptions = Array.from(new Set(ledgerRecords.map((entry) => entry.className)));
  const termOptions = Array.from(new Set(feeCatalog.map((entry) => entry.term)));

  const reviewReceipt = useMemo(() => receipts.find((entry) => entry.id === reviewReceiptId) || null, [receipts, reviewReceiptId]);

  const filteredFeeCatalog = useMemo(
    () =>
      feeCatalog.filter(
        (item) =>
          item.isActive &&
          (feeItemStatusFilter === 'all' || item.status === feeItemStatusFilter),
      ),
    [feeCatalog, feeItemStatusFilter],
  );

  const reviewLedger = useMemo(() => {
    if (!reviewReceipt) return null;
    return ledgerRecords.find((entry) => entry.studentId === reviewReceipt.studentId) || null;
  }, [ledgerRecords, reviewReceipt]);

  const reviewAllocationList = useMemo(() => {
    if (!reviewLedger || !reviewReceipt) return [];
    return reviewLedger.feeItems.filter((feeItem) => feeItem.balance > 0 && feeItem.term === reviewReceipt.term);
  }, [reviewLedger, reviewReceipt]);

  const allocationSum = useMemo(
    () => Object.values(allocationDraft).reduce((sum, value) => sum + (Number.isNaN(value) ? 0 : value), 0),
    [allocationDraft],
  );

  const canApproveReviewedReceipt = useMemo(() => {
    if (!reviewReceipt) return false;
    if (reviewReceipt.status !== 'pending' && reviewReceipt.status !== 'flagged') return false;
    if (allocationSum <= 0) return false;
    if (allocationSum > reviewReceipt.verifiedAmount) return false;
    return true;
  }, [allocationSum, reviewReceipt]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      const searchable = `${receipt.studentName} ${receipt.className} ${receipt.parentName} ${receipt.studentCode}`.toLowerCase();
      if (queueFilters.search && !searchable.includes(queueFilters.search.toLowerCase())) return false;
      if (queueFilters.className && receipt.className !== queueFilters.className) return false;
      if (queueFilters.status && receipt.status !== queueFilters.status) return false;
      if (queueFilters.startDate && receipt.uploadDate < queueFilters.startDate) return false;
      if (queueFilters.endDate && receipt.uploadDate > queueFilters.endDate) return false;
      return true;
    });
  }, [queueFilters.className, queueFilters.endDate, queueFilters.search, queueFilters.startDate, queueFilters.status, receipts]);

  const pendingQueue = useMemo(() => receipts.filter((receipt) => receipt.status === 'pending'), [receipts]);

  const pendingReceiptsCount = pendingQueue.length;
  const mismatchFlags = receipts.filter((receipt) => receipt.mismatch && (receipt.status === 'pending' || receipt.status === 'flagged')).length;
  const weeklyApprovals = receipts.filter((receipt) => receipt.status === 'approved' && isDateInCurrentWeek(receipt.processedAt)).length;

  const ledgerRows = useMemo<ComputedLedgerRow[]>(() => {
    return ledgerRecords.map((ledger) => {
      const term = ledgerFilters.term;
      const termFeeItems = ledger.feeItems.filter((feeItem) => feeItem.term === term);

      const approvedReceipts = receipts
        .filter((receipt) => receipt.studentId === ledger.studentId && receipt.status === 'approved' && receipt.term === term)
        .sort((a, b) => new Date(b.processedAt || b.uploadDate).getTime() - new Date(a.processedAt || a.uploadDate).getTime());

      const approvedAllocationTotal = approvedReceipts.reduce((sum, receipt) => sum + sumAllocations(receipt.allocations), 0);

      const studentAdjustments = adjustments.filter((entry) => entry.studentId === ledger.studentId && entry.term === term);
      const creditAdjustments = studentAdjustments.filter((entry) => entry.direction === 'credit').reduce((sum, entry) => sum + entry.amount, 0);
      const debitAdjustments = studentAdjustments.filter((entry) => entry.direction === 'debit').reduce((sum, entry) => sum + entry.amount, 0);

      const totalDue = termFeeItems.reduce((sum, feeItem) => sum + feeItem.due, 0);
      const totalPaid = approvedAllocationTotal;

      const balance = totalDue - totalPaid - creditAdjustments + debitAdjustments;

      const dueDate = termFeeItems.length
        ? termFeeItems
            .map((feeItem) => feeItem.dueDate)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
        : null;

      const isOverdue = Boolean(dueDate && balance > 0 && new Date() > new Date(dueDate));

      let status: LedgerStatus = 'unpaid';
      if (balance <= 0 && totalDue > 0) status = 'paid_full';
      else if (isOverdue) status = 'overdue';
      else if (totalPaid > 0 || creditAdjustments > 0) status = 'partial';

      const lastPaymentDate = approvedReceipts[0]?.processedAt || approvedReceipts[0]?.uploadDate || ledger.lastPaymentDate;

      const remainingPerItem: RemainingPerItem[] = termFeeItems.map((feeItem) => ({
        feeItemId: feeItem.feeItemId,
        name: feeItem.name,
        term: feeItem.term,
        dueDate: feeItem.dueDate,
        due: feeItem.due,
        paid: feeItem.paid,
        remaining: feeItem.balance,
        settled: feeItem.balance <= 0,
      }));

      return {
        studentId: ledger.studentId,
        studentCode: ledger.studentCode,
        name: ledger.name,
        className: ledger.className,
        term,
        totalDue,
        totalPaid,
        creditAdjustments,
        debitAdjustments,
        balance,
        status,
        lastPaymentDate,
        dueDate,
        remainingPerItem,
        approvedReceipts,
        adjustments: studentAdjustments,
      };
    });
  }, [adjustments, ledgerFilters.term, ledgerRecords, receipts]);

  const filteredLedgerRows = useMemo(() => {
    return ledgerRows.filter((row) => {
      const searchable = `${row.name} ${row.studentCode}`.toLowerCase();
      if (ledgerFilters.search && !searchable.includes(ledgerFilters.search.toLowerCase())) return false;
      if (ledgerFilters.className && row.className !== ledgerFilters.className) return false;
      if (ledgerFilters.status && row.status !== ledgerFilters.status) return false;
      return true;
    });
  }, [ledgerFilters.className, ledgerFilters.search, ledgerFilters.status, ledgerRows]);

  const billingMetrics = useMemo(() => {
    const totalBilled = ledgerRows.reduce((sum, row) => sum + row.totalDue, 0);
    const totalCollected = ledgerRows.reduce((sum, row) => sum + row.totalPaid, 0);
    const collectionRate = totalBilled ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 0;
    return { totalBilled, totalCollected, collectionRate };
  }, [ledgerRows]);

  const reportMetrics = useMemo(() => {
    const rows = ledgerRecords.map((ledger) => {
      const termFeeItems = ledger.feeItems.filter((feeItem) => feeItem.term === reportsTerm);
      const invoiced = termFeeItems.reduce((sum, feeItem) => sum + feeItem.due, 0);

      const approvedAllocations = receipts
        .filter((receipt) => receipt.studentId === ledger.studentId && receipt.term === reportsTerm && receipt.status === 'approved')
        .reduce((sum, receipt) => {
          const allocated = receipt.allocations.reduce((allocationSum, allocation) => allocationSum + allocation.amount, 0);
          return sum + allocated;
        }, 0);

      return {
        studentId: ledger.studentId,
        studentName: ledger.name,
        studentCode: ledger.studentCode,
        className: ledger.className,
        invoiced,
        collected: approvedAllocations,
        lastPaymentDate:
          receipts
            .filter((receipt) => receipt.studentId === ledger.studentId && receipt.term === reportsTerm && receipt.status === 'approved')
            .sort((a, b) => new Date(b.processedAt || b.uploadDate).getTime() - new Date(a.processedAt || a.uploadDate).getTime())[0]?.processedAt ||
          ledger.lastPaymentDate,
      };
    });

    const totalFeesInvoiced = rows.reduce((sum, row) => sum + row.invoiced, 0);
    const totalCollected = rows.reduce((sum, row) => sum + row.collected, 0);
    const outstandingBalance = Math.max(0, totalFeesInvoiced - totalCollected);
    const collectionRate = totalFeesInvoiced > 0 ? Math.round((totalCollected / totalFeesInvoiced) * 1000) / 10 : 0;
    const unresolvedMismatches = receipts.filter(
      (receipt) =>
        receipt.term === reportsTerm &&
        receipt.mismatch &&
        (receipt.status === 'pending' || receipt.status === 'flagged'),
    ).length;

    return {
      rows,
      totalFeesInvoiced,
      totalCollected,
      outstandingBalance,
      collectionRate,
      unresolvedMismatches,
    };
  }, [ledgerRecords, receipts, reportsTerm]);

  const revenueByClassChartData = useMemo(() => {
    const grouped = reportMetrics.rows.reduce<Record<string, { collected: number; outstanding: number }>>((acc, row) => {
      const outstanding = Math.max(0, row.invoiced - row.collected);
      acc[row.className] = {
        collected: (acc[row.className]?.collected || 0) + row.collected,
        outstanding: (acc[row.className]?.outstanding || 0) + outstanding,
      };
      return acc;
    }, {});

    return Object.entries(grouped).map(([className, values]) => ({
      className,
      collected: values.collected,
      outstanding: values.outstanding,
    }));
  }, [reportMetrics.rows]);

  const ageingRows = useMemo<AgeingBucketRow[]>(() => {
    const today = new Date();

    const entries = ledgerRecords.flatMap((ledger) =>
      ledger.feeItems
        .filter((feeItem) => feeItem.term === reportsTerm && feeItem.balance > 0)
        .map((feeItem) => {
          const dueDate = new Date(feeItem.dueDate);
          const diffMs = today.getTime() - dueDate.getTime();
          const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          const label = ageingViewMode === 'class' ? ledger.className : `${ledger.name} (${ledger.studentCode})`;
          return { label, balance: feeItem.balance, daysOverdue };
        }),
    );

    const grouped = entries.reduce<Record<string, AgeingBucketRow>>((acc, entry) => {
      if (!acc[entry.label]) {
        acc[entry.label] = {
          label: entry.label,
          current: 0,
          delinquent: 0,
          critical: 0,
        };
      }

      if (entry.daysOverdue < 30) acc[entry.label].current += entry.balance;
      else if (entry.daysOverdue <= 60) acc[entry.label].delinquent += entry.balance;
      else acc[entry.label].critical += entry.balance;

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.current + b.delinquent + b.critical - (a.current + a.delinquent + a.critical));
  }, [ageingViewMode, ledgerRecords, reportsTerm]);

  const collectionRows = useMemo<CollectionRow[]>(() => {
    const now = new Date();

    return ledgerRecords.flatMap((ledger) =>
      ledger.feeItems
        .map((item) => {
          const matchingReceipts = receipts
            .filter((receipt) => receipt.studentId === ledger.studentId && receipt.status === 'approved' && receipt.term === item.term)
            .sort((a, b) => new Date(b.processedAt || b.uploadDate).getTime() - new Date(a.processedAt || a.uploadDate).getTime());

          const approvedPaid = matchingReceipts.reduce((sum, receipt) => {
            const allocated = receipt.allocations
              .filter((allocation) => allocation.feeItemId === item.feeItemId)
              .reduce((allocationSum, allocation) => allocationSum + allocation.amount, 0);
            return sum + allocated;
          }, 0);

          const remainingBalance = Math.max(0, item.due - approvedPaid);
          const itemPaymentHistory = matchingReceipts.filter((receipt) => receipt.allocations.some((allocation) => allocation.feeItemId === item.feeItemId));
          const lastPaymentDate = itemPaymentHistory[0]?.processedAt || itemPaymentHistory[0]?.uploadDate || null;
          const status: CollectionStatus = now > new Date(item.dueDate) ? 'overdue' : 'partial';

          return {
            studentId: ledger.studentId,
            studentName: ledger.name,
            studentCode: ledger.studentCode,
            className: ledger.className,
            term: item.term,
            feeItemId: item.feeItemId,
            feeItemName: item.name,
            dueDate: item.dueDate,
            totalDue: item.due,
            amountPaid: approvedPaid,
            remainingBalance,
            lastPaymentDate,
            status,
          };
        })
        .filter((row) => row.remainingBalance > 0),
    );
  }, [ledgerRecords, receipts]);

  const filteredCollectionRows = useMemo(() => {
    return collectionRows
      .filter((row) => {
        if (collectionFilters.className && row.className !== collectionFilters.className) return false;
        if (collectionFilters.term && row.term !== collectionFilters.term) return false;
        if (row.remainingBalance < collectionFilters.minBalance) return false;
        return true;
      })
      .sort((a, b) => b.remainingBalance - a.remainingBalance);
  }, [collectionFilters.className, collectionFilters.minBalance, collectionFilters.term, collectionRows]);

  const collectionSummary = useMemo(() => {
    const contextRows = collectionRows.filter((row) => {
      if (collectionFilters.className && row.className !== collectionFilters.className) return false;
      if (collectionFilters.term && row.term !== collectionFilters.term) return false;
      return true;
    });

    const totalOutstandingBalance = contextRows.reduce((sum, row) => sum + row.remainingBalance, 0);
    const affectedStudents = new Set(contextRows.map((row) => row.studentId)).size;
    const totalExpected = contextRows.reduce((sum, row) => sum + row.totalDue, 0);
    const totalCollected = contextRows.reduce((sum, row) => sum + row.amountPaid, 0);
    const progress = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 100;

    return {
      totalOutstandingBalance,
      affectedStudents,
      totalExpected,
      totalCollected,
      progress,
    };
  }, [collectionFilters.className, collectionFilters.term, collectionRows]);

  const maxCollectionBalance = useMemo(
    () => collectionRows.reduce((max, row) => Math.max(max, row.remainingBalance), 0),
    [collectionRows],
  );

  const autoMatchedReceiptByTransaction = useMemo(() => {
    const withinWindow = (bankDate: string, receiptDate: string) => {
      const oneDay = 1000 * 60 * 60 * 24;
      const bankTime = new Date(bankDate).getTime();
      const receiptTime = new Date(receiptDate).getTime();
      const diffDays = Math.abs(bankTime - receiptTime) / oneDay;
      return diffDays <= 2;
    };

    return bankTransactions.reduce<Record<string, ReceiptRecord | null>>((acc, transaction) => {
      if (transaction.matchedReceiptId) {
        acc[transaction.id] = receipts.find((receipt) => receipt.id === transaction.matchedReceiptId) || null;
        return acc;
      }

      const candidates = receipts
        .filter((receipt) => {
          const receiptDate = receipt.parentEnteredDate || receipt.uploadDate;
          return receipt.verifiedAmount === transaction.amount && withinWindow(transaction.date, receiptDate);
        })
        .sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (b.status === 'pending' && a.status !== 'pending') return 1;
          const aTime = new Date(a.parentEnteredDate || a.uploadDate).getTime();
          const bTime = new Date(b.parentEnteredDate || b.uploadDate).getTime();
          const txTime = new Date(transaction.date).getTime();
          return Math.abs(aTime - txTime) - Math.abs(bTime - txTime);
        });

      acc[transaction.id] = candidates[0] || null;
      return acc;
    }, {});
  }, [bankTransactions, receipts]);

  const unreconciledBankTransactions = useMemo(
    () => bankTransactions.filter((transaction) => !transaction.matchedReceiptId && !autoMatchedReceiptByTransaction[transaction.id]),
    [autoMatchedReceiptByTransaction, bankTransactions],
  );

  const pendingReceipts = useMemo(() => receipts.filter((receipt) => receipt.status === 'pending'), [receipts]);

  const mappedBankReceiptIds = useMemo(
    () => new Set(bankTransactions.map((transaction) => transaction.matchedReceiptId).filter((id): id is number => Boolean(id))),
    [bankTransactions],
  );

  const noPendingReceipts = pendingQueue.length === 0;

  const actorOptions = useMemo(() => {
    const seen = new Set<string>();
    return financialLogs.filter((entry) => {
      if (seen.has(entry.userId)) return false;
      seen.add(entry.userId);
      return true;
    });
  }, [financialLogs]);

  const filteredFinancialLogs = useMemo(() => {
    return financialLogs.filter((entry) => {
      if (auditFilters.actorId && entry.userId !== auditFilters.actorId) return false;
      if (auditFilters.actionType && entry.actionType !== auditFilters.actionType) return false;

      const studentSearchable = `${entry.studentName || ''} ${entry.studentId || ''}`.toLowerCase();
      if (auditFilters.studentContext && !studentSearchable.includes(auditFilters.studentContext.toLowerCase())) return false;

      const day = entry.timestamp.slice(0, 10);
      if (auditFilters.startDate && day < auditFilters.startDate) return false;
      if (auditFilters.endDate && day > auditFilters.endDate) return false;

      return true;
    });
  }, [auditFilters.actionType, auditFilters.actorId, auditFilters.endDate, auditFilters.startDate, auditFilters.studentContext, financialLogs]);

  const highRiskLogCount = useMemo(
    () => filteredFinancialLogs.filter((entry) => entry.riskLevel === 'high').length,
    [filteredFinancialLogs],
  );

  const formatImpactDetail = (entry: FinancialAuditEntry) => {
    const oldValue = entry.metadata.oldValue || {};
    const newValue = entry.metadata.newValue || {};
    const keys = Array.from(new Set([...Object.keys(oldValue), ...Object.keys(newValue)]));

    if (!keys.length) return 'No state delta recorded.';

    return keys
      .slice(0, 4)
      .map((key) => `${key}: ${String(oldValue[key] ?? 'N/A')} -> ${String(newValue[key] ?? 'N/A')}`)
      .join(' | ');
  };

  const handleExportFinancialAuditCsv = () => {
    const headers = ['ID', 'Timestamp', 'User ID', 'User Name', 'Role', 'Action Type', 'Description', 'Student ID', 'Student Name', 'Impact Detail', 'Risk'];
    const rows = filteredFinancialLogs.map((entry) => [
      entry.id,
      entry.timestamp,
      entry.userId,
      entry.userName,
      entry.userRole,
      financialActionLabels[entry.actionType],
      entry.description,
      entry.studentId ?? 'N/A',
      entry.studentName ?? 'N/A',
      formatImpactDetail(entry),
      entry.riskLevel,
    ]);

    downloadCsv(`financial-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handlePrintFinancialAuditPage = () => {
    const rows = filteredFinancialLogs
      .map((entry) => {
        const riskText = entry.riskLevel === 'high' ? 'HIGH RISK' : 'LOW';
        return `<tr>
          <td style="padding:6px;border:1px solid #ddd;">${entry.timestamp.replace('T', ' ').slice(0, 19)}</td>
          <td style="padding:6px;border:1px solid #ddd;">${entry.userName} (${entry.userRole})</td>
          <td style="padding:6px;border:1px solid #ddd;">${financialActionLabels[entry.actionType]}<br/><span style="font-size:12px;color:#555;">${entry.description}</span></td>
          <td style="padding:6px;border:1px solid #ddd;">${formatImpactDetail(entry)}</td>
          <td style="padding:6px;border:1px solid #ddd;">${riskText}</td>
        </tr>`;
      })
      .join('');

    const printWindow = window.open('', '_blank', 'width=1100,height=760');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head><title>Financial Audit Log</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="margin-bottom:6px;">Financial Audit Ledger</h2>
        <p style="margin-top:0;font-size:12px;color:#555;">Immutable export for school governance and compliance filing.</p>
        <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
          <thead>
            <tr>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Timestamp</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">User</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Action & Description</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Impact Detail</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Risk</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" style="padding:6px;border:1px solid #ddd;">No audit entries in selected timeline.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const openReviewModal = (receipt: ReceiptRecord) => {
    setReviewReceiptId(receipt.id);
    const allocationMap: Record<number, number> = {};
    receipt.allocations.forEach((entry) => {
      allocationMap[entry.feeItemId] = entry.amount;
    });
    setAllocationDraft(allocationMap);
    setPartialPaymentEnabled(receipt.partialFlag);
    setInternalLog(receipt.bursarComment || '');
    setRejectReason(receipt.rejectionReason || '');
  };

  const closeReviewModal = () => {
    setReviewReceiptId(null);
    setAllocationDraft({});
    setPartialPaymentEnabled(false);
    setInternalLog('');
    setRejectReason('');
  };

  const updateReceiptRecord = (nextReceipt: ReceiptRecord) => {
    setReceipts((prev) => prev.map((entry) => (entry.id === nextReceipt.id ? nextReceipt : entry)));
  };

  const handleApproveReviewedReceipt = () => {
    if (!reviewReceipt || !reviewLedger) return;

    if (allocationSum > reviewReceipt.verifiedAmount) {
      alert('Allocation exceeds verified receipt amount. Reduce allocations before approval.');
      return;
    }

    const allocations: ReceiptAllocation[] = Object.entries(allocationDraft)
      .map(([feeItemId, amount]) => ({ feeItemId: Number(feeItemId), amount: Math.max(0, amount) }))
      .filter((entry) => entry.amount > 0);

    if (!allocations.length) {
      alert('Add at least one allocation before approval.');
      return;
    }

    const nextLedger = applyAllocationsToLedger(reviewLedger, allocations);
    const allocatedTotal = sumAllocations(allocations);

    setLedgerRecords((prev) => prev.map((entry) => (entry.studentId === nextLedger.studentId ? nextLedger : entry)));

    updateReceiptRecord({
      ...reviewReceipt,
      status: 'approved',
      allocations,
      partialFlag: partialPaymentEnabled,
      remainingBalance: Math.max(0, reviewReceipt.verifiedAmount - allocatedTotal),
      bursarComment: internalLog.trim(),
      rejectionReason: '',
      processedAt: new Date().toISOString(),
    });

    createAuditEntry({
      actionType: 'approve_receipt',
      description: `Approved receipt #REC-${reviewReceipt.id} for ${formatCurrency(reviewReceipt.verifiedAmount)}; allocations recorded for ${reviewReceipt.studentName}.`,
      studentId: reviewReceipt.studentId,
      studentName: reviewReceipt.studentName,
      metadata: {
        oldValue: { status: reviewReceipt.status, remainingBalance: reviewReceipt.remainingBalance },
        newValue: { status: 'approved', remainingBalance: Math.max(0, reviewReceipt.verifiedAmount - allocatedTotal) },
      },
    });

    closeReviewModal();
  };

  const handleRejectReviewedReceipt = () => {
    if (!reviewReceipt) return;
    if (!rejectReason.trim()) {
      alert('Please provide rejection reason before rejecting.');
      return;
    }

    updateReceiptRecord({
      ...reviewReceipt,
      status: 'rejected',
      rejectionReason: rejectReason.trim(),
      bursarComment: internalLog.trim(),
      processedAt: new Date().toISOString(),
    });

    createAuditEntry({
      actionType: 'reject_receipt',
      description: `Rejected receipt #REC-${reviewReceipt.id} for ${reviewReceipt.studentName}.`,
      studentId: reviewReceipt.studentId,
      studentName: reviewReceipt.studentName,
      metadata: {
        oldValue: { status: reviewReceipt.status },
        newValue: { status: 'rejected', rejectionReason: rejectReason.trim() },
      },
    });

    closeReviewModal();
  };

  const handleFlagReviewedReceipt = () => {
    if (!reviewReceipt) return;
    updateReceiptRecord({
      ...reviewReceipt,
      status: 'flagged',
      bursarComment: internalLog.trim() || reviewReceipt.bursarComment,
    });

    createAuditEntry({
      actionType: 'flag_receipt',
      description: `Flagged receipt #REC-${reviewReceipt.id} for additional investigation.`,
      studentId: reviewReceipt.studentId,
      studentName: reviewReceipt.studentName,
      metadata: {
        oldValue: { status: reviewReceipt.status },
        newValue: { status: 'flagged' },
      },
    });

    closeReviewModal();
  };

  const handleMarkDuplicate = (receiptId: number) => {
    const existing = receipts.find((entry) => entry.id === receiptId);
    setReceipts((prev) =>
      prev.map((entry) => {
        if (entry.id !== receiptId) return entry;
        if (entry.status !== 'pending') return entry;
        return { ...entry, status: 'duplicate', processedAt: new Date().toISOString() };
      }),
    );

    if (existing && existing.status === 'pending') {
      createAuditEntry({
        actionType: 'mark_duplicate',
        description: `Marked receipt #REC-${existing.id} as duplicate.`,
        studentId: existing.studentId,
        studentName: existing.studentName,
        metadata: {
          oldValue: { status: existing.status },
          newValue: { status: 'duplicate' },
        },
      });
    }
  };

  const handleDeletePending = (receiptId: number) => {
    const existing = receipts.find((entry) => entry.id === receiptId && entry.status === 'pending');
    setReceipts((prev) => prev.filter((entry) => !(entry.id === receiptId && entry.status === 'pending')));
    setSelectedReceiptIds((prev) => prev.filter((id) => id !== receiptId));

    if (existing) {
      createAuditEntry({
        actionType: 'delete_item',
        description: `Deleted pending receipt #REC-${existing.id} for ${existing.studentName}.`,
        studentId: existing.studentId,
        studentName: existing.studentName,
        metadata: {
          oldValue: { receiptId: existing.id, status: existing.status, verifiedAmount: existing.verifiedAmount },
          newValue: { deleted: true },
        },
      });
    }
  };

  const toggleReceiptSelection = (receiptId: number) => {
    setSelectedReceiptIds((prev) => (prev.includes(receiptId) ? prev.filter((id) => id !== receiptId) : [...prev, receiptId]));
  };

  const toggleSelectAllFiltered = () => {
    const selectable = filteredReceipts.filter((receipt) => receipt.status === 'pending').map((receipt) => receipt.id);
    const allSelected = selectable.length > 0 && selectable.every((id) => selectedReceiptIds.includes(id));
    if (allSelected) {
      setSelectedReceiptIds((prev) => prev.filter((id) => !selectable.includes(id)));
      return;
    }
    setSelectedReceiptIds((prev) => Array.from(new Set([...prev, ...selectable])));
  };

  const handleBulkApprove = () => {
    const pendingSelected = selectedReceiptIds
      .map((id) => receipts.find((receipt) => receipt.id === id))
      .filter((receipt): receipt is ReceiptRecord => Boolean(receipt && receipt.status === 'pending'));

    if (!pendingSelected.length) return;
    if (!window.confirm(`Approve ${pendingSelected.length} pending receipt(s)?`)) return;

    let nextLedgers = [...ledgerRecords];
    let nextReceipts = [...receipts];

    pendingSelected.forEach((receipt) => {
      const targetLedger = nextLedgers.find((ledger) => ledger.studentId === receipt.studentId);
      if (!targetLedger) return;

      const autoAllocations = buildAutoAllocation(targetLedger, receipt.verifiedAmount, receipt.term);
      const nextLedger = applyAllocationsToLedger(targetLedger, autoAllocations);
      const allocatedTotal = sumAllocations(autoAllocations);

      nextLedgers = nextLedgers.map((ledger) => (ledger.studentId === nextLedger.studentId ? nextLedger : ledger));
      nextReceipts = nextReceipts.map((entry) =>
        entry.id === receipt.id
          ? {
              ...entry,
              status: 'approved',
              allocations: autoAllocations,
              partialFlag: true,
              remainingBalance: Math.max(0, receipt.verifiedAmount - allocatedTotal),
              bursarComment: 'Bulk approved with automatic allocation.',
              rejectionReason: '',
              processedAt: new Date().toISOString(),
            }
          : entry,
      );
    });

    setLedgerRecords(nextLedgers);
    setReceipts(nextReceipts);
    setSelectedReceiptIds([]);

    createAuditEntry({
      actionType: 'bulk_approve_receipts',
      description: `Bulk approved ${pendingSelected.length} pending receipt(s) with automatic allocation.`,
      studentId: null,
      studentName: null,
      metadata: {
        oldValue: { selectedReceiptIds: pendingSelected.map((entry) => entry.id) },
        newValue: { approvedCount: pendingSelected.length },
      },
    });
  };

  const handleBulkReject = () => {
    const pendingSelected = selectedReceiptIds
      .map((id) => receipts.find((receipt) => receipt.id === id))
      .filter((receipt): receipt is ReceiptRecord => Boolean(receipt && receipt.status === 'pending'));

    if (!pendingSelected.length) return;

    const reason = window.prompt('Provide rejection reason for selected receipts:');
    if (!reason || !reason.trim()) return;

    if (!window.confirm(`Reject ${pendingSelected.length} pending receipt(s)?`)) return;

    setReceipts((prev) =>
      prev.map((entry) =>
        pendingSelected.some((selected) => selected.id === entry.id)
          ? {
              ...entry,
              status: 'rejected',
              rejectionReason: reason.trim(),
              bursarComment: 'Bulk rejection.',
              processedAt: new Date().toISOString(),
            }
          : entry,
      ),
    );

    setSelectedReceiptIds([]);

    createAuditEntry({
      actionType: 'bulk_reject_receipts',
      description: `Bulk rejected ${pendingSelected.length} pending receipt(s).`,
      studentId: null,
      studentName: null,
      metadata: {
        oldValue: { selectedReceiptIds: pendingSelected.map((entry) => entry.id) },
        newValue: { rejectedCount: pendingSelected.length, reason: reason.trim() },
      },
    });
  };

  const openFeeItemEditor = (feeItem?: FeeItemCatalog) => {
    if (feeItem) {
      if (!canEditFeeItem(feeItem.status)) {
        alert('Only draft or rejected fee items can be edited.');
        return;
      }
      setEditingFeeItem(feeItem);
      setFeeItemDraft({
        name: feeItem.name,
        category: feeItem.category,
        amount: String(feeItem.amount),
        termId: feeItem.termId,
        classId: feeItem.classId,
        dueDate: feeItem.dueDate,
        isCompulsory: feeItem.isCompulsory,
        isActive: feeItem.isActive,
      });
    } else {
      setEditingFeeItem(null);
      setFeeItemDraft({
        name: '',
        category: 'Academic',
        amount: '',
        termId: 2,
        classId: null,
        dueDate: '2026-03-15',
        isCompulsory: true,
        isActive: true,
      });
    }
    setShowFeeItemModal(true);
  };

  const toggleFeeItemActive = (feeItemId: number) => {
    const existing = feeCatalog.find((entry) => entry.id === feeItemId);
    updateFeeCatalog((prev) => prev.map((entry) => (entry.id === feeItemId ? { ...entry, isActive: !entry.isActive } : entry)));

    if (existing) {
      createAuditEntry({
        actionType: 'toggle_fee_item_status',
        description: `Changed fee item '${existing.name}' status to ${existing.isActive ? 'inactive' : 'active'}.`,
        studentId: null,
        studentName: null,
        metadata: {
          oldValue: { isActive: existing.isActive },
          newValue: { isActive: !existing.isActive },
        },
      });
    }
  };

  const softDeleteFeeItem = (feeItemId: number) => {
    const existing = feeCatalog.find((entry) => entry.id === feeItemId);
    updateFeeCatalog((prev) => prev.map((entry) => (entry.id === feeItemId ? { ...entry, isActive: false } : entry)));

    if (existing) {
      createAuditEntry({
        actionType: 'delete_item',
        description: `Soft deleted fee item '${existing.name}' from active billing catalog.`,
        studentId: null,
        studentName: null,
        metadata: {
          oldValue: { feeItemId: existing.id, isActive: existing.isActive },
          newValue: { isActive: false },
        },
      });
    }
  };

  const duplicateFeeItem = (feeItem: FeeItemCatalog) => {
    if (!canEditFeeItem(feeItem.status)) {
      alert('Only draft or rejected fee items can be duplicated.');
      return;
    }

    const nextId = feeCatalog.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
    const nextTerm = termDirectory.find((term) => term.id !== feeItem.termId) || termDirectory[0];
    updateFeeCatalog((prev) => [
      ...prev,
      {
        ...feeItem,
        id: nextId,
        name: `${feeItem.name} (Copy)`,
        termId: nextTerm.id,
        term: nextTerm.name,
        isActive: false,
        status: 'draft',
        submittedAt: null,
        approvedAt: null,
        rejectionReason: null,
      },
    ]);
  };

  const submitFeeItemForApproval = (feeItemId: number) => {
    const existing = feeCatalog.find((entry) => entry.id === feeItemId);
    if (!existing || !canEditFeeItem(existing.status)) {
      alert('Only draft or rejected fee items can be submitted for approval.');
      return;
    }

    const next = submitForApproval(feeItemId);
    setFeeCatalog(next);
  };

  const withdrawFeeItemApproval = (feeItemId: number) => {
    const existing = feeCatalog.find((entry) => entry.id === feeItemId);
    if (!existing || existing.status !== 'pending_approval') return;

    const next = withdrawApproval(feeItemId);
    setFeeCatalog(next);
  };

  const viewFeeItemDetails = (feeItem: FeeItemCatalog) => {
    const rejection = feeItem.rejectionReason ? `\nRejection Reason: ${feeItem.rejectionReason}` : '';
    const submitted = feeItem.submittedAt ? `\nSubmitted: ${new Date(feeItem.submittedAt).toLocaleString()}` : '';
    alert(
      `Name: ${feeItem.name}\nCategory: ${feeItem.category}\nAmount: ${formatCurrency(feeItem.amount)}\nScope: ${feeItem.term} • ${classScopeLabel(
        feeItem.classId,
      )}\nDue Date: ${feeItem.dueDate}\nStatus: ${feeItem.status}${submitted}${rejection}`,
    );
  };

  const saveFeeItem = () => {
    const amount = Number(feeItemDraft.amount);
    if (!feeItemDraft.name.trim()) {
      alert('Fee name is required.');
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Price must be a positive number.');
      return;
    }

    const selectedTerm = termDirectory.find((entry) => entry.id === feeItemDraft.termId);
    if (!selectedTerm) return;

    if (editingFeeItem) {
      if (!canEditFeeItem(editingFeeItem.status)) {
        alert('Only draft or rejected fee items can be edited.');
        return;
      }

      const shouldUpdateUnpaidAssignments = amount !== editingFeeItem.amount
        ? window.confirm('Price changed. Update all existing unpaid assignments too? Click Cancel to apply only to new assignments.')
        : false;

      updateFeeCatalog((prev) =>
        prev.map((entry) =>
          entry.id === editingFeeItem.id
            ? {
                ...entry,
                name: feeItemDraft.name.trim(),
                category: feeItemDraft.category.trim(),
                amount,
                termId: feeItemDraft.termId,
                term: selectedTerm.name,
                classId: feeItemDraft.classId,
                dueDate: feeItemDraft.dueDate,
                isCompulsory: feeItemDraft.isCompulsory,
                isActive: feeItemDraft.isActive,
                status: entry.status,
                submittedAt: entry.submittedAt,
                approvedAt: entry.approvedAt,
                rejectionReason: entry.rejectionReason,
              }
            : entry,
        ),
      );

      if (shouldUpdateUnpaidAssignments && amount !== editingFeeItem.amount) {
        const delta = amount - editingFeeItem.amount;
        setLedgerRecords((prev) =>
          prev.map((ledger) => ({
            ...ledger,
            feeItems: ledger.feeItems.map((item) => {
              if (item.feeItemId !== editingFeeItem.id || item.balance <= 0) return item;
              const nextDue = Math.max(item.paid, item.due + delta);
              return {
                ...item,
                name: feeItemDraft.name.trim(),
                dueDate: feeItemDraft.dueDate,
                term: selectedTerm.name,
                due: nextDue,
                balance: Math.max(0, nextDue - item.paid),
              };
            }),
          })),
        );
      }

      createAuditEntry({
        actionType: 'update_fee_item',
        description: `Updated fee item '${editingFeeItem.name}' to amount ${formatCurrency(amount)} (${selectedTerm.name}).`,
        studentId: null,
        studentName: null,
        metadata: {
          oldValue: {
            name: editingFeeItem.name,
            amount: editingFeeItem.amount,
            term: editingFeeItem.term,
            dueDate: editingFeeItem.dueDate,
          },
          newValue: {
            name: feeItemDraft.name.trim(),
            amount,
            term: selectedTerm.name,
            dueDate: feeItemDraft.dueDate,
          },
        },
      });
    } else {
      const nextId = feeCatalog.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
      updateFeeCatalog((prev) => [
        ...prev,
        {
          id: nextId,
          name: feeItemDraft.name.trim(),
          category: feeItemDraft.category.trim(),
          amount,
          termId: feeItemDraft.termId,
          term: selectedTerm.name,
          classId: feeItemDraft.classId,
          dueDate: feeItemDraft.dueDate,
          isCompulsory: feeItemDraft.isCompulsory,
          isActive: feeItemDraft.isActive,
          status: 'draft',
          submittedAt: null,
          approvedAt: null,
          rejectionReason: null,
        },
      ]);

      createAuditEntry({
        actionType: 'create_fee_item',
        description: `Created fee item '${feeItemDraft.name.trim()}' for ${selectedTerm.name} at ${formatCurrency(amount)}.`,
        studentId: null,
        studentName: null,
        metadata: {
          newValue: {
            name: feeItemDraft.name.trim(),
            category: feeItemDraft.category.trim(),
            amount,
            term: selectedTerm.name,
            classScope: classScopeLabel(feeItemDraft.classId),
          },
        },
      });
    }

    setShowFeeItemModal(false);
  };

  const toggleBulkFeeSelection = (feeItemId: number) => {
    setBulkAssignFeeItemIds((prev) => (prev.includes(feeItemId) ? prev.filter((id) => id !== feeItemId) : [...prev, feeItemId]));
  };

  const executeBulkAssignment = () => {
    if (!bulkAssignClassId || !bulkAssignFeeItemIds.length) return;

    const targetClass = classDirectory.find((entry) => entry.id === bulkAssignClassId);
    if (!targetClass) return;

    const selectedItems = feeCatalog.filter(
      (item) => bulkAssignFeeItemIds.includes(item.id) && item.isActive && item.status === 'approved',
    );
    if (!selectedItems.length) return;

    if (!window.confirm(`Assign ${selectedItems.length} fee item(s) to all students in ${targetClass.name}?`)) return;

    let assignedCount = 0;
    let skippedCount = 0;

    setLedgerRecords((prev) =>
      prev.map((ledger) => {
        if (ledger.className !== targetClass.name) return ledger;

        const nextFeeItems = [...ledger.feeItems];
        selectedItems.forEach((item) => {
          const alreadyAssigned = nextFeeItems.some((entry) => entry.feeItemId === item.id && entry.term === item.term);
          if (alreadyAssigned) {
            skippedCount += 1;
            return;
          }

          nextFeeItems.push({
            feeItemId: item.id,
            name: item.name,
            term: item.term,
            dueDate: item.dueDate,
            due: item.amount,
            paid: 0,
            balance: item.amount,
          });
          assignedCount += 1;
        });

        return {
          ...ledger,
          feeItems: nextFeeItems,
        };
      }),
    );

    alert(`Bulk assignment completed. Added ${assignedCount} invoice line item(s), skipped ${skippedCount} duplicate assignment(s).`);
    setShowBulkAssignModal(false);
    setBulkAssignFeeItemIds([]);

    createAuditEntry({
      actionType: 'assign_fee_items',
      description: `Assigned ${selectedItems.length} fee item template(s) to class ${targetClass.name}.`,
      studentId: null,
      studentName: null,
      metadata: {
        newValue: {
          className: targetClass.name,
          feeItemIds: selectedItems.map((item) => item.id),
          assignedCount,
          skippedCount,
        },
      },
    });
  };

  const toggleLedgerExpansion = (studentId: number) => {
    setExpandedLedgerIds((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  };

  const openAdjustmentModal = (studentId: number) => {
    setAdjustmentTargetId(studentId);
    setAdjustmentDraft({ amount: '', type: 'Waiver', direction: 'credit', reason: '' });
    setShowAdjustmentModal(true);
  };

  const saveManualAdjustment = () => {
    if (!adjustmentTargetId) return;
    const amount = Number(adjustmentDraft.amount);
    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      alert('Enter a valid adjustment amount.');
      return;
    }
    if (!adjustmentDraft.reason.trim()) {
      alert('Reason is required for manual adjustment.');
      return;
    }

    const nextId = adjustments.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
    setAdjustments((prev) => [
      {
        id: nextId,
        studentId: adjustmentTargetId,
        term: ledgerFilters.term,
        amount,
        type: adjustmentDraft.type,
        direction: adjustmentDraft.direction,
        reason: adjustmentDraft.reason.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    const targetRow = ledgerRows.find((row) => row.studentId === adjustmentTargetId);
    createAuditEntry({
      actionType: 'manual_adjustment',
      description: `Applied ${adjustmentDraft.direction} adjustment of ${formatCurrency(amount)} for student #${adjustmentTargetId}.`,
      studentId: adjustmentTargetId,
      studentName: targetRow?.name || null,
      metadata: {
        oldValue: { balance: targetRow?.balance ?? 'unknown' },
        newValue: { balance: targetRow ? targetRow.balance + (adjustmentDraft.direction === 'debit' ? amount : -amount) : 'unknown' },
      },
    });

    setShowAdjustmentModal(false);
  };

  const handlePrintInvoice = (row: ComputedLedgerRow) => {
    const paymentRows = row.approvedReceipts
      .map((receipt) => {
        const allocationDetails = receipt.allocations
          .map((allocation) => {
            const itemName = row.remainingPerItem.find((item) => item.feeItemId === allocation.feeItemId)?.name || `Fee Item ${allocation.feeItemId}`;
            return `${formatCurrency(allocation.amount)} to ${itemName}`;
          })
          .join(', ');

        return `<tr>
          <td style="padding:6px;border:1px solid #ddd;">#${receipt.id}</td>
          <td style="padding:6px;border:1px solid #ddd;">${receipt.processedAt?.slice(0, 10) || receipt.uploadDate}</td>
          <td style="padding:6px;border:1px solid #ddd;">${formatCurrency(sumAllocations(receipt.allocations))}</td>
          <td style="padding:6px;border:1px solid #ddd;">${allocationDetails || '-'}</td>
        </tr>`;
      })
      .join('');

    const itemRows = row.remainingPerItem
      .map(
        (item) => `<tr>
          <td style="padding:6px;border:1px solid #ddd;">${item.name}</td>
          <td style="padding:6px;border:1px solid #ddd;">${formatCurrency(item.due)}</td>
          <td style="padding:6px;border:1px solid #ddd;">${formatCurrency(item.paid)}</td>
          <td style="padding:6px;border:1px solid #ddd;">${formatCurrency(item.remaining)}</td>
        </tr>`,
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head><title>Invoice - ${row.name}</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Student Invoice</h2>
        <p><strong>Student:</strong> ${row.name} (${row.studentCode})</p>
        <p><strong>Class:</strong> ${row.className}</p>
        <p><strong>Term:</strong> ${row.term}</p>
        <hr />
        <h3>Current Charges</h3>
        <table style="border-collapse: collapse; width: 100%; margin-bottom: 12px;">
          <thead>
            <tr>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Fee Item</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Due</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Paid</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Remaining</th>
            </tr>
          </thead>
          <tbody>${itemRows || '<tr><td colspan="4" style="padding:6px;border:1px solid #ddd;">No fee items for term.</td></tr>'}</tbody>
        </table>

        <h3>Payments Made</h3>
        <table style="border-collapse: collapse; width: 100%; margin-bottom: 12px;">
          <thead>
            <tr>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Receipt ID</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Date</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Amount</th>
              <th style="padding:6px;border:1px solid #ddd;text-align:left;">Allocation</th>
            </tr>
          </thead>
          <tbody>${paymentRows || '<tr><td colspan="4" style="padding:6px;border:1px solid #ddd;">No approved payments yet.</td></tr>'}</tbody>
        </table>

        <p><strong>Total Due:</strong> ${formatCurrency(row.totalDue)}</p>
        <p><strong>Total Paid:</strong> ${formatCurrency(row.totalPaid)}</p>
        <p><strong>Adjustments (Credit/Debit):</strong> ${formatCurrency(row.creditAdjustments)} / ${formatCurrency(row.debitAdjustments)}</p>
        <p><strong>Outstanding Balance:</strong> ${formatCurrency(Math.max(0, row.balance))}</p>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSendCollectionReminder = (row: CollectionRow) => {
    alert(`Reminder queued for ${row.studentName}: ${row.feeItemName} balance ${formatCurrency(row.remainingBalance)}.`);
  };

  const handleViewCollectionReceipts = (row: CollectionRow) => {
    setQueueFilters({
      search: `${row.studentName} ${row.studentCode}`,
      className: row.className,
      status: '',
      startDate: '',
      endDate: '',
    });
    setActiveTab('queue');
  };

  const handleResolveCollectionRow = (row: CollectionRow) => {
    if (!window.confirm(`Mark ${row.feeItemName} for ${row.studentName} as resolved? This will post an internal reconciliation allocation.`)) return;

    const nextReceiptId = receipts.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
    const resolutionAmount = row.remainingBalance;

    setReceipts((prev) => [
      {
        id: nextReceiptId,
        studentId: row.studentId,
        studentName: row.studentName,
        studentCode: row.studentCode,
        className: row.className,
        term: row.term,
        parentName: 'Internal Reconciliation',
        declaredAmount: resolutionAmount,
        extractedAmount: resolutionAmount,
        verifiedAmount: resolutionAmount,
        parentEnteredDate: new Date().toISOString().slice(0, 10),
        uploadDate: new Date().toISOString().slice(0, 10),
        referenceNumber: `WRITEOFF-${nextReceiptId}`,
        receiptUrl: '#',
        mismatch: false,
        mismatchReason: null,
        status: 'approved',
        allocations: [{ feeItemId: row.feeItemId, amount: resolutionAmount }],
        partialFlag: false,
        remainingBalance: 0,
        bursarComment: `Manual resolution posted for ${row.feeItemName}.`,
        rejectionReason: '',
        processedAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setLedgerRecords((prev) =>
      prev.map((ledger) => {
        if (ledger.studentId !== row.studentId) return ledger;
        return {
          ...ledger,
          lastPaymentDate: new Date().toISOString().slice(0, 10),
          feeItems: ledger.feeItems.map((item) => {
            if (item.feeItemId !== row.feeItemId || item.term !== row.term) return item;
            return {
              ...item,
              paid: item.paid + resolutionAmount,
              balance: Math.max(0, item.balance - resolutionAmount),
            };
          }),
        };
      }),
    );

    createAuditEntry({
      actionType: 'resolve_collection',
      description: `Resolved ${row.feeItemName} balance for ${row.studentName} by posting internal reconciliation (${formatCurrency(resolutionAmount)}).`,
      studentId: row.studentId,
      studentName: row.studentName,
      metadata: {
        oldValue: { remainingBalance: row.remainingBalance },
        newValue: { remainingBalance: 0, syntheticReceiptReference: `WRITEOFF-${nextReceiptId}` },
      },
    });
  };

  const handleImportBankCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setBankImportError('');
        const content = String(reader.result || '');
        const rows = parseCsvText(content);

        if (rows.length < 2) {
          setBankImportError('CSV appears empty. Upload a valid bank statement file.');
          return;
        }

        const headers = rows[0].map((header) => header.toLowerCase().trim());
        const dateIndex = headers.findIndex((header) => header.includes('date'));
        const amountIndex = headers.findIndex((header) => header.includes('amount') || header.includes('credit'));
        const referenceIndex = headers.findIndex((header) => header.includes('reference') || header.includes('description') || header.includes('narration') || header.includes('remark'));

        if (dateIndex < 0 || amountIndex < 0 || referenceIndex < 0) {
          setBankImportError('Expected Date, Amount, and Reference/Description columns in CSV.');
          return;
        }

        const parsedTransactions: BankTransaction[] = rows.slice(1)
          .map((cells, idx) => {
            const date = parseBankDate(cells[dateIndex] || '');
            const amount = parseBankAmount(cells[amountIndex] || '');
            const reference = (cells[referenceIndex] || '').trim();
            if (!date || amount <= 0) return null;

            return {
              id: `${date}-${idx + 1}-${amount}`,
              date,
              amount,
              reference: reference || `TXN-${idx + 1}`,
              description: reference || 'No description provided',
              matchedReceiptId: null as number | null,
              matchedManually: false,
            };
          })
          .filter((entry): entry is BankTransaction => entry !== null);

        setBankTransactions(parsedTransactions);
        setBankImportFileName(file.name);
      } catch {
        setBankImportError('Unable to parse CSV file. Please verify the file format and try again.');
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmAutoMatch = (transactionId: string, receiptId: number) => {
    const matchedReceipt = receipts.find((receipt) => receipt.id === receiptId) || null;
    const transaction = bankTransactions.find((entry) => entry.id === transactionId) || null;

    setBankTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId
          ? { ...transaction, matchedReceiptId: receiptId, matchedManually: false }
          : transaction,
      ),
    );

    setReceipts((prev) => prev.map((receipt) => (receipt.id === receiptId ? { ...receipt, verifiedByBank: true } : receipt)));

    if (matchedReceipt && transaction) {
      createAuditEntry({
        actionType: 'bank_auto_match',
        description: `Auto-matched bank transaction '${transaction.reference}' to receipt #REC-${matchedReceipt.id}.`,
        studentId: matchedReceipt.studentId,
        studentName: matchedReceipt.studentName,
        metadata: {
          oldValue: { matchedReceiptId: null },
          newValue: { matchedReceiptId: matchedReceipt.id, matchedManually: false },
        },
      });
    }
  };

  const openManualLinkModal = (transactionId: string) => {
    setManualLinkTransactionId(transactionId);
    setManualLinkReceiptId(null);
  };

  const handleConfirmManualLink = () => {
    if (!manualLinkTransactionId || !manualLinkReceiptId) return;

    const matchedReceipt = receipts.find((receipt) => receipt.id === manualLinkReceiptId) || null;
    const transaction = bankTransactions.find((entry) => entry.id === manualLinkTransactionId) || null;

    setBankTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === manualLinkTransactionId
          ? { ...transaction, matchedReceiptId: manualLinkReceiptId, matchedManually: true }
          : transaction,
      ),
    );

    setReceipts((prev) =>
      prev.map((receipt) => (receipt.id === manualLinkReceiptId ? { ...receipt, verifiedByBank: true } : receipt)),
    );

    setManualLinkTransactionId(null);
    setManualLinkReceiptId(null);

    if (matchedReceipt && transaction) {
      createAuditEntry({
        actionType: 'bank_manual_link',
        description: `Manually linked bank transaction '${transaction.reference}' to receipt #REC-${matchedReceipt.id}.`,
        studentId: matchedReceipt.studentId,
        studentName: matchedReceipt.studentName,
        metadata: {
          oldValue: { matchedReceiptId: null },
          newValue: { matchedReceiptId: matchedReceipt.id, matchedManually: true },
        },
      });
    }
  };

  const openCreateVirtualReceipt = (transactionId: string) => {
    const targetTransaction = bankTransactions.find((transaction) => transaction.id === transactionId);
    if (!targetTransaction) return;

    setVirtualReceiptTransactionId(transactionId);
    setVirtualReceiptDraft((prev) => ({
      ...prev,
      term: termOptions.includes(prev.term) ? prev.term : 'Term 3, 2026',
      className: classOptions[0] || '',
    }));
  };

  const handleCreateVirtualReceipt = () => {
    if (!virtualReceiptTransactionId) return;
    const transaction = bankTransactions.find((entry) => entry.id === virtualReceiptTransactionId);
    if (!transaction) return;

    if (!virtualReceiptDraft.studentName.trim() || !virtualReceiptDraft.className.trim() || !virtualReceiptDraft.term.trim()) {
      alert('Student name, class, and term are required.');
      return;
    }

    const existingLedger = ledgerRecords.find(
      (entry) =>
        entry.name.toLowerCase() === virtualReceiptDraft.studentName.trim().toLowerCase() &&
        entry.className.toLowerCase() === virtualReceiptDraft.className.trim().toLowerCase(),
    );

    const nextStudentId = existingLedger
      ? existingLedger.studentId
      : ledgerRecords.reduce((max, entry) => Math.max(max, entry.studentId), 0) + 1;

    const studentCode = existingLedger ? existingLedger.studentCode : `STD-V${String(nextStudentId).padStart(3, '0')}`;
    const receiptId = receipts.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;

    if (!existingLedger) {
      setLedgerRecords((prev) => [
        ...prev,
        {
          studentId: nextStudentId,
          studentCode,
          name: virtualReceiptDraft.studentName.trim(),
          className: virtualReceiptDraft.className.trim(),
          feeItems: [],
          lastPaymentDate: transaction.date,
        },
      ]);
    }

    setReceipts((prev) => [
      {
        id: receiptId,
        studentId: nextStudentId,
        studentName: virtualReceiptDraft.studentName.trim(),
        studentCode,
        className: virtualReceiptDraft.className.trim(),
        term: virtualReceiptDraft.term,
        parentName: virtualReceiptDraft.parentName.trim() || 'Offline Deposit',
        declaredAmount: transaction.amount,
        extractedAmount: transaction.amount,
        verifiedAmount: transaction.amount,
        parentEnteredDate: transaction.date,
        uploadDate: transaction.date,
        referenceNumber: transaction.reference,
        receiptUrl: '#',
        mismatch: false,
        mismatchReason: null,
        status: 'pending',
        allocations: [],
        partialFlag: false,
        remainingBalance: transaction.amount,
        bursarComment: `Virtual receipt generated from bank transaction ${transaction.reference}.`,
        rejectionReason: '',
        processedAt: null,
        verifiedByBank: true,
      },
      ...prev,
    ]);

    setBankTransactions((prev) =>
      prev.map((entry) =>
        entry.id === virtualReceiptTransactionId
          ? { ...entry, matchedReceiptId: receiptId, matchedManually: true }
          : entry,
      ),
    );

    createAuditEntry({
      actionType: 'create_virtual_receipt',
      description: `Created virtual receipt #REC-${receiptId} from bank transaction ${transaction.reference} (${formatCurrency(transaction.amount)}).`,
      studentId: nextStudentId,
      studentName: virtualReceiptDraft.studentName.trim(),
      metadata: {
        newValue: {
          receiptId,
          transactionId: transaction.id,
          amount: transaction.amount,
          className: virtualReceiptDraft.className.trim(),
          term: virtualReceiptDraft.term,
        },
      },
    });

    setVirtualReceiptTransactionId(null);
    setVirtualReceiptDraft({
      studentName: '',
      className: classOptions[0] || '',
      term: termOptions[0] || 'Term 3, 2026',
      parentName: 'Offline Deposit',
    });
  };

  const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMasterFinancialReport = () => {
    const headers = ['Student Name', 'Student Code', 'Class', 'Term', 'Total Billed', 'Total Paid', 'Outstanding', 'Last Payment Date'];
    const rows = reportMetrics.rows.map((row) => [
      row.studentName,
      row.studentCode,
      row.className,
      reportsTerm,
      row.invoiced,
      row.collected,
      Math.max(0, row.invoiced - row.collected),
      row.lastPaymentDate ? row.lastPaymentDate.slice(0, 10) : 'N/A',
    ]);

    downloadCsv(`master-financial-report-${reportsTerm.replace(/\s+/g, '-').toLowerCase()}.csv`, headers, rows);
  };

  const handleExportAgeingSummary = () => {
    const headers = [ageingViewMode === 'class' ? 'Class Name' : 'Student Name', 'Current (<30 days)', 'Delinquent (30-60 days)', 'Critical (>60 days)', 'Total'];
    const rows = ageingRows.map((row) => [
      row.label,
      row.current,
      row.delinquent,
      row.critical,
      row.current + row.delinquent + row.critical,
    ]);

    downloadCsv(`ageing-summary-${reportsTerm.replace(/\s+/g, '-').toLowerCase()}.csv`, headers, rows);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap gap-2 border-b border-border">
        <button onClick={() => setActiveTab('queue')} className={`px-4 py-2 ${activeTab === 'queue' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Receipt Queue
        </button>
        <button onClick={() => setActiveTab('ledger')} className={`px-4 py-2 ${activeTab === 'ledger' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Student Fee Ledger
        </button>
        <button onClick={() => setActiveTab('collections')} className={`px-4 py-2 ${activeTab === 'collections' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Partial Payment Tracker
        </button>
        <button onClick={() => setActiveTab('bank')} className={`px-4 py-2 ${activeTab === 'bank' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Bank Statement Helper
        </button>
        <button onClick={() => setActiveTab('feeitems')} className={`px-4 py-2 ${activeTab === 'feeitems' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Fee Items
        </button>
        <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 ${activeTab === 'reports' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Reports
        </button>
        <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 ${activeTab === 'audit' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Financial Audit
        </button>
      </div>

      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <p className="text-sm text-muted-foreground">Pending Receipts</p>
              <p className="text-2xl font-bold mt-2">{pendingReceiptsCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Mismatch Flags</p>
              <p className="text-2xl font-bold mt-2 text-red-600">{mismatchFlags}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Weekly Approvals</p>
              <p className="text-2xl font-bold mt-2 text-green-600">{weeklyApprovals}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
              <p className="text-2xl font-bold mt-2 inline-flex items-center gap-1"><BadgePercent size={16} />{billingMetrics.collectionRate}%</p>
            </Card>
          </div>

          <Card
            title="Receipt Inbox"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={toggleSelectAllFiltered}>
                  {selectedReceiptIds.length ? 'Clear Selection' : 'Select Pending'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkReject} disabled={!selectedReceiptIds.length}>
                  <XCircle size={14} className="mr-1" />Bulk Reject
                </Button>
                <Button size="sm" onClick={handleBulkApprove} disabled={!selectedReceiptIds.length}>
                  <FileCheck size={14} className="mr-1" />Bulk Approve
                </Button>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
              <div className="relative md:col-span-2">
                <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search student/class/parent"
                  className="w-full p-2 pl-8 border border-border rounded bg-input-background"
                  value={queueFilters.search}
                  onChange={(e) => setQueueFilters((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={queueFilters.className}
                onChange={(e) => setQueueFilters((prev) => ({ ...prev, className: e.target.value }))}
              >
                <option value="">All Classes</option>
                {classOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={queueFilters.status}
                onChange={(e) => setQueueFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
                <option value="duplicate">Duplicate</option>
              </select>
              <input
                type="date"
                className="p-2 border border-border rounded bg-input-background"
                value={queueFilters.startDate}
                onChange={(e) => setQueueFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
              <input
                type="date"
                className="p-2 border border-border rounded bg-input-background"
                value={queueFilters.endDate}
                onChange={(e) => setQueueFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {noPendingReceipts ? (
              <div className="py-14 border border-dashed border-border rounded-lg text-center">
                <FileCheck size={34} className="mx-auto text-green-600" />
                <p className="mt-3 font-medium">No pending receipts</p>
                <p className="text-sm text-muted-foreground">All uploaded receipts have been reviewed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        className="border rounded p-1 text-sm"
                        value={feeItemStatusFilter}
                        onChange={(e) => setFeeItemStatusFilter(e.target.value as 'all' | FeeItemStatus)}
                      >
                        <option value="all">All</option>
                        <option value="draft">Draft</option>
                        <option value="pending_approval">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2">Select</th>
                      <th className="py-2">Student Context</th>
                      <th className="py-2">Declared Amount</th>
                      <th className="py-2">Extracted Amount</th>
                      <th className="py-2">Verification</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Upload Date</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((receipt) => {
                      const badge = statusBadge(receipt.status);
                      return (
                        <tr key={receipt.id} className="border-b border-border hover:bg-muted/30">
                          <td className="py-2">
                            <input
                              type="checkbox"
                              disabled={receipt.status !== 'pending'}
                              checked={selectedReceiptIds.includes(receipt.id)}
                              onChange={() => toggleReceiptSelection(receipt.id)}
                            />
                          </td>
                          <td className="py-2">
                            <p className="font-medium">{receipt.studentName}</p>
                            <p className="text-xs text-muted-foreground">{receipt.className}</p>
                          </td>
                          <td className="py-2">{formatCurrency(receipt.declaredAmount)}</td>
                          <td className="py-2">{formatCurrency(receipt.extractedAmount)}</td>
                          <td className="py-2">
                            {receipt.mismatch ? (
                              <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                                <AlertCircle size={14} />Mismatch
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle size={14} />Match
                              </span>
                            )}
                            {receipt.verifiedByBank && (
                              <div className="text-xs text-blue-600 mt-1 inline-flex items-center gap-1">
                                <Link size={12} />Verified by bank
                              </div>
                            )}
                          </td>
                          <td className="py-2">
                            <Badge variant={badge.variant} className={badge.className}>{badge.text}</Badge>
                          </td>
                          <td className="py-2">{receipt.uploadDate}</td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => openReviewModal(receipt)}>
                                Review
                              </Button>
                              {receipt.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleMarkDuplicate(receipt.id)}>
                                    Duplicate
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeletePending(receipt.id)}>
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'ledger' && (
        <Card title="Student Financial Account Registry">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or student ID"
                className="w-full p-2 pl-8 border border-border rounded bg-input-background"
                value={ledgerFilters.search}
                onChange={(e) => setLedgerFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <select
              className="p-2 border border-border rounded bg-input-background"
              value={ledgerFilters.className}
              onChange={(e) => setLedgerFilters((prev) => ({ ...prev, className: e.target.value }))}
            >
              <option value="">All Classes</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              className="p-2 border border-border rounded bg-input-background"
              value={ledgerFilters.term}
              onChange={(e) => setLedgerFilters((prev) => ({ ...prev, term: e.target.value }))}
            >
              {termOptions.map((term) => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
            <select
              className="p-2 border border-border rounded bg-input-background"
              value={ledgerFilters.status}
              onChange={(e) => setLedgerFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="paid_full">Paid in Full</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2">Details</th>
                  <th className="py-2">Student Context</th>
                  <th className="py-2">Total Due</th>
                  <th className="py-2">Total Paid</th>
                  <th className="py-2">Balance</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Last Payment Date</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgerRows.map((row) => {
                  const expanded = expandedLedgerIds.includes(row.studentId);
                  const badge = ledgerStatusBadge(row.status);
                  const noHistory = row.approvedReceipts.length === 0 && row.adjustments.length === 0;

                  return (
                    <>
                      <tr key={row.studentId} className="border-b border-border hover:bg-muted/30">
                        <td className="py-2">
                          <Button size="sm" variant="outline" onClick={() => toggleLedgerExpansion(row.studentId)}>
                            {expanded ? 'Hide' : 'Expand'}
                          </Button>
                        </td>
                        <td className="py-2">
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.className} • {row.studentCode}</p>
                        </td>
                        <td className="py-2">{formatCurrency(row.totalDue)}</td>
                        <td className="py-2">{formatCurrency(row.totalPaid)}</td>
                        <td className="py-2 font-bold text-base">{formatCurrency(row.balance)}</td>
                        <td className="py-2">
                          <Badge variant={badge.variant} className={badge.className}>{badge.text}</Badge>
                        </td>
                        <td className="py-2">{row.lastPaymentDate ? row.lastPaymentDate.slice(0, 10) : '-'}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openAdjustmentModal(row.studentId)}>
                              <History size={14} className="mr-1" />Manual Credit/Debit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(row)}>
                              <Printer size={14} className="mr-1" />View/Print Invoice
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="border-b border-border bg-accent/20">
                          <td colSpan={8} className="p-4">
                            {noHistory ? (
                              <div className="py-6 text-center border border-dashed border-border rounded">
                                <Receipt size={28} className="mx-auto text-muted-foreground" />
                                <p className="mt-2 font-medium">No financial activity recorded</p>
                                <p className="text-sm text-muted-foreground">No approved payments or manual adjustments found for this student and term.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                <Card title="Payment History Timeline">
                                  <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {row.approvedReceipts.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No approved receipts yet.</p>
                                    ) : (
                                      row.approvedReceipts.map((receipt) => {
                                        const allocationDetails = receipt.allocations
                                          .map((allocation) => {
                                            const itemName = row.remainingPerItem.find((item) => item.feeItemId === allocation.feeItemId)?.name || `Fee Item ${allocation.feeItemId}`;
                                            return `${formatCurrency(allocation.amount)} to ${itemName}`;
                                          })
                                          .join(', ');

                                        return (
                                          <div key={receipt.id} className="p-3 border border-border rounded">
                                            <div className="flex items-center justify-between">
                                              <p className="font-medium">Receipt #{receipt.id}</p>
                                              <Badge variant="approved">{receipt.processedAt?.slice(0, 10) || receipt.uploadDate}</Badge>
                                            </div>
                                            <p className="text-sm mt-1">Amount: {formatCurrency(sumAllocations(receipt.allocations))}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{allocationDetails || 'No allocation details.'}</p>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </Card>

                                <Card title="Installment and Item Breakdown">
                                  <div className="space-y-3">
                                    {row.remainingPerItem.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No fee items for selected term.</p>
                                    ) : (
                                      row.remainingPerItem.map((item) => {
                                        const paidRatio = item.due > 0 ? Math.min(100, Math.round((item.paid / item.due) * 100)) : 0;
                                        return (
                                          <div key={`${row.studentId}-${item.feeItemId}`} className="rounded border border-border p-3">
                                            <div className="flex items-center justify-between text-sm">
                                              <p className="font-medium">{item.name}</p>
                                              <Badge variant={item.settled ? 'approved' : 'pending'}>{item.settled ? 'Cleared' : 'Outstanding'}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Paid {formatCurrency(item.paid)} of {formatCurrency(item.due)} - Remaining {formatCurrency(item.remaining)}
                                            </p>
                                            <div className="mt-2 h-2 rounded bg-muted overflow-hidden">
                                              <div className={`h-full ${item.settled ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${paidRatio}%` }} />
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}

                                    {row.adjustments.length > 0 && (
                                      <div className="mt-2 rounded border border-border p-3">
                                        <p className="text-sm font-medium mb-2">Manual Adjustments (Audit Trail)</p>
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                          {row.adjustments.map((entry) => (
                                            <p key={entry.id}>
                                              {entry.createdAt.slice(0, 10)} - {entry.type} ({entry.direction === 'credit' ? '-' : '+'}{formatCurrency(entry.amount)}): {entry.reason}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              </div>
                            )}
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
      )}

      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-muted-foreground">Total Outstanding Balance</p>
              <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(collectionSummary.totalOutstandingBalance)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Affected Students</p>
              <p className="text-2xl font-bold mt-2">{collectionSummary.affectedStudents}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Collection Gap (Selected Term)</p>
              <p className="text-sm font-medium mt-2">
                {formatCurrency(collectionSummary.totalCollected)} collected of {formatCurrency(collectionSummary.totalExpected)} expected
              </p>
              <div className="mt-2 h-2 rounded bg-muted overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${collectionSummary.progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{collectionSummary.progress}% collected</p>
            </Card>
          </div>

          <Card title="Underpaid Items Registry">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={collectionFilters.className}
                onChange={(e) => setCollectionFilters((prev) => ({ ...prev, className: e.target.value }))}
              >
                <option value="">All Classes</option>
                {classOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={collectionFilters.term}
                onChange={(e) => setCollectionFilters((prev) => ({ ...prev, term: e.target.value }))}
              >
                {termOptions.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Show balances above</label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={collectionFilters.minBalance}
                  onChange={(e) => setCollectionFilters((prev) => ({ ...prev, minBalance: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Threshold Slider</label>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1000, maxCollectionBalance)}
                  step={500}
                  className="w-full"
                  value={collectionFilters.minBalance}
                  onChange={(e) => setCollectionFilters((prev) => ({ ...prev, minBalance: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {filteredCollectionRows.length === 0 ? (
              <div className="py-14 border border-dashed border-green-300 rounded-lg text-center bg-green-50/60 dark:bg-green-950/20">
                <CheckCircle size={34} className="mx-auto text-green-600" />
                <p className="mt-3 font-medium text-green-800 dark:text-green-200">Zero Debt Achieved</p>
                <p className="text-sm text-muted-foreground">All tracked fee items are fully settled for this filter context.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2">Student Context</th>
                      <th className="py-2">Fee Item</th>
                      <th className="py-2">Total Due</th>
                      <th className="py-2">Amount Paid</th>
                      <th className="py-2">Remaining Balance</th>
                      <th className="py-2">Last Payment Date</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCollectionRows.map((row) => (
                      <tr key={`${row.studentId}-${row.feeItemId}-${row.term}`} className="border-b border-border hover:bg-muted/30">
                        <td className="py-2">
                          <p className="font-medium">{row.studentName}</p>
                          <p className="text-xs text-muted-foreground">{row.className} • {row.studentCode}</p>
                        </td>
                        <td className="py-2">
                          <p className="font-medium">{row.feeItemName}</p>
                          <p className="text-xs text-muted-foreground">Due {row.dueDate}</p>
                        </td>
                        <td className="py-2">{formatCurrency(row.totalDue)}</td>
                        <td className="py-2">{formatCurrency(row.amountPaid)}</td>
                        <td className="py-2 font-bold text-red-700 dark:text-red-300">{formatCurrency(row.remainingBalance)}</td>
                        <td className="py-2">{row.lastPaymentDate ? row.lastPaymentDate.slice(0, 10) : 'No payment yet'}</td>
                        <td className="py-2">
                          <Badge
                            variant={row.status === 'overdue' ? 'rejected' : 'pending'}
                            className={row.status === 'overdue' ? '' : 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-200'}
                          >
                            {row.status === 'overdue' ? 'Overdue' : 'Partial'}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleSendCollectionReminder(row)}>
                              <BellRing size={14} className="mr-1" />Send Reminder
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewCollectionReceipts(row)}>
                              <List size={14} className="mr-1" />View Receipts
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleResolveCollectionRow(row)}>
                              <CheckCheck size={14} className="mr-1" />Mark as Resolved
                            </Button>
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

      {activeTab === 'bank' && (
        <div className="space-y-4">
          <Card title="Bank Data Import">
            <div
              className={`rounded-lg border-2 border-dashed p-6 text-center transition ${isBankDropZoneActive ? 'border-primary bg-accent/40' : 'border-border bg-muted/20'}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsBankDropZoneActive(true);
              }}
              onDragLeave={() => setIsBankDropZoneActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsBankDropZoneActive(false);
                const file = event.dataTransfer.files?.[0];
                if (file) handleImportBankCsv(file);
              }}
            >
              <UploadCloud size={34} className="mx-auto text-primary" />
              <p className="mt-3 font-medium">Drag and drop bank CSV here</p>
              <p className="text-sm text-muted-foreground">Expected columns: Date, Amount, and Reference/Description (Zenith, GTB, Access formats).</p>
              <label className="inline-block mt-4">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleImportBankCsv(file);
                  }}
                />
                <span className="inline-flex items-center px-3 py-2 rounded border border-border bg-background cursor-pointer">Select CSV File</span>
              </label>
              {bankImportFileName && (
                <p className="text-xs text-muted-foreground mt-2">Imported: {bankImportFileName}</p>
              )}
              {bankImportError && (
                <p className="text-sm text-red-600 mt-2">{bankImportError}</p>
              )}
            </div>
          </Card>

          <Card title="Reconciliation Workspace">
            {bankTransactions.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                Import a bank statement to begin side-by-side reconciliation.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Bank Transactions</p>
                  <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
                    {bankTransactions.map((transaction) => (
                      <div key={transaction.id} className="rounded border border-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                            <p className="text-xs text-muted-foreground">{transaction.date}</p>
                          </div>
                          {!transaction.matchedReceiptId && !autoMatchedReceiptByTransaction[transaction.id] ? (
                            <Badge variant="rejected" className="inline-flex items-center gap-1"><Link2Off size={12} />Unmatched</Badge>
                          ) : (
                            <Badge variant="approved" className="inline-flex items-center gap-1"><Link size={12} />Match Candidate</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{transaction.reference}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Matched Receipts</p>
                  <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
                    {bankTransactions.map((transaction) => {
                      const explicitMatch = transaction.matchedReceiptId
                        ? receipts.find((receipt) => receipt.id === transaction.matchedReceiptId) || null
                        : null;
                      const autoMatch = autoMatchedReceiptByTransaction[transaction.id];
                      const matchedReceipt = explicitMatch || autoMatch;

                      return (
                        <div key={`${transaction.id}-match`} className="rounded border border-border p-3">
                          {matchedReceipt ? (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">{matchedReceipt.studentName}</p>
                                <Badge variant="approved">Receipt #{matchedReceipt.id}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{matchedReceipt.className} • {formatCurrency(matchedReceipt.verifiedAmount)}</p>
                              {transaction.matchedReceiptId ? (
                                <p className="text-xs mt-2 text-green-700 dark:text-green-300">
                                  {transaction.matchedManually ? 'Manually linked and marked as verified by bank.' : 'Matched and marked as verified by bank.'}
                                </p>
                              ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openManualLinkModal(transaction.id)}>
                                    Find Manually
                                  </Button>
                                  <Button size="sm" onClick={() => handleConfirmAutoMatch(transaction.id, matchedReceipt.id)}>
                                    <Link size={14} className="mr-1" />Mark as Matched
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-red-600 inline-flex items-center gap-1"><Link2Off size={14} />No Match Found</p>
                              <p className="text-xs text-muted-foreground mt-1">No receipt within ±2 days and exact amount for {formatCurrency(transaction.amount)}.</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => openManualLinkModal(transaction.id)}>
                                  Find Manually
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openCreateVirtualReceipt(transaction.id)}>
                                  <UserPlus size={14} className="mr-1" />Create Missing Receipt
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card title="Unreconciled Transactions Audit List" action={<Badge variant="rejected">{unreconciledBankTransactions.length} unmatched</Badge>}>
            {unreconciledBankTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unreconciled transactions in current import.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2">Date</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Reference</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unreconciledBankTransactions.map((transaction) => (
                      <tr key={`${transaction.id}-audit`} className="border-b border-border">
                        <td className="py-2">{transaction.date}</td>
                        <td className="py-2 font-medium text-red-700 dark:text-red-300">{formatCurrency(transaction.amount)}</td>
                        <td className="py-2">{transaction.reference}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openManualLinkModal(transaction.id)}>Find Manually</Button>
                            <Button size="sm" variant="outline" onClick={() => openCreateVirtualReceipt(transaction.id)}>Create Missing Receipt</Button>
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

      {activeTab === 'feeitems' && (
        <Card
          title="Fee Items Management"
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBulkAssignModal(true)}>
                <UserCheck size={16} className="mr-1" />Apply to Class
              </Button>
              <Button size="sm" onClick={() => openFeeItemEditor()}>
                <PlusCircle size={16} className="mr-1" />Add Fee Item
              </Button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2">Name and Category</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Scope</th>
                  <th className="py-2">Due Date</th>
                  <th className="py-2">Compulsory</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeeCatalog.map((feeItem) => (
                  <tr key={feeItem.id} className="border-b border-border">
                    <td className="py-2">
                      <p className="font-medium">{feeItem.name}</p>
                      <p className="text-xs text-muted-foreground">{feeItem.category}</p>
                    </td>
                    <td className="py-2">{formatCurrency(feeItem.amount)}</td>
                    <td className="py-2">{feeItem.term} • {classScopeLabel(feeItem.classId)}</td>
                    <td className="py-2">{feeItem.dueDate}</td>
                    <td className="py-2">
                      <Badge variant={feeItem.isCompulsory ? 'approved' : 'default'}>{feeItem.isCompulsory ? 'Yes' : 'No'}</Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={feeItemStatusBadge(feeItem.status).variant}>{feeItemStatusBadge(feeItem.status).text}</Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {(feeItem.status === 'draft' || feeItem.status === 'rejected') && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openFeeItemEditor(feeItem)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => duplicateFeeItem(feeItem)}>
                              <Copy size={14} className="mr-1" />Duplicate
                            </Button>
                            <Button size="sm" onClick={() => submitFeeItemForApproval(feeItem.id)}>
                              Submit for Approval
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => softDeleteFeeItem(feeItem.id)}>
                              <Trash2 size={14} className="mr-1" />Soft Delete
                            </Button>
                          </>
                        )}
                        {feeItem.status === 'pending_approval' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => withdrawFeeItemApproval(feeItem.id)}>
                              Withdraw
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => softDeleteFeeItem(feeItem.id)}>
                              <Trash2 size={14} className="mr-1" />Soft Delete
                            </Button>
                          </>
                        )}
                        {feeItem.status === 'approved' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => viewFeeItemDetails(feeItem)}>
                              View
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => softDeleteFeeItem(feeItem.id)}>
                              <Trash2 size={14} className="mr-1" />Soft Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <Card
            title="Financial Reports & Analytics"
            action={
              <div className="flex items-center gap-2 text-sm">
                <Filter size={14} className="text-muted-foreground" />
                <select
                  className="p-2 border border-border rounded bg-input-background"
                  value={reportsTerm}
                  onChange={(e) => setReportsTerm(e.target.value)}
                >
                  {termOptions.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
            }
          >
            <div className="text-sm text-muted-foreground">All KPIs, charts, and ageing data refresh automatically for the selected term.</div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <p className="text-sm text-muted-foreground">Total Fees Invoiced</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(reportMetrics.totalFeesInvoiced)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold mt-2 text-green-700 dark:text-green-300">{formatCurrency(reportMetrics.totalCollected)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold mt-2 text-red-700 dark:text-red-300">{formatCurrency(reportMetrics.outstandingBalance)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Collection Rate (%)</p>
              <p className="text-2xl font-bold mt-2 inline-flex items-center gap-1"><TrendingUp size={16} />{reportMetrics.collectionRate}%</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">System Alerts</p>
              <p className="text-2xl font-bold mt-2 inline-flex items-center gap-1 text-red-700 dark:text-red-300"><AlertTriangle size={16} />{reportMetrics.unresolvedMismatches}</p>
            </Card>
          </div>

          <Card title="Revenue by Class (Collected vs Outstanding)">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByClassChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="collected" name="Collected" fill="#16a34a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#b91c1c" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            title="Debt Ageing Report"
            action={
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <Button size="sm" variant={ageingViewMode === 'class' ? 'primary' : 'outline'} onClick={() => setAgeingViewMode('class')}>By Class</Button>
                <Button size="sm" variant={ageingViewMode === 'student' ? 'primary' : 'outline'} onClick={() => setAgeingViewMode('student')}>By Student</Button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2">{ageingViewMode === 'class' ? 'Class Name' : 'Student Name'}</th>
                    <th className="py-2">Current (&lt;30 days)</th>
                    <th className="py-2">Delinquent (30-60 days)</th>
                    <th className="py-2">Critical (&gt;60 days)</th>
                  </tr>
                </thead>
                <tbody>
                  {ageingRows.map((row) => (
                    <tr key={row.label} className="border-b border-border">
                      <td className="py-2 font-medium">{row.label}</td>
                      <td className="py-2">{formatCurrency(row.current)}</td>
                      <td className="py-2 text-amber-700 dark:text-amber-300">{formatCurrency(row.delinquent)}</td>
                      <td className="py-2 text-red-700 dark:text-red-300 font-semibold">{formatCurrency(row.critical)}</td>
                    </tr>
                  ))}
                  {ageingRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">No outstanding balances for this term.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Export & Audit Center" action={<PieChart size={16} className="text-muted-foreground" />}>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportMasterFinancialReport}>
                <Download size={14} className="mr-1" />Master Financial Report (CSV)
              </Button>
              <Button variant="outline" onClick={handleExportAgeingSummary}>
                <Download size={14} className="mr-1" />Ageing Summary (CSV)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <Card
            title="Immutable Financial Transaction Ledger"
            action={<ShieldCheck size={16} className="text-emerald-700 dark:text-emerald-300" />}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">This audit log is an immutable record. Timestamps are synced to the server time.</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleExportFinancialAuditCsv}>
                  <FileText size={14} className="mr-1" />Export Audit Trail to CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrintFinancialAuditPage}>
                  <Printer size={14} className="mr-1" />Print Log Page
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-muted-foreground">Visible Audit Entries</p>
              <p className="text-2xl font-bold mt-2">{filteredFinancialLogs.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">High-Risk Events</p>
              <p className="text-2xl font-bold mt-2 text-red-700 dark:text-red-300">{highRiskLogCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Actors in Scope</p>
              <p className="text-2xl font-bold mt-2">{actorOptions.length}</p>
            </Card>
          </div>

          <Card title="Security-First Oversight Filters" action={<UserCog size={16} className="text-muted-foreground" />}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={auditFilters.actorId}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, actorId: e.target.value }))}
              >
                <option value="">All Actors</option>
                {actorOptions.map((actor) => (
                  <option key={actor.userId} value={actor.userId}>{actor.userName} ({actor.userRole})</option>
                ))}
              </select>
              <select
                className="p-2 border border-border rounded bg-input-background"
                value={auditFilters.actionType}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, actionType: e.target.value }))}
              >
                <option value="">All Action Types</option>
                {Object.entries(financialActionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Student Name or ID"
                className="p-2 border border-border rounded bg-input-background"
                value={auditFilters.studentContext}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, studentContext: e.target.value }))}
              />
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
          </Card>

          <Card title="Audit Ledger" action={<History size={16} className="text-muted-foreground" />}>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left bg-accent/20">
                    <th className="py-2 px-2">Timestamp</th>
                    <th className="py-2 px-2">User</th>
                    <th className="py-2 px-2">Action & Description</th>
                    <th className="py-2 px-2">Impact Detail</th>
                    <th className="py-2 px-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFinancialLogs.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-border ${entry.riskLevel === 'high' ? 'bg-red-50/70 dark:bg-red-950/20' : 'hover:bg-muted/20'}`}
                    >
                      <td className="py-2 px-2 whitespace-nowrap">{entry.timestamp.replace('T', ' ').slice(0, 19)}</td>
                      <td className="py-2 px-2">
                        <p className="font-medium">{entry.userName}</p>
                        <p className="text-xs text-muted-foreground">{entry.userRole} • {entry.userId}</p>
                      </td>
                      <td className="py-2 px-2">
                        <p className="font-medium">{financialActionLabels[entry.actionType]}</p>
                        <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                        {entry.studentName && (
                          <p className="text-xs text-muted-foreground mt-1">Student: {entry.studentName} ({entry.studentId})</p>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs">{formatImpactDetail(entry)}</td>
                      <td className="py-2 px-2">
                        {entry.riskLevel === 'high' ? (
                          <Badge variant="rejected">⚠ High Risk</Badge>
                        ) : (
                          <Badge variant="approved">Low Risk</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredFinancialLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">No financial audit events in the selected filter range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {reviewReceipt && reviewLedger && (
        <Modal
          isOpen
          onClose={closeReviewModal}
          title={`Audit & Allocation - ${reviewReceipt.studentName}`}
          footer={
            <>
              <Button variant="outline" onClick={closeReviewModal}>Cancel</Button>
              <Button variant="outline" onClick={handleFlagReviewedReceipt}>
                <AlertTriangle size={14} className="mr-1" />Flag
              </Button>
              <Button variant="destructive" onClick={handleRejectReviewedReceipt}>
                <XCircle size={14} className="mr-1" />Reject
              </Button>
              <Button variant="primary" disabled={!canApproveReviewedReceipt} onClick={handleApproveReviewedReceipt}>
                <FileCheck size={14} className="mr-1" />Approve
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Evidence Review</p>
                <div className="border border-border rounded p-3 bg-muted/20">
                  <p className="text-sm mb-2">Receipt Preview</p>
                  <div className="h-40 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                    Uploaded receipt preview placeholder
                  </div>
                  <a href={reviewReceipt.receiptUrl} className="inline-flex items-center gap-1 mt-2 text-sm text-primary">
                    <ExternalLink size={13} />Open original receipt
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm border border-border rounded p-3">
                  <div>
                    <p className="text-muted-foreground">Parent-entered Date</p>
                    <p>{reviewReceipt.parentEnteredDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reference Number</p>
                    <p>{reviewReceipt.referenceNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Declared Amount</p>
                    <p>{formatCurrency(reviewReceipt.declaredAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Verified Amount</p>
                    <p>{formatCurrency(reviewReceipt.verifiedAmount)}</p>
                  </div>
                </div>

                {reviewReceipt.mismatch && (
                  <div className="p-3 rounded border border-red-200 bg-red-50 dark:bg-red-950/30 text-sm">
                    <p className="font-medium text-red-700 dark:text-red-200">Mismatch detected</p>
                    <p>{reviewReceipt.mismatchReason || 'AI extraction differs from parent declaration.'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Allocation Logic</p>
                <div className="space-y-2 border border-border rounded p-3">
                  {reviewAllocationList.map((feeItem) => (
                    <div key={feeItem.feeItemId} className="grid grid-cols-[1fr_110px] items-center gap-2">
                      <div>
                        <p className="text-sm font-medium">{feeItem.name}</p>
                        <p className="text-xs text-muted-foreground">Outstanding: {formatCurrency(feeItem.balance)}</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={feeItem.balance}
                        value={allocationDraft[feeItem.feeItemId] ?? 0}
                        onChange={(e) =>
                          setAllocationDraft((prev) => ({
                            ...prev,
                            [feeItem.feeItemId]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="p-2 border border-border rounded bg-input-background"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded border border-border text-sm space-y-1">
                  <p>Allocated Total: <span className="font-semibold">{formatCurrency(allocationSum)}</span></p>
                  <p>Verified Receipt: <span className="font-semibold">{formatCurrency(reviewReceipt.verifiedAmount)}</span></p>
                  <p>Unallocated Balance: <span className="font-semibold">{formatCurrency(Math.max(0, reviewReceipt.verifiedAmount - allocationSum))}</span></p>
                  {allocationSum > reviewReceipt.verifiedAmount && (
                    <p className="text-red-600">Allocation cannot exceed verified amount.</p>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={partialPaymentEnabled}
                    onChange={(e) => setPartialPaymentEnabled(e.target.checked)}
                  />
                  Partial payment toggle (mark student as partially paid if outstanding remains)
                </label>

                <div>
                  <label className="text-sm block mb-1">Internal Log</label>
                  <textarea
                    rows={3}
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={internalLog}
                    onChange={(e) => setInternalLog(e.target.value)}
                    placeholder="Matched by bank reference, parent name differs..."
                  />
                </div>

                <div>
                  <label className="text-sm block mb-1">Reject Reason (required on reject)</label>
                  <textarea
                    rows={2}
                    className="w-full p-2 border border-border rounded bg-input-background"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="State why this receipt is rejected"
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {manualLinkTransactionId && (
        <Modal
          isOpen
          onClose={() => {
            setManualLinkTransactionId(null);
            setManualLinkReceiptId(null);
          }}
          title="Manual Receipt Link"
          footer={
            <>
              <Button variant="outline" onClick={() => setManualLinkTransactionId(null)}>Cancel</Button>
              <Button variant="primary" disabled={!manualLinkReceiptId} onClick={handleConfirmManualLink}>
                <Link size={14} className="mr-1" />Mark as Matched
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select one pending receipt to link this bank transaction.</p>
            <div className="max-h-72 overflow-y-auto border border-border rounded p-2 space-y-2">
              {pendingReceipts.length === 0 && <p className="text-sm text-muted-foreground">No pending receipts available.</p>}
              {pendingReceipts.map((receipt) => (
                <label key={receipt.id} className="flex items-start gap-2 p-2 rounded hover:bg-muted/40">
                  <input
                    type="radio"
                    name="manual-link-receipt"
                    value={receipt.id}
                    disabled={mappedBankReceiptIds.has(receipt.id)}
                    checked={manualLinkReceiptId === receipt.id}
                    onChange={() => setManualLinkReceiptId(receipt.id)}
                  />
                  <span className="text-sm">
                    <span className="font-medium">{receipt.studentName}</span> ({receipt.className}) - {formatCurrency(receipt.verifiedAmount)}
                    {mappedBankReceiptIds.has(receipt.id) && <span className="text-xs text-muted-foreground"> • already linked</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {virtualReceiptTransactionId && (
        <Modal
          isOpen
          onClose={() => setVirtualReceiptTransactionId(null)}
          title="Create Missing Receipt"
          footer={
            <>
              <Button variant="outline" onClick={() => setVirtualReceiptTransactionId(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateVirtualReceipt}>Create Virtual Receipt</Button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Student Name</label>
              <input
                type="text"
                className="w-full p-2 border border-border rounded bg-input-background"
                value={virtualReceiptDraft.studentName}
                onChange={(e) => setVirtualReceiptDraft((prev) => ({ ...prev, studentName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm block mb-1">Class</label>
                <select
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={virtualReceiptDraft.className}
                  onChange={(e) => setVirtualReceiptDraft((prev) => ({ ...prev, className: e.target.value }))}
                >
                  <option value="">Select class...</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Term</label>
                <select
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={virtualReceiptDraft.term}
                  onChange={(e) => setVirtualReceiptDraft((prev) => ({ ...prev, term: e.target.value }))}
                >
                  {termOptions.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Payer Label</label>
              <input
                type="text"
                className="w-full p-2 border border-border rounded bg-input-background"
                value={virtualReceiptDraft.parentName}
                onChange={(e) => setVirtualReceiptDraft((prev) => ({ ...prev, parentName: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {showAdjustmentModal && adjustmentTargetId && (
        <Modal
          isOpen
          onClose={() => setShowAdjustmentModal(false)}
          title="Manual Credit/Debit Adjustment"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowAdjustmentModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={saveManualAdjustment}>Save Adjustment</Button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Amount</label>
              <input
                type="number"
                min={0}
                className="w-full p-2 border border-border rounded bg-input-background"
                value={adjustmentDraft.amount}
                onChange={(e) => setAdjustmentDraft((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">Type</label>
              <select
                className="w-full p-2 border border-border rounded bg-input-background"
                value={adjustmentDraft.type}
                onChange={(e) => {
                  const type = e.target.value as AdjustmentType;
                  setAdjustmentDraft((prev) => ({ ...prev, type, direction: getDefaultDirection(type) }));
                }}
              >
                <option>Discount</option>
                <option>Waiver</option>
                <option>Fine</option>
                <option>Error Correction</option>
              </select>
            </div>

            {adjustmentDraft.type === 'Error Correction' && (
              <div>
                <label className="text-sm block mb-1">Direction</label>
                <select
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={adjustmentDraft.direction}
                  onChange={(e) => setAdjustmentDraft((prev) => ({ ...prev, direction: e.target.value as 'credit' | 'debit' }))}
                >
                  <option value="credit">Credit (reduces balance)</option>
                  <option value="debit">Debit (increases balance)</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-sm block mb-1">Reason</label>
              <textarea
                rows={3}
                className="w-full p-2 border border-border rounded bg-input-background"
                value={adjustmentDraft.reason}
                onChange={(e) => setAdjustmentDraft((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Mandatory reason for audit trail..."
              />
            </div>
          </div>
        </Modal>
      )}

      {showFeeItemModal && (
        <Modal
          isOpen
          onClose={() => setShowFeeItemModal(false)}
          title={editingFeeItem ? 'Edit Fee Item' : 'Add Fee Item'}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowFeeItemModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={saveFeeItem}
              >
                Save
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm block mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={feeItemDraft.name}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Category</label>
                <input
                  type="text"
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={feeItemDraft.category}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, category: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm block mb-1">Price (₦)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={feeItemDraft.amount}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={feeItemDraft.dueDate}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm block mb-1">Academic Term</label>
                <select
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={feeItemDraft.termId}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, termId: Number(e.target.value) }))}
                >
                  {termDirectory.map((term) => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Target Audience</label>
                <select
                  className="w-full p-2 border border-border rounded bg-input-background"
                  value={feeItemDraft.classId === null ? 'all' : String(feeItemDraft.classId)}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, classId: e.target.value === 'all' ? null : Number(e.target.value) }))}
                >
                  <option value="all">All Classes</option>
                  {classDirectory.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={feeItemDraft.isCompulsory}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, isCompulsory: e.target.checked }))}
                />
                Compulsory
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={feeItemDraft.isActive}
                  onChange={(e) => setFeeItemDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
          </div>
        </Modal>
      )}

      {showBulkAssignModal && (
        <Modal
          isOpen
          onClose={() => setShowBulkAssignModal(false)}
          title="Bulk Assignment Wizard"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowBulkAssignModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={executeBulkAssignment}>
                Confirm Assignment
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
              Step 1: Choose a class. Step 2: Choose one or more fee items. Step 3: Confirm mass billing action.
            </div>

            <div>
              <label className="text-sm block mb-1">Target Class</label>
              <select
                className="w-full p-2 border border-border rounded bg-input-background"
                value={bulkAssignClassId ?? ''}
                onChange={(e) => setBulkAssignClassId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select class...</option>
                {classDirectory.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-2">Fee Items</label>
              <div className="space-y-2 max-h-56 overflow-y-auto border border-border rounded p-2">
                {feeCatalog.filter((entry) => entry.isActive && entry.status === 'approved').map((entry) => (
                  <label key={entry.id} className="flex items-center justify-between gap-2 text-sm p-2 rounded hover:bg-muted/40">
                    <span>
                      {entry.name} • {entry.term} • {formatCurrency(entry.amount)}
                    </span>
                    <input
                      type="checkbox"
                      checked={bulkAssignFeeItemIds.includes(entry.id)}
                      onChange={() => toggleBulkFeeSelection(entry.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
