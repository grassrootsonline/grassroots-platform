# 011 — Design brief: landing page, signup, login, and waitlist screens

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `design` |
| **Branch** | `design/landing-auth-waitlist` |
| **Depends on** | none |

---

## Context

This is the first live product work. These four screens are the complete public-facing experience during the waitlist period — every new visitor will see them. They must be polished.

The existing landing page prototype in `design-handoffs/core-social-mvp/prototypes/` is a reference only. These screens should build on the established design system and feel cohesive as a set.

All screens must fully adhere to the design system (`packages/design-system/`). No hardcoded values. All copy follows the conventions in root `CLAUDE.md` — sentence case, no emoji, no blue.

---

## Screen 1 — Landing page (`/`)

**Purpose:** Convert visitors into signups. The only goal is to get someone to click "Create account."

**Layout:** Two-column hero (matching the existing prototype pattern — product statement left, visual right). Below the fold: three value proposition cards.

**Hero — left column:**
- Eyebrow label: "A home for creators" (existing Amendment 01 copy)
- Headline: display font, large — the product's core promise. TBD on exact copy — use your judgment, keep it short (under 8 words), warm, and direct.
- Subtext: one sentence, body font, `--color-ink-soft`. What kind of person belongs here.
- Two CTAs stacked or side-by-side:
  - Primary: `.btn .btn-primary` — "Create account" → links to `/signup`
  - Secondary: `.btn .btn-ghost` — "Sign in" → links to `/login`

**Hero — right column:**
- The "Live on Grassroots" stats card from Amendment 01 (users online, active communities, ongoing threads). Seeded values in dev, wired to real metrics in production.

**Value props (below fold):**
- Three cards in a row. Copy from Amendment 01: "Build openly", "Build together", "Join the conversation". Expand the descriptions to 2–3 sentences each — they were placeholders before.

**Nav:**
- Wordmark left (DM Serif Display, links to `/`)
- Right: "Sign in" ghost button + "Create account" primary button
- No other nav items during waitlist period

**Footer:**
- Minimal: copyright, Terms of service, Privacy policy (links can be `#` placeholders for now)

---

## Screen 2 — Signup page (`/signup`)

**Purpose:** Account creation. Four fields, one action. Focused and uncluttered.

**Layout:** Centered card on `--color-canvas` background. Max-width ~440px. Same panel treatment as auth-modal (`.panel` pattern — `--radius-xl`, `--shadow-overlay`, `--color-surface`).

**Header:**
- Wordmark centered at top of card (or above card) linking back to `/`
- Heading: "Create your account" — display font, `--text-title`
- Subtext: "Join the community building the future of AI." — body font, `--color-secondary`

**Form fields (in order):**
1. Display name — label: "Display name", placeholder: "Ada Lovelace"
2. Handle — label: "Handle", placeholder: "ada", prefix: `@` inside the input. Lowercase only, validated against username rules (3–30 chars, a-z/0-9/_ only). Show inline availability feedback.
3. Email — label: "Email", type: email
4. Password — label: "Password", type: password. Helper text: "At least 10 characters."

**Submit:** Full-width `.btn .btn-primary` — "Create account"

**Footer link:** "Already have an account? Sign in" — "Sign in" links to `/login`

**Error states:** use the copy from `CLAUDE.md`:
- Username taken: "That username is taken. Try another."
- Email taken: "An account with that email already exists. Sign in instead?"
- Password too short: "Password must be at least 10 characters."

---

## Screen 3 — Login page (`/login`)

**Purpose:** Return users signing in. Simple.

**Layout:** Same centered card as signup. Max-width ~440px.

**Header:**
- Wordmark centered linking to `/`
- Heading: "Welcome back" — display font, `--text-title`
- No subtext needed

**Form fields:**
1. Email — label: "Email", type: email
2. Password — label: "Password", type: password

**Submit:** Full-width `.btn .btn-primary` — "Sign in"

**Secondary action:** "Forgot your password?" — text link, `--color-accent`, aligned below or above the submit button. The reset flow is not built yet — this link can point to `#` for now, but the element must be in the design.

**Footer link:** "Don't have an account? Create one" — "Create one" links to `/signup`

---

## Screen 4 — Waitlist holding page (`/waitlisted`)

**Purpose:** Confirm the user's account exists and set expectations. Warm but minimal. This is a holding room — it should not feel like a dead end.

**Layout:** Centered, vertically centered on the viewport. No sidebar, no nav. Just the content.

**Content:**
- Wordmark at top (links to `/` — but since they're waitlisted, it will just reload this page for now)
- Heading: "You're on the list." — display font, `--text-display` or `--text-title` depending on what feels right
- Body: Two sentences. Acknowledge that their account is created. Tell them they'll be notified by email when access opens. Warm, not corporate. Write it in the voice of the product.
- The user's display name should appear somewhere — e.g. "Hey {displayName}," above the heading, or worked into the body copy.
- A single subtle action: "Sign out" — `.btn .btn-ghost .btn-sm`, bottom of the card or page. Authenticated but waitlisted users need a way out.

**Visual treatment:**
- This is a display moment — consider using a subtle background treatment, the sage accent, or the DM Serif Display heading to make it feel considered rather than thrown together. It is the last thing a user sees until they get access. Make it feel like a promise.

---

## Deliverable

Produce the four screens as direct edits to the design system and a new prototype file:

- Update `packages/design-system/` if any new tokens or component patterns are needed (follow `CONTRIBUTING.md`)
- Create `design-handoffs/core-social-mvp/prototypes/03-landing-auth-waitlist.html` as the live visual reference
- Add a CHANGELOG entry for any design system additions

**App follow-up:** Note in the CHANGELOG any token additions or new component classes introduced, so Claude Code can reference them when building the screens.
