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
alter table if exists public.user_profiles enable row level security;

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

-- SAVED CVS
alter table if exists public.saved_cvs enable row level security;

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

-- APPLICATION TRACKING
alter table if exists public.application_tracking enable row level security;

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

-- CV INTERACTIONS
alter table if exists public.cv_interactions enable row level security;

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

-- JOB SEARCH ANALYTICS
alter table if exists public.job_search_analytics enable row level security;

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

-- SCRAPED JOBS (for active listings / filled counts and jobs management)
alter table if exists public.scraped_jobs enable row level security;

drop policy if exists "Admins can manage scraped jobs" on public.scraped_jobs;
create policy "Admins can manage scraped jobs"
on public.scraped_jobs
for all
using (public.is_admin_user())
with check (public.is_admin_user());
