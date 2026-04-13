-- Admin RLS policies for dashboard analytics/management
-- Run this in Supabase SQL Editor after creating admin_users records.

-- Helper: true when current auth user is in admin_users
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

-- Ensure helper can be executed by authenticated users
revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

-- USER PROFILES
do $$
begin
  if to_regclass('public.user_profiles') is not null then
    alter table public.user_profiles enable row level security;
    drop policy if exists "Admins can view all user profiles" on public.user_profiles;
    create policy "Admins can view all user profiles"
    on public.user_profiles
    for select
    using (public.is_admin_user());

    drop policy if exists "Admins can update all user profiles" on public.user_profiles;
    create policy "Admins can update all user profiles"
    on public.user_profiles
    for update
    using (public.is_admin_user())
    with check (public.is_admin_user());

    drop policy if exists "Admins can delete all user profiles" on public.user_profiles;
    create policy "Admins can delete all user profiles"
    on public.user_profiles
    for delete
    using (public.is_admin_user());
  else
    raise notice 'Skipping user_profiles: table does not exist';
  end if;
end
$$;

-- LOGIN EVENTS (real sign-in tracking)
create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  logged_in_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_login_events_user_id on public.login_events(user_id);
create index if not exists idx_login_events_logged_in_at on public.login_events(logged_in_at);

do $$
begin
  alter table public.login_events enable row level security;

  drop policy if exists "Users can view own login events" on public.login_events;
  create policy "Users can view own login events"
  on public.login_events
  for select
  using (auth.uid() = user_id);

  drop policy if exists "Users can insert own login events" on public.login_events;
  create policy "Users can insert own login events"
  on public.login_events
  for insert
  with check (auth.uid() = user_id);

  drop policy if exists "Admins can view all login events" on public.login_events;
  create policy "Admins can view all login events"
  on public.login_events
  for select
  using (public.is_admin_user());

  drop policy if exists "Admins can delete all login events" on public.login_events;
  create policy "Admins can delete all login events"
  on public.login_events
  for delete
  using (public.is_admin_user());
end
$$;

-- USER SESSIONS (time-on-site tracking)
create table if not exists public.user_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_user_sessions_started_at on public.user_sessions(started_at);
create index if not exists idx_user_sessions_last_seen_at on public.user_sessions(last_seen_at);

do $$
begin
  alter table public.user_sessions enable row level security;

  drop policy if exists "Users can view own sessions" on public.user_sessions;
  create policy "Users can view own sessions"
  on public.user_sessions
  for select
  using (auth.uid() = user_id);

  drop policy if exists "Users can insert own sessions" on public.user_sessions;
  create policy "Users can insert own sessions"
  on public.user_sessions
  for insert
  with check (auth.uid() = user_id);

  drop policy if exists "Users can update own sessions" on public.user_sessions;
  create policy "Users can update own sessions"
  on public.user_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

  drop policy if exists "Admins can view all user sessions" on public.user_sessions;
  create policy "Admins can view all user sessions"
  on public.user_sessions
  for select
  using (public.is_admin_user());

  drop policy if exists "Admins can delete all user sessions" on public.user_sessions;
  create policy "Admins can delete all user sessions"
  on public.user_sessions
  for delete
  using (public.is_admin_user());
end
$$;

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_user_sessions_updated_at on public.user_sessions;
create trigger update_user_sessions_updated_at
before update on public.user_sessions
for each row execute function update_updated_at_column();

-- SAVED CVS
do $$
begin
  if to_regclass('public.saved_cvs') is not null then
    alter table public.saved_cvs enable row level security;
    drop policy if exists "Admins can view all cvs" on public.saved_cvs;
    create policy "Admins can view all cvs"
    on public.saved_cvs
    for select
    using (public.is_admin_user());

    drop policy if exists "Admins can delete all cvs" on public.saved_cvs;
    create policy "Admins can delete all cvs"
    on public.saved_cvs
    for delete
    using (public.is_admin_user());
  else
    raise notice 'Skipping saved_cvs: table does not exist';
  end if;
end
$$;

-- APPLICATION TRACKING
do $$
begin
  if to_regclass('public.application_tracking') is not null then
    alter table public.application_tracking enable row level security;
    drop policy if exists "Admins can view all applications" on public.application_tracking;
    create policy "Admins can view all applications"
    on public.application_tracking
    for select
    using (public.is_admin_user());

    drop policy if exists "Admins can delete all applications" on public.application_tracking;
    create policy "Admins can delete all applications"
    on public.application_tracking
    for delete
    using (public.is_admin_user());
  else
    raise notice 'Skipping application_tracking: table does not exist';
  end if;
end
$$;

-- CV INTERACTIONS
do $$
begin
  if to_regclass('public.cv_interactions') is not null then
    alter table public.cv_interactions enable row level security;
    drop policy if exists "Admins can view all cv interactions" on public.cv_interactions;
    create policy "Admins can view all cv interactions"
    on public.cv_interactions
    for select
    using (public.is_admin_user());

    drop policy if exists "Admins can delete all cv interactions" on public.cv_interactions;
    create policy "Admins can delete all cv interactions"
    on public.cv_interactions
    for delete
    using (public.is_admin_user());
  else
    raise notice 'Skipping cv_interactions: table does not exist';
  end if;
end
$$;

-- JOB SEARCH ANALYTICS
do $$
begin
  if to_regclass('public.job_search_analytics') is not null then
    alter table public.job_search_analytics enable row level security;
    drop policy if exists "Admins can view all job search analytics" on public.job_search_analytics;
    create policy "Admins can view all job search analytics"
    on public.job_search_analytics
    for select
    using (public.is_admin_user());

    drop policy if exists "Admins can delete all job search analytics" on public.job_search_analytics;
    create policy "Admins can delete all job search analytics"
    on public.job_search_analytics
    for delete
    using (public.is_admin_user());
  else
    raise notice 'Skipping job_search_analytics: table does not exist';
  end if;
end
$$;

-- SCRAPED JOBS (for active listings / filled counts and jobs management)
do $$
begin
  if to_regclass('public.scraped_jobs') is not null then
    alter table public.scraped_jobs enable row level security;
    drop policy if exists "Admins can manage scraped jobs" on public.scraped_jobs;
    create policy "Admins can manage scraped jobs"
    on public.scraped_jobs
    for all
    using (public.is_admin_user())
    with check (public.is_admin_user());
  else
    raise notice 'Skipping scraped_jobs: table does not exist';
  end if;
end
$$;
