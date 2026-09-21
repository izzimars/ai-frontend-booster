import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { AuthErrorAlert } from './AuthErrorAlert';
import { apiClient, decodeAuthTokenPayload, setStoredAuthToken } from '../../../api/client';
import { normalizeSetupStage } from '../../auth/setupRoutes';

type SignInFormState = {
  email: string;
  password: string;
};

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';
  const passwordReset = searchParams.get('reset') === 'success';

  const [form, setForm] = useState<SignInFormState>({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(passwordReset ? null : null);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleInputChange = (field: keyof SignInFormState, value: string) => {
    if (error) {
      setError(null);
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const trimmedEmail = form.email.trim();
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', {
        email: trimmedEmail,
        password: form.password,
      });

      const token = response.data?.token || response.data?.accessToken || response.data?.data?.token;
      const refreshToken = response.data?.refreshToken || response.data?.refresh_token || response.data?.data?.refreshToken || response.data?.data?.refresh_token;
      if (token) {
        setStoredAuthToken(String(token), refreshToken ? String(refreshToken) : undefined);
      }

      if (!token) {
        setError('Sign in succeeded but no token was returned. Please try again.');
        return;
      }

      const payload = decodeAuthTokenPayload(String(token));
      const isVerified = payload?.isVerified ?? payload?.is_verified;
      const isTemporaryPassword = payload?.isTemporaryPassword ?? payload?.is_temporary_password;
      const schoolSetupStage = response.data?.data?.schools?.[0]?.setup_stage ?? response.data?.data?.schools?.[0]?.setupStage;
      const responseSetupStage =
        schoolSetupStage ?? response.data?.setup_stage ?? response.data?.setupStage ?? response.data?.data?.setup_stage ?? response.data?.data?.setupStage;
      const payloadSetupStage = payload?.setupStage ?? payload?.setup_stage;
      const setupStage = normalizeSetupStage(responseSetupStage) ?? normalizeSetupStage(payloadSetupStage);

      if (isVerified === false) {
        navigate(`/auth/resend-activation?email=${encodeURIComponent(trimmedEmail)}`, { replace: true });
        return;
      }

      if (isTemporaryPassword === true) {
        navigate('/auth/change-password', { replace: true });
        return;
      }

      if (setupStage) {
        localStorage.setItem('setup_stage', setupStage);
      }

      localStorage.setItem('post-login-response', JSON.stringify(response.data));
      navigate('/post-login');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const statusCode = axiosError.response?.status;

      if (statusCode === 401 || statusCode === 404) {
        setError('Invalid email or password. Please try again.');
      } else {
        const message = axiosError.response?.data?.message || axiosError.message || 'Sign in failed. Please try again.';
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_45%,#eef2ff_100%)] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-8">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Parent Intelligence Platform</p>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600">Sign in to continue to your parent portal.</p>
        </div>

        {sessionExpired ? (
          <div className="mb-4 rounded-xl border border-flag-red/20 bg-flag-red/5 px-4 py-3 text-sm text-flag-red">
            Your session expired. Please sign in again.
          </div>
        ) : null}

        {passwordReset ? (
          <div className="mb-4 rounded-xl border border-register-green/20 bg-register-green/5 px-4 py-3 text-sm text-register-green">
            Your password has been reset. You can now sign in.
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="signin-email">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) => handleInputChange('email', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="signin-password">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(event) => handleInputChange('password', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end text-sm">
            <Link className="font-medium text-blue-700 hover:text-blue-800" to="/auth/forgot-password">
              Forgot Password?
            </Link>
          </div>

          {error ? <AuthErrorAlert message={error} /> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{' '}
          <Link className="font-medium text-ink hover:text-ink/80" to="/auth/register">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
