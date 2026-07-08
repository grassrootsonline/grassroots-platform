# Implement the admin panel (dashboard, postings, applications)

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/admin-panel` |
| **Depends on** | `052` (schema/admin gate/actions — already landed) |

---

## Problem

Handoff 052 built the admin gate in `middleware.ts` and the Server Actions (`createPostingAction`, `updatePostingAction`, `setPostingStatusAction`, `requireAdmin`), but there's no `/admin` UI yet. Claude Design has delivered `design-handoffs/core-social-mvp/prototypes/08-admin.dc.html` — a single self-contained prototype showing all four admin screens (dashboard, postings list, posting form, applications) as client-side state swaps. Build these as real, separate Next.js routes sharing one layout — not a single client-rendered SPA screen.

---

## Route structure

The prototype's `state.screen` values map to real routes:

| Prototype screen | Real route |
|---|---|
| `dashboard` | `/admin` |
| `postings` | `/admin/careers` |
| `posting-form` (new) | `/admin/careers/new` |
| `posting-form` (editing) | `/admin/careers/[id]/edit` |
| `applications` | `/admin/careers/[id]/applications` |
| `unauthorized` | **Not built — see Note below** |

**Note on the "unauthorized" screen:** `middleware.ts`'s admin gate already redirects any non-admin straight to `/feed` before any `/admin` page ever renders — so this screen is unreachable in the real app and would be dead code. Recommend skipping it. If you'd rather show a friendlier in-app message than a silent redirect for authenticated-but-non-admin users, that's a reasonable product call to make differently, but it's a deliberate scope decision to flag back to Alex, not something to build by default under this deadline.

---

## Affected files

- `apps/web/src/app/admin/layout.tsx` — new, the persistent sidebar shell
- `apps/web/src/app/admin/layout.module.css` — new
- `apps/web/src/app/admin/page.tsx` — new, dashboard
- `apps/web/src/app/admin/page.module.css` — new
- `apps/web/src/app/admin/careers/page.tsx` — new, postings list
- `apps/web/src/app/admin/careers/careers.module.css` — new (shared by list/form if convenient, or split — your call)
- `apps/web/src/app/admin/careers/new/page.tsx` — new
- `apps/web/src/app/admin/careers/[id]/edit/page.tsx` — new
- `apps/web/src/app/admin/careers/[id]/applications/page.tsx` — new
- `apps/web/src/app/admin/careers/posting-form.tsx` — new client component (shared by new/edit)
- `apps/web/src/actions/admin-careers.actions.ts` — adjust `createPostingAction`/`updatePostingAction` to a `useActionState`-compatible signature (see step 5 — this is a deliberate revision of 052's draft, which explicitly left this open)
- `apps/web/src/middleware.ts` — add the five new admin routes to `GATED_PATHS` (bookkeeping for `scripts/check-route-access.mjs` only — the actual gate already covers them via `pathname.startsWith('/admin')`)

---

## Token dependencies

None — every token in the prototype already exists in `packages/design-system/tokens/`.

---

## Implementation steps

1. **Build `apps/web/src/app/admin/layout.tsx`** — the sidebar shell wrapping every `/admin` page.

   Server Component. Fetch the current admin's display name the same way `(waitlisted)/waitlisted/page.tsx` does (session → `users` row by `auth_id` → prefer `user_profiles.displayName`, matching the source-of-truth resolution from handoff 036). Sidebar per the prototype: wordmark + "Admin" muted badge; nav items (Dashboard/`layout-dashboard`, Postings/`briefcase`, Applications/`file-text` — but see note below on the Applications nav item); a bottom chip (initials avatar, name, "Administrator" label, and an "Exit admin" logout-icon link).

   **Note:** the prototype's sidebar has a standalone "Applications" nav item, but in the real route structure applications are scoped to a specific posting (`/admin/careers/[id]/applications`) — there's no single global applications list. Point the sidebar's "Applications" item at `/admin/careers` instead (postings is the natural entry point to reach any posting's applications) rather than building a route that doesn't have a clear real destination; use your judgment if a global cross-posting applications view seems worth adding, but it's not in the prototype's data model as designed and isn't required for this handoff.

   "Exit admin" should link to `/feed` (the normal app), not sign out — the prototype's link target is just a placeholder to another prototype file, not evidence that sign-out is intended.

   Active nav-item styling: derive from the current route via `usePathname()` in a small client component wrapping just the nav list (the rest of the layout can stay a Server Component), or via `next/navigation`'s `usePathname` if you make the whole layout a client component — either is fine, keep it simple.

   Commit: `feat(admin): build admin panel shell layout`

2. **Build `apps/web/src/app/admin/page.tsx`** (dashboard)

   Server Component, direct Drizzle queries (this is an internal admin surface — no need to route it through `getDataClient()`'s seed/live split; see handoff 052's note that seed-mode has no real bearing on `/admin`):

   ```ts
   import { count, eq, gte } from 'drizzle-orm'
   import { db } from '@grassroots/db'
   import { users, careerInterestSignups, jobPostings } from '@grassroots/db/schema'

   const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

   const [[newSignups], [talentSignups], [openPostings], statusRows] = await Promise.all([
     db.select({ n: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
     db.select({ n: count() }).from(careerInterestSignups),
     db.select({ n: count() }).from(jobPostings).where(eq(jobPostings.status, 'published')),
     db.select({ status: users.accountStatus, n: count() }).from(users).groupBy(users.accountStatus),
   ])
   ```

   Render the three stat cards (New signups · 30 days / Talent list signups / Open postings) and the "Total users" card with the waitlisted/active/suspended breakdown, per the prototype's layout and badge classes (`badge-muted` waitlisted, `badge-accent` active, `badge-danger` suspended). Fill in zero for any status with no rows (don't let a missing group collapse the layout).

   Commit: `feat(admin): build dashboard with real metrics`

3. **Build `apps/web/src/app/admin/careers/page.tsx`** (postings list)

   Query postings with an application count per posting:

   ```ts
   import { count, eq } from 'drizzle-orm'
   import { db } from '@grassroots/db'
   import { jobPostings, jobApplications } from '@grassroots/db/schema'

   const rows = await db
     .select({
       id: jobPostings.id,
       title: jobPostings.title,
       department: jobPostings.department,
       location: jobPostings.location,
       employmentType: jobPostings.employmentType,
       status: jobPostings.status,
       applicationCount: count(jobApplications.id),
     })
     .from(jobPostings)
     .leftJoin(jobApplications, eq(jobApplications.postingId, jobPostings.id))
     .groupBy(jobPostings.id)
   ```

   Table per the prototype: Role (title + location · type) / Department / Status badge (`published` → `badge-accent`, `draft` → `badge-muted`, `closed` → `badge-default`) / Applications (the count, linking to `/admin/careers/[id]/applications`) / an edit-pencil icon linking to `/admin/careers/[id]/edit`. "New posting" button links to `/admin/careers/new`.

   Commit: `feat(admin): build postings list`

4. **Build the posting form** — `apps/web/src/app/admin/careers/posting-form.tsx` (shared client component), `.../new/page.tsx`, `.../[id]/edit/page.tsx`

   Fields per the prototype: title, department + location (side by side), employment type (a real `<select>`: Full-time/Part-time/Contract/Internship — the schema stores this as free text, so just write the selected option's string value), description (textarea, hint: "This is shown on the public posting detail page." — rendered as Markdown on the public side per handoff 055).

   `new/page.tsx` renders `<PostingForm mode="new" />`. `[id]/edit/page.tsx` fetches the posting by `id` (`notFound()` if missing) and renders `<PostingForm mode="edit" posting={posting} />`, which also shows the prototype's "Close role" danger action (calls `setPostingStatusAction(posting.id, 'closed')`, then redirects to `/admin/careers`).

   **On publish-on-create:** the prototype's "New posting" button reads "Publish posting" (not "Save draft"), implying creation publishes immediately — but `createPostingAction` (052) inserts with no explicit status, so it lands as `draft` (the schema default) rather than `published`, which would be a mismatch between the button's label and what actually happens. Recommend making the "Publish posting" button actually publish: either default new postings straight to `published` (call `setPostingStatusAction(id, 'published')` right after `createPostingAction` succeeds, or extend `createPostingAction` to accept a status argument), so the button does what it says. `draft` remains a valid status in the schema for postings created directly some other way (e.g. a future "save as draft" action) — you don't need to build a full draft/publish toggle UI for this round, just make sure the one button in this form behaves consistently with its own label.

   Commit: `feat(admin): build posting create/edit form`

5. **Adjust `createPostingAction`/`updatePostingAction` in `apps/web/src/actions/admin-careers.actions.ts` to a `useActionState`-compatible shape**

   These currently take plain `FormData` and use `PostingSchema.parse(...)`, which throws on invalid input rather than returning a field error — inconsistent with every other form in this app (`signupAction`, `notifyMeAction`, `applyToPostingAction`), which all use `safeParse` + a `{ error } | { success: true } | null` state consumed via `useActionState`. Bring these two in line:

   ```ts
   export type PostingActionState = { error: string } | { success: true } | null;

   export async function createPostingAction(
     _prevState: PostingActionState,
     formData: FormData
   ): Promise<PostingActionState> {
     const { userId } = await requireAdmin();
     const parsed = PostingSchema.safeParse({ /* ...same fields... */ });
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
   ```

   Adjust `updatePostingAction` the same way (`safeParse`, return error/success state, keep its `postingId` first-argument-then-bind pattern same as `applyToPostingAction` in handoff 055). `requireAdmin()`'s `Not authorized`/`Not authenticated` throws are fine to leave as real thrown errors here (an admin losing access mid-session and still submitting a stale form is an edge case worth a hard error, not a graceful inline message).

   Commit: `refactor(admin): align posting actions with useActionState pattern`

6. **Build `apps/web/src/app/admin/careers/[id]/applications/page.tsx`**

   Fetch the posting (for the subheader: title · department) and its applications (`db.query.jobApplications.findMany({ where: eq(jobApplications.postingId, id), orderBy: desc(jobApplications.createdAt) })`). Table per the prototype: Applicant (name + email) / Portfolio-or-resume (link) / Note / Submitted date. Empty state when there are none: the prototype's inbox icon + "No applications yet" + "When people apply to this role, they'll show up here."

   Commit: `feat(admin): build applications view`

7. **Classify the five new routes in `middleware.ts`**

   Add to `GATED_PATHS` (bookkeeping for `scripts/check-route-access.mjs` — the actual gate for all of these already works via the existing `pathname.startsWith('/admin')` check, this is just satisfying handoff 046's verification rule):

   ```ts
   const GATED_PATHS = [
     '/feed', '/feed/:param', '/profile/:param', '/waitlisted',
     '/admin', '/admin/careers', '/admin/careers/new',
     '/admin/careers/:param/edit', '/admin/careers/:param/applications',
   ];
   ```

   Run `pnpm check:routes` and confirm it passes.

   Commit: `chore(middleware): classify admin routes for route-access check`

---

## Verification

- [ ] A real `admin_users` row for a test account grants access to all five `/admin` routes; an active non-admin account is redirected to `/feed` from every one of them.
- [ ] Dashboard stat cards show real counts (verify against a manual `SELECT` for at least one metric).
- [ ] Creating a posting through `/admin/careers/new` results in a `published` posting visible on the public `/careers` listing immediately.
- [ ] Editing a posting's fields persists and reflects on the public detail page; "Close role" sets `status = 'closed'` and removes it from the public listing.
- [ ] Invalid posting-form input (empty title/description) shows an inline field error, no DB write, no unhandled exception/500.
- [ ] Applications view shows real submitted applications for a posting, and the empty state when there are none.
- [ ] `pnpm check:routes` and `pnpm type-check` both pass.
