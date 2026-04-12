import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronLeft, GraduationCap, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { classes, classSubjectMapping } from './AdminDashboard';
import { getStudentProfile, getSubjectPerformance, toSubjectSlug } from './classDrilldownData';

export function ClassSubjectAnalysisView() {
  const navigate = useNavigate();
  const { classId, studentId, subjectId } = useParams();

  const selectedClassId = Number(classId);

  const classRecord = useMemo(
    () => classes.find((entry) => entry.id === selectedClassId) || null,
    [selectedClassId],
  );

  const student = useMemo(
    () => (classRecord && studentId ? getStudentProfile(classRecord.id, studentId) : null),
    [classRecord, studentId],
  );

  const selectedSubject = useMemo(() => {
    if (!student || !subjectId) return null;
    return student.subjects.find((entry) => toSubjectSlug(entry.subject) === subjectId) || null;
  }, [student, subjectId]);

  const teacherName = useMemo(() => {
    if (!classRecord || !selectedSubject) return 'TBD';
    return classSubjectMapping.find((entry) => entry.classId === classRecord.id && entry.subject === selectedSubject.subject)?.teacher || classRecord.teacher;
  }, [classRecord, selectedSubject]);

  const performance = useMemo(() => {
    if (!classRecord || !student || !selectedSubject) return null;
    return getSubjectPerformance(student.id, classRecord.id, selectedSubject.subject);
  }, [classRecord, student, selectedSubject]);

  if (!classRecord || !student || !selectedSubject || !performance || Number.isNaN(selectedClassId)) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-2" />Back to Admin Dashboard
        </Button>
        <Card title="Subject analysis not found">
          <p className="text-sm text-muted-foreground">
            The subject analysis view is unavailable for the selected student.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground">Admin Dashboard</Link>
            <span>/</span>
            <Link to={`/admin/classes/${classRecord.id}`} className="hover:text-foreground">{classRecord.name}</Link>
            <span>/</span>
            <Link to={`/admin/classes/${classRecord.id}/students/${student.id}`} className="hover:text-foreground">{student.name}</Link>
            <span>/</span>
            <span>{selectedSubject.subject}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{student.name} - {selectedSubject.subject}</h1>
          <p className="mt-2 text-muted-foreground">
            Teacher: <span className="font-medium text-foreground">{teacherName}</span> • Class Position: <span className="font-medium text-foreground">#{selectedSubject.classPosition}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/classes/${classRecord.id}/students/${student.id}`)}>
            <ChevronLeft size={16} className="mr-2" />Back to Student Profile
          </Button>
          <Link to={`/admin/classes/${classRecord.id}`}>
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" />Back to Class Details
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Current Score</p>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <p className="mt-2 text-3xl font-bold">{performance.trend[performance.trend.length - 1]?.score ?? 0}%</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Teacher</p>
            <BookOpen size={16} className="text-violet-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{teacherName}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Class Position</p>
            <GraduationCap size={16} className="text-green-600" />
          </div>
          <p className="mt-2 text-3xl font-bold">#{selectedSubject.classPosition}</p>
        </Card>
      </div>

      <Card title="Score Trend">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Monthly Teacher Narratives">
        <div className="space-y-3">
          {performance.narratives.map((entry) => (
            <div key={`${selectedSubject.subject}-${entry.month}`} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <Badge variant="default">{entry.month}</Badge>
                <span className="text-sm text-muted-foreground">{teacherName}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{entry.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
