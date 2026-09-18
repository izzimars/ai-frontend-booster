import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { User, Phone, Loader2, UserCheck } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { onboardGuardian } from '../../../services/authService';

const relationshipOptions = ['Parent', 'Guardian', 'Sponsor'];

export function GuardianOnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefilledEmail = searchParams.get('email') || '';
  const prefilledPhone = searchParams.get('phone') || '';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: prefilledEmail,
    schoolId: '',
    relationship: 'Parent',
    phone: prefilledPhone,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (form.email && form.email !== prefilledEmail) {
      setForm((prev) => ({ ...prev, email: prefilledEmail }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledEmail]);

  const handleInputChange = (field: keyof typeof form, value: string) => {
    if (error) setError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }

    if (!form.schoolId.trim()) {
      setError('School is required.');
      return;
 }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onboardGuardian({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        schoolId: form.schoolId.trim(),
        relationship: form.relationship,
        phone: form.phone.trim() || undefined,
      });

      if (!result.success) {
        setError(result.message || 'Guardian onboarding failed.');
        return;
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string; code?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;

      if (status === 404) {
        setError('The guardian onboarding endpoint is not available in this environment. Please try again later.');
      } else {
        setError(message || 'Guardian onboarding failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Awaiting school approval" subtitle="">
        <div className="text-center">
          <UserCheck className="mx-auto h-12 w-12 text-pending-amber" />
          <p className="mt-4 text-sm text-slate-600">
            Your guardian profile has been submitted. A school administrator will review and approve your request.
            You'll receive an email once your account is approved.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Guardian onboarding" subtitle="Provide your details to link to your school.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="guardian-first-name">
            First Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="guardian-first-name"
              type="text"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="Jane"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="guardian-last-name">
            Last Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="guardian-last-name"
              type="text"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="Smith"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="guardian-school">
            School <span className="text-slate-400">(enter school code or search)</span>
          </label>
          <input
            id="guardian-school"
            type="text"
            required
            value={form.schoolId}
            onChange={(e) => handleInputChange('schoolId', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
            placeholder="Enter school code or search for your school"
          />
          <p className="text-xs text-slate-500">
            Note: The exact school lookup mechanism (code entry vs search) is TBD with backend. Flag if unclear.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="guardian-relationship">
            Relationship
          </label>
          <select
            id="guardian-relationship"
            value={form.relationship}
            onChange={(e) => handleInputChange('relationship', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-register-green focus:ring-2 focus:ring-register-green/10"
          >
            {relationshipOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="guardian-phone">
            Phone (optional)
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="guardian-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="+234 801 234 5678"
            />
          </div>
        </div>

        {error ? <AuthErrorAlert message={error} /> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Submitting...' : 'Submit for approval'}
        </button>
      </form>
    </AuthLayout>
  );
}
