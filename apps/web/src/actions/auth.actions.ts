'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@grassroots/db';
import { users, userProfiles } from '@grassroots/db/schema';
import { redirect } from 'next/navigation';

export type AuthState = { error: string } | null;

// ─── Signup ───────────────────────────────────────────────────────────────────

const SignupSchema = z.object({
  displayName: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Handle may only contain lowercase letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(10, 'Password must be at least 10 characters.'),
});

// TODO: add IP-based rate limiting before launch (5 attempts / 15 min per IP via @upstash/ratelimit).
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in environment.
export async function signupAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    displayName: formData.get('displayName'),
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { displayName, username, email, password } = parsed.data;
  const supabase = await createServerClient();

  // Check username availability before creating auth user
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
    columns: { id: true },
  });
  if (existing) {
    return { error: 'That username is taken. Try another.' };
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, username } },
  });

  if (authError) {
    if (authError.code === 'user_already_exists') {
      return { error: 'An account with that email already exists. Sign in instead?' };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Something went wrong. Please try again.' };
  }

  // Insert into users — account_status defaults to 'waitlisted'
  const [newUser] = await db.insert(users).values({
    authId: authData.user.id,
    username,
    displayName,
    accountStatus: 'waitlisted',
  }).returning({ id: users.id });

  // Insert user_profiles row
  await db.insert(userProfiles).values({
    userId: newUser.id,
    displayName,
  });

  // If Supabase returned no session, email confirmation is required.
  // Redirect to the check-email screen — the user will get a session
  // after clicking their verification link.
  if (!authData.session) {
    redirect(`/check-email?email=${encodeURIComponent(email)}`);
  }

  // Session present (email confirmation disabled, e.g. in local dev).
  redirect('/waitlisted');
}

// ─── Login ────────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// TODO: add IP-based rate limiting before launch (same @upstash/ratelimit guard as signupAction).
export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Please enter a valid email and password.' };
  }

  const { email, password } = parsed.data;
  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Incorrect email or password.' };
  }

  // Middleware routes to /feed or /waitlisted based on account_status
  redirect('/feed');
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signoutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

// ─── Username availability check ──────────────────────────────────────────────

export async function checkUsernameAction(username: string): Promise<{ available: boolean }> {
  // In seed mode there's no database connection; signup is unreachable anyway
  if (process.env.USE_SEED_DATA === 'true') {
    return { available: true };
  }

  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
    return { available: false };
  }

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
    columns: { id: true },
  });

  return { available: !existing };
}
