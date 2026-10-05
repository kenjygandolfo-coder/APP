import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../../../data/database.types';
import { getActiveMacroGoal, saveMacroGoal } from '../macroGoals.data';
import type { MacroGoal, SaveMacroGoalInput } from '../types';

type Client = SupabaseClient<Database>;

/** A Postgrest-shaped error whose internals must never leak to the caller. */
const RAW_DETAIL = 'relation "macro_goals" violates policy super-secret-detail';
const postgrestError = {
  message: 'permission denied',
  details: RAW_DETAIL,
  hint: 'leak-hint',
  code: '42501',
};

const sampleGoal: MacroGoal = {
  id: 'goal-1',
  user_id: 'user-1',
  goal_type: 'deficit',
  tdee: 2200,
  calorie_target: 1900,
  protein_g: 150,
  fat_g: 60,
  carbs_g: 200,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const sampleInput: SaveMacroGoalInput = {
  user_id: 'user-1',
  goal_type: 'deficit',
  tdee: 2200,
  calorie_target: 1900,
  protein_g: 150,
  fat_g: 60,
  carbs_g: 200,
};

interface SingleResult {
  data: MacroGoal | null;
  error: typeof postgrestError | null;
}

/** Mock the `.from().select().eq().eq().maybeSingle()` getter chain. */
function mockGetterClient(result: SingleResult): Client {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eqActive = vi.fn().mockReturnValue({ maybeSingle });
  const eqUser = vi.fn().mockReturnValue({ eq: eqActive });
  const select = vi.fn().mockReturnValue({ eq: eqUser });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as Client;
}

/**
 * Mock the saver's single `client.rpc('save_active_macro_goal', args)` call.
 * The RPC resolves `{ data, error }` just like the real Supabase client.
 */
function mockSaverClient(result: SingleResult) {
  const rpc = vi.fn().mockResolvedValue(result);
  const client = { rpc } as unknown as Client;
  return { client, rpc };
}

describe('getActiveMacroGoal', () => {
  it('returns the mapped active goal on success', async () => {
    const client = mockGetterClient({ data: sampleGoal, error: null });

    await expect(getActiveMacroGoal(client, 'user-1')).resolves.toEqual(
      sampleGoal,
    );
  });

  it('returns null when no active goal exists', async () => {
    const client = mockGetterClient({ data: null, error: null });

    await expect(getActiveMacroGoal(client, 'user-1')).resolves.toBeNull();
  });

  it('throws a clear error that does not leak Postgrest internals', async () => {
    const client = mockGetterClient({ data: null, error: postgrestError });

    const error = await getActiveMacroGoal(client, 'user-1').catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('active macro goal');
    expect((error as Error).message).not.toContain(RAW_DETAIL);
    expect((error as Error).message).not.toContain('leak-hint');
    expect((error as Error).message).not.toContain('permission denied');
  });
});

describe('saveMacroGoal', () => {
  /** The exact args the transactional RPC should receive, derived from input. */
  const expectedArgs = {
    p_goal_type: sampleInput.goal_type,
    p_tdee: sampleInput.tdee,
    p_calorie_target: sampleInput.calorie_target,
    p_protein_g: sampleInput.protein_g,
    p_fat_g: sampleInput.fat_g,
    p_carbs_g: sampleInput.carbs_g,
  };

  it('calls the transactional RPC once and returns the saved goal', async () => {
    const { client, rpc } = mockSaverClient({ data: sampleGoal, error: null });

    const saved = await saveMacroGoal(client, sampleInput);

    expect(saved).toEqual(sampleGoal);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('save_active_macro_goal', expectedArgs);
  });

  it('never sources ownership from the client (no user_id / is_active)', async () => {
    const { client, rpc } = mockSaverClient({ data: sampleGoal, error: null });

    await saveMacroGoal(client, sampleInput);

    const args = rpc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args).toEqual(expectedArgs);
    expect(args).not.toHaveProperty('user_id');
    expect(args).not.toHaveProperty('is_active');
  });

  it('does not mutate the input object', async () => {
    const { client } = mockSaverClient({ data: sampleGoal, error: null });
    const input = { ...sampleInput };

    await saveMacroGoal(client, input);

    expect(input).toEqual(sampleInput);
    expect(input).not.toHaveProperty('is_active');
  });

  it('throws a clear error that does not leak Postgrest internals', async () => {
    const { client } = mockSaverClient({ data: null, error: postgrestError });

    const error = await saveMacroGoal(client, sampleInput).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('save the macro goal');
    expect((error as Error).message).not.toContain(RAW_DETAIL);
    expect((error as Error).message).not.toContain('leak-hint');
    expect((error as Error).message).not.toContain('permission denied');
  });

  it('throws a clear error when the RPC returns no row and no error', async () => {
    const { client } = mockSaverClient({ data: null, error: null });

    const error = await saveMacroGoal(client, sampleInput).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('save the macro goal');
  });
});
