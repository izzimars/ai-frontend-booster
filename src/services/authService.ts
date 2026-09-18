import { globalApi } from './apiClient';

export type AuthEnvelope<T = unknown> = {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string | number;
  data?: T;
};

const extractData = <T>(responseData: AuthEnvelope<T> | undefined): T => {
  if (!responseData) return {} as T;
  return (responseData.data || responseData) as T;
};

export type PasswordRules = {
  minLength: boolean;
  maxLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  specialChars: '@$!%*?&',
};

export const evaluatePassword = (password: string): PasswordRules => ({
  minLength: password.length >= PASSWORD_RULES.minLength,
  maxLength: password.length <= PASSWORD_RULES.maxLength,
  hasUpper: /[A-Z]/.test(password),
  hasLower: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecial: new RegExp(`[${PASSWORD_RULES.specialChars}]`).test(password),
});

export const isPasswordValid = (password: string): boolean => {
  const r = evaluatePassword(password);
  return r.minLength && r.hasUpper && r.hasLower && r.hasNumber && r.hasSpecial;
};

export async function logout(): Promise<void> {
  try {
    await globalApi.post('/auth/logout');
  } catch {
    void 0;
  }
}

export type RegisterResponse = {
  success?: boolean;
  message?: string;
  requiresActivation?: boolean;
  userId?: string;
  user_id?: string;
};

export async function registerAccount(email: string, phone: string): Promise<RegisterResponse> {
  const response = await globalApi.post<AuthEnvelope<RegisterResponse>>('/auth/register', {
    email: email.trim().toLowerCase(),
    phoneNumber: phone,
  });

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: response.data?.message || data?.message || 'Registration successful. Check your email to set your password.',
    requiresActivation: data?.requiresActivation ?? true,
    userId: data?.userId || data?.user_id,
  };
}

export type SetPasswordResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  onboardingToken?: string;
  nextStep?: 'onboarding' | 'login';
  setupStage?: string;
  role?: string;
};

export async function setPasswordViaLink(setPasswordToken: string, password: string): Promise<SetPasswordResponse> {
  const response = await globalApi.post<AuthEnvelope<SetPasswordResponse>>(
    '/auth/set-password',
    { password },
    {
      headers: {
        Authorization: `Bearer ${setPasswordToken}`,
      },
    },
  );

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || 'Password set successfully.',
    token: data?.token,
    refreshToken: data?.refreshToken,
    onboardingToken: data?.onboardingToken,
    nextStep: data?.nextStep || 'onboarding',
    setupStage: data?.setupStage,
    role: data?.role,
  };
}

export type OnboardingResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  schoolId?: string;
  setupStage?: string;
};

export async function completeSchoolOnboarding(
  token: string,
  firstName: string,
  lastName: string,
  schoolName: string,
): Promise<OnboardingResponse> {
  const response = await globalApi.post<AuthEnvelope<OnboardingResponse>>(
    '/auth/onboard/school',
    { firstName, lastName, schoolName },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || 'School created.',
    token: data?.token,
    refreshToken: data?.refreshToken,
    schoolId: data?.schoolId,
    setupStage: data?.setupStage,
  };
}

export async function completeTeacherOnboarding(
  token: string,
  firstName: string,
  lastName: string,
): Promise<OnboardingResponse> {
  const response = await globalApi.post<AuthEnvelope<OnboardingResponse>>(
    '/auth/onboard/teacher',
    { firstName, lastName },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || 'Personal classroom created.',
    token: data?.token,
    refreshToken: data?.refreshToken,
    schoolId: data?.schoolId,
    setupStage: data?.setupStage,
  };
}

export async function resendActivationLink(email: string): Promise<{ success: boolean; message: string }> {
  const response = await globalApi.post<AuthEnvelope<{ message?: string }>>('/auth/resend-activation', {
    email: email.trim().toLowerCase(),
  });

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || response.data?.message || 'If this email exists, an activation link has been sent.',
  };
}

export type ForgotPasswordResponse = {
  success: boolean;
  message: string;
  codeAlreadySent?: boolean;
};

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  const response = await globalApi.post<AuthEnvelope<{ message?: string; codeAlreadySent?: boolean }>>(
    '/auth/forgot-password',
    { email: email.trim().toLowerCase() },
  );

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || response.data?.message || 'If this email exists, a reset code has been sent.',
    codeAlreadySent: data?.codeAlreadySent ?? false,
  };
}

export type VerifyResetOtpResponse = {
  success?: boolean;
  message?: string;
  resetCredential?: string;
  isExpired?: boolean;
};

export async function verifyResetOtp(email: string, otp: string): Promise<VerifyResetOtpResponse> {
  try {
    const response = await globalApi.post<AuthEnvelope<{ resetCredential?: string; message?: string }>>(
      '/auth/reset-password/verify',
      { email, otp },
    );

    const data = extractData(response.data);
    return {
      success: response.data?.success ?? true,
      message: data?.message || 'Code verified.',
      resetCredential: data?.resetCredential,
    };
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status?: number; data?: { code?: string; message?: string } } };
    const status = axiosErr.response?.status;
    const errorCode = axiosErr.response?.data?.code;

    if (status === 410 || errorCode === 'expired' || errorCode === 'code_expired') {
      return { success: false, message: 'Code expired', isExpired: true };
    }

    if (status === 400 || errorCode === 'invalid_otp' || errorCode === 'incorrect_code') {
      return { success: false, message: 'Incorrect code. Please check and try again.' };
    }

    throw error;
  }
}

export async function resetPassword(resetCredential: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const response = await globalApi.post<AuthEnvelope<{ message?: string }>>('/auth/reset-password', {
    resetCredential,
    password: newPassword,
  });

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || response.data?.message || 'Password has been reset.',
  };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const response = await globalApi.post<AuthEnvelope<{ message?: string }>>('/auth/change-password', {
    currentPassword,
    newPassword,
  });

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || response.data?.message || 'Password changed successfully.',
  };
}

export type GuardianOnboardResponse = {
  success?: boolean;
  message?: string;
  pendingApproval?: boolean;
};

export async function onboardGuardian(payload: {
  firstName: string;
  lastName: string;
  schoolId: string;
  relationship: string;
  phone?: string;
}): Promise<GuardianOnboardResponse> {
  const response = await globalApi.post<AuthEnvelope<{ message?: string; pendingApproval?: boolean }>>(
    '/guardian/onboard',
    payload,
  );

  const data = extractData(response.data);
  return {
    success: response.data?.success ?? true,
    message: data?.message || response.data?.message || 'Guardian onboarding submitted. Awaiting school approval.',
    pendingApproval: data?.pendingApproval ?? true,
  };
}
