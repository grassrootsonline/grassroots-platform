'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { users } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function setAccountStatusAction(userId: string, status: 'waitlisted' | 'active' | 'suspended') {
  await requireAdmin();
  await db.update(users).set({ accountStatus: status }).where(eq(users.id, userId));
  // TODO(resend): when Resend is wired up (see handoff 050 / docs/ROADMAP.md), trigger a
  // transactional email here on waitlisted -> active transitions. Deferred intentionally for v1.
  revalidatePath('/admin/users');
  revalidatePath('/admin');
}
