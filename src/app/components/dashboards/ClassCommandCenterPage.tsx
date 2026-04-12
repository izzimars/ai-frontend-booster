import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Lock, Upload, UserMinus, UserPlus, Users } from 'lucide-react';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card } from '../Card';
import { Modal } from '../Modal';
import { toast } from 'sonner';

type CommandRole = 'class_teacher' | 'subject_teacher';
type SubjectType = 'Core' | 'Optional';

type CommandSubject = {
  name: string;
  teacher: string;
  teacherId?: string;
  type: SubjectType;
};

type StaffMember = {
  id: string;
  name: string;
  role: string;
  subjectsTaught: string[];
};

type SubjectReassignmentTarget = {
  name: string;
  currentTeacher: string;
};

type CommandStudent = {
  id: string;
  name: string;
  attendance: string;
};

type GuardianLink = {
  id: string;
  studentId: string;
  studentName: string;
  guardianContact: string;
  linkedAt: string;
};

type CommandClass = {
  id: string;
  className: string;
  role: CommandRole;
  mySubject?: string;
  students: CommandStudent[];
  subjects: CommandSubject[];
};

type CommandCenterState = {
  students: CommandStudent[];
  subjects: CommandSubject[];
  guardians: GuardianLink[];
  subject_students: Record<string, string[]>;
};

const CLASS_COMMAND_DATA: Record<string, CommandClass> = {
  'a1b2c3d4-e5f6-7890-abcd-ef1234567819': {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819',
    className: 'Math 10A',
    role: 'class_teacher',
    students: [
      { id: 's1', name: 'Sarah Johnson', attendance: '96%' },
      { id: 's2', name: 'Michael Brown', attendance: '91%' },
      { id: 's3', name: 'Emily Davis', attendance: '94%' },
    ],
    subjects: [
      { name: 'Mathematics', teacher: 'Mrs. Johnson', type: 'Core' },
      { name: 'English', teacher: 'Mr. Carter', type: 'Core' },
      { name: 'Science', teacher: 'Ms. Ahmed', type: 'Core' },
      { name: 'Robotics', teacher: 'Mr. Felix', type: 'Optional' },
    ],
  },
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    className: 'Science 10A',
    role: 'subject_teacher',
    mySubject: 'Science',
    students: [
      { id: 's6', name: 'Daniel Kent', attendance: '97%' },
      { id: 's7', name: 'Laura James', attendance: '92%' },
      { id: 's8', name: 'Nathan Ross', attendance: '90%' },
    ],
    subjects: [
      { name: 'Mathematics', teacher: 'Mrs. Johnson', type: 'Core' },
      { name: 'English', teacher: 'Mr. Carter', type: 'Core' },
      { name: 'Science', teacher: 'Ms. Ahmed', type: 'Core' },
      { name: 'Robotics', teacher: 'Mr. Felix', type: 'Optional' },
    ],
  },
  'b2c3d4e5-f6g7-8901-efgh-123456789012': {
    id: 'b2c3d4e5-f6g7-8901-efgh-123456789012',
    className: 'Math 10B',
    role: 'subject_teacher',
    mySubject: 'Mathematics',
    students: [
      { id: 's4', name: 'Isaac Cole', attendance: '89%' },
      { id: 's5', name: 'Nora White', attendance: '93%' },
      { id: 's9', name: 'Ava Kim', attendance: '95%' },
    ],
    subjects: [
      { name: 'Mathematics', teacher: 'Mrs. Johnson', type: 'Core' },
      { name: 'English', teacher: 'Mr. Carter', type: 'Core' },
      { name: 'Science', teacher: 'Ms. Ahmed', type: 'Core' },
      { name: 'Music', teacher: 'Ms. Bisi', type: 'Optional' },
    ],
  },
};

function storageKey(classId: string) {
  return `class-command-center:${classId}`;
}

function makeInitialState(commandClass: CommandClass): CommandCenterState {
  const subject_students = commandClass.subjects.reduce<Record<string, string[]>>((acc, subject) => {
    acc[subject.name] = subject.type === 'Core' ? commandClass.students.map((student) => student.id) : [];
    return acc;
  }, {});

  return {
    students: commandClass.students,
    subjects: commandClass.subjects,
    guardians: [],
    subject_students,
  };
}

function loadAllStaffFromStorage(subjects: CommandSubject[]): StaffMember[] {
  const fallbackStaff: StaffMember[] = [
    { id: 't-001', name: 'Mrs. Johnson', role: 'Teacher', subjectsTaught: ['Mathematics'] },
    { id: 't-002', name: 'Mr. Carter', role: 'Teacher', subjectsTaught: ['English'] },
    { id: 't-003', name: 'Ms. Ahmed', role: 'Teacher', subjectsTaught: ['Science'] },
    { id: 't-004', name: 'Mr. Felix', role: 'Subject Specialist', subjectsTaught: ['Robotics'] },
    { id: 't-005', name: 'Ms. Bisi', role: 'Subject Specialist', subjectsTaught: ['Music'] },
    { id: 't-006', name: 'Mr. Daniel', role: 'Teacher', subjectsTaught: ['Mathematics', 'Further Mathematics'] },
  ];

  const subjectTeacherFallback = subjects.map((subject, index) => ({
    id: `subject-teacher-${index + 1}`,
    name: subject.teacher,
    role: 'Teacher',
    subjectsTaught: [subject.name],
  }));

  const uniqueFallback = [...subjectTeacherFallback, ...fallbackStaff].reduce<StaffMember[]>((acc, staff) => {
    if (acc.some((item) => item.name.toLowerCase() === staff.name.toLowerCase())) return acc;
    return [...acc, staff];
  }, []);

  try {
    const raw = localStorage.getItem('allStaff');
    if (!raw) return uniqueFallback;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return uniqueFallback;

    const normalized = parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: String(item.id ?? `staff-${Math.random().toString(16).slice(2)}`),
        name: String(item.name ?? '').trim(),
        role: String(item.role ?? '').trim(),
        subjectsTaught: Array.isArray(item.subjectsTaught)
          ? item.subjectsTaught.map((subject: unknown) => String(subject))
          : [],
      }))
      .filter((item) => item.name.length > 0);

    return normalized.length ? normalized : uniqueFallback;
  } catch {
    return uniqueFallback;
  }
}

export function ClassCommandCenterPage() {
  const navigate = useNavigate();
  const { classId } = useParams();

  const fallbackClassId = useMemo(() => Object.keys(CLASS_COMMAND_DATA)[0], []);
  const effectiveClassId = classId || fallbackClassId;
  const commandClass = useMemo(() => CLASS_COMMAND_DATA[effectiveClassId], [effectiveClassId]);

  const [state, setState] = useState<CommandCenterState | null>(null);
  const [singleEnrollmentName, setSingleEnrollmentName] = useState('');
  const [studentToRemove, setStudentToRemove] = useState('');
  const [studentToLink, setStudentToLink] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showSeatManager, setShowSeatManager] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectTeacher, setNewSubjectTeacher] = useState('');
  const [newSubjectType, setNewSubjectType] = useState<SubjectType>('Core');
  const [selectedSubjectForConfig, setSelectedSubjectForConfig] = useState('');
  const [studentToAddToSubject, setStudentToAddToSubject] = useState('');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [subjectForTeacherReassignment, setSubjectForTeacherReassignment] = useState<SubjectReassignmentTarget | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  useEffect(() => {
    if (!commandClass) return;

    const fallback = makeInitialState(commandClass);

    try {
      const raw = localStorage.getItem(storageKey(commandClass.id));
      if (!raw) {
        setState(fallback);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<CommandCenterState>;
      setState({
        students: Array.isArray(parsed.students) ? parsed.students : fallback.students,
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects : fallback.subjects,
        guardians: Array.isArray(parsed.guardians) ? parsed.guardians : fallback.guardians,
        subject_students: parsed.subject_students || fallback.subject_students,
      });
    } catch {
      setState(fallback);
    }
  }, [commandClass]);

  useEffect(() => {
    if (!commandClass || !state) return;
    localStorage.setItem(storageKey(commandClass.id), JSON.stringify(state));
  }, [commandClass, state]);

  useEffect(() => {
    if (!state?.students.length) return;
    setStudentToRemove((prev) => prev || state.students[0].id);
    setStudentToLink((prev) => prev || state.students[0].id);
  }, [state?.students]);

  const taughtSubjects = commandClass && state
    ? commandClass.role === 'class_teacher'
      ? state.subjects
      : state.subjects.filter((subject) => subject.name === commandClass.mySubject)
    : [];

  const subjectOptionsForConfig = commandClass && state
    ? commandClass.role === 'class_teacher'
      ? state.subjects
      : state.subjects.filter((subject) => subject.name === commandClass.mySubject)
    : [];

  useEffect(() => {
    if (!subjectOptionsForConfig.length) {
      setSelectedSubjectForConfig('');
      return;
    }

    const hasCurrent = subjectOptionsForConfig.some((subject) => subject.name === selectedSubjectForConfig);
    if (!hasCurrent) {
      setSelectedSubjectForConfig(subjectOptionsForConfig[0].name);
    }
  }, [subjectOptionsForConfig, selectedSubjectForConfig]);

  useEffect(() => {
    if (!selectedSubjectForConfig || !state) {
      setStudentToAddToSubject('');
      return;
    }

    const assignedIds = state.subject_students[selectedSubjectForConfig] || [];
    const nextStudent = state.students.find((student) => !assignedIds.includes(student.id));
    setStudentToAddToSubject((prev) => {
      if (prev && state.students.some((student) => student.id === prev && !assignedIds.includes(student.id))) {
        return prev;
      }

      return nextStudent?.id || '';
    });
  }, [selectedSubjectForConfig, state]);

  const allStaff = useMemo(() => loadAllStaffFromStorage(state?.subjects ?? []), [state?.subjects]);
  const eligibleStaff = useMemo(
    () => allStaff.filter((staff) => {
      const normalizedRole = staff.role.toLowerCase();
      return normalizedRole === 'teacher' || normalizedRole === 'subject specialist';
    }),
    [allStaff],
  );
  const filteredStaff = useMemo(
    () => eligibleStaff.filter((staff) => staff.name.toLowerCase().includes(staffSearchQuery.toLowerCase().trim())),
    [eligibleStaff, staffSearchQuery],
  );

  const isLoading = !commandClass || !state;

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Card title="Command Center Not Found">
          <p className="text-muted-foreground">No class context available for command center.</p>
        </Card>
      </div>
    );
  }

  const isClassTeacher = commandClass.role === 'class_teacher';
  const roleLabel = isClassTeacher ? 'Class Teacher' : 'Subject Teacher';

  const requireClassTeacher = () => {
    if (commandClass.role !== 'class_teacher') {
      window.alert('Access Denied');
      return false;
    }
    return true;
  };

  const updateState = (updater: (prev: CommandCenterState) => CommandCenterState) => {
    setState((prev) => (prev ? updater(prev) : prev));
  };

  const enrollSingleStudent = () => {
    if (!requireClassTeacher()) return;
    if (!singleEnrollmentName.trim()) return;

    const newStudent: CommandStudent = {
      id: `student-${Date.now()}`,
      name: singleEnrollmentName.trim(),
      attendance: '0%',
    };

    updateState((prev) => {
      const nextSubjectStudents = { ...prev.subject_students };
      prev.subjects.forEach((subject) => {
        if (subject.type === 'Core') {
          const roster = nextSubjectStudents[subject.name] || [];
          nextSubjectStudents[subject.name] = [...roster, newStudent.id];
        }
      });

      return {
        ...prev,
        students: [...prev.students, newStudent],
        subject_students: nextSubjectStudents,
      };
    });

    setSingleEnrollmentName('');
  };

  const removeStudent = () => {
    if (!requireClassTeacher()) return;

    updateState((prev) => ({
      ...prev,
      students: prev.students.filter((student) => student.id !== studentToRemove),
      guardians: prev.guardians.filter((item) => item.studentId !== studentToRemove),
      subject_students: Object.keys(prev.subject_students).reduce<Record<string, string[]>>((acc, key) => {
        acc[key] = prev.subject_students[key].filter((id) => id !== studentToRemove);
        return acc;
      }, {}),
    }));
  };

  const toggleSubjectType = (subjectName: string) => {
    if (!requireClassTeacher()) return;

    updateState((prev) => {
      const nextSubjects: CommandSubject[] = prev.subjects.map((subject) => {
        if (subject.name !== subjectName) return subject;
        return {
          ...subject,
          type: (subject.type === 'Core' ? 'Optional' : 'Core') as SubjectType,
        };
      });

      const nextSubjectStudents = { ...prev.subject_students };
      const toggledSubject = nextSubjects.find((subject) => subject.name === subjectName);
      if (toggledSubject?.type === 'Core') {
        nextSubjectStudents[subjectName] = prev.students.map((student) => student.id);
      }

      return {
        ...prev,
        subjects: nextSubjects,
        subject_students: nextSubjectStudents,
      };
    });
  };

  const reassignSubjectTeacher = (subjectName: string, staff: StaffMember) => {
    if (!requireClassTeacher()) return;

    updateState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject) => (
        subject.name === subjectName
          ? { ...subject, teacher: staff.name, teacherId: staff.id }
          : subject
      )),
    }));
  };

  const openTeacherReassignmentModal = (subject: CommandSubject) => {
    if (!requireClassTeacher()) return;

    setSubjectForTeacherReassignment({
      name: subject.name,
      currentTeacher: subject.teacher,
    });
    setStaffSearchQuery('');
    setIsTeacherModalOpen(true);
  };

  const handleTeacherAssignment = (staff: StaffMember) => {
    if (!subjectForTeacherReassignment) return;

    const normalizedRole = staff.role.toLowerCase();
    if (normalizedRole !== 'teacher' && normalizedRole !== 'subject specialist') {
      window.alert('Only Teacher or Subject Specialist roles can be assigned.');
      return;
    }

    reassignSubjectTeacher(subjectForTeacherReassignment.name, staff);
    setIsTeacherModalOpen(false);
    setSubjectForTeacherReassignment(null);
    setStaffSearchQuery('');
    toast.success(`${staff.name} has been assigned to ${subjectForTeacherReassignment.name}.`);
  };

  const addSubject = () => {
    if (!requireClassTeacher()) return;

    const subjectName = newSubjectName.trim();
    const subjectTeacher = newSubjectTeacher.trim();
    if (!subjectName || !subjectTeacher) {
      window.alert('Please provide subject name and teacher name.');
      return;
    }

    updateState((prev) => {
      const duplicate = prev.subjects.some((subject) => subject.name.toLowerCase() === subjectName.toLowerCase());
      if (duplicate) {
        window.alert('Subject already exists for this class.');
        return prev;
      }

      return {
        ...prev,
        subjects: [...prev.subjects, { name: subjectName, teacher: subjectTeacher, type: newSubjectType }],
        subject_students: {
          ...prev.subject_students,
          [subjectName]: newSubjectType === 'Core' ? prev.students.map((student) => student.id) : [],
        },
      };
    });

    setNewSubjectName('');
    setNewSubjectTeacher('');
    setNewSubjectType('Core');
  };

  const linkGuardian = () => {
    if (!requireClassTeacher()) return;
    const student = state!.students.find((item) => item.id === studentToLink);
    if (!student || !guardianContact.trim()) {
      window.alert('Select a student and provide guardian contact.');
      return;
    }

    const nextLink: GuardianLink = {
      id: `guardian-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      guardianContact: guardianContact.trim(),
      linkedAt: new Date().toISOString(),
    };

    updateState((prev) => ({
      ...prev,
      guardians: [nextLink, ...prev.guardians.filter((item) => item.studentId !== student.id)],
    }));

    setGuardianContact('');
  };

  const removeGuardian = (guardianId: string) => {
    if (!requireClassTeacher()) return;
    updateState((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((item) => item.id !== guardianId),
    }));
  };

  const runBulkGuardianLink = (file: File | null) => {
    if (!requireClassTeacher()) return;
    if (!file) return;

    setIsBulkLoading(true);
    setBulkStatus('Processing...');
    window.setTimeout(() => {
      setIsBulkLoading(false);
      setBulkStatus('15 Students linked to Guardians');
    }, 1200);
  };

  const runBulkEnrollment = (file: File | null) => {
    if (!requireClassTeacher()) return;
    if (!file) return;

    setIsBulkLoading(true);
    setBulkStatus('Processing...');
    window.setTimeout(() => {
      setIsBulkLoading(false);
      setBulkStatus('15 Students enrolled');
    }, 1200);
  };

  const selectedSubject = subjectOptionsForConfig.find((subject) => subject.name === selectedSubjectForConfig);
  const selectedSubjectStudentIds = selectedSubject ? state!.subject_students[selectedSubject.name] || [] : [];
  const selectedSubjectStudents = state!.students.filter((student) => selectedSubjectStudentIds.includes(student.id));

  const taughtSubject = taughtSubjects[0];
  const taughtSubjectStudents = taughtSubject ? state!.subject_students[taughtSubject.name] || [] : [];

  const toggleOptionalSeat = (studentId: string) => {
    if (!taughtSubject) return;

    updateState((prev) => {
      const existing = prev.subject_students[taughtSubject.name] || [];
      const next = existing.includes(studentId)
        ? existing.filter((id) => id !== studentId)
        : [...existing, studentId];

      return {
        ...prev,
        subject_students: {
          ...prev.subject_students,
          [taughtSubject.name]: next,
        },
      };
    });
  };

  const removeStudentFromSelectedSubject = (studentId: string) => {
    if (!selectedSubject) return;

    if (selectedSubject.type === 'Core') {
      window.alert('Core subject roster is read-only.');
      return;
    }

    if (!isClassTeacher) {
      const canManage = taughtSubjects.some((subject) => subject.name === selectedSubject.name);
      if (!canManage) {
        window.alert('Access Denied');
        return;
      }
    }

    updateState((prev) => ({
      ...prev,
      subject_students: {
        ...prev.subject_students,
        [selectedSubject.name]: (prev.subject_students[selectedSubject.name] || []).filter((id) => id !== studentId),
      },
    }));
  };

  const addStudentToSelectedSubject = () => {
    if (!selectedSubject || !studentToAddToSubject) return;

    if (!isClassTeacher) {
      const canManage = taughtSubjects.some((subject) => subject.name === selectedSubject.name);
      if (!canManage) {
        window.alert('Access Denied');
        return;
      }
    }

    updateState((prev) => {
      const currentRoster = prev.subject_students[selectedSubject.name] || [];
      if (currentRoster.includes(studentToAddToSubject)) return prev;

      return {
        ...prev,
        subject_students: {
          ...prev.subject_students,
          [selectedSubject.name]: [...currentRoster, studentToAddToSubject],
        },
      };
    });

    setStudentToAddToSubject('');
  };

  // Helper to map our custom status to Badge variant
  const getBadgeVariant = (status: string) => {
    const mapping: Record<string, 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending' | 'graded' | 'default'> = {
      class_teacher: 'approved',
      subject_teacher: 'default',
      Core: 'approved',
      Optional: 'pending',
      default: 'default',
    };
    return mapping[status] || 'default';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            <Link to="/" className="hover:underline">Home</Link> <span className="mx-1">&gt;</span>
            <Link to={`/class/${commandClass.id}`} className="hover:underline">Class</Link> <span className="mx-1">&gt;</span>
            Command Center
          </div>
          <h1 className="text-2xl font-semibold">Command Center: {commandClass.className} | Role: {roleLabel}</h1>
          <p className="text-sm text-muted-foreground mt-1">Role-aware control surface for class operations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getBadgeVariant(commandClass.role)}>{roleLabel}</Badge>
          <Button variant="outline" size="sm" onClick={() => navigate(`/class/${commandClass.id}`)}>
            <ChevronLeft size={14} className="mr-1" /> Back to Class Overview
          </Button>
        </div>
      </div>

      {isClassTeacher ? (
        <div className="space-y-6">
          <Card title="Full Student Management">
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="font-medium text-sm">Enrollment (Single)</p>
                  <input
                    value={singleEnrollmentName}
                    onChange={(event) => setSingleEnrollmentName(event.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input-background"
                    placeholder="Student full name"
                  />
                  <Button size="sm" onClick={enrollSingleStudent}><UserPlus size={14} className="mr-1" /> Enroll Student</Button>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="font-medium text-sm">Enrollment (Bulk)</p>
                  <label className="inline-flex">
                    <button type="button" className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                      <Upload size={14} className="mr-1" /> Upload CSV/XLSX
                    </button>
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={(event) => runBulkEnrollment(event.target.files?.[0] || null)}
                    />
                  </label>
                  {isBulkLoading && <p className="text-sm text-blue-700">Processing...</p>}
                  {bulkStatus && !isBulkLoading && <p className="text-sm text-green-700">{bulkStatus}</p>}
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="font-medium text-sm">Transfers & Removals</p>
                  <Button size="sm" variant="outline" onClick={() => window.alert('Transfer workflow opened.')}>Transfer Student</Button>
                  <select
                    value={studentToRemove}
                    onChange={(event) => setStudentToRemove(event.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input-background"
                  >
                    {state.students.map((student) => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={removeStudent}><UserMinus size={14} className="mr-1" /> Remove Student</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Guardian CRM">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="font-medium text-sm">Add / Link Guardian</p>
                <select
                  value={studentToLink}
                  onChange={(event) => setStudentToLink(event.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  {state.students.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
                <input
                  value={guardianContact}
                  onChange={(event) => setGuardianContact(event.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                  placeholder="Guardian phone or email"
                />
                <Button size="sm" onClick={linkGuardian}>Link Guardian</Button>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="font-medium text-sm">Linked Guardians</p>
                {state.guardians.length === 0 && <p className="text-sm text-muted-foreground">No guardian links yet.</p>}
                {state.guardians.map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-2 border border-border rounded p-2 text-sm">
                    <div>
                      <p>{link.studentName}</p>
                      <p className="text-xs text-muted-foreground">{link.guardianContact}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => removeGuardian(link.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Academic Configuration">
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3 grid grid-cols-1 lg:grid-cols-[1fr_1fr_140px_auto] gap-2">
                <input
                  value={newSubjectName}
                  onChange={(event) => setNewSubjectName(event.target.value)}
                  className="p-2 border border-border rounded-lg bg-input-background"
                  placeholder="New subject name"
                />
                <input
                  value={newSubjectTeacher}
                  onChange={(event) => setNewSubjectTeacher(event.target.value)}
                  className="p-2 border border-border rounded-lg bg-input-background"
                  placeholder="Teacher name"
                />
                <select
                  value={newSubjectType}
                  onChange={(event) => setNewSubjectType(event.target.value as SubjectType)}
                  className="p-2 border border-border rounded-lg bg-input-background"
                >
                  <option value="Core">Core</option>
                  <option value="Optional">Optional</option>
                </select>
                <Button size="sm" onClick={addSubject}>Add Subject</Button>
              </div>

              {state.subjects.map((subject) => (
                <div key={subject.name} className="flex flex-wrap items-center justify-between gap-2 border border-border rounded p-3">
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">Teacher: {subject.teacher}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openTeacherReassignmentModal(subject)}>
                      Reassign Teacher
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleSubjectType(subject.name)}>
                      Set as {subject.type === 'Core' ? 'Optional' : 'Core'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Subject Configuration">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 items-center">
                <label className="text-sm text-muted-foreground">Select Subject</label>
                <select
                  value={selectedSubjectForConfig}
                  onChange={(event) => setSelectedSubjectForConfig(event.target.value)}
                  className="p-2 border border-border rounded-lg bg-input-background"
                >
                  {subjectOptionsForConfig.map((subject) => (
                    <option key={subject.name} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
              </div>

              {selectedSubject ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      Students taking {selectedSubject.name} ({selectedSubject.type})
                    </p>
                    <Badge variant={getBadgeVariant(selectedSubject.type)}>{selectedSubject.type}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center rounded-lg border border-border p-3">
                    <select
                      value={studentToAddToSubject}
                      onChange={(event) => setStudentToAddToSubject(event.target.value)}
                      className="p-2 border border-border rounded-lg bg-input-background"
                    >
                      {state.students
                        .filter((student) => !(state.subject_students[selectedSubject.name] || []).includes(student.id))
                        .map((student) => (
                          <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={addStudentToSelectedSubject} disabled={!studentToAddToSubject}>
                      Add Student
                    </Button>
                  </div>

                  {selectedSubjectStudents.length === 0 && (
                    <p className="text-sm text-muted-foreground">No students currently assigned.</p>
                  )}

                  {selectedSubjectStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between border border-border rounded p-2 text-sm">
                      <span>{student.name}</span>
                      {selectedSubject.type === 'Optional' ? (
                        <Button size="sm" variant="outline" onClick={() => removeStudentFromSelectedSubject(student.id)}>
                          Remove
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Locked (Core)</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subject available.</p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Enrollment Controls (Locked)">
              <div className="rounded-lg border border-border bg-accent/30 p-4 opacity-70">
                <p className="flex items-center gap-2 text-sm">
                  <Lock size={14} /> Enrollment, transfer, and removal actions are restricted to Class Teachers.
                </p>
              </div>
            </Card>

            <Card title="Guardian CRM (Locked)">
              <div className="rounded-lg border border-border bg-accent/30 p-4 opacity-70">
                <p className="flex items-center gap-2 text-sm">
                  <Lock size={14} /> Guardian linking and removal are locked for Subject Teachers.
                </p>
              </div>
            </Card>
          </div>

          <Card title="Subject Configuration">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 items-center">
                <label className="text-sm text-muted-foreground">Select Subject</label>
                <select
                  value={selectedSubjectForConfig}
                  onChange={(event) => setSelectedSubjectForConfig(event.target.value)}
                  className="p-2 border border-border rounded-lg bg-input-background"
                >
                  {subjectOptionsForConfig.map((subject) => (
                    <option key={subject.name} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
              </div>

              {selectedSubject ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      Students taking {selectedSubject.name} ({selectedSubject.type})
                    </p>
                    <Badge variant={getBadgeVariant(selectedSubject.type)}>{selectedSubject.type}</Badge>
                  </div>

                  {selectedSubjectStudents.length === 0 && (
                    <p className="text-sm text-muted-foreground">No students currently assigned.</p>
                  )}

                  {selectedSubjectStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between border border-border rounded p-2 text-sm">
                      <span>{student.name}</span>
                      {selectedSubject.type === 'Optional' ? (
                        <Button size="sm" variant="outline" onClick={() => removeStudentFromSelectedSubject(student.id)}>
                          Remove
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Locked (Core)</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subject available.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setSubjectForTeacherReassignment(null);
          setStaffSearchQuery('');
        }}
        title={subjectForTeacherReassignment ? `Assign Teacher for ${subjectForTeacherReassignment.name}` : 'Assign Teacher'}
        footer={(
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsTeacherModalOpen(false);
              setSubjectForTeacherReassignment(null);
              setStaffSearchQuery('');
            }}
          >
            Cancel
          </Button>
        )}
      >
        <div className="space-y-4">
          {subjectForTeacherReassignment && (
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-muted-foreground">Current Teacher</p>
              <p className="font-medium">{subjectForTeacherReassignment.currentTeacher}</p>
            </div>
          )}

          <input
            value={staffSearchQuery}
            onChange={(event) => setStaffSearchQuery(event.target.value)}
            placeholder="Search staff by name"
            className="w-full p-2 border border-border rounded-lg bg-input-background"
          />

          <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {filteredStaff.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No eligible staff found.</p>
            )}

            {filteredStaff.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-medium text-sm">{staff.name}</p>
                  <p className="text-xs text-muted-foreground">{staff.role}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleTeacherAssignment(staff)}
                  disabled={!isClassTeacher}
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}