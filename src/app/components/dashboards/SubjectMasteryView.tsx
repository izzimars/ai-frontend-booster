import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  FlaskConical,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Zap,
  ChevronRight,
  Copy,
  CalendarDays,
  ClipboardCheck,
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
import { Modal } from '../Modal';

interface TeacherComment {
  id: string;
  date: string;
  comment: string;
  isPriority: boolean;
}

interface HomeworkTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'submitted' | 'pending' | 'overdue';
  type: 'homework' | 'lab' | 'project';
}

interface StoredHomeworkItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
}

interface UpcomingAssessment {
  id: string;
  title: string;
  date: string;
  type: 'quiz' | 'test' | 'exam';
  duration: string;
}

interface PracticeQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface SubjectMasteryViewProps {
  studentId: string;
  studentName: string;
  subjectName: string;
  teacherName: string;
  teacherPhotoUrl?: string;
  classSize: number;
  currentAverage: number;
  classLabel?: string;
  classId?: string;
  onBack: () => void;
}

type ScheduleTab = 'weekly' | 'tests' | 'exams';

interface WeeklyPeriod {
  time: string;
  subject: string;
  teacherName: string;
  room: string;
}

interface WeeklyDaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  periods: WeeklyPeriod[];
}

interface TimetableAssessment {
  id: string;
  classId: string;
  type: 'test' | 'exam';
  title: string;
  date: string;
  time: string;
  weighting?: string;
  duration: string;
  venue?: string;
  itemsNeeded?: string;
}

interface TeacherMessage {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  source: 'parent-dashboard';
}

const MOCK_TEACHER_WEEKLY_SUMMARY = `This week, we covered the fundamentals of fractions and ratios. The class worked through visual models, interactive fraction games, and real-world applications. We focused on comparing fractions and simplifying ratios. Most students grasped the concepts well. Keep an eye on long division practice at home.`;

const MOCK_CLASS_HOMEWORK: HomeworkTask[] = [
  {
    id: 'hw-1',
    title: 'Fraction Worksheets 4C',
    description: 'Complete fractions comparison exercises.',
    dueDate: '2026-04-11',
    status: 'pending',
    type: 'homework',
  },
  {
    id: 'hw-2',
    title: 'Lab: Compare Ratios',
    description: 'Hands-on lab using objects to understand ratios.',
    dueDate: '2026-04-13',
    status: 'pending',
    type: 'lab',
  },
  {
    id: 'hw-3',
    title: 'Project: Real-World Ratios',
    description: 'Find and present 3 real-world ratio examples.',
    dueDate: '2026-04-17',
    status: 'pending',
    type: 'project',
  },
];

function getTeachingConsoleHomeworkKeyPrefix(classId: string) {
  return `teaching-console:${classId}:`;
}

function getLatestHomeworkList(classId: string): HomeworkTask[] {
  const prefix = getTeachingConsoleHomeworkKeyPrefix(classId);

  try {
    const items: Array<{ updatedAt: number; homeworkList: HomeworkTask[] }> = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(prefix)) {
        continue;
      }

      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as { updatedAt?: string; homeworkList?: StoredHomeworkItem[] };
      if (!Array.isArray(parsed.homeworkList) || parsed.homeworkList.length === 0) {
        continue;
      }

      items.push({
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : new Date(key.slice(prefix.length)).getTime(),
        homeworkList: parsed.homeworkList.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description ?? '',
          dueDate: item.dueDate,
          status: 'pending',
          type: 'homework',
        })),
      });
    }

    items.sort((a, b) => b.updatedAt - a.updatedAt);
    return items[0]?.homeworkList || [];
  } catch {
    return [];
  }
}

function isDueWithin24Hours(dueDate: string) {
  if (!dueDate) {
    return false;
  }

  const deadline = new Date(`${dueDate}T23:59:59`);
  const hoursUntilDeadline = deadline.getTime() - Date.now();
  return hoursUntilDeadline >= 0 && hoursUntilDeadline <= 24 * 60 * 60 * 1000;
}

const MOCK_UPCOMING_ASSESSMENTS: UpcomingAssessment[] = [
  {
    id: 'assess-1',
    title: 'Fractions & Ratios Quiz',
    date: '2026-04-14',
    type: 'quiz',
    duration: '20 minutes',
  },
  {
    id: 'assess-2',
    title: 'Mid-Term Math Exam',
    date: '2026-04-21',
    type: 'exam',
    duration: '45 minutes',
  },
];

const MOCK_TEACHER_COMMENTS: TeacherComment[] = [
  {
    id: 'tc-1',
    date: '2026-04-09',
    comment: 'Israel is struggling with long division. Please practice at home.',
    isPriority: true,
  },
  {
    id: 'tc-2',
    date: '2026-04-08',
    comment: 'Great participation in the fractions visualization activity today.',
    isPriority: false,
  },
  {
    id: 'tc-3',
    date: '2026-04-06',
    comment: 'Keep reinforcing ratio concepts. Good start this week.',
    isPriority: false,
  },
];

const MOCK_PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'q-1',
    question: 'Which fraction is equivalent to 2/4?',
    type: 'mcq',
    options: ['1/2', '2/8', '3/6', '4/8'],
    correctAnswer: '1/2',
    explanation: 'Both 2/4 and 1/2 represent the same value when simplified.',
  },
  {
    id: 'q-2',
    question: 'Simplify the ratio 6:9.',
    type: 'short_answer',
    correctAnswer: '2:3',
    explanation: 'Divide both sides by the greatest common divisor, which is 3.',
  },
  {
    id: 'q-3',
    question: 'If 3 apples cost ₦150, how much do 5 apples cost?',
    type: 'short_answer',
    correctAnswer: '₦250',
    explanation: 'Cost per apple is ₦50. So 5 apples = 5 × ₦50 = ₦250.',
  },
  {
    id: 'q-4',
    question: 'What is 5/8 as a decimal?',
    type: 'mcq',
    options: ['0.625', '0.58', '0.85', '0.5'],
    correctAnswer: '0.625',
    explanation: 'Divide 5 by 8: 5 ÷ 8 = 0.625.',
  },
];

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

function defaultWeeklyTimetable(classId: string): WeeklyDaySchedule[] {
  void classId;
  return [
    {
      day: 'Monday',
      periods: [
        { time: '08:00-08:45', subject: 'Mathematics', teacherName: 'Mrs. Adeyemi', room: 'Block A - 2' },
        { time: '08:50-09:35', subject: 'English', teacherName: 'Mr. Bello', room: 'Block A - 2' },
      ],
    },
    {
      day: 'Tuesday',
      periods: [
        { time: '08:00-08:45', subject: 'Science', teacherName: 'Ms. Danjuma', room: 'Lab 1' },
        { time: '08:50-09:35', subject: 'Mathematics', teacherName: 'Mrs. Adeyemi', room: 'Block A - 2' },
      ],
    },
    {
      day: 'Wednesday',
      periods: [
        { time: '08:00-08:45', subject: 'Civic Education', teacherName: 'Mr. Bako', room: 'Block B - 1' },
        { time: '08:50-09:35', subject: 'Mathematics', teacherName: 'Mrs. Adeyemi', room: 'Block A - 2' },
      ],
    },
    {
      day: 'Thursday',
      periods: [
        { time: '08:00-08:45', subject: 'English', teacherName: 'Mr. Bello', room: 'Block A - 2' },
        { time: '08:50-09:35', subject: 'Science', teacherName: 'Ms. Danjuma', room: 'Lab 1' },
      ],
    },
    {
      day: 'Friday',
      periods: [
        { time: '08:00-08:45', subject: 'Mathematics', teacherName: 'Mrs. Adeyemi', room: 'Block A - 2' },
        { time: '08:50-09:35', subject: 'Revision', teacherName: 'Mrs. Adeyemi', room: 'Block A - 2' },
      ],
    },
  ];
}

function defaultExamTimetable(classId: string): TimetableAssessment[] {
  return [
    {
      id: `${classId}-test-1`,
      classId,
      type: 'test',
      title: 'Fractions & Ratios Test',
      date: '2026-04-14',
      time: '10:00 AM',
      weighting: '15% of Term Grade',
      duration: '45 mins',
      venue: 'Block A - 2',
    },
    {
      id: `${classId}-test-2`,
      classId,
      type: 'test',
      title: 'Science Practical Checkpoint',
      date: '2026-04-18',
      time: '09:30 AM',
      weighting: '10% of Term Grade',
      duration: '35 mins',
      venue: 'Lab 1',
    },
    {
      id: `${classId}-exam-1`,
      classId,
      type: 'exam',
      title: 'End of Term Mathematics Exam',
      date: '2026-05-02',
      time: '09:00 AM',
      duration: '1 hr 30 mins',
      venue: 'Main Hall',
      itemsNeeded: 'Bring mathematical set and calculator.',
    },
    {
      id: `${classId}-exam-2`,
      classId,
      type: 'exam',
      title: 'End of Term English Exam',
      date: '2026-05-04',
      time: '11:00 AM',
      duration: '1 hr 15 mins',
      venue: 'Main Hall',
      itemsNeeded: 'Bring HB pencil and eraser.',
    },
  ];
}

function getDaysRemaining(date: string) {
  const now = new Date();
  const target = new Date(`${date}T00:00:00`);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function SubjectMasteryView({
  studentId,
  studentName,
  subjectName,
  teacherName,
  teacherPhotoUrl,
  classSize,
  currentAverage,
  classLabel = 'JSS1',
  classId = 'jss1',
  onBack,
}: SubjectMasteryViewProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<PracticeQuestion[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageTags, setMessageTags] = useState<string[]>([]);
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>('weekly');
  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyDaySchedule[]>([]);
  const [examTimetable, setExamTimetable] = useState<TimetableAssessment[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<HomeworkTask[]>(MOCK_CLASS_HOMEWORK);

  useEffect(() => {
    const nextSubject = `Query regarding ${studentName}'s progress in ${subjectName}`;
    setMessageSubject(nextSubject);
  }, [studentName, subjectName]);

  useEffect(() => {
    const classStore = readJsonFromStorage<Record<string, WeeklyDaySchedule[]>>('classTimetable', {});
    const examStore = readJsonFromStorage<Record<string, TimetableAssessment[]>>('examTimetable', {});

    const seededClassStore = classStore[classId]
      ? classStore
      : {
          ...classStore,
          [classId]: defaultWeeklyTimetable(classId),
        };
    const seededExamStore = examStore[classId]
      ? examStore
      : {
          ...examStore,
          [classId]: defaultExamTimetable(classId),
        };

    if (!classStore[classId]) {
      writeJsonToStorage('classTimetable', seededClassStore);
    }
    if (!examStore[classId]) {
      writeJsonToStorage('examTimetable', seededExamStore);
    }

    setWeeklyTimetable(seededClassStore[classId]);
    setExamTimetable(seededExamStore[classId]);
  }, [classId]);

  useEffect(() => {
    const syncHomework = () => {
      const savedHomework = getLatestHomeworkList(classId);
      setHomeworkItems(savedHomework.length > 0 ? savedHomework : MOCK_CLASS_HOMEWORK);
    };

    syncHomework();
    window.addEventListener('storage', syncHomework);
    return () => window.removeEventListener('storage', syncHomework);
  }, [classId]);

  const statusIcon = (status: HomeworkTask['status']) => {
    if (status === 'submitted') {
      return <CheckCircle2 size={16} className="text-green-600" />;
    }
    if (status === 'overdue') {
      return <AlertCircle size={16} className="text-red-600" />;
    }
    return <Clock size={16} className="text-amber-600" />;
  };

  const generatePracticeQuiz = () => {
    setGeneratedQuiz(MOCK_PRACTICE_QUESTIONS.slice(0, 5));
    setQuizMode(true);
    window.alert('AI Quiz generator simulated. In production, this would send the topic and learning objectives to an AI service.');
  };

  const performanceTrendData = [
    { label: 'Wk 1', score: 74 },
    { label: 'Wk 2', score: 79 },
    { label: 'Wk 3', score: 84 },
    { label: 'Wk 4', score: 81 },
    { label: 'Wk 5', score: 90 },
  ];

  const quickTags = ['Late Submission', 'Struggling with Topic', 'Health Update'];

  const tests = useMemo(
    () =>
      examTimetable
        .filter((item) => item.type === 'test')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [examTimetable],
  );

  const exams = useMemo(
    () =>
      examTimetable
        .filter((item) => item.type === 'exam')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [examTimetable],
  );

  const todayDayName = useMemo(() => {
    const dayIndex = new Date().getDay();
    const map: Record<number, WeeklyDaySchedule['day']> = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
    };
    return map[dayIndex];
  }, []);

  const submitTeacherMessage = () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      window.alert('Please add both subject and message body before sending.');
      return;
    }

    const store = readJsonFromStorage<TeacherMessage[]>('messages', []);
    const payload: TeacherMessage = {
      id: `msg-${Date.now()}`,
      studentId,
      subjectId: `${classId}-${subjectName.toLowerCase().replace(/\s+/g, '-')}`,
      subjectName,
      teacherName,
      title: messageSubject.trim(),
      body: messageBody.trim(),
      tags: messageTags,
      createdAt: new Date().toISOString(),
      source: 'parent-dashboard',
    };
    writeJsonToStorage('messages', [payload, ...store]);

    setMessageBody('');
    setMessageTags([]);
    setIsMessageModalOpen(false);
    window.alert('Message sent to teacher inbox.');
  };

  const appendQuickTag = (tag: string) => {
    setMessageTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    setMessageBody((prev) => {
      const prefix = prev.trim().length === 0 ? '' : `${prev}\n`;
      return `${prefix}[${tag}] `;
    });
  };

  const saveScheduleToDevice = () => {
    const lines = [
      `Schedule Export - ${studentName}`,
      `Class: ${classLabel}`,
      `Subject: ${subjectName}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Weekly Timetable',
      ...weeklyTimetable.flatMap((day) => [
        `${day.day}`,
        ...day.periods.map((period) => `- ${period.time} | ${period.subject} | ${period.teacherName} | ${period.room}`),
      ]),
      '',
      'Tests',
      ...tests.map((item) => `- ${item.title} | ${item.date} ${item.time} | ${item.weighting ?? 'N/A'}`),
      '',
      'Exams',
      ...exams.map((item) => `- ${item.title} | ${item.date} ${item.time} | ${item.duration} | ${item.venue ?? 'N/A'}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `academic-schedule-${studentId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    window.alert('Timetable saved to your device.');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Academic
        </Button>
        <h1 className="text-3xl font-bold">{subjectName}</h1>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Teacher</p>
            <p className="font-medium">{teacherName}</p>
            {teacherPhotoUrl && (
              <img src={teacherPhotoUrl} alt={teacherName} className="h-12 w-12 rounded-full mt-2" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Class Size</p>
            <p className="text-2xl font-semibold">{classSize} students</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Average</p>
            <p className="text-2xl font-semibold text-blue-600">{currentAverage}%</p>
            {currentAverage >= 80 && <Badge variant="approved">Excellent</Badge>}
            {currentAverage >= 70 && currentAverage < 80 && <Badge variant="pending">Good</Badge>}
            {currentAverage < 70 && <Badge variant="rejected">Needs improvement</Badge>}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">For you</p>
            <p className="text-sm">Personalized view for {studentName}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setIsMessageModalOpen(true)}>
              <MessageSquare size={14} /> Message Teacher
            </Button>
          </div>
        </div>
      </Card>

      <Card title="📋 Teacher's Weekly Summary">
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-sm leading-relaxed">{MOCK_TEACHER_WEEKLY_SUMMARY}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="📚 Active Tasks & Assignments">
            <div className="space-y-2">
              {homeworkItems.length === 0 && <p className="text-sm text-muted-foreground">No homework set for today.</p>}
              {homeworkItems.map((task) => {
                const dueSoon = isDueWithin24Hours(task.dueDate);

                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div className="mt-1">{statusIcon(task.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge variant={dueSoon ? 'rejected' : 'pending'}>{dueSoon ? 'Due Soon' : 'Homework'}</Badge>
                      </div>
                      {task.description ? <p className="text-sm text-muted-foreground">{task.description}</p> : null}
                      <p className={`text-xs mt-1 ${dueSoon ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ClipboardCheck size={14} />
                      <span>Checklist</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="🗓️ Upcoming Assessments (Next 14 Days)">
            <div className="space-y-2">
              {MOCK_UPCOMING_ASSESSMENTS.map((assess) => (
                <div key={assess.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{assess.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(assess.date).toLocaleDateString()} · {assess.duration}
                    </p>
                  </div>
                  <Badge variant="default">{assess.type}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="💬 Teacher's Special Comments (Your Child)">
            <div className="space-y-3">
              {MOCK_TEACHER_COMMENTS.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg border ${
                    comment.isPriority ? 'border-red-300 bg-red-50' : 'border-border bg-accent/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {comment.isPriority && <AlertCircle size={16} className="text-red-600 mt-1 flex-shrink-0" />}
                    <div>
                      <p className="text-sm">{comment.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="📈 Performance Trend">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="🏦 School Bank (Past Papers & Resources)">
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                <span className="text-sm">Past Math Exam 2025</span>
                <Download size={16} />
              </button>
              <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                <span className="text-sm">Fractions Study Guide</span>
                <Download size={16} />
              </button>
              <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                <span className="text-sm">Video Lessons (Ratios)</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </Card>
        </div>
      </div>

      <Card title="🧠 Practice & Quiz Engine">
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50">
            <p className="text-sm mb-3">Generate AI-powered practice questions tailored to your child's current level.</p>
            <Button onClick={generatePracticeQuiz} disabled={quizMode}>
              <BrainCircuit size={16} /> Generate Practice Quiz (5–10 Questions)
            </Button>
          </div>

          {quizMode && generatedQuiz.length > 0 && (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
              <p className="font-medium mb-3">Generated Quiz - Topic: Fractions & Ratios</p>
              <div className="space-y-3">
                {generatedQuiz.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setSelectedQuestion(question)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-background transition-colors"
                  >
                    <p className="font-medium text-sm">
                      Q{index + 1}: {question.question}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Click to see answer & explanation</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card
        title="Schedule Command Center"
        action={
          <Button size="sm" variant="outline" onClick={saveScheduleToDevice}>
            <Download size={14} /> Save to Device
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant={scheduleTab === 'weekly' ? 'primary' : 'outline'} onClick={() => setScheduleTab('weekly')}>
            <CalendarDays size={14} /> Weekly Class Timetable
          </Button>
          <Button size="sm" variant={scheduleTab === 'tests' ? 'primary' : 'outline'} onClick={() => setScheduleTab('tests')}>
            <ClipboardCheck size={14} /> Test Timetable
          </Button>
          <Button size="sm" variant={scheduleTab === 'exams' ? 'primary' : 'outline'} onClick={() => setScheduleTab('exams')}>
            <AlertCircle size={14} /> Exam Timetable
          </Button>
        </div>

        {scheduleTab === 'weekly' && (
          <div className="space-y-3">
            <div className="hidden md:grid md:grid-cols-5 gap-2">
              {weeklyTimetable.map((day) => (
                <div
                  key={day.day}
                  className={`rounded-lg border p-2 ${day.day === todayDayName ? 'border-blue-300 bg-blue-50' : ''}`}
                >
                  <p className="font-medium text-sm mb-2">{day.day}</p>
                  <div className="space-y-2">
                    {day.periods.map((period, idx) => (
                      <div key={`${day.day}-${idx}`} className="rounded border p-2">
                        <p className="text-xs font-medium">{period.time}</p>
                        <p className="text-sm">{period.subject}</p>
                        <p className="text-xs text-muted-foreground">{period.teacherName}</p>
                        <p className="text-xs text-muted-foreground">{period.room}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="md:hidden space-y-2">
              {weeklyTimetable.map((day) => (
                <div
                  key={`mobile-${day.day}`}
                  className={`rounded-lg border p-3 ${day.day === todayDayName ? 'border-blue-300 bg-blue-50' : ''}`}
                >
                  <p className="font-medium mb-2">{day.day}</p>
                  <div className="space-y-2">
                    {day.periods.map((period, idx) => (
                      <div key={`m-${day.day}-${idx}`} className="rounded border p-2">
                        <p className="text-xs font-medium">{period.time}</p>
                        <p className="text-sm">{period.subject}</p>
                        <p className="text-xs text-muted-foreground">{period.teacherName} • {period.room}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scheduleTab === 'tests' && (
          <div className="space-y-2">
            {tests.map((item) => (
              <div key={item.id} className="rounded-lg border border-orange-300 bg-orange-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="pending">{getDaysRemaining(item.date)} day(s) remaining</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(item.date).toLocaleDateString()} • {item.time} • {item.weighting ?? 'Weighting not set'}
                </p>
              </div>
            ))}
            {tests.length === 0 && <p className="text-sm text-muted-foreground">No tests scheduled.</p>}
          </div>
        )}

        {scheduleTab === 'exams' && (
          <div className="space-y-2">
            {exams.map((item) => (
              <div key={item.id} className="rounded-lg border border-red-300 bg-red-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="rejected">{getDaysRemaining(item.date)} day(s) remaining</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(item.date).toLocaleDateString()} • {item.time} • {item.duration} • {item.venue ?? 'Venue TBD'}
                </p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Items Needed:</span> {item.itemsNeeded ?? 'Follow official exam instructions.'}
                </p>
              </div>
            ))}
            {exams.length === 0 && <p className="text-sm text-muted-foreground">No exams scheduled.</p>}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={`Messaging ${teacherName} (${subjectName} - ${classLabel})`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMessageModalOpen(false)}>Cancel</Button>
            <Button onClick={submitTeacherMessage}>Send Message</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input
              value={messageSubject}
              onChange={(event) => setMessageSubject(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Quick Tags</p>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <Button key={tag} size="sm" variant="outline" onClick={() => appendQuickTag(tag)}>
                  {tag}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              rows={6}
              placeholder="Type your concern to the subject teacher..."
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            />
          </div>
          {messageTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {messageTags.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={selectedQuestion !== null}
        onClose={() => setSelectedQuestion(null)}
        title={selectedQuestion ? `Question ${MOCK_PRACTICE_QUESTIONS.indexOf(selectedQuestion) + 1}` : 'Question'}
        footer={<Button onClick={() => setSelectedQuestion(null)}>Close</Button>}
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedQuestion.question}</p>
              {selectedQuestion.type === 'mcq' && selectedQuestion.options && (
                <div className="mt-3 space-y-2">
                  {selectedQuestion.options.map((option) => (
                    <button
                      key={option}
                      className={`w-full text-left p-2 border rounded ${
                        option === selectedQuestion.correctAnswer
                          ? 'border-green-300 bg-green-50'
                          : 'border-border'
                      }`}
                    >
                      {option} {option === selectedQuestion.correctAnswer && '✓ Correct'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
              <p className="text-sm font-medium mb-1">Correct Answer:</p>
              <p className="text-sm">{selectedQuestion.correctAnswer}</p>
            </div>

            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm">{selectedQuestion.explanation}</p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedQuestion.question);
                window.alert('Question copied to clipboard. You can now share with your child.');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2 hover:bg-accent"
            >
              <Copy size={16} /> Copy Question to Share
            </button>
          </div>
        )}
      </Modal>

      <Card className="bg-muted/30">
        <p className="text-sm text-muted-foreground">
          💡 <span className="font-medium">Pro Tip:</span> Use these resources to support your child's learning. The AI Quiz Engine is personalized to their current mastery level. Teacher comments are tailored observations specific to your child.
        </p>
      </Card>
    </div>
  );
}
