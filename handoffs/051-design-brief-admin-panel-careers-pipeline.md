# Design brief: Admin panel v1 (analytics + career management) + updated careers page

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `design-brief` |
| **Branch** | N/A — new feature folder, follow your standard `design-handoffs/<feature>/` process |
| **Depends on** | none |

---

## Problem

Grassroots has no admin surface at all today — every operational task (activating waitlisted accounts, reviewing signups) happens by hand in the Supabase dashboard. Alex wants a first, gated admin panel, scoped narrowly to start: basic analytics, and a career-management pipeline (post open roles to `/careers`, review who applies). This brief covers both the new internal admin screens and the changes needed to the existing public `/careers` page.

---

## Goals for this round

1. **Admin panel shell** — a gated internal area only accessible to allowlisted admin users (access control is handled server-side; you don't need to design a "login" flow, just the panel itself and what a signed-in admin sees, plus a plain "not authorized" state for anyone else who lands on an admin URL).
2. **Basic analytics view** — a first landing page/dashboard for the admin panel. Simple stat-card style, not a full BI tool. Suggested v1 metrics (Alex, confirm or adjust): total users by `account_status` (waitlisted / active / suspended), new signups over the last 30 days, total `career_interest_signups` (the existing generic "notify me" list), count of open job postings.
3. **Career management** — a postings list (draft / published / closed states, with create/edit actions), a create/edit posting form (title, department, location, employment type, description), and an applications view scoped to a posting (a table: name, email, portfolio/resume URL, note, submitted date).
4. **Updated public `/careers` page** — today it's a static "no open roles, notify me" page (see `design-handoffs/core-social-mvp/prototypes/06-careers.dc.html`). It needs to become a real listing: if published postings exist, show them (title/department/location, link to a detail view); if none exist, fall back to the current "no roles yet" empty state — don't lose that. Add a posting detail page with the full description and an application form (name, email, portfolio/resume URL as a text field — no file upload in this round, see Non-goals).

---

## Reference

- Visual style: `packages/design-system/CLAUDE.md` — binding, same as every other screen.
- Current `/careers` prototype: `design-handoffs/core-social-mvp/prototypes/06-careers.dc.html` — the empty state and overall tone (small-team, no-open-roles-yet framing) should carry over into the "no postings" fallback.
- The rest of the app's authenticated shell (nav patterns, card styles) is in `design-handoffs/core-social-mvp/` — the admin panel should feel like it belongs to the same product, not a bolted-on separate tool.

---

## Non-goals for this round (explicitly out of scope — don't design these yet)

- Resume/file upload — applications capture a portfolio/resume **URL**, not an uploaded file. (Supabase Storage isn't wired up anywhere in this app yet; adding it is separate scope.)
- Any UI for granting/revoking admin access — the first admin is bootstrapped manually via direct DB access. A "manage admins" screen may come later but isn't part of this round.
- Anything beyond the four v1 metrics above for analytics — charts, date-range filters, exports, etc. can come in a later pass once the basics are live.
- Waitlist activation email / notifying users — tracked separately in `docs/ROADMAP.md` (handoff 050), not part of this scope.

---

## Timeline note

Alex's target is design ready by Monday/Tuesday, with the career-posting flow (not the analytics dashboard) live by Wednesday. Given that, if anything has to be sequenced, prioritize the career management screens (postings list, create/edit form, applications table) and the updated public `/careers` page first — the analytics dashboard can trail slightly behind without blocking the Wednesday goal. Flag it if the full scope doesn't comfortably fit by Tuesday so we can re-sequence rather than compress the work.

---

## Handoff to Claude Code

Once prototypes exist, the advisor (Claude Cowork) will write the implementation handoff(s) referencing them — no need to coordinate directly with Claude Code. The corresponding backend work (schema, admin route gate, Server Actions) is already scoped in handoff 052 and can proceed in parallel with your design work, since it doesn't depend on final visual layout.
