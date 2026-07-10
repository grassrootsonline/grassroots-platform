'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { boardCards } from '@grassroots/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

const TypeEnum = z.enum(['bug', 'idea', 'planning']);
const StatusEnum = z.enum(['inbox', 'discussing', 'handoff', 'done']);

const CardSchema = z.object({
  type: TypeEnum,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
  status: StatusEnum,
});

export async function createCardAction(input: z.infer<typeof CardSchema>) {
  const { userId } = await requireAdmin();
  const parsed = CardSchema.parse(input);

  const [{ maxPosition }] = await db
    .select({ maxPosition: sql<string | null>`max(${boardCards.position})` })
    .from(boardCards)
    .where(eq(boardCards.status, parsed.status));
  const position = maxPosition ? (parseFloat(maxPosition) + 1).toString() : '1';

  const [inserted] = await db
    .insert(boardCards)
    .values({ ...parsed, body: parsed.body || null, authorId: userId, position })
    .returning({ id: boardCards.id, position: boardCards.position, createdAt: boardCards.createdAt, updatedAt: boardCards.updatedAt });

  revalidatePath('/admin/board');
  return inserted;
}

export async function updateCardAction(id: string, input: z.infer<typeof CardSchema>) {
  await requireAdmin();
  const parsed = CardSchema.parse(input);

  await db
    .update(boardCards)
    .set({ ...parsed, body: parsed.body || null, updatedAt: new Date() })
    .where(eq(boardCards.id, id));

  revalidatePath('/admin/board');
}

const MoveSchema = z.object({
  status: StatusEnum,
  position: z.number().finite(),
});

export async function moveCardAction(id: string, input: z.infer<typeof MoveSchema>) {
  await requireAdmin();
  const parsed = MoveSchema.parse(input);

  // Fractional positioning: the client computes the midpoint between the two
  // neighbours the card was dropped between (or max+1 / min/2 at either end).
  // At single-user volume there's no realistic precision concern, so no
  // rebalancing job exists for v1 — if positions ever converge, the fallback
  // is a one-off script that renumbers a column's positions evenly.
  await db
    .update(boardCards)
    .set({ status: parsed.status, position: parsed.position.toString(), updatedAt: new Date() })
    .where(eq(boardCards.id, id));

  revalidatePath('/admin/board');
}

export async function deleteCardAction(id: string) {
  await requireAdmin();
  await db.delete(boardCards).where(eq(boardCards.id, id));
  revalidatePath('/admin/board');
}
