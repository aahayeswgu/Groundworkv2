-- =============================================================================
-- Migration: add user_id + RLS to public.pins
-- =============================================================================
-- Fixes runtime error from pin-sync.ts:
--   "Could not find the 'user_id' column of 'pins' in the schema cache"
--
-- This migration:
--   1. Adds user_id (uuid, FK -> auth.users) so each pin belongs to a user.
--   2. Indexes user_id for the .eq("user_id", user.id) select.
--   3. Enables Row Level Security and adds per-user CRUD policies so a signed-in
--      user can only read/write their own pins (defense-in-depth on top of the
--      app-level filter).
--   4. Reloads the PostgREST schema cache so the new column is queryable
--      immediately (no Supabase project restart required).
--
-- Idempotent: safe to re-run.
-- Run from Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- =============================================================================

-- 1. Column ----------------------------------------------------------------
alter table public.pins
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Index -----------------------------------------------------------------
create index if not exists pins_user_id_idx on public.pins(user_id);

-- 3. Row Level Security ----------------------------------------------------
alter table public.pins enable row level security;

drop policy if exists "Users can view own pins"   on public.pins;
drop policy if exists "Users can insert own pins" on public.pins;
drop policy if exists "Users can update own pins" on public.pins;
drop policy if exists "Users can delete own pins" on public.pins;

create policy "Users can view own pins"
  on public.pins for select
  using (auth.uid() = user_id);

create policy "Users can insert own pins"
  on public.pins for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pins"
  on public.pins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own pins"
  on public.pins for delete
  using (auth.uid() = user_id);

-- 4. Reload PostgREST schema cache -----------------------------------------
notify pgrst, 'reload schema';
