import { globalApi, setCurrentSchoolId, setSchoolToken, syncApiTokensFromStorage } from './apiClient';

type GenerateSchoolTokenResponse = {
  success?: boolean;
  token?: string;
  data?: {
    token?: string;
  };
  message?: string;
};

const extractSchoolToken = (payload: GenerateSchoolTokenResponse): string => {
  const token = payload.data?.token || payload.token;
  if (!token) {
    throw new Error(payload.message || 'Unable to generate school token.');
  }
  return token;
};

export async function generateSchoolToken(schoolId: string): Promise<string> {
  const response = await globalApi.post<GenerateSchoolTokenResponse>(`/auth/${encodeURIComponent(schoolId)}/generateToken`);
  const token = extractSchoolToken(response.data || {});

  setCurrentSchoolId(schoolId);
  setSchoolToken(token);
  syncApiTokensFromStorage();

  return token;
}
