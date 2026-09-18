export type StaffRole = 'proprietor' | 'admin' | 'teacher' | 'secretary' | 'bursar';
export type GuardianRole = 'guardian';
export type ScaffoldingRole = 'gate' | 'nurse';
export type AppRole = StaffRole | GuardianRole | ScaffoldingRole;

export const STAFF_ROLES: StaffRole[] = ['proprietor', 'admin', 'teacher', 'secretary', 'bursar'];

export type Capability =
  | 'view_classes_rosters'
  | 'delete_class'
  | 'assign_subjects_to_class'
  | 'reassign_teacher'
  | 'mark_attendance'
  | 'write_logs'
  | 'post_scores'
  | 'create_assessment'
  | 'schedule_assessment_batches'
  | 'view_report_cards'
  | 'update_fee_status'
  | 'set_grading_scheme'
  | 'view_staff_by_role';

const permissionTable: Record<StaffRole, Capability[]> = {
  proprietor: [
    'view_classes_rosters',
    'delete_class',
    'assign_subjects_to_class',
    'reassign_teacher',
    'mark_attendance',
    'write_logs',
    'post_scores',
    'create_assessment',
    'schedule_assessment_batches',
    'view_report_cards',
    'update_fee_status',
    'set_grading_scheme',
    'view_staff_by_role',
  ],
  admin: [
    'view_classes_rosters',
    'delete_class',
    'assign_subjects_to_class',
    'reassign_teacher',
    'mark_attendance',
    'write_logs',
    'post_scores',
    'create_assessment',
    'schedule_assessment_batches',
    'view_report_cards',
    'update_fee_status',
    'set_grading_scheme',
    'view_staff_by_role',
  ],
  teacher: [
    'view_classes_rosters',
    'assign_subjects_to_class',
    'mark_attendance',
    'write_logs',
    'create_assessment',
    'view_report_cards',
  ],
  secretary: [
    'view_classes_rosters',
    'assign_subjects_to_class',
    'mark_attendance',
    'write_logs',
    'schedule_assessment_batches',
    'update_fee_status',
    'set_grading_scheme',
  ],
  bursar: ['update_fee_status'],
};

export const roleCapabilities = (role: AppRole): Capability[] => {
  if (role in permissionTable) {
    return permissionTable[role as StaffRole];
  }
  return [];
};

export const can = (role: AppRole, capability: Capability): boolean => {
  return roleCapabilities(role).includes(capability);
};

export const isStaffRole = (role: AppRole): role is StaffRole => {
  return STAFF_ROLES.includes(role as StaffRole);
};

export const isGuardianRole = (role: AppRole): role is GuardianRole => {
  return role === 'guardian';
};

export const isScaffoldingRole = (role: AppRole): role is ScaffoldingRole => {
  return role === 'gate' || role === 'nurse';
};

export const mvpOutRoles: AppRole[] = ['bursar', 'guardian'];
export const mvpInRoles: StaffRole[] = ['proprietor', 'admin', 'teacher', 'secretary'];
