import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/about', '/guidelines', '/privacy']
const AUTH_PATHS = ['/feed', '/profile', '/project', '/community', '/explore', '/saved']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // In production: check Supabase session cookie and redirect accordingly.
  // For now, all routes are accessible (mock auth).
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
