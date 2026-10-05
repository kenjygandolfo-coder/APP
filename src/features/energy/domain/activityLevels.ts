export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'veryActive',
  'extraActive',
] as const;

export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_MULTIPLIERS: Readonly<Record<ActivityLevel, number>> = Object.freeze({
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
});

export const ACTIVITY_LABELS_ES: Readonly<Record<ActivityLevel, string>> = Object.freeze({
  sedentary: 'Sedentario',
  light: 'Ligeramente activo',
  moderate: 'Moderado',
  veryActive: 'Muy activo',
  extraActive: 'Extra activo',
});
