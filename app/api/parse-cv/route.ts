import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'CV parsing temporarily unavailable. Please enter your details manually.' },
    { status: 503 }
  )
}
