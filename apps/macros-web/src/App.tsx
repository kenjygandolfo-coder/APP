import { useCallback, useState } from 'react';

import type { MacroResult } from './domain';
import { AuthScreen } from './features/auth/AuthScreen';
import { SessionPanel } from './features/auth/SessionPanel';
import { useSession } from './features/auth/useSession';
import { COPY } from './features/macros-wizard/copy.es';
import { MacrosWizard } from './features/macros-wizard/MacrosWizard';
import {
  PrimaryButton,
  SecondaryButton,
} from './features/macros-wizard/components/Button';
import { useSaveMacroGoal } from './features/macro-goals/useSaveMacroGoal';
import { toSaveMacroGoalInput } from './features/macro-goals/toSaveMacroGoalInput';

type View = 'macros' | 'auth';

const MACROS_LABEL = 'Calculadora de macros';
const AUTH_LABEL = 'Cuenta';

/**
 * Root of the web module. A minimal top-level view switch (no react-router)
 * exposes both the Macros wizard (Module 2) and the Auth screens (Module 3)
 * on the shared cozy cream background.
 */
export default function App(): JSX.Element {
  const [view, setView] = useState<View>('macros');
  const { userId } = useSession();

  // Real userId from the live session feeds the macro-goal data hooks; the save
  // mutation is wired into the wizard's save action so an authenticated user
  // actually persists a goal (the mutation stays inert until a userId exists).
  const saveMacroGoal = useSaveMacroGoal(userId);

  const handleSaveGoal = useCallback(
    (result: MacroResult): void => {
      // Only persist when authenticated; signed-out users keep the local-only
      // confirmation. Authorization of the write itself is enforced by RLS.
      if (!userId) {
        return;
      }
      saveMacroGoal.mutate(toSaveMacroGoalInput(userId, result));
    },
    [saveMacroGoal, userId],
  );

  const Macros = view === 'macros' ? PrimaryButton : SecondaryButton;
  const Auth = view === 'auth' ? PrimaryButton : SecondaryButton;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream p-4">
      <header className="text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
          {COPY.app.title}
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          {COPY.app.subtitle}
        </p>
      </header>

      <nav className="flex items-center gap-3" aria-label="Secciones">
        <Macros onClick={() => setView('macros')}>{MACROS_LABEL}</Macros>
        <Auth onClick={() => setView('auth')}>{AUTH_LABEL}</Auth>
      </nav>

      <SessionPanel />

      {view === 'macros' ? (
        <MacrosWizard onSave={handleSaveGoal} />
      ) : (
        <AuthScreen />
      )}
    </main>
  );
}
