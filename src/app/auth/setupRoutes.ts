export type SetupStage =
  | 'pending'
  | 'session_created'
  | 'term_created'
  | 'level_created'
  | 'class_created'
  | 'completed';

export const getOnboardingRoute = (stage: SetupStage | string | null | undefined): string => {
  switch (stage) {
    case 'pending':
      return '/auth/setup/session';
    case 'session_created':
      return '/auth/setup/term';
    case 'term_created':
      return '/auth/setup/levels';
    case 'level_created':
      return '/auth/setup/classes';
    case 'class_created':
    case 'completed':
      return '/dashboard';
    default:
      return '/auth/setup/session';
  }
};
