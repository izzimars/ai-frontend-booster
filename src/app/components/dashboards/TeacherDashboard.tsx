import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  BookOpen, Plus, FileText, ClipboardCheck, Activity,
  Clock, AlertCircle, CheckCircle, Search, Shield, Link2, Star, BarChart3, TrendingUp, ArrowLeft
} from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { useLocation, useNavigate } from 'react-router-dom';

type DailyActivityStatus = 'not_started' | 'in_progress' | 'completed';
type SyllabusStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type SyllabusEntry = {
  id: string;
  className: string;
  subject: string;
  week: number;
  title: string;
  content: string;
  status: SyllabusStatus;
  lessonNotes: number;
  lessonNoteId: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
};

type SyllabusFormState = {
  className: string;
  subject: string;
  week: string;
  title: string;
  content: string;
  lessonNotes: string;
};

type LessonNoteStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type LessonNoteQuestion = {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

type LessonNoteEntry = {
  id: string;
  syllabusId: string | null;
  createdBy: string;
  className: string;
  subject: string;
  week: number;
  title: string;
  content: string;
  noteStatus: LessonNoteStatus;
  questions: LessonNoteQuestion[];
};

type AssessmentType = 'Quiz' | 'Test' | 'Assignment' | 'Exam';
type AssessmentStatus = 'draft' | 'submitted' | 'approved';

type AssessmentEntry = {
  id: string;
  className: string;
  subject: string;
  title: string;
  type: AssessmentType;
  totalMarks: number;
  dueDate: string;
  status: AssessmentStatus;
  isCumulative: boolean;
};

type AssessmentGradeRow = {
  studentId: string;
  score: string;
  feedback: string;
};

type MonthlyRating = 'Exceeding Expectations' | 'Meeting Expectations' | 'Developing';

type MonthlyNarrative = {
  month: string;
  comment: string;
  rating: MonthlyRating;
};

type PerformanceStudent = {
  id: string;
  name: string;
};

// Mock data (replace with API)
const mockClasses = [
  { id: '0f9f9a3d-7ff5-4a86-b138-a1db915a7f11', name: 'Math 10A', subject: 'Mathematics', time: '08:00-09:30', teacherRole: 'subjectTeacher' },
  { id: '1a0f1cb6-caa0-4a0f-ae9c-87262dcf9d31', name: 'Math 10B', subject: 'Mathematics', time: '10:00-11:30', teacherRole: 'subjectTeacher' },
  { id: 'f4f5d3f4-0b14-4d8d-b7d6-4c2a38d44dc2', name: 'Science 10A', subject: 'Science', time: '13:00-14:30', teacherRole: 'subjectTeacher' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819', name: 'English 10C', subject: 'English', time: '15:00-16:30', teacherRole: 'classTeacher' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'English 11A', subject: 'English', time: '15:00-16:30', teacherRole: 'subjectTeacher' },
];

const mockPendingApprovals = [
  { id: 'syl-1', type: 'Syllabus', item: 'Week 3: Quadratic Functions', submittedBy: 'Teacher', submittedAt: '2025-04-06' },
  { id: 'ln-1', type: 'Lesson Note', item: 'Week 2: Linear Equations', submittedBy: 'Teacher', submittedAt: '2025-04-05' },
];

const mockRecentActivity = [
  { action: 'Generated lesson note for Week 1', timestamp: '2025-04-07T09:30:00Z' },
  { action: 'Submitted syllabus for Week 3', timestamp: '2025-04-06T14:20:00Z' },
  { action: 'Marked medication for Sarah Johnson', timestamp: '2025-04-06T10:00:00Z' },
];

const initialSyllabusWeeks: SyllabusEntry[] = [
  { id: 'syl-10c-math-1', className: 'Grade 10C', subject: 'Mathematics', week: 1, title: 'Introduction to Algebra', content: 'Build number sense, introduce variables, and practice translating stories into expressions.', status: 'approved', lessonNotes: 2, lessonNoteId: 'ln-10c-math-1', submittedAt: null, approvedAt: '2025-04-01', rejectionReason: null },
  { id: 'syl-10c-math-2', className: 'Grade 10C', subject: 'Mathematics', week: 2, title: 'Linear Equations', content: 'Solve one-step and two-step equations, then connect them to graphing and real-world balance models.', status: 'approved', lessonNotes: 3, lessonNoteId: 'ln-10c-math-2', submittedAt: '2025-03-28', approvedAt: '2025-03-30', rejectionReason: null },
  { id: 'syl-10c-math-3', className: 'Grade 10C', subject: 'Mathematics', week: 3, title: 'Quadratic Functions', content: 'Introduce parabolas, vertex form, and the role of intercepts in function analysis.', status: 'submitted', lessonNotes: 0, lessonNoteId: null, submittedAt: '2025-04-06', approvedAt: null, rejectionReason: null },
  { id: 'syl-10c-math-4', className: 'Grade 10C', subject: 'Mathematics', week: 4, title: 'Graphing Techniques', content: 'Interpret slope, intercepts, and coordinate plots with emphasis on precision and scale.', status: 'rejected', lessonNotes: 0, lessonNoteId: null, submittedAt: '2025-04-02', approvedAt: null, rejectionReason: 'Objectives too vague. Please add specific learning outcomes.' },
  { id: 'syl-11a-python-1', className: 'Grade 11A', subject: 'Python', week: 1, title: 'Python Fundamentals', content: 'Cover syntax, variables, basic input/output, and simple conditional logic.', status: 'approved', lessonNotes: 2, lessonNoteId: 'ln-11a-python-1', submittedAt: '2025-03-27', approvedAt: '2025-03-29', rejectionReason: null },
  { id: 'syl-11a-web-1', className: 'Grade 11A', subject: 'Web Development', week: 1, title: 'HTML Structure & Semantics', content: 'Teach semantic structure, page hierarchy, and meaningful markup.', status: 'submitted', lessonNotes: 1, lessonNoteId: null, submittedAt: '2025-04-07', approvedAt: null, rejectionReason: null },
];

const quarterlyUpdates = [
  { studentId: '1', name: 'Sarah Johnson', quarter: 'Q1', status: 'completed', academicProgress: 'Excellent', behavior: 'Good', recommendation: 'Encourage leadership roles' },
  { studentId: '2', name: 'Michael Brown', quarter: 'Q1', status: 'pending', academicProgress: '', behavior: '', recommendation: '' },
];

const initialLessonNotesByContext: LessonNoteEntry[] = [
  {
    id: 'ln-10c-math-1',
    syllabusId: 'syl-10c-math-1',
    createdBy: 'teacher-1',
    className: 'Grade 10C',
    subject: 'Mathematics',
    week: 1,
    title: 'Introduction to Algebra',
    content: 'Students can identify variables, simplify expressions, and explain how algebra helps represent patterns.',
    noteStatus: 'approved',
    questions: [
      { id: 'q1', text: 'Solve for x: 2x + 5 = 15', difficulty: 'Easy' },
      { id: 'q2', text: 'Write two real-life examples of algebraic expressions.', difficulty: 'Medium' },
    ],
  },
  {
    id: 'ln-10c-math-2',
    syllabusId: 'syl-10c-math-2',
    createdBy: 'teacher-1',
    className: 'Grade 10C',
    subject: 'Mathematics',
    week: 2,
    title: 'Linear Equations',
    content: 'Students can solve linear equations and explain how those solutions appear on a number line or graph.',
    noteStatus: 'submitted',
    questions: [
      { id: 'q3', text: 'Represent y = 2x + 1 on a graph.', difficulty: 'Medium' },
    ],
  },
  {
    id: 'ln-10c-math-4',
    syllabusId: 'syl-10c-math-4',
    createdBy: 'teacher-1',
    className: 'Grade 10C',
    subject: 'Mathematics',
    week: 4,
    title: 'Graphing Techniques',
    content: 'Students can plot points accurately and interpret coordinate relationships.',
    noteStatus: 'draft',
    questions: [],
  },
  {
    id: 'ln-11a-python-1',
    syllabusId: 'syl-11a-python-1',
    createdBy: 'teacher-1',
    className: 'Grade 11A',
    subject: 'Python',
    week: 1,
    title: 'Python Fundamentals',
    content: 'Students can write a simple program, use variables, and explain the output flow.',
    noteStatus: 'approved',
    questions: [
      { id: 'q4', text: 'Explain the difference between a list and tuple in Python.', difficulty: 'Medium' },
    ],
  },
];

const studentsByClassName: Record<string, PerformanceStudent[]> = {
  'Grade 10C': [
    { id: 'st-10c-1', name: 'Sarah Johnson' },
    { id: 'st-10c-2', name: 'Michael Brown' },
    { id: 'st-10c-3', name: 'Emily Davis' },
  ],
  'Grade 11A': [
    { id: 'st-11a-1', name: 'Daniel Kent' },
    { id: 'st-11a-2', name: 'Laura James' },
  ],
};

const initialAssessments: AssessmentEntry[] = [
  {
    id: 'asm-math-10c-quiz-1',
    className: 'Grade 10C',
    subject: 'Mathematics',
    title: 'Algebra Quiz 1',
    type: 'Quiz',
    totalMarks: 20,
    dueDate: '2026-04-12',
    status: 'draft',
    isCumulative: true,
  },
  {
    id: 'asm-math-10c-test-1',
    className: 'Grade 10C',
    subject: 'Mathematics',
    title: 'Linear Equations Test',
    type: 'Test',
    totalMarks: 40,
    dueDate: '2026-04-20',
    status: 'submitted',
    isCumulative: true,
  },
  {
    id: 'asm-python-11a-ass-1',
    className: 'Grade 11A',
    subject: 'Python',
    title: 'Functions Assignment',
    type: 'Assignment',
    totalMarks: 30,
    dueDate: '2026-04-15',
    status: 'approved',
    isCumulative: true,
  },
];

const medicationsDue = [
  { id: 1, student: 'Sarah Johnson', class: 'Math 10A', medication: 'Ibuprofen 200mg', time: '10:00 AM', status: 'pending' },
  { id: 2, student: 'Michael Brown', class: 'Science 9B', medication: 'Vitamin D', time: '12:00 PM', status: 'pending' },
  { id: 3, student: 'Emily Davis', class: 'English 11A', medication: 'Allergy Medicine', time: '02:00 PM', status: 'pending' },
];

const medicalStudents = [
  {
    id: 1,
    name: 'Sarah Johnson',
    class: 'Math 10A',
    allergies: 'Peanuts, Penicillin',
    conditions: 'Asthma',
    medications: [
      { name: 'Ibuprofen 200mg', dosage: '2x daily', times: ['10:00 AM', '04:00 PM'], active: true },
      { name: 'Inhaler (Albuterol)', dosage: 'As needed', times: [], active: true },
    ],
  },
  {
    id: 2,
    name: 'Michael Brown',
    class: 'Science 9B',
    allergies: 'None',
    conditions: 'None',
    medications: [
      { name: 'Vitamin D', dosage: '1x daily', times: ['12:00 PM'], active: true },
    ],
  },
];

const recentDepartures = [
  { id: 1, child: 'Sarah Johnson', class: 'Math 10A', authorizedBy: 'Jane Johnson (Mother)', time: '14:30', verifiedBy: 'Gate Staff 1' },
  { id: 2, child: 'Michael Brown', class: 'Science 9B', authorizedBy: 'Self Pickup', time: '14:25', verifiedBy: 'Gate Staff 1' },
  { id: 3, child: 'Emily Davis', class: 'English 11A', authorizedBy: 'John Davis (Father)', time: '14:20', verifiedBy: 'Gate Staff 1' },
];

const teacherClasses = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819',
    name: 'Grade 10C',
    role: 'Class Teacher',      // or 'Subject Teacher'
    subjects: ['Python', 'Geography', 'Mathematics'],
    totalStudents: 38,
    pendingUpdates: 3,          // number of students without quarterly update
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Grade 11A',
    role: 'Subject Teacher',
    subjects: ['Python', 'Web Development'],
    totalStudents: 32,
    pendingUpdates: 1,
  },
];

const loadStoredArray = <T,>(storageKey: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;

  const storedValue = window.localStorage.getItem(storageKey);
  if (!storedValue) return fallback;

  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? (parsedValue as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const createDashboardId = (prefix: string) =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;


export function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const emptySyllabusForm: SyllabusFormState = {
    className: '',
    subject: '',
    week: '',
    title: '',
    content: '',
    lessonNotes: '0',
  };

  const [activeTab, setActiveTab] = useState<'todays_classes' | 'class' | 'syllabus' | 'lesson_notes' | 'assessment' | 'performance' | 'medical' | 'pickup'>('todays_classes');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('2025/2026 Term 2');
  const [activeClass, setActiveClass] = useState(null);
  const [syllabusWeeks, setSyllabusWeeks] = useState<SyllabusEntry[]>(() => loadStoredArray('teacher-dashboard:syllabus-weeks', initialSyllabusWeeks));
  const [dailyActivityStatus, setDailyActivityStatus] = useState<Record<string, DailyActivityStatus>>({});
  const [showNewSyllabusModal, setShowNewSyllabusModal] = useState(false);
  const [currentSyllabusEntry, setCurrentSyllabusEntry] = useState<SyllabusEntry | null>(null);
  const [syllabusForm, setSyllabusForm] = useState<SyllabusFormState>(emptySyllabusForm);
  const [showLessonNoteModal, setShowLessonNoteModal] = useState(false);
  const [currentLessonNoteEntry, setCurrentLessonNoteEntry] = useState<LessonNoteEntry | null>(null);
  const [currentLessonNoteSyllabusId, setCurrentLessonNoteSyllabusId] = useState('');
  const [lessonNoteForm, setLessonNoteForm] = useState<{ content: string }>({ content: '' });
  const [focusedLessonNoteId, setFocusedLessonNoteId] = useState<string | null>(null);
  const [lessonNotesByContext, setLessonNotesByContext] = useState<LessonNoteEntry[]>(() => loadStoredArray('teacher-dashboard:lesson-notes', initialLessonNotesByContext));
  const [assessments, setAssessments] = useState<AssessmentEntry[]>(initialAssessments);
  const [assessmentView, setAssessmentView] = useState<'list' | 'grading' | 'analytics'>('list');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [assessmentGrades, setAssessmentGrades] = useState<Record<string, Record<string, { score: number | null; feedback: string }>>>(() => {
    const seeded: Record<string, Record<string, { score: number | null; feedback: string }>> = {};

    initialAssessments.forEach((assessment) => {
      const students = studentsByClassName[assessment.className] || [];
      seeded[assessment.id] = Object.fromEntries(
        students.map((student, index) => [
          student.id,
          {
            score: assessment.status === 'approved' ? Math.round(assessment.totalMarks * (0.55 + index * 0.1)) : null,
            feedback: '',
          },
        ]),
      );
    });

    return seeded;
  });
  const [gradeValidationError, setGradeValidationError] = useState('');
  const [selectedPerformanceStudentId, setSelectedPerformanceStudentId] = useState<string | null>(null);
  const [monthlyNarratives, setMonthlyNarratives] = useState<Record<string, Record<string, MonthlyNarrative>>>({});
  const [narrativeMonth, setNarrativeMonth] = useState('2026-04');
  const [narrativeComment, setNarrativeComment] = useState('');
  const [narrativeRating, setNarrativeRating] = useState<MonthlyRating>('Meeting Expectations');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicalStudent, setSelectedMedicalStudent] = useState<any>(null);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [pickupCode, setPickupCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const currentTeacherId = 'teacher-1';

  const filteredStudents = medicalStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const classOptions = teacherClasses.map((classItem) => classItem.name);
  const selectedClassSubjects = teacherClasses.find((classItem) => classItem.name === selectedClass)?.subjects || [];
  const filteredSyllabusWeeks = syllabusWeeks.filter(
    (week) => week.className === selectedClass && week.subject === selectedSubject
  );
  const filteredLessonNotes = lessonNotesByContext.filter(
    (note) => note.className === selectedClass && note.subject === selectedSubject
  );
  const filteredAssessments = assessments.filter(
    (assessment) => assessment.className === selectedClass && assessment.subject === selectedSubject,
  );
  const selectedAssessment = selectedAssessmentId
    ? filteredAssessments.find((assessment) => assessment.id === selectedAssessmentId) || null
    : null;
  const selectedClassStudents = studentsByClassName[selectedClass] || [];
  const syllabusByWeek = new Map(filteredSyllabusWeeks.map((week) => [week.week, week]));
  const newSyllabusClassSubjects = teacherClasses.find((classItem) => classItem.name === syllabusForm.className)?.subjects || [];
  const focusedLinkedSyllabus = focusedLessonNoteId
    ? syllabusWeeks.find((week) => week.lessonNoteId === focusedLessonNoteId) || null
    : null;
  const approvedSyllabusOptionsForCurrentNote = currentLessonNoteEntry
    ? syllabusWeeks.filter(
        (week) =>
          week.status === 'approved' &&
          week.className === currentLessonNoteEntry.className &&
          week.subject === currentLessonNoteEntry.subject,
      )
    : [];

  const getScoresForAssessment = (assessmentId: string) => {
    return assessmentGrades[assessmentId] || {};
  };

  const getAssessmentNumericScores = (assessmentId: string) => {
    return Object.values(getScoresForAssessment(assessmentId))
      .map((entry) => entry.score)
      .filter((score): score is number => typeof score === 'number');
  };

  const getAssessmentAnalytics = (assessment: AssessmentEntry) => {
    const scores = getAssessmentNumericScores(assessment.id);
    if (!scores.length) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        passRate: 0,
      };
    }

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = scores.filter((score) => score >= assessment.totalMarks * 0.5).length;

    return {
      average: Math.round(average * 100) / 100,
      highest,
      lowest,
      passRate: Math.round((passCount / scores.length) * 100),
    };
  };

  const cumulativeAssessments = filteredAssessments.filter((assessment) => assessment.isCumulative);

  const classAverageFromCumulative = (() => {
    if (!cumulativeAssessments.length) return null;

    const assessmentAverages = cumulativeAssessments
      .map((assessment) => {
        const stats = getAssessmentAnalytics(assessment);
        return assessment.totalMarks > 0 ? (stats.average / assessment.totalMarks) * 100 : 0;
      })
      .filter((value) => Number.isFinite(value));

    if (!assessmentAverages.length) return null;
    return Math.round((assessmentAverages.reduce((sum, score) => sum + score, 0) / assessmentAverages.length) * 100) / 100;
  })();

  const calculatedTermGradeByStudent = Object.fromEntries(
    selectedClassStudents.map((student) => {
      const cumulativePercentages = cumulativeAssessments
        .map((assessment) => {
          const score = getScoresForAssessment(assessment.id)[student.id]?.score;
          if (typeof score !== 'number' || assessment.totalMarks <= 0) return null;
          return (score / assessment.totalMarks) * 100;
        })
        .filter((score): score is number => score !== null);

      if (!cumulativePercentages.length) return [student.id, null];
      const value = cumulativePercentages.reduce((sum, score) => sum + score, 0) / cumulativePercentages.length;
      return [student.id, Math.round(value * 100) / 100];
    }),
  ) as Record<string, number | null>;

  const selectedPerformanceStudent = selectedClassStudents.find((student) => student.id === selectedPerformanceStudentId) || null;

  const selectedStudentTrend = selectedPerformanceStudent
    ? cumulativeAssessments.map((assessment) => ({
        label: assessment.title,
        week: assessment.dueDate,
        score: getScoresForAssessment(assessment.id)[selectedPerformanceStudent.id]?.score,
        totalMarks: assessment.totalMarks,
      }))
    : [];

  const selectedStudentNarratives = selectedPerformanceStudent
    ? Object.values(monthlyNarratives[selectedPerformanceStudent.id] || {})
    : [];

  useEffect(() => {
    const restored = location.state as { activeTab?: string; selectedClass?: string; selectedSubject?: string } | null;
    if (!restored) return;

    if (restored.activeTab === 'lesson_notes') {
      setActiveTab('lesson_notes');
    }
    if (restored.selectedClass) {
      setSelectedClass(restored.selectedClass);
    }
    if (restored.selectedSubject) {
      setSelectedSubject(restored.selectedSubject);
    }
  }, [location.state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem('teacher-dashboard:syllabus-weeks', JSON.stringify(syllabusWeeks));
  }, [syllabusWeeks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem('teacher-dashboard:lesson-notes', JSON.stringify(lessonNotesByContext));
  }, [lessonNotesByContext]);

  useEffect(() => {
    if (activeTab !== 'lesson_notes' || !focusedLessonNoteId) return;

    const row = document.getElementById(`lesson-note-row-${focusedLessonNoteId}`);
    if (!row) return;

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeTab, focusedLessonNoteId]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const nextStatus: Record<string, DailyActivityStatus> = {};

    mockClasses.forEach((classItem) => {
      const saved = localStorage.getItem(`teaching-console:${classItem.id}:${today}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          nextStatus[classItem.id] = parsed.status || 'not_started';
        } catch {
          nextStatus[classItem.id] = 'not_started';
        }
      } else {
        nextStatus[classItem.id] = 'not_started';
      }
    });

    setDailyActivityStatus(nextStatus);
  }, [activeTab]);

  const handleClassFilterChange = (className: string) => {
    setSelectedClass(className);
    setSelectedSubject('');
  };

  const handleOpenTeachingConsole = (classId: string) => {
    const classMeta = mockClasses.find((item) => item.id === classId);
    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `teaching-console:${classId}:${today}`;
    const existing = localStorage.getItem(storageKey);

    if (!existing) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          classId,
          subjectId: classMeta?.subject?.toLowerCase() || '',
          date: today,
          status: 'in_progress',
          attendance: { morning: false, afternoon: false, subjectSpecific: false },
          attendanceRecords: {},
          scores: [],
          homework: { title: '', dueDate: '' },
          summary: '',
          medicationAlerts: [],
          medicationLog: [],
          updatedAt: new Date().toISOString(),
        }),
      );
    }

    setDailyActivityStatus((prev) => ({
      ...prev,
      [classId]: 'in_progress',
    }));

    navigate(`/teaching-console/${classId}`);
  };

  const resetSyllabusForm = () => {
    setSyllabusForm(emptySyllabusForm);
  };

  const closeSyllabusModal = () => {
    setShowNewSyllabusModal(false);
    setCurrentSyllabusEntry(null);
    resetSyllabusForm();
  };

  const closeLessonNoteModal = () => {
    setShowLessonNoteModal(false);
    setCurrentLessonNoteEntry(null);
    setCurrentLessonNoteSyllabusId('');
    setLessonNoteForm({ content: '' });
  };

  const handleOpenCreateSyllabusModal = () => {
    setCurrentSyllabusEntry(null);
    resetSyllabusForm();
    setShowNewSyllabusModal(true);
  };

  const handleOpenEditSyllabusModal = (entry: SyllabusEntry) => {
    if (entry.status === 'approved') return;

    setCurrentSyllabusEntry(entry);
    setSyllabusForm({
      className: entry.className,
      subject: entry.subject,
      week: String(entry.week),
      title: entry.title,
      content: entry.content,
      lessonNotes: String(entry.lessonNotes),
    });
    setShowNewSyllabusModal(true);
  };

  const handleSaveSyllabusEntry = () => {
    if (!syllabusForm.className || !syllabusForm.subject || !syllabusForm.week || !syllabusForm.title.trim() || !syllabusForm.content.trim()) {
      return;
    }

    const entryId = currentSyllabusEntry?.id ?? createDashboardId('syl');
    const payload: SyllabusEntry = {
      id: entryId,
      className: syllabusForm.className,
      subject: syllabusForm.subject,
      week: Number(syllabusForm.week),
      title: syllabusForm.title.trim(),
      content: syllabusForm.content.trim(),
      lessonNotes: Number(syllabusForm.lessonNotes),
      lessonNoteId: currentSyllabusEntry?.lessonNoteId ?? null,
      status: 'draft',
      submittedAt: null,
      approvedAt: null,
      rejectionReason: null,
    };

    if (currentSyllabusEntry) {
      setSyllabusWeeks((prev) =>
        prev.map((week) => (week.id === currentSyllabusEntry.id ? { ...week, ...payload } : week)),
      );
      alert(`Updated Week ${payload.week} and moved to Draft for review.`);
    } else {
      setSyllabusWeeks((prev) => [...prev, payload]);
      alert(`Created syllabus for ${payload.className} • ${payload.subject} (Week ${payload.week})`);
    }

    closeSyllabusModal();
  };

  const handleSubmitSyllabusForApproval = (entry: SyllabusEntry) => {
    if (entry.status !== 'draft' && entry.status !== 'rejected') return;

    if (!entry.title.trim() || !entry.content.trim()) {
      alert('Please provide both a syllabus title and content before submitting.');
      return;
    }

    setSyllabusWeeks((prev) =>
      prev.map((week) =>
        week.id === entry.id
          ? {
              ...week,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
              rejectionReason: null,
            }
          : week,
      ),
    );
  };

  const openLessonNoteEditor = (syllabusEntry: SyllabusEntry) => {
    if (syllabusEntry.status !== 'approved') return;

    const existingNote = syllabusEntry.lessonNoteId
      ? lessonNotesByContext.find((note) => note.id === syllabusEntry.lessonNoteId) || null
      : lessonNotesByContext.find(
          (note) => note.className === syllabusEntry.className && note.subject === syllabusEntry.subject && note.week === syllabusEntry.week,
        ) || null;

    const linkedNote = existingNote || {
      id: createDashboardId('ln'),
      syllabusId: syllabusEntry.id,
      createdBy: currentTeacherId,
      className: syllabusEntry.className,
      subject: syllabusEntry.subject,
      week: syllabusEntry.week,
      title: syllabusEntry.title,
      content: syllabusEntry.content,
      noteStatus: 'draft' as const,
      questions: [],
    };

    setCurrentLessonNoteEntry(linkedNote);
    setCurrentLessonNoteSyllabusId(linkedNote.syllabusId || syllabusEntry.id);
    setLessonNoteForm({ content: syllabusEntry.content });
    setShowLessonNoteModal(true);
  };

  const handleSyllabusRowClick = (entry: SyllabusEntry) => {
    setSelectedClass(entry.className);
    setSelectedSubject(entry.subject);

    if (entry.lessonNoteId) {
      const linkedNote = lessonNotesByContext.find((note) => note.id === entry.lessonNoteId);
      if (!linkedNote) {
        openLessonNoteEditor(entry);
        return;
      }

      setActiveTab('lesson_notes');
      setFocusedLessonNoteId(entry.lessonNoteId);
      return;
    }

    openLessonNoteEditor(entry);
  };

  const handleSaveLessonNote = () => {
    if (!currentLessonNoteEntry || !lessonNoteForm.content.trim()) return;

    const linkedSyllabusId = currentLessonNoteSyllabusId || null;

    const nextLessonNote: LessonNoteEntry = {
      ...currentLessonNoteEntry,
      createdBy: currentLessonNoteEntry.createdBy || currentTeacherId,
      syllabusId: linkedSyllabusId,
      content: lessonNoteForm.content.trim(),
    };

    setLessonNotesByContext((prev) => {
      const nextNotes = prev.some((note) => note.id === nextLessonNote.id)
        ? prev.map((note) => (note.id === nextLessonNote.id ? nextLessonNote : note))
        : [...prev, nextLessonNote];

      setSyllabusWeeks((weeks) =>
        weeks.map((week) =>
          week.lessonNoteId === nextLessonNote.id && week.id !== linkedSyllabusId
            ? {
                ...week,
                lessonNoteId: null,
              }
            : linkedSyllabusId && week.id === linkedSyllabusId
            ? {
                ...week,
                lessonNoteId: nextLessonNote.id,
                lessonNotes: nextLessonNote.questions.length,
              }
            : week,
        ),
      );

      return nextNotes;
    });

    closeLessonNoteModal();
  };

  const handleDeleteLessonNote = (noteId: string) => {
    setLessonNotesByContext((prev) => prev.filter((note) => note.id !== noteId));
    setSyllabusWeeks((prev) =>
      prev.map((week) => (week.lessonNoteId === noteId ? { ...week, lessonNoteId: null } : week)),
    );

    if (focusedLessonNoteId === noteId) {
      setFocusedLessonNoteId(null);
    }
  };

  const handleMarkGiven = (med: any) => {
    setSelectedMedication(med);
  };

  const confirmMedication = () => {
    alert(`Medication administered: ${selectedMedication.medication} for ${selectedMedication.student}`);
    setSelectedMedication(null);
  };

  const handleVerifyPickup = () => {
    if (pickupCode === '123456') {
      setVerificationResult({
        valid: true,
        child: 'Sarah Johnson',
        class: 'Math 10A',
        authorizedBy: 'Jane Johnson (Mother)',
        photo: 'https://via.placeholder.com/150',
        expiresAt: '15:00',
      });
    } else if (pickupCode.length === 6) {
      setVerificationResult({
        valid: false,
        message: 'Invalid or expired code',
      });
    }
  };

  const handleConfirmDeparture = () => {
    alert(`Departure logged for ${verificationResult.child}`);
    setVerificationResult(null);
    setPickupCode('');
  };

  const handleEnterClass = (classId: string | number) => {
    setActiveClass(classId as any);
    navigate(`/class/${classId}`);
  };

  const handleOpenAssessmentGrading = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    setAssessmentView('grading');
    setGradeValidationError('');
  };

  const handleOpenAssessmentAnalytics = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    setAssessmentView('analytics');
  };

  const handleBackToAssessmentList = () => {
    setAssessmentView('list');
    setSelectedAssessmentId(null);
    setGradeValidationError('');
  };

  const handleToggleAssessmentCumulative = (assessmentId: string) => {
    setAssessments((prev) =>
      prev.map((assessment) =>
        assessment.id === assessmentId ? { ...assessment, isCumulative: !assessment.isCumulative } : assessment,
      ),
    );
  };

  const handleAssessmentScoreChange = (assessmentId: string, studentId: string, scoreValue: string) => {
    setAssessmentGrades((prev) => ({
      ...prev,
      [assessmentId]: {
        ...(prev[assessmentId] || {}),
        [studentId]: {
          ...(prev[assessmentId]?.[studentId] || { score: null, feedback: '' }),
          score: scoreValue.trim() === '' ? null : Number(scoreValue),
        },
      },
    }));
  };

  const handleAssessmentFeedbackChange = (assessmentId: string, studentId: string, feedback: string) => {
    setAssessmentGrades((prev) => ({
      ...prev,
      [assessmentId]: {
        ...(prev[assessmentId] || {}),
        [studentId]: {
          ...(prev[assessmentId]?.[studentId] || { score: null, feedback: '' }),
          feedback,
        },
      },
    }));
  };

  const handleSaveAssessmentGrades = () => {
    if (!selectedAssessment) return;

    const currentScores = getScoresForAssessment(selectedAssessment.id);
    const exceeds = Object.entries(currentScores).find(([, value]) => {
      return typeof value.score === 'number' && value.score > selectedAssessment.totalMarks;
    });

    if (exceeds) {
      setGradeValidationError(`Score cannot be greater than ${selectedAssessment.totalMarks}.`);
      return;
    }

    setGradeValidationError('');
    alert('Grades saved successfully.');
  };

  const handleSubmitAssessmentForApproval = (assessmentId: string) => {
    setAssessments((prev) =>
      prev.map((assessment) =>
        assessment.id === assessmentId
          ? {
              ...assessment,
              status: assessment.status === 'approved' ? 'approved' : 'submitted',
            }
          : assessment,
      ),
    );
  };

  const handleCreateFirstAssessment = () => {
    if (!selectedClass || !selectedSubject) return;

    const newAssessment: AssessmentEntry = {
      id: `asm-${crypto.randomUUID()}`,
      className: selectedClass,
      subject: selectedSubject,
      title: `${selectedSubject} New Assessment`,
      type: 'Quiz',
      totalMarks: 20,
      dueDate: new Date().toISOString().slice(0, 10),
      status: 'draft',
      isCumulative: false,
    };

    setAssessments((prev) => [...prev, newAssessment]);
    setAssessmentGrades((prev) => ({
      ...prev,
      [newAssessment.id]: Object.fromEntries(
        (studentsByClassName[selectedClass] || []).map((student) => [
          student.id,
          { score: null, feedback: '' },
        ]),
      ),
    }));
  };

  const handleSaveMonthlyNarrative = () => {
    if (!selectedPerformanceStudent || !narrativeComment.trim()) return;

    setMonthlyNarratives((prev) => ({
      ...prev,
      [selectedPerformanceStudent.id]: {
        ...(prev[selectedPerformanceStudent.id] || {}),
        [narrativeMonth]: {
          month: narrativeMonth,
          comment: narrativeComment.trim(),
          rating: narrativeRating,
        },
      },
    }));

    setNarrativeComment('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        <button onClick={() => setActiveTab('todays_classes')} className={`px-4 py-2 ${activeTab === 'todays_classes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Today's Classes
        </button>
        <button onClick={() => setActiveTab('class')} className={`px-4 py-2 ${activeTab === 'class' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Class
        </button>
        <button onClick={() => setActiveTab('syllabus')} className={`px-4 py-2 ${activeTab === 'syllabus' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Syllabus
        </button>
        <button onClick={() => setActiveTab('lesson_notes')} className={`px-4 py-2 ${activeTab === 'lesson_notes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Lesson Notes
        </button>
        <button onClick={() => setActiveTab('assessment')} className={`px-4 py-2 ${activeTab === 'assessment' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Assessment
        </button>
        <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 ${activeTab === 'performance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Performance
        </button>
        <button onClick={() => setActiveTab('medical')} className={`px-4 py-2 ${activeTab === 'medical' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Medical
        </button>
        <button onClick={() => setActiveTab('pickup')} className={`px-4 py-2 ${activeTab === 'pickup' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Pickup
        </button>
      </div>

      {/* Top Bar: Selectors */}

      {activeTab === 'todays_classes' && (
        <div className="space-y-6">
          <Card title="Today's Class Schedule">
            <div className="space-y-3">
              {mockClasses.map((c) => {
                const status = dailyActivityStatus[c.id] || 'not_started';
                const isInProgress = status === 'in_progress';
                const isCompleted = status === 'completed';

                return (
                  <div
                    key={c.id}
                    className="p-4 border border-border rounded-lg flex items-center justify-between hover:bg-muted/50 hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <p>{c.name}</p>
                      <p className="text-muted-foreground">{c.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{c.time}</Badge>
                      {isCompleted && <Badge variant="approved">Completed</Badge>}
                      <Button
                        size="sm"
                        variant={isInProgress ? 'outline' : 'primary'}
                        onClick={() => handleOpenTeachingConsole(c.id)}
                      >
                        {isInProgress ? 'Resume' : 'Start'}
                      </Button>
                      {c.teacherRole === 'classTeacher' && (
                        <Badge variant="default">Class Teacher View</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'class' && (
        <div className="space-y-6">
          {/* Class List Table */}
          <Card title="My Classes">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Class Name</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Subjects</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherClasses.map((classItem) => {
                    const displayedSubjects = classItem.subjects.slice(0, 2);
                    const hiddenSubjectsCount = classItem.subjects.length - 2;
                    
                    return (
                      <tr 
                        key={classItem.id} 
                        className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleEnterClass(classItem.id)}
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold">{classItem.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              classItem.role === 'Class Teacher' ? 'approved' : 'default'
                            }
                          >
                            {classItem.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2 items-center">
                            {displayedSubjects.map((subject) => (
                              <span
                                key={subject}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-accent text-xs"
                              >
                                {subject}
                              </span>
                            ))}
                            {hiddenSubjectsCount > 0 && (
                              <span className="text-xs text-muted-foreground">+{hiddenSubjectsCount}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <p>{classItem.totalStudents}</p>
                        </td>
                        <td className={`py-3 px-4 text-center ${classItem.pendingUpdates > 0 ? 'text-yellow-600 dark:text-yellow-500 font-semibold' : ''}`}>
                          {classItem.pendingUpdates}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Compact Recent Activity */}
          <Card title="Recent Activity">
            <div className="divide-y divide-border">
              {mockRecentActivity.slice(0, 4).map((act, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 text-sm">
                  <Clock size={14} className="text-muted-foreground shrink-0" />
                  <span className="flex-1">{act.action}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(act.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'syllabus' && (
        <Card title="Syllabus Management" action={<Button size="sm" onClick={handleOpenCreateSyllabusModal}><Plus size={16} /> New Syllabus</Button>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-accent/20">
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassFilterChange(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  <option value="">Select class</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Select Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                  disabled={!selectedClass}
                >
                  <option value="">Select subject</option>
                  {selectedClassSubjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>

            {!selectedClass || !selectedSubject ? (
              <div className="p-10 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                Please select a Class and Subject to view the syllabus.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-accent/20">
                      <th className="w-[60px] text-center py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Week</th>
                      <th className="py-3 px-4 align-middle text-left text-xs uppercase text-muted-foreground">Topic / Title</th>
                      <th className="w-[120px] text-center py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Status</th>
                      <th className="w-[100px] text-right py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSyllabusWeeks.map((week) => (
                      <Fragment key={week.id}>
                        <tr
                          onClick={() => handleSyllabusRowClick(week)}
                          className="border-b border-border cursor-pointer hover:bg-accent/40"
                        >
                          <td className="w-[60px] text-center py-3 px-4 align-middle">W{week.week}</td>
                          <td className="py-3 px-4 align-middle">
                            <div className="truncate font-medium">{week.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{week.content}</div>
                          </td>
                          <td className="w-[120px] text-center py-3 px-4 align-middle">
                            <Badge variant={week.status as any}>{week.status}</Badge>
                          </td>
                          <td className="w-[100px] text-right py-3 px-4 align-middle" onClick={(event) => event.stopPropagation()}>
                            <div className="inline-flex items-center space-x-2">
                              {(week.status === 'draft' || week.status === 'rejected') && (
                                <Button size="sm" variant="primary" onClick={() => handleSubmitSyllabusForApproval(week)}>
                                  Submit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {week.status === 'rejected' && week.rejectionReason && (
                          <tr className="border-b border-border">
                            <td colSpan={4} className="py-2 px-4 text-sm text-red-700 dark:text-red-300 bg-red-50/60 dark:bg-red-950/30 align-middle">
                              <span className="inline-flex items-center gap-2"><AlertCircle size={14} /> Fix required: {week.rejectionReason}</span>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>

                {filteredSyllabusWeeks.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    No syllabus entries found for the selected Class and Subject.
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'lesson_notes' && (
        <div className="space-y-4">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassFilterChange(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  <option value="">Select class</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                  disabled={!selectedClass}
                >
                  <option value="">Select subject</option>
                  {selectedClassSubjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!selectedClass || !selectedSubject ? (
            <div className="p-10 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Select a Class and Subject to manage lesson materials.
            </div>
          ) : (
            <Card title="Lesson Notes">
              {focusedLinkedSyllabus && (
                <div className="mb-4 p-3 rounded-lg border border-border bg-accent/20">
                  <Badge variant="approved">
                    Linked to Syllabus: Week {focusedLinkedSyllabus.week} - {focusedLinkedSyllabus.title}
                  </Badge>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-[60px] text-center py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Week</th>
                      <th className="py-3 px-4 align-middle text-left text-xs uppercase text-muted-foreground">Topic / Title</th>
                      <th className="w-[120px] text-center py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Syllabus</th>
                      <th className="w-[120px] text-center py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Note</th>
                      <th className="w-[80px] text-center py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Qns</th>
                      <th className="w-[100px] text-right py-3 px-4 align-middle text-xs uppercase text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLessonNotes.map((note) => {
                      const linkedSyllabus = syllabusByWeek.get(note.week);
                      const isSyllabusApproved = linkedSyllabus?.status === 'approved';
                      const isNoteApproved = note.noteStatus === 'approved';
                      const canEditNote = note.createdBy === currentTeacherId || note.noteStatus !== 'approved';
                      const isRowClickable = true;

                      return (
                        <Fragment key={note.id}>
                          <tr
                            id={`lesson-note-row-${note.id}`}
                            key={note.id}
                            onClick={() => {
                              if (!isRowClickable) return;
                              navigate(`/teaching-console/lesson-editor/${note.id}?className=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}`, {
                                state: { selectedClass, selectedSubject, note },
                              });
                            }}
                            className={`border-b border-border ${isRowClickable ? 'cursor-pointer hover:bg-accent/40' : ''} ${focusedLessonNoteId === note.id ? 'bg-accent/30' : ''}`}
                          >
                            <td className="w-[60px] text-center py-3 px-4 align-middle">W{note.week}</td>
                            <td className="py-3 px-4 align-middle">
                              <div className="truncate">{linkedSyllabus?.title || note.title || 'No linked syllabus topic'}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{note.content}</div>
                            </td>
                            <td className="w-[120px] text-center py-3 px-4 align-middle">
                                {isSyllabusApproved ? (
                                  <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300 text-sm">
                                    <Link2 size={14} /> Linked
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Empty</span>
                                )}
                            </td>
                            <td className="w-[120px] text-center py-3 px-4 align-middle">
                              <Badge variant={note.noteStatus as any}>{note.noteStatus}</Badge>
                            </td>
                            <td className="w-[80px] text-center py-3 px-4 align-middle">{note.questions.length}</td>
                            <td className="w-[100px] text-right py-3 px-4 align-middle" onClick={(event) => event.stopPropagation()}>
                                <div className="inline-flex items-center space-x-2">
                                  {!isNoteApproved && (
                                    <Button size="sm" variant="primary" disabled={!isSyllabusApproved || note.noteStatus !== 'draft'}>
                                      Submit
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteLessonNote(note.id)}
                                    disabled={note.noteStatus === 'approved'}
                                  >
                                    Delete
                                  </Button>
                                </div>
                            </td>
                          </tr>

                          {!isSyllabusApproved && (
                            <tr>
                              <td colSpan={6} className="px-3 py-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40 border-b border-border">
                                Warning: Link to an approved syllabus before submitting notes.
                              </td>
                            </tr>
                          )}

                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredLessonNotes.length === 0 && (
                <div className="mt-4 p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                  No lesson notes found for this Class and Subject.
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {activeTab === 'assessment' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-accent/20">
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassFilterChange(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
              >
                <option value="">Select class</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
                disabled={!selectedClass}
              >
                <option value="">Select subject</option>
                {selectedClassSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedClass || !selectedSubject ? (
            <div className="p-10 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Select a Class and Subject to manage assessments.
            </div>
          ) : assessmentView === 'list' ? (
            <Card title="Assessment Management" action={<Badge variant="default">{filteredAssessments.length} total</Badge>}>
              {filteredAssessments.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">No assessments yet for this class and subject.</p>
                  <Button size="sm" variant="primary" onClick={handleCreateFirstAssessment}>
                    <Plus size={14} className="mr-1" /> Create your first assessment
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cumulative</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell><Badge variant="default">{assessment.type}</Badge></TableCell>
                        <TableCell>{assessment.totalMarks}</TableCell>
                        <TableCell>{new Date(assessment.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant={assessment.status as any}>{assessment.status}</Badge></TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleToggleAssessmentCumulative(assessment.id)}
                            className="inline-flex items-center"
                            title="Toggle cumulative inclusion"
                          >
                            <Star
                              size={16}
                              className={assessment.isCumulative ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenAssessmentGrading(assessment.id)}>
                              Grade
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenAssessmentAnalytics(assessment.id)}>
                              <BarChart3 size={14} className="mr-1" /> View Analytics
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleSubmitAssessmentForApproval(assessment.id)}
                              disabled={assessment.status === 'approved'}
                            >
                              Submit for Approval
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          ) : assessmentView === 'grading' && selectedAssessment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={handleBackToAssessmentList}>
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                <Badge variant={selectedAssessment.status as any}>{selectedAssessment.status}</Badge>
              </div>
              <Card title={`Grading Workspace - ${selectedAssessment.title}`}>
                <div className="space-y-3">
                  {gradeValidationError && (
                    <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
                      {gradeValidationError}
                    </div>
                  )}

                  {selectedClassStudents.map((student) => {
                    const studentRow = getScoresForAssessment(selectedAssessment.id)[student.id] || { score: null, feedback: '' };

                    return (
                      <div key={student.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border border-border rounded-lg">
                        <div className="md:col-span-2">
                          <p className="font-medium">{student.name}</p>
                        </div>
                        <div>
                          <input
                            type="number"
                            min={0}
                            max={selectedAssessment.totalMarks}
                            value={studentRow.score ?? ''}
                            disabled={selectedAssessment.status === 'approved'}
                            onChange={(e) => handleAssessmentScoreChange(selectedAssessment.id, student.id, e.target.value)}
                            className="w-full p-2 border border-border rounded-lg bg-input-background"
                            placeholder={`0-${selectedAssessment.totalMarks}`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={studentRow.feedback}
                            disabled={selectedAssessment.status === 'approved'}
                            onChange={(e) => handleAssessmentFeedbackChange(selectedAssessment.id, student.id, e.target.value)}
                            className="w-full p-2 border border-border rounded-lg bg-input-background"
                            placeholder="Feedback"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveAssessmentGrades}
                      disabled={selectedAssessment.status === 'approved'}
                    >
                      Save Grades
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSubmitAssessmentForApproval(selectedAssessment.id)}
                      disabled={selectedAssessment.status === 'approved'}
                    >
                      Submit for Approval
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : assessmentView === 'analytics' && selectedAssessment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={handleBackToAssessmentList}>
                  <ArrowLeft size={14} className="mr-1" /> Back
                </Button>
                <Badge variant="default">Result Summary</Badge>
              </div>
              <Card title={`Analytics - ${selectedAssessment.title}`}>
                {(() => {
                  const stats = getAssessmentAnalytics(selectedAssessment);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="p-4 border border-border rounded-lg bg-accent/20">
                        <p className="text-sm text-muted-foreground">Class Average</p>
                        <p className="text-xl mt-1">{stats.average}</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg bg-accent/20">
                        <p className="text-sm text-muted-foreground">Highest Score</p>
                        <p className="text-xl mt-1">{stats.highest}</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg bg-accent/20">
                        <p className="text-sm text-muted-foreground">Lowest Score</p>
                        <p className="text-xl mt-1">{stats.lowest}</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg bg-accent/20">
                        <p className="text-sm text-muted-foreground">Pass Rate</p>
                        <p className="text-xl mt-1">{stats.passRate}%</p>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-accent/20">
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassFilterChange(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
              >
                <option value="">Select class</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
                disabled={!selectedClass}
              >
                <option value="">Select subject</option>
                {selectedClassSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedClass || !selectedSubject ? (
            <div className="p-10 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Select a Class and Subject to view performance analytics.
            </div>
          ) : (
            <>
              <Card title="Aggregated Subject Performance" action={<Badge variant="default">Cumulative Assessments</Badge>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 border border-border rounded-lg bg-accent/20">
                    <p className="text-sm text-muted-foreground">Class Average</p>
                    <p className="text-2xl mt-1">{classAverageFromCumulative === null ? 'N/A' : `${classAverageFromCumulative}%`}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-accent/20">
                    <p className="text-sm text-muted-foreground">Cumulative Count</p>
                    <p className="text-2xl mt-1">{cumulativeAssessments.length}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-accent/20">
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl mt-1">{selectedClassStudents.length}</p>
                  </div>
                </div>
              </Card>

              <Card title="Student Term Grades">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Calculated Term Grade</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClassStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          {calculatedTermGradeByStudent[student.id] === null
                            ? 'N/A'
                            : `${calculatedTermGradeByStudent[student.id]}%`}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setSelectedPerformanceStudentId(student.id)}>
                            <TrendingUp size={14} className="mr-1" /> View Trend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {selectedPerformanceStudent && (
                <Card title={`Performance Drill-down: ${selectedPerformanceStudent.name}`}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {selectedStudentTrend.length === 0 ? (
                        <div className="p-4 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                          No cumulative trend data available yet.
                        </div>
                      ) : (
                        selectedStudentTrend.map((item) => (
                          <div key={`${item.label}-${item.week}`} className="p-3 border border-border rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{new Date(item.week).toLocaleDateString()}</p>
                            </div>
                            <Badge variant="default">
                              {typeof item.score === 'number' ? `${item.score}/${item.totalMarks}` : 'No score'}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border border-border rounded-lg p-4 space-y-3">
                      <p className="font-medium">Monthly Update (Optional)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-2 text-sm text-muted-foreground">Month</label>
                          <select
                            value={narrativeMonth}
                            onChange={(e) => setNarrativeMonth(e.target.value)}
                            className="w-full p-2 border border-border rounded-lg bg-input-background"
                          >
                            <option value="2026-01">January 2026</option>
                            <option value="2026-02">February 2026</option>
                            <option value="2026-03">March 2026</option>
                            <option value="2026-04">April 2026</option>
                            <option value="2026-05">May 2026</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-2 text-sm text-muted-foreground">General Rating</label>
                          <select
                            value={narrativeRating}
                            onChange={(e) => setNarrativeRating(e.target.value as MonthlyRating)}
                            className="w-full p-2 border border-border rounded-lg bg-input-background"
                          >
                            <option>Exceeding Expectations</option>
                            <option>Meeting Expectations</option>
                            <option>Developing</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm text-muted-foreground">Performance Comment</label>
                        <textarea
                          value={narrativeComment}
                          onChange={(e) => setNarrativeComment(e.target.value)}
                          className="w-full p-3 border border-border rounded-lg bg-input-background"
                          rows={4}
                          placeholder="Add qualitative summary for this month..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="primary" onClick={handleSaveMonthlyNarrative}>
                          Save Monthly Update
                        </Button>
                      </div>

                      {selectedStudentNarratives.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {selectedStudentNarratives.map((entry) => (
                            <div key={entry.month} className="p-3 border border-border rounded-lg bg-accent/20">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-sm font-medium">{entry.month}</p>
                                <Badge variant="default">{entry.rating}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{entry.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="space-y-6">
          <Card
            title="Medications Due Today"
            action={
              <Badge variant="pending">{medicationsDue.length} Pending</Badge>
            }
          >
            <div className="space-y-3">
              {medicationsDue.map((med) => (
                <div key={med.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="text-blue-600" size={24} />
                    <div>
                      <p>{med.student} ({med.class})</p>
                      <p className="text-muted-foreground">{med.medication} - {med.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alert('Marked as deferred')}
                    >
                      Defer
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleMarkGiven(med)}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Mark Given
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Student Medical Records">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name or class..."
                  className="w-full p-3 pl-10 border border-border rounded-lg bg-input-background"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedMedicalStudent(student)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p>{student.name}</p>
                      <p className="text-muted-foreground">{student.class}</p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="default">{student.medications.length} Medications</Badge>
                        {student.allergies !== 'None' && (
                          <Badge variant="rejected">Allergies</Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'pickup' && (
        <div className="space-y-6 max-w-4xl">
          <Card title="Verify Pickup Code">
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Enter Pickup Code</label>
                <input
                  type="text"
                  value={pickupCode}
                  onChange={(e) => setPickupCode(e.target.value)}
                  className="w-full p-4 border border-border rounded-lg bg-input-background"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleVerifyPickup}
                disabled={pickupCode.length !== 6}
              >
                <Shield size={20} className="mr-2" />
                Verify Code
              </Button>
            </div>

            {verificationResult && (
              <div className={`mt-6 p-6 rounded-lg ${verificationResult.valid ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {verificationResult.valid ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-600 dark:text-green-300" size={24} />
                      <p className="text-green-800 dark:text-green-200">Valid Pickup Code</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-green-700 dark:text-green-300">Child</p>
                        <p className="text-green-900 dark:text-green-100">{verificationResult.child}</p>
                      </div>
                      <div>
                        <p className="text-green-700 dark:text-green-300">Class</p>
                        <p className="text-green-900 dark:text-green-100">{verificationResult.class}</p>
                      </div>
                      <div>
                        <p className="text-green-700 dark:text-green-300">Authorized By</p>
                        <p className="text-green-900 dark:text-green-100">{verificationResult.authorizedBy}</p>
                      </div>
                      <div>
                        <p className="text-green-700 dark:text-green-300">Expires At</p>
                        <p className="text-green-900 dark:text-green-100">{verificationResult.expiresAt}</p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleConfirmDeparture}
                    >
                      Confirm Departure
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-red-800 dark:text-red-200">{verificationResult.message}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Today's Departures">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3">Child</th>
                    <th className="text-left py-3">Class</th>
                    <th className="text-left py-3">Authorized By</th>
                    <th className="text-left py-3">Time</th>
                    <th className="text-left py-3">Verified By</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDepartures.map((departure) => (
                    <tr key={departure.id} className="border-b border-border">
                      <td className="py-3">{departure.child}</td>
                      <td className="py-3">{departure.class}</td>
                      <td className="py-3">{departure.authorizedBy}</td>
                      <td className="py-3">{departure.time}</td>
                      <td className="py-3">{departure.verifiedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Instructions">
            <div className="space-y-3 text-muted-foreground">
              <p>1. Ask the authorized person for the 6-digit pickup code</p>
              <p>2. Enter the code in the field above and click Verify</p>
              <p>3. Verify the child's identity matches the information displayed</p>
              <p>4. Click Confirm Departure to log the pickup</p>
              <p>5. The code will be invalidated immediately after confirmation</p>
            </div>
          </Card>
        </div>
      )}

      {selectedMedicalStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMedicalStudent(null)}
          title={`${selectedMedicalStudent.name} - Medical Record`}
          footer={
            <Button variant="outline" onClick={() => setSelectedMedicalStudent(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground">Class</p>
              <p>{selectedMedicalStudent.class}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-2">Allergies</p>
              <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  {selectedMedicalStudent.allergies}
                </p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-2">Medical Conditions</p>
              <div className="p-4 bg-accent rounded-lg">
                <p>{selectedMedicalStudent.conditions}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-2">Active Medications</p>
              <div className="space-y-3">
                {selectedMedicalStudent.medications.map((med: any, index: number) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p>{med.name}</p>
                        <p className="text-muted-foreground">{med.dosage}</p>
                      </div>
                      <Badge variant={med.active ? 'approved' : 'default'}>
                        {med.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {med.times.length > 0 && (
                      <div className="mt-2">
                        <p className="text-muted-foreground">Schedule:</p>
                        <div className="flex gap-2 mt-1">
                          {med.times.map((time: string, idx: number) => (
                            <Badge key={idx} variant="default">{time}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button variant="primary" className="w-full">
              View Fulfillment History
            </Button>
          </div>
        </Modal>
      )}

      {selectedMedication && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMedication(null)}
          title="Confirm Medication Administration"
          footer={
            <>
              <Button variant="outline" onClick={() => setSelectedMedication(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmMedication}>
                <CheckCircle size={16} className="mr-2" />
                Confirm
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground">Student</p>
              <p>{selectedMedication.student}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Medication</p>
              <p>{selectedMedication.medication}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Scheduled Time</p>
              <p>{selectedMedication.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Administration Time</p>
              <p>{new Date().toLocaleTimeString()}</p>
            </div>
            <div>
              <label className="block mb-2">Notes (optional)</label>
              <textarea
                className="w-full p-3 border border-border rounded-lg bg-input-background"
                rows={3}
                placeholder="Add any observations or notes..."
              />
            </div>
          </div>
        </Modal>
      )}

      {showNewSyllabusModal && (
        <Modal
          isOpen={true}
          onClose={closeSyllabusModal}
          title={currentSyllabusEntry ? 'Edit Syllabus Entry' : 'Create New Syllabus'}
          footer={
            <>
              <Button variant="outline" onClick={closeSyllabusModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSyllabusEntry}
                disabled={
                  !syllabusForm.className ||
                  !syllabusForm.subject ||
                  !syllabusForm.week ||
                  !syllabusForm.title.trim() ||
                    !syllabusForm.content.trim() ||
                  Number(syllabusForm.lessonNotes) < 0
                }
              >
                {currentSyllabusEntry ? 'Save Changes' : 'Create Syllabus'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Class</label>
              <select
                value={syllabusForm.className}
                onChange={(e) => {
                  setSyllabusForm((prev) => ({
                    ...prev,
                    className: e.target.value,
                    subject: '',
                  }));
                }}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
              >
                <option value="">Select class</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Subject</label>
              <select
                value={syllabusForm.subject}
                onChange={(e) => setSyllabusForm((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
                disabled={!syllabusForm.className}
              >
                <option value="">Select subject</option>
                {newSyllabusClassSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Week Number</label>
              <select
                value={syllabusForm.week}
                onChange={(e) => setSyllabusForm((prev) => ({ ...prev, week: e.target.value }))}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
              >
                <option value="">Select week</option>
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((weekNumber) => (
                  <option key={weekNumber} value={weekNumber}>Week {weekNumber}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Title</label>
              <input
                type="text"
                value={syllabusForm.title}
                onChange={(e) => setSyllabusForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-input-background"
                placeholder="e.g. Quadratic Functions"
              />
            </div>

            <div>
              <label className="block mb-2">Content</label>
              <textarea
                value={syllabusForm.content}
                onChange={(e) => setSyllabusForm((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full min-h-[120px] p-3 border border-border rounded-lg bg-input-background"
                placeholder="Write the week plan, objectives, and teaching focus here."
              />
            </div>

            <div>
              <label className="block mb-2">Lesson Note Count</label>
              <input
                type="number"
                min={0}
                value={syllabusForm.lessonNotes}
                onChange={(e) => setSyllabusForm((prev) => ({ ...prev, lessonNotes: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-input-background"
              />
            </div>
          </div>
        </Modal>
      )}

      {showLessonNoteModal && currentLessonNoteEntry && (
        <Modal
          isOpen={true}
          onClose={closeLessonNoteModal}
          title={currentLessonNoteEntry.noteStatus === 'approved' ? 'View Syllabus' : 'Create Syllabus'}
          footer={
            <>
              <Button variant="outline" onClick={closeLessonNoteModal}>
                Close
              </Button>
              <Button variant="primary" onClick={handleSaveLessonNote} disabled={!lessonNoteForm.content.trim()}>
                Save Syllabus Link
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-border bg-accent/20 text-sm">
              <p className="font-medium">{currentLessonNoteEntry.className} • {currentLessonNoteEntry.subject}</p>
              <p className="text-muted-foreground">Week {currentLessonNoteEntry.week} • {currentLessonNoteEntry.title}</p>
            </div>

            <div>
              <label className="block mb-2">Syllabus Content</label>
              <textarea
                value={lessonNoteForm.content}
                onChange={(e) => setLessonNoteForm({ content: e.target.value })}
                className="w-full min-h-[160px] p-3 border border-border rounded-lg bg-input-background"
                placeholder="Write the syllabus objectives, sequence, and teaching focus."
              />
            </div>

            <div>
              <label className="block mb-2">Link to Syllabus</label>
              <select
                value={currentLessonNoteSyllabusId}
                onChange={(e) => setCurrentLessonNoteSyllabusId(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
              >
                <option value="">Select approved syllabus</option>
                {approvedSyllabusOptionsForCurrentNote.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    Week {entry.week} - {entry.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}