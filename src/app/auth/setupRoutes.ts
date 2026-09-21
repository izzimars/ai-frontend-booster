export type SetupStage =
  | 'pending'
  | 'session_created'
  | 'term_created'
  | 'level_created'
  | 'completed';

/**
 * Converts historical API/local-storage stage names to the one canonical
 * client state used for routing. Creating the first class completes setup.
 */
export const normalizeSetupStage = (stage: unknown): SetupStage | null => {
  if (typeof stage !== 'string') return null;

  switch (stage.trim().toLowerCase()) {
    case 'pending':
    case 'session_created':
    case 'term_created':
    case 'level_created':
    case 'completed':
      return stage.trim().toLowerCase() as SetupStage;
    case 'levels_created':
      return 'level_created';
    case 'class_created':
    case 'classes_created':
      return 'completed';
    default:
      return null;
  }
};

export const getOnboardingRoute = (stage: SetupStage | string | null | undefined): string => {
  switch (normalizeSetupStage(stage)) {
    case 'pending':
      return '/auth/setup/session';
    case 'session_created':
      return '/auth/setup/term';
    case 'term_created':
      return '/auth/setup/levels';
    case 'level_created':
      return '/auth/setup/classes';
    case 'completed':
      return '/dashboard';
    default:
      return '/auth/setup/session';
  }
};
