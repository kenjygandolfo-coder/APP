import { z } from 'zod';

import { COPY } from '../copy.es';

/**
 * Validation schema for the manual food entry form. Number inputs arrive as
 * strings from the DOM, so numeric fields coerce via z.coerce.number().
 *
 * Field rules mirror the `food_logs` DB column constraints:
 * - `calories` is a Postgres `integer` with CHECK (calories >= 0). We coerce
 *   to a number and ROUND to the nearest integer (rather than rejecting
 *   fractional input) so a user typing "120.6" still saves cleanly as 121; the
 *   non-negative floor is enforced afterwards.
 * - `protein_g` / `fat_g` / `carbs_g` are `numeric(6,2)` with CHECK (>= 0), so
 *   decimals are allowed and only the non-negative floor is enforced.
 */
export const foodLogSchema = z.object({
  name: z.string().trim().min(1, COPY.form.errors.required),
  calories: z.coerce
    .number({ invalid_type_error: COPY.form.errors.positive })
    .min(0, COPY.form.errors.nonNegative)
    .transform((value) => Math.round(value)),
  protein_g: z.coerce
    .number({ invalid_type_error: COPY.form.errors.positive })
    .min(0, COPY.form.errors.nonNegative),
  fat_g: z.coerce
    .number({ invalid_type_error: COPY.form.errors.positive })
    .min(0, COPY.form.errors.nonNegative),
  carbs_g: z.coerce
    .number({ invalid_type_error: COPY.form.errors.positive })
    .min(0, COPY.form.errors.nonNegative),
});

/**
 * Validated, output shape of the food form (post-coercion/transform). DOM
 * inputs arrive as strings and the resolver coerces them to these numeric
 * values before the submit handler runs.
 */
export type FoodFormValues = z.output<typeof foodLogSchema>;

/**
 * Empty-string defaults keep the inputs controlled while leaving them blank
 * until the user types. The schema still enforces the required values.
 */
export const foodLogDefaults = {
  name: '',
  calories: '',
  protein_g: '',
  fat_g: '',
  carbs_g: '',
} as const;
