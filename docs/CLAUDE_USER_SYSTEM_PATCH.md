---

## User data conventions

This section tells AI assistants how to handle user data correctly when building UI, server actions, or queries for Grassroots.

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

Always prefer `display_name` over `username` for human-facing display. Show `username` as a secondary detail (e.g., `@handle` below the display name) or in the URL only.

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
