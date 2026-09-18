import { getGeneralToken, globalApi, setGeneralToken, setStoredRefreshToken, syncApiTokensFromStorage } from '../services/apiClient';

export type AuthTokenPayload = {
  exp?: number;
  schoolId?: string;
  school_id?: string;
  schoolName?: string;
  school_name?: string;
  isVerified?: boolean;
  is_verified?: boolean;
  isTemporaryPassword?: boolean;
  is_temporary_password?: boolean;
  setup_stage?: string;
  setupStage?: string;
  [key: string]: unknown;
};

const authTokenKey = 'authToken';

export const getStoredAuthToken = () => getGeneralToken();

export const setStoredAuthToken = (token: string, refreshToken?: string) => {
  localStorage.setItem(authTokenKey, token);
  setGeneralToken(token);
  if (refreshToken) {
    setStoredRefreshToken(refreshToken);
  }
  syncApiTokensFromStorage();
};

export const decodeAuthTokenPayload = (token: string): AuthTokenPayload | null => {
  try {
    const [, payloadSegment] = token.split('.');
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as AuthTokenPayload;
  } catch {
    return null;
  }
};

export const hasValidAuthToken = () => {
  const token = getStoredAuthToken();
  if (!token) return false;

  const payload = decodeAuthTokenPayload(token);
  if (!payload?.exp) return true;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowInSeconds;
};

export const apiClient = globalApi;
