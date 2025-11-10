-- Suggested schema for core features

-- Users are managed by Supabase Auth. Use auth.uid() in RLS.

create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null,
  plan_data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.travel_plans enable row level security;
create policy "Allow read own plans" on public.travel_plans for select using (auth.uid() = user_id);
create policy "Allow insert own plans" on public.travel_plans for insert with check (auth.uid() = user_id);
create policy "Allow update own plans" on public.travel_plans for update using (auth.uid() = user_id);
create policy "Allow delete own plans" on public.travel_plans for delete using (auth.uid() = user_id);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  themes text[] not null default '{}',
  default_budget text,
  currency text not null default 'CNY',
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
create policy "Allow read own prefs" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Allow upsert own prefs" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Allow update own prefs" on public.user_preferences for update using (auth.uid() = user_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.travel_plans(id) on delete cascade,
  title text not null,
  amount numeric not null,
  currency text not null default 'CNY',
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
create policy "Allow read own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Allow insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Allow delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

