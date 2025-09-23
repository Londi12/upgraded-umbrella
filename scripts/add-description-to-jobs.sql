-- Add description field to scraped_jobs table
ALTER TABLE scraped_jobs ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for description field for faster searches
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_description ON scraped_jobs USING gin(to_tsvector('english', description));

-- Update existing records to copy snippet to description as fallback
UPDATE scraped_jobs SET description = snippet WHERE description IS NULL OR description = '';
