import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback', '/privacy', '/terms', '/careers'];

export async function middleware(request: NextRequest) {
  // Seed/preview mode: pass through, the seeded session handles auth in-app.
  if (process.env.USE_SEED_DATA === 'true') {
    return NextResponse.next({ request });
  }

  // Outside seed mode, Supabase config is mandatory. Missing it is a
  // deployment misconfiguration, not a valid state — fail closed rather
  // than silently disabling auth for every request.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[middleware] Supabase env vars missing outside seed mode — blocking all non-public routes');
    const pathname = request.nextUrl.pathname;
    if (!PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // No session — allow-list only. Anything not explicitly public (or the
  // waitlisted holding page) requires a session. Mirrors the account_status
  // allow-list below; do not reintroduce a route-specific deny-list here.
  if (!user) {
    if (!PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Session exists — fetch account_status
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('account_status')
    .eq('auth_id', user.id)
    .single();

  if (profileError) {
    console.error('[middleware] account_status lookup failed for', user.id, profileError.message);
  }

  const status = profile?.account_status;

  // Suspended user — sign them out and redirect to login, regardless of path
  if (status === 'suspended') {
    await supabase.auth.signOut();
    const url = new URL('/login', request.url);
    url.searchParams.set('reason', 'suspended');
    return NextResponse.redirect(url);
  }

  // Active user hitting auth pages — send to feed
  if (status === 'active' && (pathname === '/signup' || pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // Allow-list: only an 'active' account may reach a non-public route.
  // Anything else — waitlisted, missing profile row, a failed/erroring
  // query, or an unrecognized future status — is treated as not-active
  // and gated to /waitlisted. This must fail closed, not open.
  if (status !== 'active' && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted')) {
    return NextResponse.redirect(new URL('/waitlisted', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
