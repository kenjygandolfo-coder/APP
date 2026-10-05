import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../../App';
import { QueryProvider } from '../../../app/QueryProvider';
import { SessionContext, type SessionState } from '../../auth/sessionContext';

const USER_ID = '11111111-1111-1111-1111-111111111111';

// Spy on the data layer so the test can assert the save mutation actually runs
// with the mapped input, without a live Supabase project.
const saveMacroGoal =
  vi.fn<(client: unknown, input: Record<string, unknown>) => Promise<unknown>>(
    () => Promise.resolve({ id: 'goal-1' }),
  );
const getActiveMacroGoal =
  vi.fn<(...args: readonly unknown[]) => Promise<unknown>>(() =>
    Promise.resolve(null),
  );

vi.mock('../macroGoals.data', () => ({
  saveMacroGoal: (client: unknown, input: Record<string, unknown>) =>
    saveMacroGoal(client, input),
  getActiveMacroGoal: (...args: readonly unknown[]) =>
    getActiveMacroGoal(...args),
}));

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: {} }),
}));

const AUTHENTICATED: SessionState = {
  session: { user: { id: USER_ID } } as never,
  user: { id: USER_ID } as never,
  userId: USER_ID,
  status: 'authenticated',
};

function renderAuthenticatedApp(): void {
  // A static authenticated SessionContext avoids the async seed (and its act()
  // warning) so this test focuses purely on the save-wiring assertion.
  render(
    <SessionContext.Provider value={AUTHENTICATED}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </SessionContext.Provider>,
  );
}

async function completeWizard(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.selectOptions(screen.getByLabelText('Género'), 'male');
  await user.type(screen.getByLabelText('Edad'), '30');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await user.type(screen.getByLabelText('Peso (kg)'), '80');
  await user.type(screen.getByLabelText('Altura (cm)'), '180');
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
  await user.selectOptions(
    screen.getByLabelText('Nivel de actividad'),
    'Moderado',
  );
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
}

describe('save-goal wiring (authenticated App)', () => {
  beforeEach(() => {
    saveMacroGoal.mockClear();
    getActiveMacroGoal.mockClear();
  });

  it('persists the macro goal against the real userId on save', async () => {
    const user = userEvent.setup();
    renderAuthenticatedApp();

    await completeWizard(user);
    await screen.findByText(/paso 4 de 4/i);

    await user.click(screen.getByRole('button', { name: 'Guardar mis metas' }));

    await waitFor(() => expect(saveMacroGoal).toHaveBeenCalledTimes(1));
    const input = saveMacroGoal.mock.calls[0]?.[1];
    expect(input).toMatchObject({
      user_id: USER_ID,
      goal_type: 'mantenimiento',
    });
    expect(input?.calorie_target).toBeGreaterThan(0);
    expect(input?.protein_g).toBeGreaterThan(0);
    // Local confirmation still shows.
    expect(await screen.findByRole('status')).toHaveTextContent(
      /guardaron con éxito/i,
    );
  });
});
