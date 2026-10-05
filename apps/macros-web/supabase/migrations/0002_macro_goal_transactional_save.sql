-- =============================================================================
-- 0002_macro_goal_transactional_save.sql  —  Atomic "save active macro goal" RPC
-- =============================================================================
--
-- RUN ORDER (Supabase SQL editor):
--   Apply this file AFTER 0001_init.sql. Migrations are append-only: do NOT
--   edit 0001; this file only ADDS a function and depends on the schema,
--   enum (public.goal_type), table (public.macro_goals), and the partial unique
--   index (macro_goals_one_active_per_user) created there. Paste this entire
--   file into a single SQL editor tab and run it once, top to bottom. Re-running
--   is safe: `create or replace function` is idempotent.
--
-- WHY THIS FUNCTION (closing a non-transactional gap):
--   Switching the active goal is a TWO-STEP mutation: deactivate the current
--   active row, then insert the new active row. Done from the client as two
--   separate round-trips it is NOT atomic — if the insert fails after the
--   update commits, the user is left with NO active goal. A plpgsql function
--   runs its whole body inside the surrounding statement's single transaction,
--   so the deactivate + insert are ALL-OR-NOTHING: any failure (including the
--   partial unique index firing) rolls back the deactivate too. The user is
--   never left in a goal-less state.
--
-- OWNERSHIP COMES FROM auth.uid() (client user_id is NOT trusted):
--   The owner is derived SERVER-SIDE from auth.uid(); the client never passes a
--   user_id into this function. A null uid (unauthenticated caller) raises
--   immediately. This mirrors the RLS model in 0001 where ownership is always
--   auth.uid(), never a client-supplied column.
--
-- SECURITY INVOKER (not DEFINER):
--   The function runs with the CALLER's privileges, so the existing per-command
--   RLS policies on public.macro_goals (scoped to auth.uid() = user_id) still
--   apply to the UPDATE and INSERT inside the body. We do NOT need or want to
--   bypass RLS: atomicity is the only thing we add. Using INVOKER keeps the
--   policies as the authority and avoids the privilege-escalation footguns of
--   SECURITY DEFINER.
--
-- PINNED search_path:
--   `set search_path = ''` neutralizes search_path-injection: every object is
--   referenced by its fully-qualified name (public.*, auth.uid()). This is the
--   standard hardening for any function that runs with elevated or ambient
--   context.
--
-- BACKSTOP:
--   The partial unique index macro_goals_one_active_per_user (one active row per
--   user) from 0001 remains the ultimate guarantee of the single-active
--   invariant. This function cooperates with it (deactivate before insert) but
--   does not replace it; a bug here would surface as a unique-violation rollback
--   rather than a corrupted two-active state.
-- =============================================================================

create or replace function public.save_active_macro_goal(
  p_goal_type      public.goal_type,
  p_tdee           integer,
  p_calorie_target integer,
  p_protein_g      integer,
  p_fat_g          integer,
  p_carbs_g        integer
)
returns public.macro_goals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.macro_goals;
begin
  -- Authentication is required; ownership is never taken from the client.
  if v_uid is null then
    raise exception 'authentication required to save a macro goal'
      using errcode = '28000';
  end if;

  -- Step 1: deactivate the caller's currently active goal(s). Runs in the same
  -- transaction as the insert below, so it rolls back if the insert fails.
  update public.macro_goals
     set is_active = false
   where user_id = v_uid
     and is_active;

  -- Step 2: insert the new active goal, owned by auth.uid(). The partial unique
  -- index remains the backstop against ever having two active rows.
  insert into public.macro_goals (
    user_id, goal_type, tdee, calorie_target, protein_g, fat_g, carbs_g, is_active
  )
  values (
    v_uid, p_goal_type, p_tdee, p_calorie_target, p_protein_g, p_fat_g, p_carbs_g, true
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- EXECUTE grants (make the exposure deliberate, not inherited):
--   A public.* function is reachable through PostgREST and callable by the
--   `anon` role by default. The auth.uid() guard already fails closed for an
--   unauthenticated caller, but we revoke the ambient grant and grant execute
--   only to `authenticated` so the exposed surface matches the intent exactly.
revoke all on function public.save_active_macro_goal(
  public.goal_type, integer, integer, integer, integer, integer
) from public;

grant execute on function public.save_active_macro_goal(
  public.goal_type, integer, integer, integer, integer, integer
) to authenticated;
