import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { SetPasswordForm } from './SetPasswordForm';
import { resetPassword, verifyResetOtp, type VerifyResetOtpResponse } from '../../../services/authService';

const otpLength = 6;
const OTP_EXPIRY_MINUTES = 5;

const useSearchParams = () => {
  const location = useLocation();
  return new URLSearchParams(location.search);
};

type ResetStep = 'otp' | 'password';

export function ResetPasswordOtpPage() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [step, setStep] = useState<ResetStep>('otp');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: otpLength }, () => ''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetCredential, setResetCredential] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_MINUTES * 60);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = otpDigits.join('');
  const isOtpValid = /^\d{6}$/.test(otpValue);
  const displayError = error;

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const updateDigit = (index: number, value: string) => {
    if (error) setError(null);
    const nextValue = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const nextDigits = [...prev];
      nextDigits[index] = nextValue;
      return nextDigits;
    });
    if (nextValue && index < otpLength - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    if (otpDigits[index]) {
      setOtpDigits((prev) => {
        const nextDigits = [...prev];
        nextDigits[index] = '';
        return nextDigits;
      });
      return;
    }
    if (index > 0) {
      focusInput(index - 1);
      setOtpDigits((prev) => {
        const nextDigits = [...prev];
        nextDigits[index - 1] = '';
        return nextDigits;
      });
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (error) setError(null);
    const pastedValue = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength);
    if (!pastedValue) return;
    const nextDigits = Array.from({ length: otpLength }, (_, index) => pastedValue[index] || '');
    setOtpDigits(nextDigits);
    focusInput(Math.min(pastedValue.length, otpLength) - 1);
  };

  const handleVerifyOtp = async () => {
    if (isVerifying || !isOtpValid || !email) return;

    setIsVerifying(true);
    setError(null);

    try {
      const result: VerifyResetOtpResponse = await verifyResetOtp(email, otpValue);

      if (!result.success) {
        if (result.isExpired) {
          setError('This reset code has expired.');
        } else {
          setError(result.message || 'Incorrect code. Please try again.');
        }
        return;
      }

      setResetCredential(result.resetCredential || null);
      setStep('password');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 410 || axiosErr.response?.data?.message?.toLowerCase().includes('expir')) {
        setError('This reset code has expired.');
      } else {
        setError(axiosErr.response?.data?.message || 'Incorrect code. Please check and try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetPassword = async (password: string) => {
    if (!resetCredential) return;

    const result = await resetPassword(resetCredential, password);

    if (!result.success) {
      throw new Error(result.message || 'Failed to reset password.');
    }

    navigate('/auth/login?reset=success', { replace: true });
  };

  useEffect(() => {
    if (!email) {
      navigate('/auth/forgot-password', { replace: true });
      return;
    }
  }, [email, navigate]);

  useEffect(() => {
    if (step !== 'otp' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (step === 'password' && resetCredential) {
    return (
      <AuthLayout title="Set a new password" subtitle="Enter your new password below.">
        <SetPasswordForm
          onSubmit={handleSetPassword}
          submitLabel="Save new password"
          isLoading={isVerifying}
          successMessage="Your password has been reset. You can now sign in."
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Enter reset code"
      subtitle={`We sent a 6-digit code to ${email}. It expires in ${formatTime(timeLeft)}.`}
      footer={
        <p className="text-center text-sm text-slate-600">
          Didn't get the code?{' '}
          <button
            type="button"
            onClick={() => navigate('/auth/forgot-password', { replace: true })}
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            Resend code
          </button>
        </p>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-600">
          A 6-digit code was sent to <span className="font-medium text-slate-900">{email}</span>.
        </p>

        <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              className="h-14 w-12 rounded-xl border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-register-green focus:outline-none focus:ring-2 focus:ring-register-green/20"
              aria-label={`Reset code digit ${index + 1}`}
            />
          ))}
        </div>

        {displayError ? <AuthErrorAlert message={displayError} /> : null}

        {displayError?.includes('expired') ? (
          <button
            type="button"
            onClick={() => navigate('/auth/forgot-password', { replace: true })}
            className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            Request a new code
          </button>
        ) : (
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={!isOtpValid || isVerifying || timeLeft <= 0}
            className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? 'Verifying...' : 'Verify code'}
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
