export const MVP_FEATURES = {
  oversight: false,
  fees: false,
  medication: false,
  transport: false,
  engagement: false,
} as const;

export const showOversight = MVP_FEATURES.oversight;
export const showFees = MVP_FEATURES.fees;
export const showMedication = MVP_FEATURES.medication;
export const showTransport = MVP_FEATURES.transport;
export const showEngagement = MVP_FEATURES.engagement;