import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, ChevronDown, ChevronLeft, Clock, PencilLine, Sparkles } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Modal } from '../Modal';
import {
  AssessmentSummary,
  buildAssessmentId,
  buildDefaultStudentResults,
  createAssessmentSeed,
  formatAssessmentStatus,
  formatAssessmentTimestamp,
  loadAssessmentRecord,
  summarizeAssessment,
  upsertAssessmentRecord,
} from './assessmentUtils';

type TeacherClassRole = 'classTeacher' | 'subjectTeacher';
type AttendanceState = 'present' | 'absent' | 'late';
type GradingStatus = 'pending' | 'graded' | 'approved';

type StudentAttendanceRecord = {
  studentId: string;
  studentName: string;
  state: AttendanceState;
};

type ClassMetadata = {
  id: string;
  className: string;
  teacherRole: TeacherClassRole;
  mySubject?: string;
  subjectOversight: Array<{
    subject: string;
    teacher: string;
    syllabusStatus: 'approved' | 'submitted' | 'rejected';
  }>;
  studentRoster: Array<{
    id: string;
    name: string;
    attendance: string;
  }>;
};

type WeeklyMaterial = {
  week: number;
  topic: string;
  lessonNoteSnippet: string;
  fullLessonNote: string;
};

type GradeItem = {
  id: string;
  studentName: string;
  score: number;
  maxScore: number;
  type: string;
  status: GradingStatus;
};

type WorkItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
};

type SessionRecord = {
  id: string;
  week: number;
  date: string;
  subject: string;
  teacher: string;
  editable: boolean;
  attendance: {
    records: StudentAttendanceRecord[];
    lastModified: string;
  };
  subjectSummary: string;
  grades: GradeItem[];
  homework: WorkItem[];
  tests: WorkItem[];
  source?: 'teaching-console' | 'mock';
};

type MonthlyNarrative = {
  monthNumber: number;
  studentId: string;
  subjectId: string;
  comment: string;
  aiDraft?: string;
  updatedAt: string;
};

const classMetadataById: Record<string, ClassMetadata> = {
  'a1b2c3d4-e5f6-7890-abcd-ef1234567819': {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819',
    className: 'Math 10A',
    teacherRole: 'classTeacher',
    subjectOversight: [
      { subject: 'Mathematics', teacher: 'Mrs. Johnson', syllabusStatus: 'approved' },
      { subject: 'English', teacher: 'Mr. Carter', syllabusStatus: 'submitted' },
      { subject: 'Science', teacher: 'Ms. Ahmed', syllabusStatus: 'approved' },
      { subject: 'Civic Education', teacher: 'Mr. Bello', syllabusStatus: 'rejected' },
    ],
    studentRoster: [
      { id: 's1', name: 'Sarah Johnson', attendance: '96%' },
      { id: 's2', name: 'Michael Brown', attendance: '91%' },
      { id: 's3', name: 'Emily Davis', attendance: '94%' },
    ],
  },
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    className: 'Science 10A',
    teacherRole: 'subjectTeacher',
    mySubject: 'Science',
    subjectOversight: [],
    studentRoster: [
      { id: 's6', name: 'Daniel Kent', attendance: '97%' },
      { id: 's7', name: 'Laura James', attendance: '92%' },
    ],
  },
  'b2c3d4e5-f6g7-8901-efgh-123456789012': {
    id: 'b2c3d4e5-f6g7-8901-efgh-123456789012',
    className: 'Math 10B',
    teacherRole: 'subjectTeacher',
    mySubject: 'Mathematics',
    subjectOversight: [],
    studentRoster: [
      { id: 's4', name: 'Isaac Cole', attendance: '89%' },
      { id: 's5', name: 'Nora White', attendance: '93%' },
    ],
  },
};

const weeklyMaterialsByClass: Record<string, { currentWeek: number; weeks: WeeklyMaterial[] }> = {
  'a1b2c3d4-e5f6-7890-abcd-ef1234567819': {
    currentWeek: 4,
    weeks: [
      {
        week: 1,
        topic: 'Introduction to Algebra',
        lessonNoteSnippet: 'Learners explored variables, expressions, and the role of algebra in problem solving.',
        fullLessonNote:
          'Learners explored variables, expressions, and the role of algebra in problem solving. The lesson focused on identifying terms, simplifying expressions, and applying basic algebraic rules to guided examples and short class practice.',
      },
      {
        week: 2,
        topic: 'Linear Equations',
        lessonNoteSnippet: 'The class practiced solving one-step and two-step equations with class participation.',
        fullLessonNote:
          'The class practiced solving one-step and two-step equations with class participation. Emphasis was placed on balancing both sides of the equation and checking answers using substitution.',
      },
      {
        week: 3,
        topic: 'Quadratic Functions',
        lessonNoteSnippet: 'Students introduced to quadratic expressions and the shape of their graphs.',
        fullLessonNote:
          'Students were introduced to quadratic expressions and the shape of their graphs. The session included graph sketching, discussion of turning points, and short differentiated exercises.',
      },
      {
        week: 4,
        topic: 'Graphing Techniques',
        lessonNoteSnippet: 'Graph plotting using coordinate grids and interpretation of axes and scales.',
        fullLessonNote:
          'Graph plotting using coordinate grids and interpretation of axes and scales. Learners practiced line graphs and bar graphs, then related the results to real classroom data.',
      },
    ],
  },
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': {
    currentWeek: 4,
    weeks: [
      {
        week: 1,
        topic: 'Lab Safety & Scientific Method',
        lessonNoteSnippet: 'Learners reviewed lab rules, hazard symbols, and the steps of scientific inquiry.',
        fullLessonNote:
          'Learners reviewed lab rules, hazard symbols, and the steps of scientific inquiry. The class completed an observation worksheet and discussed responsible laboratory behavior.',
      },
      {
        week: 2,
        topic: 'States of Matter',
        lessonNoteSnippet: 'Matter was explored through particle diagrams and change-of-state examples.',
        fullLessonNote:
          'Matter was explored through particle diagrams and change-of-state examples. Students compared solids, liquids, and gases and linked temperature changes to particle movement.',
      },
      {
        week: 3,
        topic: 'Force and Motion',
        lessonNoteSnippet: 'Students worked through simple force diagrams and motion examples in class.',
        fullLessonNote:
          'Students worked through simple force diagrams and motion examples in class. A short quiz followed to check understanding of balanced and unbalanced forces.',
      },
      {
        week: 4,
        topic: 'Energy Transfer',
        lessonNoteSnippet: 'Heat, light, and electrical energy transfers were mapped through practical examples.',
        fullLessonNote:
          'Heat, light, and electrical energy transfers were mapped through practical examples. Students completed a guided reflection on how energy changes in daily life scenarios.',
      },
    ],
  },
  'b2c3d4e5-f6g7-8901-efgh-123456789012': {
    currentWeek: 4,
    weeks: [
      {
        week: 1,
        topic: 'Numbers and Place Value',
        lessonNoteSnippet: 'Review of place value, rounding, and number forms with simple practice problems.',
        fullLessonNote:
          'Review of place value, rounding, and number forms with simple practice problems. Students solved short drills and checked answers in pairs.',
      },
      {
        week: 2,
        topic: 'Fractions and Decimals',
        lessonNoteSnippet: 'Learners converted between decimals and fractions using worked examples.',
        fullLessonNote:
          'Learners converted between decimals and fractions using worked examples. The lesson used a quick board race to reinforce precision and speed.',
      },
      {
        week: 3,
        topic: 'Ratio and Proportion',
        lessonNoteSnippet: 'Ratio comparisons were used to solve real-world classroom examples.',
        fullLessonNote:
          'Ratio comparisons were used to solve real-world classroom examples. Students practiced scaling ingredients and map measurements.',
      },
      {
        week: 4,
        topic: 'Graphing Data',
        lessonNoteSnippet: 'Bar charts and simple line graphs were created from survey results.',
        fullLessonNote:
          'Bar charts and simple line graphs were created from survey results. Learners interpreted trends and wrote short explanations for their graphs.',
      },
    ],
  },
};

const seedSessionsByClass: Record<string, SessionRecord[]> = {
  'a1b2c3d4-e5f6-7890-abcd-ef1234567819': [
    {
      id: 'sess-math-1',
      week: 1,
      date: '2026-04-01',
      subject: 'Mathematics',
      teacher: 'Mrs. Johnson',
      editable: true,
      attendance: {
        records: [
          { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
          { studentId: 's2', studentName: 'Michael Brown', state: 'present' },
          { studentId: 's3', studentName: 'Emily Davis', state: 'late' },
        ],
        lastModified: '2026-04-01T09:20:00Z',
      },
      subjectSummary: 'The class settled quickly and handled the algebra introduction with good participation.',
      grades: [
        { id: 'g1', studentName: 'Sarah Johnson', score: 85, maxScore: 100, type: 'Quiz', status: 'graded' },
        { id: 'g2', studentName: 'Michael Brown', score: 78, maxScore: 100, type: 'Classwork', status: 'graded' },
      ],
      homework: [{ id: 'h1', title: 'Solve practice set 1', description: 'Problems 1-20 from textbook', dueDate: '2026-04-03' }],
      tests: [{ id: 't1', title: 'Short Quiz', description: 'Variables and Expressions', dueDate: '2026-04-02' }],
      source: 'mock',
    },
    {
      id: 'sess-eng-1',
      week: 1,
      date: '2026-04-01',
      subject: 'English',
      teacher: 'Mr. Carter',
      editable: false,
      attendance: {
        records: [
          { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
          { studentId: 's2', studentName: 'Michael Brown', state: 'present' },
          { studentId: 's3', studentName: 'Emily Davis', state: 'present' },
        ],
        lastModified: '2026-04-01T10:30:00Z',
      },
      subjectSummary: 'Students engaged in a reading comprehension activity with group discussion.',
      grades: [{ id: 'g3', studentName: 'Sarah Johnson', score: 82, maxScore: 100, type: 'Participation', status: 'graded' }],
      homework: [{ id: 'h2', title: 'Read Chapter 2', description: 'Complete reading and notes', dueDate: '2026-04-04' }],
      tests: [],
      source: 'mock',
    },
    {
      id: 'sess-sci-1',
      week: 1,
      date: '2026-04-01',
      subject: 'Science',
      teacher: 'Ms. Ahmed',
      editable: false,
      attendance: {
        records: [
          { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
          { studentId: 's2', studentName: 'Michael Brown', state: 'absent' },
          { studentId: 's3', studentName: 'Emily Davis', state: 'present' },
        ],
        lastModified: '2026-04-01T11:15:00Z',
      },
      subjectSummary: 'Lab safety orientation and scientific method recap.',
      grades: [{ id: 'g4', studentName: 'Emily Davis', score: 90, maxScore: 100, type: 'Lab', status: 'approved' }],
      homework: [{ id: 'h3', title: 'Safety worksheet', description: 'Pages 5-8', dueDate: '2026-04-03' }],
      tests: [],
      source: 'mock',
    },
    {
      id: 'sess-math-2',
      week: 2,
      date: '2026-04-03',
      subject: 'Mathematics',
      teacher: 'Mrs. Johnson',
      editable: true,
      attendance: {
        records: [
          { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
          { studentId: 's2', studentName: 'Michael Brown', state: 'absent' },
          { studentId: 's3', studentName: 'Emily Davis', state: 'present' },
        ],
        lastModified: '2026-04-03T09:10:00Z',
      },
      subjectSummary: 'Linear equations practice showed stronger individual work but some board hesitation.',
      grades: [{ id: 'g5', studentName: 'Nora White', score: 88, maxScore: 100, type: 'Homework', status: 'pending' }],
      homework: [{ id: 'h4', title: 'Equation sheet', description: 'Solve 10 linear equations', dueDate: '2026-04-05' }],
      tests: [{ id: 't2', title: 'Quiz 1', description: 'Linear Equations', dueDate: '2026-04-03' }],
      source: 'mock',
    },
    {
      id: 'sess-math-4',
      week: 4,
      date: '2026-04-07',
      subject: 'Mathematics',
      teacher: 'Mrs. Johnson',
      editable: true,
      attendance: {
        records: [
          { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
          { studentId: 's2', studentName: 'Michael Brown', state: 'present' },
          { studentId: 's3', studentName: 'Emily Davis', state: 'present' },
        ],
        lastModified: '2026-04-07T09:40:00Z',
      },
      subjectSummary: 'Graph plotting was steady. The class benefited from the visual examples and quick corrections.',
      grades: [{ id: 'g6', studentName: 'Michael Brown', score: 91, maxScore: 100, type: 'Classwork', status: 'approved' }],
      homework: [{ id: 'h5', title: 'Graph workbook page', description: 'Pages 45-50', dueDate: '2026-04-09' }],
      tests: [{ id: 't3', title: 'Graph skills check', description: 'Plotting and interpretation', dueDate: '2026-04-08' }],
      source: 'mock',
    },
  ],
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': [
    {
      id: 'sess-sci-2',
      week: 2,
      date: '2026-04-03',
      subject: 'Science',
      teacher: 'Ms. Ahmed',
      editable: true,
      attendance: {
        records: [
          { studentId: 's6', studentName: 'Daniel Kent', state: 'present' },
          { studentId: 's7', studentName: 'Laura James', state: 'present' },
        ],
        lastModified: '2026-04-03T11:30:00Z',
      },
      subjectSummary: 'Matter and energy transfer activity was well received.',
      grades: [{ id: 'g7', studentName: 'Daniel Kent', score: 87, maxScore: 100, type: 'Lab', status: 'graded' }],
      homework: [{ id: 'h6', title: 'Energy worksheet', description: 'Complete worksheet', dueDate: '2026-04-05' }],
      tests: [],
      source: 'mock',
    },
    {
      id: 'sess-sci-4',
      week: 4,
      date: '2026-04-07',
      subject: 'Science',
      teacher: 'Ms. Ahmed',
      editable: true,
      attendance: {
        records: [
          { studentId: 's6', studentName: 'Daniel Kent', state: 'present' },
          { studentId: 's7', studentName: 'Laura James', state: 'late' },
        ],
        lastModified: '2026-04-07T10:25:00Z',
      },
      subjectSummary: 'Energy transfer examples linked well to the lab discussion.',
      grades: [
        { id: 'g8', studentName: 'Laura James', score: 92, maxScore: 100, type: 'Lab', status: 'approved' },
        { id: 'g9', studentName: 'Daniel Kent', score: 84, maxScore: 100, type: 'Quiz', status: 'pending' },
      ],
      homework: [{ id: 'h7', title: 'Prepare lab reflection', description: 'Write reflection', dueDate: '2026-04-09' }],
      tests: [{ id: 't4', title: 'Energy Quiz', description: 'Energy transfer concepts', dueDate: '2026-04-08' }],
      source: 'mock',
    },
  ],
  'b2c3d4e5-f6g7-8901-efgh-123456789012': [
    {
      id: 'sess-math-3b',
      week: 3,
      date: '2026-04-06',
      subject: 'Mathematics',
      teacher: 'Mrs. Johnson',
      editable: true,
      attendance: {
        records: [
          { studentId: 's4', studentName: 'Isaac Cole', state: 'present' },
          { studentId: 's5', studentName: 'Nora White', state: 'present' },
        ],
        lastModified: '2026-04-06T09:25:00Z',
      },
      subjectSummary: 'Ratio work improved, especially in pair exercises.',
      grades: [{ id: 'g10', studentName: 'Isaac Cole', score: 79, maxScore: 100, type: 'Homework', status: 'graded' }],
      homework: [{ id: 'h8', title: 'Ratio practice', description: 'Practice problems', dueDate: '2026-04-08' }],
      tests: [],
      source: 'mock',
    },
  ],
};

function getHistoryKey(classId: string) {
  return `class-history:${classId}`;
}

function getSessionCreatedAt(session: SessionRecord) {
  return session.attendance.lastModified || new Date(`${session.date}T09:00:00Z`).toISOString();
}

function buildAssessmentSeedsForSession(session: SessionRecord, classMeta: ClassMetadata) {
  const createdAt = getSessionCreatedAt(session);
  const roster = classMeta.studentRoster;

  const gradingSeeds = session.grades.map((item, index) => {
    const matchedStudent = roster.find((student) => student.name === item.studentName);
    const initialScores = Object.fromEntries(
      roster.map((student) => [student.id, student.id === matchedStudent?.id ? item.score : null]),
    );

    return createAssessmentSeed({
      id: buildAssessmentId(classMeta.id, session.id, 'grading', item.id),
      classId: classMeta.id,
      className: classMeta.className,
      subject: session.subject,
      sessionId: session.id,
      sessionDate: session.date,
      title: `${item.type} ${index + 1}`,
      maxScore: item.maxScore,
      weighting: 0,
      useForCumulativeResult: false,
      category: 'grading',
      typeLabel: item.type,
      status: item.status,
      createdAt,
      staff: session.teacher,
      studentResults: buildDefaultStudentResults(roster, initialScores),
    });
  });

  const homeworkSeeds = session.homework.map((item) =>
    createAssessmentSeed({
      id: buildAssessmentId(classMeta.id, session.id, 'homework', item.id),
      classId: classMeta.id,
      className: classMeta.className,
      subject: session.subject,
      sessionId: session.id,
      sessionDate: session.date,
      title: item.title,
      maxScore: 100,
      weighting: 0,
      useForCumulativeResult: false,
      category: 'homework',
      typeLabel: 'Assignment',
      status: 'pending',
      createdAt,
      staff: session.teacher,
      studentResults: buildDefaultStudentResults(roster),
    }),
  );

  const testSeeds = session.tests.map((item) =>
    createAssessmentSeed({
      id: buildAssessmentId(classMeta.id, session.id, 'test', item.id),
      classId: classMeta.id,
      className: classMeta.className,
      subject: session.subject,
      sessionId: session.id,
      sessionDate: session.date,
      title: item.title,
      maxScore: 100,
      weighting: 0,
      useForCumulativeResult: false,
      category: 'test',
      typeLabel: 'Test',
      status: 'pending',
      createdAt,
      staff: session.teacher,
      studentResults: buildDefaultStudentResults(roster),
    }),
  );

  return [...gradingSeeds, ...homeworkSeeds, ...testSeeds];
}

function buildAssessmentSummariesForSession(session: SessionRecord, classMeta: ClassMetadata): AssessmentSummary[] {
  return buildAssessmentSeedsForSession(session, classMeta).map((seed) => {
    const stored = loadAssessmentRecord(seed.id);
    return summarizeAssessment(stored ?? seed);
  });
}

function toSubjectId(subject: string) {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function fromSubjectId(subjectId: string) {
  return subjectId.replace(/-/g, ' ').trim().toLowerCase();
}

function getMonthlyNarrativeStorageKey(classId: string, subjectId: string) {
  return `subject-detail:monthly-narratives:${classId}:${subjectId}`;
}

function formatSubjectTitle(subjectId?: string) {
  if (!subjectId) return 'subject';
  return subjectId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSessionRecord(raw: any, classMeta: ClassMetadata): SessionRecord {
  const fallbackRecords: StudentAttendanceRecord[] = classMeta.studentRoster.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    state: 'present',
  }));

  const attendanceRecords = Array.isArray(raw?.attendance?.records)
    ? raw.attendance.records
        .map((record: any) => ({
          studentId: String(record?.studentId ?? ''),
          studentName: String(record?.studentName ?? ''),
          state: record?.state === 'absent' || record?.state === 'late' ? record.state : 'present',
        }))
        .filter((record: StudentAttendanceRecord) => record.studentId && record.studentName)
    : fallbackRecords;

  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    week: Number(raw?.week ?? 1),
    date: String(raw?.date ?? new Date().toISOString().slice(0, 10)),
    subject: String(raw?.subject ?? ''),
    teacher: String(raw?.teacher ?? 'Unknown'),
    editable: Boolean(raw?.editable),
    attendance: {
      records: attendanceRecords.length ? attendanceRecords : fallbackRecords,
      lastModified: String(raw?.attendance?.lastModified ?? new Date().toISOString()),
    },
    subjectSummary: String(raw?.subjectSummary ?? ''),
    grades: Array.isArray(raw?.grades)
      ? raw.grades.map((grade: any) => ({
          id: String(grade?.id ?? crypto.randomUUID()),
          studentName: String(grade?.studentName ?? 'Unknown Student'),
          score: Number(grade?.score ?? 0),
          maxScore: Number(grade?.maxScore ?? 100),
          type: String(grade?.type ?? 'Activity'),
          status: grade?.status === 'pending' || grade?.status === 'approved' || grade?.status === 'graded'
            ? grade.status
            : 'pending',
        }))
      : [],
    homework: Array.isArray(raw?.homework)
      ? raw.homework.map((item: any) => ({
          id: String(item?.id ?? crypto.randomUUID()),
          title: String(item?.title ?? 'Untitled'),
          description: String(item?.description ?? ''),
          dueDate: String(item?.dueDate ?? ''),
        }))
      : [],
    tests: Array.isArray(raw?.tests)
      ? raw.tests.map((item: any) => ({
          id: String(item?.id ?? crypto.randomUUID()),
          title: String(item?.title ?? 'Untitled'),
          description: String(item?.description ?? ''),
          dueDate: String(item?.dueDate ?? ''),
        }))
      : [],
    source: raw?.source === 'teaching-console' ? 'teaching-console' : 'mock',
  };
}

function AttendanceTable({
  records,
  onStateChange,
  canEdit,
}: {
  records: StudentAttendanceRecord[];
  onStateChange: (studentId: string, state: AttendanceState) => void;
  canEdit: boolean;
}) {
  const states: AttendanceState[] = ['present', 'absent', 'late'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3">Student</th>
            <th className="text-center py-2 px-3">Present</th>
            <th className="text-center py-2 px-3">Absent</th>
            <th className="text-center py-2 px-3">Late</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.studentId} className="border-b border-border">
              <td className="py-2 px-3">{record.studentName}</td>
              {states.map((state) => (
                <td key={state} className="text-center py-2 px-3">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => onStateChange(record.studentId, state)}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      record.state === state
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-foreground'
                    } ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
                  >
                    {state === 'present' ? '✓' : state === 'absent' ? '✗' : '⏱'}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssessmentRowsTable({
  rows,
  onOpenAssessment,
}: {
  rows: AssessmentSummary[];
  onOpenAssessment: (assessmentId: string) => void;
}) {
  if (!rows.length) {
    return <div className="text-sm text-muted-foreground">No assessments recorded for this instance yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Name</th>
            <th className="text-left py-2 px-3">Max Score</th>
            <th className="text-left py-2 px-3">Type</th>
            <th className="text-left py-2 px-3">Status</th>
            <th className="text-left py-2 px-3">Date Created</th>
            <th className="text-left py-2 px-3">Staff</th>
            <th className="text-left py-2 px-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const summaryText = row.averageScore === null
              ? 'No scores entered'
              : `Average ${row.averageScore}/${row.maxScore}`;

            return (
              <tr
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenAssessment(row.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenAssessment(row.id);
                  }
                }}
                className="border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{summaryText}</p>
                  </div>
                </td>
                <td className="py-3 px-3">{row.maxScore}</td>
                <td className="py-3 px-3">
                  <Badge variant="default">{row.typeLabel}</Badge>
                </td>
                <td className="py-3 px-3">
                  <Badge variant={row.status === 'approved' ? 'approved' : row.status === 'graded' ? 'graded' : 'pending'}>
                    {formatAssessmentStatus(row.status)}
                  </Badge>
                </td>
                <td className="py-3 px-3">{formatAssessmentTimestamp(row.createdAt)}</td>
                <td className="py-3 px-3">{row.staff}</td>
                <td className="py-3 px-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenAssessment(row.id)}
                  >
                    Open Assessment <ArrowRight size={14} className="ml-1" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PastWeekCard({
  weekMaterial,
  sessions,
  assessmentSummariesBySession,
  onOpenAssessment,
  onUpdate,
}: {
  weekMaterial: WeeklyMaterial;
  sessions: SessionRecord[];
  assessmentSummariesBySession: Record<string, AssessmentSummary[]>;
  onOpenAssessment: (assessmentId: string) => void;
  onUpdate: (sessionId: string, updater: (current: SessionRecord) => SessionRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between bg-accent/20"
      >
        <div>
          <p className="font-semibold">Week {weekMaterial.week}</p>
          <p className="text-sm text-muted-foreground">{weekMaterial.topic}</p>
          <p className="text-xs text-muted-foreground mt-1">{sessions.length} instance(s)</p>
        </div>
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="p-4 border-t border-border space-y-3">
          {sessions.map((session) => (
            <InstanceCard
              key={session.id}
              session={session}
              canEdit={session.editable}
              assessmentRows={assessmentSummariesBySession[session.id] || []}
              onOpenAssessment={onOpenAssessment}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InstanceCard({
  session,
  canEdit,
  assessmentRows,
  onOpenAssessment,
  onUpdate,
}: {
  session: SessionRecord;
  canEdit: boolean;
  assessmentRows: AssessmentSummary[];
  onOpenAssessment: (assessmentId: string) => void;
  onUpdate: (sessionId: string, updater: (current: SessionRecord) => SessionRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(session.subjectSummary);
  const [savingId, setSavingId] = useState<string | null>(null);

  const attendanceRecords = session.attendance?.records ?? [];
  const attendancePresent = attendanceRecords.filter((r) => r.state === 'present' || r.state === 'late').length;
  const attendanceTotal = attendanceRecords.length;

  const handleSaveSummary = () => {
    setSavingId('summary');
    setTimeout(() => {
      onUpdate(session.id, (current) => ({
        ...current,
        subjectSummary: summaryDraft,
      }));
      setEditingSummary(false);
      setSavingId(null);
    }, 500);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
      >
        <div>
          <p className="font-medium">Instance • {session.date}</p>
          <p className="text-sm text-muted-foreground">Teacher: {session.teacher}</p>
        </div>
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="p-4 border-t border-border bg-accent/5 space-y-4">
          {/* Attendance Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-medium text-sm">
                Attendance: {attendancePresent}/{attendanceTotal}
              </p>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setShowAttendance(!showAttendance)}>
                  {showAttendance ? 'Hide' : 'Manage'} Attendance
                </Button>
              )}
            </div>
            {showAttendance && (
              <AttendanceTable
                records={attendanceRecords}
                onStateChange={(studentId, state) => {
                  onUpdate(session.id, (current) => ({
                    ...current,
                    attendance: {
                      ...current.attendance,
                      records: current.attendance.records.map((r) => (r.studentId === studentId ? { ...r, state } : r)),
                      lastModified: new Date().toISOString(),
                    },
                  }));
                }}
                canEdit={canEdit}
              />
            )}
          </div>

          {/* Subject Summary Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-medium text-sm">Subject Summary</p>
              {canEdit && !editingSummary && (
                <Button size="sm" variant="outline" onClick={() => setEditingSummary(true)}>
                  <PencilLine size={14} /> Edit
                </Button>
              )}
            </div>
            {editingSummary && canEdit ? (
              <div className="space-y-2">
                <textarea
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-input-background text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  {savingId === 'summary' ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={14} className="animate-spin" /> Saving...
                    </div>
                  ) : (
                    <>
                      <Button size="sm" variant="primary" onClick={handleSaveSummary}>
                        <Check size={14} className="mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingSummary(false)}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-6">{session.subjectSummary}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-medium text-sm">Assessments</p>
              <p className="text-xs text-muted-foreground">{assessmentRows.length} row(s)</p>
            </div>
            <AssessmentRowsTable rows={assessmentRows} onOpenAssessment={onOpenAssessment} />
          </div>
        </div>
      )}
    </div>
  );
}

export function SubjectDetailPage() {
  const navigate = useNavigate();
  const { classId, subjectId } = useParams();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [showFullNote, setShowFullNote] = useState(false);
  const [monthlyNarratives, setMonthlyNarratives] = useState<Record<string, Record<string, MonthlyNarrative>>>({});
  const [narrativeModalStudentId, setNarrativeModalStudentId] = useState<string | null>(null);
  const [narrativeDraft, setNarrativeDraft] = useState('');
  const [narrativeAiDraft, setNarrativeAiDraft] = useState('');

  const classMeta = useMemo(() => (classId ? classMetadataById[classId] : undefined), [classId]);

  const resolvedSubjectName = useMemo(() => {
    if (!subjectId || !classMeta) return undefined;
    const requested = fromSubjectId(subjectId);
    const fromOversight = classMeta.subjectOversight.find((item) => fromSubjectId(toSubjectId(item.subject)) === requested);
    if (fromOversight) return fromOversight.subject;
    if (classMeta.mySubject && fromSubjectId(toSubjectId(classMeta.mySubject)) === requested) return classMeta.mySubject;
    return undefined;
  }, [classMeta, subjectId]);

  const weeklyMaterials = useMemo(() => {
    if (!classId) return undefined;
    return weeklyMaterialsByClass[classId];
  }, [classId]);

  const currentWeekNumber = useMemo(() => {
    if (!weeklyMaterials) return 0;
    return selectedWeek || weeklyMaterials.currentWeek;
  }, [selectedWeek, weeklyMaterials]);

  const monthlyCycleNumber = useMemo(() => {
    if (!currentWeekNumber) return 0;
    return Math.ceil(currentWeekNumber / 4);
  }, [currentWeekNumber]);

  const monthlyReviewRequired = Boolean(currentWeekNumber && currentWeekNumber % 4 === 0);
  const monthlyNarrativeKey = useMemo(
    () => `${subjectId || 'subject'}:${monthlyCycleNumber || 1}`,
    [monthlyCycleNumber, subjectId],
  );
  const monthlyNarrativeStorageKey = useMemo(
    () => (classId && subjectId ? getMonthlyNarrativeStorageKey(classId, subjectId) : ''),
    [classId, subjectId],
  );

  const currentCycleSessions = useMemo(() => {
    if (!currentWeekNumber) return [];
    const cycleStartWeek = Math.max(1, currentWeekNumber - 3);
    return sessions.filter((session) => session.week >= cycleStartWeek && session.week <= currentWeekNumber);
  }, [currentWeekNumber, sessions]);

  const studentNarrativeRows = useMemo(() => {
    if (!classMeta) return [];

    return classMeta.studentRoster.map((student) => {
      const narrative = monthlyNarratives[student.id]?.[monthlyNarrativeKey] || null;
      return {
        student,
        narrative,
      };
    });
  }, [classMeta, monthlyNarratives, monthlyNarrativeKey]);

  const narrativeModalStudent = useMemo(() => {
    if (!narrativeModalStudentId || !classMeta) return null;
    return classMeta.studentRoster.find((student) => student.id === narrativeModalStudentId) || null;
  }, [classMeta, narrativeModalStudentId]);

  const monthlyNarrativeStats = useMemo<Record<string, { attendanceRate: number; averageScore: number }>>(() => {
    if (!currentCycleSessions.length || !classMeta) {
      return {};
    }

    return classMeta.studentRoster.reduce<Record<string, { attendanceRate: number; averageScore: number }>>((acc, student) => {
      const attendanceRecords = currentCycleSessions
        .map((session) => session.attendance.records.find((record) => record.studentId === student.id || record.studentName === student.name))
        .filter((record): record is StudentAttendanceRecord => Boolean(record));

      const presentOrLateCount = attendanceRecords.filter((record) => record.state === 'present' || record.state === 'late').length;
      const attendanceRate = attendanceRecords.length ? Math.round((presentOrLateCount / attendanceRecords.length) * 100) : 0;

      const scoreEntries = currentCycleSessions.flatMap((session) =>
        session.grades
          .filter((grade) => grade.studentName === student.name)
          .map((grade) => (grade.maxScore > 0 ? (grade.score / grade.maxScore) * 100 : 0)),
      );

      const averageScore = scoreEntries.length
        ? Math.round((scoreEntries.reduce((sum, score) => sum + score, 0) / scoreEntries.length) * 10) / 10
        : 0;

      acc[student.id] = { attendanceRate, averageScore };
      return acc;
    }, {} as Record<string, { attendanceRate: number; averageScore: number }>);
  }, [classMeta, currentCycleSessions]);

  const buildAiDraft = (studentIdToDraft: string) => {
    if (!classMeta) return '';

    const student = classMeta.studentRoster.find((entry) => entry.id === studentIdToDraft);
    if (!student) return '';

    const stats = monthlyNarrativeStats[student.id] || { attendanceRate: 0, averageScore: 0 };
    const attendanceSentence = `${student.name} maintained ${stats.attendanceRate}% attendance across the last four weeks.`;
    const scoreSentence = stats.averageScore > 0
      ? `Academic performance averaged ${stats.averageScore}% and shows a ${stats.averageScore >= 75 ? 'positive' : 'steady'} trajectory.`
      : 'Assessment evidence was limited, but participation remained visible in class sessions.';

    return `${attendanceSentence} ${scoreSentence}`;
  };

  const openNarrativeModal = (studentIdToOpen: string) => {
    setNarrativeModalStudentId(studentIdToOpen);
    setNarrativeDraft(monthlyNarratives[studentIdToOpen]?.[monthlyNarrativeKey]?.comment || '');
    setNarrativeAiDraft(monthlyNarratives[studentIdToOpen]?.[monthlyNarrativeKey]?.aiDraft || '');
  };

  const handleGenerateNarrativeWithAi = () => {
    if (!narrativeModalStudentId) return;
    const draft = buildAiDraft(narrativeModalStudentId);
    setNarrativeAiDraft(draft);
    setNarrativeDraft(draft);
  };

  const handleSaveMonthlyNarrative = () => {
    if (!narrativeModalStudentId || !classMeta || !subjectId || !narrativeDraft.trim()) return;

    setMonthlyNarratives((prev) => ({
      ...prev,
      [narrativeModalStudentId]: {
        ...(prev[narrativeModalStudentId] || {}),
        [monthlyNarrativeKey]: {
          monthNumber: monthlyCycleNumber || 1,
          studentId: narrativeModalStudentId,
          subjectId,
          comment: narrativeDraft.trim(),
          aiDraft: narrativeAiDraft.trim() || undefined,
          updatedAt: new Date().toISOString(),
        },
      },
    }));

    setNarrativeModalStudentId(null);
    setNarrativeDraft('');
    setNarrativeAiDraft('');
  };

  useEffect(() => {
    if (!monthlyNarrativeStorageKey) return;

    try {
      const raw = localStorage.getItem(monthlyNarrativeStorageKey);
      if (!raw) {
        setMonthlyNarratives({});
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setMonthlyNarratives(parsed);
      }
    } catch {
      setMonthlyNarratives({});
    }
  }, [monthlyNarrativeStorageKey]);

  useEffect(() => {
    if (!monthlyNarrativeStorageKey) return;
    localStorage.setItem(monthlyNarrativeStorageKey, JSON.stringify(monthlyNarratives));
  }, [monthlyNarrativeStorageKey, monthlyNarratives]);

  useEffect(() => {
    if (!classMeta || !classId || !resolvedSubjectName) return;

    if (classMeta.teacherRole === 'subjectTeacher' && classMeta.mySubject !== resolvedSubjectName) {
      navigate(`/teaching-console/${classId}`, { replace: true });
      return;
    }

    const storedHistory = localStorage.getItem(getHistoryKey(classId));
    let baseSessions = seedSessionsByClass[classId] || [];

    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as any[];
        baseSessions = parsed.map((session) => normalizeSessionRecord(session, classMeta));
      } catch {
        // fallback to seed data
      }
    }

    baseSessions = baseSessions.map((session) => normalizeSessionRecord(session, classMeta));

    const filtered = baseSessions
      .filter((session) => session.subject === resolvedSubjectName)
      .sort((a, b) => b.date.localeCompare(a.date));

    setSessions(filtered);
    setSelectedWeek(weeklyMaterials?.currentWeek ?? 0);
  }, [classId, classMeta, navigate, resolvedSubjectName, weeklyMaterials?.currentWeek]);

  const sessionsByWeek = useMemo(() => {
    const grouped: Record<number, SessionRecord[]> = {};
    sessions.forEach((session) => {
      if (!grouped[session.week]) grouped[session.week] = [];
      grouped[session.week].push(session);
    });
    return grouped;
  }, [sessions]);

  useEffect(() => {
    if (!classMeta || !sessions.length) return;

    sessions.forEach((session) => {
      buildAssessmentSeedsForSession(session, classMeta).forEach((seed) => {
        upsertAssessmentRecord(seed);
      });
    });
  }, [classMeta, sessions]);

  const assessmentSummariesBySession = useMemo(() => {
    if (!classMeta) return {};

    const grouped: Record<string, AssessmentSummary[]> = {};
    sessions.forEach((session) => {
      grouped[session.id] = buildAssessmentSummariesForSession(session, classMeta);
    });
    return grouped;
  }, [classMeta, sessions]);

  const currentWeekMaterial = useMemo(() => {
    if (!weeklyMaterials || !currentWeekNumber) return undefined;
    return weeklyMaterials.weeks.find((w) => w.week === currentWeekNumber);
  }, [weeklyMaterials, currentWeekNumber]);

  const currentWeekSessions = useMemo(() => {
    if (!currentWeekNumber) return [];
    return sessionsByWeek[currentWeekNumber] || [];
  }, [currentWeekNumber, sessionsByWeek]);

  const pastWeeks = useMemo(() => {
    if (!weeklyMaterials || !currentWeekNumber) return [];
    return weeklyMaterials.weeks
      .filter((w) => w.week !== currentWeekNumber && sessionsByWeek[w.week])
      .sort((a, b) => b.week - a.week);
  }, [currentWeekNumber, weeklyMaterials, sessionsByWeek]);

  const persistSessions = (nextSessions: SessionRecord[]) => {
    if (!classId) return;
    setSessions(nextSessions);
    localStorage.setItem(getHistoryKey(classId), JSON.stringify(nextSessions));
  };

  const updateSession = (sessionId: string, updater: (current: SessionRecord) => SessionRecord) => {
    const nextSessions = sessions.map((session) => (session.id === sessionId ? updater(session) : session));
    persistSessions(nextSessions);
  };

  const openAssessment = (assessmentId: string) => {
    navigate(`/assessment/${assessmentId}`);
  };

  if (!classMeta || !resolvedSubjectName) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(classId ? `/class/${classId}` : '/')}>
            <ChevronLeft size={16} className="mr-1" /> Back to Class
          </Button>
        </div>
        <Card title="Subject Not Found">
          <p className="text-muted-foreground">No subject metadata found for this class and subject id.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            <Link to="/" className="hover:underline">Home</Link> <span className="mx-1">&gt;</span>
            <Link to={`/class/${classMeta.id}`} className="hover:underline ml-1">{classMeta.className}</Link> <span className="mx-1">&gt;</span> {resolvedSubjectName}
          </div>
          <h1 className="text-2xl">{resolvedSubjectName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Subject detail and live instance management</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(`/class/${classMeta.id}`)}>
            <ChevronLeft size={16} className="mr-1" /> Back to Class
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/teaching-console/${classMeta.id}`)}>
            Open Teaching Console
          </Button>
        </div>
      </div>

      {/* Current Week in Focus */}
      {currentWeekMaterial && (
        <Card title={`Week ${currentWeekMaterial.week} in Focus`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <Badge variant="default">Current Academic Week</Badge>
                <p className="text-sm text-muted-foreground mt-2">{currentWeekMaterial.topic}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={currentWeekNumber || weeklyMaterials?.currentWeek || 0}
                  onChange={(e) => {
                    setSelectedWeek(Number(e.target.value));
                    setShowFullNote(false);
                  }}
                  className="p-2 border border-border rounded-lg bg-input-background text-sm"
                >
                  {(weeklyMaterials?.weeks || []).map((week) => (
                    <option key={week.week} value={week.week}>
                      Week {week.week}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={() => setShowFullNote((prev) => !prev)}>
                  {showFullNote ? 'Hide Full Note' : 'View Full Note'}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-accent/20">
              <p className="text-sm text-muted-foreground leading-6 whitespace-pre-line">
                {showFullNote ? currentWeekMaterial.fullLessonNote : currentWeekMaterial.lessonNoteSnippet}
              </p>
            </div>
          </div>
        </Card>
      )}

      {monthlyReviewRequired && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4 shadow-sm flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 text-amber-700 dark:text-amber-300" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Monthly Review Required</p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Week {currentWeekNumber} closes monthly cycle {monthlyCycleNumber}. Add a qualitative update for each student before moving on.
            </p>
          </div>
        </div>
      )}

      <Card
        title="Monthly Narrative Tracker"
        action={<Badge variant="default">Cycle {monthlyCycleNumber || 1}</Badge>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2">Student</th>
                <th className="py-2">ID</th>
                <th className="py-2">Narrative Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {studentNarrativeRows.map(({ student, narrative }) => {
                const hasNarrative = Boolean(narrative?.comment.trim());
                const narrativeStatus = hasNarrative ? 'Saved' : monthlyReviewRequired ? 'Pending' : 'Not due';
                const narrativeVariant: 'approved' | 'pending' | 'default' = hasNarrative
                  ? 'approved'
                  : monthlyReviewRequired
                    ? 'pending'
                    : 'default';

                return (
                  <tr key={student.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 font-medium text-primary">{student.name}</td>
                    <td className="py-2 text-muted-foreground">{student.id}</td>
                    <td className="py-2">
                      <Badge variant={narrativeVariant}>{narrativeStatus}</Badge>
                    </td>
                    <td className="py-2">
                      <Button size="sm" variant={hasNarrative ? 'outline' : 'primary'} onClick={() => openNarrativeModal(student.id)}>
                        {hasNarrative ? 'Edit Update' : 'Add Update'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Current Week Class Instances */}
      <Card title="Weekly Class Instances">
        <div className="space-y-3">
          {currentWeekSessions.length > 0 ? (
            currentWeekSessions.map((session) => (
              <InstanceCard
                key={session.id}
                session={session}
                canEdit={session.editable}
                assessmentRows={assessmentSummariesBySession[session.id] || []}
                onOpenAssessment={openAssessment}
                onUpdate={updateSession}
              />
            ))
          ) : (
            <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              No class instances recorded for this week yet.
            </div>
          )}
        </div>
      </Card>

      {/* Past Academic Records */}
      {pastWeeks.length > 0 && (
        <Card title="Past Academic Records">
          <div className="space-y-3">
            {pastWeeks.map((weekMaterial) => (
              <PastWeekCard
                key={weekMaterial.week}
                weekMaterial={weekMaterial}
                sessions={sessionsByWeek[weekMaterial.week] || []}
                assessmentSummariesBySession={assessmentSummariesBySession}
                onOpenAssessment={openAssessment}
                onUpdate={updateSession}
              />
            ))}
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(narrativeModalStudent)}
        onClose={() => {
          setNarrativeModalStudentId(null);
          setNarrativeDraft('');
          setNarrativeAiDraft('');
        }}
        title={`Monthly Narrative - ${narrativeModalStudent?.name || ''}`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setNarrativeModalStudentId(null);
                setNarrativeDraft('');
                setNarrativeAiDraft('');
              }}
            >
              Close
            </Button>
            <Button variant="outline" onClick={handleGenerateNarrativeWithAi}>
              <Sparkles size={14} className="mr-2" />Generate with AI
            </Button>
            <Button variant="primary" onClick={handleSaveMonthlyNarrative} disabled={!narrativeDraft.trim()}>
              Save Update
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-muted-foreground">Attendance Across Cycle</p>
              <p className="text-2xl font-bold mt-2">{monthlyNarrativeStats[narrativeModalStudent?.id || '']?.attendanceRate || 0}%</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold mt-2">{monthlyNarrativeStats[narrativeModalStudent?.id || '']?.averageScore || 0}%</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground">Month Number</p>
              <p className="text-2xl font-bold mt-2">{monthlyCycleNumber || 1}</p>
            </Card>
          </div>

          <div>
            <label className="block text-sm mb-2">Monthly Narrative</label>
            <textarea
              value={narrativeDraft}
              onChange={(e) => setNarrativeDraft(e.target.value)}
              rows={6}
              className="w-full p-3 border border-border rounded-lg bg-input-background text-sm"
              placeholder="Write a qualitative update for the student after this 4-week cycle..."
            />
          </div>

          {narrativeAiDraft && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">AI Draft Preview</p>
              <p className="text-blue-800 dark:text-blue-300">{narrativeAiDraft}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
