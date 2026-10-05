-- =============================================================================
-- 0001_init.sql  —  Macros web data layer (Module 3): schema, triggers, RLS
-- =============================================================================
--
-- RUN ORDER (Supabase SQL editor):
--   Paste this entire file into a single SQL editor tab and run it once, top to
--   bottom. The statements are ordered by dependency:
--     1. Extensions (pgcrypto for gen_random_uuid()).
--     2. Enum type (goal_type).
--     3. Reusable trigger function (public.set_updated_at()).
--     4. Tables (profiles, macro_goals, weight_logs, food_logs) + indexes.
--     5. BEFORE UPDATE triggers wiring each table to set_updated_at().
--     6. ENABLE ROW LEVEL SECURITY + per-command policies for all four tables.
--   Re-running is safe: creates use IF NOT EXISTS / guards where possible.
--
-- SINGLE ACTIVE GOAL (design choice):
--   A user may accumulate a history of macro_goals rows, but only ONE may be
--   active at a time. This is enforced in the database by a PARTIAL UNIQUE
--   index on macro_goals(user_id) WHERE is_active, so the invariant holds
--   regardless of client code. To switch goals, flip the old row's is_active
--   to false (in the same transaction) before/when inserting the new active one.
--
-- AUTHORIZATION IS SERVER-SIDE:
--   Every table has Row Level Security enabled with explicit per-command
--   policies scoped to auth.uid(). A client holding only the public anon key
--   can read/write ONLY its own rows; the client code does NOT and MUST NOT be
--   trusted to enforce ownership. Business authorization lives here, in RLS.
--   The goal_type enum values are intentionally UNACCENTED ASCII
--   ('deficit' not 'déficit') to keep SQL literals/identifiers clean and to
--   match the TypeScript union; the accented Spanish label ("Déficit") belongs
--   to the UI copy layer, not the database.
-- =============================================================================

-- 1. Extensions ---------------------------------------------------------------
create extension if not exists pgcrypto;

-- 2. Enum type ----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_type') then
    create type public.goal_type as enum ('deficit', 'mantenimiento', 'volumen');
  end if;
end
$$;

-- 3. Reusable trigger function ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. Tables -------------------------------------------------------------------

-- profiles: 1:1 with auth.users -----------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- macro_goals: user's nutritional target history (one active at a time) -------
create table if not exists public.macro_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  goal_type      public.goal_type not null,
  tdee           integer not null check (tdee > 0),
  calorie_target integer not null check (calorie_target > 0),
  protein_g      integer not null check (protein_g >= 0),
  fat_g          integer not null check (fat_g >= 0),
  carbs_g        integer not null check (carbs_g >= 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- One active goal per user (partial unique index).
create unique index if not exists macro_goals_one_active_per_user
  on public.macro_goals (user_id)
  where is_active;

create index if not exists macro_goals_user_created_idx
  on public.macro_goals (user_id, created_at desc);

-- weight_logs: body-weight history -------------------------------------------
create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  weight_kg  numeric(5, 2) not null check (weight_kg > 0),
  logged_on  date not null default current_date,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weight_logs_user_logged_idx
  on public.weight_logs (user_id, logged_on desc);

-- food_logs: structured daily intake -----------------------------------------
create table if not exists public.food_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  logged_on  date not null default current_date,
  name       text not null,
  quantity   numeric(8, 2) not null check (quantity > 0),
  unit       text not null default 'g',
  calories   integer not null check (calories >= 0),
  protein_g  numeric(6, 2) not null default 0 check (protein_g >= 0),
  fat_g      numeric(6, 2) not null default 0 check (fat_g >= 0),
  carbs_g    numeric(6, 2) not null default 0 check (carbs_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_logs_user_logged_idx
  on public.food_logs (user_id, logged_on desc);

-- 5. BEFORE UPDATE triggers (updated_at maintenance) --------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists macro_goals_set_updated_at on public.macro_goals;
create trigger macro_goals_set_updated_at
  before update on public.macro_goals
  for each row execute function public.set_updated_at();

drop trigger if exists weight_logs_set_updated_at on public.weight_logs;
create trigger weight_logs_set_updated_at
  before update on public.weight_logs
  for each row execute function public.set_updated_at();

drop trigger if exists food_logs_set_updated_at on public.food_logs;
create trigger food_logs_set_updated_at
  before update on public.food_logs
  for each row execute function public.set_updated_at();

-- 6. Row Level Security -------------------------------------------------------
-- Enable RLS on all four tables, then one explicit policy per command.
-- Ownership key: profiles uses id = auth.uid(); the log/goal tables use
-- user_id = auth.uid(). INSERT policies gate the incoming row via WITH CHECK;
-- UPDATE policies gate both the targeted row (USING) and the resulting row
-- (WITH CHECK) so a user cannot reassign a row to another user.

alter table public.profiles    enable row level security;
alter table public.macro_goals enable row level security;
alter table public.weight_logs enable row level security;
alter table public.food_logs   enable row level security;

-- profiles (keyed by id) ------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

-- macro_goals (keyed by user_id) ----------------------------------------------
drop policy if exists macro_goals_select_own on public.macro_goals;
create policy macro_goals_select_own on public.macro_goals
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists macro_goals_insert_own on public.macro_goals;
create policy macro_goals_insert_own on public.macro_goals
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists macro_goals_update_own on public.macro_goals;
create policy macro_goals_update_own on public.macro_goals
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists macro_goals_delete_own on public.macro_goals;
create policy macro_goals_delete_own on public.macro_goals
  for delete to authenticated
  using (auth.uid() = user_id);

-- weight_logs (keyed by user_id) ----------------------------------------------
drop policy if exists weight_logs_select_own on public.weight_logs;
create policy weight_logs_select_own on public.weight_logs
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists weight_logs_insert_own on public.weight_logs;
create policy weight_logs_insert_own on public.weight_logs
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists weight_logs_update_own on public.weight_logs;
create policy weight_logs_update_own on public.weight_logs
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists weight_logs_delete_own on public.weight_logs;
create policy weight_logs_delete_own on public.weight_logs
  for delete to authenticated
  using (auth.uid() = user_id);

-- food_logs (keyed by user_id) ------------------------------------------------
drop policy if exists food_logs_select_own on public.food_logs;
create policy food_logs_select_own on public.food_logs
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists food_logs_insert_own on public.food_logs;
create policy food_logs_insert_own on public.food_logs
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists food_logs_update_own on public.food_logs;
create policy food_logs_update_own on public.food_logs
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists food_logs_delete_own on public.food_logs;
create policy food_logs_delete_own on public.food_logs
  for delete to authenticated
  using (auth.uid() = user_id);
