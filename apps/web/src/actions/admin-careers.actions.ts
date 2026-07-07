'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { jobPostings } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

const PostingSchema = z.object({
  title: z.string().min(1),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string().min(1),
});

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createPostingAction(formData: FormData) {
  const { userId } = await requireAdmin();
  const parsed = PostingSchema.parse({
    title: formData.get('title'),
    department: formData.get('department') || undefined,
    location: formData.get('location') || undefined,
    employmentType: formData.get('employmentType') || undefined,
    description: formData.get('description'),
  });

  await db.insert(jobPostings).values({
    ...parsed,
    slug: slugify(parsed.title),
    createdBy: userId,
  });

  revalidatePath('/admin/careers');
}

export async function updatePostingAction(postingId: string, formData: FormData) {
  await requireAdmin();
  const parsed = PostingSchema.parse({
    title: formData.get('title'),
    department: formData.get('department') || undefined,
    location: formData.get('location') || undefined,
    employmentType: formData.get('employmentType') || undefined,
    description: formData.get('description'),
  });

  await db.update(jobPostings).set(parsed).where(eq(jobPostings.id, postingId));
  revalidatePath('/admin/careers');
  revalidatePath('/careers');
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
