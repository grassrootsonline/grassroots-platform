# Implement the careers page (`/careers`)

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `feature` |
| **Branch** | `feat/careers-page` |
| **Depends on** | none |

---

## Problem

`design-handoffs/core-social-mvp/prototypes/06-careers.dc.html` has been designed and parked since the landing redesign (handoff 029), which deliberately left the footer's "Careers" link as `href="#"` pending scheduling. It's being scheduled now. Unlike the privacy/terms pages, this prototype's copy is finished, not placeholder — no legal review, no `[PLACEHOLDER: ...]` tokens, no separate `claude-design` copy pass needed. This is a single implementation handoff.

---

## Background

The prototype (read it in full before starting) is a simple standalone page: a centered hero (eyebrow "Careers" / headline / one paragraph explaining there are no open roles yet) plus a card with a functional email-capture form ("Notify me") — not decorative. That form needs a real, working backend: an email submitted here should be durably stored so it can be reviewed later, not silently discarded.

This does **not** reuse `LegalPageShell` (used by `/privacy` and `/terms`) — that component's layout (title + effective-date + prose body) doesn't match this page's centered hero-and-card layout at all. Build a dedicated page, the same way `/privacy` and `/terms` each got dedicated content but this one needs its own shell, not a shared one.

For the form itself, mirror the **real** working pattern in `apps/web/src/app/(auth)/signup/page.tsx`: `useActionState` + `<form action={...}>` + a `useFormStatus`-driven submit button. Do **not** use `apps/web/src/components/auth/auth-modal.tsx` as a reference — despite its name, it's a client-only mock (local `useState`, a fake `setTimeout` delay, no real Server Action call) and doesn't reflect how this app actually wires forms to the backend.

---

## Affected files

- `packages/db/src/schema.ts` — add `careerInterestSignups` table
- `supabase/migrations/` — new migration file for that table
- `apps/web/src/actions/careers.actions.ts` — new file, `notifyMeAction`
- `apps/web/src/app/(auth)/careers/page.tsx` — new route (Server Component)
- `apps/web/src/app/(auth)/careers/page.module.css` — new
- `apps/web/src/app/(auth)/careers/notify-form.tsx` — new client component (the form island)
- `apps/web/src/app/(auth)/page.tsx` — wire the footer's Careers link (line ~102-103)

---

## Token dependencies

None — every token referenced in the prototype (`--space-*`, `--color-*`, `--border-*`, `--radius-*`, `--text-*`, `--weight-*`, `--focus-ring`) already exists in `packages/design-system/tokens/`, since the prototype itself was built against the real production design system. One deliberate substitution, not a new token request: the prototype's H1 uses an inline `font-size:40px`, which doesn't match any existing token exactly. Use `--text-display` (36px — "Hero / page titles," the same token `LegalPageShell`'s `h1` almost certainly already uses) rather than requesting a new one-off token for a 4px difference. `--text-hero` (52px) is explicitly reserved for the landing page only per its own comment in `typography.css` — don't use it here.

---

## Implementation steps

1. **Add the `career_interest_signups` table to `packages/db/src/schema.ts`**

   ```ts
   export const careerInterestSignups = pgTable('career_interest_signups', {
     id:        uuid('id').primaryKey().defaultRandom(),
     email:     text('email').unique().notNull(),
     createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   });
   ```

   Commit: `feat(db): add career_interest_signups table`

2. **Write the migration**

   Add `supabase/migrations/<today's date, following the existing YYYYMMDDHHMMSS pattern>_add_career_interest_signups.sql`:

   ```sql
   -- Migration: add career_interest_signups table for the /careers "notify me" form
   -- Handoff 044

   CREATE TABLE IF NOT EXISTS career_interest_signups (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email      TEXT UNIQUE NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   ALTER TABLE career_interest_signups ENABLE ROW LEVEL SECURITY;
   -- Deliberately zero policies: this table is write-only from the app's
   -- perspective (via Drizzle, which bypasses RLS — see ARCHITECTURE.md §8.1),
   -- and has no legitimate read path through the Supabase JS client/anon key.
   -- Reviewing submissions is an admin action via the Supabase dashboard only.
   ```

   This is the same base-table-creation gap flagged in prior sessions (there's no full migration history for `users`/`user_profiles` either) — don't let that stop you here; this is a brand-new table so its migration file *is* the complete history from day one. Apply this migration to whichever environment(s) currently have a live, non-seeded Supabase backend once this branch is ready for review — note in your handoff completion which environments you've applied it to.

   Commit: `feat(db): migration for career_interest_signups`

3. **Write `apps/web/src/actions/careers.actions.ts`**

   ```ts
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
   ```

   `onConflictDoNothing` makes a repeat submission of the same email a silent no-op rather than an error — show the same success state either way, no need to distinguish "already on the list" from "just added."

   Commit: `feat: add notifyMeAction server action for careers page`

4. **Build `apps/web/src/app/(auth)/careers/notify-form.tsx`** (client component)

   Follow the exact pattern from `(auth)/signup/page.tsx`: `useActionState(notifyMeAction, null)`, a `useFormStatus`-driven submit button ("Notify me" → "Sending…" while pending), render `state.error` if present. When `state?.success` is true, replace the form with a short confirmation message in place (e.g. "You're on the list — we'll reach out if something opens up.") rather than clearing/resetting the form fields. Match the prototype's card copy exactly for the non-success state: "Stay in the loop" / "Drop your email and we'll reach out when something opens up that might be a fit." / "No spam. Unsubscribe anytime."

   Commit: `feat: build careers page notify-me form component`

5. **Build `apps/web/src/app/(auth)/careers/page.tsx` and `page.module.css`**

   Server Component. Structure per the prototype: sticky nav (wordmark + "Back to home" link, same pattern as `LegalPageShell`'s nav — plain markup here, this page doesn't use that shared component), centered main with eyebrow/headline/subhead, the `<NotifyForm />` card, and a footer matching the prototype's (copyright + Terms/Privacy/Careers-active/Contribute links — Careers styled as the active/current page per the prototype's `font-weight:var(--weight-medium)` treatment on its own link, Contribute stays `href="#"`).

   Copy, verbatim from the prototype:
   - Eyebrow: "Careers"
   - H1: "We're a small team building something we care about."
   - Body: "No open roles right now — but that'll change. When we're ready to grow, we want to find people who genuinely believe in what we're doing."

   All spacing/color/border values via CSS Module classes referencing tokens — no inline `style` except the standard `font-size: 16px` exception on the email `<input>` (iOS Safari zoom prevention, same as every other form in this app).

   Commit: `feat: build /careers page`

6. **Wire the footer link in `apps/web/src/app/(auth)/page.tsx`**

   Replace:

   ```tsx
   {/* href intentionally "#" — /careers is deferred, not yet scheduled (handoff 029) */}
   <a href="#" className={s.footerLink}>Careers</a>
   ```

   With:

   ```tsx
   <Link href="/careers" className={s.footerLink}>Careers</Link>
   ```

   (`Link` from `next/link` is already imported in this file for the Terms/Privacy links directly above it.)

   Commit: `fix(landing): wire footer Careers link to /careers`

---

## Verification

- [ ] `/careers` renders with the exact copy above, matching the prototype's layout at a glance.
- [ ] Submitting a valid email shows a success confirmation in place of the form.
- [ ] Submitting an invalid email shows a field error, no DB write attempted.
- [ ] Submitting the same email twice doesn't error — second submission still shows success.
- [ ] `career_interest_signups` row actually appears in the database after a successful submission (check whichever live Supabase environment you tested against).
- [ ] Footer "Careers" link on the landing page navigates to `/careers`, no longer `#`.
- [ ] No hardcoded hex/px values introduced in any new CSS Module (the one allowed exception: `font-size: 16px` on the email input).
- [ ] `pnpm type-check` passes.
