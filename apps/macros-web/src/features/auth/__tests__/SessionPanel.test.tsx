import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SessionPanel } from '../SessionPanel';
import { SessionContext, type SessionState } from '../sessionContext';
import { COPY } from '../copy.es';

const signOut = vi.fn(() => Promise.resolve());

vi.mock('../auth.data', () => ({
  signOut: () => signOut(),
}));

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: {} }),
}));

// Keep the macro-goal read idle/empty so the panel renders the empty message.
vi.mock('../../macro-goals/macroGoals.data', () => ({
  getActiveMacroGoal: () => Promise.resolve(null),
}));

const USER_ID = '11111111-1111-1111-1111-111111111111';

function renderWithSession(state: SessionState): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = (children: ReactNode): JSX.Element => (
    <SessionContext.Provider value={state}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionContext.Provider>
  );
  render(wrapper(<SessionPanel />));
}

describe('SessionPanel', () => {
  it('renders nothing when the user is not authenticated', () => {
    renderWithSession({
      session: null,
      user: null,
      userId: null,
      status: 'anonymous',
    });
    expect(
      screen.queryByRole('button', { name: COPY.session.signOut }),
    ).not.toBeInTheDocument();
  });

  it('shows the sign-out affordance when authenticated and signs out on click', async () => {
    const user = userEvent.setup();
    signOut.mockClear();
    renderWithSession({
      session: { user: { id: USER_ID } } as never,
      user: { id: USER_ID } as never,
      userId: USER_ID,
      status: 'authenticated',
    });

    const button = screen.getByRole('button', { name: COPY.session.signOut });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
