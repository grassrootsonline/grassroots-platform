# 004 — Apply user system documentation patches

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `docs` |
| **Branch** | `chore/apply-user-system-patches` |
| **Depends on** | none |

---

## Problem

Claude Design produced two patch files in `docs/` that document the user and auth system. They have not been integrated into the canonical docs yet:

- `docs/ARCHITECTURE_USER_SYSTEM_PATCH.md` — a "User System" subsection for `docs/ARCHITECTURE.md`
- `docs/CLAUDE_USER_SYSTEM_PATCH.md` — a "User data conventions" section for the root `CLAUDE.md`

Both files need to be spliced into their target documents and then deleted. This is documentation housekeeping — no functional code changes.

---

## Background

`docs/USER_SYSTEM.md` already exists and contains the full detail. The patch files add:
1. A summary section in `docs/ARCHITECTURE.md` that points to `USER_SYSTEM.md` and captures the schema decisions at the architecture level.
2. Practical conventions in root `CLAUDE.md` telling Claude Code how to handle user data fields, avatar fallback, role-gated UI, deleted users, and form copy.

Going forward, Claude Design should follow `packages/design-system/CONTRIBUTING.md` and edit docs files directly rather than producing patch files in `docs/`.

---

## Affected files

**Edited:**
- `docs/ARCHITECTURE.md` — insert user system subsection
- `CLAUDE.md` (root) — append user data conventions section

**Deleted:**
- `docs/ARCHITECTURE_USER_SYSTEM_PATCH.md`
- `docs/CLAUDE_USER_SYSTEM_PATCH.md`

---

## Token dependencies

None.

---

## Implementation steps

### Step 1 — Insert User System into ARCHITECTURE.md

Open `docs/ARCHITECTURE.md`. Find the section divider between §5 Database Schema and §6 Performance Architecture. It looks like this (approximately line 440):

```
...last sql block in §5...
);
```

---

## 6. Performance Architecture
```

Insert the following block **between** the closing `---` of §5 and `## 6. Performance Architecture`. Place it as a new subsection `### 5.3 User system`, adjusting the heading level of the patch content accordingly. The patch source starts with `## User System` — downgrade that to `### 5.3 User system`, and all sub-headings in the patch (`###` → `####`).

Insert this exact content (heading levels already adjusted):

```markdown
### 5.3 User system

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
```

Commit: `docs: add §5.3 user system to ARCHITECTURE.md`

---

### Step 2 — Append User data conventions to root CLAUDE.md

Open `CLAUDE.md` at the repo root. Append the following section at the **end of the file**, after the Git workflow section. Add a blank line before the section.

```markdown

## User data conventions

This section tells Claude Code how to handle user data correctly when building UI, server actions, or queries.

### What fields exist and where

When rendering user information in the UI, always know which table each field comes from:

| Field | Source table | Notes |
|---|---|---|
| `user_id` | `users.id` | UUID. Never display raw in UI. |
| `username` | `users.username` | Handle shown in URLs: `/u/username` |
| `email` | `users` | Never render in public-facing UI |
| `display_name` | `user_profiles.display_name` | Shown on posts, cards, profiles |
| `bio` | `user_profiles.bio` | Max 280 chars |
| `avatar_url` | `user_profiles.avatar_url` | May be null — use initials fallback |
| `headline` | `user_profiles.headline` | Short tagline. Max 100 chars. |
| `roles` | `user_roles` (join) | Array of role objects with scope |

### Avatar fallback pattern

`avatar_url` is null until the user uploads a photo. Always implement the initials fallback:

```tsx
// Derive initials from display_name, falling back to username
function getInitials(displayName?: string, username?: string): string {
  const name = displayName || username || '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// In JSX
{avatarUrl ? (
  <img src={avatarUrl} alt={displayName} />
) : (
  <div className="avatar avatar-md">{getInitials(displayName, username)}</div>
)}
```

### Displaying names on posts and cards

Always prefer `display_name` over `username` for human-facing display. Show `username` as a secondary detail (e.g. `@handle` below the display name) or in the URL only.

```tsx
// Correct
<div className="feed-card-name">{displayName || username}</div>
<div className="feed-card-time">@{username} · 2 hours ago</div>

// Wrong — never use user_id as display text
<div className="feed-card-name">{userId}</div>
```

### Role-gated UI rendering

Roles come from the server. Never derive role gates from client-side state alone. Pass role context from server components to client components as props.

```tsx
// Server component — fetch roles server-side
const roles = await getUserRoles(session.userId);
const isMod = hasRole(roles, 'community_mod', communityId);

// Pass to client component
<PostActions postId={post.id} canModerate={isMod} />
```

Role-dependent UI elements:
- Moderation controls (pin, remove, lock): visible only to `community_mod` in that community, `platform_mod`, or `administrator`.
- Admin panel link: visible only to `administrator`.
- Pro badge: visible when user has active `pro_member` role.

### Deleted users

When a post's `user_id` is null (account deleted), render the author as `[deleted]`:

```tsx
<div className="feed-card-name">
  {author ? author.displayName : '[deleted]'}
</div>
```

Never throw or error when `user_id` is null on a post. Orphaned posts are a valid state.

### What never goes in the UI

- Raw UUIDs (`user_id`, `auth_provider.id`)
- Email addresses in any public-facing component
- Password fields or password_hash values
- `suspended` status details (show generic "account unavailable" only)
- Raw `user_metadata` values (these are internal)

### Form copy for auth screens

Follow the platform writing style:

| Context | Copy |
|---|---|
| Signup CTA | "Create account" |
| Login CTA | "Sign in" |
| Google button | "Continue with Google" |
| Email verification prompt | "Check your inbox to verify your email." |
| Username taken error | "That username is taken. Try another." |
| Email taken error | "An account with that email already exists. Sign in instead?" |
| Password too short | "Password must be at least 10 characters." |
| Account deletion confirm | "This will permanently delete your account after 30 days." |
```

Commit: `docs: add user data conventions to root CLAUDE.md`

---

### Step 3 — Delete the patch files

```bash
git rm docs/ARCHITECTURE_USER_SYSTEM_PATCH.md
git rm docs/CLAUDE_USER_SYSTEM_PATCH.md
```

Commit: `chore: delete applied user system patch files`

---

## Known conflict — do not resolve in this handoff

After inserting §5.3, there will be a documented contradiction inside `docs/ARCHITECTURE.md`:

- **§5.2 `users` table** has `role user_role NOT NULL DEFAULT 'member'` — the old single-role model.
- **§5.3 User system** says roles live in a separate `user_roles` join table — the new multi-role model.

**Do not touch §5.2 in this handoff.** Reconciling the schema definition is a deliberate architectural decision that needs a separate migration handoff. Leave both sections as-is and add this comment at the top of §5.3 to make the conflict visible:

```markdown
> ⚠ **Schema note:** The `users` table in §5.2 still reflects the legacy single-role model (`role` column). The five-table model here supersedes it. §5.2 will be updated when the migration handoff is issued.
```

---

## Verification

- [ ] `docs/ARCHITECTURE.md` contains `### 5.3 User system` between §5 and §6.
- [ ] The five-table schema, role architecture, auth flow, account deletion, username rules, progressive profiling, and caching table are all present in §5.3.
- [ ] `CLAUDE.md` (root) ends with `## User data conventions` and all subsections: fields table, avatar fallback, display names, role-gated UI, deleted users, what never goes in the UI, form copy.
- [ ] `docs/ARCHITECTURE_USER_SYSTEM_PATCH.md` no longer exists.
- [ ] `docs/CLAUDE_USER_SYSTEM_PATCH.md` no longer exists.
- [ ] `docs/USER_SYSTEM.md` is untouched.
- [ ] The app builds without error (`pnpm type-check`). These are doc-only changes — no import paths affected.
