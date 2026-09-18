import { Building2, ChevronRight, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const postLoginPayloadKey = 'post-login-response';

type SchoolAssignment = {
  school_id?: string;
  school_name?: string;
  role?: string;
  school_status?: string;
  setup_stage?: string;
};

type Student = {
  id?: string;
  student_id?: string;
  uuid?: string;
  fullName?: string;
  name?: string;
  className?: string;
  class_name?: string;
};

type LoginPayload = {
  data?: {
    user?: Record<string, unknown>;
    schools?: SchoolAssignment[];
    students?: Student[];
  };
};

const readPayload = (): LoginPayload => {
  const rawPayload = localStorage.getItem(postLoginPayloadKey);
  if (!rawPayload) return {};

  try {
    return JSON.parse(rawPayload) as LoginPayload;
  } catch {
    return {};
  }
};

const getFirstName = (user?: Record<string, unknown>): string | null => {
  const candidate = user?.firstName || user?.first_name || user?.name || user?.fullName || user?.full_name;
  if (typeof candidate !== 'string' || !candidate.trim()) return null;
  return candidate.trim().split(/\s+/)[0] || null;
};

const getStudentId = (student: Student) => student.id || student.student_id || student.uuid || '';
const getStudentName = (student: Student) => student.fullName || student.name || 'Student';
const getStudentClass = (student: Student) => student.className || student.class_name || 'Student profile';

const statusPresentation = (school: SchoolAssignment) => {
  const status = school.school_status?.trim().toLowerCase();
  const setupStage = school.setup_stage?.trim().toLowerCase();

  if (status === 'active' || status === 'completed') {
    return { label: school.school_status || 'Active', className: 'status-present' };
  }
  if (status === 'pending' || status === 'setup_incomplete' || setupStage === 'pending') {
    return { label: school.school_status || 'Setup pending', className: 'status-pending' };
  }
  return { label: school.school_status || 'Unknown status', className: 'status-viewonly' };
};

export function AccountHubPage() {
  const navigate = useNavigate();
  const [guardianNotice, setGuardianNotice] = useState(false);
  const payload = readPayload();
  const schools = Array.isArray(payload.data?.schools) ? payload.data.schools : [];
  const students = Array.isArray(payload.data?.students) ? payload.data.students : [];
  const firstName = getFirstName(payload.data?.user);
  const isEmpty = schools.length === 0 && students.length === 0;

  return (
    <main className="min-h-screen bg-paper px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b border-slate/25 pb-6">
          <p className="text-sm font-medium text-slate">Account hub</p>
          <h1 className="mt-1 text-ink">{firstName ? `Welcome, ${firstName}` : 'Your account'}</h1>
          <p className="mt-2 max-w-xl text-sm text-slate">Choose an existing space or select how you would like to get started.</p>
        </header>

        {schools.length > 0 ? (
          <section className="mt-8" aria-labelledby="your-schools">
            <h2 id="your-schools" className="text-ink">Your Schools</h2>
            <div className="mt-3 overflow-hidden rounded-md border border-slate/25 bg-white">
              {schools.map((school, index) => {
                const status = statusPresentation(school);
                return (
                  <button
                    key={`${school.school_id || school.school_name || 'school'}-${index}`}
                    type="button"
                    onClick={() => navigate(`/select-school?schoolId=${encodeURIComponent(school.school_id || '')}`)}
                    className="flex w-full items-center gap-3 border-b border-slate/15 px-4 py-4 text-left last:border-b-0 hover:bg-paper focus-visible:bg-paper"
                  >
                    <Building2 className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{school.school_name || school.school_id || 'School'}</span>
                      <span className="mt-1 inline-flex rounded-sm bg-ink/8 px-2 py-0.5 text-xs font-medium capitalize text-ink">{school.role || 'Staff'}</span>
                    </span>
                    <span className={`rounded-sm px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {students.length > 0 ? (
          <section className="mt-8" aria-labelledby="your-students">
            <h2 id="your-students" className="text-ink">Your Students</h2>
            <div className="mt-3 overflow-hidden rounded-md border border-slate/25 bg-white">
              {students.map((student, index) => {
                const studentId = getStudentId(student);
                return (
                  <button
                    key={studentId || `${getStudentName(student)}-${index}`}
                    type="button"
                    onClick={() => studentId && navigate(`/select-student?studentId=${encodeURIComponent(studentId)}`)}
                    disabled={!studentId}
                    className="flex w-full items-center gap-3 border-b border-slate/15 px-4 py-4 text-left last:border-b-0 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UsersRound className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{getStudentName(student)}</span>
                      <span className="block text-sm text-slate">{getStudentClass(student)}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {isEmpty ? (
          <section className="mt-8" aria-labelledby="get-started">
            <h2 id="get-started" className="text-ink">Get Started</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <button type="button" onClick={() => navigate('/auth/onboarding/school')} className="rounded-md border border-slate/25 bg-white p-4 text-left hover:border-register-green hover:bg-register-green/5">
                <Building2 className="h-5 w-5 text-register-green" aria-hidden="true" />
                <h3 className="mt-4 text-ink">Register a School</h3>
                <p className="mt-1 text-sm text-slate">Set up your school and invite your staff.</p>
              </button>
              <button type="button" onClick={() => navigate('/auth/onboarding/teacher')} className="rounded-md border border-slate/25 bg-white p-4 text-left hover:border-register-green hover:bg-register-green/5">
                <GraduationCap className="h-5 w-5 text-register-green" aria-hidden="true" />
                <h3 className="mt-4 text-ink">Standalone Teacher</h3>
                <p className="mt-1 text-sm text-slate">Set up your own personal classroom — no school required.</p>
              </button>
              <button type="button" onClick={() => setGuardianNotice(true)} className="rounded-md border border-slate/25 bg-white p-4 text-left hover:bg-paper" aria-describedby={guardianNotice ? 'guardian-unavailable' : undefined}>
                <UsersRound className="h-5 w-5 text-slate" aria-hidden="true" />
                <span className="mt-3 inline-flex rounded-sm bg-slate/10 px-2 py-0.5 text-xs font-medium text-slate">Coming soon</span>
                <h3 className="mt-2 text-ink">Register as a Guardian</h3>
                <p className="mt-1 text-sm text-slate">Link to your child's school.</p>
              </button>
            </div>
            {guardianNotice ? <p id="guardian-unavailable" className="mt-3 text-sm text-slate">Guardian registration isn't available yet.</p> : null}
          </section>
        ) : null}

        {/* TODO: replace with real SafePass copy */}
        <section className="mt-10 border-t border-slate/20 pt-5" aria-label="SafePass">
          <div className="flex items-start gap-3 text-slate">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">SafePass placeholder: your account and school access are protected with secure sign-in controls.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
