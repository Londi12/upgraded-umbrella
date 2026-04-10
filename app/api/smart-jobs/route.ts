import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ success: true, jobs: [], total: 0, sources: [] })
}

export async function POST() {
  return NextResponse.json({ success: true, jobs: [], total: 0, sources: [] })
}
