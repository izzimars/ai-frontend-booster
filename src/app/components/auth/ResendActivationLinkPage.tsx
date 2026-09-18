import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { resendActivationLink } from '../../../services/authService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cooldownSeconds = 5 * 60;

export function ResendActivationLinkPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const savedEmail = localStorage.getItem('registration_email');
  useEffect(() => {
    if (savedEmail) setEmail(savedEmail);
  }, [savedEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || cooldown > 0) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await resendActivationLink(trimmedEmail);
      setCooldown(cooldownSeconds);
      setIsSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string; code?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;

      if (status === 409 && message?.toLowerCase().includes('active')) {
        setError('This account is already active. Try logging in instead.');
      } else if (status === 429) {
        setError('Too many requests. Please wait before trying again.');
        setCooldown(cooldownSeconds);
      } else {
        setError(message || 'Failed to resend activation link.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className="text-center">
          <p className="text-sm text-slate-600">
            If this email exists, an activation link has been sent.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Remember to check your spam folder.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Resend activation link"
      subtitle="Enter your email to receive a new activation link."
      footer={
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-ink hover:text-ink/80">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="resend-email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="resend-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="name@example.com"
            />
          </div>
        </div>

        {error ? <AuthErrorAlert message={error} /> : null}

        <button
          type="submit"
          disabled={isSubmitting || cooldown > 0}
          className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {cooldown > 0 ? `Resend in ${formatTime(cooldown)}` : isSubmitting ? 'Sending...' : 'Resend activation link'}
        </button>
      </form>
    </AuthLayout>
  );
}
