import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Route, Users } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { classes, classSubjectMapping, staff } from './AdminDashboard';
import { getClassStudents } from './classDrilldownData';

export function ClassDetailView() {
  const navigate = useNavigate();
  const { classId } = useParams();

  const selectedClassId = Number(classId);

  const classRecord = useMemo(
    () => classes.find((entry) => entry.id === selectedClassId) || null,
    [selectedClassId],
  );

  const assignedTeacher = useMemo(() => {
    if (!classRecord) return null;
    return staff.find((member) => member.id === classRecord.teacherId) || null;
  }, [classRecord]);

  const subjects = useMemo(
    () => (classRecord ? classSubjectMapping.filter((mapping) => mapping.classId === classRecord.id) : []),
    [classRecord],
  );

  const students = useMemo(
    () => (classRecord ? getClassStudents(classRecord.id) : []),
    [classRecord],
  );

  if (!classRecord || Number.isNaN(selectedClassId)) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} className="mr-2" />Back to Admin Dashboard
        </Button>
        <Card title="Class not found">
          <p className="text-sm text-muted-foreground">
            The class you requested does not exist in the current mock data.
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
            <Link to="/" className="hover:text-foreground">
              Admin Dashboard
            </Link>
            <span>/</span>
            <span>Class Details</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{classRecord.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Assigned Form Teacher: <span className="font-medium text-foreground">{assignedTeacher?.name || classRecord.teacher}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/teacher/class-command-center">
            <Button variant="outline">
              <Route size={16} className="mr-2" />Class Command Center
            </Button>
          </Link>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft size={16} className="mr-2" />Back to Admin Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <Users size={16} className="text-blue-600" />
          </div>
          <p className="mt-2 text-3xl font-bold">{students.length}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Capacity</p>
            <GraduationCap size={16} className="text-violet-600" />
          </div>
          <p className="mt-2 text-3xl font-bold">{classRecord.capacity}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Subject Count</p>
            <BookOpen size={16} className="text-green-600" />
          </div>
          <p className="mt-2 text-3xl font-bold">{subjects.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Class Profile">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="default">{classRecord.category}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Teacher</span>
              <span className="font-medium">{assignedTeacher?.name || classRecord.teacher}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Teacher Role</span>
              <span>{assignedTeacher?.role || 'Teacher'}</span>
            </div>
          </div>
        </Card>

        <Card title="Assigned Subjects" className="xl:col-span-2">
          <div className="flex flex-wrap gap-2">
            {subjects.map((mapping) => (
              <Badge key={`${mapping.classId}-${mapping.subject}`} variant="approved">
                {mapping.subject}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Student List">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2">Student Name</th>
                <th className="py-2">Student ID</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/admin/classes/${classRecord.id}/students/${student.id}`)}
                >
                  <td className="py-2 font-medium text-primary">{student.name}</td>
                  <td className="py-2 text-muted-foreground">{student.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
