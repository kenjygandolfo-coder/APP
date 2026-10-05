# Module 7 — Transactional macro-goal save via Postgres RPC

> Plan number: **07** (prior files: 02–06 in `.tasks/`). Closes the single
> non-blocking issue flagged by the PR #4 (Supabase data layer) semantic review.

## Branch

- **Proposed branch:** `fix/macro-goal-transactional-save`
- **Base branch:** `feat/modulo-6-food-logs-dashboard` (stacked PR; tip of the stack).
- **Merge order:** #1 → #2 → #3 (auth) → #4 (data) → #5 (real-auth) → #6 (food-logs) → **this**.

## Problem (the gap PR #4 flagged)

`saveMacroGoal(client, input)` today performs TWO non-transactional round-trips:

1. `UPDATE macro_goals SET is_active = false WHERE user_id = ? AND is_active`
2. `INSERT INTO macro_goals (...) VALUES (...) RETURNING *`

If step 2 fails after step 1 commits, the user is left with **no active goal** — a
data-integrity gap. Two separate network calls cannot roll back together from the
client.

## Solution

Move both writes into ONE Postgres `plpgsql` function
(`public.save_active_macro_goal`). Because it runs server-side inside a single
implicit transaction, a failure in the insert rolls back the deactivate too
(all-or-nothing).

### Security decision: `SECURITY INVOKER` (default)

- The function runs with the **caller's** privileges, so the existing RLS
  policies on `macro_goals` (`auth.uid() = user_id`) still apply naturally — the
  function can only touch the caller's own rows.
- Ownership is derived **inside** the function from `auth.uid()`; the client does
  NOT pass `user_id` for authorization. If `auth.uid()` is null (no session) the
  function raises, so an unauthenticated caller cannot write.
- `search_path` is still pinned (`set search_path = ''`, everything schema
  qualified) as defense in depth, even though INVOKER does not strictly require it.
- The **partial unique index** `macro_goals_one_active_per_user` stays as the
  final backstop (defense in depth) even though the function now orders the
  writes correctly.

### Argument shape

Typed args: `p_goal_type`, `p_tdee`, `p_calorie_target`, `p_protein_g`,
`p_fat_g`, `p_carbs_g`. `user_id` is derived from `auth.uid()` inside the
function and is NOT a parameter — the client cannot spoof another user's row.
Returns the inserted `macro_goals` row (`returns public.macro_goals`).

## Features

### FEAT-001 — Transactional RPC migration + strict types + data-layer refactor + tests

One coherent unit (the migration, its typing, the data-layer swap, and the test
rewrite are tightly coupled and must land together to keep the suite green).

**Files:**

1. `apps/macros-web/supabase/migrations/0002_macro_goal_transactional_save.sql`
   — NEW. `create or replace function public.save_active_macro_goal(...)`,
   `plpgsql`, `security invoker`, `set search_path = ''`, derives owner from
   `auth.uid()`, raises on null uid, deactivates then inserts, returns the row.
   Run-order header consistent with 0001. Append-only (do NOT edit 0001).
2. `apps/macros-web/src/data/database.types.ts` — type the function under
   `public.Functions.save_active_macro_goal` with precise `Args` and `Returns`
   (`Returns = macro_goals Row`). No `any`.
3. `apps/macros-web/src/features/macro-goals/macroGoals.data.ts` — refactor
   `saveMacroGoal` to a single `client.rpc('save_active_macro_goal', args)` call.
   Build a fresh args object from `input` (no mutation). Keep the signature
   `(client, SaveMacroGoalInput) => Promise<MacroGoal>`. Keep `toClearError`
   non-leaky. Keep `getActiveMacroGoal` unchanged.
4. `apps/macros-web/src/features/macro-goals/__tests__/macroGoals.data.test.ts`
   — rewrite the `saveMacroGoal` suite to mock `client.rpc`. Assert: success
   returns mapped `MacroGoal`; rpc called with correct fn name + arg object;
   input not mutated / no `is_active`; failure maps to clear non-leaky error
   (keep super-secret-detail / leak-hint / permission-denied non-leak checks).
   Keep `getActiveMacroGoal` tests intact.

**Acceptance criteria:**

- `npx vitest run src/features/macro-goals` passes (all suites green).
- `npm run typecheck` passes (no `any`, rpc fully typed).
- `useSaveMacroGoal.test.tsx` and `saveGoalWiring.integration.test.tsx` pass
  unchanged (they mock the data layer; signature is stable).
- 0002 SQL is self-consistent: INVOKER, pinned search_path, auth.uid() ownership,
  deactivate-then-insert in one function body, returns the inserted row.

## Environment notes

- Node v20/v22 via nvm; `node_modules` already installed. Network OPEN_INTERNET.
- The Module-1 energy domain is NOT on this branch. To run the FULL suite it is
  TEMPORARILY materialized into `src/features/energy/domain` (via `git show
  main:...`) and MUST be removed before finishing so it never enters a commit.
  The new/changed tests are self-contained (no `@energy` dependency).
- SQL/RLS cannot run without a live Supabase DB. The function is statically
  validated and documented; **0002 was not executed against a live DB.** Apply it
  in the Supabase SQL editor AFTER 0001 for the RPC to exist.

## Verification

- `npx vitest run src/features/macro-goals`
- `npm run typecheck`
- `npm run lint` (no-console, no `any`)
- Static review of 0002 SQL (auth.uid() ownership, transactional rollback,
  INVOKER + pinned search_path, partial unique index remains the backstop).
