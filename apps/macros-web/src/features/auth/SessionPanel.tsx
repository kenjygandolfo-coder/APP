import { signOut } from './auth.data';
import { COPY } from './copy.es';
import { useSession } from './useSession';
import { SecondaryButton } from '../macros-wizard/components/Button';
import { useMacroGoal } from '../macro-goals/useMacroGoal';
import { getSupabaseClient } from '../../lib/supabaseClient';

/**
 * Session-aware panel shown once the user is authenticated. It feeds the real
 * `userId` from {@link useSession} into {@link useMacroGoal} so the data layer
 * lights up with a real user, and offers a sign-out affordance. The matching
 * save mutation is wired into the macros-wizard save action in `App.tsx`; here
 * we surface the read-side status so the integration is visible in the layout.
 */
export function SessionPanel(): JSX.Element | null {
  const { status, userId } = useSession();
  const macroGoal = useMacroGoal(userId);

  if (status !== 'authenticated' || !userId) {
    return null;
  }

  const handleSignOut = (): void => {
    // supabase-js owns session persistence; signing out clears its stored
    // session and `onAuthStateChange` resets the SessionProvider state.
    void signOut(getSupabaseClient());
  };

  const goalMessage = macroGoal.isLoading
    ? COPY.session.goalLoading
    : macroGoal.data
      ? COPY.session.goalActive
      : COPY.session.goalEmpty;

  return (
    <section
      aria-label="Sesión"
      className="flex w-full max-w-sm flex-col items-center gap-3 text-center"
    >
      <p className="text-sm text-muted">{goalMessage}</p>
      <SecondaryButton onClick={handleSignOut}>
        {COPY.session.signOut}
      </SecondaryButton>
    </section>
  );
}
