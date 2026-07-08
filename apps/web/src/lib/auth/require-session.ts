import { createServerClient } from '@/lib/supabase/server';
import { db } from '@grassroots/db';

// Server Actions are a separate trust boundary from middleware's page gate —
// a stale client bundle, a direct fetch to the action's endpoint, or a
// session that went stale between page load and form submit could all
// bypass the middleware check. Same "server check as an independent layer"
// principle as requireAdmin's comment documents.
export async function requireSession(): Promise<{ userId: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const profile = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authId, user.id),
    columns: { id: true, accountStatus: true },
  });
  if (!profile) throw new Error('Not authenticated');
  if (profile.accountStatus !== 'active') throw new Error('Account not active');

  return { userId: profile.id };
}
