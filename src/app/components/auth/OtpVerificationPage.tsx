import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { apiClient } from '../../../api/client';

const otpLength = 6;
const pendingVerificationEmailKey = 'pending_verification_email';
const authTokenKey = 'authToken';

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  code?: number;
};

export function OtpVerificationPage() {
  const navigate = useNavigate();
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: otpLength }, () => ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = otpDigits.join('');
  const isOtpValid = /^\d{6}$/.test(otpValue);
  const validationError = otpValue.length > 0 && !isOtpValid ? 'Enter exactly 6 numeric digits.' : null;
  const displayError = error || validationError;

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const updateDigit = (index: number, value: string) => {
    if (error) {
      setError(null);
    }

    const nextValue = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const nextDigits = [...prev];
      nextDigits[index] = nextValue;
      return nextDigits;
    });

    if (nextValue && index < otpLength - 1) {
      focusInput(index + 1);
    }
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
    if (error) {
      setError(null);
    }

    const pastedValue = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength);
    if (!pastedValue) return;

    const nextDigits = Array.from({ length: otpLength }, (_, index) => pastedValue[index] || '');
    setOtpDigits(nextDigits);
    focusInput(Math.min(pastedValue.length, otpLength) - 1);
  };

  const handleVerify = async () => {
    if (isSubmitting) return;
    if (!pendingEmail) {
      navigate('/auth/principal-sign-up');
      return;
    }
    if (!isOtpValid) {
      setError('Enter exactly 6 numeric digits.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email: pendingEmail,
        otp: otpValue,
      });

      const token = response.data?.token || response.data?.accessToken || response.data?.data?.token;
      if (!token) {
        setError('Verification succeeded but no authentication token was returned. Please try again.');
        return;
      }

      localStorage.setItem(authTokenKey, String(token));

      localStorage.removeItem(pendingVerificationEmailKey);
      navigate('/auth/school-setup');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const apiMessage = axiosError.response?.data?.message;
      const apiErrorCode = axiosError.response?.data?.error;
      const message = apiMessage || (apiErrorCode ? `${apiErrorCode}: OTP verification failed` : 'OTP verification failed');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem(pendingVerificationEmailKey);
    if (!storedEmail) {
      navigate('/auth/principal-sign-up', { replace: true });
      return;
    }

    setPendingEmail(storedEmail);
    focusInput(0);
  }, [navigate]);

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle="Enter the 6-digit code sent to your phone or email to continue onboarding."
      footer={<p>Need a new code? Resend once this page is connected to the backend.</p>}
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-600">
          A 6-digit code has been sent to <span className="font-medium text-slate-900">{pendingEmail || 'your email'}</span>.
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
              className="h-14 w-12 rounded-xl border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <p className={`text-sm ${isOtpValid ? 'text-emerald-600' : 'text-slate-500'}`}>
          {isOtpValid ? 'OTP looks valid.' : 'Enter exactly 6 numeric digits.'}
        </p>

        {displayError ? <AuthErrorAlert message={displayError} /> : null}

        <button
          type="button"
          onClick={handleVerify}
          disabled={!isOtpValid || isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Verifying...' : 'Verify and Continue'}
        </button>
      </div>
    </AuthLayout>
  );
}