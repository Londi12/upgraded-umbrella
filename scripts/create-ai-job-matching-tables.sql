-- AI Job Matching Database Schema
-- Tables for storing AI-powered job matching data

-- Candidate profiles for AI matching
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile data
    job_title TEXT,
    skills TEXT[], -- Array of skills
    experience_years INTEGER,
    education_level TEXT,
    preferred_location TEXT,
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    
    -- CV data for matching
    cv_summary TEXT,
    cv_experience TEXT,
    cv_skills_text TEXT,
    
    -- AI matching preferences
    match_threshold INTEGER DEFAULT 60, -- Minimum match score to show
    preferred_job_types TEXT[], -- Array of preferred job types
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    INDEX idx_candidate_profiles_user (user_id),
    INDEX idx_candidate_profiles_location (preferred_location),
    INDEX idx_candidate_profiles_skills USING GIN (skills)
);

-- AI job matches storage
CREATE TABLE IF NOT EXISTS ai_job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    
    -- Match data
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    reasoning TEXT,
    skills_matched TEXT[],
    skills_gap TEXT[],
    ats_keywords TEXT[],
    
    -- Job snapshot (in case job gets deleted)
    job_title TEXT NOT NULL,
    job_company TEXT NOT NULL,
    job_location TEXT,
    job_description TEXT,
    job_url TEXT,
    
    -- AI processing metadata
    ai_model_used TEXT DEFAULT 'gemini-pro',
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Constraints and indexes
    INDEX idx_ai_job_matches_user (user_id),
    INDEX idx_ai_job_matches_score (match_score DESC),
    INDEX idx_ai_job_matches_created (created_at DESC),
    INDEX idx_ai_job_matches_expires (expires_at),
    UNIQUE(user_id, job_listing_id) -- Prevent duplicate matches
);

-- AI matching sessions (for analytics)
CREATE TABLE IF NOT EXISTS ai_matching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session data
    jobs_processed INTEGER DEFAULT 0,
    matches_found INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    
    -- AI service usage
    api_calls_made INTEGER DEFAULT 0,
    api_tokens_used INTEGER DEFAULT 0,
    api_cost_estimate DECIMAL(10,4), -- In USD
    
    -- Session metadata
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- Constraints
    INDEX idx_ai_matching_sessions_user (user_id),
    INDEX idx_ai_matching_sessions_start (session_start DESC),
    INDEX idx_ai_matching_sessions_status (status)
);

-- Function to clean up expired AI matches
CREATE OR REPLACE FUNCTION cleanup_expired_ai_matches()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    DELETE FROM ai_job_matches
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update candidate profile from CV data
CREATE OR REPLACE FUNCTION update_candidate_profile_from_cv(
    p_user_id UUID,
    p_cv_data JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO candidate_profiles (
        user_id,
        job_title,
        cv_summary,
        cv_experience,
        cv_skills_text,
        skills,
        updated_at
    ) VALUES (
        p_user_id,
        p_cv_data->>'jobTitle',
        p_cv_data->>'summary',
        p_cv_data->>'experience',
        p_cv_data->>'skills',
        CASE 
            WHEN p_cv_data->>'skills' IS NOT NULL 
            THEN string_to_array(p_cv_data->>'skills', ',')
            ELSE ARRAY[]::TEXT[]
        END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        job_title = EXCLUDED.job_title,
        cv_summary = EXCLUDED.cv_summary,
        cv_experience = EXCLUDED.cv_experience,
        cv_skills_text = EXCLUDED.cv_skills_text,
        skills = EXCLUDED.skills,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get AI job matches for a user
CREATE OR REPLACE FUNCTION get_ai_job_matches_for_user(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_min_score INTEGER DEFAULT 60
)
RETURNS TABLE (
    match_id UUID,
    job_title TEXT,
    job_company TEXT,
    job_location TEXT,
    job_description TEXT,
    job_url TEXT,
    match_score INTEGER,
    reasoning TEXT,
    skills_matched TEXT[],
    skills_gap TEXT[],
    ats_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ajm.id,
        ajm.job_title,
        ajm.job_company,
        ajm.job_location,
        ajm.job_description,
        ajm.job_url,
        ajm.match_score,
        ajm.reasoning,
        ajm.skills_matched,
        ajm.skills_gap,
        ajm.ats_keywords,
        ajm.created_at
    FROM ai_job_matches ajm
    WHERE ajm.user_id = p_user_id
        AND ajm.match_score >= p_min_score
        AND ajm.expires_at > NOW()
    ORDER BY ajm.match_score DESC, ajm.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_job_matches_composite 
ON ai_job_matches (user_id, match_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_updated 
ON candidate_profiles (updated_at DESC);