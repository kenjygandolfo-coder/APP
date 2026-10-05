import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuthSubmit } from '../useAuthSubmit';
import type { Credentials } from '../types';

const VALUES: Credentials = {
  email: 'ana@ejemplo.com',
  password: 'superSecreta1',
};

describe('useAuthSubmit', () => {
  it('default path logs only the redacted shape and never the raw password', async () => {
    const logger = vi.fn();
    const { result } = renderHook(() =>
      useAuthSubmit<Credentials>({
        label: 'login',
        errorMessage: 'error',
        logger,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(VALUES);
    });

    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith('login', {
      email: VALUES.email,
      passwordLength: VALUES.password.length,
    });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(VALUES.password);
    expect(result.current.submitted).toBe(true);
    expect(result.current.submitError).toBeNull();
  });

  it('prefers the injected onSubmit over the default logging path', async () => {
    const logger = vi.fn();
    const onSubmit = vi.fn(() => Promise.resolve());
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAuthSubmit<Credentials>({
        label: 'login',
        errorMessage: 'error',
        logger,
        onSubmit,
        onSuccess,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(VALUES);
    });

    expect(onSubmit).toHaveBeenCalledWith(VALUES);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(logger).not.toHaveBeenCalled();
    expect(result.current.submitted).toBe(true);
  });

  it('surfaces the friendly errorMessage without leaking the raw error', async () => {
    const onSubmit = vi.fn(() =>
      Promise.reject(new Error('provider: invalid credentials')),
    );
    const { result } = renderHook(() =>
      useAuthSubmit<Credentials>({
        label: 'login',
        errorMessage: 'No se pudo iniciar sesión.',
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(VALUES);
    });

    await waitFor(() =>
      expect(result.current.submitError).toBe('No se pudo iniciar sesión.'),
    );
    expect(result.current.submitError).not.toContain('provider');
    expect(result.current.submitted).toBe(false);
  });
});
