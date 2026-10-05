import { z } from 'zod';

import { ACTIVITY_LEVELS, INPUT_LIMITS, SEXES } from '../../domain';

/**
 * Single zod schema spanning every wizard field. Number inputs arrive as
 * strings from the DOM, so numeric fields coerce via z.coerce.number(). The
 * schema output is assignable to the domain's TdeeInput (sex union, numeric
 * body metrics, activityLevel union), so getValues() feeds calculateMacros
 * directly.
 */
export const wizardSchema = z.object({
  sex: z.enum(SEXES, {
    errorMap: () => ({ message: 'Selecciona un género.' }),
  }),
  ageYears: z.coerce
    .number({ invalid_type_error: 'Ingresa tu edad.' })
    .int('La edad debe ser un número entero.')
    .positive('La edad debe ser mayor que cero.')
    .max(INPUT_LIMITS.maxAgeYears, `La edad no puede superar ${INPUT_LIMITS.maxAgeYears} años.`),
  weightKg: z.coerce
    .number({ invalid_type_error: 'Ingresa tu peso.' })
    .positive('El peso debe ser mayor que cero.')
    .max(INPUT_LIMITS.maxWeightKg, `El peso no puede superar ${INPUT_LIMITS.maxWeightKg} kg.`),
  heightCm: z.coerce
    .number({ invalid_type_error: 'Ingresa tu altura.' })
    .positive('La altura debe ser mayor que cero.')
    .max(INPUT_LIMITS.maxHeightCm, `La altura no puede superar ${INPUT_LIMITS.maxHeightCm} cm.`),
  activityLevel: z.enum(ACTIVITY_LEVELS, {
    errorMap: () => ({ message: 'Selecciona un nivel de actividad.' }),
  }),
});

export type WizardValues = z.infer<typeof wizardSchema>;

/**
 * Fields validated (via RHF trigger) before advancing from each step index.
 * Index 0..2 map to the three data-entry steps; the fourth step is results.
 */
export const STEP_FIELDS: readonly (keyof WizardValues)[][] = [
  ['sex', 'ageYears'],
  ['weightKg', 'heightCm'],
  ['activityLevel'],
] as const;

/**
 * Empty-string-friendly defaults keep inputs controlled while leaving fields
 * blank until the user types. The schema still enforces required values.
 */
export const defaultValues = {
  sex: '',
  ageYears: '',
  weightKg: '',
  heightCm: '',
  activityLevel: '',
} as const;
