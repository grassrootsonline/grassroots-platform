import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback'];

export async function middleware(request: NextRequest) {
  // In seed/preview mode, Supabase env vars are absent — pass all requests through.
  // The seeded session (MOCK_USER) handles auth state in-app.
  if (
    process.env.USE_SEED_DATA === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
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

  // No session — allow public routes, redirect protected routes to /login
  if (!user) {
    if (
      pathname.startsWith('/feed') || pathname.startsWith('/u/') ||
      pathname.startsWith('/notifications') || pathname.startsWith('/messages') ||
      pathname.startsWith('/settings') || pathname === '/waitlisted'
    ) {
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
