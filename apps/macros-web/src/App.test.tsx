import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// Confirms the "@energy" alias resolves the reused portable domain under Vitest.
import { calculateTdee } from '@energy';

import type { Database } from './data/database.types';
import App from './App';
import { QueryProvider } from './app/QueryProvider';
import { SessionProvider } from './app/SessionProvider';
import { COPY as FOOD_COPY } from './features/food-logs/copy.es';

type Client = SupabaseClient<Database>;

const USER_ID = '11111111-1111-1111-1111-111111111111';
const DIARIO_LABEL = 'Diario';
const DIARIO_SIGNED_OUT = 'Inicia sesión para ver tu diario de hoy.';

// The food diary signed-in branch mounts DailyDashboard (useMacroGoal +
// useDailyFoodLogs) and ManualFoodForm (useAddFoodLog). Mock the data layer so
// those TanStack Query hooks resolve deterministically without a real client.
vi.mock('./lib/supabaseClient', () => ({
  getSupabaseClient: () => ({}) as unknown,
}));

vi.mock('./features/macro-goals/macroGoals.data', () => ({
  getActiveMacroGoal: () => Promise.resolve(null),
}));

vi.mock('./features/food-logs/foodLogs.data', () => ({
  getDailyFoodLogs: () => Promise.resolve([]),
  addFoodLog: () => Promise.resolve({}),
}));

// A session for the authenticated user; shape only needs what SessionProvider
// and the session selectors read (user.id).
const authedSession = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: USER_ID } as unknown,
} as unknown as Session;

// Mock client so SessionProvider never requires Supabase env; `initialSession`
// controls whether the app bootstraps signed-in or anonymous.
function makeMockClient(initialSession: Session | null): Client {
  return {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: initialSession }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  } as unknown as Client;
}

// Awaits the async SessionProvider seed (getSession) so the state settles
// inside `act`, keeping the suite free of React act() warnings.
async function renderApp(
  initialSession: Session | null = null,
): Promise<void> {
  render(
    <SessionProvider client={makeMockClient(initialSession)}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </SessionProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument(),
  );
}

describe('App', () => {
  it('renders the app title as the top-level heading', async () => {
    await renderApp();
    expect(
      screen.getByRole('heading', { level: 1, name: /calculadora de macros/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/asistente paso a paso para descubrir tus metas/i),
    ).toBeInTheDocument();
  });

  it('renders the macros wizard starting on step 1', async () => {
    await renderApp();
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /sobre ti/i }),
    ).toBeInTheDocument();
  });

  it('renders the dashboard and manual form when the diary is selected while signed in', async () => {
    const user = userEvent.setup();
    await renderApp(authedSession);

    // Signed-in state settles authenticated before we switch views.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /cerrar sesión/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: DIARIO_LABEL }));

    // The dashboard heading and the manual entry form both render; the
    // signed-out prompt must NOT be present.
    expect(
      await screen.findByRole('heading', {
        name: FOOD_COPY.dashboard.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: FOOD_COPY.form.title }),
    ).toBeInTheDocument();
    expect(screen.queryByText(DIARIO_SIGNED_OUT)).not.toBeInTheDocument();
  });

  it('shows the friendly prompt and no dashboard when the diary is selected while signed out', async () => {
    const user = userEvent.setup();
    await renderApp(null);

    await user.click(screen.getByRole('button', { name: DIARIO_LABEL }));

    expect(screen.getByText(DIARIO_SIGNED_OUT)).toBeInTheDocument();
    // The dashboard and manual form are gated behind a real userId.
    expect(
      screen.queryByRole('heading', { name: FOOD_COPY.dashboard.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: FOOD_COPY.form.title }),
    ).not.toBeInTheDocument();
  });

  it('reuses the energy domain through the @energy alias', () => {
    const result = calculateTdee({
      sex: 'male',
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      activityLevel: 'moderate',
    });
    expect(result.tdee).toBeGreaterThan(0);
    expect(result.multiplier).toBe(1.55);
  });
});
