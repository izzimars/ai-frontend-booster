import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Phone, UserRound } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { classes, classSubjectMapping, staff } from './AdminDashboard';
import { getStudentProfile, toSubjectSlug } from './classDrilldownData';

export function ClassStudentProfileView() {
  const navigate = useNavigate();
  const { classId, studentId } = useParams();

  const selectedClassId = Number(classId);

  const classRecord = useMemo(
    () => classes.find((entry) => entry.id === selectedClassId) || null,
    [selectedClassId],
  );

  const student = useMemo(
    () => (classRecord && studentId ? getStudentProfile(classRecord.id, studentId) : null),
    [classRecord, studentId],
  );

  const performanceRows = useMemo(() => {
    if (!classRecord || !student) return [];

    return student.subjects.map((subjectEntry) => {
      const mapping = classSubjectMapping.find((entry) => entry.classId === classRecord.id && entry.subject === subjectEntry.subject);
      return {
        ...subjectEntry,
        teacher: mapping?.teacher || classRecord.teacher,
        subjectSlug: toSubjectSlug(subjectEntry.subject),
      };
    });
  }, [classRecord, student]);

  if (!classRecord || !student || Number.isNaN(selectedClassId)) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-2" />Back to Admin Dashboard
        </Button>
        <Card title="Student not found">
          <p className="text-sm text-muted-foreground">
            The selected student is not available in the current class roster.
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
            <span>Student Profile</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent border border-border flex items-center justify-center text-xl font-semibold text-primary">
              {student.avatarInitials}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
              <p className="mt-1 text-muted-foreground">{classRecord.name} • Assigned Form Teacher: {classRecord.teacher}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/classes/${classRecord.id}`)}>
            <ArrowLeft size={16} className="mr-2" />Back to Class Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Guardian Details" className="lg:col-span-1">
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground">Guardian / Parent</p>
                <p className="font-medium">{student.guardianName}</p>
              </div>
              <Badge variant="default">{student.guardianRelationship}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} />
              <span>{student.guardianPhone}</span>
            </div>
            <div className="rounded-lg border border-border bg-accent/20 p-3">
              <p className="text-xs text-muted-foreground">Student ID</p>
              <p className="font-medium">{student.id}</p>
            </div>
          </div>
        </Card>

        <Card title="Class Snapshot" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Category</p>
                <GraduationCap size={16} className="text-violet-600" />
              </div>
              <p className="mt-2 text-xl font-semibold">{classRecord.category}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Capacity</p>
                <UserRound size={16} className="text-blue-600" />
              </div>
              <p className="mt-2 text-xl font-semibold">{classRecord.capacity}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Mapped Subjects</p>
                <BookOpen size={16} className="text-green-600" />
              </div>
              <p className="mt-2 text-xl font-semibold">{classSubjectMapping.filter((mapping) => mapping.classId === classRecord.id).length}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="approved">Form Teacher: {staff.find((member) => member.id === classRecord.teacherId)?.name || classRecord.teacher}</Badge>
          </div>
        </Card>
      </div>

      <Card title="Student Performance Table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2">Subject</th>
                <th className="py-2">Teacher</th>
                <th className="py-2">Class Position</th>
                <th className="py-2">Latest Score</th>
                <th className="py-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {performanceRows.map((row) => {
                const latestScore = row.trend[row.trend.length - 1]?.score ?? 0;
                return (
                  <tr
                    key={row.subject}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/admin/classes/${classRecord.id}/students/${student.id}/subjects/${row.subjectSlug}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/classes/${classRecord.id}/students/${student.id}/subjects/${row.subjectSlug}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <td className="py-2 font-medium text-primary">{row.subject}</td>
                    <td className="py-2">{row.teacher}</td>
                    <td className="py-2">
                      <Badge variant="default">#{row.classPosition}</Badge>
                    </td>
                    <td className="py-2">{latestScore}%</td>
                    <td className="py-2 text-muted-foreground">
                      {row.trend[0]?.score}% → {latestScore}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
