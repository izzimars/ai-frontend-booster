import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Upload } from 'lucide-react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card } from '../Card';

type LedgerStatus = 'Approved' | 'Pending' | 'Declined';

interface FeeItem {
  id: string;
  name: string;
  amount: number;
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: LedgerStatus;
}

interface StudentLedger {
  studentId: string;
  termLabel: string;
  nextInstallmentDue: string;
  policyWeeksFromResumption: number;
  totalBilled: number;
  feeItems: FeeItem[];
  entries: LedgerEntry[];
}

interface ReceiptUpload {
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface ReceiptQueueItem {
  id: string;
  studentId: string;
  feeType: string;
  amountPaid: number;
  senderBankName: string;
  senderAccountName: string;
  receipt: ReceiptUpload;
  status: 'Awaiting Verification' | 'Approved' | 'Declined';
  submittedAt: string;
}

interface FinanceFeeManagementViewProps {
  studentId: string;
  studentName: string;
  outstandingBalance: number;
  onBack: () => void;
}

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

function studentLedgerStoreKey() {
  return 'studentLedger';
}

function bursarQueueStoreKey() {
  return 'bursarReceiptQueue';
}

const SCHOOL_ACCOUNT_INFO = {
  bankName: 'OPay',
  accountNumber: '8140092201',
  accountName: 'Greenwood Academy Official',
};

export function FinanceFeeManagementView({
  studentId,
  studentName,
  outstandingBalance,
  onBack,
}: FinanceFeeManagementViewProps) {
  const [ledger, setLedger] = useState<StudentLedger | null>(null);
  const [selectedFeeType, setSelectedFeeType] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [senderBankName, setSenderBankName] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [receiptFile, setReceiptFile] = useState<ReceiptUpload | null>(null);

  const defaultLedger = useMemo<StudentLedger>(() => {
    return {
      studentId,
      termLabel: 'Term 2, 2026',
      nextInstallmentDue: '2026-04-18',
      policyWeeksFromResumption: 3,
      totalBilled: 95000,
      feeItems: [
        { id: 'tuition', name: 'Tuition', amount: 60000 },
        { id: 'bus', name: 'Bus', amount: 15000 },
        { id: 'uniform', name: 'Uniform', amount: 10000 },
        { id: 'exam', name: 'Exam Fees', amount: 10000 },
      ],
      entries: [
        {
          id: `entry-${studentId}-tuition`,
          date: '2026-04-02T09:30:00Z',
          description: 'Term 2 Tuition',
          amount: 40000,
          status: 'Approved',
        },
        {
          id: `entry-${studentId}-bus`,
          date: '2026-04-05T12:10:00Z',
          description: 'Bus Fee Installment',
          amount: Math.max(0, 95000 - outstandingBalance - 40000),
          status: 'Approved',
        },
      ],
    };
  }, [outstandingBalance, studentId]);

  useEffect(() => {
    const allLedgers = readJsonFromStorage<Record<string, StudentLedger>>(studentLedgerStoreKey(), {});
    if (!allLedgers[studentId]) {
      writeJsonToStorage(studentLedgerStoreKey(), {
        ...allLedgers,
        [studentId]: defaultLedger,
      });
    }

    const refresh = () => {
      const latest = readJsonFromStorage<Record<string, StudentLedger>>(studentLedgerStoreKey(), {});
      setLedger(latest[studentId] ?? defaultLedger);
    };

    refresh();

    const onStorage = (event: StorageEvent) => {
      if (event.key === studentLedgerStoreKey()) {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, [defaultLedger, studentId]);

  const approvedTotalPaid = useMemo(() => {
    if (!ledger) {
      return 0;
    }
    return ledger.entries
      .filter((entry) => entry.status === 'Approved')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [ledger]);

  const outstanding = useMemo(() => {
    if (!ledger) {
      return 0;
    }
    return Math.max(0, ledger.totalBilled - approvedTotalPaid);
  }, [approvedTotalPaid, ledger]);

  const onReceiptPicked = (file: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        return;
      }
      setReceiptFile({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const submitPayment = () => {
    if (!ledger) {
      return;
    }

    if (!selectedFeeType || !amountPaid || !senderBankName || !senderAccountName || !receiptFile) {
      window.alert('Please complete all payment submission fields.');
      return;
    }

    const amount = Number(amountPaid);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Amount paid must be a valid number greater than zero.');
      return;
    }

    const receiptQueue = readJsonFromStorage<ReceiptQueueItem[]>(bursarQueueStoreKey(), []);
    const queueItem: ReceiptQueueItem = {
      id: `receipt-${Date.now()}`,
      studentId,
      feeType: selectedFeeType,
      amountPaid: amount,
      senderBankName,
      senderAccountName,
      receipt: receiptFile,
      status: 'Awaiting Verification',
      submittedAt: new Date().toISOString(),
    };

    writeJsonToStorage(bursarQueueStoreKey(), [queueItem, ...receiptQueue]);

    const pendingEntry: LedgerEntry = {
      id: `pending-${Date.now()}`,
      date: new Date().toISOString(),
      description: `${selectedFeeType} - Parent Upload`,
      amount,
      status: 'Pending',
    };

    const allLedgers = readJsonFromStorage<Record<string, StudentLedger>>(studentLedgerStoreKey(), {});
    const updatedLedger: StudentLedger = {
      ...ledger,
      entries: [pendingEntry, ...ledger.entries],
    };

    writeJsonToStorage(studentLedgerStoreKey(), {
      ...allLedgers,
      [studentId]: updatedLedger,
    });

    setLedger(updatedLedger);
    setSelectedFeeType('');
    setAmountPaid('');
    setSenderBankName('');
    setSenderAccountName('');
    setReceiptFile(null);

    window.alert('Receipt submitted! The Bursar will verify this within 24 hours.');
  };

  const downloadStatement = () => {
    if (!ledger) {
      return;
    }

    const lines = [
      `Statement of Account - ${studentName}`,
      `Term: ${ledger.termLabel}`,
      `Generated At: ${new Date().toISOString()}`,
      '',
      `Total Billed: NGN ${ledger.totalBilled.toLocaleString()}`,
      `Total Paid (Approved): NGN ${approvedTotalPaid.toLocaleString()}`,
      `Outstanding Balance: NGN ${outstanding.toLocaleString()}`,
      '',
      'Entries:',
      ...ledger.entries.map(
        (entry) =>
          `${new Date(entry.date).toLocaleDateString()} | ${entry.description} | NGN ${entry.amount.toLocaleString()} | ${entry.status}`,
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `statement-${studentId}-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!ledger) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Parent Dashboard</p>
          <h2 className="text-2xl font-semibold">Finance & Fee Management</h2>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Finance
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-slate-50 via-white to-red-50 border-red-200" title="Executive Balance Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Billed</p>
            <p className="text-3xl font-semibold">₦{ledger.totalBilled.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Paid (Approved)</p>
            <p className="text-3xl font-semibold text-green-700">₦{approvedTotalPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className={`text-3xl font-semibold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
              ₦{outstanding.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-900">
          Next payment installment due by {new Date(ledger.nextInstallmentDue).toLocaleDateString()}. School policy requires full payment within {ledger.policyWeeksFromResumption} weeks of resumption.
        </div>
      </Card>

      <Card title="OPay Payment Uploader">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Fee Type</label>
            <select
              value={selectedFeeType}
              onChange={(event) => setSelectedFeeType(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            >
              <option value="">Select Fee Item</option>
              {ledger.feeItems.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Amount Paid</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
              placeholder="1000"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Sender's Bank Name</label>
            <input
              value={senderBankName}
              onChange={(event) => setSenderBankName(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
              placeholder="Kuda / GTBank / OPay"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Sender's Account Name</label>
            <input
              value={senderAccountName}
              onChange={(event) => setSenderAccountName(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
              placeholder="Name on bank app"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Receipt Upload</label>
            <label className="mt-1 w-full flex items-center justify-between rounded-lg border border-dashed p-3 cursor-pointer hover:bg-accent">
              <span className="text-sm text-muted-foreground">
                {receiptFile ? receiptFile.name : 'Upload transfer screenshot or receipt file'}
              </span>
              <span className="inline-flex items-center gap-1 text-sm">
                <Upload size={14} /> Select
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => onReceiptPicked(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button onClick={submitPayment}>Submit to Bursar Queue</Button>
        </div>
      </Card>

      <Card title="Official School Payment Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Bank Name</p>
            <p className="font-medium">{SCHOOL_ACCOUNT_INFO.bankName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account Number</p>
            <div className="flex items-center gap-2">
              <p className="font-medium">{SCHOOL_ACCOUNT_INFO.accountNumber}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(SCHOOL_ACCOUNT_INFO.accountNumber);
                  window.alert('Account number copied.');
                }}
              >
                <Copy size={14} /> Copy
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account Name</p>
            <p className="font-medium">{SCHOOL_ACCOUNT_INFO.accountName}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Please use the student's name or ID as the transfer narration for faster verification.
        </p>
      </Card>

      <Card
        title="Fee Allocation & Statement"
        action={
          <Button size="sm" variant="outline" onClick={downloadStatement}>
            <Download size={14} /> Download Statement of Account
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.entries
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="py-3">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="py-3">{entry.description}</td>
                    <td className="py-3">₦{entry.amount.toLocaleString()}</td>
                    <td className="py-3">
                      {entry.status === 'Approved' && <Badge variant="approved">Approved</Badge>}
                      {entry.status === 'Pending' && <Badge variant="pending">Pending</Badge>}
                      {entry.status === 'Declined' && <Badge variant="rejected">Declined</Badge>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
