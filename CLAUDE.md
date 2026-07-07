# CLAUDE.md — Grassroots Platform

> Commit this file as `CLAUDE.md` at the **root of `grassrootsonline/grassroots-platform`**.
> It is read automatically on every Claude Code run so the rules below never need re-explaining.

You are building **Project Grassroots**, the AI builders' social platform. Two documents are authoritative and override anything you'd otherwise assume:

- **Engineering** → `docs/ARCHITECTURE.md` (Next.js 15 App Router, Supabase/Postgres, Drizzle, Upstash Redis, Framer Motion). Stack, schema, API, caching, permissions, and coding standards live there.
- **Visual style** → `packages/design-system/CLAUDE.md`. That file is binding. If visual guidance ever conflicts, `packages/design-system/CLAUDE.md` wins on style and `ARCHITECTURE.md` wins on engineering.

## Design system — always the source of truth

Never invent colors, type, spacing, or components. Derive everything from `packages/design-system/`:

- Tokens: `tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css`
- Components: `components/components.css`, `components-new.css`
- Motion: `motion.css` — all durations and easing live here
- Responsive: `responsive.css` — breakpoints, bottom nav, sheet pattern
- Entry point: `index.css` imports tokens + components in the correct order

Non-negotiables from the guide: sentence-case copy; Inter weights **400/500 only**; DM Serif Display for display moments only; **sage `#6B8C6A` is the only interactive color — never introduce blue**; all borders **0.5px**; cards have no shadow (shadow is for modals/toasts only); **Tabler outline icons only**, never `-filled`; no emoji; dark mode flips via tokens (never hand-author overrides).

## CSS approach — native CSS, no utility framework

This project uses **native CSS** with design system tokens. There is no Tailwind or other utility-class library.

- **`apps/web/src/styles/globals.css`** imports the design system directly and adds platform-level layout helpers (`.container-platform`, `.container-feed`, `.skeleton`, etc.). Do not import or vendor design system files anywhere else.
- **CSS Modules** (`*.module.css` co-located with components) for all component-scoped styles. Reference design system tokens via `var(--color-ink)`, `var(--space-md)`, `var(--border-default)` etc. **Hardcoded values are never allowed** — no raw px, hex, rgba, or numeric literals in any CSS Module or component style.
- **Design system component classes** (`.btn`, `.btn-primary`, `.feed-card`, `.avatar`, `.tab`, `.input`, etc.) are available globally. Use them in React `className` props directly.
- **Inline `style` prop** for genuinely dynamic values only (e.g. `style={{ width: progress + '%' }}`).
- **No Tailwind classes** anywhere in the codebase. `tailwindcss` and `@tailwindcss/postcss` have been removed.

### Token requests — stop before hardcoding

If a component requires a value that has no design system token, **do not hardcode it**. Stop and raise a token request first:

1. Check `packages/design-system/tokens/` — the token may exist under a name you haven't encountered.
2. If no token covers the need, open a new handoff document in `handoffs/` addressed to `claude-design`, describing the component, the value needed, and why no existing token fits.
3. Wait for the token to be defined and merged before implementing the style.

The only exception is `font-size: 16px` on text inputs — this is a browser compatibility requirement (prevents iOS Safari zoom on focus) and must remain hardcoded.

## Design handoffs

Visual prototypes live under `design-handoffs/<feature>/prototypes/` — treat them as read-only references. Amendment files in that folder are historical; the current design system state is `packages/design-system/` and its `CHANGELOG.md`.

To implement a design change:
1. Read `packages/design-system/CLAUDE.md` for style rules; open the relevant prototype in `design-handoffs/<feature>/prototypes/` for look and behavior.
2. Build it for real per `docs/ARCHITECTURE.md`: RSC by default, Server Actions for writes (`requireSession()` → `checkPermission()` → Zod → mutate → `revalidateTag()`), layout-accurate `*Skeleton`s, optimistic UI, the Framer Motion specs.
3. New design system changes arrive as advisor handoffs in `handoffs/` — read those documents for scope and implementation steps.

## Data & environments — seeded vs. live

This is a hard rule. The app reads data through a single switchable data layer, gated by environment:

- **`feature/*` and `development` branches → seeded data, no live services.** Set `NEXT_PUBLIC_APP_ENV=development` (or `preview`) and `USE_SEED_DATA=true`. The data layer reads from a deterministic seed module (`packages/db/seed` / `lib/data/seed.ts`) instead of Supabase. No real auth, no Redis, no realtime — auth is a seeded session, mutations update in-memory/optimistic only. Render the **"Development build · seeded data"** banner (see the prototype) whenever `USE_SEED_DATA` is true.
> ⚠ **Staging is not yet operational (as of 2026-07-04).** The project is provisioned and schema is applied, but Vercel↔Supabase environment variable wiring isn't working end-to-end — see handoff 039's status update for the diagnostic history. Until this callout is removed, treat `main` as receiving merges directly from `development` (temporary reversion — see the Git workflow section below), not from `staging`.

- **`staging` branch → closed testing, live backend, isolated from production.** Set `NEXT_PUBLIC_APP_ENV=staging` and `USE_SEED_DATA=false`. Connects to a **separate Supabase project** provisioned specifically for staging — same schema (kept in sync via the same Drizzle migrations applied to both projects), completely isolated data. Real auth, real Postgres, no seed data — but nothing here is production traffic or production user data. Access should be gated (Vercel Deployment Protection or equivalent) since this is closed testing, not a public preview.
- **`main` → production, live backend only.** Receives merges from `staging` only — `development` and `feature/*` branches never merge directly into `main`. `NEXT_PUBLIC_APP_ENV=production`, `USE_SEED_DATA=false`. Connects to the real, production Supabase project (auth, Postgres, Storage, Realtime) and Upstash Redis once wired. **Never renders seeded data and never shows the dev banner.** Seed modules must be tree-shaken / guarded out of the production bundle.

Implement this as one interface (e.g. `getDataClient()`) with two implementations (`SeedDataClient`, `SupabaseDataClient`) selected by the env flag — so feature work is fully exercisable on Vercel previews with realistic data, and `main` is the only branch wired to production services. Keep the seed dataset in sync with the prototypes' content so previews match the design.

## Git workflow (from ARCHITECTURE.md §15.4)

- Branch model: `main` (production, live) ← `staging` (closed testing, live, isolated Supabase project) ← `development` (integration, seeded) ← `feature/<short-description>` (seeded). Each branch gets its own Vercel deployment/environment.
- **Interim, while staging is paused (see callout above):** `development` merges directly into `main`, same as before the staging tier was introduced. Automated or bot-authored PRs (e.g. Vercel Agent integrations) that default to targeting `main` should be retargeted to `development` first, so at least one review step happens before `main` — not to `staging`, which isn't functional yet.
- **Once staging is operational again:** `development` merges up into `staging` for a real-backend check before anything reaches production; `staging` merges up into `main` only after that check passes. Bot-authored PRs should retarget to `staging` at that point, not `development`.
- Work on a `feature/*` branch off `development` (or directly on `development` for small changes). **Push and stop — do not merge to `main`, do not open a PR.** The maintainer reviews the Vercel preview and merges manually.
- **Before starting any task, verify the working branch is up to date.** Run `git status` to confirm no unexpected changes, then `git pull origin <branch>` to pull latest from the remote. If the branch is behind, pull before touching any files. Never implement on a stale branch.
- **Any new page route (`page.tsx` under `apps/web/src/app`) must be explicitly classified in `apps/web/src/middleware.ts` before merging** — added to `PUBLIC_PATHS` if it should be readable by logged-out or non-active visitors, or to `GATED_PATHS` if it requires an active session. This is enforced by the "Check route access classification" GitHub Actions workflow (`.github/workflows/check-routes.yml`, running `pnpm check:routes`), which fails the PR/push if a route isn't accounted for in either list — it previously ran as a local `husky` pre-commit hook, but that broke commits from GUI git clients (e.g. GitHub Desktop on Windows resolving `bash.exe` to an uninstalled WSL distro instead of Git's own shell) and has been removed in favor of enforcing this in CI instead. Do not bypass the check by skipping CI — if the check is wrong, fix `scripts/check-route-access.mjs`, don't skip it.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `perf:`, `docs:`). Keep CI green (lint + type-check + tests). Direct pushes to `main` are prohibited.
- **Every commit must have both a title and a body.** The title follows Conventional Commits format. The body explains what changed and why — one or more sentences, written for a reviewer seeing only the commit log. A commit with a title only is not acceptable.

  ```
  fix: replace hardcoded shadow value in dropdown-menu

  --shadow-dropdown token was missing from spacing.css after the Amendment 07
  merge. Restoring the Amendment 06 two-layer value ensures dropdowns have
  correct elevation in light mode. Dark-mode override in colors.css was unaffected.
  ```

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
