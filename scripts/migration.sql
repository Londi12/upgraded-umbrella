-- CVKonnekt - Full Database Migration
-- Run this once in your Supabase SQL Editor

-- ============================================================
-- CORE USER TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  personal_info JSONB DEFAULT '{}',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  skills TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  cv_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_cover_letters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  cover_letter_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- JOB TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS scraped_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  snippet TEXT,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  company TEXT,
  location TEXT,
  posted_date DATE,
  description TEXT,
  qualifications TEXT[],
  job_type TEXT,
  experience_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_url TEXT NOT NULL,
  job_description TEXT,
  location TEXT,
  posted_date TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_url)
);

-- ============================================================
-- APPLICATION TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS application_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES saved_cvs(id) ON DELETE SET NULL,
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_board VARCHAR(100) NOT NULL,
  application_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'interview', 'rejected', 'offered', 'hired')),
  ats_score_at_application INTEGER DEFAULT 0,
  job_description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- AI MATCHING
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  job_title TEXT,
  skills TEXT[],
  experience_years INTEGER,
  education_level TEXT,
  preferred_location TEXT,
  cv_summary TEXT,
  cv_skills_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  reasoning TEXT,
  skills_matched TEXT[],
  skills_gap TEXT[],
  job_title TEXT NOT NULL,
  job_company TEXT NOT NULL,
  job_location TEXT,
  job_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS ai_matching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jobs_processed INTEGER DEFAULT 0,
  matches_found INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- ADMIN
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matching_sessions ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- saved_cvs
CREATE POLICY "saved_cvs_select" ON saved_cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_cvs_insert" ON saved_cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_cvs_update" ON saved_cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_cvs_delete" ON saved_cvs FOR DELETE USING (auth.uid() = user_id);

-- saved_cover_letters
CREATE POLICY "saved_cover_letters_select" ON saved_cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_cover_letters_insert" ON saved_cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_cover_letters_update" ON saved_cover_letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_cover_letters_delete" ON saved_cover_letters FOR DELETE USING (auth.uid() = user_id);

-- saved_jobs
CREATE POLICY "saved_jobs_select" ON saved_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_jobs_insert" ON saved_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_jobs_update" ON saved_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_jobs_delete" ON saved_jobs FOR DELETE USING (auth.uid() = user_id);

-- application_tracking
CREATE POLICY "application_tracking_select" ON application_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "application_tracking_insert" ON application_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "application_tracking_update" ON application_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "application_tracking_delete" ON application_tracking FOR DELETE USING (auth.uid() = user_id);

-- candidate_profiles
CREATE POLICY "candidate_profiles_select" ON candidate_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "candidate_profiles_insert" ON candidate_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "candidate_profiles_update" ON candidate_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ai_job_matches
CREATE POLICY "ai_job_matches_select" ON ai_job_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_job_matches_insert" ON ai_job_matches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ai_matching_sessions
CREATE POLICY "ai_matching_sessions_select" ON ai_matching_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_matching_sessions_insert" ON ai_matching_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_matching_sessions_update" ON ai_matching_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_saved_cvs_user ON saved_cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_tracking_user ON application_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_application_tracking_status ON application_tracking(status);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_posted ON scraped_jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_job_matches_user ON ai_job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_matches_expires ON ai_job_matches(expires_at);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_cvs_updated_at BEFORE UPDATE ON saved_cvs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_cover_letters_updated_at BEFORE UPDATE ON saved_cover_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_application_tracking_updated_at BEFORE UPDATE ON application_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ANALYTICS TABLES (used by analytics-service.ts)
-- ============================================================

CREATE TABLE IF NOT EXISTS cv_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES saved_cvs(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'download', 'share')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ats_score_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES saved_cvs(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  section_scores JSONB NOT NULL,
  suggestions JSONB DEFAULT '[]',
  job_description_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE cv_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cv_interactions_select" ON cv_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cv_interactions_insert" ON cv_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ats_score_history_select" ON ats_score_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ats_score_history_insert" ON ats_score_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cv_interactions_user ON cv_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_interactions_cv ON cv_interactions(cv_id);
CREATE INDEX IF NOT EXISTS idx_ats_score_history_user ON ats_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ats_score_history_cv ON ats_score_history(cv_id);
