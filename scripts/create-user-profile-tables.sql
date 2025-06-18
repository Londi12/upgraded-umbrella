-- Create user profiles table to store reusable information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_info JSONB DEFAULT '{}',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  skills TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved CVs table
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

-- Create saved cover letters table
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cover_letters ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for saved_cvs
CREATE POLICY "Users can view own CVs" ON saved_cvs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CVs" ON saved_cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CVs" ON saved_cvs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CVs" ON saved_cvs
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for saved_cover_letters
CREATE POLICY "Users can view own cover letters" ON saved_cover_letters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover letters" ON saved_cover_letters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letters" ON saved_cover_letters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letters" ON saved_cover_letters
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_cvs_updated_at BEFORE UPDATE ON saved_cvs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_cover_letters_updated_at BEFORE UPDATE ON saved_cover_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
