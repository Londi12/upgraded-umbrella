-- Create scraped_jobs table
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

-- Enable Row Level Security
ALTER TABLE scraped_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON scraped_jobs
  FOR SELECT USING (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access" ON scraped_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data
INSERT INTO scraped_jobs (title, snippet, url, source, company, location, posted_date) VALUES
('Software Developer - Nedbank', 'Join Nedbank as a Software Developer in Johannesburg. We offer competitive salary, benefits, and career growth opportunities.', 'https://www.careers24.com/jobs/view/1234567', 'careers24.com', 'Nedbank', 'Johannesburg', CURRENT_DATE - INTERVAL '2 days'),
('Data Analyst - Discovery', 'Join Discovery as a Data Analyst in Cape Town. We offer competitive salary, benefits, and career growth opportunities.', 'https://www.pnet.co.za/jobs/view/2345678', 'pnet.co.za', 'Discovery', 'Cape Town', CURRENT_DATE - INTERVAL '1 day'),
('Marketing Manager - MTN', 'Join MTN as a Marketing Manager in Durban. We offer competitive salary, benefits, and career growth opportunities.', 'https://www.careerjunction.co.za/jobs/3456789', 'careerjunction.co.za', 'MTN', 'Durban', CURRENT_DATE - INTERVAL '3 days'),
('Sales Representative - Shoprite', 'Join Shoprite as a Sales Representative in Pretoria. We offer competitive salary, benefits, and career growth opportunities.', 'https://www.jobmail.co.za/job-details/4567890', 'jobmail.co.za', 'Shoprite', 'Pretoria', CURRENT_DATE - INTERVAL '1 day'),
('Accountant - Standard Bank', 'Join Standard Bank as a Accountant in Johannesburg. We offer competitive salary, benefits, and career growth opportunities.', 'https://www.careers24.com/jobs/view/5678901', 'careers24.com', 'Standard Bank', 'Johannesburg', CURRENT_DATE);