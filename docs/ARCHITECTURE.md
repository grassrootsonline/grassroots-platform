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

| Pillar | Description |
|---|---|
| **User Profiles** | Persistent identity with bio, avatar, skill tags, social links, follower graph, and an activity feed of everything the user has published or built. |
| **Projects** | First-class entity that represents any AI-powered product, experiment, or idea. Has its own public page, followers, update timeline, and collaborators. |
| **Posts** | Short-form status updates, optionally attached to a project. Supports rich text, images, code snippets, and external link previews. |
| **Articles** | Long-form markdown content authored inside the platform. Can be published under a personal profile or a project page. |
| **Communities** | Member-owned spaces with a self-contained feed, pinned projects, member roles, and moderation tools. |
| **Messages** | Private 1:1 and group direct messaging with real-time delivery and read receipts. |
| **Notifications** | Unified in-app and push notification system covering follows, reactions, mentions, comments, and community activity. |

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
| **CI/CD** | GitHub Actions (lint, type-check, test, preview deploy on every PR) |

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
grassroots/
  apps/
    web/                  # Next.js 15 main application
    admin/                # Internal admin dashboard (separate Next.js app)
  packages/
    db/                   # Drizzle schema, migrations, seed scripts
    types/                # Shared TypeScript types and Zod schemas
    ui/                   # Shared component library
    utils/                # Shared utility functions (date, string, etc.)
    config/               # Shared ESLint, Prettier, PostCSS configs
  supabase/
    functions/            # Supabase Edge Functions
    migrations/           # SQL migration files (auto-generated by Drizzle)
    seed.sql
  .github/
    workflows/            # CI/CD pipeline definitions
  turbo.json              # Turborepo pipeline config
  pnpm-workspace.yaml
```

### 4.2 Web App Directory Structure

```
apps/web/src/
  app/                      # Next.js App Router root
    (auth)/                 # Route group: unauthenticated pages
      login/
      register/
      forgot-password/
    (platform)/             # Route group: authenticated app shell
      layout.tsx            # Persistent app shell with nav
      feed/
      explore/
      notifications/
      messages/
      profile/[username]/
      project/[slug]/
      community/[slug]/
      article/[slug]/
      settings/
    (public)/               # Route group: SEO-optimized public pages
      p/[username]/
      proj/[slug]/
    api/
      webhooks/
      og/                   # Open Graph image generation

  components/
    ui/                     # Base components (Button, Input, Avatar...)
    layout/                 # Nav, Sidebar, AppShell
    feed/                   # FeedCard, FeedSkeleton, InfiniteScroll
    profile/                # ProfileHeader, ProfileStats, FollowButton
    project/                # ProjectCard, ProjectPage, UpdateTimeline
    community/              # CommunityCard, MemberList, CommunityFeed
    editor/                 # Rich text editor (Tiptap-based)
    notifications/          # NotificationPanel, NotificationItem
    messages/               # MessageThread, MessageComposer
    modals/                 # All modal dialogs
    skeletons/              # Skeleton loading variants

  lib/
    supabase/
      client.ts             # Browser client (singleton)
      server.ts             # Server client (per-request)
      middleware.ts         # Auth middleware client
    redis/                  # Upstash client + cache helpers
    auth/                   # Auth helpers, session utils
    permissions/            # RBAC engine

  actions/                  # Next.js Server Actions
    post.actions.ts
    project.actions.ts
    community.actions.ts
    profile.actions.ts
    message.actions.ts

  hooks/
    use-feed.ts
    use-realtime.ts
    use-permissions.ts
    use-infinite-scroll.ts

  constants/                # Platform-wide constants
  types/                    # App-local TypeScript types
  styles/                   # Global CSS, design tokens
```

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

#### `users`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
username        TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_]{3,30}$')
display_name    TEXT NOT NULL
bio             TEXT CHECK (char_length(bio) <= 500)
avatar_url      TEXT
cover_url       TEXT
website_url     TEXT
location        TEXT
is_verified     BOOLEAN NOT NULL DEFAULT false
is_suspended    BOOLEAN NOT NULL DEFAULT false
account_status  account_status NOT NULL DEFAULT 'waitlisted'
role            user_role NOT NULL DEFAULT 'member'
follower_count  INTEGER NOT NULL DEFAULT 0
following_count INTEGER NOT NULL DEFAULT 0
post_count      INTEGER NOT NULL DEFAULT 0
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ
```

> ⚠ `is_suspended` is deprecated in favour of `account_status = 'suspended'` and will be removed in a future migration. Do not introduce new reads of `is_suspended` in new code — read `account_status` instead.

#### `projects`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
slug            TEXT UNIQUE NOT NULL
name            TEXT NOT NULL
tagline         TEXT CHECK (char_length(tagline) <= 160)
description     TEXT
cover_url       TEXT
logo_url        TEXT
website_url     TEXT
repo_url        TEXT
tech_tags       TEXT[] DEFAULT '{}'
ai_tags         TEXT[] DEFAULT '{}'
status          project_status NOT NULL DEFAULT 'active'
is_published    BOOLEAN NOT NULL DEFAULT false
is_open_source  BOOLEAN NOT NULL DEFAULT false
follower_count  INTEGER NOT NULL DEFAULT 0
view_count      INTEGER NOT NULL DEFAULT 0
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ
```

#### `posts`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
project_id      UUID REFERENCES projects(id) ON DELETE SET NULL
community_id    UUID REFERENCES communities(id) ON DELETE CASCADE
content         TEXT NOT NULL CHECK (char_length(content) <= 3000)
content_html    TEXT
post_type       post_type NOT NULL DEFAULT 'standard'
media_urls      TEXT[] DEFAULT '{}'
link_preview    JSONB
is_published    BOOLEAN NOT NULL DEFAULT true
is_pinned       BOOLEAN NOT NULL DEFAULT false
reaction_count  INTEGER NOT NULL DEFAULT 0
comment_count   INTEGER NOT NULL DEFAULT 0
repost_count    INTEGER NOT NULL DEFAULT 0
view_count      INTEGER NOT NULL DEFAULT 0
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ
```

#### `articles`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
project_id      UUID REFERENCES projects(id) ON DELETE SET NULL
slug            TEXT NOT NULL
title           TEXT NOT NULL
subtitle        TEXT
content_md      TEXT NOT NULL
content_html    TEXT
cover_url       TEXT
reading_time    INTEGER
is_published    BOOLEAN NOT NULL DEFAULT false
published_at    TIMESTAMPTZ
view_count      INTEGER NOT NULL DEFAULT 0
reaction_count  INTEGER NOT NULL DEFAULT 0
comment_count   INTEGER NOT NULL DEFAULT 0
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ
UNIQUE (author_id, slug)
```

#### `communities`

```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_id          UUID NOT NULL REFERENCES users(id)
slug              TEXT UNIQUE NOT NULL
name              TEXT NOT NULL
description       TEXT
cover_url         TEXT
avatar_url        TEXT
is_private        BOOLEAN NOT NULL DEFAULT false
requires_approval BOOLEAN NOT NULL DEFAULT false
member_count      INTEGER NOT NULL DEFAULT 0
post_count        INTEGER NOT NULL DEFAULT 0
rules             JSONB DEFAULT '[]'
created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at        TIMESTAMPTZ
```

#### Social graph & interaction tables

```sql
-- followers
follower_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
followee_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
PRIMARY KEY (follower_id, followee_id)
CHECK (follower_id != followee_id)

-- project_followers
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
PRIMARY KEY (user_id, project_id)

-- post_reactions
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE
reaction_type   reaction_type NOT NULL DEFAULT 'like'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
PRIMARY KEY (user_id, post_id)

-- comments
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
post_id         UUID REFERENCES posts(id) ON DELETE CASCADE
article_id      UUID REFERENCES articles(id) ON DELETE CASCADE
parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE
content         TEXT NOT NULL CHECK (char_length(content) <= 1000)
reaction_count  INTEGER NOT NULL DEFAULT 0
is_edited       BOOLEAN NOT NULL DEFAULT false
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at      TIMESTAMPTZ
CHECK (post_id IS NOT NULL OR article_id IS NOT NULL)

-- community_members
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
community_id    UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE
member_role     member_role NOT NULL DEFAULT 'member'
joined_at       TIMESTAMPTZ NOT NULL DEFAULT now()
PRIMARY KEY (user_id, community_id)

-- notifications
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
actor_id        UUID REFERENCES users(id) ON DELETE SET NULL
event_type      notification_event NOT NULL
entity_type     TEXT NOT NULL
entity_id       UUID NOT NULL
metadata        JSONB DEFAULT '{}'
is_read         BOOLEAN NOT NULL DEFAULT false
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()

-- message_threads
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
participant_ids UUID[] NOT NULL
is_group        BOOLEAN NOT NULL DEFAULT false
group_name      TEXT
last_message_at TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()

-- messages
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
thread_id       UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE
sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
content         TEXT NOT NULL CHECK (char_length(content) <= 2000)
media_urls      TEXT[] DEFAULT '{}'
is_edited       BOOLEAN NOT NULL DEFAULT false
is_deleted      BOOLEAN NOT NULL DEFAULT false
read_by         UUID[] DEFAULT '{}'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

#### Enum types

```sql
CREATE TYPE user_role AS ENUM (
  'member', 'pro_member', 'community_mod', 'platform_mod', 'administrator'
);
CREATE TYPE project_status AS ENUM ('active', 'archived', 'stealth');
CREATE TYPE post_type AS ENUM ('standard', 'update', 'milestone', 'question', 'repost');
CREATE TYPE reaction_type AS ENUM ('like', 'fire', 'rocket', 'mind_blown', 'clap');
CREATE TYPE member_role AS ENUM ('member', 'moderator', 'owner');
CREATE TYPE notification_event AS ENUM (
  'new_follower', 'post_reaction', 'post_comment', 'comment_reply',
  'mention', 'project_follower', 'community_invite', 'message'
);
```

### 5.3 User system

> ⚠ **Schema note:** The `users` table in §5.2 still reflects the legacy single-role model (`role` column). The five-table model here supersedes it. §5.2 will be updated when the migration handoff is issued.

> Full detail: see `USER_SYSTEM.md`. This section summarises the decisions and schema as they relate to the broader architecture.

#### Five-table schema

```
users              ← Anchor identity. UUID PK, email, username.
auth_providers     ← Decoupled login methods (email/password + Google OAuth).
user_profiles      ← Public profile data. Progressive — nullable fields.
user_metadata      ← JSONB key-value store for internal/preference data.
user_roles         ← Many-to-many role assignments with scope and expiry.
```

No password fields on `users`. Auth credentials live exclusively in `auth_providers`. This allows additional OAuth providers (GitHub, Apple) to be added without touching the `users` table.

#### Role architecture

Five tiers: `member`, `pro_member`, `community_mod`, `platform_mod`, `administrator`. Stored in `user_roles` join table — not as a column on `users`. Supports multi-role, community-scoped assignment, time-limited grants, and a full audit trail (`granted_by`, `granted_at`, `expires_at`).

#### Permission enforcement (three layers)

1. **RLS** — Supabase Row Level Security at the database layer. Cannot be bypassed by application code.
2. **Server check** — Route Handler / Server Action validates roles before executing any mutation.
3. **UI gate** — Conditional rendering based on server-provided role context. UX only, not security.

Role data is cached in Redis (TTL: 5 min) to prevent repeated DB reads on permission-heavy pages.

#### Auth flow

**Email/password:** standard credential signup → email verification → JWT session via Supabase Auth.

**Google OAuth:** PKCE flow via Supabase. On callback, match by `provider_uid` (Google `sub`). If email matches an existing account, link the provider to that account. Never create duplicate users for the same email across providers.

#### Account deletion

Hard-delete. On `DELETE FROM users`: auth, profile, metadata, roles, follows, and reactions cascade. Posts set `user_id = null` and display as `[deleted]` to preserve thread context. A 30-day hold period between request and execution allows cancellation.

#### Username rules

3–30 chars · `a-z`, `0-9`, `_` only · must start with a letter · no leading/trailing/consecutive underscores · lowercase stored and displayed · reserved words blocked via `reserved_usernames` lookup table · 30-day free-change window after signup, locked thereafter.

#### Progressive profiling

Only email, password/OAuth, and username are required at signup. Display name, bio, avatar, headline, location, website, and interests are captured through a post-signup onboarding flow. Completion tracked via `user_profiles.profile_complete` and `user_metadata.onboarding_step`.

#### Caching layer (user data)

| Data | Cache key | TTL |
|---|---|---|
| User profile | `profile:{user_id}` | 60s |
| User roles | `roles:{user_id}` | 300s |
| Username → user_id | `username:{username}` | 120s |

Cache is invalidated on write (profile update, role grant/revoke, username change).

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

### 6.1 Caching strategy

The platform uses a four-layer cache hierarchy. Each layer has a defined responsibility and invalidation strategy. Cache keys follow a strict naming convention: `{entity}:{id}:{variant}`.

| Layer | Purpose & location | Invalidation |
|---|---|---|
| **L1 — React Cache** | In-memory, per-request deduplication via React's `cache()` function | Automatic on request end |
| **L2 — Next.js Data Cache** | Persistent across requests, tagged by entity, stored on Vercel edge | `revalidateTag()` on mutation |
| **L3 — Upstash Redis** | Cross-region shared cache for feeds, counts, user sessions | TTL + explicit invalidation |
| **L4 — Supabase** | PostgreSQL with `pg_stat_statements` tuning and connection pooling via PgBouncer | Source of truth, no TTL |

#### Redis key schema

```
feed:home:{user_id}:{page}          TTL: 60s
feed:explore:{cursor}               TTL: 120s
feed:project:{project_id}:{page}    TTL: 300s
profile:{username}                  TTL: 300s
project:{slug}                      TTL: 300s
post:{post_id}                      TTL: 600s
counts:followers:{user_id}          TTL: 60s
counts:reactions:{post_id}          TTL: 30s
session:{user_id}                   TTL: 3600s
notif:unread:{user_id}              TTL: 30s
rate:{action}:{user_id}             TTL: varies (rate limit window)
```

### 6.2 Feed architecture

Home feeds use a hybrid fan-out model. For users with fewer than 10,000 followers, writes fan out to each follower's feed cache on post creation (push model). For high-follower accounts, the feed is assembled at read time by merging the author's recent posts into the requesting user's feed (pull model). This threshold is configurable via a feature flag.

Feeds are paginated using cursor-based pagination exclusively. Offset-based pagination is prohibited because it breaks under real-time insertion. The cursor is always a base64-encoded combination of `created_at` and `id`.

### 6.3 Database performance rules

- Every foreign key column must have an index.
- Every column used in a `WHERE` clause that is not a primary key must have an index.
- Count columns (`follower_count`, `post_count`, `reaction_count`) are denormalized and updated via database triggers to avoid expensive `COUNT(*)` queries at read time.
- Soft-deleted rows must be excluded via partial indexes where queries filter by `deleted_at IS NULL`.
- Use `EXPLAIN ANALYZE` on every query touching a table with more than 10,000 rows before merging.
- Connection pooling is mandatory. All server-side code uses the Supabase client in pooler mode (port 6543, transaction pooling).
- The `anon` key is never used server-side. All server requests use the service role key inside a Supabase server client that enforces RLS bypass only when explicitly required.

### 6.4 Lazy loading & skeleton strategy

Every data-driven component must have a corresponding Skeleton component. Skeletons are layout-accurate placeholders that match the dimensions and shape of the real content, never spinners.

- Route segments use `loading.tsx` files to stream Suspense boundaries. The shell renders instantly; content streams in.
- Images use `next/image` with `placeholder="blur"` and a `blurDataURL` generated at upload time.
- Infinite scroll feeds load the next page 300px before the user reaches the bottom using an `IntersectionObserver`.
- Heavy components (rich text editor, map embeds, video players) are loaded via `next/dynamic` with `ssr: false` and a skeleton shown while loading.
- Skeleton components live in `components/skeletons/` and are named `{ComponentName}Skeleton.tsx`.

---

## 7. Real-Time Architecture

### 7.1 Supabase Realtime

Supabase Realtime uses PostgreSQL logical replication to stream database changes to connected clients. We subscribe to table-level channels with row-level filters to minimize unnecessary traffic.

| Feature | Implementation |
|---|---|
| **Notifications** | Client subscribes to the `notifications` channel filtered by `recipient_id = auth.uid()`. New rows instantly appear in the notification bell. |
| **Messages** | Client subscribes to `messages` channel filtered by `thread_id`. New rows are appended to the thread UI optimistically then confirmed. |
| **Feed updates** | Presence channel signals when new posts exist; client shows a "New posts available" banner rather than auto-inserting to avoid layout jumps. |
| **Online presence** | Supabase Presence tracks which users are active in a community or message thread and shows live indicators. |
| **Post reactions** | Reaction count channels update in real-time on public post pages. |

### 7.2 Optimistic UI

All write actions use optimistic updates. The UI reflects the expected result immediately; the server confirms or reverts. Implemented consistently using React's `useOptimistic` hook in client components and Server Actions for the write path.

- **Following a user** — follower count increments immediately; reverts if the server returns an error.
- **Reacting to a post** — emoji count increments and the button state toggles immediately.
- **Sending a message** — the message appears in the thread instantly with a "sending" state.
- **Creating a post** — the post appears at the top of the feed with a pending indicator.

---

## 8. Permission System

### 8.1 Architecture overview

Permissions are enforced at three independent layers. All three must be satisfied for an action to succeed. A bug in one layer cannot alone expose unauthorized access.

1. **Row Level Security (RLS)** — enforced at the database level by PostgreSQL. Cannot be bypassed by application code. Defines what rows a given `auth.uid()` can `SELECT`, `INSERT`, `UPDATE`, or `DELETE`.
2. **Server-side permission check** — every Server Action and API route calls `checkPermission()` before executing. Throws a `PermissionError` if the calling user lacks the required permission.
3. **UI permission gates** — client components use the `usePermissions()` hook to conditionally render actions. This is UX polish only; it is never trusted as a security boundary.

### 8.2 Permission matrix

| Action | Required role | Scope |
|---|---|---|
| Create post | Member+ | Own profile or joined community |
| Delete post | Author / Mod / Admin | Author: own posts; Mod: community posts; Admin: all |
| Create project | Member+ | Own projects only |
| Edit project | Project owner / Admin | Owner: own project; Admin: all |
| Publish article | Member+ | Own articles or owned projects |
| Create community | Member+ | Become owner of new community |
| Moderate community | Community Mod+ / Admin | Scoped to assigned community unless Admin |
| Suspend user | Platform Mod+ / Admin | Cannot suspend other Mods or Admins |
| Assign roles | Admin only | All users |
| Access admin panel | Platform Mod+ / Admin | Mod sees moderation queue; Admin sees everything |
| Send message | Member+ | Cannot message suspended users |
| View private community | Community member / Admin | Must be accepted member |

### 8.3 Permission implementation

```ts
// lib/permissions/index.ts
import { checkPermission } from '@/lib/permissions';

// In every Server Action:
export async function deletePost(postId: string) {
  const session = await requireSession(); // throws if not authed
  await checkPermission(session.user, 'post:delete', { postId });
  // ... proceed with deletion
}

// All permission rules live in one file:
// lib/permissions/permissions.config.ts
// This is the single source of truth.
```

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

```ts
// app/(platform)/profile/[username]/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { getCachedProfile } from '@/lib/queries/profile';

export default async function ProfilePage({ params }) {
  // 1. Try Redis cache first
  const cached = await getCachedProfile(params.username);
  if (cached) return <ProfileView profile={cached} />;

  // 2. Miss: query Supabase, populate cache, return
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('users')
    .select('id, username, display_name, bio, avatar_url, follower_count')
    .eq('username', params.username)
    .single();

  await setCachedProfile(params.username, profile);
  return <ProfileView profile={profile} />;
}
```

---

## 10. Rate Limiting

Rate limits are applied per authenticated user ID. Unauthenticated requests are rate limited by IP. All limits use a sliding window algorithm via Upstash Ratelimit.

| Action | Member limit | Pro / override |
|---|---|---|
| Create post | 10 per minute | 30 per minute |
| Create comment | 20 per minute | 60 per minute |
| Send message | 30 per minute | 60 per minute |
| Follow user | 60 per minute | 60 per minute |
| React to post | 60 per minute | 120 per minute |
| Create project | 5 per hour | 20 per hour |
| Publish article | 5 per day | 20 per day |
| Search | 30 per minute | 60 per minute |
| API (anon / read) | 100 per minute | N/A |

---

## 11. Background Jobs & Async Processing

| Job | Description |
|---|---|
| **Notification fan-out** | After a post is created, a Supabase Edge Function fans out notification records to relevant followers. Triggered by a database webhook on `posts INSERT`. |
| **Feed cache warming** | Vercel Cron runs every 5 minutes to pre-warm home feed caches for the top 1,000 most active users. |
| **Count reconciliation** | A nightly Supabase Edge Function reconciles denormalized count columns against actual row counts to catch drift. |
| **Email digest** | A weekly Vercel Cron triggers a Supabase Edge Function that generates and sends digest emails via Resend. |
| **Media processing** | After image upload to Supabase Storage, a webhook triggers image optimization and blur placeholder generation. |
| **Search index sync** | After content creation or update, a job syncs the record to the search index (Phase 2: Algolia). |
| **Moderation queue** | Flagged content is queued in a `moderation_queue` table and processed by Platform Mods via the admin panel. |

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

### 13.1 Error tracking — Sentry

- Sentry is initialized in `instrumentation.ts` for both server and client.
- All caught errors in Server Actions are forwarded to Sentry with user context (no PII beyond `user_id`).
- Unhandled promise rejections in Edge Functions are captured via the Sentry Edge SDK.

### 13.2 Structured logging — Axiom

- Every significant server-side event emits a structured log: `{ event, user_id, entity_type, entity_id, duration_ms, status }`.
- Logs are never written to `console` in production. They are sent to Axiom via the `axiom-js` SDK.
- Slow queries (>100ms) are automatically flagged with a `slow_query: true` field.

### 13.3 Performance monitoring

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

- Branch naming: `feature/{ticket-id}-short-description`, `fix/{ticket-id}-description`, `chore/description`.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`.
- Every PR requires: passing CI (lint + type-check + tests), at least one approval, and no merge conflicts.
- Direct pushes to `main` are prohibited. All changes go through a PR.
- Preview deployments are automatically created for every PR via Vercel.

---

## 16. Scalability Roadmap

### Phase 1 — Launch (0–10K users)

- Single Supabase project, single Redis instance.
- All features in a single Next.js app.
- Feed caching with TTL, cursor pagination, basic RLS.
- Vercel Cron for background jobs.

### Phase 2 — Growth (10K–100K users)

- Read replicas enabled on Supabase for heavy `SELECT` workloads.
- Algolia or Typesense integrated for full-text search.
- CDN edge caching for public project and profile pages (Vercel Edge).
- Message delivery upgraded to a dedicated WebSocket service if Supabase Realtime reaches limits.
- Moderation tooling expanded with AI-assisted content flagging.

### Phase 3 — Scale (100K+ users)

- Evaluate Supabase Enterprise or self-hosted Postgres with pgBouncer cluster.
- Feed service extracted to a dedicated microservice with its own database.
- Notification fan-out migrated to a queue-based system (Upstash QStash).
- Analytics separated into a data warehouse (ClickHouse or BigQuery).

---

## 17. Environment Configuration

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-side only — NEVER expose to client

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

# App
NEXT_PUBLIC_APP_URL=             # https://grassroots.ai in prod
NEXT_PUBLIC_APP_ENV=             # development | preview | production

# Feature Flags (Vercel Edge Config)
EDGE_CONFIG=                     # Vercel-injected automatically
```

---

## 18. Open Questions & Future Decisions

| Topic | Status & notes |
|---|---|
| **Monetization** | Pro tier payment provider (Stripe vs Lemon Squeezy). Architecture is ready for either via a billing abstraction layer. |
| **Video content** | Short-form video posts are not in scope for Phase 1. When added, Mux or Cloudflare Stream will handle encoding and delivery. |
| **Mobile apps** | The web app is mobile-responsive. Native iOS/Android apps are a Phase 3 decision. The Server Action + Supabase architecture is compatible with React Native via Expo. |
| **AI features** | AI-powered content suggestions, semantic search, and project matching are planned. `pgvector` is already enabled on Supabase; embeddings pipeline to be designed in Phase 2. |
| **Internationalization** | `next-intl` is the chosen library for i18n. All user-facing strings should use translation keys from day one if internationalization is a near-term goal. |

---

*This document is the single source of architectural truth for Project Grassroots. All architectural deviations require a written amendment approved by the project owner.*
