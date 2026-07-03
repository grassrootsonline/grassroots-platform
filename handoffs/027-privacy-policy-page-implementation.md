# 027 — Implement the `/privacy` page

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `feature` |
| **Branch** | `feature/privacy-policy-page` |
| **Depends on** | `025-privacy-policy-copy` (Claude Design amendment must land first) |

---

## Problem

There's no `/privacy` route. The footer links to it as a placeholder (`#`, per Amendment 01). Legal/content copy has been drafted (handoff 025) and Claude Design has laid it into the existing page design — this handoff is the actual Next.js implementation.

---

## Background

This is a static, public, unauthenticated content page — no data layer, no Server Actions, no auth gating. The only real engineering concerns are: (1) a single source of truth for the handful of facts that aren't finalized yet (legal entity name, jurisdiction, contact email, effective date), so nobody hardcodes a guess into the page, and (2) wiring the footer link that's currently a placeholder.

---

## Affected files

- `apps/web/src/constants/legal.ts` — new file, shared with handoff 028
- `apps/web/src/app/(public)/privacy/page.tsx` — new route (adjust path to match whatever route group Claude Design's amendment lands in; the landing page currently lives in `(public)`/`(auth)` per `docs/ARCHITECTURE.md` §4.2 — confirm against the actual footer/nav implementation before assuming the group)
- Footer component (wherever the site-wide footer lives, e.g. `components/layout/Footer.tsx`) — update the "Privacy" link

---

## Token dependencies

None expected — Claude Design's amendment should specify the layout using existing tokens (long-form text page, similar to an article page: `--content-max-width`, `--text-body`, `--text-heading`). If the amendment introduces something new, treat that as a separate token-request handoff before implementing.

---

## Implementation steps

1. **Create the shared legal constants file**

   ```ts
   // apps/web/src/constants/legal.ts
   export const LEGAL_ENTITY_NAME = '[PLACEHOLDER: Legal Entity Name]';
   export const GOVERNING_LAW_JURISDICTION = '[PLACEHOLDER: Province, Canada]';
   export const PRIVACY_CONTACT_EMAIL = 'privacy@grassroots.ai'; // confirm final domain — ARCHITECTURE.md uses both grassroots.ai and grassroots.community
   export const POLICY_EFFECTIVE_DATE = '[PLACEHOLDER: YYYY-MM-DD]';
   ```

   These are intentionally still placeholders — do not guess real values. Alex fills these in before this page ships to `main`.

   Commit: `feat: add shared legal constants file`

2. **Build the `/privacy` route**

   Server Component, no data fetching. Pull copy from Claude Design's finalized amendment (handoff 025's copy, as laid into the design). Interpolate `{LEGAL_ENTITY_NAME}`, `{GOVERNING_LAW_JURISDICTION}`, `{PRIVACY_CONTACT_EMAIL}`, and `{POLICY_EFFECTIVE_DATE}` from the constants file above rather than hardcoding the copy's placeholder tokens.

   Commit: `feat(privacy): build /privacy page`

3. **Wire the footer link**

   Replace the placeholder `#` href on "Privacy" with `/privacy`.

   Commit: `feat(footer): wire Privacy link to /privacy`

---

## Verification

- [ ] `/privacy` renders with no auth required, matches Claude Design's amendment
- [ ] No hardcoded legal facts anywhere in the page — grep the page file for the four placeholder strings above to confirm they come from `legal.ts`, not inline
- [ ] Footer "Privacy" link navigates to `/privacy`
- [ ] Page is excluded from anything that would index/publish it before Alex confirms legal review is complete (check with Alex before merging past `development`)
