-- Test script to verify analytics tables are set up correctly
-- Run this in your Supabase SQL editor to test the setup

-- Check if all analytics tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'application_tracking',
    'cv_interactions', 
    'ats_score_history',
    'job_search_analytics',
    'industry_performance'
  )
ORDER BY table_name;

-- Check if RLS is enabled on analytics tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'application_tracking',
    'cv_interactions', 
    'ats_score_history',
    'job_search_analytics',
    'industry_performance'
  )
ORDER BY tablename;

-- Check if policies exist for analytics tables
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'application_tracking',
    'cv_interactions', 
    'ats_score_history',
    'job_search_analytics',
    'industry_performance'
  )
ORDER BY tablename, policyname;

-- Check if indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'application_tracking',
    'cv_interactions', 
    'ats_score_history',
    'job_search_analytics',
    'industry_performance'
  )
ORDER BY tablename, indexname;

-- Check if materialized view exists
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews 
WHERE schemaname = 'public' 
  AND matviewname = 'user_dashboard_analytics';

-- Test inserting sample data (will only work if you're authenticated)
-- Uncomment the following lines to test data insertion:

/*
-- Test application tracking insert
INSERT INTO application_tracking (
  user_id,
  cv_id,
  job_title,
  company_name,
  job_board,
  application_date,
  status,
  ats_score_at_application
) VALUES (
  auth.uid(),
  (SELECT id FROM saved_cvs WHERE user_id = auth.uid() LIMIT 1),
  'Test Job Title',
  'Test Company',
  'Test Board',
  CURRENT_DATE,
  'applied',
  75
);

-- Test CV interaction insert
INSERT INTO cv_interactions (
  user_id,
  cv_id,
  interaction_type
) VALUES (
  auth.uid(),
  (SELECT id FROM saved_cvs WHERE user_id = auth.uid() LIMIT 1),
  'view'
);

-- Test ATS score history insert
INSERT INTO ats_score_history (
  user_id,
  cv_id,
  overall_score,
  section_scores,
  suggestions
) VALUES (
  auth.uid(),
  (SELECT id FROM saved_cvs WHERE user_id = auth.uid() LIMIT 1),
  78,
  '{"contact": {"score": 8, "maxScore": 10}, "summary": {"score": 6, "maxScore": 10}}',
  '[{"type": "add", "section": "summary", "suggested": "Add quantifiable achievements"}]'
);
*/

-- Check if functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'refresh_dashboard_analytics',
    'update_updated_at_column'
  )
ORDER BY routine_name;
