import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Pencil, Pill, Plus, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { showMedication } from '../../mvpScope';

type ActivityStatus = 'not_started' | 'in_progress' | 'completed';
type AttendanceState = 'present' | 'absent' | 'late';
type AttendanceSession = 'morning' | 'afternoon' | 'subjectSpecific';
type GradeFilter = 'all' | 'present_only' | 'manual_add';
type AssessmentType = 'Classwork' | 'Quiz' | 'Project' | 'Homework' | 'Participation';
type BehaviorState = 'focused' | 'passive' | 'disruptive';
type StrengthState = 'excellent' | 'average' | 'struggling';

type AttendanceRecord = {
  session: AttendanceState;
  behavior: BehaviorState;
  strength: StrengthState;
  note: string;
};

type GuardianAnnouncement = {
  classId: string;
  date: string;
  subjectId: string;
  message: string;
  updatedAt: string;
};

type GradingSession = {
  type: AssessmentType;
  maxScore: number;
  date: string;
};

type HomeworkItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
};

type DailyActivity = {
  classId: string;
  subjectId: string;
  date: string;
  status: ActivityStatus;
  attendance: { morning: boolean; afternoon: boolean; subjectSpecific: boolean };
  attendanceRecords: Record<string, AttendanceRecord>;
  gradingSession: GradingSession;
  scores: Array<{ studentId: string; score: number }>;
  homeworkList: HomeworkItem[];
  summary: string;
  guardianAnnouncement: string;
  medicationAlerts: Array<{ studentName: string; medName: string; time: string }>;
  medicationLog: Array<{
    studentName: string;
    medName: string;
    time: string;
    status: 'administered' | 'not_administered';
    reason?: string;
  }>;
  updatedAt?: string;
};

const classCatalog = [
  { id: '0f9f9a3d-7ff5-4a86-b138-a1db915a7f11', name: 'Math 10A', subject: 'Mathematics' },
  { id: '1a0f1cb6-caa0-4a0f-ae9c-87262dcf9d31', name: 'Math 10B', subject: 'Mathematics' },
  { id: 'f4f5d3f4-0b14-4d8d-b7d6-4c2a38d44dc2', name: 'Science 10A', subject: 'Science' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819', name: 'English 10C', subject: 'English' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'English 11A', subject: 'English' },
];

const rosterByClass: Record<string, Array<{ studentId: string; name: string }>> = {
  '0f9f9a3d-7ff5-4a86-b138-a1db915a7f11': [
    { studentId: 'sarah-johnson', name: 'Sarah Johnson' },
    { studentId: 'michael-brown', name: 'Michael Brown' },
    { studentId: 'emily-davis', name: 'Emily Davis' },
  ],
  '1a0f1cb6-caa0-4a0f-ae9c-87262dcf9d31': [
    { studentId: 'isaac-cole', name: 'Isaac Cole' },
    { studentId: 'nora-white', name: 'Nora White' },
  ],
  'f4f5d3f4-0b14-4d8d-b7d6-4c2a38d44dc2': [
    { studentId: 'daniel-kent', name: 'Daniel Kent' },
    { studentId: 'laura-james', name: 'Laura James' },
  ],
  'a1b2c3d4-e5f6-7890-abcd-ef1234567819': [
    { studentId: 'oliver-james', name: 'Oliver James' },
    { studentId: 'ava-williams', name: 'Ava Williams' },
  ],
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': [
    { studentId: 'ethan-moore', name: 'Ethan Moore' },
    { studentId: 'mia-cole', name: 'Mia Cole' },
  ],
};

const medicationAlertsByClass: Record<string, Array<{ studentName: string; medName: string; time: string }>> = {
  '0f9f9a3d-7ff5-4a86-b138-a1db915a7f11': [
    { studentName: 'Sarah Johnson', medName: 'Ibuprofen 200mg', time: '10:00 AM' },
    { studentName: 'Michael Brown', medName: 'Vitamin D', time: '12:00 PM' },
  ],
  'f4f5d3f4-0b14-4d8d-b7d6-4c2a38d44dc2': [
    { studentName: 'Emily Davis', medName: 'Allergy Medicine', time: '02:00 PM' },
  ],
};

function getSessionOptionsFromBackend(attendance: DailyActivity['attendance']) {
  const options: AttendanceSession[] = ['morning', 'afternoon', 'subjectSpecific'];
  const recommended: AttendanceSession = !attendance.morning
    ? 'morning'
    : !attendance.afternoon
      ? 'afternoon'
      : 'subjectSpecific';

  return { options, recommended };
}

function getStorageKey(classId: string, date: string) {
  return `teaching-console:${classId}:${date}`;
}

function getGuardianAnnouncementStorageKey() {
  return 'class_announcements';
}

function createHomeworkItem(): HomeworkItem {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    description: '',
    dueDate: '',
  };
}

function normalizeHomeworkList(activity: DailyActivity): HomeworkItem[] {
  const legacyHomework = (activity as DailyActivity & { homework?: { title?: string; dueDate?: string } }).homework;

  if (Array.isArray(activity.homeworkList)) {
    return activity.homeworkList.map((item) => ({
      id: item.id || createHomeworkItem().id,
      title: item.title ?? '',
      description: item.description ?? '',
      dueDate: item.dueDate ?? '',
    }));
  }

  if (legacyHomework?.title || legacyHomework?.dueDate) {
    return [
      {
        id: createHomeworkItem().id,
        title: legacyHomework.title ?? '',
        description: '',
        dueDate: legacyHomework.dueDate ?? '',
      },
    ];
  }

  return [];
}

function normalizeAttendanceRecords(
  records: DailyActivity['attendanceRecords'],
): DailyActivity['attendanceRecords'] {
  return Object.entries(records || {}).reduce<DailyActivity['attendanceRecords']>((acc, [studentId, record]) => {
    const legacyRecord = record as Partial<Record<AttendanceSession, AttendanceState>> & Partial<AttendanceRecord>;
    const sessionValue =
      legacyRecord.session ??
      legacyRecord.morning ??
      legacyRecord.afternoon ??
      legacyRecord.subjectSpecific ??
      'present';

    acc[studentId] = {
      session: sessionValue,
      behavior: legacyRecord.behavior ?? 'focused',
      strength: legacyRecord.strength ?? 'average',
      note: legacyRecord.note ?? '',
    };
    return acc;
  }, {});
}

function normalizeDailyActivity(activity: DailyActivity): DailyActivity {
  return {
    ...activity,
    attendanceRecords: normalizeAttendanceRecords(activity.attendanceRecords),
    gradingSession: {
      type: activity.gradingSession?.type ?? 'Classwork',
      maxScore: activity.gradingSession?.maxScore ?? 100,
      date: activity.gradingSession?.date ?? activity.date,
    },
    scores: (activity.scores || []).map((entry) => ({ studentId: entry.studentId, score: entry.score })),
    homeworkList: normalizeHomeworkList(activity),
    guardianAnnouncement: activity.guardianAnnouncement ?? '',
  };
}

export function TeachingConsolePage() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudents, setManualStudents] = useState<Array<{ studentId: string; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<AttendanceSession>('morning');
  const [selectedNoteStudent, setSelectedNoteStudent] = useState<{ studentId: string; name: string } | null>(null);
  const [expandedHomeworkIds, setExpandedHomeworkIds] = useState<string[]>([]);
  const [newHomeworkIds, setNewHomeworkIds] = useState<string[]>([]);
  const [pendingHomeworkFocusId, setPendingHomeworkFocusId] = useState<string | null>(null);
  const scoreInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const homeworkTitleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const today = new Date().toISOString().slice(0, 10);
  const classMeta = classCatalog.find((item) => item.id === classId);
  const roster = classId ? rosterByClass[classId] || [] : [];

  const [dailyActivity, setDailyActivity] = useState<DailyActivity>({
    classId: classId || '',
    subjectId: classMeta?.subject.toLowerCase() || '',
    date: today,
    status: 'in_progress',
    attendance: { morning: false, afternoon: false, subjectSpecific: false },
    attendanceRecords: {},
    gradingSession: { type: 'Classwork', maxScore: 100, date: today },
    scores: [],
    homeworkList: [],
    summary: '',
    guardianAnnouncement: '',
    medicationAlerts: classId ? medicationAlertsByClass[classId] || [] : [],
    medicationLog: [],
  });

  const sessionConfig = useMemo(
    () => getSessionOptionsFromBackend(dailyActivity.attendance),
    [dailyActivity.attendance],
  );

  const isReadOnly = dailyActivity.status === 'completed';

  const defaultAttendanceRecord = (): AttendanceRecord => ({
    session: 'present',
    behavior: 'focused',
    strength: 'average',
    note: '',
  });

  const saveDraft = (nextState?: DailyActivity) => {
    if (!classId) return;
    const payload = {
      ...(nextState || dailyActivity),
      status: (nextState?.status || dailyActivity.status) === 'completed' ? 'completed' : 'in_progress',
      updatedAt: new Date().toISOString(),
    } as DailyActivity;

    setIsSaving(true);
    localStorage.setItem(getStorageKey(classId, payload.date), JSON.stringify(payload));

    const allAnnouncements = (() => {
      try {
        return JSON.parse(localStorage.getItem(getGuardianAnnouncementStorageKey()) || '[]') as GuardianAnnouncement[];
      } catch {
        return [] as GuardianAnnouncement[];
      }
    })();
    const nextAnnouncements = allAnnouncements.filter((item) => !(item.classId === classId && item.date === payload.date));
    if (payload.guardianAnnouncement.trim()) {
      nextAnnouncements.unshift({
        classId,
        date: payload.date,
        subjectId: payload.subjectId,
        message: payload.guardianAnnouncement.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem(getGuardianAnnouncementStorageKey(), JSON.stringify(nextAnnouncements));

    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
    }, 250);
  };

  useEffect(() => {
    if (!classId) return;
    const saved = localStorage.getItem(getStorageKey(classId, today));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DailyActivity;
        setDailyActivity(normalizeDailyActivity(parsed));
      } catch {
        // no-op fallback to defaults
      }
    }
  }, [classId, today]);

  useEffect(() => {
    setCurrentSession(sessionConfig.recommended);
  }, [sessionConfig.recommended]);

  useEffect(() => {
    if (!pendingHomeworkFocusId) return;
    const timer = window.setTimeout(() => {
      const input = homeworkTitleInputRefs.current[pendingHomeworkFocusId];
      input?.focus();
      input?.select();
      setPendingHomeworkFocusId(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pendingHomeworkFocusId, dailyActivity.homeworkList.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (hasUnsavedChanges && !isReadOnly) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [hasUnsavedChanges, isReadOnly, dailyActivity]);

  const updateActivity = (updater: (prev: DailyActivity) => DailyActivity) => {
    setDailyActivity((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const updateDisplayedStudents = (
    updater: (studentId: string, record: AttendanceRecord) => AttendanceRecord,
  ) => {
    updateActivity((prev) => ({
      ...prev,
      attendanceRecords: studentsForGrading.reduce<Record<string, AttendanceRecord>>((acc, student) => {
        const currentRecord = prev.attendanceRecords[student.studentId] ?? defaultAttendanceRecord();
        acc[student.studentId] = updater(student.studentId, currentRecord);
        return acc;
      }, { ...prev.attendanceRecords }),
    }));
  };

  const setAttendanceStatus = (studentId: string, state: AttendanceState) => {
    updateActivity((prev) => ({
      ...prev,
      attendanceRecords: {
        ...prev.attendanceRecords,
        [studentId]: {
          ...(prev.attendanceRecords[studentId] ?? defaultAttendanceRecord()),
          session: state,
        },
      },
    }));
  };

  const setBehavior = (studentId: string, behavior: BehaviorState) => {
    updateActivity((prev) => ({
      ...prev,
      attendanceRecords: {
        ...prev.attendanceRecords,
        [studentId]: {
          ...(prev.attendanceRecords[studentId] ?? defaultAttendanceRecord()),
          behavior,
        },
      },
    }));
  };

  const setStrength = (studentId: string, strength: StrengthState) => {
    updateActivity((prev) => ({
      ...prev,
      attendanceRecords: {
        ...prev.attendanceRecords,
        [studentId]: {
          ...(prev.attendanceRecords[studentId] ?? defaultAttendanceRecord()),
          strength,
        },
      },
    }));
  };

  const setNoteForStudent = (studentId: string, note: string) => {
    updateActivity((prev) => ({
      ...prev,
      attendanceRecords: {
        ...prev.attendanceRecords,
        [studentId]: {
          ...(prev.attendanceRecords[studentId] ?? defaultAttendanceRecord()),
          note,
        },
      },
    }));
  };

  const bulkSetAttendance = (state: AttendanceState) => {
    if (isReadOnly) return;
    updateDisplayedStudents((_, record) => ({ ...record, session: state }));
  };

  const bulkSetBehavior = (behavior: BehaviorState) => {
    if (isReadOnly) return;
    updateDisplayedStudents((_, record) => ({ ...record, behavior }));
  };

  const bulkSetStrength = (strength: StrengthState) => {
    if (isReadOnly) return;
    updateDisplayedStudents((_, record) => ({ ...record, strength }));
  };

  const markCurrentAttendanceTaken = () => {
    updateActivity((prev) => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [currentSession]: true,
      },
    }));
  };

  const setScore = (studentId: string, scoreValue: string) => {
    updateActivity((prev) => {
      const nextScores = prev.scores.filter((item) => item.studentId !== studentId);
      if (scoreValue.trim() !== '') {
        nextScores.push({
          studentId,
          score: Number(scoreValue),
        });
      }
      return { ...prev, scores: nextScores };
    });
  };

  const setGradingSessionType = (type: AssessmentType) => {
    updateActivity((prev) => ({
      ...prev,
      gradingSession: { ...prev.gradingSession, type },
    }));
  };

  const setGradingSessionMaxScore = (maxScore: number) => {
    updateActivity((prev) => ({
      ...prev,
      gradingSession: { ...prev.gradingSession, maxScore },
    }));
  };

  const setAllScoresToMax = () => {
    updateActivity((prev) => ({
      ...prev,
      scores: studentsForGrading.map((student) => ({
        studentId: student.studentId,
        score: prev.gradingSession.maxScore,
      })),
    }));
  };

  const updateHomeworkItem = (index: number, field: keyof HomeworkItem, value: string) => {
    updateActivity((prev) => {
      const updatedList = [...prev.homeworkList];
      updatedList[index] = {
        ...updatedList[index],
        [field]: value,
      };
      return { ...prev, homeworkList: updatedList };
    });
  };

  const addHomeworkItem = () => {
    if (isReadOnly) return;
    const nextItem = createHomeworkItem();
    setExpandedHomeworkIds((prev) => [...prev, nextItem.id]);
    setNewHomeworkIds((prev) => [...prev, nextItem.id]);
    setPendingHomeworkFocusId(nextItem.id);
    updateActivity((prev) => ({
      ...prev,
      homeworkList: [...prev.homeworkList, nextItem],
    }));
  };

  const dropHomeworkItem = (itemId: string) => {
    if (isReadOnly) return;
    updateActivity((prev) => ({
      ...prev,
      homeworkList: prev.homeworkList.filter((item) => item.id !== itemId),
    }));
    setExpandedHomeworkIds((prev) => prev.filter((id) => id !== itemId));
    setNewHomeworkIds((prev) => prev.filter((id) => id !== itemId));
  };

  const cancelHomeworkItem = (itemId: string) => {
    dropHomeworkItem(itemId);
  };

  const deleteHomeworkItem = (itemId: string) => {
    const ok = window.confirm('Delete this homework task?');
    if (!ok) return;
    dropHomeworkItem(itemId);
  };

  const toggleHomeworkDescription = (itemId: string) => {
    setExpandedHomeworkIds((prev) => (
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    ));
  };

  const focusNextScoreInput = (studentId: string) => {
    const index = studentsForGrading.findIndex((student) => student.studentId === studentId);
    const nextStudent = studentsForGrading[index + 1];
    if (nextStudent) {
      scoreInputRefs.current[nextStudent.studentId]?.focus();
      scoreInputRefs.current[nextStudent.studentId]?.select();
    }
  };

  const setMedicationAdministered = (alert: { studentName: string; medName: string; time: string }) => {
    updateActivity((prev) => ({
      ...prev,
      medicationLog: [
        ...prev.medicationLog.filter((item) => !(item.studentName === alert.studentName && item.medName === alert.medName && item.time === alert.time)),
        { ...alert, status: 'administered' },
      ],
    }));
  };

  const setMedicationNotAdministered = (alert: { studentName: string; medName: string; time: string }) => {
    const reason = window.prompt('Reason for not administered?') || 'No reason provided';
    updateActivity((prev) => ({
      ...prev,
      medicationLog: [
        ...prev.medicationLog.filter((item) => !(item.studentName === alert.studentName && item.medName === alert.medName && item.time === alert.time)),
        { ...alert, status: 'not_administered', reason },
      ],
    }));
  };

  const saveAndExit = () => {
    saveDraft({ ...dailyActivity, status: 'in_progress' });
    navigate('/');
  };

  const finalizeAndSubmit = () => {
    const finalized = { ...dailyActivity, status: 'completed' as const };
    setDailyActivity(finalized);
    saveDraft(finalized);
    window.alert('Teaching console submitted and locked.');
  };

  const handleBack = () => {
    if (hasUnsavedChanges || isSaving) {
      const ok = window.confirm('You have unsaved changes. Leave this page?');
      if (!ok) return;
    }
    navigate('/');
  };

  const studentsForGrading = useMemo(() => {
    if (gradeFilter === 'manual_add') return manualStudents;

    if (gradeFilter === 'present_only') {
      return roster.filter((student) => {
        const status = dailyActivity.attendanceRecords[student.studentId]?.session;
        return status !== 'absent';
      });
    }

    return roster;
  }, [gradeFilter, manualStudents, roster, dailyActivity.attendanceRecords, currentSession]);

  if (!classMeta || !classId) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card title="Teaching Console Not Found">
          <p className="text-muted-foreground">Class metadata not found.</p>
          <Button className="mt-4" onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" onBlurCapture={() => hasUnsavedChanges && saveDraft()}>
      {showMedication && dailyActivity.medicationAlerts.length > 0 && (
        <div className="sticky top-0 z-50 border-b border-red-300 bg-red-100 dark:bg-red-950/60">
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle size={18} />
            <p className="font-medium">Medication Alert Active for this class session</p>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-muted-foreground">Teaching Console</p>
            <h1 className="text-2xl font-semibold">{classMeta.name} • {classMeta.subject}</h1>
            <p className="text-sm text-muted-foreground">Date: {dailyActivity.date}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={dailyActivity.status === 'completed' ? 'approved' : 'pending'}>
              {dailyActivity.status === 'completed' ? 'Completed' : 'Draft'}
            </Badge>
            <span className="text-xs text-muted-foreground">{isSaving ? 'Saving...' : lastSavedAt ? `Last saved ${lastSavedAt}` : 'Not saved yet'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_370px] gap-6">
          <div className="space-y-6">
            <Card title="Smart Attendance Engine">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Current Session</label>
                    <select
                      value={currentSession}
                      onChange={(e) => setCurrentSession(e.target.value as AttendanceSession)}
                      className="p-2 border border-border rounded-lg bg-input-background text-sm"
                      disabled={isReadOnly}
                    >
                      {sessionConfig.options.map((session) => (
                        <option key={session} value={session}>
                          {session === 'subjectSpecific' ? 'Subject Attendance' : session}
                        </option>
                      ))}
                    </select>
                    <Badge variant="default" className="text-xs">Backend Suggestion: {sessionConfig.recommended === 'subjectSpecific' ? 'subject' : sessionConfig.recommended}</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={markCurrentAttendanceTaken} disabled={isReadOnly || dailyActivity.attendance[currentSession]}>
                    Mark {currentSession === 'subjectSpecific' ? 'Subject' : currentSession} Taken
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 rounded-lg border border-border bg-accent/30 p-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Mark All Attendance</p>
                    <div className="flex flex-wrap gap-2">
                      {(['present', 'late', 'absent'] as AttendanceState[]).map((state) => (
                        <Button
                          key={state}
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1"
                          onClick={() => bulkSetAttendance(state)}
                          disabled={isReadOnly}
                        >
                          {state}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Set All Behavior</p>
                    <div className="flex flex-wrap gap-2">
                      {(['focused', 'passive', 'disruptive'] as BehaviorState[]).map((behavior) => (
                        <Button
                          key={behavior}
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1"
                          onClick={() => bulkSetBehavior(behavior)}
                          disabled={isReadOnly}
                        >
                          {behavior}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Set All Strength</p>
                    <div className="flex flex-wrap gap-2">
                      {(['excellent', 'average', 'struggling'] as StrengthState[]).map((strength) => (
                        <Button
                          key={strength}
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1"
                          onClick={() => bulkSetStrength(strength)}
                          disabled={isReadOnly}
                        >
                          {strength}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="sticky left-0 z-20 bg-background text-left py-3 text-xs uppercase text-muted-foreground">Student</th>
                        <th className="text-left py-3 text-xs uppercase text-muted-foreground">Attendance</th>
                        <th className="text-left py-3 text-xs uppercase text-muted-foreground">Behavior</th>
                        <th className="text-left py-3 text-xs uppercase text-muted-foreground">Subject Strength</th>
                        <th className="text-left py-3 text-xs uppercase text-muted-foreground">Quick Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((student) => {
                        const record = dailyActivity.attendanceRecords[student.studentId] ?? defaultAttendanceRecord();

                        const attendanceButtons: Array<{ label: AttendanceState; color: string; activeClass: string }> = [
                          { label: 'present', color: 'green', activeClass: 'bg-green-600 text-white border-green-600' },
                          { label: 'late', color: 'yellow', activeClass: 'bg-yellow-500 text-white border-yellow-500' },
                          { label: 'absent', color: 'red', activeClass: 'bg-red-600 text-white border-red-600' },
                        ];

                        const behaviorButtons: Array<{ label: BehaviorState; activeClass: string }> = [
                          { label: 'focused', activeClass: 'bg-green-600 text-white border-green-600' },
                          { label: 'passive', activeClass: 'bg-yellow-500 text-white border-yellow-500' },
                          { label: 'disruptive', activeClass: 'bg-red-600 text-white border-red-600' },
                        ];

                        const strengthButtons: Array<{ label: StrengthState; activeClass: string }> = [
                          { label: 'excellent', activeClass: 'bg-green-600 text-white border-green-600' },
                          { label: 'average', activeClass: 'bg-blue-600 text-white border-blue-600' },
                          { label: 'struggling', activeClass: 'bg-orange-600 text-white border-orange-600' },
                        ];

                        return (
                          <tr key={student.studentId} className="border-b border-border">
                            <td className="sticky left-0 z-10 bg-background py-3 pr-4 font-medium">{student.name}</td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-2">
                                {attendanceButtons.map((button) => (
                                  <button
                                    key={button.label}
                                    type="button"
                                    onClick={() => setAttendanceStatus(student.studentId, button.label)}
                                    disabled={isReadOnly}
                                    className={`px-2 py-1 rounded text-xs border transition-colors ${record.session === button.label ? button.activeClass : 'bg-accent border-border'}`}
                                  >
                                    {button.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-2">
                                {behaviorButtons.map((button) => (
                                  <button
                                    key={button.label}
                                    type="button"
                                    onClick={() => setBehavior(student.studentId, button.label)}
                                    disabled={isReadOnly}
                                    className={`px-2 py-1 rounded text-xs border transition-colors capitalize ${record.behavior === button.label ? button.activeClass : 'bg-accent border-border'}`}
                                  >
                                    {button.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-2">
                                {strengthButtons.map((button) => (
                                  <button
                                    key={button.label}
                                    type="button"
                                    onClick={() => setStrength(student.studentId, button.label)}
                                    disabled={isReadOnly}
                                    className={`px-2 py-1 rounded text-xs border transition-colors capitalize ${record.strength === button.label ? button.activeClass : 'bg-accent border-border'}`}
                                  >
                                    {button.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="py-3">
                              <button
                                type="button"
                                onClick={() => !isReadOnly && setSelectedNoteStudent({ studentId: student.studentId, name: student.name })}
                                disabled={isReadOnly}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${record.note.trim() ? 'text-primary border-primary bg-primary/10' : 'text-muted-foreground border-border bg-accent'}`}
                              >
                                <Pencil size={14} />
                                <span>{record.note.trim() ? 'Attached' : 'Add Note'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-border space-y-2">
                  <label className="block text-sm font-medium">Note to All Guardians</label>
                  <textarea
                    value={dailyActivity.guardianAnnouncement}
                    onChange={(e) => updateActivity((prev) => ({ ...prev, guardianAnnouncement: e.target.value }))}
                    className="w-full min-h-[120px] p-3 border border-border rounded-lg bg-input-background"
                    placeholder="Don't forget the excursion tomorrow!"
                    disabled={isReadOnly}
                  />
                  <p className="text-xs text-muted-foreground">This note is saved to the class announcement feed for guardians in this class.</p>
                </div>
              </div>
            </Card>

            <Card title="Grading Console">
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-accent/30 p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-end">
                    <div>
                      <label className="block mb-2 text-sm text-muted-foreground">Global Assessment Type</label>
                      <select
                        value={dailyActivity.gradingSession.type}
                        onChange={(e) => setGradingSessionType(e.target.value as AssessmentType)}
                        className="w-full p-2 border border-border rounded-lg bg-input-background"
                        disabled={isReadOnly}
                      >
                        <option>Classwork</option>
                        <option>Quiz</option>
                        <option>Project</option>
                        <option>Homework</option>
                        <option>Participation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-muted-foreground">Global Max Score</label>
                      <input
                        type="number"
                        min={1}
                        value={dailyActivity.gradingSession.maxScore}
                        onChange={(e) => setGradingSessionMaxScore(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full p-2 border border-border rounded-lg bg-input-background"
                        disabled={isReadOnly}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={setAllScoresToMax} disabled={isReadOnly}>
                      Set All to Max
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Session metadata is shared across all student scores for {dailyActivity.gradingSession.date}.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={gradeFilter === 'all' ? 'primary' : 'outline'} onClick={() => setGradeFilter('all')}>All Students</Button>
                  <Button size="sm" variant={gradeFilter === 'present_only' ? 'primary' : 'outline'} onClick={() => setGradeFilter('present_only')}>Present Only</Button>
                  <Button size="sm" variant={gradeFilter === 'manual_add' ? 'primary' : 'outline'} onClick={() => setGradeFilter('manual_add')}>Manual Add</Button>
                </div>

                {gradeFilter === 'manual_add' && (
                  <div className="flex gap-2">
                    <input
                      value={manualStudentName}
                      onChange={(e) => setManualStudentName(e.target.value)}
                      className="flex-1 p-2 border border-border rounded-lg bg-input-background"
                      placeholder="Enter student name"
                      disabled={isReadOnly}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!manualStudentName.trim()) return;
                        const id = `manual-${Date.now()}`;
                        setManualStudents((prev) => [...prev, { studentId: id, name: manualStudentName.trim() }]);
                        setManualStudentName('');
                      }}
                      disabled={isReadOnly}
                    >
                      Add
                    </Button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 text-xs uppercase text-muted-foreground">Student</th>
                        <th className="text-left py-3 text-xs uppercase text-muted-foreground">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsForGrading.map((student) => {
                        const entry = dailyActivity.scores.find((item) => item.studentId === student.studentId);
                        const scoreValue = entry?.score ?? '';
                        const maxScore = dailyActivity.gradingSession.maxScore;
                        const numericScore = scoreValue === '' ? null : Number(scoreValue);
                        const isOverMax = numericScore !== null && numericScore > maxScore;
                        const isValidScore = numericScore !== null && !isOverMax;
                        const percent = numericScore !== null ? Math.round((numericScore / maxScore) * 100) : null;
                        return (
                          <tr key={student.studentId} className="border-b border-border">
                            <td className="py-3">{student.name}</td>
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                <input
                                  ref={(node) => {
                                    scoreInputRefs.current[student.studentId] = node;
                                  }}
                                  type="number"
                                  min={0}
                                  max={maxScore}
                                  value={scoreValue}
                                  onChange={(e) => setScore(student.studentId, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      focusNextScoreInput(student.studentId);
                                    }
                                  }}
                                  className={`w-28 p-2 border rounded-lg bg-input-background text-base font-semibold focus:outline-none focus:ring-2 ${
                                    isOverMax
                                      ? 'border-red-500 focus:ring-red-300'
                                      : isValidScore
                                        ? 'border-green-500 focus:ring-green-300'
                                        : 'border-border focus:ring-primary/30'
                                  }`}
                                  disabled={isReadOnly}
                                />
                                <div className="text-xs min-w-[74px]">
                                  {numericScore !== null && !isOverMax && (
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 ${numericScore === maxScore ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                      {numericScore === maxScore ? 'Success' : `${percent}%`}
                                    </span>
                                  )}
                                  {isOverMax && (
                                    <span className="inline-flex items-center rounded-full px-2 py-1 bg-red-100 text-red-700">
                                      {percent}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Press Enter or the Down Arrow to jump to the next student’s score.
                </p>
              </div>
            </Card>

            <Card title="End-of-Day Summary">
              <textarea
                value={dailyActivity.summary}
                onChange={(e) => updateActivity((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full min-h-[180px] p-3 border border-border rounded-lg bg-input-background"
                placeholder="Write summary for today..."
                disabled={isReadOnly}
              />
            </Card>
          </div>

          <div className="space-y-6">
            {showMedication && (
              <Card title="Medication Alerts">
              <div className="space-y-3">
                {dailyActivity.medicationAlerts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No medication alerts for this class.</p>
                )}

                {dailyActivity.medicationAlerts.map((alert) => {
                  const log = dailyActivity.medicationLog.find(
                    (entry) => entry.studentName === alert.studentName && entry.medName === alert.medName && entry.time === alert.time
                  );

                  return (
                    <div key={`${alert.studentName}-${alert.medName}-${alert.time}`} className="p-3 border border-border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{alert.studentName}</p>
                          <p className="text-xs text-muted-foreground">{alert.medName} • {alert.time}</p>
                        </div>
                        {log && (
                          <Badge variant={log.status === 'administered' ? 'approved' : 'rejected'}>
                            {log.status === 'administered' ? 'Administered' : 'Not Administered'}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setMedicationAdministered(alert)} disabled={isReadOnly}>
                          <Pill size={14} className="mr-1" /> Administered
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setMedicationNotAdministered(alert)} disabled={isReadOnly}>
                          Not Administered
                        </Button>
                      </div>

                      {log?.reason && <p className="text-xs text-amber-700 dark:text-amber-300">Reason: {log.reason}</p>}
                    </div>
                  );
                })}
              </div>
              </Card>
            )}

            <Card title="Homework">
              <div className="space-y-3">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Create one or more tasks for this session.</p>
                  <Button size="sm" variant="outline" onClick={addHomeworkItem} disabled={isReadOnly} className="w-full sm:w-auto">
                    <Plus size={14} className="mr-1" /> Add Another Task
                  </Button>
                </div>

                {dailyActivity.homeworkList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-accent/20 px-4 py-5 text-sm text-muted-foreground">
                    No homework set for today. Click 'Add' to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyActivity.homeworkList.map((item, index) => {
                      const isDescriptionOpen = expandedHomeworkIds.includes(item.id) || Boolean(item.description.trim());
                      const isNewTask = newHomeworkIds.includes(item.id);

                      return (
                        <div key={item.id} className="rounded-xl border border-border bg-background p-4 space-y-3 shadow-sm">
                          <div className="space-y-3">
                            <div>
                              <label className="block mb-2 text-xs font-medium uppercase text-muted-foreground">Title</label>
                              <input
                                ref={(node) => {
                                  homeworkTitleInputRefs.current[item.id] = node;
                                }}
                                type="text"
                                value={item.title}
                                onChange={(e) => updateHomeworkItem(index, 'title', e.target.value)}
                                className="w-full p-2 border border-border rounded-lg bg-input-background"
                                placeholder="Homework title"
                                disabled={isReadOnly}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <label className="block text-xs font-medium uppercase text-muted-foreground">Instructions - Optional</label>
                                  <button
                                    type="button"
                                    onClick={() => toggleHomeworkDescription(item.id)}
                                    disabled={isReadOnly}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {isDescriptionOpen ? 'Hide Description' : 'Show Description'}
                                  </button>
                                </div>
                                {isDescriptionOpen ? (
                                  <textarea
                                    value={item.description}
                                    onChange={(e) => updateHomeworkItem(index, 'description', e.target.value)}
                                    className="w-full min-h-[88px] p-2 border border-border rounded-lg bg-input-background"
                                    placeholder="Read pages 10-15 and answer the questions at the back."
                                    disabled={isReadOnly}
                                  />
                                ) : (
                                  <div className="rounded-lg border border-dashed border-border bg-accent/20 px-3 py-2 text-xs text-muted-foreground">
                                    Description hidden to keep the card compact.
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block mb-2 text-xs font-medium uppercase text-muted-foreground">Due Date</label>
                                <input
                                  type="date"
                                  value={item.dueDate}
                                  onChange={(e) => updateHomeworkItem(index, 'dueDate', e.target.value)}
                                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                                  disabled={isReadOnly}
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                              {isNewTask && (
                                <button
                                  type="button"
                                  onClick={() => cancelHomeworkItem(item.id)}
                                  disabled={isReadOnly}
                                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteHomeworkItem(item.id)}
                                disabled={isReadOnly}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            <Card title="Exit Actions">
              <div className="space-y-2">
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                  Monthly narrative updates should be completed after the final session of each 4-week cycle.
                </div>
                <Button className="w-full" variant="outline" onClick={saveAndExit} disabled={isReadOnly}>
                  Save & Exit to Dashboard
                </Button>
                <Button className="w-full" variant="primary" onClick={finalizeAndSubmit} disabled={isReadOnly}>
                  Finalize & Submit
                </Button>
                <Button className="w-full" variant="outline" onClick={handleBack}>
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                {(hasUnsavedChanges || isSaving) && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <AlertCircle size={12} /> You have unsaved changes.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {selectedNoteStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-background border border-border shadow-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Parent Note</p>
                <h3 className="text-lg font-semibold">{selectedNoteStudent.name}</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedNoteStudent(null)}>
                Close
              </Button>
            </div>

            <textarea
              value={dailyActivity.attendanceRecords[selectedNoteStudent.studentId]?.note ?? ''}
              onChange={(e) => setNoteForStudent(selectedNoteStudent.studentId, e.target.value)}
              className="w-full min-h-[160px] p-3 border border-border rounded-lg bg-input-background"
              placeholder="Type a student-specific note for guardians..."
              disabled={isReadOnly}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedNoteStudent(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
