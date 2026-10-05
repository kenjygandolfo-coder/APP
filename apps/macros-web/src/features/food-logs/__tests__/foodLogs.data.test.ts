import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../../../data/database.types';
import { addFoodLog, getDailyFoodLogs } from '../foodLogs.data';
import type { AddFoodLogInput, FoodLog } from '../types';

type Client = SupabaseClient<Database>;

/** A Postgrest-shaped error whose internals must never leak to the caller. */
const RAW_DETAIL = 'relation "food_logs" violates policy super-secret-detail';
const postgrestError = {
  message: 'permission denied',
  details: RAW_DETAIL,
  hint: 'leak-hint',
  code: '42501',
};

const sampleLog: FoodLog = {
  id: 'log-1',
  user_id: 'user-1',
  logged_on: '2026-02-01',
  name: 'Pollo',
  quantity: 1,
  unit: 'serving',
  calories: 300,
  protein_g: 40,
  fat_g: 8,
  carbs_g: 2,
  created_at: '2026-02-01T08:00:00.000Z',
  updated_at: '2026-02-01T08:00:00.000Z',
};

interface ListResult {
  data: FoodLog[] | null;
  error: typeof postgrestError | null;
}

/** Mock the `.from().select().eq().eq().order()` getter chain. */
function mockGetterClient(result: ListResult): Client {
  const order = vi.fn().mockResolvedValue(result);
  const eqDate = vi.fn().mockReturnValue({ order });
  const eqUser = vi.fn().mockReturnValue({ eq: eqDate });
  const select = vi.fn().mockReturnValue({ eq: eqUser });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as Client;
}

interface InsertResult {
  data: FoodLog | null;
  error: typeof postgrestError | null;
}

/** Mock the `.from().insert().select().single()` writer chain. */
function mockInserterClient(result: InsertResult) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });
  const client = { from } as unknown as Client;
  return { client, insert };
}

describe('getDailyFoodLogs', () => {
  it('returns the logs scoped by user and date on success', async () => {
    const client = mockGetterClient({ data: [sampleLog], error: null });

    await expect(
      getDailyFoodLogs(client, 'user-1', '2026-02-01'),
    ).resolves.toEqual([sampleLog]);
  });

  it('returns an empty array (never null) when the day has no logs', async () => {
    const client = mockGetterClient({ data: null, error: null });

    await expect(
      getDailyFoodLogs(client, 'user-1', '2026-02-01'),
    ).resolves.toEqual([]);
  });

  it('throws a clear error that does not leak Postgrest internals', async () => {
    const client = mockGetterClient({ data: null, error: postgrestError });

    const error = await getDailyFoodLogs(client, 'user-1', '2026-02-01').catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('daily food logs');
    expect((error as Error).message).not.toContain(RAW_DETAIL);
    expect((error as Error).message).not.toContain('leak-hint');
    expect((error as Error).message).not.toContain('permission denied');
    expect((error as Error).cause).toBe(postgrestError);
  });
});

describe('addFoodLog', () => {
  const minimalInput: AddFoodLogInput = {
    user_id: 'user-1',
    name: 'Pollo',
    calories: 300,
  };

  it('inserts and returns the saved log', async () => {
    const { client, insert } = mockInserterClient({
      data: sampleLog,
      error: null,
    });

    const saved = await addFoodLog(client, minimalInput);

    expect(saved).toEqual(sampleLog);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('applies quantity=1 and unit="serving" defaults for omitted columns', async () => {
    const { client, insert } = mockInserterClient({
      data: sampleLog,
      error: null,
    });

    await addFoodLog(client, minimalInput);

    expect(insert).toHaveBeenCalledWith({
      quantity: 1,
      unit: 'serving',
      user_id: 'user-1',
      name: 'Pollo',
      calories: 300,
    });
  });

  it('lets caller-provided quantity and unit override the defaults', async () => {
    const { client, insert } = mockInserterClient({
      data: sampleLog,
      error: null,
    });

    await addFoodLog(client, { ...minimalInput, quantity: 2, unit: 'g' });

    expect(insert).toHaveBeenCalledWith({
      quantity: 2,
      unit: 'g',
      user_id: 'user-1',
      name: 'Pollo',
      calories: 300,
    });
  });

  it('does not mutate the input object', async () => {
    const { client } = mockInserterClient({ data: sampleLog, error: null });
    const input: AddFoodLogInput = { ...minimalInput };

    await addFoodLog(client, input);

    expect(input).toEqual(minimalInput);
    expect(input).not.toHaveProperty('quantity');
    expect(input).not.toHaveProperty('unit');
  });

  it('throws a clear error that does not leak Postgrest internals', async () => {
    const { client } = mockInserterClient({
      data: null,
      error: postgrestError,
    });

    const error = await addFoodLog(client, minimalInput).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('add the food log');
    expect((error as Error).message).not.toContain(RAW_DETAIL);
    expect((error as Error).message).not.toContain('leak-hint');
    expect((error as Error).message).not.toContain('permission denied');
    expect((error as Error).cause).toBe(postgrestError);
  });
});
