import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Create the saved_jobs table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS saved_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        job_title TEXT NOT NULL,
        company_name TEXT,
        job_url TEXT NOT NULL,
        job_description TEXT,
        location TEXT,
        posted_date TEXT,
        source TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, job_url)
      );
    `

    // Execute the SQL using Supabase's rpc function or direct query
    // Since we can't execute raw SQL directly, we'll try to create the table by inserting a dummy record
    // This will fail if the table doesn't exist, but Supabase will create it automatically in some cases
    // For now, let's try a different approach - check if we can use the Supabase client to create the table

    // Actually, let's use the Supabase REST API to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (error) {
      // If rpc doesn't work, try to create the table by attempting an insert (this won't work but will show the error)
      console.log('RPC method failed, trying alternative approach')
      return NextResponse.json({
        message: 'Table creation attempted. Please ensure the saved_jobs table exists in your Supabase database.',
        note: 'You may need to run the SQL script manually in your Supabase dashboard.'
      })
    }

    return NextResponse.json({
      message: 'saved_jobs table created successfully',
      data
    })

  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: error.message,
      note: 'Table creation may require manual execution in Supabase dashboard'
    }, { status: 500 })
  }
}
