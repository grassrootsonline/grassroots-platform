# Project Grassroots — Work Summary

*Advisor chronicle of completed work, July 2026*

---

## Where we started

The project had a UI layer but no backend, no handoff system, and a design system that was accumulating drift. The feed, profile, post detail, and layout chrome existed as React components. The design system had tokens and component CSS in `packages/design-system/`, but several files used hardcoded colour and shadow literals that broke dark mode. The engineering spec was buried in `design-handoffs/` instead of `docs/`. Tailwind had just been removed (Amendment 03). There was no structured way for the advisor to communicate work to Claude Code or Claude Design.

---

## Phase 1 — Design system stabilization

The first priority was getting the design system into a clean, trustworthy state before any product work. A single audit session surfaced five categories of issues that were fixed across handoffs 001–009.

**Token gaps and hardcoded values (001, 002, 005)**
Three tokens were missing entirely — `--shadow-overlay`, `--shadow-dropdown`, and `--color-scrim` — yet were referenced in four files. Every modal and panel was silently rendering with no shadow. Scrim backdrops used a hardcoded green-tinted `rgba(28, 43, 26, …)` value that looked wrong against dark backgrounds and didn't flip in dark mode. These were provisionally defined (001) and then formalized by Claude Design in Amendment 06 (002). The `globals.css` dark-theme attribute blocks were updated to include the new Amendment 06 tokens (005).

**Tooltip dark mode bug (001)**
The tooltip appearance was controlled by a `@media (prefers-color-scheme: dark)` block in `components-new.css`, which doesn't respond to the `[data-theme]` attribute used by the dev theme switcher. The fix mirrored the structural rules in `globals.css` using `[data-theme="dark"]` and `[data-theme="light"]` selectors so the forced theme mode works correctly.

**Design system structure cleanup (003)**
The engineering architecture spec was moved from `design-handoffs/core-social-mvp/` to `docs/ARCHITECTURE.md` where it belongs. Superseded CSS fixture snapshots (v04, v05, v06) were deleted. The Amendment files were consolidated into a single `CHANGELOG.md` in `packages/design-system/`. The root `CLAUDE.md` pointer was updated atomically with the move.

**Documentation patches (004)**
Claude Design had produced two patch files documenting the user and auth system. These were integrated into their target documents (`docs/ARCHITECTURE.md` and root `CLAUDE.md`) and the patch files deleted. Root `CLAUDE.md` now contains the full user data conventions section — how to handle avatar fallback, role-gated UI, deleted users, and form copy.

**Performance fixes (006)**
Google Fonts was loading via a blocking CSS `@import` in `globals.css`. Moved to `<link rel="preconnect">` tags in the root layout `<head>`. Tabler Icons CDN was pinned to `@latest` — changed to a fixed semver matching the installed React package.

**Spacing and type scale gaps (007, 008)**
An audit identified missing intermediate values in the spacing and type scales that product CSS modules had been filling with hardcoded pixels. Claude Design defined the new tokens in Amendment 07 (handoff 007). Claude Code then replaced all hardcoded `px` values across the page-level CSS modules with the new tokens (handoff 008).

**Architecture spec clarification (009)**
An unresolved conflict between `--ease-spring` in `motion.css` and the "no spring" rule in `ARCHITECTURE.md` was escalated to Alex. The resolution was documented in `docs/ARCHITECTURE.md` so it doesn't resurface.

**Process rules codified (010)**
Three rules were added to root `CLAUDE.md` to be enforced on every Claude Code session going forward: hardcoded CSS values are prohibited (stop and request a token); every commit must have a title and a descriptive body; Claude Code must verify its branch is up to date before starting any task.

---

## Phase 2 — First product feature: landing, auth, and waitlist

With the design system stable, work shifted to the first real product screens — the complete public-facing experience during the waitlist period.

**Design brief and prototype (011)**
A detailed design brief was issued to Claude Design covering four screens: landing page, signup, login, and waitlisted confirmation. The brief specified layout, copy hierarchy, component behaviour, and the waitlist-specific rules (no password on signup — email only; account status gating). Claude Design delivered the prototype at `design-handoffs/core-social-mvp/prototypes/03-landing-auth-waitlist.dc.html` and any new tokens in an amendment.

**Backend: schema, middleware, and Server Actions (012)**
This was the first live-backend work on the project. Scope:
- Database migration: new `account_status` enum (`waitlisted`, `active`, `suspended`) and column on `users`
- Drizzle schema synced with the migration
- `docs/ARCHITECTURE.md` updated to reflect the new column
- Next.js middleware for route gating by session and `account_status`
- Server Actions: `signupAction` (email + display name → Supabase auth → user_profiles insert → redirect) and `loginAction`

**UI pages (013)**
Landing page, signup, login, and waitlisted pages built to the Claude Design prototype. All four pages use design system component classes and CSS Modules with no hardcoded values. The landing page includes a two-column hero and three value proposition cards. The signup form collects email and display name only; the login form handles the existing-account case.

**Token request for landing/auth values (014)**
The prototype introduced a small number of values without tokens — a `panel-page` layout class, minor spacing, and a `panel` container pattern. These were requested from Claude Design before implementation proceeded.

**Hardcoded value cleanup (015, 016)**
After the pages were built, two passes of cleanup removed remaining hardcoded values. The first pass (015) covered the landing and auth pages; the second (016) covered the waitlisted page and any residual issues.

---

## Phase 3 — Email verification flow

The signup action initially redirected unconditionally to `/waitlisted`. In production, Supabase requires email confirmation before issuing a session — so users who signed up were landing at middleware with no session and being bounced to `/login` with no explanation.

**Design brief for check-email screen (017)**
Claude Design was briefed on the check-email screen: icon badge, heading, body copy explaining the verification email, resend button with sent confirmation state, and a "wrong email" escape link. The brief also covered the error banner needed on `/login` when a verification link expires.

**Auth callback route and signup action update (018)**
The `/auth/callback` route was created to handle the Supabase redirect after email verification. The `signupAction` was updated to branch on `session: null` — when email confirmation is required, it redirects to `/check-email?email=...` instead of `/waitlisted`. The `resendVerificationAction` Server Action was also defined here.

**Check-email page and login error state (019)**
The `/check-email` page was built as a Server Component wrapping a client component that reads the `?email=` search param and manages the resend interaction. The page shows the inbox icon badge, copy explaining where the verification email was sent, a resend button with sending/sent states, and a link to re-enter a different email at `/signup`. The `/login` page was updated to read `?error=verification_expired` and display an inline danger banner with a link to request a new verification email.

---

## Phase 4 — Production infrastructure

**Supabase production bootstrap (020)**
The Supabase project was created. Handoff 020 covered: `.env.example` committed to the repo, `.gitignore` verification, Supabase client file audit, running Drizzle migrations against the live Postgres instance, verifying the `getDataClient()` env flag, and an end-to-end smoke test on a Vercel preview deployment. The full auth flow — landing → signup → check-email → verification email click → `/auth/callback` → `/waitlisted` — was verified working against live Supabase.

---

## Current state

The platform has a working, production-wired auth backbone. The public-facing experience is complete for the waitlist period: every screen a new visitor encounters is built and functional.

What exists:
- Complete landing → signup → check-email → email verification → waitlisted flow
- Supabase project connected; schema migrated; email auth configured
- Design system fully tokenized through Amendment 07, with process rules enforced
- Handoff system (`handoffs/`) with 20 documented work items and a process guide for both Claude Code and Claude Design

What comes next:
- Merge conflict resolution and push to `main` (Alex)
- Vercel production environment variables (Alex)
- RLS policies on `users` and `user_profiles` before non-waitlist users are admitted
- Content and copy pass on the landing/auth screens — Alex edits `03-landing-auth-waitlist.dc.html`, Claude Design updates the prototype, Claude Code implements
- `getDataClient()` / seed data layer confirmation or build
- All remaining platform features: feed, profile, explore, messaging, communities, articles, projects
