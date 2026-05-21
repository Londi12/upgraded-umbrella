-- Snapshot table for shared job links.
-- When a user shares a job, we upsert the full job data here so the
-- /jobs/[id] page continues to work even after scraped_jobs is purged.
CREATE TABLE IF NOT EXISTS shared_jobs (
  -- Use the same id as scraped_jobs so shared URLs (/jobs/[id]) resolve correctly
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  snippet TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  company TEXT,
  location TEXT,
  posted_date DATE,
  description TEXT,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_jobs_url ON shared_jobs (url);

-- Public read access; writes go through the service role via the share API
ALTER TABLE shared_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON shared_jobs
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access" ON shared_jobs
  FOR ALL USING (auth.role() = 'service_role');
