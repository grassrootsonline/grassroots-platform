import { createServerClient } from '@/lib/supabase/server';
import { db } from '@grassroots/db';
import { adminUsers } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';

// Server-side re-check for use inside admin Server Actions — the middleware
// gate (step 4) covers page access, but every mutation must independently
// verify admin status too (the "Server check" layer — see ROADMAP's
// three-layer permission model). Never trust the client or route alone.
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const profile = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authId, user.id),
    columns: { id: true },
  });
  if (!profile) throw new Error('Not authenticated');

  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.userId, profile.id),
    columns: { id: true },
  });
  if (!admin) throw new Error('Not authorized');

  return { userId: profile.id };
}
