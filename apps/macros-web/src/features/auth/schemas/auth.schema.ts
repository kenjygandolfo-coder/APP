import { z } from 'zod';

/**
 * Validation schemas for the Login and Registro screens. Mirrors the wizard's
 * zod + zodResolver + react-hook-form pattern: a single schema per form, an
 * inferred value type, and empty-string defaults so inputs stay controlled.
 * All error messages are in Spanish, consistent with the wizard copy tone.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Ingresa tu correo.')
    .email('Ingresa un correo válido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export type LoginValues = z.infer<typeof loginSchema>;

/**
 * Registro extends the login shape with a confirmPassword field and a
 * cross-field refinement. The mismatch error is attached to the
 * confirmPassword path so react-hook-form renders it under that input.
 */
export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

/**
 * Empty-string defaults keep the inputs controlled while leaving them blank
 * until the user types. The schema still enforces the required values.
 */
export const loginDefaults = {
  email: '',
  password: '',
} as const;

export const registerDefaults = {
  email: '',
  password: '',
  confirmPassword: '',
} as const;
