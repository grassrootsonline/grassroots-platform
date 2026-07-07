# Admin panel + career pipeline — schema, admin gate, Server Actions

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/admin-careers-backend` |
| **Depends on** | none (can start immediately, in parallel with handoff 051's design work) |

---

## Problem

Alex wants a gated admin panel (basic analytics + career management first) and a real career-posting pipeline: admins post open roles, they show on `/careers`, applicants submit through a form, admins review submissions. None of the supporting data model, access control, or Server Actions exist yet. This handoff is the backend half — schema, the admin route gate, and Server Actions. It deliberately does **not** include any `page.tsx`/UI work: the visual design is being scoped separately in handoff 051 (`claude-design`), and the actual admin/careers pages should be a follow-up handoff once those prototypes exist — this mirrors how the waitlist system shipped (schema/middleware in 012, pages in 013).

---

## Background

**Admin access model** (per Alex's decision, 2026-07-06): a dedicated `admin_users` table, not an env var or a column on `users`. This gives an audit trail (`granted_by`, `granted_at`) and matches the shape of a real role system without building the full five-tier `user_roles` model from `docs/ROADMAP.md` — that's future scope, this is a deliberately minimal stopgap for one binary "is staff" check.

**There is no self-service or UI path to becoming an admin in this round.** The first row in `admin_users` must be inserted manually (e.g. via the Supabase SQL editor): `INSERT INTO admin_users (user_id) VALUES ('<your users.id>');` (`granted_by` can be left null for this first bootstrap row). Note in your handoff completion which environment(s) you've done this in, same expectation as handoffs 044/047.

**Application data** (per Alex's decision, 2026-07-06): structured fields — name, email, a portfolio/resume URL as plain text, an optional note — no file upload. Supabase Storage isn't wired up anywhere in this app yet; adding it is out of scope here.

**Note on seed-mode / preview branches:** `middleware.ts` currently passes through entirely when `USE_SEED_DATA === 'true'`, which means the admin gate you're adding in step 4 has no effect at all on `development`/`feature/*` branches — anyone could hit `/admin` on a seeded preview with no check. That's consistent with how every other route already behaves in seed mode (seeded session, no real auth), and building real seed-mode admin mocking is more scope than this deadline supports — **recommend leaving this as-is and documenting it**, rather than trying to fake admin auth for seeded branches. The public-facing `/careers` listing is different: that content should work in seed mode like every other public page (see step 6), since other engineers/design will want to preview it on `development`.

---

## Affected files

- `packages/db/src/schema.ts` — add `jobPostingStatusEnum`, `adminUsers`, `jobPostings`, `jobApplications`
- `supabase/migrations/` — new migration file
- `apps/web/src/middleware.ts` — add the admin route gate
- `apps/web/src/lib/auth/require-admin.ts` — new, server-side admin check helper for use inside Server Actions
- `apps/web/src/actions/admin-careers.actions.ts` — new, admin-only posting mutations
- `apps/web/src/actions/careers.actions.ts` — add `applyToPostingAction` alongside the existing `notifyMeAction`
- `apps/web/src/lib/data/types.ts` — extend `DataClient` with posting-read methods
- `apps/web/src/lib/data/seed-client.ts` — implement the new methods with fixture data
- `apps/web/src/lib/data/supabase-client.ts` — implement the new methods with real queries

---

## Token dependencies

None — backend only.

---

## Implementation steps

1. **Add schema to `packages/db/src/schema.ts`**

   ```ts
   export const jobPostingStatusEnum = pgEnum('job_posting_status', [
     'draft',
     'published',
     'closed',
   ]);

   export const adminUsers = pgTable('admin_users', {
     id:        uuid('id').primaryKey().defaultRandom(),
     userId:    uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
     grantedBy: uuid('granted_by').references(() => users.id),
     grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
   });

   export const jobPostings = pgTable('job_postings', {
     id:             uuid('id').primaryKey().defaultRandom(),
     slug:           text('slug').unique().notNull(),
     title:          text('title').notNull(),
     department:     text('department'),
     location:       text('location'),
     employmentType: text('employment_type'),
     description:    text('description').notNull(),
     status:         jobPostingStatusEnum('status').notNull().default('draft'),
     createdBy:      uuid('created_by').notNull().references(() => users.id),
     createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
     updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
     publishedAt:    timestamp('published_at', { withTimezone: true }),
     closedAt:       timestamp('closed_at', { withTimezone: true }),
   });

   export const jobApplications = pgTable('job_applications', {
     id:           uuid('id').primaryKey().defaultRandom(),
     postingId:    uuid('posting_id').notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
     name:         text('name').notNull(),
     email:        text('email').notNull(),
     portfolioUrl: text('portfolio_url'),
     note:         text('note'),
     createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   });
   ```

   Commit: `feat(db): add admin_users, job_postings, job_applications tables`

2. **Write the migration**

   `supabase/migrations/<today's date>_add_admin_careers_tables.sql`:

   ```sql
   -- Migration: admin_users, job_postings, job_applications
   -- Handoff 052

   CREATE TYPE job_posting_status AS ENUM ('draft', 'published', 'closed');

   CREATE TABLE IF NOT EXISTS admin_users (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     granted_by  UUID REFERENCES users(id),
     granted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
   -- Deliberately zero policies — write-only via Drizzle/service role, no anon
   -- read path. The first row is inserted manually; see handoff 052 background.

   CREATE TABLE IF NOT EXISTS job_postings (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug             TEXT UNIQUE NOT NULL,
     title            TEXT NOT NULL,
     department       TEXT,
     location         TEXT,
     employment_type  TEXT,
     description      TEXT NOT NULL,
     status           job_posting_status NOT NULL DEFAULT 'draft',
     created_by       UUID NOT NULL REFERENCES users(id),
     created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
     published_at     TIMESTAMPTZ,
     closed_at        TIMESTAMPTZ
   );

   -- Indexed from day one — per the lesson from handoff 047 (users.account_status
   -- was queried directly for months before anyone noticed it lacked an index).
   CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings (status);

   ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Published postings are publicly readable"
     ON job_postings FOR SELECT
     USING (status = 'published');
   -- No insert/update/delete policy — writes only via Drizzle/service role from
   -- admin Server Actions.

   CREATE TABLE IF NOT EXISTS job_applications (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     posting_id     UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
     name           TEXT NOT NULL,
     email          TEXT NOT NULL,
     portfolio_url  TEXT,
     note           TEXT,
     created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE INDEX IF NOT EXISTS idx_job_applications_posting_id ON job_applications (posting_id);

   ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
   -- Deliberately zero policies — same write-only pattern as career_interest_signups
   -- (handoff 044) and admin_users above.
   ```

   Apply to whichever environment(s) currently have a live, non-seeded Supabase backend (production at minimum) — note which in your completion summary.

   Commit: `feat(db): migration for admin_users, job_postings, job_applications`

3. **Write `apps/web/src/lib/auth/require-admin.ts`**

   ```ts
   import { createServerClient } from '@/lib/supabase/server';
   import { db } from '@grassroots/db';
   import { adminUsers } from '@grassroots/db/schema';
   import { eq } from 'drizzle-orm';

   // Server-side re-check for use inside admin Server Actions — the middleware
   // gate (step 4) covers page access, but every mutation must independently
   // verify admin status too (the "Server check" layer — see ROADMAP's
   // three-layer permission model). Never trust the client or route alone.
   export async function requireAdmin(): Promise<{ userId: string }> {
     const supabase = await createServerClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('Not authenticated');

     const profile = await db.query.users.findFirst({
       where: (u, { eq }) => eq(u.authId, user.id),
       columns: { id: true },
     });
     if (!profile) throw new Error('Not authenticated');

     const admin = await db.query.adminUsers.findFirst({
       where: eq(adminUsers.userId, profile.id),
       columns: { id: true },
     });
     if (!admin) throw new Error('Not authorized');

     return { userId: profile.id };
   }
   ```

   Commit: `feat: add requireAdmin server-side check`

4. **Add the admin route gate to `apps/web/src/middleware.ts`**

   Insert immediately after the existing `suspended` check (currently ends around line 83) and before the "Active user hitting auth pages" block:

   ```ts
   // Admin routes — independent of account_status. Being staff isn't the same
   // axis as being waitlisted/active, so this check runs on its own rather than
   // folding into the allow-list below. Non-admins (including active ones) are
   // sent to /feed, not /waitlisted — they're not being told to wait, they're
   // just not staff.
   if (pathname.startsWith('/admin')) {
     const { data: admin } = await supabase
       .from('admin_users')
       .select('id')
       .eq('user_id', user.id)
       .maybeSingle();

     if (!admin) {
       return NextResponse.redirect(new URL('/feed', request.url));
     }
     return response;
   }
   ```

   Note: `/admin` itself doesn't need to be added to `PUBLIC_PATHS` or `GATED_PATHS` as a single entry — once actual admin pages (`/admin`, `/admin/careers`, etc.) are built in the follow-up UI handoff, each of those routes will need its own `GATED_PATHS` entry to satisfy the `check-route-access` script from handoff 046. That's expected and will be caught automatically by the pre-commit hook at that time — nothing to do here yet since no `page.tsx` exists under `/admin` in this handoff.

   Commit: `feat(middleware): add admin route gate`

5. **Write `apps/web/src/actions/admin-careers.actions.ts`**

   ```ts
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
   ```

   `createPostingAction`/`updatePostingAction` deliberately take raw `FormData` rather than `useActionState`'s `(prevState, formData)` shape — the admin UI handoff (once 051 lands) should decide the exact form-binding pattern; adjust the signature there if a different pattern fits better. Slug collisions (two postings with the same title) aren't handled here — if that becomes a real problem, append a short random suffix; not worth solving speculatively now.

   Commit: `feat: add admin Server Actions for job postings`

6. **Add `applyToPostingAction` to `apps/web/src/actions/careers.actions.ts`**

   ```ts
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
   ```

   (Add the `jobApplications` import alongside the existing `careerInterestSignups` import at the top of the file.)

   Commit: `feat: add applyToPostingAction`

7. **Extend the data layer for the public postings list**

   In `apps/web/src/lib/data/types.ts`, add to `DataClient`:

   ```ts
   export interface JobPosting {
     id: string
     slug: string
     title: string
     department: string | null
     location: string | null
     employmentType: string | null
     description: string
   }

   // ...inside DataClient:
   getPublishedJobPostings(): Promise<JobPosting[]>
   getJobPostingBySlug(slug: string): Promise<JobPosting | null>
   ```

   In `supabase-client.ts`, implement both against `jobPostings` filtered to `status = 'published'`. In `seed-client.ts`, return a small fixture array (1–2 sample postings is enough) so the public `/careers` listing is previewable on seeded `development`/`feature/*` branches — this is public marketing content, not an admin/auth surface, so it should follow the same seeded-preview convention as everything else in `(auth)`.

   Commit: `feat(data): add job posting reads to DataClient`

---

## Verification

- [ ] Migration applies cleanly (and idempotently on rerun) against the live database.
- [ ] Manually inserting a row into `admin_users` for a real account, then visiting `/admin` with that account, is not blocked by the new gate (there's no `/admin` page yet in this handoff, so "not blocked" just means no redirect fires before hitting Next's own 404 for a route that doesn't exist).
- [ ] The same check redirects a non-admin account (including an `active` one) away from any `/admin`-prefixed path to `/feed`.
- [ ] `createPostingAction` called by a non-admin throws `Not authorized` and writes nothing.
- [ ] `applyToPostingAction` with a valid payload inserts a row into `job_applications` with the correct `posting_id`.
- [ ] `getPublishedJobPostings()` returns fixture data in seed mode and real (published-only) rows against live Supabase.
- [ ] `pnpm check:routes` and `pnpm type-check` both pass.
