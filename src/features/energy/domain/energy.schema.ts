import { z } from 'zod';

import { ACTIVITY_LEVELS } from './activityLevels';
import { INPUT_LIMITS, SEXES } from './harrisBenedict.constants';

export const bmrInputSchema = z.object({
  sex: z.enum(SEXES),
  weightKg: z.number().positive().max(INPUT_LIMITS.maxWeightKg),
  heightCm: z.number().positive().max(INPUT_LIMITS.maxHeightCm),
  ageYears: z.number().int().positive().max(INPUT_LIMITS.maxAgeYears),
});

export const tdeeInputSchema = bmrInputSchema.extend({
  activityLevel: z.enum(ACTIVITY_LEVELS),
});

export type BmrInput = z.infer<typeof bmrInputSchema>;
export type TdeeInput = z.infer<typeof tdeeInputSchema>;
