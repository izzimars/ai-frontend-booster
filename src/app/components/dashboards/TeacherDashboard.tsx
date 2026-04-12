import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Switch } from '../ui/switch';
import { Skeleton } from '../ui/skeleton';
import { 
  BookOpen, Plus, FileText, ClipboardCheck, Activity,
  Clock, AlertCircle, CheckCircle, Search, Shield, Link2, Star, BarChart3, TrendingUp, ArrowLeft
} from 'lucide-react';
import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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

type LessonNoteCreateFormState = {
  className: string;
  subject: string;
  week: string;
  title: string;
  syllabusId: string;
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
type AssessmentStatus = 'draft' | 'submitted' | 'approved' | 'graded';
type GradebookStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
type GradeCategory = 'Homework' | 'Exercise' | 'Lab' | 'Test' | 'Exam';

type AcademicTermOption = {
  id: string;
  label: string;
};

type GradeScaleBand = {
  grade: string;
  minimum: number;
};

type GradeWeightingConfig = {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subject: string;
  termId: string;
  term: string;
  status: GradebookStatus;
  submittedAt: string | null;
  rejectionReason: string | null;
  categoryWeights: Record<GradeCategory, number>;
  assessmentMappings: Record<string, { category: GradeCategory; includeInCumulative: boolean }>;
  updatedAt: string;
};

type AssessmentEntry = {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subject: string;
  termId: string;
  term: string;
  title: string;
  type: AssessmentType;
  category: GradeCategory;
  totalMarks: number;
  dueDate: string;
  status: AssessmentStatus;
  isCumulative: boolean;
};

type AssessmentCreateFormState = {
  className: string;
  subject: string;
  title: string;
  totalMarks: string;
  type: AssessmentType;
  status: AssessmentStatus;
  isCumulative: boolean;
  dueDate: string;
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
    classId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819',
    className: 'Grade 10C',
    subjectId: 'mathematics',
    subject: 'Mathematics',
    termId: 'term-2',
    term: 'Second Term',
    title: 'Algebra Quiz 1',
    type: 'Quiz',
    category: 'Test',
    totalMarks: 20,
    dueDate: '2026-04-12',
    status: 'graded',
    isCumulative: true,
  },
  {
    id: 'asm-math-10c-test-1',
    classId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819',
    className: 'Grade 10C',
    subjectId: 'mathematics',
    subject: 'Mathematics',
    termId: 'term-2',
    term: 'Second Term',
    title: 'Linear Equations Test',
    type: 'Test',
    category: 'Test',
    totalMarks: 40,
    dueDate: '2026-04-20',
    status: 'graded',
    isCumulative: true,
  },
  {
    id: 'asm-python-11a-ass-1',
    classId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    className: 'Grade 11A',
    subjectId: 'python',
    subject: 'Python',
    termId: 'term-2',
    term: 'Second Term',
    title: 'Functions Assignment',
    type: 'Assignment',
    category: 'Homework',
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

const gradeCategories: GradeCategory[] = ['Homework', 'Exercise', 'Lab', 'Test', 'Exam'];

const academicTerms: AcademicTermOption[] = [
  { id: 'term-1', label: 'First Term' },
  { id: 'term-2', label: 'Second Term' },
  { id: 'term-3', label: 'Third Term' },
];

const globalSchoolSettings = {
  gradeScale: [
    { grade: 'A', minimum: 70 },
    { grade: 'B', minimum: 60 },
    { grade: 'C', minimum: 50 },
    { grade: 'D', minimum: 40 },
    { grade: 'F', minimum: 0 },
  ] as GradeScaleBand[],
};

const defaultGradeWeights: Record<GradeCategory, number> = {
  Homework: 20,
  Exercise: 0,
  Lab: 0,
  Test: 40,
  Exam: 40,
};

const gradeConfigStorageKey = 'teacher-dashboard:grade-weighting-configs';

const normalizeTextId = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const getSubjectId = (subject: string) => normalizeTextId(subject);

const getGradeConfigId = (classId: string, subjectId: string, termId: string) =>
  `grade-config-${classId}-${subjectId}-${termId}`;

const getGradeConfigKey = (classId: string, subjectId: string, termId: string) =>
  `${classId}::${subjectId}::${termId}`;

const getAcademicTermLabel = (termId: string) =>
  academicTerms.find((term) => term.id === termId)?.label || termId;

const getAcademicTermId = (termValue: string) =>
  academicTerms.find((term) => term.label === termValue)?.id || termValue;

const getClassMetaById = (classId: string) => teacherClasses.find((classItem) => classItem.id === classId) || null;

const getSubjectLabelFromId = (classId: string, subjectId: string) => {
  const classMeta = getClassMetaById(classId);
  const subject = classMeta?.subjects.find((item) => getSubjectId(item) === subjectId);
  return subject || subjectId;
};

const gradebookStatusToBadgeVariant = (status: GradebookStatus): 'draft' | 'pending' | 'approved' | 'rejected' => {
  if (status === 'submitted') return 'pending';
  return status;
};

const assessmentTypeToCategory: Record<AssessmentType, GradeCategory> = {
  Quiz: 'Test',
  Test: 'Test',
  Assignment: 'Homework',
  Exam: 'Exam',
};

const createEmptyAssessmentMappings = (assessments: AssessmentEntry[]) =>
  Object.fromEntries(
    assessments.map((assessment) => [
      assessment.id,
      {
        category: assessment.category || assessmentTypeToCategory[assessment.type],
        includeInCumulative: assessment.isCumulative,
      },
    ]),
  ) as GradeWeightingConfig['assessmentMappings'];

const buildDefaultGradeConfig = (
  classId: string,
  className: string,
  subjectId: string,
  subject: string,
  termId: string,
  term: string,
  assessments: AssessmentEntry[],
): GradeWeightingConfig => ({
  id: getGradeConfigId(classId, subjectId, termId),
  classId,
  className,
  subjectId,
  subject,
  termId,
  term,
  status: 'draft',
  submittedAt: null,
  rejectionReason: null,
  categoryWeights: { ...defaultGradeWeights },
  assessmentMappings: createEmptyAssessmentMappings(assessments),
  updatedAt: new Date().toISOString(),
});

const normalizeGradeWeightingConfig = (config: any): GradeWeightingConfig | null => {
  if (!config) return null;

  const classMeta = teacherClasses.find((classItem) => classItem.id === config.classId || classItem.name === config.className) || null;
  const classId = config.classId || classMeta?.id || '';
  const className = config.className || classMeta?.name || '';
  const subject = config.subject || config.subjectName || '';
  const subjectId = config.subjectId || getSubjectId(subject);
  const term = config.term || config.termName || '';
  const termId = config.termId || getAcademicTermId(term);

  if (!classId || !className || !subjectId || !subject || !termId || !term) return null;

  return {
    id: config.id || getGradeConfigId(classId, subjectId, termId),
    classId,
    className,
    subjectId,
    subject,
    termId,
    term,
    status: config.status || 'draft',
    submittedAt: config.submittedAt ?? null,
    rejectionReason: config.rejectionReason ?? null,
    categoryWeights: {
      ...defaultGradeWeights,
      ...(config.categoryWeights || {}),
    },
    assessmentMappings: config.assessmentMappings || {},
    updatedAt: config.updatedAt || new Date().toISOString(),
  };
};

const getLetterGrade = (average: number | null) => {
  if (average === null) return 'N/A';

  const matchedBand = globalSchoolSettings.gradeScale.find((band) => average >= band.minimum);
  return matchedBand?.grade || 'N/A';
};

const calculateAssessmentAverage = (
  assessments: AssessmentEntry[],
  studentId: string,
  config: GradeWeightingConfig,
  getScoresForAssessment: (assessmentId: string) => Record<string, { score: number | null; feedback: string }>,
) => {
  const activeAssessments = assessments.filter((assessment) => {
    const rule = config.assessmentMappings[assessment.id];
    return (rule?.includeInCumulative ?? assessment.isCumulative) && assessment.status === 'graded';
  });

  if (!activeAssessments.length) return null;

  let weightedSum = 0;
  let includedWeight = 0;

  gradeCategories.forEach((category) => {
    const categoryAssessments = activeAssessments.filter((assessment) => {
      const rule = config.assessmentMappings[assessment.id];
      return (rule?.category ?? assessment.category) === category;
    });

    if (!categoryAssessments.length) return;

    const studentScores = categoryAssessments
      .map((assessment) => {
        const score = getScoresForAssessment(assessment.id)[studentId]?.score;
        if (typeof score !== 'number' || assessment.totalMarks <= 0) return null;
        return (score / assessment.totalMarks) * 100;
      })
      .filter((score): score is number => score !== null);

    if (!studentScores.length) return;

    const categoryAverage = studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length;
    const categoryWeight = config.categoryWeights[category] || 0;

    if (categoryWeight <= 0) return;

    weightedSum += categoryAverage * categoryWeight;
    includedWeight += categoryWeight;
  });

  if (!includedWeight) return null;
  return Math.round((weightedSum / includedWeight) * 100) / 100;
};

type GenericEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  children: ReactNode;
};

function GenericEntryModal({
  isOpen,
  onClose,
  title,
  submitLabel,
  onSubmit,
  submitDisabled = false,
  children,
}: GenericEntryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}


export function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const gradeConfigurationTopRef = useRef<HTMLDivElement | null>(null);
  const emptySyllabusForm: SyllabusFormState = {
    className: '',
    subject: '',
    week: '',
    title: '',
    content: '',
    lessonNotes: '0',
  };
  const emptyLessonNoteCreateForm: LessonNoteCreateFormState = {
    className: '',
    subject: '',
    week: '',
    title: '',
    syllabusId: '',
  };
  const emptyAssessmentCreateForm: AssessmentCreateFormState = {
    className: '',
    subject: '',
    title: '',
    totalMarks: '',
    type: 'Test',
    status: 'draft',
    isCumulative: true,
    dueDate: new Date().toISOString().slice(0, 10),
  };

  const [activeTab, setActiveTab] = useState<'todays_classes' | 'class' | 'syllabus' | 'lesson_notes' | 'assessment' | 'grade_configuration' | 'performance' | 'medical' | 'pickup'>('todays_classes');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('2025/2026 Term 2');
  const [selectedGradeClassId, setSelectedGradeClassId] = useState(() => teacherClasses[0]?.id || '');
  const [selectedGradeSubjectId, setSelectedGradeSubjectId] = useState(() => getSubjectId(teacherClasses[0]?.subjects[0] || ''));
  const [selectedGradeTermId, setSelectedGradeTermId] = useState('term-2');
  const [gradeContextLoading, setGradeContextLoading] = useState(true);
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
  const [showCreateLessonNoteModal, setShowCreateLessonNoteModal] = useState(false);
  const [lessonNoteCreateForm, setLessonNoteCreateForm] = useState<LessonNoteCreateFormState>(emptyLessonNoteCreateForm);
  const [focusedLessonNoteId, setFocusedLessonNoteId] = useState<string | null>(null);
  const [lessonNotesByContext, setLessonNotesByContext] = useState<LessonNoteEntry[]>(() => loadStoredArray('teacher-dashboard:lesson-notes', initialLessonNotesByContext));
  const [assessments, setAssessments] = useState<AssessmentEntry[]>(initialAssessments);
  const [assessmentView, setAssessmentView] = useState<'list' | 'grading' | 'analytics'>('list');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState<AssessmentCreateFormState>(emptyAssessmentCreateForm);
  const [gradeWeightingConfigs, setGradeWeightingConfigs] = useState<GradeWeightingConfig[]>(() =>
    loadStoredArray(gradeConfigStorageKey, []).map(normalizeGradeWeightingConfig).filter((config): config is GradeWeightingConfig => Boolean(config)),
  );
  const [gradeConfigDraft, setGradeConfigDraft] = useState<GradeWeightingConfig | null>(null);
  const [assessmentGrades, setAssessmentGrades] = useState<Record<string, Record<string, { score: number | null; feedback: string }>>>(() => {
    const seeded: Record<string, Record<string, { score: number | null; feedback: string }>> = {};

    initialAssessments.forEach((assessment) => {
      const students = studentsByClassName[assessment.className] || [];
      seeded[assessment.id] = Object.fromEntries(
        students.map((student, index) => [
          student.id,
          {
            score: assessment.status === 'approved' || assessment.status === 'graded' ? Math.round(assessment.totalMarks * (0.55 + index * 0.1)) : null,
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
  const selectedGradeClassMeta = teacherClasses.find((classItem) => classItem.id === selectedGradeClassId) || null;
  const selectedGradeSubjectLabel = selectedGradeClassMeta?.subjects.find((subject) => getSubjectId(subject) === selectedGradeSubjectId) || '';
  const selectedGradeTerm = academicTerms.find((term) => term.id === selectedGradeTermId) || academicTerms[0];
  const gradeSubjectOptions = teacherClasses.flatMap((classItem) =>
    classItem.subjects.map((subject) => ({
      classId: classItem.id,
      className: classItem.name,
      subjectId: getSubjectId(subject),
      subject,
      label: `${classItem.name} • ${subject}`,
    })),
  );
  const selectedGradeOption = gradeSubjectOptions.find(
    (option) => option.classId === selectedGradeClassId && option.subjectId === selectedGradeSubjectId,
  ) || null;
  const selectedGradeClassStudents = selectedGradeClassMeta ? studentsByClassName[selectedGradeClassMeta.name] || [] : [];
  const filteredAssessments = assessments.filter(
    (assessment) => assessment.classId === selectedGradeClassId && assessment.subjectId === selectedGradeSubjectId && assessment.termId === selectedGradeTermId,
  );
  const gradedAssessments = filteredAssessments.filter((assessment) => assessment.status === 'graded');
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
    const lessonNoteCreateSubjects = teacherClasses.find((classItem) => classItem.name === lessonNoteCreateForm.className)?.subjects || [];
    const approvedSyllabusOptionsForNewLessonNote = lessonNoteCreateForm.className && lessonNoteCreateForm.subject
      ? syllabusWeeks.filter(
          (week) =>
            week.status === 'approved' &&
            week.className === lessonNoteCreateForm.className &&
            week.subject === lessonNoteCreateForm.subject,
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

  const selectedGradeConfig = useMemo(() => {
    if (!selectedGradeClassId || !selectedGradeSubjectId || !selectedGradeTermId) return null;

    return gradeWeightingConfigs.find(
      (config) => config.classId === selectedGradeClassId && config.subjectId === selectedGradeSubjectId && config.termId === selectedGradeTermId,
    ) || null;
  }, [gradeWeightingConfigs, selectedGradeClassId, selectedGradeSubjectId, selectedGradeTermId]);

  const gradebookStatus = gradeConfigDraft?.status || selectedGradeConfig?.status || 'draft';
  const isGradebookLocked = gradebookStatus !== 'draft';
  const gradebookBadgeVariant = gradebookStatusToBadgeVariant(gradebookStatus);

  const gradeConfigRows = useMemo(() => {
    const config = gradeConfigDraft || selectedGradeConfig || buildDefaultGradeConfig(
      selectedGradeClassId,
      selectedGradeClassMeta?.name || '',
      selectedGradeSubjectId,
      selectedGradeSubjectLabel,
      selectedGradeTermId,
      selectedGradeTerm.label,
      gradedAssessments,
    );

    return gradedAssessments.map((assessment) => {
      const mappedRule = config.assessmentMappings[assessment.id];
      return {
        ...assessment,
        category: mappedRule?.category ?? assessment.category,
        includeInCumulative: mappedRule?.includeInCumulative ?? assessment.isCumulative,
      };
    });
  }, [gradeConfigDraft, gradedAssessments, selectedGradeClassId, selectedGradeClassMeta?.name, selectedGradeConfig, selectedGradeSubjectId, selectedGradeSubjectLabel, selectedGradeTerm.label, selectedGradeTermId]);

  const gradeConfigTotalWeight = useMemo(() => {
    const config = gradeConfigDraft || selectedGradeConfig || buildDefaultGradeConfig(
      selectedGradeClassId,
      selectedGradeClassMeta?.name || '',
      selectedGradeSubjectId,
      selectedGradeSubjectLabel,
      selectedGradeTermId,
      selectedGradeTerm.label,
      gradedAssessments,
    );
    return gradeCategories.reduce((sum, category) => sum + (Number(config.categoryWeights[category]) || 0), 0);
  }, [gradeConfigDraft, gradedAssessments, selectedGradeClassId, selectedGradeClassMeta?.name, selectedGradeConfig, selectedGradeSubjectId, selectedGradeSubjectLabel, selectedGradeTerm.label, selectedGradeTermId]);

  const classGradePreviewRows = useMemo(() => {
    const config = gradeConfigDraft || selectedGradeConfig || buildDefaultGradeConfig(
      selectedGradeClassId,
      selectedGradeClassMeta?.name || '',
      selectedGradeSubjectId,
      selectedGradeSubjectLabel,
      selectedGradeTermId,
      selectedGradeTerm.label,
      gradedAssessments,
    );

    return selectedGradeClassStudents.map((student) => {
      const weightedAverage = calculateAssessmentAverage(
        gradeConfigRows,
        student.id,
        config,
        getScoresForAssessment,
      );

      return {
        id: student.id,
        name: student.name,
        weightedAverage,
        letterGrade: getLetterGrade(weightedAverage),
      };
    });
  }, [gradeConfigDraft, gradeConfigRows, gradedAssessments, selectedGradeClassStudents, selectedGradeClassId, selectedGradeClassMeta?.name, selectedGradeConfig, selectedGradeSubjectId, selectedGradeSubjectLabel, selectedGradeTerm.label, selectedGradeTermId]);

  const selectedGradeConfigSaved = Boolean(selectedGradeConfig);

  const teacherGradebookCombinations = useMemo(
    () =>
      teacherClasses.flatMap((classItem) =>
        classItem.subjects.map((subject) => ({
          classId: classItem.id,
          className: classItem.name,
          subjectId: getSubjectId(subject),
          subject,
          configKey: getGradeConfigKey(classItem.id, getSubjectId(subject), selectedGradeTermId),
        })),
      ),
    [selectedGradeTermId],
  );

  const gradebookSubmissionRows = useMemo(
    () =>
      teacherGradebookCombinations.map((combo) => {
        const matchingConfig = gradeWeightingConfigs.find(
          (config) =>
            config.classId === combo.classId &&
            config.subjectId === combo.subjectId &&
            config.termId === selectedGradeTermId,
        );

        return {
          ...combo,
          config: matchingConfig || null,
          status: (matchingConfig?.status || 'draft') as GradebookStatus,
          submissionDate: matchingConfig?.submittedAt || null,
          adminFeedback: matchingConfig?.rejectionReason || '',
        };
      }),
    [gradeWeightingConfigs, selectedGradeTermId, teacherGradebookCombinations],
  );

  const hasStartedGradebooksForTerm = useMemo(
    () => gradebookSubmissionRows.some((row) => row.config),
    [gradebookSubmissionRows],
  );

  useEffect(() => {
    if (!teacherClasses.length) return;

    if (!selectedGradeClassId || !teacherClasses.some((classItem) => classItem.id === selectedGradeClassId)) {
      const firstClass = teacherClasses[0];
      setSelectedGradeClassId(firstClass.id);
      setSelectedGradeSubjectId(getSubjectId(firstClass.subjects[0] || ''));
      return;
    }

    if (!selectedGradeSubjectId || !selectedGradeClassMeta?.subjects.some((subject) => getSubjectId(subject) === selectedGradeSubjectId)) {
      setSelectedGradeSubjectId(getSubjectId(selectedGradeClassMeta?.subjects[0] || ''));
    }
  }, [selectedGradeClassId, selectedGradeClassMeta, selectedGradeSubjectId]);

  useEffect(() => {
    setGradeContextLoading(true);
    const loadingTimer = window.setTimeout(() => setGradeContextLoading(false), 180);
    return () => window.clearTimeout(loadingTimer);
  }, [selectedGradeClassId, selectedGradeSubjectId, selectedGradeTermId]);

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
    if (location.state || selectedClass || !teacherClasses.length) return;

    const firstClass = teacherClasses[0];
    setSelectedClass(firstClass.name);
    setSelectedSubject(firstClass.subjects[0] || '');
  }, [location.state, selectedClass]);

  useEffect(() => {
    if (!selectedClass || selectedSubject || !selectedClassSubjects.length) return;

    setSelectedSubject(selectedClassSubjects[0]);
  }, [selectedClass, selectedClassSubjects, selectedSubject]);

  useEffect(() => {
    if (!selectedGradeClassId || !selectedGradeSubjectId || !selectedGradeTermId) {
      setGradeConfigDraft(null);
      return;
    }

    const existingConfig = gradeWeightingConfigs.find(
      (config) => config.classId === selectedGradeClassId && config.subjectId === selectedGradeSubjectId && config.termId === selectedGradeTermId,
    );

    if (existingConfig) {
      const selectedConfigRows = assessments
        .filter((assessment) => assessment.classId === selectedGradeClassId && assessment.subjectId === selectedGradeSubjectId && assessment.termId === selectedGradeTermId && assessment.status === 'graded')
        .map((assessment) => ({
          ...assessment,
          category: existingConfig.assessmentMappings[assessment.id]?.category ?? assessment.category,
          isCumulative: existingConfig.assessmentMappings[assessment.id]?.includeInCumulative ?? assessment.isCumulative,
        }));

      setGradeConfigDraft({
        ...existingConfig,
        assessmentMappings: createEmptyAssessmentMappings(selectedConfigRows.length ? selectedConfigRows : gradedAssessments),
      });
      return;
    }

    setGradeConfigDraft(buildDefaultGradeConfig(
      selectedGradeClassId,
      selectedGradeClassMeta?.name || '',
      selectedGradeSubjectId,
      selectedGradeSubjectLabel,
      selectedGradeTermId,
      selectedGradeTerm.label,
      gradedAssessments,
    ));
  }, [gradeWeightingConfigs, assessments, gradedAssessments, selectedGradeClassId, selectedGradeClassMeta?.name, selectedGradeSubjectId, selectedGradeSubjectLabel, selectedGradeTerm.label, selectedGradeTermId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(gradeConfigStorageKey, JSON.stringify(gradeWeightingConfigs));
  }, [gradeWeightingConfigs]);

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
    const nextSubjects = teacherClasses.find((classItem) => classItem.name === className)?.subjects || [];
    setSelectedSubject(nextSubjects[0] || '');
  };

  const handleGradeContextChange = (value: string) => {
    const [classId, subjectId] = value.split('::');
    if (!classId || !subjectId) return;

    setSelectedGradeClassId(classId);
    setSelectedGradeSubjectId(subjectId);
  };

  const handleGradeTermChange = (termId: string) => {
    setSelectedGradeTermId(termId);
  };

  const handleViewEditGradebook = (classId: string, subjectId: string) => {
    setSelectedGradeClassId(classId);
    setSelectedGradeSubjectId(subjectId);
    gradeConfigurationTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDownloadGradebookReport = (config: GradeWeightingConfig) => {
    const configAssessments = assessments
      .filter(
        (assessment) =>
          assessment.classId === config.classId &&
          assessment.subjectId === config.subjectId &&
          assessment.termId === config.termId &&
          assessment.status === 'graded',
      )
      .map((assessment) => {
        const mapping = config.assessmentMappings[assessment.id];
        return {
          ...assessment,
          category: mapping?.category ?? assessment.category,
          isCumulative: mapping?.includeInCumulative ?? assessment.isCumulative,
        };
      });

    const students = studentsByClassName[config.className] || [];
    const reportRows = students.map((student) => {
      const weightedAverage = calculateAssessmentAverage(
        configAssessments,
        student.id,
        config,
        getScoresForAssessment,
      );
      const letter = getLetterGrade(weightedAverage);
      return `<tr><td style="padding:8px;border:1px solid #ddd;">${student.name}</td><td style="padding:8px;border:1px solid #ddd;">${weightedAverage === null ? 'N/A' : `${weightedAverage}%`}</td><td style="padding:8px;border:1px solid #ddd;">${letter}</td></tr>`;
    });

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    reportWindow.document.write(`
      <html>
        <head><title>Gradebook Report - ${config.subject} ${config.className}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Gradebook Report</h2>
          <p><strong>Class:</strong> ${config.className}</p>
          <p><strong>Subject:</strong> ${config.subject}</p>
          <p><strong>Term:</strong> ${config.term}</p>
          <p><strong>Status:</strong> ${config.status}</p>
          <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Student</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Weighted Average</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Letter Grade</th>
              </tr>
            </thead>
            <tbody>${reportRows.join('')}</tbody>
          </table>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const isGradeConfigEditable = gradebookStatus === 'draft';

  const commitGradeConfig = (nextConfig: GradeWeightingConfig) => {
    setGradeConfigDraft(nextConfig);
    setGradeWeightingConfigs((prev) => {
      const otherConfigs = prev.filter(
        (config) => getGradeConfigKey(config.classId, config.subjectId, config.termId) !== getGradeConfigKey(nextConfig.classId, nextConfig.subjectId, nextConfig.termId),
      );

      return [...otherConfigs, nextConfig];
    });
  };

  const updateGradeConfigCategoryWeight = (category: GradeCategory, value: string) => {
    if (!isGradeConfigEditable) return;

    const nextWeight = Math.max(0, Math.min(100, Number(value) || 0));

    setGradeConfigDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        categoryWeights: {
          ...current.categoryWeights,
          [category]: nextWeight,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateGradeConfigAssessment = (assessmentId: string, patch: Partial<{ category: GradeCategory; includeInCumulative: boolean }>) => {
    if (!isGradeConfigEditable) return;

    setGradeConfigDraft((current) => {
      if (!current) return current;

      const existingAssessment = assessments.find((assessment) => assessment.id === assessmentId);
      const currentMapping = current.assessmentMappings[assessmentId] || {
        category: existingAssessment?.category || assessmentTypeToCategory[existingAssessment?.type || 'Test'],
        includeInCumulative: existingAssessment?.isCumulative ?? true,
      };

      return {
        ...current,
        assessmentMappings: {
          ...current.assessmentMappings,
          [assessmentId]: {
            ...currentMapping,
            ...patch,
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });

    if (patch.category || typeof patch.includeInCumulative === 'boolean') {
      setAssessments((prev) =>
        prev.map((assessment) =>
          assessment.id === assessmentId
            ? {
                ...assessment,
                category: patch.category ?? assessment.category,
                isCumulative: patch.includeInCumulative ?? assessment.isCumulative,
              }
            : assessment,
        ),
      );
    }
  };

  const handleSaveGradeConfig = () => {
    if (!gradeConfigDraft || !isGradeConfigEditable) return;

    if (gradeConfigTotalWeight !== 100) {
      alert('The category weights must total exactly 100% before saving.');
      return;
    }

    const nextConfig: GradeWeightingConfig = {
      ...gradeConfigDraft,
      updatedAt: new Date().toISOString(),
    };

    commitGradeConfig(nextConfig);

    alert('Grade configuration saved successfully.');
  };

  const handleSubmitGradeConfigForApproval = () => {
    if (!gradeConfigDraft || gradeConfigTotalWeight !== 100 || !isGradeConfigEditable) return;

    const nextConfig: GradeWeightingConfig = {
      ...gradeConfigDraft,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    commitGradeConfig(nextConfig);
    alert('Grade configuration submitted for approval.');
  };

  const handleRevertGradeConfigToDraft = () => {
    if (!gradeConfigDraft || gradebookStatus !== 'rejected') return;

    const nextConfig: GradeWeightingConfig = {
      ...gradeConfigDraft,
      status: 'draft',
      rejectionReason: null,
      updatedAt: new Date().toISOString(),
    };

    commitGradeConfig(nextConfig);
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

  const openLessonNoteCreateModal = () => {
    setLessonNoteCreateForm({
      ...emptyLessonNoteCreateForm,
      className: selectedClass,
      subject: selectedSubject,
    });
    setShowCreateLessonNoteModal(true);
  };

  const closeLessonNoteCreateModal = () => {
    setShowCreateLessonNoteModal(false);
    setLessonNoteCreateForm(emptyLessonNoteCreateForm);
  };

  const openAssessmentCreateModal = () => {
    setAssessmentForm({
      ...emptyAssessmentCreateForm,
      className: selectedClass,
      subject: selectedSubject,
    });
    setShowAssessmentModal(true);
  };

  const closeAssessmentModal = () => {
    setShowAssessmentModal(false);
    setAssessmentForm(emptyAssessmentCreateForm);
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

  const handleCreateLessonNote = () => {
    if (
      !lessonNoteCreateForm.className ||
      !lessonNoteCreateForm.subject ||
      !lessonNoteCreateForm.week ||
      !lessonNoteCreateForm.title.trim() ||
      !lessonNoteCreateForm.syllabusId
    ) {
      return;
    }

    const linkedSyllabus = syllabusWeeks.find((week) => week.id === lessonNoteCreateForm.syllabusId && week.status === 'approved') || null;
    if (!linkedSyllabus) return;

    const newLessonNote: LessonNoteEntry = {
      id: createDashboardId('ln'),
      syllabusId: linkedSyllabus.id,
      createdBy: currentTeacherId,
      className: lessonNoteCreateForm.className,
      subject: lessonNoteCreateForm.subject,
      week: Number(lessonNoteCreateForm.week),
      title: lessonNoteCreateForm.title.trim(),
      content: linkedSyllabus.content || lessonNoteCreateForm.title.trim(),
      noteStatus: 'draft',
      questions: [],
    };

    setLessonNotesByContext((prev) => [...prev, newLessonNote]);
    setSyllabusWeeks((prev) =>
      prev.map((week) =>
        week.id === linkedSyllabus.id
          ? {
              ...week,
              lessonNoteId: newLessonNote.id,
              lessonNotes: (week.lessonNotes || 0) + 1,
            }
          : week,
      ),
    );

    setSelectedClass(newLessonNote.className);
    setSelectedSubject(newLessonNote.subject);
    setActiveTab('lesson_notes');
    setFocusedLessonNoteId(newLessonNote.id);
    closeLessonNoteCreateModal();
    navigate(`/teaching-console/lesson-editor/${newLessonNote.id}`, {
      state: {
        selectedClass: newLessonNote.className,
        selectedSubject: newLessonNote.subject,
        note: newLessonNote,
        syllabusId: linkedSyllabus.id,
      },
    });
  };

  const handleCreateAssessment = () => {
    if (
      !assessmentForm.className ||
      !assessmentForm.subject ||
      !assessmentForm.title.trim() ||
      !assessmentForm.totalMarks.trim() ||
      !assessmentForm.dueDate
    ) {
      return;
    }

    const totalMarks = Number(assessmentForm.totalMarks);
    if (Number.isNaN(totalMarks) || totalMarks <= 0) return;

    const classMeta = teacherClasses.find((classItem) => classItem.name === assessmentForm.className) || null;
    const termMeta = academicTerms.find((term) => term.id === selectedGradeTermId) || academicTerms[0];

    const newAssessment: AssessmentEntry = {
      id: createDashboardId('asm'),
      classId: classMeta?.id || '',
      className: assessmentForm.className,
      subjectId: getSubjectId(assessmentForm.subject),
      subject: assessmentForm.subject,
      termId: termMeta.id,
      term: termMeta.label,
      title: assessmentForm.title.trim(),
      type: assessmentForm.type,
      category: assessmentTypeToCategory[assessmentForm.type],
      totalMarks,
      dueDate: assessmentForm.dueDate,
      status: assessmentForm.status,
      isCumulative: assessmentForm.isCumulative,
    };

    setAssessments((prev) => [...prev, newAssessment]);
    setAssessmentGrades((prev) => ({
      ...prev,
      [newAssessment.id]: Object.fromEntries(
        (studentsByClassName[newAssessment.className] || []).map((student) => [
          student.id,
          { score: null, feedback: '' },
        ]),
      ),
    }));
    setAssessmentView('list');
    setSelectedAssessmentId(null);
    closeAssessmentModal();
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

    setAssessments((prev) =>
      prev.map((assessment) =>
        assessment.id === selectedAssessment.id
          ? {
              ...assessment,
              status: 'graded',
            }
          : assessment,
      ),
    );

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

  const handleCreateFirstAssessment = openAssessmentCreateModal;

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
        <button onClick={() => setActiveTab('grade_configuration')} className={`px-4 py-2 ${activeTab === 'grade_configuration' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
          Grade Configuration &amp; Cumulative
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
        <Card
          title="Lesson Notes"
          action={
            <Button size="sm" variant="primary" onClick={openLessonNoteCreateModal}>
              <Plus size={16} className="mr-2" />Add New
            </Button>
          }
        >
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

            {!selectedClass || !selectedSubject || filteredLessonNotes.length === 0 ? (
              <div className="min-h-[260px] flex flex-col items-center justify-center gap-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">No lesson notes to display</p>
                  <p className="text-sm">Select a class and subject, or create a new lesson note.</p>
                </div>
                <Button size="sm" variant="primary" onClick={openLessonNoteCreateModal}>
                  <Plus size={14} className="mr-2" />Add New
                </Button>
              </div>
            ) : (
              <>
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

                        return (
                          <Fragment key={note.id}>
                            <tr
                              id={`lesson-note-row-${note.id}`}
                              key={note.id}
                              onClick={() => {
                                navigate(`/teaching-console/lesson-editor/${note.id}?className=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}`, {
                                  state: { selectedClass, selectedSubject, note },
                                });
                              }}
                              className={`border-b border-border cursor-pointer hover:bg-accent/40 ${focusedLessonNoteId === note.id ? 'bg-accent/30' : ''}`}
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
              </>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'assessment' && (
        <Card
          title="Assessment"
          action={
            <Button size="sm" variant="primary" onClick={openAssessmentCreateModal}>
              <Plus size={16} className="mr-2" />Add New
            </Button>
          }
        >
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

            {!selectedClass || !selectedSubject || (assessmentView === 'list' && filteredAssessments.length === 0) ? (
              <div className="min-h-[260px] flex flex-col items-center justify-center gap-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">No assessments to display</p>
                  <p className="text-sm">Select a class and subject, or add a new assessment.</p>
                </div>
                <Button size="sm" variant="primary" onClick={openAssessmentCreateModal}>
                  <Plus size={14} className="mr-2" />Add New
                </Button>
              </div>
            ) : assessmentView === 'list' ? (
              <Card title="Assessment Management" action={<Badge variant="default">{filteredAssessments.length} total</Badge>}>
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
        </Card>
      )}

      {activeTab === 'grade_configuration' && (
        <div className="space-y-6">
          <div ref={gradeConfigurationTopRef} />
          <Card
            title="Grade Configuration & Cumulative"
            action={
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Badge variant={gradebookBadgeVariant}>
                  {gradebookStatus.charAt(0).toUpperCase() + gradebookStatus.slice(1)}
                </Badge>
                <Badge variant={gradeConfigTotalWeight === 100 ? 'approved' : 'rejected'}>
                  {gradeConfigTotalWeight}% Total
                </Badge>
                <Badge variant={selectedGradeConfigSaved ? 'approved' : 'pending'}>
                  {selectedGradeConfigSaved ? 'Saved Config' : 'Draft Config'}
                </Badge>
                <Button size="sm" variant="primary" onClick={handleSubmitGradeConfigForApproval} disabled={!gradeConfigDraft || gradeConfigTotalWeight !== 100 || !isGradeConfigEditable}>
                  Submit for Approval
                </Button>
                {gradebookStatus === 'rejected' && (
                  <Button size="sm" variant="outline" onClick={handleRevertGradeConfigToDraft}>
                    Revert to Draft
                  </Button>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3 p-4 border border-border rounded-lg bg-accent/20">
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Academic Term</label>
                <select
                  value={selectedGradeTermId}
                  onChange={(e) => handleGradeTermChange(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  {academicTerms.map((term) => (
                    <option key={term.id} value={term.id}>{term.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Subject</label>
                <select
                  value={`${selectedGradeClassId}::${selectedGradeSubjectId}`}
                  onChange={(e) => handleGradeContextChange(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  {gradeSubjectOptions.map((option) => (
                    <option key={`${option.classId}:${option.subjectId}`} value={`${option.classId}::${option.subjectId}`}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>Context: {selectedGradeOption?.label || 'No context selected'}</span>
              <span>•</span>
              <span>Term: {selectedGradeTerm.label}</span>
            </div>
          </Card>

          {gradeContextLoading ? (
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
              <Card title="Assessment Context">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
              <Card title="Cumulative Preview">
                <div className="space-y-3">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            </div>
          ) : !selectedGradeOption ? (
            <div className="p-10 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Select a subject context to configure category weights and cumulative grading.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
              <div className="space-y-6">
                <Card title={`Graded Assessments (${gradeConfigRows.length})`}>
                  {gradeConfigRows.length === 0 ? (
                    <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                      No graded assessments exist for this class and subject yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-accent/20 text-xs uppercase text-muted-foreground">
                            <th className="py-3 px-4 text-left">Assessment</th>
                            <th className="py-3 px-4 text-left">Marks</th>
                            <th className="py-3 px-4 text-left">Category</th>
                            <th className="py-3 px-4 text-left">Include in Cumulative</th>
                            <th className="py-3 px-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gradeConfigRows.map((assessment) => (
                            <tr key={assessment.id} className="border-b border-border">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium">{assessment.title}</p>
                                  <p className="text-xs text-muted-foreground">{assessment.type}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">{assessment.totalMarks}</td>
                              <td className="py-3 px-4">
                                <select
                                  value={assessment.category}
                                  onChange={(e) => updateGradeConfigAssessment(assessment.id, { category: e.target.value as GradeCategory })}
                                  disabled={isGradebookLocked}
                                  className="w-full max-w-[180px] p-2 border border-border rounded-lg bg-input-background"
                                >
                                  {gradeCategories.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={assessment.includeInCumulative}
                                    onCheckedChange={(checked) => updateGradeConfigAssessment(assessment.id, { includeInCumulative: checked })}
                                    disabled={isGradebookLocked}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {assessment.includeInCumulative ? 'Included' : 'Excluded'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={assessment.status === 'graded' ? 'graded' : assessment.status === 'approved' ? 'approved' : 'default'}>{assessment.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                <Card title="Gradebook Submission Tracking">
                  {!hasStartedGradebooksForTerm ? (
                    <div className="p-6 border border-dashed border-border rounded-lg text-sm text-muted-foreground text-center">
                      No gradebooks submitted yet. Complete your weighting configuration above to begin.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-accent/20 text-xs uppercase text-muted-foreground">
                            <th className="py-3 px-4 text-left">Subject &amp; Class</th>
                            <th className="py-3 px-4 text-left">Submission Date</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Admin Feedback</th>
                            <th className="py-3 px-4 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gradebookSubmissionRows.map((row) => (
                            <tr key={row.configKey} className="border-b border-border">
                              <td className="py-3 px-4">
                                <p className="font-medium">{row.subject} - {row.className}</p>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {row.submissionDate ? new Date(row.submissionDate).toLocaleString() : 'Not submitted'}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={gradebookStatusToBadgeVariant(row.status)}>
                                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                {row.status === 'rejected' && row.adminFeedback ? (
                                  <button
                                    type="button"
                                    title={row.adminFeedback}
                                    className="inline-flex items-center gap-1 text-destructive"
                                  >
                                    <AlertCircle size={14} />
                                    <span className="text-xs">View feedback</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No feedback</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {row.status === 'approved' && row.config ? (
                                  <Button size="sm" variant="outline" onClick={() => handleDownloadGradebookReport(row.config as GradeWeightingConfig)}>
                                    Download PDF Report
                                  </Button>
                                ) : row.status === 'draft' || row.status === 'rejected' ? (
                                  <Button size="sm" variant="outline" onClick={() => handleViewEditGradebook(row.classId, row.subjectId)}>
                                    View/Edit
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Awaiting review</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="Weighting Summary" action={<Badge variant={gradeConfigTotalWeight === 100 ? 'approved' : 'rejected'}>{gradeConfigTotalWeight}%</Badge>}>
                  {gradeConfigDraft ? (
                    <div className="space-y-4">
                      {gradeCategories.map((category) => (
                        <div key={category} className="flex items-center gap-3">
                          <div className="w-24 shrink-0 text-sm font-medium">{category}</div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={gradeConfigDraft.categoryWeights[category]}
                            onChange={(e) => updateGradeConfigCategoryWeight(category, e.target.value)}
                            disabled={isGradebookLocked}
                            className="w-full p-2 border border-border rounded-lg bg-input-background"
                          />
                          <div className="w-12 text-right text-sm text-muted-foreground">%</div>
                        </div>
                      ))}

                      <div className={`p-3 rounded-lg border text-sm ${gradeConfigTotalWeight === 100 ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200' : 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'}`}>
                        {gradeConfigTotalWeight === 100
                          ? 'The category weights are balanced and ready to save.'
                          : `Weights must total 100%. Current total is ${gradeConfigTotalWeight}%.`}
                      </div>

                      <Button size="sm" variant="primary" className="w-full" onClick={handleSaveGradeConfig} disabled={gradeConfigTotalWeight !== 100 || !isGradeConfigEditable}>
                        Save Draft Configuration
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Select a class and subject to start configuring category weights.</div>
                  )}
                </Card>

                <Card title="Cumulative Preview" action={<Badge variant={gradebookBadgeVariant}>{gradebookStatus}</Badge>}>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border p-3 bg-accent/20 text-sm">
                      <p className="font-medium mb-2">Admin Grade Scale</p>
                      <div className="flex flex-wrap gap-2">
                        {globalSchoolSettings.gradeScale.map((band) => (
                          <Badge key={band.grade} variant="default">
                            {band.grade} = {band.minimum}+
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {classGradePreviewRows.length === 0 ? (
                      <div className="p-4 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                        No students available for this class.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Weighted Average</TableHead>
                            <TableHead>Letter Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classGradePreviewRows.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.weightedAverage === null ? 'N/A' : `${student.weightedAverage}%`}</TableCell>
                              <TableCell>
                                <Badge variant={student.letterGrade === 'A' || student.letterGrade === 'B' ? 'approved' : student.letterGrade === 'N/A' ? 'default' : 'graded'}>
                                  {student.letterGrade}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
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

      {showCreateLessonNoteModal && (
        <GenericEntryModal
          isOpen={true}
          onClose={closeLessonNoteCreateModal}
          title="Add Lesson Note"
          submitLabel="Create Lesson Note"
          onSubmit={handleCreateLessonNote}
          submitDisabled={
            !lessonNoteCreateForm.className ||
            !lessonNoteCreateForm.subject ||
            !lessonNoteCreateForm.week ||
            !lessonNoteCreateForm.title.trim() ||
            !lessonNoteCreateForm.syllabusId ||
            approvedSyllabusOptionsForNewLessonNote.length === 0
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Class</label>
              <select
                value={lessonNoteCreateForm.className}
                onChange={(e) => setLessonNoteCreateForm((prev) => ({ ...prev, className: e.target.value, subject: '', syllabusId: '' }))}
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
                value={lessonNoteCreateForm.subject}
                onChange={(e) => setLessonNoteCreateForm((prev) => ({ ...prev, subject: e.target.value, syllabusId: '' }))}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
                disabled={!lessonNoteCreateForm.className}
              >
                <option value="">Select subject</option>
                {lessonNoteCreateSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Week</label>
              <select
                value={lessonNoteCreateForm.week}
                onChange={(e) => setLessonNoteCreateForm((prev) => ({ ...prev, week: e.target.value }))}
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
                value={lessonNoteCreateForm.title}
                onChange={(e) => setLessonNoteCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-input-background"
                placeholder="e.g. Linear Equations Lesson"
              />
            </div>

            <div>
              <label className="block mb-2">Link to Approved Syllabus</label>
              <select
                value={lessonNoteCreateForm.syllabusId}
                onChange={(e) => setLessonNoteCreateForm((prev) => ({ ...prev, syllabusId: e.target.value }))}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
                disabled={!lessonNoteCreateForm.className || !lessonNoteCreateForm.subject}
              >
                <option value="">Select approved syllabus</option>
                {approvedSyllabusOptionsForNewLessonNote.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    Week {entry.week} - {entry.title}
                  </option>
                ))}
              </select>
            </div>

            {lessonNoteCreateForm.className && lessonNoteCreateForm.subject && approvedSyllabusOptionsForNewLessonNote.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                No approved syllabus is available for this class and subject yet.
              </div>
            )}
          </div>
        </GenericEntryModal>
      )}

      {showAssessmentModal && (
        <GenericEntryModal
          isOpen={true}
          onClose={closeAssessmentModal}
          title="Add Assessment"
          submitLabel="Create Assessment"
          onSubmit={handleCreateAssessment}
          submitDisabled={
            !assessmentForm.className ||
            !assessmentForm.subject ||
            !assessmentForm.title.trim() ||
            !assessmentForm.totalMarks.trim() ||
            Number(assessmentForm.totalMarks) <= 0 ||
            !assessmentForm.dueDate
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Class</label>
              <select
                value={assessmentForm.className}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, className: e.target.value, subject: '' }))}
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
                value={assessmentForm.subject}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, subject: e.target.value }))}
                className="w-full p-2 border border-border rounded-lg bg-input-background"
                disabled={!assessmentForm.className}
              >
                <option value="">Select subject</option>
                {lessonNoteCreateSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Title</label>
              <input
                type="text"
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-border rounded-lg bg-input-background"
                placeholder="e.g. Mathematics Quiz 1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-2">Total Mark</label>
                <input
                  type="number"
                  min={1}
                  value={assessmentForm.totalMarks}
                  onChange={(e) => setAssessmentForm((prev) => ({ ...prev, totalMarks: e.target.value }))}
                  className="w-full p-3 border border-border rounded-lg bg-input-background"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block mb-2">Date</label>
                <input
                  type="date"
                  value={assessmentForm.dueDate}
                  onChange={(e) => setAssessmentForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full p-3 border border-border rounded-lg bg-input-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block mb-2">Assessment Type</label>
                <select
                  value={assessmentForm.type}
                  onChange={(e) => setAssessmentForm((prev) => ({ ...prev, type: e.target.value as AssessmentType }))}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  <option value="Quiz">Quiz</option>
                  <option value="Test">Test</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Exam">Exam</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Status</label>
                <select
                  value={assessmentForm.status}
                  onChange={(e) => setAssessmentForm((prev) => ({ ...prev, status: e.target.value as AssessmentStatus }))}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={assessmentForm.isCumulative}
                    onChange={(e) => setAssessmentForm((prev) => ({ ...prev, isCumulative: e.target.checked }))}
                  />
                  Cumulative
                </label>
              </div>
            </div>
          </div>
        </GenericEntryModal>
      )}

      {showNewSyllabusModal && (
        <GenericEntryModal
          isOpen={true}
          onClose={closeSyllabusModal}
          title={currentSyllabusEntry ? 'Edit Syllabus Entry' : 'Create New Syllabus'}
          submitLabel={currentSyllabusEntry ? 'Save Changes' : 'Create Syllabus'}
          onSubmit={handleSaveSyllabusEntry}
          submitDisabled={
            !syllabusForm.className ||
            !syllabusForm.subject ||
            !syllabusForm.week ||
            !syllabusForm.title.trim() ||
            !syllabusForm.content.trim() ||
            Number(syllabusForm.lessonNotes) < 0
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
        </GenericEntryModal>
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