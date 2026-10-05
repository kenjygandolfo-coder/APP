import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RegisterForm } from '../RegisterForm';
import { COPY } from '../copy.es';

const VALID_EMAIL = 'nuevo@ejemplo.com';
const VALID_PASSWORD = 'superSecreta1';

describe('RegisterForm', () => {
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
    // Injected onSubmit replaces the default logger path, so logger is not called;
    // the critical invariant is that the raw password is never handed to logger.
    const serialized = JSON.stringify(logger.mock.calls);
    expect(serialized).not.toContain(VALID_PASSWORD);
    expect(await screen.findByRole('status')).toHaveTextContent(
      COPY.register.success,
    );
  });

  it('default handler logs only the redacted shape', async () => {
    const user = userEvent.setup();
    const logger = vi.fn();
    render(<RegisterForm logger={logger} />);

    await user.type(screen.getByLabelText(COPY.fields.email), VALID_EMAIL);
    await user.type(screen.getByLabelText(COPY.fields.password), VALID_PASSWORD);
    await user.type(
      screen.getByLabelText(COPY.fields.confirmPassword),
      VALID_PASSWORD,
    );
    await user.click(screen.getByRole('button', { name: COPY.register.submit }));

    await waitFor(() => expect(logger).toHaveBeenCalledTimes(1));
    expect(logger).toHaveBeenCalledWith('register', {
      email: VALID_EMAIL,
      passwordLength: VALID_PASSWORD.length,
    });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(VALID_PASSWORD);
  });
});
