import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegisterForm } from '../RegisterForm';
import { COPY } from '../copy.es';

// The default (no-onSubmit) path now hits the real Supabase sign-up through
// useAuthActions -> auth.data. Mock that module so these tests never require a
// live Supabase project or env.
const signUpWithPassword =
  vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
    Promise.resolve({ user: { id: 'user-1' } }),
  );

vi.mock('../auth.data', () => ({
  signUpWithPassword: (...args: unknown[]) => signUpWithPassword(...args),
}));

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: {} }),
}));

const VALID_EMAIL = 'nuevo@ejemplo.com';
const VALID_PASSWORD = 'superSecreta1';

describe('RegisterForm', () => {
  beforeEach(() => {
    signUpWithPassword.mockClear();
  });

  it('shows the mismatch error on confirmPassword and does not submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const logger = vi.fn();
    render(<RegisterForm onSubmit={onSubmit} logger={logger} />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.type(
      screen.getByLabelText(COPY.fields.confirmPassword),
      'otraClave9',
    );
    await user.click(screen.getByRole('button', { name: COPY.register.submit }));

    expect(
      await screen.findByText('Las contraseñas no coinciden.'),
    ).toBeInTheDocument();
    const confirmError = screen.getByText('Las contraseñas no coinciden.');
    expect(confirmError).toHaveAttribute(
      'id',
      'register-confirm-password-error',
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(logger).not.toHaveBeenCalled();
  });

  it('submits matching valid data with validated values and no raw password logged', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const logger = vi.fn();
    render(<RegisterForm onSubmit={onSubmit} logger={logger} />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.type(
      screen.getByLabelText(COPY.fields.confirmPassword),
      VALID_PASSWORD,
    );
    await user.click(screen.getByRole('button', { name: COPY.register.submit }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });
    // Injected onSubmit replaces the default path, so logger is not called; the
    // critical invariant is that the raw password is never handed to logger.
    const serialized = JSON.stringify(logger.mock.calls);
    expect(serialized).not.toContain(VALID_PASSWORD);
    expect(await screen.findByRole('status')).toHaveTextContent(
      COPY.register.success,
    );
    expect(signUpWithPassword).not.toHaveBeenCalled();
  });

  it('default handler calls the real signUpWithPassword with confirmPassword dropped', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.type(
      screen.getByLabelText(COPY.fields.confirmPassword),
      VALID_PASSWORD,
    );
    await user.click(screen.getByRole('button', { name: COPY.register.submit }));

    await waitFor(() => expect(signUpWithPassword).toHaveBeenCalledTimes(1));
    // confirmPassword must never reach the provider.
    expect(signUpWithPassword).toHaveBeenCalledWith(expect.anything(), {
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      COPY.register.success,
    );
  });

  it('shows a friendly, non-leaky error when the real sign-up rejects', async () => {
    const user = userEvent.setup();
    signUpWithPassword.mockRejectedValueOnce(
      new Error('User already registered'),
    );
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.type(
      screen.getByLabelText(COPY.fields.confirmPassword),
      VALID_PASSWORD,
    );
    await user.click(screen.getByRole('button', { name: COPY.register.submit }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'No se pudo crear la cuenta. Verifica tus datos e inténtalo de nuevo.',
    );
    expect(alert.textContent ?? '').not.toContain('User already registered');
  });
});
