import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis/client';
import { sessionKey, adminKey } from '@/lib/redis/keys';

const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback', '/privacy', '/terms', '/careers', '/careers/:param'];
// Note: '/careers/:param' here is bookkeeping for scripts/check-route-access.mjs's
// route-classification check only. The actual runtime allow-list for
// /careers/[slug] is the explicit pathname.startsWith('/careers/') checks below —
// PUBLIC_PATHS.includes() is an exact match and would never match a real slug.

// Not read by middleware() — the fail-closed default already gates anything
// outside PUBLIC_PATHS. This exists so every route has an explicit, reviewable
// access-level decision on record, checked by scripts/check-route-access.mjs
// (see package.json's check:routes / the pre-commit hook). Add every new
// intentionally-gated route here.
const GATED_PATHS = [
  '/feed', '/feed/:param', '/profile/:param', '/waitlisted',
  '/admin', '/admin/users', '/admin/careers', '/admin/careers/new',
  '/admin/careers/:param/edit', '/admin/careers/:param/applications', '/admin/board',
];

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
    if (!PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted') && !pathname.startsWith('/careers/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Session exists — fetch account_status, read-through cached by auth user id
  // (the id available here before any DB lookup — caching by the internal
  // users.id would defeat the purpose, since you'd need a DB query to get it
  // first).
  type CachedSession = { id: string; account_status: 'waitlisted' | 'active' | 'suspended' };

  let profile: CachedSession | null = await cacheGet<CachedSession>(sessionKey(user.id));
  let profileError: { message: string } | null = null;

  if (!profile) {
    const result = await supabase
      .from('users')
      .select('id, account_status')
      .eq('auth_id', user.id)
      .single();
    profile = result.data;
    profileError = result.error;
    if (profile) {
      // 30s, not the 3600s in ROADMAP.md's original sketch — this value gates
      // account access (waitlisted/active/suspended), and this project has
      // already shipped two bugs (handoffs 049, 054) where a stale gate check
      // blocked a just-activated user. 30s bounds the worst case even if
      // invalidation somehow doesn't fire; it is not a substitute for
      // invalidation, it's a backstop under it.
      await cacheSet(sessionKey(user.id), profile, 30);
    }
  }

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

  // Admin routes — independent of account_status. Being staff isn't the same
  // axis as being waitlisted/active, so this check runs on its own rather than
  // folding into the allow-list below. Non-admins (including active ones) are
  // sent to /feed, not /waitlisted — they're not being told to wait, they're
  // just not staff.
  if (pathname.startsWith('/admin')) {
    // HANDOFF CONFLICT (052): the handoff's snippet checked
    // admin_users.user_id against the Supabase auth UID directly, but
    // admin_users.user_id is a FK to the internal users.id (same auth_id vs.
    // users.id distinction the account_status lookup above already handles).
    // Using profile.id here instead so the check can actually match.
    // Shares the same admin:{user_id} cache key as requireAdmin() (via
    // lib/redis/keys.ts) so this edge-level gate and the Server Action-level
    // check never disagree with each other or need separate tuning.
    let isAdmin: boolean | null = profile?.id ? await cacheGet<boolean>(adminKey(profile.id)) : false;
    if (isAdmin === null && profile?.id) {
      const { data: admin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();
      isAdmin = !!admin;
      // 5 min — admin grants are manual/bootstrap-only today (no UI action
      // exists to grant/revoke), so staleness risk here is low.
      await cacheSet(adminKey(profile.id), isAdmin, 300);
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
    return response;
  }

  // Active user hitting auth pages or the waitlisted holding page — send to feed
  if (status === 'active' && (pathname === '/signup' || pathname === '/login' || pathname === '/' || pathname === '/waitlisted')) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // Allow-list: only an 'active' account may reach a non-public route.
  // Anything else — waitlisted, missing profile row, a failed/erroring
  // query, or an unrecognized future status — is treated as not-active
  // and gated to /waitlisted. This must fail closed, not open.
  if (status !== 'active' && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted') && !pathname.startsWith('/careers/')) {
    return NextResponse.redirect(new URL('/waitlisted', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
