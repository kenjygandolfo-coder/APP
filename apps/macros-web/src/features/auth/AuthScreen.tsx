import { useState } from 'react';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { SecondaryButton } from '../macros-wizard/components/Button';
import { COPY } from './copy.es';
import type { AuthLogger } from './types';

type Mode = 'login' | 'register';

interface AuthScreenProps {
  readonly onSuccess?: () => void;
  readonly logger?: AuthLogger;
}

/**
 * Auth entry point. Toggles between Login and Registro, rendering the active
 * form inside the cozy cream layout. The switch button text comes from the
 * frozen Spanish copy.
 */
export function AuthScreen({ onSuccess, logger }: AuthScreenProps): JSX.Element {
  const [mode, setMode] = useState<Mode>('login');

  const switchPrompt =
    mode === 'login' ? COPY.login.switchPrompt : COPY.register.switchPrompt;

  const toggleMode = (): void => {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {mode === 'login' ? (
        <LoginForm onSuccess={onSuccess} logger={logger} />
      ) : (
        <RegisterForm onSuccess={onSuccess} logger={logger} />
      )}
      <SecondaryButton onClick={toggleMode}>{switchPrompt}</SecondaryButton>
    </div>
  );
}
