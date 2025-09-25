import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Run this SQL in your Supabase SQL Editor:',
    sql: `CREATE TABLE IF NOT EXISTS application_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_board TEXT NOT NULL,
  application_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('applied', 'viewed', 'interview', 'rejected', 'offered', 'hired')),
  ats_score_at_application INTEGER DEFAULT 0,
  job_description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
  })
}