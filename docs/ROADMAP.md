# Grassroots — Roadmap & Future Architecture

> This document describes planned features, systems, and infrastructure that are **not yet implemented**. Nothing here should be assumed to exist in the codebase. For what's actually built and how it actually works today, see `ARCHITECTURE.md`.
>
> When a section here gets built, move its accurate, as-implemented description into `ARCHITECTURE.md` and either delete it from this file or reduce it to a one-line "done — see ARCHITECTURE.md §X" pointer. Do not let both documents describe the same system in different levels of accuracy.

---

## Core Product Pillars

*(originally ARCHITECTURE.md §2.2)*

| Pillar | Description |
|---|---|
| **User Profiles** | Persistent identity with bio, avatar, skill tags, social links, follower graph, and an activity feed of everything the user has published or built. |
| **Projects** | First-class entity that represents any AI-powered product, experiment, or idea. Has its own public page, followers, update timeline, and collaborators. |
| **Posts** | Short-form status updates, optionally attached to a project. Supports rich text, images, code snippets, and external link previews. |
| **Articles** | Long-form markdown content authored inside the platform. Can be published under a personal profile or a project page. |
| **Communities** | Member-owned spaces with a self-contained feed, pinned projects, member roles, and moderation tools. |
| **Messages** | Private 1:1 and group direct messaging with real-time delivery and read receipts. |
| **Notifications** | Unified in-app and push notification system covering follows, reactions, mentions, comments, and community activity. |

Only User Profiles and Posts have any implementation today, and both are partial — see `ARCHITECTURE.md` §4–§5 for current state.

---

## Codebase structure — planned additions

Planned but not yet created: `apps/admin/` (internal admin dashboard), `packages/utils/` (shared utility functions), `packages/config/` (shared ESLint/Prettier/PostCSS configs), `supabase/functions/` (Supabase Edge Functions).

Planned but not yet created in `apps/web/src`: `explore/`, `messages/`, `notifications/` (route), `settings/`, `project/[slug]/`, `community/[slug]/`, `article/[slug]/`, `hooks/`, `lib/permissions/`, `lib/redis/`, and additional `*.actions.ts` files beyond `auth.actions.ts`.

---

## Database schema — planned tables

*(originally ARCHITECTURE.md §5.2 core tables, minus `users`/`user_profiles` which are real — see `ARCHITECTURE.md` §5.2)*

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

---

## User system — five-table model

*(originally ARCHITECTURE.md §5.3; full detail in `docs/USER_SYSTEM.md`, also a design document — see that file's status header)*

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

## Performance Architecture

*(originally ARCHITECTURE.md §6 — entire section)*

### Caching strategy

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

### Feed architecture

Home feeds use a hybrid fan-out model. For users with fewer than 10,000 followers, writes fan out to each follower's feed cache on post creation (push model). For high-follower accounts, the feed is assembled at read time by merging the author's recent posts into the requesting user's feed (pull model). This threshold is configurable via a feature flag.

Feeds are paginated using cursor-based pagination exclusively. Offset-based pagination is prohibited because it breaks under real-time insertion. The cursor is always a base64-encoded combination of `created_at` and `id`.

### Lazy loading & skeleton strategy (planned additions beyond current state)

- Infinite scroll feeds load the next page 300px before the user reaches the bottom using an `IntersectionObserver`.
- Heavy components (rich text editor, map embeds, video players) are loaded via `next/dynamic` with `ssr: false` and a skeleton shown while loading.

---

## Real-Time Architecture

*(originally ARCHITECTURE.md §7 — entire section)*

### Supabase Realtime

Supabase Realtime uses PostgreSQL logical replication to stream database changes to connected clients. We subscribe to table-level channels with row-level filters to minimize unnecessary traffic.

| Feature | Implementation |
|---|---|
| **Notifications** | Client subscribes to the `notifications` channel filtered by `recipient_id = auth.uid()`. New rows instantly appear in the notification bell. |
| **Messages** | Client subscribes to `messages` channel filtered by `thread_id`. New rows are appended to the thread UI optimistically then confirmed. |
| **Feed updates** | Presence channel signals when new posts exist; client shows a "New posts available" banner rather than auto-inserting to avoid layout jumps. |
| **Online presence** | Supabase Presence tracks which users are active in a community or message thread and shows live indicators. |
| **Post reactions** | Reaction count channels update in real-time on public post pages. |

### Optimistic UI

All write actions use optimistic updates. The UI reflects the expected result immediately; the server confirms or reverts. Implemented consistently using React's `useOptimistic` hook in client components and Server Actions for the write path.

- **Following a user** — follower count increments immediately; reverts if the server returns an error.
- **Reacting to a post** — emoji count increments and the button state toggles immediately.
- **Sending a message** — the message appears in the thread instantly with a "sending" state.
- **Creating a post** — the post appears at the top of the feed with a pending indicator.

---

## Permission System — planned matrix and implementation

*(originally ARCHITECTURE.md §8.2 and §8.3; the architecture overview and current-gap callout are real and stay in `ARCHITECTURE.md` §8.1)*

### Permission matrix

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

### Permission implementation

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

---

## API Design — planned data fetching pattern

*(originally ARCHITECTURE.md §9.3; the general Server Actions rules in §9.1 are real and stay in `ARCHITECTURE.md`)*

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

## Rate Limiting

*(originally ARCHITECTURE.md §10 — entire section)*

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

## Background Jobs & Async Processing

*(originally ARCHITECTURE.md §11 — entire section)*

| Job | Description |
|---|---|
| **Notification fan-out** | After a post is created, a Supabase Edge Function fans out notification records to relevant followers. Triggered by a database webhook on `posts INSERT`. |
| **Feed cache warming** | Vercel Cron runs every 5 minutes to pre-warm home feed caches for the top 1,000 most active users. |
| **Count reconciliation** | A nightly Supabase Edge Function reconciles denormalized count columns against actual row counts to catch drift. |
| **Email digest** | A weekly Vercel Cron triggers a Supabase Edge Function that generates and sends digest emails via Resend. |
| **Media processing** | After image upload to Supabase Storage, a webhook triggers image optimization and blur placeholder generation. |
| **Search index sync** | After content creation or update, a job syncs the record to the search index (Phase 2: Algolia). |
| **Moderation queue** | Flagged content is queued in a `moderation_queue` table and processed by Platform Mods via the admin panel. |
| **Waitlist activation email** | When a waitlisted account is activated (today: a manual `UPDATE`; planned: triggered from the admin panel's career/user management section), a transactional email is sent via Resend notifying the user access is open. Today activation is silent — `/waitlisted`'s "we'll email you" copy is currently aspirational, not backed by code. |

---

## Observability — planned

*(originally ARCHITECTURE.md §13.1 and §13.2; §13.3 Vercel Speed Insights is real and stays in `ARCHITECTURE.md`)*

### Error tracking — Sentry

- Sentry is initialized in `instrumentation.ts` for both server and client.
- All caught errors in Server Actions are forwarded to Sentry with user context (no PII beyond `user_id`).
- Unhandled promise rejections in Edge Functions are captured via the Sentry Edge SDK.

### Structured logging — Axiom

- Every significant server-side event emits a structured log: `{ event, user_id, entity_type, entity_id, duration_ms, status }`.
- Logs are never written to `console` in production. They are sent to Axiom via the `axiom-js` SDK.
- Slow queries (>100ms) are automatically flagged with a `slow_query: true` field.

---

## Scalability Roadmap

*(originally ARCHITECTURE.md §16 — entire section)*

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

## Open Questions & Future Decisions

*(originally ARCHITECTURE.md §18 — entire section)*

| Topic | Status & notes |
|---|---|
| **Monetization** | Pro tier payment provider (Stripe vs Lemon Squeezy). Architecture is ready for either via a billing abstraction layer. |
| **Video content** | Short-form video posts are not in scope for Phase 1. When added, Mux or Cloudflare Stream will handle encoding and delivery. |
| **Mobile apps** | The web app is mobile-responsive. Native iOS/Android apps are a Phase 3 decision. The Server Action + Supabase architecture is compatible with React Native via Expo. |
| **AI features** | AI-powered content suggestions, semantic search, and project matching are planned. `pgvector` is already enabled on Supabase; embeddings pipeline to be designed in Phase 2. |
| **Internationalization** | `next-intl` is the chosen library for i18n. All user-facing strings should use translation keys from day one if internationalization is a near-term goal. |
