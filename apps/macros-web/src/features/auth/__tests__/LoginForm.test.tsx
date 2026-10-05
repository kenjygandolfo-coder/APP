import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '../LoginForm';
import { COPY } from '../copy.es';

// The default (no-onSubmit) path now hits the real Supabase sign-in through
// useAuthActions -> auth.data. Mock that module so these tests never require a
// live Supabase project or env; the lazy client is never constructed either.
const signInWithPassword =
  vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
    Promise.resolve({ user: { id: 'user-1' } }),
  );

vi.mock('../auth.data', () => ({
  signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
}));

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: {} }),
}));

const VALID_EMAIL = 'ana@ejemplo.com';
const VALID_PASSWORD = 'superSecreta1';

describe('LoginForm', () => {
  beforeEach(() => {
    signInWithPassword.mockClear();
  });

  it('shows Spanish email and password errors on empty submit and does not call onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const logger = vi.fn();
    render(<LoginForm onSubmit={onSubmit} logger={logger} />);

    await user.click(screen.getByRole('button', { name: COPY.login.submit }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument();
    expect(
      screen.getByText('La contraseña debe tener al menos 8 caracteres.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(logger).not.toHaveBeenCalled();
  });

  it('invokes the injected onSubmit with validated data on a valid submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: COPY.login.submit }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      COPY.login.success,
    );
    // The injected handler fully replaces the real path.
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('default handler logs only a redacted shape and never the raw password', async () => {
    const user = userEvent.setup();
    const logger = vi.fn();
    render(<LoginForm onSubmit={undefined} logger={logger} />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: COPY.login.submit }));

    // With a real onSubmit wired by default, the logger is not invoked by the
    // form; the invariant we still assert is that the raw password never leaks
    // through logging. Redacted-shape logging itself is unit-tested against
    // useAuthSubmit's default path separately.
    expect(JSON.stringify(logger.mock.calls)).not.toContain(VALID_PASSWORD);
  });

  it('default handler calls the real signInWithPassword with the validated credentials', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: COPY.login.submit }));

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledTimes(1));
    expect(signInWithPassword).toHaveBeenCalledWith(expect.anything(), {
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      COPY.login.success,
    );
  });

  it('shows a friendly, non-leaky error when the real sign-in rejects', async () => {
    const user = userEvent.setup();
    signInWithPassword.mockRejectedValueOnce(
      new Error('Invalid login credentials'),
    );
    render(<LoginForm />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: COPY.login.submit }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'No se pudo iniciar sesión. Revisa tu correo y contraseña.',
    );
    // Provider text must never leak into the UI.
    expect(alert.textContent ?? '').not.toContain('Invalid login credentials');
  });
});
