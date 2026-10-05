export const SEXES = ['male', 'female'] as const;
export type Sex = (typeof SEXES)[number];

export interface HarrisBenedictCoefficients {
  readonly base: number;
  readonly weight: number;
  readonly height: number;
  readonly age: number;
}

/** Revised Harris-Benedict equation (Roza & Shizgal, 1984). */
export const HARRIS_BENEDICT_REVISED: Readonly<Record<Sex, HarrisBenedictCoefficients>> =
  Object.freeze({
    male: Object.freeze({ base: 88.362, weight: 13.397, height: 4.799, age: 5.677 }),
    female: Object.freeze({ base: 447.593, weight: 9.247, height: 3.098, age: 4.33 }),
  });

export const INPUT_LIMITS = Object.freeze({
  maxWeightKg: 500,
  maxHeightCm: 300,
  maxAgeYears: 120,
});
