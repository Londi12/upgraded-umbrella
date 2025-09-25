import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const applicationData = await request.json()
    console.log('Received application data:', applicationData)
    
    // For now, just insert without user authentication to test
    const { data, error } = await supabase
      .from('application_tracking')
      .insert({
        user_id: null, // Allow null for testing
        ...applicationData,
      })
      .select()
      .single()
    
    console.log('Insert result:', { data, error })
    
    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data, message: 'Application tracked successfully' })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}