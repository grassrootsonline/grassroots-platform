'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@grassroots/db';
import { jobPostings } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export type PostingActionState = { error: string } | { success: true } | null;

const PostingSchema = z.object({
  title: z.string().min(1, 'Enter a title.'),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string().min(1, 'Enter a description.'),
});

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createPostingAction(
  _prevState: PostingActionState,
  formData: FormData
): Promise<PostingActionState> {
  const { userId } = await requireAdmin();
  const parsed = PostingSchema.safeParse({
    title: formData.get('title'),
    department: formData.get('department') || undefined,
    location: formData.get('location') || undefined,
    employmentType: formData.get('employmentType') || undefined,
    description: formData.get('description'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [inserted] = await db.insert(jobPostings).values({
    ...parsed.data,
    slug: slugify(parsed.data.title),
    createdBy: userId,
    status: 'published',
    publishedAt: new Date(),
  }).returning({ id: jobPostings.id });

  revalidatePath('/admin/careers');
  revalidatePath('/careers');
  redirect(`/admin/careers/${inserted.id}/edit`);
}

export async function updatePostingAction(
  postingId: string,
  _prevState: PostingActionState,
  formData: FormData
): Promise<PostingActionState> {
  await requireAdmin();
  const parsed = PostingSchema.safeParse({
    title: formData.get('title'),
    department: formData.get('department') || undefined,
    location: formData.get('location') || undefined,
    employmentType: formData.get('employmentType') || undefined,
    description: formData.get('description'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.update(jobPostings).set(parsed.data).where(eq(jobPostings.id, postingId));
  revalidatePath('/admin/careers');
  revalidatePath('/careers');
  return { success: true };
}

export async function setPostingStatusAction(postingId: string, status: 'draft' | 'published' | 'closed') {
  await requireAdmin();
  const timestampField = status === 'published' ? { publishedAt: new Date() }
    : status === 'closed' ? { closedAt: new Date() }
    : {};

  await db.update(jobPostings).set({ status, ...timestampField }).where(eq(jobPostings.id, postingId));
  revalidatePath('/admin/careers');
  revalidatePath('/careers');
}
