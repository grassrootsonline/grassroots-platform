# 029 — Rebuild the landing page to match the updated design

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feature/landing-page-redesign` |
| **Depends on** | none |

---

## Problem

`(auth)/page.tsx` still reflects the original landing design (handoff 013): "A home for creators" eyebrow, a fabricated three-stat "Live on Grassroots" card, and three value-prop cards (Build openly / Build together / Join the conversation). Claude Design's updated `design-handoffs/core-social-mvp/prototypes/03-landing-auth-waitlist.dc.html` replaces all of that with a different positioning — this handoff is the rebuild.

**Scope note:** only the landing screen (`isLanding` block) changed in the updated prototype. I diffed the signup, login, waitlisted, and check-email screens against what's already live and they're unchanged — don't touch those files.

---

## Background

The new design repositions the landing page: single "Build. Share. Connect." headline instead of the builder/creator framing, one real "waitlisted users" number instead of three fabricated stats, and the value-prop cards are replaced entirely by "Open source" and "Documentation" sections. This is a real product-positioning decision Alex has already approved via the prototype — not something to second-guess, just implement faithfully.

Two things came up during audit that needed a decision before writing this handoff, both resolved with Alex (2026-07-02):
- The new leaf-drift background uses two raw hex fills with no design-system token. Resolved: **provision now, formalize later** — define them as provisional tokens now, Claude Design will formalize (or reconsider) in a future amendment.
- "View on GitHub" and "Contribute" are `#` in the prototype because repo visibility wasn't confirmed. Resolved: **leave both as `#` placeholders** in this handoff — don't guess a URL.

---

## Affected files

- `apps/web/src/app/(auth)/page.tsx` — full rebuild of the landing screen
- `apps/web/src/app/(auth)/page.module.css` — new styles; remove now-unused value-prop and multi-stat classes
- `apps/web/src/lib/mock-data.ts` — remove `MOCK_PLATFORM_STATS` (three fake stats), add a seed value for the waitlist count
- `apps/web/src/lib/data/types.ts` — add `getWaitlistCount(): Promise<number>` to `DataClient`
- `apps/web/src/lib/data/seed-client.ts` — implement `getWaitlistCount()` returning the seed constant
- `apps/web/src/lib/data/supabase-client.ts` — implement `getWaitlistCount()` as a real count query
- `packages/design-system/tokens/colors.css` — two new provisional tokens

---

## Token dependencies

| Token | Status | Provisional value |
|---|---|---|
| `--color-decoration-leaf-1` | `provisional` | `#3d5c3a` |
| `--color-decoration-leaf-2` | `provisional` | `#456640` |

Mark both with a `/* provisional */` comment and a note that they're for decorative/illustrative use only — not interactive states, so they don't conflict with "sage is the only interactive color." Flag in your commit message that Claude Design should formalize (or reconsider) these in a future amendment; this is the system's first decorative/illustrative color pattern, which is worth their explicit sign-off rather than just quietly sticking.

---

## Implementation steps

1. **Add the provisional leaf-decoration tokens**

   `packages/design-system/tokens/colors.css`:
   ```css
   /* provisional — decorative only, pending Claude Design formalization (handoff 029) */
   --color-decoration-leaf-1: #3d5c3a;
   --color-decoration-leaf-2: #456640;
   ```

   Commit: `feat(tokens): add provisional leaf-decoration colors`

2. **Rebuild the hero**

   Replace the eyebrow + dual-CTA hero with: H1 "Build.<br>Share.<br>" + a `<span>` in `--color-accent` reading "Connect." (52px display, matches prototype); subtext "The social platform for creators. Talk about the problems you're solving, build your network, and share your story."; single `.btn .btn-primary` reading "Sign up" (not "Create account" — this copy intentionally changed). Move "Sign in" out of the hero into the nav as a text link ("Have an account? Sign in"), replacing the current ghost/primary button pair.

   Commit: `feat(landing): rebuild hero per updated design`

3. **Add the leaf-drift background**

   Recreate the decorative floating-leaf SVGs from the prototype using the new provisional color tokens (not the raw hex from the prototype file). `aria-hidden="true"`, `pointer-events: none`, absolutely positioned behind content (`z-index: 0`).

   **Handle reduced motion explicitly — this is a real gap, not a copy-paste.** The prototype's animation uses ad-hoc `--ld`/`--dd` custom properties, not the system's `--duration-*` tokens, so it won't automatically collapse under `prefers-reduced-motion` the way every other animation in this system does. Since this is purely decorative, non-essential motion — exactly the category `prefers-reduced-motion` exists for — add a scoped exception: `@media (prefers-reduced-motion: reduce) { .leafBackground { display: none; } }` in this component's CSS Module. This is a justified, narrow exception to "never write reduced-motion media queries in component code," because the alternative is genuinely-infinite decorative animation with no way to turn it off — flag this reasoning in the commit message so it doesn't get flagged as a violation later.

   Commit: `feat(landing): add leaf-drift decorative background`

4. **Add real waitlist count**

   - `lib/data/types.ts`: add `getWaitlistCount(): Promise<number>` to `DataClient`.
   - `lib/data/seed-client.ts`: return a static seed constant (move `1247` into `mock-data.ts` as e.g. `MOCK_WAITLIST_COUNT`, replacing the now-unused `MOCK_PLATFORM_STATS`).
   - `lib/data/supabase-client.ts`: real count query — `SELECT COUNT(*) FROM users WHERE account_status = 'waitlisted'` via Drizzle (`db.select({ count: count() }).from(users).where(eq(users.accountStatus, 'waitlisted'))` or your project's established count pattern — check for precedent before introducing a new one).
   - Landing page calls `getDataClient().getWaitlistCount()` and formats with `.toLocaleString()`, matching the prototype's single right-aligned stat + "waitlisted users" label.

   Commit: `feat(data): add getWaitlistCount to DataClient`

5. **Replace value props with Open source + Documentation sections**

   Remove the three-card `valueSection` entirely. Add two sections matching the prototype: "Completely open source" eyebrow (GitHub icon, `--color-accent`) → heading "Built in public, for the public." → body copy → "View on GitHub" link; and a mirrored, right-aligned "Documentation" section → heading "Everything you need to get started." → body copy about guides/API docs coming soon → "Documentation" link (arrow pointing left, per prototype).

   **Both links stay `href="#"` for now** — repo visibility wasn't confirmed. Add a code comment flagging both as pending a real destination.

   Commit: `feat(landing): replace value props with open-source and docs sections`

6. **Update the footer**

   Add "Careers" and "Contribute" to the existing "Terms of service" / "Privacy policy" links, matching the prototype's order. **"Careers" stays `href="#"`** — Alex has explicitly deferred `/careers` (the `06-careers.dc.html` prototype exists but isn't scheduled yet). **"Contribute" stays `href="#"`** for the same repo-visibility reason as step 5.

   Commit: `feat(landing): add Careers and Contribute footer links (both placeholder)`

---

## Verification

- [ ] Landing page matches the prototype's copy and layout at desktop and mobile (768px breakpoint per `--bp-md`)
- [ ] No hardcoded hex anywhere except the two provisional tokens, which live only in `colors.css` — grep the component files to confirm
- [ ] `getWaitlistCount()` returns the seed constant when `USE_SEED_DATA=true` and a real DB count otherwise
- [ ] Leaf background is `aria-hidden`, doesn't block clicks, and disappears under `prefers-reduced-motion: reduce`
- [ ] Signup/login/waitlisted/check-email pages are untouched — this handoff is landing-only
- [ ] "View on GitHub," "Contribute," and "Careers" all resolve to `#` with a code comment explaining why, not a guessed URL
