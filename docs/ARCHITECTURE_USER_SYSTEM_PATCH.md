## User System

> Full detail: see `USER_SYSTEM.md`. This section summarises the decisions and schema as they relate to the broader architecture.

### Five-table schema

```
users              ← Anchor identity. UUID PK, email, username.
auth_providers     ← Decoupled login methods (email/password + Google OAuth).
user_profiles      ← Public profile data. Progressive — nullable fields.
user_metadata      ← JSONB key-value store for internal/preference data.
user_roles         ← Many-to-many role assignments with scope and expiry.
```

No password fields on `users`. Auth credentials live exclusively in `auth_providers`. This allows additional OAuth providers (GitHub, Apple) to be added without touching the `users` table.

### Role architecture

Five tiers: `member`, `pro_member`, `community_mod`, `platform_mod`, `administrator`. Stored in `user_roles` join table — not as a column on `users`. Supports multi-role, community-scoped assignment, time-limited grants, and a full audit trail (`granted_by`, `granted_at`, `expires_at`).

### Permission enforcement (three layers)

1. **RLS** — Supabase Row Level Security at the database layer. Cannot be bypassed by application code.
2. **Server check** — Route Handler / Server Action validates roles before executing any mutation.
3. **UI gate** — Conditional rendering based on server-provided role context. UX only, not security.

Role data is cached in Redis (TTL: 5 min) to prevent repeated DB reads on permission-heavy pages.

### Auth flow

**Email/password:** standard credential signup → email verification → JWT session via Supabase Auth.

**Google OAuth:** PKCE flow via Supabase. On callback, match by `provider_uid` (Google `sub`). If email matches an existing account, link the provider to that account. Never create duplicate users for the same email across providers.

### Account deletion

Hard-delete. On `DELETE FROM users`: auth, profile, metadata, roles, follows, and reactions cascade. Posts set `user_id = null` and display as `[deleted]` to preserve thread context. A 30-day hold period between request and execution allows cancellation.

### Username rules

3–30 chars · `a-z`, `0-9`, `_` only · must start with a letter · no leading/trailing/consecutive underscores · lowercase stored and displayed · reserved words blocked via `reserved_usernames` lookup table · 30-day free-change window after signup, locked thereafter.

### Progressive profiling

Only email, password/OAuth, and username are required at signup. Display name, bio, avatar, headline, location, website, and interests are captured through a post-signup onboarding flow. Completion tracked via `user_profiles.profile_complete` and `user_metadata.onboarding_step`.

### Caching layer (user data)

| Data | Cache key | TTL |
|---|---|---|
| User profile | `profile:{user_id}` | 60s |
| User roles | `roles:{user_id}` | 300s |
| Username → user_id | `username:{username}` | 120s |

Cache is invalidated on write (profile update, role grant/revoke, username change).
