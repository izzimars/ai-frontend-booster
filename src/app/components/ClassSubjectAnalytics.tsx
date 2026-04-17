import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type SubjectKpis = {
  subjectAverage: number;
  highestScore: number;
  lowestScore: number;
  teacherComplianceRate: number | null;
};

type SubjectTrendPoint = {
  termLabel: string;
  average: number;
  passRate: number;
};

type ClassPerformancePoint = {
  className: string;
  averageScore: number;
  passRate: number;
  attendanceRate: number;
};

type SubjectPerformanceItem = {
  subject: string;
  average: number;
  passRate: number;
};

type DeepDiveTrendPoint = {
  week: string;
  average: number;
};

type GradeDistributionPoint = {
  grade: string;
  count: number;
};

type AtRiskStudent = {
  id: string;
  name: string;
  cumulativeAverage: number;
};

export interface ClassSubjectAnalyticsProps {
  selectedClass: { id: string; className: string } | null;
  selectedSubjectId: string | null;
  onSelectSubject: (subjectId: string | null) => void;
  subjectKpis?: SubjectKpis;
  subjectTrendData: SubjectTrendPoint[];
  classPerformanceData: ClassPerformancePoint[];
  subjectPerformanceList: SubjectPerformanceItem[];
  deepDiveTrendData: DeepDiveTrendPoint[];
  gradeDistributionData: GradeDistributionPoint[];
  atRiskStudents: AtRiskStudent[];
}

export function ClassSubjectAnalytics({
  selectedClass,
  selectedSubjectId,
  onSelectSubject,
  subjectKpis,
  subjectTrendData,
  classPerformanceData,
  subjectPerformanceList,
  deepDiveTrendData,
  gradeDistributionData,
  atRiskStudents,
}: ClassSubjectAnalyticsProps) {
  if (!selectedClass) return null;

  return (
    <>
      {selectedSubjectId && subjectKpis ? (
        <div className="relative">
          <Card title={`Specific Subject Analysis: ${selectedSubjectId} • ${selectedClass.className}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Subject Average</p>
                <p className="text-2xl font-bold mt-2">{subjectKpis.subjectAverage}%</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold mt-2">{subjectKpis.highestScore}%</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Lowest Score</p>
                <p className="text-2xl font-bold mt-2">{subjectKpis.lowestScore}%</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Teacher Compliance Rate</p>
                <p className="text-2xl font-bold mt-2">
                  {subjectKpis.teacherComplianceRate === null ? 'N/A' : `${subjectKpis.teacherComplianceRate}%`}
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={subjectTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="termLabel" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={3} name="Average Score" />
                <Line type="monotone" dataKey="passRate" stroke="#16a34a" strokeWidth={2} strokeDasharray="6 4" name="Pass Rate" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Score Distribution by Class">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={classPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="averageScore" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Pass Rate vs Attendance Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={classPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="passRate" stroke="#16a34a" strokeWidth={2} name="Pass Rate" />
              <Line yAxisId="right" type="monotone" dataKey="attendanceRate" stroke="#f59e0b" strokeWidth={2} name="Attendance" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card
        title={`Class Deep Dive: ${selectedClass.className}`}
        action={
          selectedSubjectId ? (
            <Button size="sm" variant="outline" onClick={() => onSelectSubject(null)}>
              Clear Filter
            </Button>
          ) : null
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Subject-Level Metrics</p>
            <div className="space-y-2">
              {subjectPerformanceList.map((subjectRow) => (
                <div
                  key={subjectRow.subject}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    selectedSubjectId === subjectRow.subject
                      ? 'border-primary bg-accent/30'
                      : 'border-border hover:bg-muted/30'
                  }`}
                  onClick={() => {
                    const nextSubject = selectedSubjectId === subjectRow.subject ? null : subjectRow.subject;
                    onSelectSubject(nextSubject);
                  }}
                >
                  <div className="flex justify-between text-sm">
                    <span>{subjectRow.subject}</span>
                    <Badge variant="default">Avg {subjectRow.average}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pass Rate: {subjectRow.passRate}%</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">
              {selectedSubjectId ? `${selectedSubjectId} Performance Trend` : 'Grade Distribution Histogram'}
            </p>
            {selectedSubjectId ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={deepDiveTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="average" stroke="#6366f1" strokeWidth={2.5} name="Weekly Average" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gradeDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-2">
              At-Risk Students (&lt; 40%) {selectedSubjectId ? `- ${selectedSubjectId}` : ''}
            </p>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {atRiskStudents.length > 0 ? (
                atRiskStudents.map((student) => (
                  <div key={student.id} className="p-2 border border-red-200 bg-red-50 dark:bg-red-950/30 rounded">
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {selectedSubjectId ? 'Subject Average' : 'Cumulative Average'}: {student.cumulativeAverage}%
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 border border-dashed rounded text-sm text-muted-foreground">
                  No at-risk students found for this {selectedSubjectId ? 'subject' : 'class'} in the selected range.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
