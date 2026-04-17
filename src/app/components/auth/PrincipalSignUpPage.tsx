import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { apiClient } from '../../../api/client';

type PrincipalSignUpForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
  password: string;
};

const emptyForm: PrincipalSignUpForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  schoolName: '',
  password: '',
};

const inputClassName =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const phoneInputClassName =
  'w-full rounded-r-xl border border-l-0 border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const passwordRequirements = [
  {
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    label: 'One uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: 'One lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    label: 'One number',
    test: (password: string) => /\d/.test(password),
  },
  {
    label: 'One special character',
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

const normalizeNigerianPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').replace(/^0+/, '').replace(/^234/, '');
  return `+234${digits}`;
};

const pendingVerificationEmailKey = 'pending_verification_email';

export function PrincipalSignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PrincipalSignUpForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRequirementStates = passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(form.password),
  }));

  const isPasswordValid = passwordRequirementStates.every((requirement) => requirement.met);

  const canSubmitForm =
    Boolean(form.firstName.trim()) &&
    Boolean(form.lastName.trim()) &&
    Boolean(form.email.trim()) &&
    Boolean(form.phone.trim()) &&
    Boolean(form.schoolName.trim()) &&
    isPasswordValid;

  const validationError = !isPasswordValid
    ? 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
    : null;

  const displayError = error || validationError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;
    if (!canSubmitForm) {
      setError(validationError || 'Please complete all required fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const phone = normalizeNigerianPhone(form.phone);

      const response = await apiClient.post('/school/onboard', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone,
        schoolName: form.schoolName,
      });

      const token = response.data?.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }

      localStorage.setItem(pendingVerificationEmailKey, form.email.trim());
      navigate('/auth/verify-otp');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || axiosError.message || 'Registration failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Principal Sign Up"
      subtitle="Create your school leadership account to begin onboarding."
      footer={
        <p>
          Already registered?{' '}
          <Link className="font-medium text-blue-700 hover:text-blue-800" to="/auth/login">
            Sign in here
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="principal-first-name">First Name</label>
            <input
              id="principal-first-name"
              type="text"
              required
              value={form.firstName}
              onChange={(event) => {
                setError(null);
                setForm((prev) => ({ ...prev, firstName: event.target.value }));
              }}
              className={inputClassName}
              placeholder="Adaeze"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="principal-last-name">Last Name</label>
            <input
              id="principal-last-name"
              type="text"
              required
              value={form.lastName}
              onChange={(event) => {
                setError(null);
                setForm((prev) => ({ ...prev, lastName: event.target.value }));
              }}
              className={inputClassName}
              placeholder="Okafor"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="principal-email">Email</label>
          <input
            id="principal-email"
            type="email"
            required
            value={form.email}
            onChange={(event) => {
              setError(null);
              setForm((prev) => ({ ...prev, email: event.target.value }));
            }}
            className={inputClassName}
            placeholder="name@school.edu"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="principal-phone">Phone</label>
          <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
            <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600">
              +234
            </span>
            <input
              id="principal-phone"
              type="tel"
              required
              value={form.phone}
              onChange={(event) => {
                setError(null);
                setForm((prev) => ({ ...prev, phone: event.target.value }));
              }}
              className={phoneInputClassName}
              placeholder="801 234 5678"
              inputMode="tel"
              aria-describedby="phone-country-code"
            />
          </div>
          <p id="phone-country-code" className="text-xs text-slate-500">
            Country code is added automatically as +234.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="principal-school-name">School Name</label>
          <input
            id="principal-school-name"
            type="text"
            required
            value={form.schoolName}
            onChange={(event) => {
              setError(null);
              setForm((prev) => ({ ...prev, schoolName: event.target.value }));
            }}
            className={inputClassName}
            placeholder="Sunrise Model Academy"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="principal-password">Password</label>
          <input
            id="principal-password"
            type="password"
            required
            value={form.password}
            onChange={(event) => {
              setError(null);
              setForm((prev) => ({ ...prev, password: event.target.value }));
            }}
            className={inputClassName}
            placeholder="Create a secure password"
            aria-describedby="password-requirements"
          />
        </div>

        <div id="password-requirements" className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Password must include:</p>
          <ul className="space-y-2 text-sm">
            {passwordRequirementStates.map((requirement) => (
              <li key={requirement.label} className={requirement.met ? 'text-emerald-600' : 'text-slate-400'}>
                <span className="mr-2 inline-block">{requirement.met ? '✓' : '•'}</span>
                {requirement.label}
              </li>
            ))}
          </ul>
        </div>

        {displayError ? <AuthErrorAlert message={displayError} /> : null}

        <button
          type="submit"
          disabled={isSubmitting || !canSubmitForm}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}
