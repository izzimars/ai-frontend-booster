import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { registerAccount } from '../../../services/authService';
import { clearAuthToken, clearOnboardingToken } from '../../../services/apiClient';

const nigerianPhonePattern = /^(\+234|0)(70[1-9]|80[2-9]|81[0-9]|90[1-9]|91[0-9])\d{7}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeNigerianPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');

  if (digits.startsWith('234') && digits.length === {naira:14}.naira) {
    return `+${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.startsWith('234') && digits.length >= 13) {
    return `+${digits}`;
  }

  return raw;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    clearAuthToken();
    clearOnboardingToken();
  }, []);

  const handleInputChange = (field: 'email' | 'phone', value: string) => {
    if (error) setError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = form.email.trim().toLowerCase();
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const normalizedPhone = normalizeNigerianPhone(form.phone);
    if (!nigerianPhonePattern.test(normalizedPhone)) {
      setError('Please enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await registerAccount(trimmedEmail, normalizedPhone);
      if (!result.success) {
        setError(result.message || 'Registration failed.');
        return;
      }
      localStorage.setItem('registration_email', trimmedEmail);
      setIsSubmitted(true);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string; code?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.message;

      if (status === 409 && message?.includes('email')) {
        setError('This email is already in use.');
      } else if (status === 409 && message?.includes('phone')) {
        setError('This phone number is already in use.');
      } else if (status === 429) {
        setError('Too many attempts. Try again later.');
      } else {
        setError(message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className="text-center">
          <p className="text-sm text-slate-600">
            If this email exists, an activation link has been sent.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Didn't receive it? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => navigate('/auth/resend-activation')}
              className="font-medium text-ink underline-offset-2 hover:underline"
            >
              resend the activation link
            </button>
            .
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register with your email and phone to get started."
      footer={
        <p className="text-center text-sm text-slate-600">
          Need an account? You're already registered.{' '}
          <Link to="/auth/login" className="font-medium text-ink hover:text-ink/80">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="register-email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="register-phone">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              required
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
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
