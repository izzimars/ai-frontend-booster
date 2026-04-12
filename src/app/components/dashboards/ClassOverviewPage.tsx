import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageSquare, Pill } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';

type TeacherClassRole = 'classTeacher' | 'subjectTeacher';

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
    medicationDueToday?: boolean;
    unreadGuardianMessages?: number;
  }>;
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
      { id: 's1', name: 'Sarah Johnson', attendance: '96%', medicationDueToday: true, unreadGuardianMessages: 2 },
      { id: 's2', name: 'Michael Brown', attendance: '91%', medicationDueToday: false, unreadGuardianMessages: 1 },
      { id: 's3', name: 'Emily Davis', attendance: '94%', medicationDueToday: false, unreadGuardianMessages: 0 },
    ],
  },
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    className: 'Science 10A',
    teacherRole: 'subjectTeacher',
    mySubject: 'Science',
    subjectOversight: [
      { subject: 'Mathematics', teacher: 'Mrs. Johnson', syllabusStatus: 'approved' },
      { subject: 'English', teacher: 'Mr. Carter', syllabusStatus: 'submitted' },
    ],
    studentRoster: [
      { id: 's6', name: 'Daniel Kent', attendance: '97%', medicationDueToday: true, unreadGuardianMessages: 0 },
      { id: 's7', name: 'Laura James', attendance: '92%', medicationDueToday: false, unreadGuardianMessages: 3 },
    ],
  },
  'b2c3d4e5-f6g7-8901-efgh-123456789012': {
    id: 'b2c3d4e5-f6g7-8901-efgh-123456789012',
    className: 'Math 10B',
    teacherRole: 'subjectTeacher',
    mySubject: 'Mathematics',
    subjectOversight: [],
    studentRoster: [
      { id: 's4', name: 'Isaac Cole', attendance: '89%', medicationDueToday: false, unreadGuardianMessages: 0 },
      { id: 's5', name: 'Nora White', attendance: '93%', medicationDueToday: false, unreadGuardianMessages: 1 },
    ],
  },
};

function toSubjectId(subject: string) {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function ClassOverviewPage() {
  const navigate = useNavigate();
  const { classId } = useParams();

  const fallbackClassId = useMemo(() => Object.keys(classMetadataById)[0], []);
  const effectiveClassId = classId || fallbackClassId;

  const classMeta = useMemo(() => (effectiveClassId ? classMetadataById[effectiveClassId] : undefined), [effectiveClassId]);

  if (!classMeta) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
          </Button>
        </div>
        <Card title="Class Not Found">
          <p className="text-muted-foreground">No class metadata found for the provided class_id.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            <Link to="/" className="hover:underline">Home</Link> <span className="mx-1">&gt;</span> Class <span className="mx-1">&gt;</span> {classMeta.className}
          </div>
          <h1 className="text-2xl">{classMeta.className}</h1>
          <p className="text-sm text-muted-foreground mt-1">Class oversight workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={classMeta.teacherRole === 'classTeacher' ? 'approved' : 'default'}>
            {classMeta.teacherRole === 'classTeacher' ? 'Class Teacher' : 'Subject Teacher'}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => navigate(`/teacher/class-command-center/${classMeta.id}`)}>
            Open Class Command Center
          </Button>
        </div>
      </div>

      <Card title="Subject Oversight">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {classMeta.subjectOversight.map((item) => (
            <button
              key={`${item.subject}-${item.teacher}`}
              type="button"
              className="border border-border rounded-lg p-4 bg-accent/20 text-left hover:bg-accent/30 transition-colors"
              onClick={() => navigate(`/class/${classMeta.id}/subject/${toSubjectId(item.subject)}`)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{item.subject}</p>
                <Badge variant={item.syllabusStatus as any}>{item.syllabusStatus}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Teacher: {item.teacher}</p>
              <div className="mt-3 inline-flex items-center text-sm text-primary">
                Open subject workspace <ChevronRight size={14} className="ml-1" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Student Roster">
        <div className="mt-1 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="text-left py-2">Student</th>
                <th className="text-left py-2">Attendance</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {classMeta.studentRoster.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border cursor-pointer transition-colors hover:bg-accent/40"
                  onClick={() => navigate(`/teacher/student-detail/${student.id}`)}
                >
                  <td className="py-2">{student.name}</td>
                  <td className="py-2">{student.attendance}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {student.medicationDueToday && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2 py-1 text-xs" title="Medication due today">
                          <Pill size={12} /> Medical
                        </span>
                      )}
                      {(student.unreadGuardianMessages ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs" title="Unread guardian messages">
                          <MessageSquare size={12} /> {student.unreadGuardianMessages}
                        </span>
                      )}
                      {!student.medicationDueToday && (student.unreadGuardianMessages ?? 0) === 0 && (
                        <span className="text-xs text-muted-foreground">No alerts</span>
                      )}
                    </div>
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
