# User System — Strategy & Architecture
**Project Grassroots** · `grassrootsonline/grassroots-platform`

---

## Overview

This document defines the complete user identity and authentication strategy for Grassroots. It covers schema design, auth mechanics, role architecture, account lifecycle, username rules, and progressive profiling. It is the single source of truth for all decisions related to user data.

The user system is built on four principles:

1. **Auth-agnostic identity** — the core user record is decoupled from login method from day one. Email/password and Google OAuth share the same identity layer without coupling.
2. **Lean core, extensible edges** — primary tables carry only what is always needed. Expansion data lives in dedicated slots rather than bloating the core.
3. **Roles as data, not code** — role assignment lives in a separate join table, not a column. This supports multi-role, role history, and future community-scoped roles.
4. **Hard-delete with traceability** — accounts are purged on request for GDPR compliance. Downstream content is handled through a deliberate cascade policy, not silent orphaning.

---

## Schema Design

### Table overview

```
users                  ← Lean identity record. One row per person, forever.
auth_providers         ← Login methods. One row per method per user.
user_profiles          ← Public-facing profile data. Filled progressively.
user_metadata          ← Key-value expansion slot. Internal and computed data.
user_roles             ← Role assignments. Many-to-many, scoped by context.
```

---

### `users`

The anchor table. As thin as possible — only fields that every subsystem needs unconditionally.

```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  email_verified    BOOLEAN NOT NULL DEFAULT false,
  username          TEXT NOT NULL UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);
```

**Column rationale:**

| Column | Why it's here |
|---|---|
| `id` | UUID v4. Never expose sequential integers as public identifiers. |
| `email` | Canonical identity anchor. Unique across all providers. |
| `email_verified` | Required before full platform access. Enforced at the server layer, not just UI. |
| `username` | Public handle. Unique, immutable after 30-day grace period (see Username Rules). |
| `created_at` | Immutable. Set once on insert. |
| `updated_at` | Updated by trigger on any row change. |

**What is deliberately absent:** password hashes, OAuth tokens, display name, bio, avatar, role. Each of these lives in the appropriate downstream table.

---

### `auth_providers`

Decouples login method from identity. Supports multiple providers per user (e.g., a user who signs up with email and later links Google).

```sql
CREATE TYPE auth_provider_type AS ENUM ('email', 'google');

CREATE TABLE auth_providers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider         auth_provider_type NOT NULL,
  provider_uid     TEXT,                          -- Google sub / null for email
  password_hash    TEXT,                          -- bcrypt hash / null for OAuth
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT auth_providers_email_unique
    UNIQUE NULLS NOT DISTINCT (user_id, provider),

  CONSTRAINT auth_providers_provider_uid_unique
    UNIQUE (provider, provider_uid)
);

CREATE INDEX idx_auth_providers_user_id ON auth_providers (user_id);
```

**Column rationale:**

| Column | Why it's here |
|---|---|
| `provider` | Enum-constrained. Adding a new provider (GitHub, Apple) requires a migration, which is intentional — providers are architectural decisions, not configuration. |
| `provider_uid` | The opaque ID returned by the OAuth provider (Google `sub` field). Used to match returning OAuth users. Null for email/password. |
| `password_hash` | bcrypt hash, cost factor 12. Null for OAuth-only accounts. Never stored in plain text, never logged. |

**Auth flow at login:**
- Email/password: look up `auth_providers` where `provider = 'email'` and `user_id` matches; verify hash.
- Google OAuth: look up `auth_providers` where `provider = 'google'` and `provider_uid = sub`. If not found, create user + provider record. If found, return existing user.

---

### `user_profiles`

Public-facing profile data. Created automatically on user insert (trigger or application logic). Fields are nullable — profile completion is progressive, not a signup gate.

```sql
CREATE TABLE user_profiles (
  user_id          UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  display_name     TEXT,
  bio              TEXT,
  avatar_url       TEXT,
  location         TEXT,
  website_url      TEXT,
  headline         TEXT,                          -- Short tagline below display name
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Column rationale:**

| Column | Why it's here |
|---|---|
| `display_name` | What shows on posts and cards. Separate from `username`. Can contain spaces, mixed case, emoji. |
| `bio` | Free-form. Max 280 characters enforced at application layer. |
| `avatar_url` | URL to Supabase Storage object. Null until uploaded. Fallback to initials avatar in UI. |
| `location` | Free-form text. Not geocoded — it's a self-description, not a coordinate. |
| `website_url` | Validated as URL at application layer. |
| `headline` | "What I build" — short professional tagline. Max 100 characters. |
| `profile_complete` | Computed flag. Set to `true` when `display_name`, `avatar_url`, and `bio` are all non-null. Drives onboarding nudges. |

---

### `user_metadata`

Key-value expansion slot for internal, computed, and preference data that doesn't belong in the public profile. Uses `jsonb` for the value to support typed payloads without a schema migration per entry.

```sql
CREATE TABLE user_metadata (
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, key)
);

CREATE INDEX idx_user_metadata_user_id ON user_metadata (user_id);
```

**Example keys and their values:**

| Key | Value shape | Use |
|---|---|---|
| `onboarding_step` | `"follow_interests"` | Current step in onboarding flow |
| `notification_prefs` | `{"email": true, "push": false}` | Notification preferences |
| `feed_algorithm` | `"chronological"` | Per-user feed setting |
| `last_seen_at` | `"2025-06-28T12:00:00Z"` | Activity tracking |
| `ai_builder_tags` | `["nextjs", "llms", "agents"]` | Interest tags for feed ranking |

**Rules for `user_metadata`:**
- Keys are `snake_case` strings. No dots, no hierarchy in the key itself — use jsonb nesting for structured values.
- Never store auth credentials, PII beyond what's in `user_profiles`, or data that other tables need to JOIN on. If something needs to be queried in a WHERE clause, it belongs in a real column.

---

### `user_roles`

Many-to-many role assignments. Supports context scoping (platform-wide vs. community-scoped) and a full audit trail.

```sql
CREATE TYPE platform_role AS ENUM (
  'member',
  'pro_member',
  'community_mod',
  'platform_mod',
  'administrator'
);

CREATE TABLE user_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role          platform_role NOT NULL,
  scope_type    TEXT,                            -- 'platform' | 'community'
  scope_id      UUID,                            -- community_id if scoped; null if platform
  granted_by    UUID REFERENCES users (id) ON DELETE SET NULL,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,                     -- null = permanent

  CONSTRAINT user_roles_unique UNIQUE (user_id, role, scope_type, scope_id)
);

CREATE INDEX idx_user_roles_user_id   ON user_roles (user_id);
CREATE INDEX idx_user_roles_scope_id  ON user_roles (scope_id) WHERE scope_id IS NOT NULL;
```

**Role definitions:**

| Role | Scope | Capabilities |
|---|---|---|
| `member` | Platform | Default on signup. Post, comment, follow, react. |
| `pro_member` | Platform | Extended post types, analytics, higher rate limits. |
| `community_mod` | Community | Pin, remove, and lock posts within one community. |
| `platform_mod` | Platform | Content moderation across all communities. |
| `administrator` | Platform | Full access. User management, platform configuration. |

**Why a join table instead of a column on `users`:**
- A single `role TEXT` column can only hold one role. This breaks the moment a user is both a `pro_member` and a `community_mod` in two communities.
- A join table supports role expiry (`expires_at`) for time-limited grants (e.g., trial pro access).
- A join table supports `granted_by` for audit trails — essential for moderation.
- Community-scoped roles (`scope_type = 'community'`, `scope_id = community_id`) live in the same table, keeping role checking logic uniform.

**Querying a user's effective roles:**

```sql
-- Get all active roles for a user
SELECT role, scope_type, scope_id
FROM user_roles
WHERE user_id = $1
  AND (expires_at IS NULL OR expires_at > now());

-- Check if user is a mod in a specific community
SELECT 1
FROM user_roles
WHERE user_id = $1
  AND role = 'community_mod'
  AND scope_id = $2
  AND (expires_at IS NULL OR expires_at > now());
```

---

## Auth Flow

### Email + password signup

```
1. Client submits: email, password, username
2. Server validates:
   - email format (RFC 5322)
   - email not already in users
   - username passes constraint rules (see Username Rules)
   - password meets strength requirements (min 10 chars, not in common list)
3. Server creates:
   - INSERT INTO users (email, username)
   - INSERT INTO user_profiles (user_id)           ← empty row, filled progressively
   - INSERT INTO auth_providers (user_id, provider='email', password_hash=bcrypt(password, 12))
   - INSERT INTO user_roles (user_id, role='member', scope_type='platform')
4. Server sends: email verification link (Supabase Auth email)
5. User verifies → UPDATE users SET email_verified = true
6. Session issued via Supabase JWT
```

### Google OAuth signup / login

```
1. Client initiates Google OAuth flow (Supabase Auth handles PKCE)
2. Supabase returns: id_token with { sub, email, name, picture }
3. Server checks: SELECT * FROM auth_providers WHERE provider='google' AND provider_uid = sub
   
   IF found:
     → Return existing user session (login)
   
   IF not found:
     → Check: SELECT * FROM users WHERE email = google_email
       IF email exists (user signed up with email first):
         → INSERT INTO auth_providers (user_id, provider='google', provider_uid=sub)
         → Link Google to existing account (account linking)
       IF email does not exist:
         → INSERT INTO users (email, username=generated_from_name)
         → INSERT INTO user_profiles (user_id, display_name=name, avatar_url=picture)
         → INSERT INTO auth_providers (user_id, provider='google', provider_uid=sub)
         → INSERT INTO user_roles (user_id, role='member', scope_type='platform')
         → Flag: username_needs_confirmation = true (prompt user to confirm or change)
     → Return new user session
```

**Account linking rule:** if a Google email matches an existing `users.email`, the OAuth provider is linked to that account automatically. The user is informed via toast on next login. This prevents duplicate accounts from the same person using two methods.

### Session management

Sessions are JWTs issued by Supabase Auth. The JWT payload includes `user_id`. On each authenticated request:

1. Middleware verifies JWT signature and expiry.
2. Server fetches user roles from `user_roles` (or from Redis cache, TTL 5 min).
3. Permission checks run against the fetched role set.

**Token refresh:** Supabase handles refresh token rotation automatically. Refresh tokens are single-use.

---

## Role & Permissions Model

### Three-layer enforcement

All three layers must agree for an action to proceed:

```
Layer 1 — RLS (Row Level Security, PostgreSQL)
  Supabase RLS policies enforce read/write access at the database level.
  No application bug can bypass this layer.

Layer 2 — Server check (Next.js Route Handler / Server Action)
  Before executing any mutation, the server fetches the user's active roles
  and validates the action is permitted. Returns 403 if not.

Layer 3 — UI gate (React component)
  UI elements are conditionally rendered based on role context passed from
  the server. This is UX, not security — it prevents confusion, not abuse.
```

### RLS policies (example)

```sql
-- Users can read any public profile
CREATE POLICY "public_profiles_readable" ON user_profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "own_profile_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Only the user themselves can read their metadata
CREATE POLICY "own_metadata_only" ON user_metadata
  FOR SELECT USING (auth.uid() = user_id);
```

### Role checking helper (server-side)

```typescript
// lib/roles.ts
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  // Check Redis cache first (TTL: 5 min)
  const cached = await redis.get(`roles:${userId}`);
  if (cached) return JSON.parse(cached);

  const { data } = await supabase
    .from('user_roles')
    .select('role, scope_type, scope_id')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

  await redis.setex(`roles:${userId}`, 300, JSON.stringify(data));
  return data;
}

export function hasRole(
  roles: UserRole[],
  role: PlatformRole,
  scopeId?: string
): boolean {
  return roles.some(r =>
    r.role === role &&
    (scopeId ? r.scope_id === scopeId : true)
  );
}
```

---

## Account Lifecycle & Deletion

### Hard-delete policy

Grassroots uses hard-delete for account removal. This means the `users` row and all cascaded child data is permanently and irrecoverably purged. This is the correct choice for GDPR Article 17 (right to erasure) compliance.

### Cascade behavior on `DELETE FROM users WHERE id = $1`

| Table | Cascade action |
|---|---|
| `auth_providers` | `ON DELETE CASCADE` — purged |
| `user_profiles` | `ON DELETE CASCADE` — purged |
| `user_metadata` | `ON DELETE CASCADE` — purged |
| `user_roles` | `ON DELETE CASCADE` — purged |
| Posts, comments | `ON DELETE SET NULL` — content orphaned as `[deleted]` |
| Follows | `ON DELETE CASCADE` — relationship purged |
| Reactions | `ON DELETE CASCADE` — purged |

**Why posts are orphaned, not deleted:** Deleting a user's posts removes context from threads other people participated in. A post receiving 40 replies should not disappear from the conversation when the author leaves. The author's name and avatar are replaced with `[deleted]` in the UI, and the `user_id` FK is set to null.

### Deletion flow

```
1. User initiates deletion (settings → delete account)
2. Server requires: password confirmation OR re-auth with OAuth
3. Server queues: DeletionJob { user_id, requested_at }
4. 30-day hold: user receives "account scheduled for deletion" email
   - During hold: user can cancel by logging back in
   - During hold: account is suspended (cannot post, cannot be followed)
5. After 30 days: DeletionJob executes
   - DELETE FROM users WHERE id = $1  (cascade handles children)
   - Posts: UPDATE posts SET user_id = null, author_name = '[deleted]'
   - Any active sessions for this user_id are invalidated
6. Confirmation email sent to the address on file (final action before purge)
```

### Account suspension (distinct from deletion)

Accounts can be suspended by `platform_mod` or `administrator` without deletion. Suspension is a `user_metadata` entry:

```json
{ "key": "suspension", "value": { "suspended": true, "reason": "...", "suspended_by": "uuid", "suspended_at": "..." } }
```

A suspended user can log in but cannot post, comment, or follow. They see a banner explaining their status.

---

## Username Rules

### Constraints

| Rule | Value | Rationale |
|---|---|---|
| Minimum length | 3 characters | Prevents trivially short handles |
| Maximum length | 30 characters | Fits cleanly in UI at all screen sizes |
| Allowed characters | `a-z`, `0-9`, `_` (underscore) | No hyphens (ambiguous in URLs), no dots (email confusion) |
| Case | Stored lowercase, displayed lowercase | No case-sensitivity edge cases |
| Leading/trailing underscores | Not allowed | `_username_` looks like a mistake |
| Consecutive underscores | Not allowed | `user__name` looks broken |
| Must start with | Letter (`a-z`) | Cannot start with a digit |

### Regex

```
^[a-z][a-z0-9_]{1,28}[a-z0-9]$
```

This ensures: starts with letter, ends with letter or digit, 3–30 chars total, only allowed chars, no leading/trailing underscores (enforced by the end-char rule plus no consecutive underscores check in application logic).

### Reserved words

The following usernames are reserved at the system level and cannot be claimed by any user. Enforced via a `reserved_usernames` lookup table seeded at migration time.

```sql
CREATE TABLE reserved_usernames (
  username TEXT PRIMARY KEY
);
```

**Seed list (non-exhaustive — extend as needed):**

```
admin, administrator, api, app, auth, billing, blog, cdn, community,
communities, dashboard, dev, docs, email, explore, feed, grassroots,
help, home, login, logout, me, media, mod, moderator, notifications,
oauth, onboarding, policy, privacy, profile, register, root, search,
security, settings, signup, static, status, support, system, team,
terms, trending, user, users, www
```

### Mutability

- Usernames are **freely changeable for the first 30 days** after account creation.
- After 30 days, username changes are **locked**. A `platform_mod` or `administrator` can unlock on request.
- The old username is **not immediately available** for others to claim — it enters a 14-day hold to prevent impersonation of recently-departed handles.

```sql
CREATE TABLE username_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  released_at  TIMESTAMPTZ,     -- when it becomes claimable again
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Progressive Profiling

### What is captured at signup

The minimum viable identity. Nothing that can be deferred is required at this step.

| Field | Table | Required at signup |
|---|---|---|
| Email | `users` | ✅ Yes |
| Password (or OAuth) | `auth_providers` | ✅ Yes |
| Username | `users` | ✅ Yes |
| Display name | `user_profiles` | ❌ No — defaults to username |
| Bio | `user_profiles` | ❌ No |
| Avatar | `user_profiles` | ❌ No — initials fallback in UI |
| Location | `user_profiles` | ❌ No |
| Website | `user_profiles` | ❌ No |
| Headline | `user_profiles` | ❌ No |
| Interests/tags | `user_metadata` | ❌ No |
| Notification prefs | `user_metadata` | ❌ No — defaults applied |

**For Google OAuth signups:** `display_name` and `avatar_url` are pre-populated from the Google profile. `user_profiles.profile_complete` may be `true` immediately if all three anchor fields are set.

### Onboarding flow (post-signup)

```
Step 1 — Complete your profile
  Prompt: display_name, headline, avatar upload
  Skip allowed: yes

Step 2 — Pick your interests
  Prompt: select AI builder tags (nextjs, llms, agents, etc.)
  Stored in: user_metadata key 'ai_builder_tags'
  Skip allowed: yes

Step 3 — Follow some people
  Prompt: suggested follows based on tags
  Skip allowed: yes

Step 4 — Write your first post (optional nudge)
  Not a gate. Shown as a feed empty-state CTA.
```

Progress tracked in `user_metadata` key `onboarding_step`. Once all steps are either completed or skipped, the key is removed.

### Profile completeness nudges

`user_profiles.profile_complete` is `false` until `display_name`, `avatar_url`, and `bio` are all non-null. While `false`:
- A persistent banner appears on the profile page: "Your profile is incomplete. Add a bio and photo to help people find you."
- No nudge appears in the feed — the feed is about content, not onboarding.

---

## Scalability Notes

### Phase 1 (0–10k users)
The schema as defined is sufficient. No partitioning, no read replicas needed. Supabase's managed Postgres handles this range without tuning.

### Phase 2 (10k–500k users)
- Add a read replica for `user_profiles` queries (high-read, low-write).
- Cache `user_profiles` in Redis (TTL: 60s) to reduce DB load on feed rendering.
- Cache `user_roles` in Redis (TTL: 300s) for permission checks.
- Monitor `auth_providers` query patterns — add composite index if needed.

### Phase 3 (500k+ users)
- Consider partitioning `user_metadata` by `user_id` hash if row count is high.
- Evaluate read path for `username_history` if claiming logic becomes hot.
- Supabase Realtime subscriptions for notification delivery at scale require a dedicated channel strategy — scope by `user_id` to avoid fan-out storms.

---

## Naming Conventions

All identifiers follow the conventions established in `ARCHITECTURE.md`:

| Type | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural nouns | `user_profiles`, `auth_providers` |
| Columns | `snake_case` | `display_name`, `granted_by` |
| Indexes | `idx_{table}_{column(s)}` | `idx_users_email` |
| Constraints | `{table}_{description}` | `auth_providers_email_unique` |
| Enums | `snake_case` type name, `snake_case` values | `platform_role`, `'community_mod'` |
| Foreign keys | Reference column named `{singular_table}_id` | `user_id`, `granted_by` |
| Timestamps | `{event}_at`, always `TIMESTAMPTZ` | `created_at`, `expires_at` |

---

## Open Decisions

These are not yet resolved and should be addressed before the auth implementation begins:

| Decision | Options | Recommendation |
|---|---|---|
| Email verification strictness | Hard gate (block all access) vs. soft gate (can browse, can't post) | Soft gate — improves activation |
| OAuth account linking UX | Silent (automatic) vs. explicit (user confirms) | Explicit — prevents confusion |
| Username change request flow | Self-serve via support ticket vs. mod-panel toggle | Mod-panel toggle — lower friction |
| Pro member billing integration | Stripe webhook updates `user_roles` vs. Supabase Edge Function | Stripe webhook — more reliable |
