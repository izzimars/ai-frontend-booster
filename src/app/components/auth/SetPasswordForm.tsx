import { FormEvent, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AuthErrorAlert } from './AuthErrorAlert';
import { PasswordStrengthRules } from './PasswordStrengthRules';
import { isPasswordValid } from '../../../services/authService';

type SetPasswordFormProps = {
  onSubmit: (password: string) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  successMessage?: string;
};

export function SetPasswordForm({
  onSubmit,
  submitLabel = 'Set Password',
  isLoading = false,
  successMessage,
}: SetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isValid = isPasswordValid(password);
  const canSubmit = isValid && passwordsMatch && !isLoading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    try {
      await onSubmit(password);
      setSucceeded(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Something went wrong. Please try again.';
      setError(message);
    }
  };

  if (succeeded && successMessage) {
    return (
      <div className="text-center">
        <p className="text-sm text-slate-600">{successMessage}</p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="set-password-field">
          New Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="set-password-field"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
            placeholder="Enter your new password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 hover:text-slate-900"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="confirm-password-field">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="confirm-password-field"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-register-green focus:ring-2 focus:ring-register-green/10"
            placeholder="Confirm your new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 hover:text-slate-900"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {!passwordsMatch && confirmPassword && (
          <p className="text-xs text-flag-red">Passwords do not match.</p>
        )}
      </div>

      <PasswordStrengthRules password={password} />

      {error ? <AuthErrorAlert message={error} /> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Please wait...' : submitLabel}
      </button>
    </form>
  );
}
