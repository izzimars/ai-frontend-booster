import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Save, ShieldCheck } from 'lucide-react';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Card } from '../Card';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AssessmentRecord,
  formatAssessmentStatus,
  formatAssessmentTimestamp,
  getAssessmentPercentage,
  loadAssessmentRecord,
  saveAssessmentRecord,
} from './assessmentUtils';

function subjectSlug(subject: string) {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function AssessmentManagerPage() {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    setAssessment(loadAssessmentRecord(assessmentId));
  }, [assessmentId]);

  const isLocked = assessment?.status === 'approved';

  const studentResults = assessment?.studentResults ?? [];

  const averageScore = useMemo(() => {
    if (!assessment) return null;
    const scored = assessment.studentResults.filter((item) => typeof item.score === 'number');
    if (!scored.length) return null;
    const total = scored.reduce((sum, item) => sum + (item.score || 0), 0);
    return Math.round((total / scored.length) * 100) / 100;
  }, [assessment]);

  const persistAssessment = (next: AssessmentRecord) => {
    const payload = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    saveAssessmentRecord(payload);
    setAssessment(payload);
  };

  const updateField = <K extends keyof AssessmentRecord>(key: K, value: AssessmentRecord[K]) => {
    setAssessment((current) => {
      if (!current) return current;
      return {
        ...current,
        [key]: value,
      };
    });
  };

  const updateStudentResult = (studentId: string, patch: Partial<AssessmentRecord['studentResults'][number]>) => {
    setAssessment((current) => {
      if (!current) return current;
      return {
        ...current,
        studentResults: current.studentResults.map((student) =>
          student.studentId === studentId ? { ...student, ...patch } : student,
        ),
      };
    });
  };

  const handleSaveDraft = () => {
    if (!assessment) return;
    persistAssessment({
      ...assessment,
      status: 'graded',
    });
  };

  const handleSubmitForApproval = () => {
    if (!assessment) return;
    const ok = window.confirm('This will lock the scores and send them to the HOD for cumulative processing.');
    if (!ok) return;

    setIsSubmitting(true);
    const next = {
      ...assessment,
      status: 'approved' as const,
    };
    persistAssessment(next);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 250);
  };

  if (!assessment) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <Card title="Assessment Not Found">
          <p className="text-muted-foreground">
            The assessment record is not available yet. Open it from a subject row after the class page seeds it.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
            <span>/</span>
            <Link to={`/class/${assessment.classId}/subject/${subjectSlug(assessment.subject)}`} className="hover:underline">
              {assessment.className}
            </Link>
            <span>/</span>
            <span>{assessment.title}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl">Assessment Manager</h1>
              <Badge variant={assessment.status === 'approved' ? 'approved' : assessment.status === 'graded' ? 'graded' : 'pending'}>
                {formatAssessmentStatus(assessment.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {assessment.className} - {assessment.subject} - Logged by {assessment.staff}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isLocked}>
            <Save size={16} className="mr-1" /> Save as Draft
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmitForApproval} disabled={isLocked || isSubmitting}>
            <ShieldCheck size={16} className="mr-1" /> Submit for Approval
          </Button>
        </div>
      </div>

      <Card
        title="Assessment Details"
        action={
          <Badge variant={assessment.useForCumulativeResult ? 'approved' : 'draft'}>
            {assessment.useForCumulativeResult ? 'Included in cumulative result' : 'Excluded from cumulative result'}
          </Badge>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <label className="block text-sm font-medium">Title</label>
            <Input
              value={assessment.title}
              disabled={isLocked}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Maximum Score</label>
            <Input
              type="number"
              min="1"
              value={assessment.maxScore}
              disabled={isLocked}
              onChange={(event) => updateField('maxScore', Number(event.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Weighting %</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={assessment.weighting}
              disabled={isLocked}
              onChange={(event) => updateField('weighting', Number(event.target.value) || 0)}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap rounded-lg border border-border bg-accent/20 px-4 py-3">
          <div>
            <p className="font-medium text-sm">Use for Cumulative Result</p>
            <p className="text-xs text-muted-foreground">Toggle this on for assessments that contribute to the cumulative calculation.</p>
          </div>
          <Switch
            checked={assessment.useForCumulativeResult}
            disabled={isLocked}
            onCheckedChange={(checked) => updateField('useForCumulativeResult', checked)}
          />
        </div>
      </Card>

      <Card
        title="Student Grid"
        action={
          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
            <span>{studentResults.length} students</span>
            <span>{averageScore === null ? 'No scores entered' : `Average: ${averageScore}/${assessment.maxScore}`}</span>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="w-40">Score</TableHead>
              <TableHead className="w-32">Percentage</TableHead>
              <TableHead>Remarks / Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentResults.map((student) => {
              const percentage = getAssessmentPercentage(student.score, assessment.maxScore);

              return (
                <TableRow key={student.studentId}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">Student ID: {student.studentId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={assessment.maxScore}
                      value={student.score ?? ''}
                      disabled={isLocked}
                      className="h-11 text-base"
                      onChange={(event) =>
                        updateStudentResult(student.studentId, {
                          score: event.target.value.trim() === '' ? null : Number(event.target.value),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-medium">
                      {percentage === null ? '—' : `${percentage}%`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={student.comment}
                      disabled={isLocked}
                      placeholder="Optional note"
                      onChange={(event) => updateStudentResult(student.studentId, { comment: event.target.value })}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card title="Review Summary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-accent/10 p-4">
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium mt-1">{formatAssessmentStatus(assessment.status)}</p>
          </div>
          <div className="rounded-lg border border-border bg-accent/10 p-4">
            <p className="text-muted-foreground">Average Score</p>
            <p className="font-medium mt-1">{averageScore === null ? 'No scores yet' : `${averageScore}/${assessment.maxScore}`}</p>
          </div>
          <div className="rounded-lg border border-border bg-accent/10 p-4">
            <p className="text-muted-foreground">Weighting</p>
            <p className="font-medium mt-1">{assessment.weighting}%</p>
          </div>
          <div className="rounded-lg border border-border bg-accent/10 p-4">
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium mt-1">{formatAssessmentTimestamp(assessment.createdAt)}</p>
          </div>
        </div>
      </Card>

      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <Check size={16} />
          This assessment is locked after approval.
        </div>
      )}
    </div>
  );
}
