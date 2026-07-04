# Split docs/ARCHITECTURE.md into current-state ARCHITECTURE.md + docs/ROADMAP.md

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `refactor` |
| **Branch** | `docs/split-architecture-roadmap` |
| **Depends on** | `039-introduce-staging-environment-tier.md` (git workflow / env sections should land first so this handoff isn't rewriting content that's about to change again) |

---

## Problem

`docs/ARCHITECTURE.md` calls itself "the single source of architectural truth" and "authoritative" — but large parts of it describe a system that doesn't exist in this codebase. Verified directly against the current repo (not assumed):

| ARCHITECTURE.md describes | Actual state |
|---|---|
| §4.1 monorepo: `apps/admin/`, `packages/utils/`, `packages/config/`, `supabase/functions/` | None of these exist. Actual: `apps/web` only; `packages/db`, `packages/types`, `packages/ui`, `packages/design-system`; `supabase/migrations/` only (3 files, no `functions/`). |
| §4.2 web app structure: `explore/`, `messages/`, `notifications/`, `settings/`, `project/[slug]/`, `community/[slug]/`, `article/[slug]/`, `hooks/`, `lib/permissions/`, `lib/redis/`, five `actions/*.actions.ts` files | Only `(auth)`, `(platform)/feed`, `(platform)/profile/[username]`, `(waitlisted)` route groups exist. No `hooks/` directory at all. No `lib/permissions/` or `lib/redis/`. Only `actions/auth.actions.ts` exists. |
| §5.2 full schema: `projects`, `posts`, `articles`, `communities`, `comments`, `followers`, `post_reactions`, `community_members`, `notifications`, `message_threads`, `messages`, and their enums | `packages/db/src/schema.ts` defines exactly two tables: `users`, `user_profiles`, plus one enum (`account_status`). Nothing else in that list exists. |
| §5.3 five-table user system: `auth_providers`, `user_metadata`, `user_roles`, role architecture, progressive profiling, Redis-cached role lookups | Only `users` and `user_profiles` exist. No `auth_providers`, `user_metadata`, or `user_roles` tables. No role column or role join table at all currently. |
| §8 Permission system: `checkPermission()`, `usePermissions()`, `requireSession()`, `lib/permissions/permissions.config.ts` | None of these exist anywhere in `apps/web/src`. Confirmed via full-codebase grep — zero matches. §8.1's own "Current gap" callout about Drizzle bypassing RLS is accurate, but it understates the gap: there is no `checkPermission()` layer to fall back on at all yet, seeded or not. |
| §6 Performance Architecture (4-layer cache, Redis key schema, feed fan-out) | No caching layer exists. `getDataClient()` does direct Drizzle/Supabase queries with no Redis, no `revalidateTag()` usage found, no fan-out logic. |
| §7 Real-Time Architecture | No Supabase Realtime subscriptions exist anywhere in the codebase. |
| §10 Rate Limiting, §11 Background Jobs | No Upstash Ratelimit, no Vercel Cron config, no Edge Functions. None of this is wired. |
| §13 Observability | Vercel Speed Insights and Analytics **are** actually wired (`<SpeedInsights />`/`<Analytics />` in `apps/web/src/app/layout.tsx`, landed via PRs #53/#54). Sentry and Axiom are **not** — no `instrumentation.ts`, no Sentry/Axiom packages in `package.json`. |
| §3.1 CI/CD: "GitHub Actions (lint, type-check, test, preview deploy on every PR)" | No `.github/workflows` directory exists at all — no CI runs on this repo currently. Confirmed via direct directory check. |
| §15.4 "Every PR requires... at least one approval" | Contradicted by this project's actual, deliberate workflow (root `CLAUDE.md`): Claude Code pushes a branch and stops, Alex reviews the Vercel preview and merges manually — there's no PR-approval gate in practice. |

Treating this document as authoritative in its current form risks a future implementer (Claude Code or otherwise) building against APIs, tables, and directories that were never actually created — or worse, believing security/permission enforcement exists where it doesn't.

---

## Background

Alex's decision: split the document rather than annotate it in place or delete the aspirational content. `docs/ARCHITECTURE.md` becomes **only** what's actually built and how it actually works — safe to build directly against. A new `docs/ROADMAP.md` captures the full original vision (product pillars, five-table user system, caching, realtime, rate limiting, background jobs, admin app, CI/CD, testing strategy, scalability phases) as forward-looking design intent, clearly labeled as not-yet-built.

This mirrors the existing precedent in the doc itself — §5.3's "supersedes §5.2, will be updated when the migration handoff is issued" note and the `is_suspended` deprecation callout in §5.2 are both examples of flagging drift instead of ignoring it. This handoff does that at the whole-document scale.

---

## Affected files

- `docs/ARCHITECTURE.md` — rewritten to current-state only
- `docs/ROADMAP.md` — new file, receives the aspirational content
- `docs/USER_SYSTEM.md` — read and reconcile against the same current/aspirational split (see step 6); do not touch `docs/USER_SYSTEM.docx` (binary, out of scope)

---

## Token dependencies

None — documentation only.

---

## Implementation steps

1. **Create `docs/ROADMAP.md` with a clear framing header**

   Start the new file with:

   ```markdown
   # Grassroots — Roadmap & Future Architecture

   > This document describes planned features, systems, and infrastructure that are **not yet implemented**. Nothing here should be assumed to exist in the codebase. For what's actually built and how it actually works today, see `ARCHITECTURE.md`.
   >
   > When a section here gets built, move its accurate, as-implemented description into `ARCHITECTURE.md` and either delete it from this file or reduce it to a one-line "done — see ARCHITECTURE.md §X" pointer. Do not let both documents describe the same system in different levels of accuracy.
   ```

   Commit: `docs: create ROADMAP.md`

2. **Move fully aspirational sections verbatim into ROADMAP.md**

   Move these sections from `ARCHITECTURE.md` into `ROADMAP.md`, unmodified, under their own headings:

   - §2.2 Core Product Pillars (table) — keep the full table; none of Projects/Articles/Communities/Messages/Notifications exist yet, and Posts/Profiles are only partially built
   - §4.1's `apps/admin/`, `packages/utils/`, `packages/config/`, `supabase/functions/` lines (see step 3 for what stays)
   - §5.3's five-table schema, role architecture, permission enforcement description, caching layer table (see step 4 for what stays)
   - Full §5.2 core tables for `projects`, `posts`, `articles`, `communities`, and all social-graph/interaction tables and enums (see step 4 for what stays)
   - §6 Performance Architecture (entire section)
   - §7 Real-Time Architecture (entire section)
   - §8.2 Permission matrix and §8.3 Permission implementation code sample (§8.1's architecture overview and current-gap callout stay — see step 5)
   - §9.3's code sample referencing `getCachedProfile`/Redis (the general Server Actions rules in §9.1 stay)
   - §10 Rate Limiting (entire section)
   - §11 Background Jobs & Async Processing (entire section)
   - §13.2 Structured logging (Axiom) — §13.1 (Sentry) also moves; §13.3 (Vercel Speed Insights) stays, it's real
   - §16 Scalability Roadmap (entire section — this is already explicitly a roadmap, obvious fit)
   - §18 Open Questions & Future Decisions (entire section)

   Commit: `docs: move aspirational architecture sections to ROADMAP.md`

3. **Rewrite §4 (Codebase Structure) in ARCHITECTURE.md to the real structure**

   Replace the §4.1 monorepo layout block with what actually exists:

   ```
   grassroots-platform/
     apps/
       web/                  # Next.js 15 main application
     packages/
       db/                   # Drizzle schema (schema.ts), migrations config
       types/                # Shared TypeScript types
       ui/                   # Shared component library
       design-system/        # CSS tokens, components, motion, responsive rules
     supabase/
       migrations/           # SQL migration files
     handoffs/                # Advisor → Claude Code / Claude Design task documents
     design-handoffs/         # Claude Design prototypes and amendments
     turbo.json
     pnpm-workspace.yaml
   ```

   Add a line directly below it: "`apps/admin`, `packages/utils`, `packages/config`, and `supabase/functions` are planned but not yet created — see `ROADMAP.md`."

   Replace the §4.2 web app directory structure block with what actually exists (verify current state again at implementation time — new routes/components may have landed since this handoff was written):

   ```
   apps/web/src/
     app/
       (auth)/                 # login, signup, check-email, privacy, terms, landing
       (platform)/             # feed/, feed/[postId]/, profile/[username]/
       (waitlisted)/           # waitlisted/
       auth/callback/          # OAuth/email verification callback route

     components/
       ui/                     # Button, Input, Avatar, Card, Badge, Toast
       layout/                 # Navbar, LeftRail, LegalPageShell, LeafBackground, ThemeToggle
       feed/                   # FeedCard (+ FeedCardSkeleton), ComposerModal
       auth/                   # AuthModal
       notifications/          # NotificationPanel
       dev/                    # DevNav (seeded-mode only)

     lib/
       supabase/                # client.ts, server.ts
       data/                    # getDataClient(), SeedDataClient, SupabaseDataClient, types.ts
       mock-data.ts             # seed-mode fixture data

     actions/
       auth.actions.ts          # signup, login, email verification

     constants/
       legal.ts                 # legal page placeholder constants

     styles/                    # globals.css (imports design system)
   ```

   Add a line directly below it: "`explore/`, `messages/`, `notifications/` (route), `settings/`, `project/[slug]/`, `community/[slug]/`, `article/[slug]/`, `hooks/`, `lib/permissions/`, `lib/redis/`, and additional `*.actions.ts` files are planned but not yet created — see `ROADMAP.md`."

   Commit: `docs: rewrite codebase structure to match actual repo layout`

4. **Rewrite §5 (Database Schema) in ARCHITECTURE.md to the real schema**

   Keep §5.1 (Naming Conventions) as-is — these are standards, not a description of built tables, and the two real tables already follow them.

   Replace §5.2 with only the two tables that exist, matching `packages/db/src/schema.ts` exactly (including the `account_status` enum and the deprecation note, which is already accurate — keep it):

   ```sql
   -- users
   id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
   auth_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
   username        TEXT UNIQUE NOT NULL
   display_name    TEXT NOT NULL
   bio             TEXT
   avatar_url      TEXT
   cover_url       TEXT
   website_url     TEXT
   location        TEXT
   is_verified     BOOLEAN NOT NULL DEFAULT false
   is_suspended    BOOLEAN NOT NULL DEFAULT false   -- deprecated, see note below
   account_status  account_status NOT NULL DEFAULT 'waitlisted'
   follower_count  INTEGER NOT NULL DEFAULT 0
   following_count INTEGER NOT NULL DEFAULT 0
   post_count      INTEGER NOT NULL DEFAULT 0
   created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
   updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
   deleted_at      TIMESTAMPTZ

   -- user_profiles
   id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
   user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
   display_name TEXT NOT NULL
   bio          TEXT
   avatar_url   TEXT
   headline     TEXT
   created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()

   CREATE TYPE account_status AS ENUM ('waitlisted', 'active', 'suspended');
   ```

   > ⚠ `is_suspended` is deprecated in favour of `account_status = 'suspended'`. Do not introduce new reads of `is_suspended` in new code.
   >
   > ⚠ `display_name`/`bio`/`avatar_url` exist on both `users` and `user_profiles`. As of handoff 036, `user_profiles` is the read source of truth for these three fields; the columns on `users` are kept for the `NOT NULL` signup insert path but should not be read from directly in new code.

   Replace §5.3 with a short current-state paragraph (the full five-table vision moved to ROADMAP.md in step 2):

   ```markdown
   ### 5.3 User system — current state

   Only `users` and `user_profiles` exist today (schema above). The originally-planned five-table model (`auth_providers`, `user_metadata`, `user_roles` in addition to these two) has not been built — see `ROADMAP.md` for that design. There is currently no role column, no role table, and no multi-role support of any kind. Every account is functionally the same "role" today; `account_status` (`waitlisted`/`active`/`suspended`) is the only account-state distinction that exists.
   ```

   Keep §5.4 Waitlist system as-is — this is accurate and describes the real, implemented `account_status` gating behavior in `middleware.ts`.

   Commit: `docs: rewrite database schema section to match actual schema.ts`

5. **Rewrite §8 (Permission System) in ARCHITECTURE.md to reflect reality**

   Replace §8.1 with:

   ```markdown
   ### 8.1 Current state

   No permission system exists yet. There is no `checkPermission()`, no `requireSession()` helper, no `usePermissions()` hook, and no role model beyond `account_status` (see §5.3). The only access control implemented today is `middleware.ts`'s `account_status` allow-list, which gates entire route groups (waitlisted vs. active vs. suspended) — it has no concept of per-action or per-resource permissions.

   RLS is enabled on `users` and `user_profiles` (handoff 022) and is the only real enforcement layer that exists. It only constrains access made through the Supabase JS client. `packages/db` (Drizzle) connects via `DATABASE_URL`, authenticating as the Supabase `postgres` role, which bypasses RLS entirely — meaning **all** current reads/writes through Drizzle (which is most of the app) have zero permission enforcement beyond application code correctness. There is no `checkPermission()` fallback layer for this gap today, unlike what earlier versions of this document implied.

   The full three-layer permission architecture (RLS + server check + UI gate), the permission matrix, and `checkPermission()`/`usePermissions()` are planned — see `ROADMAP.md`.
   ```

   Commit: `docs: rewrite permission system section to reflect no enforcement layer exists yet`

6. **Reconcile `docs/USER_SYSTEM.md` against the same split**

   Read `docs/USER_SYSTEM.md` in full. It's referenced from ARCHITECTURE.md §5.3 as the detailed source for the five-table model — since that whole model is moving to `ROADMAP.md`, add a header note to `USER_SYSTEM.md` itself:

   ```markdown
   > **Status: design document, not yet implemented.** This describes the planned five-table user system. Only `users` and `user_profiles` exist in the current schema — see `ARCHITECTURE.md` §5 for what's actually built. This document is referenced from `ROADMAP.md`.
   ```

   Update the cross-reference in `ROADMAP.md`'s moved §5.3 content to point to `USER_SYSTEM.md` for full detail (same relationship it had in ARCHITECTURE.md before).

   Commit: `docs: mark USER_SYSTEM.md as an unimplemented design doc, link from ROADMAP.md`

7. **Fix §3.1 and §15.4's inaccurate CI/process claims**

   In §3.1's stack table, change the CI/CD row from asserting GitHub Actions exists to noting it doesn't yet:

   ```markdown
   | **CI/CD** | None currently configured — no `.github/workflows`. Planned: GitHub Actions (lint, type-check, test, preview deploy on every PR). See `ROADMAP.md`. |
   ```

   In §15.4, remove or correct the line "Every PR requires: passing CI (lint + type-check + tests), at least one approval, and no merge conflicts" — this doesn't reflect the actual workflow (Claude Code pushes and stops; Alex reviews the Vercel preview and merges manually; no CI runs). Replace with a line describing the actual process, consistent with root `CLAUDE.md`'s git workflow section (as updated by handoff 039).

   Commit: `docs: correct CI/CD claims to match actual repo state`

8. **Update the closing line**

   Change the document's final line from "This document is the single source of architectural truth for Project Grassroots" to: "This document describes Grassroots' architecture as currently implemented. For planned systems and future direction, see `ROADMAP.md`. All architectural deviations require a written amendment approved by the project owner."

   Commit: `docs: update ARCHITECTURE.md closing statement to reflect the current/roadmap split`

---

## Verification

- [ ] `docs/ROADMAP.md` exists and contains every section listed in step 2.
- [ ] `docs/ARCHITECTURE.md` no longer references `checkPermission`, `usePermissions`, `requireSession`, `auth_providers`, `user_roles`, `user_metadata`, Redis, or Supabase Realtime as if they currently exist.
- [ ] `docs/ARCHITECTURE.md` §4 accurately lists only real directories — spot-check against `apps/web/src` and `packages/` at implementation time, since routes may have changed since this handoff was written.
- [ ] `docs/ARCHITECTURE.md` §5.2 matches `packages/db/src/schema.ts` exactly — no table listed that isn't in that file.
- [ ] `docs/USER_SYSTEM.md` has the new status header.
- [ ] Both documents cross-reference each other (ARCHITECTURE.md points to ROADMAP.md where content moved; ROADMAP.md's header points back).
- [ ] Grep both files for "single source of... truth" — confirm the closing claim is corrected.
