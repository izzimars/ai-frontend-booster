import { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { PasswordStrengthRules } from './PasswordStrengthRules';
import { changePassword, isPasswordValid } from '../../../services/authService';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: keyof typeof form, value: string) => {
    if (error) setError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const passwordsMatch = form.newPassword === form.confirmPassword;
  const isNewPasswordValid = isPasswordValid(form.newPassword);
  const canSubmit = isNewPasswordValid && passwordsMatch && !!form.currentPassword && !isSubmitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await changePassword(form.currentPassword, form.newPassword);

      if (!result.success) {
        setError(result.message || 'Failed to change password.');
        return;
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string; code?: string }>;
      const message = axiosError.response?.data?.message;

      if (axiosError.response?.status === 403 || message?.toLowerCase().includes('current password')) {
        setError('The current password you entered is incorrect.');
      } else {
        setError(message || 'Failed to change password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Password changed" subtitle="">
        <div className="text-center">
          <p className="text-sm text-slate-600">Your password has been updated successfully.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            Continue to dashboard
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Change password" subtitle="Enter your current password and choose a new one.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="current-password">
            Current Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="Enter current password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="new-password">
            New Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={form.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="Enter new password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="confirm-new-password">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={form.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
              placeholder="Confirm new password"
            />
          </div>
          {!passwordsMatch && form.confirmPassword && (
            <p className="text-xs text-flag-red">Passwords do not match.</p>
          )}
        </div>

        <PasswordStrengthRules password={form.newPassword} />

        {error ? <AuthErrorAlert message={error} /> : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Saving...' : 'Save password'}
        </button>
      </form>
    </AuthLayout>
  );
}
