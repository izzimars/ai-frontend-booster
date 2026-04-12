import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Phone, Pill } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';

type StudentDetail = {
  id: string;
  name: string;
  className: string;
  guardian: string;
  lastUpdate: string;
  dob: string;
  gender: 'Female' | 'Male';
  enrollmentDate: string;
  guardianPhone: string;
  guardianRelationship: string;
};

type SubjectEnrollment = {
  subject: string;
  studentIds: string[];
};

type GuardianMessage = {
  id: string;
  parentId?: string;
  studentId: string;
  subject: string;
  text: string;
  createdAt: string;
  guardianName: string;
  direction?: 'guardian' | 'teacher';
};

type MedicationLog = {
  id: string;
  studentId: string;
  medName: string;
  scheduledTime: string;
  date: string;
  status: 'scheduled' | 'administered' | 'missed';
  administeredBy?: string;
  administeredAt?: string;
};

type AcademicHistoryRow = {
  studentId: string;
  subject: string;
  avgScore: number;
  trend: 'Improving' | 'Steady' | 'Needs Support';
};

const STUDENT_DETAILS: Record<string, StudentDetail> = {
  s1: {
    id: 's1',
    name: 'Sarah Johnson',
    className: 'Math 10A',
    guardian: 'Jane Johnson',
    lastUpdate: '2026-04-10 08:12',
    dob: '2010-01-14',
    gender: 'Female',
    enrollmentDate: '2022-09-04',
    guardianPhone: '+1 555 0161',
    guardianRelationship: 'Mother',
  },
  s2: {
    id: 's2',
    name: 'Michael Brown',
    className: 'Math 10A',
    guardian: 'Peter Brown',
    lastUpdate: '2026-04-10 09:01',
    dob: '2009-08-27',
    gender: 'Male',
    enrollmentDate: '2022-09-04',
    guardianPhone: '+1 555 0152',
    guardianRelationship: 'Father',
  },
  s3: {
    id: 's3',
    name: 'Emily Davis',
    className: 'Math 10A',
    guardian: 'Ada Davis',
    lastUpdate: '2026-04-10 08:47',
    dob: '2010-02-11',
    gender: 'Female',
    enrollmentDate: '2022-09-04',
    guardianPhone: '+1 555 0149',
    guardianRelationship: 'Mother',
  },
  s4: {
    id: 's4',
    name: 'Isaac Cole',
    className: 'Math 10B',
    guardian: 'Grace Cole',
    lastUpdate: '2026-04-10 07:59',
    dob: '2009-10-03',
    gender: 'Male',
    enrollmentDate: '2022-09-04',
    guardianPhone: '+1 555 0114',
    guardianRelationship: 'Mother',
  },
  s5: {
    id: 's5',
    name: 'Nora White',
    className: 'Math 10B',
    guardian: 'Daniel White',
    lastUpdate: '2026-04-10 08:31',
    dob: '2010-06-22',
    gender: 'Female',
    enrollmentDate: '2022-09-04',
    guardianPhone: '+1 555 0105',
    guardianRelationship: 'Father',
  },
  s6: {
    id: 's6',
    name: 'Daniel Kent',
    className: 'Science 10A',
    guardian: 'Lucy Kent',
    lastUpdate: '2026-04-10 09:12',
    dob: '2009-12-18',
    gender: 'Male',
    enrollmentDate: '2022-09-04',
    guardianPhone: '+1 555 0191',
    guardianRelationship: 'Mother',
  },
  s7: {
    id: 's7',
    name: 'Laura James',
    className: 'Science 10A',
    guardian: 'Paul James',
    lastUpdate: '2026-04-10 08:43',
    dob: '2010-05-07',
    gender: 'Female',
    enrollmentDate: '2022-09-04',
    guardianPhone: '+1 555 0138',
    guardianRelationship: 'Father',
  },
};

const CLASS_SUBJECT_ENROLLMENTS: Record<string, SubjectEnrollment[]> = {
  'Math 10A': [
    { subject: 'Mathematics', studentIds: ['s1', 's2', 's3'] },
    { subject: 'English', studentIds: ['s1', 's2', 's3'] },
    { subject: 'Science', studentIds: ['s1', 's2', 's3'] },
    { subject: 'Robotics', studentIds: ['s1', 's3'] },
  ],
  'Science 10A': [
    { subject: 'Mathematics', studentIds: ['s6', 's7'] },
    { subject: 'English', studentIds: ['s6', 's7'] },
    { subject: 'Science', studentIds: ['s6', 's7'] },
    { subject: 'Robotics', studentIds: ['s7'] },
  ],
  'Math 10B': [
    { subject: 'Mathematics', studentIds: ['s4', 's5'] },
    { subject: 'English', studentIds: ['s4', 's5'] },
    { subject: 'Science', studentIds: ['s4', 's5'] },
    { subject: 'Music', studentIds: ['s5'] },
  ],
};

const FALLBACK_MESSAGES: GuardianMessage[] = [
  {
    id: 'm1',
    studentId: 's1',
    subject: 'Mathematics',
    text: 'Can we discuss Sarah\'s algebra homework plan for this week?',
    createdAt: '2026-04-11T08:10:00.000Z',
    guardianName: 'Jane Johnson',
    direction: 'guardian',
  },
  {
    id: 'm2',
    studentId: 's1',
    subject: 'Science',
    text: 'She has a clinic visit tomorrow afternoon and may miss practical lab.',
    createdAt: '2026-04-11T07:34:00.000Z',
    guardianName: 'Jane Johnson',
    direction: 'guardian',
  },
  {
    id: 'm3',
    studentId: 's7',
    subject: 'English',
    text: 'Please share any reading comprehension support resources.',
    createdAt: '2026-04-11T07:12:00.000Z',
    guardianName: 'Paul James',
    direction: 'guardian',
  },
];

const FALLBACK_MEDICATION_LOGS: MedicationLog[] = [
  {
    id: 'med-1',
    studentId: 's1',
    medName: 'Albuterol Inhaler',
    scheduledTime: '09:00 AM',
    date: '2026-04-11',
    status: 'scheduled',
  },
  {
    id: 'med-2',
    studentId: 's1',
    medName: 'Cetirizine',
    scheduledTime: '02:00 PM',
    date: '2026-04-11',
    status: 'scheduled',
  },
  {
    id: 'med-3',
    studentId: 's6',
    medName: 'Insulin',
    scheduledTime: '12:30 PM',
    date: '2026-04-11',
    status: 'scheduled',
  },
];

const FALLBACK_ACADEMIC_HISTORY: AcademicHistoryRow[] = [
  { studentId: 's1', subject: 'Mathematics', avgScore: 88, trend: 'Improving' },
  { studentId: 's1', subject: 'English', avgScore: 82, trend: 'Steady' },
  { studentId: 's1', subject: 'Science', avgScore: 90, trend: 'Improving' },
  { studentId: 's1', subject: 'Robotics', avgScore: 85, trend: 'Steady' },
  { studentId: 's7', subject: 'Science', avgScore: 79, trend: 'Needs Support' },
  { studentId: 's7', subject: 'English', avgScore: 84, trend: 'Improving' },
];

function loadArrayFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

function shortPreview(text: string) {
  return text.length > 40 ? `${text.slice(0, 40)}...` : text;
}

function parseTimeToMinutes(timeLabel: string) {
  const [time, period] = timeLabel.split(' ');
  if (!time || !period) return Number.POSITIVE_INFINITY;
  const [h, m] = time.split(':').map(Number);
  const hour24 = period.toUpperCase() === 'PM' ? (h % 12) + 12 : h % 12;
  return hour24 * 60 + (m || 0);
}

export function StudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const student = useMemo(() => {
    if (!studentId) return undefined;
    return STUDENT_DETAILS[studentId];
  }, [studentId]);

  const classSubjects = useMemo(() => {
    if (!student || !studentId) return [];
    const classConfig = CLASS_SUBJECT_ENROLLMENTS[student.className] || [];
    return classConfig.filter((row) => row.studentIds.includes(studentId)).map((row) => row.subject);
  }, [student, studentId]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const allMessages = useMemo(
    () => loadArrayFromStorage<GuardianMessage>('guardian_messages', FALLBACK_MESSAGES),
    [],
  );
  const allMedicalLogs = useMemo(
    () => loadArrayFromStorage<MedicationLog>('medical_logs', FALLBACK_MEDICATION_LOGS),
    [],
  );
  const allAcademicHistory = useMemo(
    () => loadArrayFromStorage<AcademicHistoryRow>('academic_history', FALLBACK_ACADEMIC_HISTORY),
    [],
  );

  const guardianMessages = useMemo(() => {
    if (!studentId) return [];
    return allMessages
      .filter((item) => item.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allMessages, studentId]);

  const initialTodayMedications = useMemo(() => {
    if (!studentId) return [];
    return allMedicalLogs
      .filter((item) => item.studentId === studentId && item.date === today)
      .sort((a, b) => parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime));
  }, [allMedicalLogs, studentId, today]);

  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [communicationFeed, setCommunicationFeed] = useState<GuardianMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<GuardianMessage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMedications(initialTodayMedications);
  }, [initialTodayMedications]);

  useEffect(() => {
    setCommunicationFeed(guardianMessages);
  }, [guardianMessages]);

  const academicRows = useMemo(() => {
    if (!studentId) return [];
    const records = allAcademicHistory.filter((row) => row.studentId === studentId);
    if (records.length) return records;

    return classSubjects.map((subject, index) => ({
      studentId,
      subject,
      avgScore: 80 + ((index * 3) % 12),
      trend: index % 3 === 0 ? 'Improving' : index % 3 === 1 ? 'Steady' : 'Needs Support',
    })) as AcademicHistoryRow[];
  }, [allAcademicHistory, classSubjects, studentId]);

  if (!student || !studentId) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/teacher/class-command-center')}>
          <ChevronLeft size={16} className="mr-1" /> Back to Class Command Center
        </Button>
        <Card title="Student Not Found">
          <p className="text-muted-foreground">No student profile found for this id.</p>
        </Card>
      </div>
    );
  }

  const messageSubjects = [...new Set(guardianMessages.map((item) => item.subject))].join(', ');
  const upcomingMedication = medications.find((item) => item.status === 'scheduled');

  const messagePulse = guardianMessages.length === 0
    ? 'No new guardian messages.'
    : guardianMessages.length === 1
      ? shortPreview(guardianMessages[0].text)
      : `${guardianMessages.length} Messages from Guardian (${messageSubjects})`;

  const medicationPulse = medications.length === 0
    ? 'No medications scheduled today.'
    : medications.length === 1
      ? `${medications[0].medName} at ${medications[0].scheduledTime}`
      : `${medications.length} Meds Scheduled Today (Next: ${upcomingMedication?.scheduledTime || 'N/A'})`;

  const updateMedicationState = (medicationId: string, status: 'administered' | 'missed') => {
    const teacherName = 'Mrs. Johnson';
    const nowIso = new Date().toISOString();

    setMedications((prev) => {
      const next = prev.map((item) => (
        item.id === medicationId
          ? {
              ...item,
              status,
              administeredBy: status === 'administered' ? teacherName : item.administeredBy,
              administeredAt: status === 'administered' ? nowIso : item.administeredAt,
            }
          : item
      ));

      const persisted = loadArrayFromStorage<MedicationLog>('medical_logs', FALLBACK_MEDICATION_LOGS);
      const untouched = persisted.filter((item) => !(item.studentId === studentId && item.date === today));
      localStorage.setItem('medical_logs', JSON.stringify([...untouched, ...next]));

      return next;
    });
  };

  const sendReply = () => {
    const text = replyText.trim();
    if (!text) return;

    const newMessage: GuardianMessage = {
      id: `reply-${Date.now()}`,
      parentId: replyingTo?.id,
      studentId,
      subject: replyingTo?.subject || classSubjects[0] || 'General',
      text,
      createdAt: new Date().toISOString(),
      guardianName: student.guardian,
      direction: 'teacher',
    };

    setCommunicationFeed((prev) => [newMessage, ...prev]);
    const persisted = loadArrayFromStorage<GuardianMessage>('guardian_messages', FALLBACK_MESSAGES);
    localStorage.setItem('guardian_messages', JSON.stringify([newMessage, ...persisted]));
    setReplyText('');
    setReplyingTo(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link> <span className="mx-1">&gt;</span>
        <Link to="/teacher/class-command-center" className="hover:underline">Class Command Center</Link> <span className="mx-1">&gt;</span>
        {student.name}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{student.name}</h1>
          <p className="text-sm text-muted-foreground">Student detail workspace</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/teacher/class-command-center')}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </Button>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/teacher/student-detail/${studentId}`)}
        className="w-full text-left"
      >
        <Card className="hover:border-primary/50 transition-colors">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Student</p>
                <p className="font-medium">{student.name} - #{student.id.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Guardian</p>
                <p className="font-medium">{student.guardian}</p>
              </div>
              <div className="flex-1 min-w-[220px]">
                <p className="text-muted-foreground mb-1">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {classSubjects.map((subject) => (
                    <Badge key={subject} variant="default">{subject}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {guardianMessages.length > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-start gap-2 text-sm">
                <MessageSquare size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-700 font-medium">Messages</p>
                  <p className="text-blue-900">{messagePulse}</p>
                </div>
              </div>
            )}

            {medications.length > 0 && (
              <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 flex items-start gap-2 text-sm">
                <Pill size={16} className="text-orange-600 mt-0.5" />
                <div>
                  <p className="text-orange-700 font-medium">Medications</p>
                  <p className="text-orange-900">{medicationPulse}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Student Profile">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-lg font-semibold">
              {student.name.split(' ').map((chunk) => chunk[0]).join('').slice(0, 2)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm w-full">
              <div>
                <p className="text-muted-foreground">DOB</p>
                <p className="font-medium">{student.dob}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium">{student.gender}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Enrollment Date</p>
                <p className="font-medium">{student.enrollmentDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Class</p>
                <p className="font-medium">{student.className}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Guardian Profile">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-lg font-semibold">
              {student.guardian.split(' ').map((chunk) => chunk[0]).join('').slice(0, 2)}
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{student.guardian}</p>
              <p className="text-muted-foreground">{student.guardianRelationship}</p>
              <p>{student.guardianPhone}</p>
              <a href={`tel:${student.guardianPhone.replace(/\s+/g, '')}`}>
                <Button size="sm" variant="outline">
                  <Phone size={14} className="mr-1" /> Call
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Unified Communication Hub">
        <div className="space-y-4">
          <div className="space-y-2">
            {communicationFeed.length === 0 && (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}

            {communicationFeed.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-3 ${replyingTo?.id === item.id ? 'border-primary bg-primary/5' : 'border-border'} ${item.parentId ? 'ml-4 border-l-4 pl-4' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{item.subject}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.direction === 'teacher' ? 'Teacher Reply' : 'Guardian Message'}
                    </span>
                    {item.parentId && <span className="text-xs text-muted-foreground">↳ Thread reply</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm">{item.text}</p>
                {item.direction === 'guardian' && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(item);
                        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        textareaRef.current?.focus();
                      }}
                    >
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {replyingTo && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <p>
                  Replying to: <span className="font-medium">{replyingTo.subject}</span> - {shortPreview(replyingTo.text)}
                </p>
                <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                  ✕
                </Button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-input-background min-h-[100px]"
              placeholder={replyingTo ? 'Reply to this message...' : 'Send a general message...'}
            />
            <Button size="sm" onClick={sendReply}>Send Reply</Button>
          </div>
        </div>
      </Card>

      <Card title="Medication Management Console">
        <div className="space-y-3">
          {medications.length === 0 && (
            <p className="text-sm text-muted-foreground">No medications scheduled for today.</p>
          )}

          {medications.map((medication) => (
            <div key={medication.id} className="border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{medication.medName}</p>
                <p className="text-sm text-muted-foreground">
                  Scheduled: {medication.scheduledTime}
                  {medication.status === 'administered' && medication.administeredAt
                    ? ` | Administered by ${medication.administeredBy} at ${new Date(medication.administeredAt).toLocaleTimeString()}`
                    : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={medication.status === 'administered' ? 'approved' : medication.status === 'missed' ? 'rejected' : 'pending'}>
                  {medication.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateMedicationState(medication.id, 'administered')}
                >
                  Mark Administered
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateMedicationState(medication.id, 'missed')}
                >
                  Mark Missed
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Academic History">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2">Subject</th>
                <th className="text-left py-2">Average Score</th>
                <th className="text-left py-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {academicRows.map((row) => (
                <tr key={`${row.studentId}-${row.subject}`} className="border-b border-border/60">
                  <td className="py-2">{row.subject}</td>
                  <td className="py-2">{row.avgScore}%</td>
                  <td className="py-2">
                    <Badge
                      variant={row.trend === 'Improving' ? 'approved' : row.trend === 'Steady' ? 'pending' : 'rejected'}
                    >
                      {row.trend}
                    </Badge>
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
