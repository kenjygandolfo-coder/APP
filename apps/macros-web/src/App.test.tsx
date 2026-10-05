import type { SupabaseClient } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Confirms the "@energy" alias resolves the reused portable domain under Vitest.
import { calculateTdee } from '@energy';

import type { Database } from './data/database.types';
import App from './App';
import { QueryProvider } from './app/QueryProvider';
import { SessionProvider } from './app/SessionProvider';

type Client = SupabaseClient<Database>;

// Mock client so SessionProvider never requires Supabase env; it bootstraps as
// anonymous and never emits a session.
function makeMockClient(): Client {
  return {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  } as unknown as Client;
}

function renderApp(): void {
  render(
    <SessionProvider client={makeMockClient()}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </SessionProvider>,
  );
}

describe('App', () => {
  it('renders the app title as the top-level heading', () => {
    renderApp();
    expect(
      screen.getByRole('heading', { level: 1, name: /calculadora de macros/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/asistente paso a paso para descubrir tus metas/i),
    ).toBeInTheDocument();
  });

  it('renders the macros wizard starting on step 1', () => {
    renderApp();
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /sobre ti/i }),
    ).toBeInTheDocument();
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
