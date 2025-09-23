-- Add qualifications field to scraped_jobs table
ALTER TABLE scraped_jobs ADD COLUMN IF NOT EXISTS qualifications TEXT[];

-- Create index for qualifications field for faster searches
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_qualifications ON scraped_jobs USING gin(qualifications);

-- Update existing records to have empty qualifications array as fallback
UPDATE scraped_jobs SET qualifications = ARRAY[]::TEXT[] WHERE qualifications IS NULL;
