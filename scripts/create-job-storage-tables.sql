-- Job Storage Database Schema
-- Persistent storage for crawled job data with intelligent retention

-- Main job listings table
CREATE TABLE IF NOT EXISTS job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL, -- Original job ID from source
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    requirements TEXT[], -- Array of requirements
    salary_range TEXT,
    job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
    experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    industry TEXT,
    posted_date DATE,
    expires_date DATE,
    application_url TEXT,
    source TEXT NOT NULL, -- job board name
    keywords TEXT[], -- Array of keywords
    
    -- Crawling metadata
    first_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    crawl_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Content hash for deduplication
    content_hash TEXT GENERATED ALWAYS AS (
        md5(CONCAT(title, company, location, COALESCE(description, '')))
    ) STORED,
    
    -- Indexing
    UNIQUE(external_id, source), -- Prevent duplicates from same source
    INDEX idx_job_listings_content_hash (content_hash),
    INDEX idx_job_listings_source (source),
    INDEX idx_job_listings_posted_date (posted_date),
    INDEX idx_job_listings_location (location),
    INDEX idx_job_listings_industry (industry),
    INDEX idx_job_listings_active (is_active),
    INDEX idx_job_listings_last_crawled (last_crawled_at),
    
    -- Full-text search indexes
    INDEX idx_job_listings_title_search (title),
    INDEX idx_job_listings_company_search (company),
    INDEX idx_job_listings_keywords_search USING GIN (keywords)
);

-- Job applications tracking (to preserve jobs users are tracking)
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_listing_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    cv_id UUID REFERENCES user_cvs(id) ON DELETE SET NULL,
    
    -- Application details
    application_date DATE NOT NULL,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
    notes TEXT,
    
    -- ATS scoring at time of application
    ats_score_at_application INTEGER,
    job_description_at_application TEXT, -- Snapshot of job description
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate applications
    UNIQUE(user_id, job_listing_id),
    INDEX idx_job_applications_user (user_id),
    INDEX idx_job_applications_status (status),
    INDEX idx_job_applications_date (application_date)
);

-- Job search analytics (enhanced)
CREATE TABLE IF NOT EXISTS job_search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Search parameters
    search_query TEXT,
    location_filter TEXT,
    industry_filter TEXT,
    experience_level_filter TEXT,
    job_type_filter TEXT,
    
    -- Results
    results_count INTEGER,
    job_board TEXT,
    search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance metrics
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    
    INDEX idx_search_analytics_user (user_id),
    INDEX idx_search_analytics_date (search_date),
    INDEX idx_search_analytics_query (search_query)
);

-- Crawl session tracking
CREATE TABLE IF NOT EXISTS crawl_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    
    -- Session metadata
    sources_crawled TEXT[],
    total_jobs_found INTEGER DEFAULT 0,
    new_jobs_added INTEGER DEFAULT 0,
    jobs_updated INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    
    -- Compliance tracking
    robots_txt_checked BOOLEAN DEFAULT TRUE,
    rate_limiting_applied BOOLEAN DEFAULT TRUE,
    compliance_mode BOOLEAN DEFAULT TRUE,
    
    -- Performance
    total_requests INTEGER DEFAULT 0,
    cached_responses INTEGER DEFAULT 0,
    average_response_time_ms INTEGER,
    
    INDEX idx_crawl_sessions_start (session_start),
    INDEX idx_crawl_sessions_sources (sources_crawled)
);

-- Job source configurations
CREATE TABLE IF NOT EXISTS job_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('rss', 'api', 'scraping')),
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Crawling configuration
    crawl_frequency_hours INTEGER DEFAULT 6,
    last_successful_crawl TIMESTAMP WITH TIME ZONE,
    last_crawl_attempt TIMESTAMP WITH TIME ZONE,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Rate limiting
    crawl_delay_seconds INTEGER DEFAULT 10,
    max_requests_per_hour INTEGER DEFAULT 100,
    
    -- Compliance
    robots_txt_url TEXT,
    robots_txt_last_checked TIMESTAMP WITH TIME ZONE,
    crawling_allowed BOOLEAN DEFAULT TRUE,
    compliance_notes TEXT,
    
    -- Statistics
    total_jobs_crawled INTEGER DEFAULT 0,
    jobs_crawled_last_session INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_job_sources_active (is_active),
    INDEX idx_job_sources_last_crawl (last_successful_crawl)
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Retention rules
    default_retention_days INTEGER DEFAULT 30,
    preserve_tracked_jobs BOOLEAN DEFAULT TRUE,
    preserve_applied_jobs BOOLEAN DEFAULT TRUE,
    preserve_recent_searches_days INTEGER DEFAULT 90,
    
    -- Cleanup schedule
    cleanup_frequency_hours INTEGER DEFAULT 24,
    last_cleanup_run TIMESTAMP WITH TIME ZONE,
    next_cleanup_due TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default retention policy
INSERT INTO data_retention_policies (
    policy_name,
    description,
    default_retention_days,
    preserve_tracked_jobs,
    preserve_applied_jobs,
    preserve_recent_searches_days,
    cleanup_frequency_hours,
    next_cleanup_due
) VALUES (
    'default_policy',
    'Default data retention policy for CVKonnekt job crawler',
    30,
    TRUE,
    TRUE,
    90,
    24,
    NOW() + INTERVAL '24 hours'
) ON CONFLICT (policy_name) DO NOTHING;

-- Insert default job sources
INSERT INTO job_sources (name, type, url, crawl_frequency_hours, crawl_delay_seconds, compliance_notes) VALUES
    ('JobMail', 'rss', 'https://www.jobmail.co.za/rss/jobs', 6, 10, 'RSS feed - publicly available, no robots.txt restrictions'),
    ('Careers24', 'rss', 'https://www.careers24.com/rss/jobs', 4, 10, 'RSS feed - publicly available, respects robots.txt'),
    ('PNet', 'rss', 'https://www.pnet.co.za/rss/jobs', 8, 10, 'RSS feed - publicly available, compliant with terms'),
    ('Adzuna SA', 'api', 'https://api.adzuna.com/v1/api/jobs/za/search/1', 12, 5, 'Official API - requires registration and API key')
ON CONFLICT (name) DO NOTHING;

-- Create functions for data management

-- Function to mark jobs as inactive instead of deleting
CREATE OR REPLACE FUNCTION mark_old_jobs_inactive()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
    retention_days INTEGER;
BEGIN
    -- Get retention policy
    SELECT default_retention_days INTO retention_days
    FROM data_retention_policies
    WHERE policy_name = 'default_policy' AND is_active = TRUE;
    
    IF retention_days IS NULL THEN
        retention_days := 30; -- Default fallback
    END IF;
    
    -- Mark old jobs as inactive (but don't delete if they're tracked)
    UPDATE job_listings 
    SET is_active = FALSE, last_updated_at = NOW()
    WHERE is_active = TRUE
        AND last_crawled_at < NOW() - INTERVAL '1 day' * retention_days
        AND id NOT IN (
            SELECT DISTINCT job_listing_id 
            FROM job_applications 
            WHERE job_listing_id IS NOT NULL
        );
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old search analytics
CREATE OR REPLACE FUNCTION cleanup_old_search_analytics()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
    retention_days INTEGER;
BEGIN
    -- Get retention policy for search analytics
    SELECT preserve_recent_searches_days INTO retention_days
    FROM data_retention_policies
    WHERE policy_name = 'default_policy' AND is_active = TRUE;
    
    IF retention_days IS NULL THEN
        retention_days := 90; -- Default fallback
    END IF;
    
    -- Delete old search analytics
    DELETE FROM job_search_analytics
    WHERE search_date < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update job source statistics
CREATE OR REPLACE FUNCTION update_job_source_stats(
    source_name TEXT,
    jobs_found INTEGER,
    crawl_successful BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    UPDATE job_sources
    SET 
        last_crawl_attempt = NOW(),
        jobs_crawled_last_session = jobs_found,
        total_jobs_crawled = total_jobs_crawled + jobs_found,
        last_successful_crawl = CASE WHEN crawl_successful THEN NOW() ELSE last_successful_crawl END,
        consecutive_failures = CASE WHEN crawl_successful THEN 0 ELSE consecutive_failures + 1 END,
        updated_at = NOW()
    WHERE name = source_name;
END;
$$ LANGUAGE plpgsql;
