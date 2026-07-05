# Grassroots — Principal Architecture Document

> **The AI Builders' Social Platform**
> Version 1.0 · Confidential · June 2026
> Deployment: Vercel · Database: Supabase · Runtime: Next.js 15

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Technology Stack](#3-technology-stack)
4. [Codebase Structure](#4-codebase-structure)
5. [Database Schema](#5-database-schema)
6. [Performance Architecture](#6-performance-architecture)
7. [Real-Time Architecture](#7-real-time-architecture)
8. [Permission System](#8-permission-system)
9. [API Design](#9-api-design)
10. [Rate Limiting](#10-rate-limiting)
11. [Background Jobs & Async Processing](#11-background-jobs--async-processing)
12. [Animation & UI Standards](#12-animation--ui-standards)
13. [Observability & Monitoring](#13-observability--monitoring)
14. [Security Standards](#14-security-standards)
15. [Coding Standards & Rules](#15-coding-standards--rules)
16. [Scalability Roadmap](#16-scalability-roadmap)
17. [Environment Configuration](#17-environment-configuration)
18. [Open Questions & Future Decisions](#18-open-questions--future-decisions)

---

## 1. Executive Summary

Project Grassroots is a professional social platform purpose-built for the AI builder community. It serves developers, solo entrepreneurs, researchers, and curious non-technical creators who are experimenting with, shipping, or thinking deeply about AI. Unlike general-purpose platforms, Grassroots is organized around projects and ideas rather than job titles and endorsements.

This document defines the authoritative Principal Architecture for the entire platform. It establishes the technology stack, database schema conventions, API design rules, caching strategy, real-time infrastructure, permission model, and code organization standards. Every engineering decision made on this project must be traceable back to a principle stated here.

The platform must be ready to absorb rapid user growth, sustain high write throughput from community activity, and remain fully operable by a small team. All architectural choices prioritize observability, developer velocity, and safe incremental scaling over premature optimization.

---

## 2. Platform Overview

### 2.1 Mission Statement

Give every AI builder — from the first-time tinkerer to the full-time founder — a dedicated home to share what they are making, connect with others doing the same, and get their work seen by the people who matter most.

### 2.2 Core Product Pillars

Full pillar table moved to `ROADMAP.md`. Of the seven planned pillars, only User Profiles and Posts have any implementation today, and both are partial — see §4–§5 for current state.

### 2.3 User Roles

| Role | Capabilities | Constraints |
|---|---|---|
| **Guest** | Read-only access to public profiles, projects, posts, and articles. | No write actions, no messaging. |
| **Member** | Full social access: create posts, articles, projects, join communities, send messages. | Standard rate limits apply. |
| **Pro Member** | All Member access plus extended storage, analytics dashboards, and priority support. | Relaxed rate limits. |
| **Community Mod** | Scope-limited moderation within a specific community they moderate. | Cannot act outside their community. |
| **Platform Mod** | Site-wide content moderation: remove posts, suspend accounts, issue warnings. | Cannot modify role assignments. |
| **Administrator** | Full platform control: role management, feature flags, billing, infrastructure toggles. | All permissions. |

---

## 3. Technology Stack

### 3.1 Stack Summary

| Layer | Technology & Notes |
|---|---|
| **Framework** | Next.js 15 (App Router, React Server Components, Server Actions) |
| **Language** | TypeScript 5.x — strict mode enabled everywhere, zero `any` escapes |
| **Styling** | Native CSS + CSS Modules (`*.module.css`), with design-system tokens as CSS custom properties — no utility framework (Tailwind removed) |
| **Animation** | Framer Motion 11 for page transitions, list animations, and micro-interactions |
| **UI Components** | Radix UI primitives + Grassroots component library (no third-party full UI kits) |
| **Database** | Supabase (PostgreSQL 16, Row Level Security, Realtime, Storage, Edge Functions) |
| **ORM / Query** | Drizzle ORM — type-safe, zero-overhead, schema-as-code |
| **Auth** | Supabase Auth with OAuth (GitHub, Google) and magic link email |
| **Cache Layer** | Upstash Redis (serverless Redis via REST API, zero cold-start penalty on Vercel) |
| **Search** | Supabase `pg_trgm` + `pgvector` for semantic search (Phase 1); Algolia or Typesense in Phase 2 |
| **File Storage** | Supabase Storage (avatars, cover images, article assets) |
| **Email** | Resend + React Email for transactional and digest emails |
| **Deployment** | Vercel (edge-optimized, preview deployments per PR, analytics built-in) |
| **Observability** | Vercel Analytics + Speed Insights, Sentry for error tracking, Axiom for structured logs |
| **Feature Flags** | Vercel Edge Config for zero-latency flag reads at the edge |
| **Rate Limiting** | Upstash Ratelimit library (sliding window, per-user and per-IP) |
| **Background Jobs** | Vercel Cron + Supabase Edge Functions for async processing |
| **Package Manager** | pnpm workspaces (monorepo) |
| **Testing** | Vitest (unit), Playwright (e2e), MSW (API mocking) |
| **CI/CD** | None currently configured — no `.github/workflows`. Planned: GitHub Actions (lint, type-check, test, preview deploy on every PR). See `ROADMAP.md`. |

### 3.2 Why These Choices

#### Next.js 15 App Router

React Server Components allow heavy data fetching to happen on the server without JavaScript shipped to the client. Layouts are persistent, reducing full-page navigations to zero. Streaming with Suspense boundaries pairs directly with skeleton loading. Server Actions give type-safe form mutations without a separate API layer for most interactions.

#### Supabase

Managed PostgreSQL with built-in auth, realtime subscriptions, and storage in one service eliminates coordination between multiple vendors. Row Level Security is enforced at the database level, meaning permission bugs cannot leak data even if application code is wrong. The Supabase Realtime server uses logical replication so we subscribe to table change events directly without polling.

#### Drizzle ORM

Drizzle generates SQL identical to what you would write by hand, has zero abstraction overhead, and its schema definition doubles as our TypeScript type source. Unlike Prisma, it does not require a daemon process, making it ideal for serverless deployments.

#### Upstash Redis

Standard Redis requires a persistent TCP connection, incompatible with serverless functions. Upstash Redis communicates over HTTPS, meaning each Vercel function invocation can hit the cache without connection pool overhead. We use it for session caching, feed caching, rate limiting, and pub/sub signaling.

---

## 4. Codebase Structure

### 4.1 Monorepo Layout

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

`apps/admin`, `packages/utils`, `packages/config`, and `supabase/functions` are planned but not yet created — see `ROADMAP.md`.

### 4.2 Web App Directory Structure

```
apps/web/src/
  app/
    (auth)/                 # login, signup, check-email, privacy, terms, landing
    (platform)/             # feed/, feed/[postId]/, profile/[username]/
    (waitlisted)/           # waitlisted/
    auth/callback/           # OAuth/email verification callback route

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

Verify current state against the repo at implementation time — new routes/components may have landed since this document was last updated. Planned but not yet created: `explore/`, `messages/`, `notifications/` (route), `settings/`, `project/[slug]/`, `community/[slug]/`, `article/[slug]/`, `hooks/`, `lib/permissions/`, `lib/redis/`, and additional `*.actions.ts` files — see `ROADMAP.md`.

---

## 5. Database Schema

### 5.1 Naming Conventions

| Object type | Convention |
|---|---|
| **Tables** | Plural snake_case nouns: `users`, `posts`, `projects`, `communities` |
| **Columns** | Singular snake_case: `user_id`, `created_at`, `is_published` |
| **Primary Keys** | Always `id UUID DEFAULT gen_random_uuid()` |
| **Foreign Keys** | Pattern: `{referenced_table_singular}_id` — e.g. `user_id`, `project_id` |
| **Timestamps** | `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ` on all tables |
| **Soft Deletes** | `deleted_at TIMESTAMPTZ DEFAULT NULL` (never hard-delete user content) |
| **Boolean Flags** | Prefix `is_` or `has_`: `is_published`, `is_verified`, `has_notifications` |
| **Enum Types** | Singular snake_case: `post_type`, `member_role`, `notification_event` |
| **Indexes** | `idx_{table}_{column(s)}`: `idx_posts_user_id`, `idx_followers_follower_id` |
| **Junction Tables** | Alphabetical order of both entities: `community_members`, `post_reactions` |

### 5.2 Core Tables

Only two tables exist today, matching `packages/db/src/schema.ts` exactly:

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

> ⚠ `is_suspended` is deprecated in favour of `account_status = 'suspended'` and will be removed in a future migration. Do not introduce new reads of `is_suspended` in new code — read `account_status` instead.

> ⚠ `display_name`, `bio`, and `avatar_url` exist on both `users` and `user_profiles`. As of handoff 036, `user_profiles` is the read source of truth for these three fields; the columns on `users` are kept for the `NOT NULL` signup insert path but should not be read from directly in new code.

The full planned schema (`projects`, `posts`, `articles`, `communities`, social-graph tables, and their enums) does not exist yet — see `ROADMAP.md`.

### 5.3 User system — current state

Only `users` and `user_profiles` exist today (schema above). The originally-planned five-table model (`auth_providers`, `user_metadata`, `user_roles` in addition to these two) has not been built — see `ROADMAP.md` for that design, and `docs/USER_SYSTEM.md` (marked as a design document, not yet implemented). There is currently no role column, no role table, and no multi-role support of any kind. Every account is functionally the same "role" today; `account_status` (`waitlisted`/`active`/`suspended`) is the only account-state distinction that exists.

---

### 5.4 Waitlist system

During the early access period, all newly created accounts default to `account_status = 'waitlisted'`. Waitlisted users are fully authenticated Supabase users with a session — they simply cannot access the `(platform)` route group.

**Status transitions:**

| Transition | Trigger |
|---|---|
| `waitlisted` → `active` | Manual admin action — `UPDATE users SET account_status = 'active' WHERE id = ...` |
| `active` → `suspended` | Moderation action (Platform Mod or Administrator) |
| `suspended` → `active` | Moderation action (lift suspension) |

There is no self-service path from `waitlisted` to `active`. Activation is intentionally manual during the launch period.

**Route access by status:**

| Route group | Session required | account_status required |
|---|---|---|
| `(auth)/` — `/`, `/signup`, `/login` | No | Any (active users redirected to `/feed`) |
| `(waitlisted)/` — `/waitlisted` | Yes | `waitlisted` (active users redirected to `/feed`) |
| `(platform)/` — `/feed`, etc. | Yes | `active` |

---

## 6. Performance Architecture

### 6.1 Current state

No caching layer exists — no Redis, no `revalidateTag()` usage, no feed fan-out logic. `getFeedPosts()` returns an empty array today (no posts schema — see §5). The planned four-layer cache hierarchy, Redis key schema, and hybrid fan-out feed model are documented in `ROADMAP.md`.

### 6.3 Database performance rules

- Every foreign key column must have an index.
- Every column used in a `WHERE` clause that is not a primary key must have an index.
- Count columns (`follower_count`, `post_count`, `reaction_count`) are denormalized and updated via database triggers to avoid expensive `COUNT(*)` queries at read time.
- Soft-deleted rows must be excluded via partial indexes where queries filter by `deleted_at IS NULL`.
- Use `EXPLAIN ANALYZE` on every query touching a table with more than 10,000 rows before merging.
- Connection pooling is mandatory. All server-side code uses the Supabase client in pooler mode (port 6543, transaction pooling).
- Server-side Supabase access uses two distinct clients for two distinct purposes. The anon key + user session cookie (`@supabase/ssr`'s `createServerClient`, used in `middleware.ts` and `lib/supabase/server.ts`) is used wherever a request needs to act *as the current user* under RLS — this is the standard SSR auth pattern, not a bypass. The service role key is reserved for operations that must run as an administrator, bypassing RLS intentionally (none yet in this codebase). Neither key is meant to run arbitrary unscoped queries — see §8.1 for the current gap on the Drizzle path.

### 6.4 Lazy loading & skeleton strategy

Every data-driven component must have a corresponding Skeleton component. Skeletons are layout-accurate placeholders that match the dimensions and shape of the real content, never spinners. This is implemented today: route segments use `loading.tsx` files to stream Suspense boundaries (e.g. `feed/loading.tsx`, `feed/[postId]/loading.tsx`), and `FeedCardSkeleton` exists alongside `FeedCard`.

Infinite scroll (`IntersectionObserver`), `next/dynamic`-loaded heavy components, and a `components/skeletons/` convention for additional skeleton components are planned — see `ROADMAP.md`.

---

## 7. Real-Time Architecture

### 7.1 Current state

No Supabase Realtime subscriptions exist anywhere in the codebase — no notification/message/presence channels, no optimistic-update write paths beyond what's described in §9. The planned Realtime feature table and optimistic-UI patterns are documented in `ROADMAP.md`.

---

## 8. Permission System

### 8.1 Current state

No permission system exists yet. There is no `checkPermission()`, no `requireSession()` helper, no `usePermissions()` hook, and no role model beyond `account_status` (see §5.3). The only access control implemented today is `middleware.ts`'s `account_status` allow-list, which gates entire route groups (waitlisted vs. active vs. suspended) — it has no concept of per-action or per-resource permissions.

RLS is enabled on `users` and `user_profiles` (handoff 022) and is the only real enforcement layer that exists. It only constrains access made through the Supabase JS client. `packages/db` (Drizzle) connects via `DATABASE_URL`, authenticating as the Supabase `postgres` role, which bypasses RLS entirely — meaning **all** current reads/writes through Drizzle (which is most of the app) have zero permission enforcement beyond application code correctness. There is no `checkPermission()` fallback layer for this gap today, unlike what earlier versions of this document implied.

The full three-layer permission architecture (RLS + server check + UI gate), the permission matrix, and `checkPermission()`/`usePermissions()` are planned — see `ROADMAP.md`.

### 8.4 RLS policy conventions

- Every table has RLS enabled via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- The default policy is `DENY ALL`. Policies explicitly grant access; they never implicitly restrict.
- Policies are named: `{table}_{operation}_{description}` — e.g. `posts_select_published`, `posts_insert_authenticated`.
- The service role key bypasses RLS. It is used only in Supabase Edge Functions and server-side jobs. Never in client-side code.

---

## 9. API Design

### 9.1 Server Actions (primary write path)

Next.js Server Actions are the primary mechanism for all write operations originating from the client. They run on the server, have direct database access, and are type-safe end-to-end. They replace REST endpoints for forms and mutations.

| Concern | Rule |
|---|---|
| **File location** | `actions/{entity}.actions.ts` — one file per domain entity |
| **Return type** | All actions return: `{ data?: T; error?: string; fieldErrors?: Record<string, string[]> }` |
| **Input validation** | All inputs are validated with Zod schemas before touching the database |
| **Auth check** | First line of every action: `const session = await requireSession()` |
| **Permission check** | Second step: `await checkPermission(session.user, 'action:name', context)` |
| **Error handling** | Errors are caught, logged to Axiom, and returned as structured error objects |
| **Revalidation** | Actions call `revalidateTag()` to invalidate the Next.js data cache for affected entities |

### 9.2 API Routes (webhooks & external only)

API Routes (`app/api/`) are used only for webhook receivers, Open Graph image generation, and third-party service URL callbacks. They are not used for client-originated mutations — those go through Server Actions.

### 9.3 Data fetching in Server Components

Data fetching goes through `getDataClient()` (see §5 and `apps/web/src/lib/data/`) rather than a bespoke Redis-caching pattern per page — see `ROADMAP.md` for the planned caching layer.

---

## 10. Rate Limiting

Not implemented — no Upstash Ratelimit, no per-action limits. See `ROADMAP.md` for the planned design.

---

## 11. Background Jobs & Async Processing

Not implemented — no Vercel Cron config, no Supabase Edge Functions. See `ROADMAP.md` for the planned jobs.

---

## 12. Animation & UI Standards

### 12.1 Animation philosophy

Animations serve communication, not decoration. Every animated transition must have a functional reason: confirming an action, indicating state change, or orienting the user after navigation. Gratuitous animation is a bug.

### 12.2 Framer Motion standards

> These comply with the design system's motion rule (`packages/design-system/motion.css` + its guide), which is binding and wins on any conflict: **restrained, functional motion only — no spring or bounce on interactive controls (buttons, cards, hover, press states).** Bottom sheet entrance (`.animate-sheet-up`) is the one permitted use of `--ease-spring`, where slight overshoot on arrival is physically grounded. Durations/easing come from the motion tokens (`--duration-*`, `--ease-*`); press and state changes use **opacity/color**, not transforms.

| Element | Spec |
|---|---|
| **Page transitions** | Fade + slight Y translate (12px up, 200ms ease-out) on route change. Applied at the layout level. |
| **Feed card entry** | Stagger children using `variants` with `staggerChildren: 0.05`. Cards fade in with 8px upward translate. |
| **Modal open/close** | Scale from `0.95` to `1` + fade, 150ms ease-out. Backdrop fades separately. |
| **Skeleton shimmer** | CSS animation only (no Framer Motion): `linear-gradient` shimmer at `1.5s infinite`. |
| **Button press** | Opacity drop to `~0.76` on press (CSS `:active`, or `whileTap={{ opacity: 0.76 }}`). **No scale.** |
| **Notification bell** | Unread dot fades in (120ms, `--duration-fast`) when a notification arrives. **No bounce.** |
| **Like / react button** | On like, the heart turns **sage** (`--color-accent`, 120ms color transition) and the count increments. **No scale, no spring, never fills** (Tabler outline only). |
| **Infinite scroll** | New items enter with `opacity 0` to `1`, no position shift (prevents layout jump). |

### 12.3 Design token rules

All colors, spacing, typography, and radius values must reference CSS custom properties defined by the Grassroots design system (`packages/design-system/tokens/`), consumed via `var(--…)` in CSS Modules and the global design-system classes. Hard-coded hex values in component files are forbidden.

### 12.4 Skeleton component rules

- Every data-driven leaf component must export a companion Skeleton: `PostCard` + `PostCardSkeleton`, `ProfileHeader` + `ProfileHeaderSkeleton`.
- Skeleton dimensions match the real component dimensions precisely. No guessing.
- Skeletons use `bg-muted` with the shimmer animation class. They never use opacity tricks.
- Suspense boundaries wrap list components. The fallback renders N skeleton items (default 5) to prevent layout shift.

---

## 13. Observability & Monitoring

### 13.1 Current state

Sentry and Axiom are **not** wired — no `instrumentation.ts`, no Sentry/Axiom packages in `package.json`. Vercel Speed Insights and Vercel Analytics **are** actually wired (`<SpeedInsights />`/`<Analytics />` in `apps/web/src/app/layout.tsx`). See `ROADMAP.md` for the planned Sentry/Axiom setup.

### 13.2 Performance monitoring

- Vercel Speed Insights tracks Core Web Vitals per route.
- Performance budget: LCP < 2.5s, CLS < 0.1, INP < 200ms on all key routes.
- Any PR that degrades a Core Web Vital by more than 10% requires a performance review before merge.

---

## 14. Security Standards

### 14.1 Authentication

- Supabase Auth handles all session management. JWTs are stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies via the Supabase SSR client package.
- Tokens are never exposed to JavaScript. The auth cookie is set server-side.
- Session refresh is handled automatically by the Supabase middleware in `middleware.ts`.
- OAuth state parameters are verified to prevent CSRF on callback.

### 14.2 Input sanitization

- All user-supplied text is validated with Zod on both client (for UX) and server (for security).
- HTML content from the rich text editor is sanitized with DOMPurify before storage.
- SQL injection is impossible via Drizzle (parameterized queries only). Raw SQL is prohibited.
- File uploads are validated for MIME type and size server-side before reaching Supabase Storage.

### 14.3 Secrets management

- All secrets live in Vercel environment variables. No secrets in `.env` files committed to the repository.
- The Supabase service role key is accessible only in server-side code (no `NEXT_PUBLIC_` exposure).
- The Supabase anon key is safe to expose client-side — it is restricted by RLS policies.
- Secret rotation must be reflected in Vercel within 24 hours of any suspected compromise.

---

## 15. Coding Standards & Rules

### 15.1 TypeScript rules

- `strict: true` in `tsconfig.json`. No exceptions.
- `no-explicit-any` is an error, not a warning. Use `unknown` and narrow with type guards.
- All exported functions must have explicit return type annotations.
- Database row types are always derived from the Drizzle schema using `InferSelectModel`. Never hand-written.
- Zod schemas live alongside the actions that use them and are exported for client-side reuse.

### 15.2 Component rules

- Server Components are the default. Add `"use client"` only when browser APIs or React hooks are required.
- Client Components must not import server-only modules (database, secrets). Enforced with the `server-only` package.
- Props interfaces are named `{ComponentName}Props` and placed immediately above the component.
- Components larger than 200 lines must be decomposed.
- No Tailwind. Component-scoped styles live in co-located CSS Modules referencing design-system tokens; global design-system classes (`.btn`, `.feed-card`, …) for shared components; inline `style` only for genuinely dynamic values.

### 15.3 Naming conventions

| Element | Convention |
|---|---|
| **Components** | PascalCase: `PostCard`, `ProfileHeader`, `CommunityFeed` |
| **Hooks** | camelCase with `use` prefix: `useFeed`, `usePermissions`, `useInfiniteScroll` |
| **Server Actions** | camelCase verb+noun: `createPost`, `deleteComment`, `followUser` |
| **Event handlers** | camelCase with `handle` prefix: `handleSubmit`, `handleFollowClick` |
| **Constants** | `SCREAMING_SNAKE_CASE`: `MAX_POST_LENGTH`, `DEFAULT_PAGE_SIZE` |
| **Type aliases** | PascalCase: `PostWithAuthor`, `ProjectWithStats` |
| **Enum values** | PascalCase (TS enum): `UserRole.Member`, `PostType.Update` |
| **Files** | kebab-case for non-component files: `use-feed.ts`, `post.actions.ts` |
| **Route segments** | kebab-case directory names: `/project/[slug]/settings` |

### 15.4 Git workflow

> ⚠ **Staging is not yet operational (as of 2026-07-04).** The project is provisioned and schema is applied, but Vercel↔Supabase environment variable wiring isn't working end-to-end — see handoff 039's status update for the diagnostic history. Until this callout is removed, treat `main` as receiving merges directly from `development` (temporary reversion — see below), not from `staging`.

- Branch model: `main` (production, live) ← `staging` (closed testing, live, isolated Supabase project) ← `development` (integration, seeded) ← `feature/<short-description>` (seeded). Each branch gets its own Vercel deployment/environment.
- **Interim, while staging is paused (see callout above):** `development` merges directly into `main`, same as before the staging tier was introduced. Automated or bot-authored PRs (e.g. Vercel Agent integrations) that default to targeting `main` should be retargeted to `development` first, so at least one review step happens before `main` — not to `staging`, which isn't functional yet.
- **Once staging is operational again:** `development` merges up into `staging` for a real-backend check before anything reaches production; `staging` merges up into `main` only after that check passes. Bot-authored PRs should retarget to `staging` at that point, not `development`.
- Branch naming: `feature/{ticket-id}-short-description`, `fix/{ticket-id}-description`, `chore/description`.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`.
- No CI currently runs on this repo (no `.github/workflows` — see §3.1). There is no automated lint/type-check/test gate and no required-approval rule today.
- Actual process: Claude Code (or another contributor) pushes a branch and stops — it does not merge to `main`, and does not open a PR. Alex reviews the branch's Vercel preview deployment and merges manually when ready. Direct pushes to `main` are prohibited regardless.
- Preview deployments are automatically created for every pushed branch via Vercel, independent of whether a PR exists.

---

## 16. Scalability Roadmap

Moved to `ROADMAP.md` — this section described future growth phases, not current state.

---

## 17. Environment Configuration

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-side only — NEVER expose to client
DATABASE_URL=                     # Transaction pooler string in any deployed environment (Vercel) — direct connection is IPv6-only and breaks on Vercel's functions. Direct connection is fine for local Drizzle Kit CLI use only.

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend (Email)
RESEND_API_KEY=
EMAIL_FROM=noreply@grassroots.ai

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=               # CI only

# Axiom (Logging)
AXIOM_TOKEN=
AXIOM_DATASET=

# Environment
NEXT_PUBLIC_APP_URL=             # https://grassroots.ai in prod — see open item on domain naming
NEXT_PUBLIC_APP_ENV=             # development | preview | staging | production

# Feature Flags (Vercel Edge Config)
EDGE_CONFIG=                     # Vercel-injected automatically
```

#### Supabase production configuration

Before going live, verify the following in the Supabase dashboard (Authentication → Settings):

- **Email confirmations:** must be **enabled**. Without this, users get a session immediately on signup and bypass the verification step entirely.
- **Site URL:** set to the production domain (e.g. `https://grassroots.community`).
- **Redirect URLs:** must include `https://grassroots.community/auth/callback` (and the Vercel preview URL pattern if needed for staging: `https://*.vercel.app/auth/callback`).
- **Email templates:** customise the "Confirm signup" email in the Supabase dashboard. Minimum: update the subject line and button text to match the platform voice.

In local development with Supabase CLI (`supabase start`), email confirmation is disabled by default, so `signupAction` will redirect to `/waitlisted` directly. This is the expected local dev behaviour.

#### Staging environment configuration

Not currently operational — see `CLAUDE.md` and handoff 039.

`staging` requires its own complete Supabase credential set — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` — scoped to the staging Vercel environment/branch and distinct from production's. Staging points at a separate, isolated Supabase project (same schema, applied via the same Drizzle migrations, but no shared data with production). `NEXT_PUBLIC_APP_ENV=staging` and `USE_SEED_DATA=false`. **`DATABASE_URL` for the staging Vercel environment must be the transaction pooler string, same as production** — the direct connection is IPv6-only and breaks on Vercel's functions (see the `.env.example` guidance above; this is exactly the failure hit standing up staging on 2026-07-04).

---

## 18. Open Questions & Future Decisions

Moved to `ROADMAP.md` — this section described undecided future product/infrastructure questions, not current state.

---

*This document describes Grassroots' architecture as currently implemented. For planned systems and future direction, see `ROADMAP.md`. All architectural deviations require a written amendment approved by the project owner.*
