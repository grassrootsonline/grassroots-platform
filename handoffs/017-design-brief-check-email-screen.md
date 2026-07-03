# 017 — Design brief: email verification screen

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `design` |
| **Branch** | `design/check-email-screen` |
| **Depends on** | none |

---

## Context

Production signup requires email confirmation — Supabase sends a verification link before the user gets a session. After submitting the signup form, the user is redirected to `/check-email` rather than `/waitlisted`. This screen confirms the email was sent and tells them what to do next.

There is also an error state needed: if the verification link is expired or already used, the user lands on `/auth/callback` with an error and is redirected to `/login?error=verification_expired`. The login page needs to display this inline.

---

## Screen 1 — `/check-email`

**Purpose:** Confirm the verification email was sent. Keep it warm and direct — this screen should feel like progress, not a dead end.

**Layout:** Same centered, vertically-centered pattern as `/waitlisted`. Single card, no nav. Max-width matches `--panel-max-width`.

**Content (top to bottom):**
- Wordmark (`Grassroots`) at top, links to `/`
- Tabler icon: `ti-mail` — displayed in the same icon badge as the waitlist leaf icon (`--avatar-xs`-sized circular sage badge)
- Heading: "Check your inbox" — DM Serif Display, `--text-title`
- Body: "We sent a verification link to **{email}**. Click it to confirm your account and join the waitlist." — email address in medium weight so it's scannable
- Subtext below: "Didn't get it? Check your spam folder first." — `--text-small`, `--color-secondary`
- Resend link: "Resend the email" — sage text link (`.link-btn` pattern), below the subtext. Shows a brief "Sent." confirmation state after click (inline, replaces the link temporarily)
- Bottom: "Wrong email? Sign up with a different one." — `--text-small`, `--color-secondary`, "Sign up with a different one" is a link to `/signup`

**No submit button.** No primary action. The only actions are resend (secondary) and going back to signup. This screen should feel passive — the ball is in the user's court.

---

## Screen 2 — Verification error state on `/login`

When the user clicks an expired or invalid verification link, they're redirected to `/login?error=verification_expired`.

The login page should detect the `?error=verification_expired` query param and render an inline notice above the form:

- Style: same visual treatment as `.field-error` but at page level — a banner or highlighted callout, not a field-level error
- Copy: "That verification link has expired. Sign in or request a new one."
- "request a new one" — text link that points to `/check-email` (the resend flow)

This does not require a separate page — it's an additional state on the existing `/login` page.

---

## Deliverable

- Update `packages/design-system/` if any new patterns are needed
- Add both states to `design-handoffs/core-social-mvp/prototypes/03-landing-auth-waitlist.dc.html` as additional screens (or append a `04-` file if the existing prototype is too large)
- CHANGELOG entry if any tokens or component classes are added

**No new tokens are expected for this screen** — it reuses the icon badge, card, and text patterns already established. If something doesn't fit existing tokens, raise it before using a hardcoded value.
