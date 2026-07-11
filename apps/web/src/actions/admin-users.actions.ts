'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { users } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';
import { cacheDel } from '@/lib/redis/client';
import { sessionKey } from '@/lib/redis/keys';

export async function setAccountStatusAction(userId: string, status: 'waitlisted' | 'active' | 'suspended') {
  await requireAdmin();

  // .returning() (not present before this handoff) is required to know which
  // cache entry to bust — the session cache is keyed by auth user id, not the
  // internal users.id this action already has.
  const [updated] = await db.update(users).set({ accountStatus: status })
    .where(eq(users.id, userId))
    .returning({ authId: users.authId });

  // Non-negotiable: bust the cached session the instant status changes, not
  // after its 30s TTL. This project has already shipped two bugs (handoffs
  // 049, 054) where a stale gate check blocked a just-activated user — an
  // uninvalidated cache here would reintroduce that exact bug class.
  if (updated) {
    await cacheDel(sessionKey(updated.authId));
  }

  // TODO(resend): when Resend is wired up (see handoff 050 / docs/ROADMAP.md), trigger a
  // transactional email here on waitlisted -> active transitions. Deferred intentionally for v1.
  revalidatePath('/admin/users');
  revalidatePath('/admin');
}
