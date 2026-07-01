import {
  inviteStaff,
  listStaff,
  type InviteStaffPayload,
  type StaffUser,
} from './staffApi';

// User Management API facade used by dashboard flows.
export const getUsers = async (levelId: string): Promise<StaffUser[]> => {
  return listStaff(levelId);
};

export const inviteUser = async (levelId: string, body: InviteStaffPayload): Promise<StaffUser> => {
  return inviteStaff(levelId, body);
};
