import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, User } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { completeSchoolOnboarding, completeTeacherOnboarding, type OnboardingResponse } from '../../../services/authService';
import { setStoredAuthToken } from '../../../api/client';
import { clearOnboardingToken, getGeneralToken, getOnboardingToken, setCurrentSchoolId } from '../../../services/apiClient';
import { getOnboardingRoute } from '../../auth/setupRoutes';
import { generateSchoolToken } from '../../../services/auth';

type OnboardingKind = 'school' | 'teacher';

function ProprietorOnboardingForm({ kind }: { kind: OnboardingKind }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', schoolName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [hasPersonalClassroom, setHasPersonalClassroom] = useState(false);
  const onboardingToken = getOnboardingToken();
  const generalToken = getGeneralToken();
  const authToken = onboardingToken || generalToken;

  useEffect(() => {
    if (!authToken) navigate('/auth/register', { replace: true });
  }, [authToken, navigate]);

  const handleInputChange = (field: keyof typeof form, value: string) => {
    if (error) setError(null);
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !authToken) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const schoolName = form.schoolName.trim();
    if (!firstName || !lastName) {
      setError('First and last name are required.');
      return;
    }
    if (kind === 'school' && !schoolName) {
      setError('School name is required when registering a school.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result: OnboardingResponse = kind === 'school'
        ? await completeSchoolOnboarding(authToken, firstName, lastName, schoolName)
        : await completeTeacherOnboarding(authToken, firstName, lastName);
      if (!result.success) {
        setError(result.message || 'Onboarding failed.');
        return;
      }
      if (!result.token) {
        setError('Onboarding completed, but the server did not return a session token. Please contact support.');
        return;
      }

      setStoredAuthToken(result.token, result.refreshToken);
      if (result.schoolId) {
        setCurrentSchoolId(result.schoolId);
        await generateSchoolToken(result.schoolId);
      }
      localStorage.setItem('setup_stage', result.setupStage || 'pending');
      clearOnboardingToken();
      localStorage.removeItem('registration_email');
      navigate(getOnboardingRoute(result.setupStage || 'pending'));
    } catch (requestError: unknown) {
      const axiosError = requestError as AxiosError<{ message?: string; code?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;
      const code = axiosError.response?.data?.code;
      if (status === 409 && (code === 'quota_exceeded' || message?.toLowerCase().includes('quota'))) {
        setIsQuotaExceeded(true);
        setError('Your school is on the free plan and has reached its quota. Upgrade to add more capacity.');
      } else if (status === 409 && message?.toLowerCase().includes('personal classroom')) {
        setHasPersonalClassroom(true);
        setError('You already have a personal classroom. You can only create one.');
      } else {
        setError(message || 'Onboarding failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authToken) return null;
  if (isQuotaExceeded) {
    return <AuthLayout title="Plan limit reached" subtitle=""><div className="text-center"><Building2 className="mx-auto h-12 w-12 text-flag-red" /><p className="mt-4 text-sm text-slate-600">Your school is on the free plan and has reached its student/classroom quota.</p><button type="button" onClick={() => navigate('/pricing')} className="mt-6 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90">Upgrade your plan</button></div></AuthLayout>;
  }
  if (hasPersonalClassroom) {
    return <AuthLayout title="Classroom already created" subtitle=""><div className="text-center"><p className="text-sm text-slate-600">You already have a personal classroom.</p><button type="button" onClick={() => navigate('/auth/login')} className="mt-6 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90">Sign in instead</button></div></AuthLayout>;
  }

  const isSchool = kind === 'school';
  return (
    <AuthLayout title={isSchool ? 'Register your school' : 'Set up your classroom'} subtitle={isSchool ? 'Tell us about you and your school.' : 'Tell us about yourself to create your personal classroom.'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <NameField id="onboarding-first-name" label="First Name" autoComplete="given-name" value={form.firstName} placeholder="Jane" onChange={(value) => handleInputChange('firstName', value)} />
        <NameField id="onboarding-last-name" label="Last Name" autoComplete="family-name" value={form.lastName} placeholder="Smith" onChange={(value) => handleInputChange('lastName', value)} />
        {isSchool ? <SchoolNameField value={form.schoolName} onChange={(value) => handleInputChange('schoolName', value)} /> : null}
        {error ? <AuthErrorAlert message={error} /> : null}
        <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{isSubmitting ? 'Finishing...' : isSchool ? 'Register school' : 'Create classroom'}
        </button>
      </form>
    </AuthLayout>
  );
}

function NameField({ id, label, autoComplete, value, placeholder, onChange }: { id: string; label: string; autoComplete: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><label className="text-sm font-medium text-slate-800" htmlFor={id}>{label}</label><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id={id} type="text" autoComplete={autoComplete} required value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10" placeholder={placeholder} /></div></div>;
}

function SchoolNameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><label className="text-sm font-medium text-slate-800" htmlFor="onboarding-school-name">School Name <span className="text-flag-red">*</span></label><div className="relative"><Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="onboarding-school-name" type="text" autoComplete="organization" required value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10" placeholder="My School Name" /></div></div>;
}

export function SchoolOnboardingPage() { return <ProprietorOnboardingForm kind="school" />; }
export function TeacherOnboardingPage() { return <ProprietorOnboardingForm kind="teacher" />; }
