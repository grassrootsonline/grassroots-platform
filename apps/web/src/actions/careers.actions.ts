'use server';

import { z } from 'zod';
import { db } from '@grassroots/db';
import { careerInterestSignups } from '@grassroots/db/schema';

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
