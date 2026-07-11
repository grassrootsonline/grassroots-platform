import { createServerClient } from '@/lib/supabase/server';
import { db } from '@grassroots/db';
import { adminUsers } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';
import { cacheGet, cacheSet } from '@/lib/redis/client';
import { adminKey } from '@/lib/redis/keys';

// Server-side re-check for use inside admin Server Actions — the middleware
// gate (step 4) covers page access, but every mutation must independently
// verify admin status too (the "Server check" layer — see ROADMAP's
// three-layer permission model). Never trust the client or route alone.
//
// The users lookup below still hits the DB on every call (it's needed
// regardless to get profile.id for the caller's return value) — handoff
// 069's getCurrentUser() memoization only covers the Server Component side,
// and requireAdmin() is called from Server Actions too, which don't benefit
// from that cache. Only the admin_users check is cached here.
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const profile = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authId, user.id),
    columns: { id: true },
  });
  if (!profile) throw new Error('Not authenticated');

  let isAdmin = await cacheGet<boolean>(adminKey(profile.id));
  if (isAdmin === null) {
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.userId, profile.id),
      columns: { id: true },
    });
    isAdmin = !!admin;
    // 5 min — admin grants are manual/bootstrap-only today (no UI action
    // exists to grant/revoke), so staleness risk here is low. Revisit this
    // TTL if a grant/revoke UI is ever built (see ROADMAP's future
    // user_roles system) — that would need the same invalidation treatment
    // account_status gets in middleware.ts.
    await cacheSet(adminKey(profile.id), isAdmin, 300);
  }
  if (!isAdmin) throw new Error('Not authorized');

  return { userId: profile.id };
}
