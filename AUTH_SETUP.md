# Authentication Setup Guide

## Current Status
The app is running in **demo mode** because Supabase credentials are not configured.

## Quick Fix: Use Demo Login
Users can click the "Demo Login" button on the login page to access the app without real authentication.

## Full Setup: Real Supabase Authentication

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API

### Step 2: Create Environment File
Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site URL for email redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Set Up Database Tables
Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Step 4: Configure Email Settings
In Supabase Dashboard > Authentication > Settings:
- Set up email templates
- Configure redirect URLs
- Enable email confirmations if desired

### Step 5: Test Authentication
1. Restart the dev server: `npm run dev`
2. Go to `/login` or `/signup`
3. Try creating an account and signing in

## Current Demo Features
- Demo login bypasses authentication
- All features work without real auth
- Perfect for development and testing



