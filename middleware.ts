import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function extractAccessToken(rawToken: string | undefined): string | null {
  if (!rawToken) return null

  // In some Supabase setups this cookie stores plain JWT; use it directly.
  if (rawToken.split('.').length === 3) return rawToken

  // In other setups the cookie stores JSON (or JSON array) with access_token.
  try {
    const parsed = JSON.parse(rawToken)
    if (parsed?.access_token) return parsed.access_token
    if (Array.isArray(parsed) && parsed[0]?.access_token) return parsed[0].access_token
  } catch {
    // Fall through to null when cookie is not parseable.
  }

  return null
}

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const rawToken = request.cookies.get('sb-access-token')?.value
    ?? request.cookies.get(`sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`)?.value
  const token = extractAccessToken(rawToken)

  if (!token) {
    // Browser auth in this app is localStorage-based, so middleware may not see a token cookie.
    // Allow request through and let the admin page perform the authoritative admin check.
    return NextResponse.next()
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.next()
  }

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminRecord) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
