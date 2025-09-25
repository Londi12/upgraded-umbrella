import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Test if tables exist by trying to query them
    const tables = ['candidate_profiles', 'ai_job_matches', 'ai_matching_sessions']
    const results = []

    for (const tableName of tables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)

        if (error && error.message.includes('does not exist')) {
          results.push({
            table: tableName,
            status: 'missing',
            message: 'Table does not exist'
          })
        } else {
          results.push({
            table: tableName,
            status: 'exists',
            message: 'Table exists'
          })
        }
      } catch (err) {
        results.push({
          table: tableName,
          status: 'error',
          message: `Error: ${err}`
        })
      }
    }

    return NextResponse.json({
      message: 'AI matching tables checked',
      results,
      note: 'Run the SQL script in scripts/create-ai-job-matching-tables.sql in Supabase dashboard to create missing tables.'
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}