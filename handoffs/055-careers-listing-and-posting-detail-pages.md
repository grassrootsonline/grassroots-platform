# Implement careers listing + posting detail/application pages

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/careers-listing-detail` |
| **Depends on** | `052` (schema/actions/data-client — already landed) |

---

## Problem

Handoff 052 built the backend (`job_postings`/`job_applications` tables, `applyToPostingAction`, `getPublishedJobPostings`/`getJobPostingBySlug` on `DataClient`) but no UI reads from it yet — `/careers` still only shows the static "no roles yet" empty state. Claude Design has delivered prototypes for both pieces this needs: `design-handoffs/core-social-mvp/prototypes/06-careers.dc.html` (updated in place — now shows a real listing when postings exist, falls back to the existing empty state when they don't) and `prototypes/07-careers-posting.dc.html` (new — posting detail + application form).

---

## Affected files

- `apps/web/src/app/(auth)/careers/page.tsx` — update to fetch and branch on real data
- `apps/web/src/app/(auth)/careers/[slug]/page.tsx` — new
- `apps/web/src/app/(auth)/careers/[slug]/page.module.css` — new
- `apps/web/src/app/(auth)/careers/[slug]/apply-form.tsx` — new client component (the application form island)
- `apps/web/src/middleware.ts` — add prefix handling for `/careers/[slug]` (see step 3 — this is not optional, skipping it silently breaks the new page for logged-out visitors)
- `scripts` — no changes; `pnpm check:routes` just needs the array updates in step 3/4
- `apps/web/package.json` — add `react-markdown`

---

## Token dependencies

None — every token referenced in both prototypes already exists (confirmed against `packages/design-system/tokens/`, same as handoff 044's careers page).

---

## Implementation steps

1. **Update `apps/web/src/app/(auth)/careers/page.tsx`** to fetch real postings and branch:

   ```tsx
   import { getDataClient } from '@/lib/data'
   // ...existing imports

   export default async function CareersPage() {
     const postings = await getDataClient().getPublishedJobPostings()
     // ...
   }
   ```

   If `postings.length > 0`, render the listing per `06-careers.dc.html`'s populated state: an "N open role(s)" label, then a stack of role cards (title, department · location · type, arrow icon) each linking to `/careers/[slug]`. If empty, keep the existing hero copy + `NotifyForm` card exactly as it is today — don't regress the empty state that's already live.

   The prototype's `job.type` field is `employmentType` in the real data model — same field, different name; use `employmentType` when reading from `getPublishedJobPostings()`.

   The prototype also shows a persistent "Join our talent list" link even when postings exist, toggling to reveal the notify-me card. Simplest faithful approach: always render the existing `NotifyForm` card below the listing (no toggle needed) rather than building extra client-side show/hide state for it — use your judgment if a toggle reads meaningfully better, but don't over-build this.

   Commit: `feat(careers): show published postings on the careers listing`

2. **Build `apps/web/src/app/(auth)/careers/[slug]/page.tsx`**

   Server Component. Fetch via `getDataClient().getJobPostingBySlug(params.slug)`; call Next's `notFound()` if it returns `null` (covers both "doesn't exist" and "exists but not published" — `getJobPostingBySlug`'s Supabase implementation already filters to `status = 'published'`).

   Layout per `07-careers-posting.dc.html`: nav (wordmark + "All roles" back-link to `/careers`), header (title as `--text-display` heading, three badges for department/location/employmentType — `Tabler` icons `briefcase`/`map-pin`/`clock`, skip a badge if its field is null), the description, the `<ApplyForm postingId={posting.id} />` card, and the same footer as the rest of `(auth)` (Terms/Privacy/Careers/Contribute — Careers not marked active here since this isn't the `/careers` page itself).

   **On rendering `description`:** the prototype shows richly structured content (`<h2>` section headers, bullet lists) as static prototype copy — but the real schema has a single `description: text` column, not structured fields. The admin posting form (see handoff 056) has a field hint saying "Markdown supported," so render this column through a Markdown renderer rather than as one plain-text blob or naively splitting on newlines. Add `react-markdown` (`pnpm add react-markdown --filter @grassroots/web`) and render with it; style the output via the `.jd` CSS class patterns already sketched in the prototype's `<style>` block (heading/paragraph/list spacing) ported into `page.module.css`. Don't add a plugin that permits raw HTML passthrough (e.g. `rehype-raw`) — descriptions are admin-authored (trusted-ish, since only allowlisted admins can write them) but there's no reason to widen the XSS surface unnecessarily.

   Commit: `feat(careers): build posting detail page`

3. **Build `apps/web/src/app/(auth)/careers/[slug]/apply-form.tsx`** (client component)

   Same `useActionState`/`useFormStatus` pattern as `notify-form.tsx` and `signup/page.tsx`. `applyToPostingAction` is already bound to a specific posting via its first argument (`postingId`) rather than `useActionState`'s usual two-argument shape — bind it with `.bind(null, posting.id)` before passing to `useActionState`, same technique you'd use for any Server Action that needs an extra fixed argument:

   ```tsx
   const [state, formAction] = useActionState(applyToPostingAction.bind(null, postingId), null)
   ```

   Fields per the prototype: full name, email (side by side), portfolio/resume URL (full width, with the hint text "Link to your portfolio, GitHub, LinkedIn, or a hosted resume."), an optional note. On `state.success`, replace the form with the prototype's confirmation card ("Application received" + the exact body copy + a link back to `/careers`). On `state.error`, show it inline same as every other form in this app. Standard `font-size: 16px` exception on the email/URL/name inputs.

   Commit: `feat(careers): build posting application form`

4. **Fix `apps/web/src/middleware.ts` — `/careers/[slug]` needs prefix matching, not exact-match**

   `PUBLIC_PATHS.includes(pathname)` only matches the literal string `/careers` — it will **not** match `/careers/founding-engineer`. Left as-is, this new page would be exact-match-blocked for logged-out and non-active visitors, the same class of bug fixed in handoffs 045 and 049. `/waitlisted` already solves this the right way (`pathname.startsWith('/waitlisted')` alongside the array check) — mirror that pattern for `/careers/`:

   ```ts
   // No session — allow-list only.
   if (!user) {
     if (!PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted') && !pathname.startsWith('/careers/')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
     return response;
   }
   ```

   ```ts
   // Allow-list: only an 'active' account may reach a non-public route.
   if (status !== 'active' && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted') && !pathname.startsWith('/careers/')) {
     return NextResponse.redirect(new URL('/waitlisted', request.url));
   }
   ```

   Commit: `fix(middleware): allow /careers/[slug] for logged-out and non-active visitors`

5. **Update `PUBLIC_PATHS` and route classification bookkeeping**

   Add `/careers/:param` to the `PUBLIC_PATHS` array itself too — not because the runtime logic reads it that way (it's the `startsWith` check in step 4 that actually governs behavior), but because `scripts/check-route-access.mjs` (handoff 046) normalizes discovered dynamic routes to `:param` and needs to find a matching entry to consider `/careers/[slug]` classified. Add a short comment noting the distinction so a future reader doesn't assume this array entry alone is what makes the route public:

   ```ts
   const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback', '/privacy', '/terms', '/careers', '/careers/:param'];
   // Note: '/careers/:param' here is bookkeeping for scripts/check-route-access.mjs's
   // route-classification check only. The actual runtime allow-list for
   // /careers/[slug] is the explicit pathname.startsWith('/careers/') checks above —
   // PUBLIC_PATHS.includes() is an exact match and would never match a real slug.
   ```

   Run `pnpm check:routes` and confirm it passes with no unclassified routes.

   Commit: `chore(middleware): classify /careers/[slug] for route-access check`

---

## Verification

- [ ] `/careers` shows the real listing when published postings exist, and the original empty state when none do (no regression).
- [ ] `/careers/[slug]` renders full posting details for a published posting; visiting a slug for a `draft`/`closed` posting, or one that doesn't exist, returns a 404.
- [ ] **Logged-out** visitor can load `/careers/[slug]` directly with no redirect (test this specifically — it's the exact bug class from 045/049).
- [ ] Submitting a valid application inserts a row into `job_applications` with the correct `posting_id`; invalid email/URL shows a field error with no DB write.
- [ ] Markdown in a posting's `description` (headers, lists, paragraphs) renders correctly and safely (no raw HTML injection).
- [ ] `pnpm check:routes` and `pnpm type-check` both pass.
