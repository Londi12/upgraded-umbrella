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
