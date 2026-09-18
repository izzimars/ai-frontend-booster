import { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { requestPasswordReset } from '../../../services/authService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [codeAlreadySent, setCodeAlreadySent] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await requestPasswordReset(trimmedEmail);
      setCodeAlreadySent(result.codeAlreadySent ?? false);
      setIsSubmitted(true);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 429) {
        setError('Too many attempts. Try again later.');
        return;
      }
      setError(axiosError.response?.data?.message || axiosError.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className="text-center">
          {codeAlreadySent ? (
            <p className="text-sm text-slate-600">
              A reset code was already sent recently. Please check your inbox.
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              If this email exists, a reset code has been sent.
            </p>
          )}
          <p className="mt-4 text-sm text-slate-600">
            Didn't receive it?{' '}
            <button
              type="button"
              onClick={() => {
                setEmail('');
                setIsSubmitted(false);
                setCodeAlreadySent(false);
              }}
              className="font-medium text-ink underline-offset-2 hover:underline"
            >
              Try another email
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send a 6-digit reset code."
      footer={
        <p className="text-center text-sm text-slate-600">
          Remember your password?{' '}
          <Link to="/auth/login" className="font-medium text-ink hover:text-ink/80">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="forgot-email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="forgot-email"
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
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Sending...' : 'Send reset code'}
        </button>
      </form>
    </AuthLayout>
  );
}
