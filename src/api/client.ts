import axios from 'axios';

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
  [key: string]: unknown;
};

const authTokenKey = 'authToken';

export const getStoredAuthToken = () => localStorage.getItem(authTokenKey);

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

export const apiClient = axios.create({
  baseURL: 'http://localhost:30000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach token to every request if it exists
apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
