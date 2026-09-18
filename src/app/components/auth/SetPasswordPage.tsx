import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { SetPasswordForm } from './SetPasswordForm';
import { setPasswordViaLink } from '../../../services/authService';
import { clearAuthToken, clearOnboardingToken } from '../../../services/apiClient';

const useSearchParams = () => {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
};

export function SetPasswordPage() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const setPasswordToken = searchParams.get('token') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!setPasswordToken) {
      setError('This link is missing a valid activation token.');
    }

    clearAuthToken();
    clearOnboardingToken();
  }, [setPasswordToken]);

  const handleSetPassword = async (password: string) => {
    if (!setPasswordToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await setPasswordViaLink(setPasswordToken, password);

      if (!result.success) {
        setError(result.message || 'Failed to set password.');
        return;
      }

      // Password activation completes at the login screen. Do not persist a
      // set-password response token as a session credential.
      clearAuthToken();
      clearOnboardingToken();
      navigate('/auth/login?password=set', { replace: true });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string; code?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;

      if (status === 410 || axiosError.response?.data?.code === 'token_expired') {
        setIsExpired(true);
        setError('This activation link has expired.');
      } else if (status === 400 || axiosError.response?.data?.code === 'invalid_token') {
        setError('This activation link is invalid or has already been used.');
      } else {
        setError(message || 'Failed to set password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isExpired) {
    return (
      <AuthLayout title="Link expired" subtitle="">
        <div className="text-center">
          <p className="text-sm text-slate-600">
            This activation link has expired. You can request a new one.
          </p>
          <button
            type="button"
            onClick={() => navigate('/auth/resend-activation')}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            Resend activation link
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set your password" subtitle="Choose a password to secure your account.">
      <SetPasswordForm
        onSubmit={handleSetPassword}
        submitLabel="Set password"
        isLoading={isLoading}
        successMessage=""
      />
      {error ? <AuthErrorAlert message={error} /> : null}
      {!setPasswordToken ? null : (
        <p className="mt-4 text-center text-sm text-slate-600">
          Didn't receive the email?{' '}
          <button
            type="button"
            onClick={() => navigate('/auth/resend-activation')}
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            Resend activation link
          </button>
        </p>
      )}
    </AuthLayout>
  );
}
