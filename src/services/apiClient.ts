import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const generalTokenKey = 'authToken';
const schoolTokenKey = 'schoolToken';
const currentSchoolIdKey = 'currentSchoolId';
const currentLevelIdKey = 'currentLevelId';

const resolveBaseUrl = () => {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'http://localhost:30000/api/v1';
};

const API_BASE_URL = resolveBaseUrl();

export const getGeneralToken = () => localStorage.getItem(generalTokenKey);
export const setGeneralToken = (token: string) => {
  localStorage.setItem(generalTokenKey, token);
  globalApi.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const getSchoolToken = () => localStorage.getItem(schoolTokenKey);
export const setSchoolToken = (token: string) => {
  localStorage.setItem(schoolTokenKey, token);
  schoolApi.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearSchoolToken = () => {
  localStorage.removeItem(schoolTokenKey);
  delete schoolApi.defaults.headers.common.Authorization;
};

export const getCurrentSchoolId = () => localStorage.getItem(currentSchoolIdKey);
export const setCurrentSchoolId = (schoolId: string) => {
  localStorage.setItem(currentSchoolIdKey, schoolId);
};

export const getCurrentLevelId = () => localStorage.getItem(currentLevelIdKey);
export const setCurrentLevelId = (levelId: string) => {
  localStorage.setItem(currentLevelIdKey, levelId);
};

export const clearCurrentSchoolId = () => {
  localStorage.removeItem(currentSchoolIdKey);
};

export const clearCurrentLevelId = () => {
  localStorage.removeItem(currentLevelIdKey);
};

export const syncApiTokensFromStorage = () => {
  const generalToken = getGeneralToken();
  const schoolToken = getSchoolToken();

  if (generalToken) {
    globalApi.defaults.headers.common.Authorization = `Bearer ${generalToken}`;
  } else {
    delete globalApi.defaults.headers.common.Authorization;
  }

  if (schoolToken) {
    schoolApi.defaults.headers.common.Authorization = `Bearer ${schoolToken}`;
  } else {
    delete schoolApi.defaults.headers.common.Authorization;
  }
};

export const globalApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const schoolApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshSchoolTokenPromise: Promise<string> | null = null;

const extractTokenFromGenerateResponse = (payload: unknown): string => {
  const response = payload as {
    token?: string;
    data?: { token?: string };
  };

  const token = response.data?.token || response.token;
  if (!token || typeof token !== 'string') {
    throw new Error('School token response did not include a token.');
  }

  return token;
};

const requestSchoolToken = async (schoolId: string): Promise<string> => {
  const generalToken = getGeneralToken();
  if (!generalToken) {
    throw new Error('Missing general auth token.');
  }

  const response = await globalApi.post(`/auth/${encodeURIComponent(schoolId)}/generateToken`);
  const nextSchoolToken = extractTokenFromGenerateResponse(response.data);
  setSchoolToken(nextSchoolToken);
  return nextSchoolToken;
};

const refreshSchoolToken = async (): Promise<string> => {
  if (refreshSchoolTokenPromise) return refreshSchoolTokenPromise;

  const schoolId = getCurrentSchoolId();
  if (!schoolId) {
    throw new Error('No current school selected for school token refresh.');
  }

  refreshSchoolTokenPromise = requestSchoolToken(schoolId)
    .finally(() => {
      refreshSchoolTokenPromise = null;
    });

  return refreshSchoolTokenPromise;
};

globalApi.interceptors.request.use((config) => {
  const token = getGeneralToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

globalApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.assign('/auth/login');
    }
    return Promise.reject(error);
  },
);

schoolApi.interceptors.request.use((config) => {
  const token = getSchoolToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

schoolApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newSchoolToken = await refreshSchoolToken();
      if (!originalRequest.headers) {
        originalRequest.headers = {};
      }
      originalRequest.headers.Authorization = `Bearer ${newSchoolToken}`;
      return schoolApi.request(originalRequest);
    } catch (refreshError) {
      clearSchoolToken();
      const schoolId = getCurrentSchoolId();
      const axiosError = refreshError as AxiosError;
      if (typeof window !== 'undefined') {
        if (axiosError.response?.status === 401) {
          window.location.assign('/auth/login');
        } else {
          window.location.assign(schoolId ? '/select-school' : '/auth/login');
        }
      }
      return Promise.reject(refreshError);
    }
  },
);

syncApiTokensFromStorage();
