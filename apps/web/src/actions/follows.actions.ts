'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { follows, users, notifications } from '@grassroots/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireSession } from '@/lib/auth/require-session';

export async function followUserAction(targetUserId: string): Promise<{ following: boolean } | { error: string }> {
  const { userId } = await requireSession();
  if (userId === targetUserId) return { error: "You can't follow yourself." };

  const existing = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId)),
  });

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id));
    await db.update(users).set({ followingCount: sql`${users.followingCount} - 1` }).where(eq(users.id, userId));
    await db.update(users).set({ followerCount: sql`${users.followerCount} - 1` }).where(eq(users.id, targetUserId));
    revalidatePath('/feed');
    return { following: false };
  }

  await db.insert(follows).values({ followerId: userId, followingId: targetUserId });
  await db.update(users).set({ followingCount: sql`${users.followingCount} + 1` }).where(eq(users.id, userId));
  await db.update(users).set({ followerCount: sql`${users.followerCount} + 1` }).where(eq(users.id, targetUserId));
  await db.insert(notifications).values({ recipientId: targetUserId, actorId: userId, type: 'follow' });

  revalidatePath('/feed');
  return { following: true };
}
