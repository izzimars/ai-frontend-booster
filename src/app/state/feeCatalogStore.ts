export type FeeItemStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export type FeeItemCatalog = {
  id: number;
  name: string;
  category: string;
  amount: number;
  termId: number;
  term: string;
  classId: number | null;
  isCompulsory: boolean;
  isActive: boolean;
  dueDate: string;
  status: FeeItemStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
};

const FEE_CATALOG_STORAGE_KEY = 'shared-fee-catalog-v1';
const FEE_CATALOG_UPDATED_EVENT = 'fee-catalog-updated';

export const feeCatalogSeed: FeeItemCatalog[] = [
  {
    id: 1,
    name: 'Tuition Fee',
    category: 'Academic',
    amount: 35000,
    termId: 2,
    term: 'Term 3, 2026',
    classId: null,
    isCompulsory: true,
    isActive: true,
    dueDate: '2026-03-15',
    status: 'approved',
    submittedAt: '2026-02-20T10:30:00.000Z',
    approvedAt: '2026-02-21T11:15:00.000Z',
    rejectionReason: null,
  },
  {
    id: 2,
    name: 'Lab Fee',
    category: 'Facility',
    amount: 10000,
    termId: 2,
    term: 'Term 3, 2026',
    classId: 1,
    isCompulsory: true,
    isActive: true,
    dueDate: '2026-03-15',
    status: 'approved',
    submittedAt: '2026-02-21T09:45:00.000Z',
    approvedAt: '2026-02-22T14:05:00.000Z',
    rejectionReason: null,
  },
  {
    id: 3,
    name: 'Sports Fee',
    category: 'Activity',
    amount: 5000,
    termId: 2,
    term: 'Term 3, 2026',
    classId: null,
    isCompulsory: false,
    isActive: true,
    dueDate: '2026-03-15',
    status: 'draft',
    submittedAt: null,
    approvedAt: null,
    rejectionReason: null,
  },
  {
    id: 4,
    name: 'Books Fee',
    category: 'Academic',
    amount: 8000,
    termId: 1,
    term: 'Term 2, 2026',
    classId: null,
    isCompulsory: true,
    isActive: true,
    dueDate: '2026-01-20',
    status: 'rejected',
    submittedAt: '2026-01-05T08:10:00.000Z',
    approvedAt: null,
    rejectionReason: 'Please break this into per-level line items.',
  },
];

const normalizeFeeItem = (item: Partial<FeeItemCatalog>): FeeItemCatalog => ({
  id: Number(item.id ?? 0),
  name: String(item.name ?? ''),
  category: String(item.category ?? 'General'),
  amount: Number(item.amount ?? 0),
  termId: Number(item.termId ?? 0),
  term: String(item.term ?? ''),
  classId: typeof item.classId === 'number' ? item.classId : null,
  isCompulsory: Boolean(item.isCompulsory),
  isActive: item.isActive !== false,
  dueDate: String(item.dueDate ?? ''),
  status:
    item.status === 'draft' ||
    item.status === 'pending_approval' ||
    item.status === 'approved' ||
    item.status === 'rejected'
      ? item.status
      : 'draft',
  submittedAt: typeof item.submittedAt === 'string' ? item.submittedAt : null,
  approvedAt: typeof item.approvedAt === 'string' ? item.approvedAt : null,
  rejectionReason: typeof item.rejectionReason === 'string' ? item.rejectionReason : null,
});

const emitCatalogUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FEE_CATALOG_UPDATED_EVENT));
};

export const canEditFeeItem = (status: FeeItemStatus) => status === 'draft' || status === 'rejected';

export const loadFeeCatalog = (): FeeItemCatalog[] => {
  if (typeof window === 'undefined') return feeCatalogSeed;

  try {
    const stored = window.localStorage.getItem(FEE_CATALOG_STORAGE_KEY);
    if (!stored) return feeCatalogSeed;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return feeCatalogSeed;

    return parsed.map((item) => normalizeFeeItem(item as Partial<FeeItemCatalog>));
  } catch {
    return feeCatalogSeed;
  }
};

export const saveFeeCatalog = (catalog: FeeItemCatalog[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FEE_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  emitCatalogUpdated();
};

const mutateCatalog = (mutator: (catalog: FeeItemCatalog[]) => FeeItemCatalog[]) => {
  const current = loadFeeCatalog();
  const next = mutator(current);
  saveFeeCatalog(next);
  return next;
};

export const subscribeFeeCatalogUpdates = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === FEE_CATALOG_STORAGE_KEY) {
      listener();
    }
  };

  const onCustom = () => listener();

  window.addEventListener('storage', onStorage);
  window.addEventListener(FEE_CATALOG_UPDATED_EVENT, onCustom);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(FEE_CATALOG_UPDATED_EVENT, onCustom);
  };
};

export const submitForApproval = (itemId: number) =>
  mutateCatalog((catalog) =>
    catalog.map((item) => {
      if (item.id !== itemId || !canEditFeeItem(item.status)) return item;
      return {
        ...item,
        status: 'pending_approval',
        submittedAt: new Date().toISOString(),
        approvedAt: null,
        rejectionReason: null,
      };
    }),
  );

export const withdrawApproval = (itemId: number) =>
  mutateCatalog((catalog) =>
    catalog.map((item) => {
      if (item.id !== itemId || item.status !== 'pending_approval') return item;
      return {
        ...item,
        status: 'draft',
      };
    }),
  );

export const approveFeeItem = (itemId: number) =>
  mutateCatalog((catalog) =>
    catalog.map((item) => {
      if (item.id !== itemId || item.status !== 'pending_approval') return item;
      return {
        ...item,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        rejectionReason: null,
      };
    }),
  );

export const rejectFeeItem = (itemId: number, reason: string) =>
  mutateCatalog((catalog) =>
    catalog.map((item) => {
      if (item.id !== itemId || item.status !== 'pending_approval') return item;
      return {
        ...item,
        status: 'rejected',
        rejectionReason: reason.trim() || null,
      };
    }),
  );
