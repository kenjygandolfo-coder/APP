import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AuthScreen } from '../AuthScreen';
import { COPY } from '../copy.es';

describe('AuthScreen', () => {
  it('renders the Login form by default', () => {
    render(<AuthScreen />);
    expect(
      screen.getByRole('heading', { name: COPY.login.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: COPY.login.switchPrompt }),
    ).toBeInTheDocument();
  });

  it('toggles to the Registro form and back via the switch button', async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.click(
      screen.getByRole('button', { name: COPY.login.switchPrompt }),
    );
    expect(
      screen.getByRole('heading', { name: COPY.register.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(COPY.fields.confirmPassword),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: COPY.register.switchPrompt }),
    );
    expect(
      screen.getByRole('heading', { name: COPY.login.title }),
    ).toBeInTheDocument();
  });
});
