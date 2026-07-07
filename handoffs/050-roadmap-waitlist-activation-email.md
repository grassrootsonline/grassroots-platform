# Document waitlist activation email as a roadmap item

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `low` |
| **Type** | `docs` |
| **Branch** | `docs/roadmap-activation-email` |
| **Depends on** | none |

---

## Problem

`apps/web/src/app/(waitlisted)/waitlisted/page.tsx` tells users "We'll send you an email the moment access opens" — but nothing in the codebase sends that email. Activation is a manual `UPDATE users SET account_status = 'active'` (per `ARCHITECTURE.md` §5.4) with zero notification attached. This surfaced while diagnosing handoff 049 (active users not redirected off `/waitlisted`) and is a separate, larger feature — an admin-triggered action plus a real transactional email — not a quick fix. Alex's call: scope it to `docs/ROADMAP.md` now, build it later once the admin panel work (in progress) gives it a real trigger point and Resend gets wired up.

---

## Affected files

- `docs/ROADMAP.md` — add one row to the existing "Background Jobs & Async Processing" table

---

## Implementation steps

1. **Add a row to the Background Jobs table**

   In the table under `## Background Jobs & Async Processing` (it already lists `Email digest` as a Resend-triggered job — this fits the same pattern), add:

   ```markdown
   | **Waitlist activation email** | When a waitlisted account is activated (today: a manual `UPDATE`; planned: triggered from the admin panel's career/user management section), a transactional email is sent via Resend notifying the user access is open. Today activation is silent — `/waitlisted`'s "we'll email you" copy is currently aspirational, not backed by code. |
   ```

   Commit: `docs(roadmap): add waitlist activation email as a planned background job`

---

## Verification

- [ ] New row renders correctly in the existing table, consistent formatting with the other rows.
- [ ] No other files changed.
