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

interface SaverResults {
  deactivateError?: typeof postgrestError | null;
  insert: SingleResult;
}

/**
 * Mock the saver's two chains:
 * `.from().update().eq().eq()` then `.from().insert().select().single()`.
 */
function mockSaverClient(results: SaverResults) {
  const eqActive = vi
    .fn()
    .mockResolvedValue({ error: results.deactivateError ?? null });
  const eqUser = vi.fn().mockReturnValue({ eq: eqActive });
  const update = vi.fn().mockReturnValue({ eq: eqUser });

  const single = vi.fn().mockResolvedValue(results.insert);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });

  const from = vi.fn().mockReturnValue({ update, insert });
  const client = { from } as unknown as Client;
  return { client, update, insert };
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
  it('deactivates then inserts and returns the saved goal', async () => {
    const { client, insert } = mockSaverClient({
      insert: { data: sampleGoal, error: null },
    });

    const saved = await saveMacroGoal(client, sampleInput);

    expect(saved).toEqual(sampleGoal);
    expect(insert).toHaveBeenCalledWith({ ...sampleInput, is_active: true });
  });

  it('does not mutate the input object', async () => {
    const { client } = mockSaverClient({
      insert: { data: sampleGoal, error: null },
    });
    const input = { ...sampleInput };

    await saveMacroGoal(client, input);

    expect(input).toEqual(sampleInput);
    expect(input).not.toHaveProperty('is_active');
  });

  it('throws a clear error when deactivation fails', async () => {
    const { client } = mockSaverClient({
      deactivateError: postgrestError,
      insert: { data: null, error: null },
    });

    const error = await saveMacroGoal(client, sampleInput).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('deactivate');
    expect((error as Error).message).not.toContain(RAW_DETAIL);
  });

  it('throws a clear error when the insert fails', async () => {
    const { client } = mockSaverClient({
      insert: { data: null, error: postgrestError },
    });

    const error = await saveMacroGoal(client, sampleInput).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('save the macro goal');
    expect((error as Error).message).not.toContain(RAW_DETAIL);
  });
});
