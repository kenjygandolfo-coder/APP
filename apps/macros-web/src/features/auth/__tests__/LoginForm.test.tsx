import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm } from '../LoginForm';
import { COPY } from '../copy.es';

const saveToken = vi.fn<(token: string) => Promise<void>>(() =>
  Promise.resolve(),
);

vi.mock('../storage', () => ({
  useAuthStorage: () => ({
    saveToken,
    getToken: vi.fn(() => Promise.resolve(null)),
    deleteToken: vi.fn(() => Promise.resolve()),
  }),
}));

const VALID_EMAIL = 'ana@ejemplo.com';
const VALID_PASSWORD = 'superSecreta1';

describe('LoginForm', () => {
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
  });

  it('default handler logs only a redacted shape and never the raw password', async () => {
    const user = userEvent.setup();
    const logger = vi.fn();
    render(<LoginForm logger={logger} />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: COPY.login.submit }));

    await waitFor(() => expect(logger).toHaveBeenCalledTimes(1));
    expect(logger).toHaveBeenCalledWith('login', {
      email: VALID_EMAIL,
      passwordLength: VALID_PASSWORD.length,
    });
    // The raw password must never appear anywhere in the logged args.
    const serialized = JSON.stringify(logger.mock.calls);
    expect(serialized).not.toContain(VALID_PASSWORD);
    expect(await screen.findByRole('status')).toHaveTextContent(
      COPY.login.success,
    );
  });

  it('default handler persists a non-secret placeholder token via storage', async () => {
    const user = userEvent.setup();
    saveToken.mockClear();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: COPY.login.submit }));

    await waitFor(() => expect(saveToken).toHaveBeenCalledTimes(1));
    const [token] = saveToken.mock.calls[0] as [string];
    expect(token).toMatch(/^session-\d+$/);
    expect(token).not.toContain(VALID_PASSWORD);
  });
});
