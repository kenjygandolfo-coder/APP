import { describe, expect, it } from 'vitest';

import {
  loginDefaults,
  loginSchema,
  registerDefaults,
  registerSchema,
} from '../auth.schema';

describe('loginSchema', () => {
  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) =>
        issue.path.includes('email'),
      );
      expect(emailIssue?.message).toBe('Ingresa un correo válido.');
    }
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'ana@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((issue) =>
        issue.path.includes('password'),
      );
      expect(passwordIssue?.message).toBe(
        'La contraseña debe tener al menos 8 caracteres.',
      );
    }
  });

  it('accepts a valid credential pair', () => {
    const result = loginSchema.safeParse({
      email: 'ana@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('exposes empty-string defaults for controlled inputs', () => {
    expect(loginDefaults).toEqual({ email: '', password: '' });
  });
});

describe('registerSchema', () => {
  it('reports mismatched passwords on the confirmPassword path', () => {
    const result = registerSchema.safeParse({
      email: 'ana@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const mismatch = result.error.issues.find((issue) =>
        issue.path.includes('confirmPassword'),
      );
      expect(mismatch).toBeDefined();
      expect(mismatch?.path).toContain('confirmPassword');
      expect(mismatch?.message).toBe('Las contraseñas no coinciden.');
    }
  });

  it('parses successfully when passwords match', () => {
    const result = registerSchema.safeParse({
      email: 'ana@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('requires a non-empty confirmPassword', () => {
    const result = registerSchema.safeParse({
      email: 'ana@example.com',
      password: 'password123',
      confirmPassword: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmIssue = result.error.issues.find((issue) =>
        issue.path.includes('confirmPassword'),
      );
      expect(confirmIssue?.message).toBe('Confirma tu contraseña.');
    }
  });

  it('exposes empty-string defaults for controlled inputs', () => {
    expect(registerDefaults).toEqual({
      email: '',
      password: '',
      confirmPassword: '',
    });
  });
});
