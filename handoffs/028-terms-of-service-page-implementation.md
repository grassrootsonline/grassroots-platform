# 028 — Implement the `/terms` page

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `feature` |
| **Branch** | `feature/terms-of-service-page` |
| **Depends on** | `026-terms-of-service-copy` (Claude Design amendment must land first), `027-privacy-policy-page-implementation` (shares `legal.ts`) |

---

## Problem

There's no `/terms` route. The footer links to it as a placeholder (per Amendment 01). Copy has been drafted (handoff 026) and laid into the existing page design by Claude Design — this is the Next.js implementation.

---

## Background

Same as handoff 027 — static, public, unauthenticated content page. No data layer or Server Actions involved.

---

## Affected files

- `apps/web/src/constants/legal.ts` — reuse the file created in handoff 027, don't duplicate it
- `apps/web/src/app/(public)/terms/page.tsx` — new route (match whatever route group `/privacy` landed in)
- Footer component — update the "Terms of service" link

---

## Token dependencies

None expected, same as handoff 027.

---

## Implementation steps

1. **Build the `/terms` route**

   Server Component, no data fetching. Pull copy from Claude Design's finalized amendment (handoff 026). Interpolate the same four constants from `apps/web/src/constants/legal.ts` (created in handoff 027) rather than hardcoding.

   Commit: `feat(terms): build /terms page`

2. **Cross-link `/privacy` and `/terms`**

   The terms copy references `/privacy` inline (in the "Suspension and termination" section) — confirm that link resolves once both pages exist.

   Commit: `feat(terms): cross-link privacy policy`

3. **Wire the footer link**

   Replace the placeholder href on "Terms of service" with `/terms`.

   Commit: `feat(footer): wire Terms of service link to /terms`

---

## Verification

- [ ] `/terms` renders with no auth required, matches Claude Design's amendment
- [ ] No hardcoded legal facts — same grep check as handoff 027
- [ ] Footer "Terms of service" link navigates to `/terms`
- [ ] The in-copy link to `/privacy` resolves correctly
- [ ] Confirm with Alex that legal review (including the arbitration carve-out flagged in handoff 026) is complete before this merges past `development`
