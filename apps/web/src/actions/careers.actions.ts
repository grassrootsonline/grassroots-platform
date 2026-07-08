'use server';

import { z } from 'zod';
import { db } from '@grassroots/db';
import { careerInterestSignups, jobApplications } from '@grassroots/db/schema';

export type NotifyMeState = { error: string } | { success: true } | null;

const NotifySchema = z.object({
  email: z.string().email('Enter a valid email address.'),
});

export async function notifyMeAction(
  _prevState: NotifyMeState,
  formData: FormData
): Promise<NotifyMeState> {
  const parsed = NotifySchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db
    .insert(careerInterestSignups)
    .values({ email: parsed.data.email })
    .onConflictDoNothing({ target: careerInterestSignups.email });

  return { success: true };
}

export type ApplyState = { error: string } | { success: true } | null;

const ApplicationSchema = z.object({
  name: z.string().min(1, 'Enter your name.'),
  email: z.string().email('Enter a valid email address.'),
  portfolioUrl: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  note: z.string().optional(),
});

export async function applyToPostingAction(
  postingId: string,
  _prevState: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const parsed = ApplicationSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    portfolioUrl: formData.get('portfolioUrl') || undefined,
    note: formData.get('note') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(jobApplications).values({ postingId, ...parsed.data });
  return { success: true };
}
