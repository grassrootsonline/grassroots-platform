'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { posts, postReactions, comments, notifications, users } from '@grassroots/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireSession } from '@/lib/auth/require-session';
import { isUniqueViolation } from '@/lib/db-errors';

const ContentSchema = z.string().trim().min(1, 'Say something first.').max(2000, 'Keep it under 2000 characters.');

export async function createPostAction(content: string): Promise<{ id: string; createdAt: string } | { error: string }> {
  const { userId } = await requireSession();
  const parsed = ContentSchema.safeParse(content);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [inserted] = await db.insert(posts).values({
    authorId: userId,
    content: parsed.data,
  }).returning({ id: posts.id, createdAt: posts.createdAt });

  await db.update(users).set({ postCount: sql`${users.postCount} + 1` }).where(eq(users.id, userId));

  revalidatePath('/feed');
  return { id: inserted.id, createdAt: inserted.createdAt.toISOString() };
}

export async function reactToPostAction(postId: string): Promise<{ liked: boolean; reactionCount: number } | { error: string }> {
  const { userId } = await requireSession();

  const existing = await db.query.postReactions.findFirst({
    where: and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)),
  });

  if (existing) {
    await db.delete(postReactions).where(eq(postReactions.id, existing.id));
    const [row] = await db.update(posts)
      .set({ reactionCount: sql`${posts.reactionCount} - 1` })
      .where(eq(posts.id, postId))
      .returning({ reactionCount: posts.reactionCount });
    revalidatePath('/feed');
    revalidatePath(`/feed/${postId}`);
    return { liked: false, reactionCount: row?.reactionCount ?? 0 };
  }

  try {
    await db.insert(postReactions).values({ postId, userId });
  } catch (err) {
    // Race: another concurrent request already inserted the same (postId, userId)
    // row between our findFirst check and this insert. Treat as already-liked,
    // not an error — the end state (liked=true) is what both callers wanted.
    if (isUniqueViolation(err)) {
      const [row] = await db.select({ reactionCount: posts.reactionCount }).from(posts).where(eq(posts.id, postId));
      return { liked: true, reactionCount: row?.reactionCount ?? 0 };
    }
    throw err;
  }

  const [row] = await db.update(posts)
    .set({ reactionCount: sql`${posts.reactionCount} + 1` })
    .where(eq(posts.id, postId))
    .returning({ reactionCount: posts.reactionCount, authorId: posts.authorId });

  // Don't notify on self-like.
  if (row && row.authorId !== userId) {
    await db.insert(notifications).values({
      recipientId: row.authorId, actorId: userId, type: 'reaction', postId,
    });
  }

  revalidatePath('/feed');
  revalidatePath(`/feed/${postId}`);
  return { liked: true, reactionCount: row?.reactionCount ?? 0 };
}

export async function createCommentAction(
  postId: string,
  content: string
): Promise<{ id: string; createdAt: string } | { error: string }> {
  const { userId } = await requireSession();
  const parsed = ContentSchema.safeParse(content);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [inserted] = await db.insert(comments).values({
    postId, authorId: userId, content: parsed.data,
  }).returning({ id: comments.id, createdAt: comments.createdAt });

  const [postRow] = await db.update(posts)
    .set({ commentCount: sql`${posts.commentCount} + 1` })
    .where(eq(posts.id, postId))
    .returning({ authorId: posts.authorId });

  if (postRow && postRow.authorId !== userId) {
    await db.insert(notifications).values({
      recipientId: postRow.authorId, actorId: userId, type: 'comment', postId,
    });
  }

  revalidatePath(`/feed/${postId}`);
  return { id: inserted.id, createdAt: inserted.createdAt.toISOString() };
}

// Known gap: the delete/update pairs above run as sequential awaits, not a
// db.transaction() — no transaction helper precedent exists elsewhere in this
// codebase yet. A failure between steps (e.g. the reaction row is deleted but
// the count update fails) can leave posts.reaction_count/comment_count out of
// sync. Acceptable for v1 per handoff 059; revisit if this becomes a problem.
