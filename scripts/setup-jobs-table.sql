-- Create scraped_jobs table in Supabase
CREATE TABLE IF NOT EXISTS scraped_jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  snippet TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  posted_date DATE NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_title ON scraped_jobs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_snippet ON scraped_jobs USING gin(to_tsvector('english', snippet));
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_company ON scraped_jobs USING gin(to_tsvector('english', company));
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_location ON scraped_jobs (location);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_source ON scraped_jobs (source);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_posted_date ON scraped_jobs (posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_scraped_at ON scraped_jobs (scraped_at DESC);

-- Enable Row Level Security
ALTER TABLE scraped_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON scraped_jobs
  FOR SELECT USING (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access" ON scraped_jobs
  FOR ALL USING (auth.role() = 'service_role');