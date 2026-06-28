# Handoff: Grassroots — Core Social MVP

## Overview

This package contains the UI design for the first slice of **Project Grassroots**, the AI builders' social platform. It covers the surfaces a logged-out visitor and a logged-in member touch first: the **landing/auth page**, the **home feed**, an **individual profile**, a **post-detail thread**, and the **create-post composer**, plus the persistent **navigation** and **notifications** that frame them.

It is the design-and-spec half of the work. Implementation happens in your repo against the stack defined in `Grassroots — Principal Architecture Document` (Next.js 15 App Router, Supabase/Postgres, Drizzle, Tailwind 4 + Grassroots design tokens, Framer Motion). Every screen below is cross-referenced to the tables, Server Actions, and rules in that document so a developer who wasn't in the design conversation can build it.

## About the design files

The files in `prototypes/` are **design references created in HTML** — self-contained, offline-openable prototypes that show the intended look and behavior. **They are not production code to copy.** They were built with a standalone HTML component runtime purely to make the designs interactive; none of that runtime should ship.

The task is to **recreate these designs in the Grassroots codebase** using its established patterns: React Server Components by default, Server Actions for writes, the Grassroots component library (`components/ui/*`), Tailwind classes mapped to the design tokens, and Framer Motion for the motion specs. Treat the HTML as the visual + interaction contract; treat the architecture document as the implementation contract.

Open each file directly in a browser:

- `prototypes/01-landing.html` — logged-out landing page + sign-up / log-in modal.
- `prototypes/02-app-feed-profile-thread-composer.html` — the authenticated app: feed, profile, thread, composer, notifications. **This is the primary build target.**
- `prototypes/03-wireframe-explorations.html` — a pannable canvas of the layout variations we explored (feed ×3, profile ×3, composer, thread). Reference only — variation **A** of each was chosen and is what `02` implements.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, radii, and interactions are all specified and come straight from the bound Grassroots design system. Recreate the UI pixel-accurately using the codebase's existing component library and token config — do not re-derive values by eye. Exact tokens are listed in [Design Tokens](#design-tokens).

One caveat: the prototypes render in light or dark automatically via `prefers-color-scheme`. If a screenshot looks dark, that is the dark-mode token set, not a different design. Don't hand-author dark-mode overrides — the tokens flip themselves.

---

## Engineering setup (read this first, Claude Code)

You are working across **two repositories in the `grassrootsonline` org**:

- **`grassrootsonline/grassroots-design-system-core`** (default branch `main`) — the source of truth for visual style. CSS-first: `CLAUDE.md` (the binding style guide — read it in full and obey it), `tokens/{colors,typography,spacing}.css`, `components/components.css`, `index.css`.
- **`grassrootsonline/grassroots-platform`** (default branch `main`) — the application you are building in (Next.js 15 monorepo per `ARCHITECTURE.md`). **All your work lands here.**

### Step 1 — Pull in the design system

Read the design-system repo and make it the live styling foundation; do not eyeball values from the prototype HTML. Choose the integration that fits the platform repo's current state:

- **Preferred — vendor the tokens, recreate the components.** Port `tokens/{colors,typography,spacing}.css` into the platform's token layer (`apps/web/src/styles/tokens.css`) and wire the Tailwind 4 config so utilities map to those CSS variables (architecture §12.3 — no hard-coded hex). Recreate the components described in `components/components.css` as real React components in `packages/ui` (Radix primitives + the Grassroots styles), since the design-system repo ships CSS, not React.
- **Alternative — keep it linked for easy sync.** Add the design-system repo as a git submodule (or a pnpm workspace / git dependency) and `@import` its `index.css`. Use this if the team wants token changes to flow without re-vendoring.

Either way, **`CLAUDE.md` in the design-system repo is binding**: sentence-case copy, Inter weights 400/500 only, DM Serif Display for display moments, sage as the only interactive color (never blue), 0.5px borders, no card shadows, Tabler outline icons only. Where this README and that `CLAUDE.md` agree, follow them; if they ever conflict, the design-system `CLAUDE.md` wins on visual style and `ARCHITECTURE.md` wins on engineering.

### Step 2 — Data layer: seeded on feature/dev, live on main

The app reads all data through **one switchable data layer**, gated by environment — so feature and development branches are fully usable on Vercel previews without touching live services, and `main` is the only branch wired to the backend.

- **`feature/*` + `development` → seeded, no services.** `NEXT_PUBLIC_APP_ENV=development|preview`, `USE_SEED_DATA=true`. Reads from a deterministic seed module instead of Supabase; auth is a seeded session; mutations are in-memory/optimistic only. Render the **"Development build · seeded data"** banner (shown in prototype `02`) whenever seeding is on.
- **`main` → production, live only.** `NEXT_PUBLIC_APP_ENV=production`, `USE_SEED_DATA=false`. Real Supabase (auth, Postgres, Storage, Realtime) + Upstash Redis. **Never renders seeded data, never shows the banner**; seed modules are guarded out of the production bundle.

Implement as one interface (`getDataClient()`) with two implementations (`SeedDataClient`, `SupabaseDataClient`) selected by the flag. Keep the seed dataset's content in sync with these prototypes so previews match the design. The `seedMode` toggle in prototype `02` mirrors this flag.

### Step 3 — Branch, build, push (do not merge)

Branch model: **`main` (production) ← `development` (integration, seeded) ← `feature/<x>` (seeded)**. Each branch gets its own Vercel preview. Do all implementation on a feature branch off `development` and push it. **Do not merge to `main` and do not open a PR** — the maintainer reviews the preview and merges manually.

```bash
# in the grassroots-platform repo, branch off an up-to-date development
git checkout development && git pull
git checkout -b feature/core-social-mvp

# ... implement the screens below, committing in logical chunks ...
git add -A
git commit -m "feat(feed): home feed with optimistic reactions"
git commit -m "feat(profile): profile header, tabs, and post list"
git commit -m "feat(auth): landing page and auth modal"
# ... etc.

git push -u origin feature/core-social-mvp
# stop here — leave the branch for manual review.
# you (maintainer) merge feature → development, verify the combined preview,
# then development → main when ready.
```

Follow the repo's git rules from `ARCHITECTURE.md` §15.4: Conventional Commits (`feat:`, `fix:`, `chore:`…), branch name `feature/{short-description}`, and keep CI green (lint + type-check + tests). If a ticket ID exists, use `feature/{ticket-id}-core-social-mvp`.

---

## Screens / Views

### 1. Landing page (`/`, route group `(public)` / `(auth)`)

**Purpose.** The root of the domain. A logged-out visitor lands here. Per the product flow: a valid cached session should redirect straight to the feed/profile (handle in `middleware.ts` — if `auth.uid()` resolves, `redirect('/feed')`); everyone else sees this marketing surface with sign-up / log-in entry points.

**Layout.** Single column, content capped at **960px** (`--content-max-width`), centered.
- **Sticky header** (60px tall, `--color-surface` bg, 0.5px bottom border): wordmark left (DM Serif Display, 22px); `Log in` (ghost) + `Sign up` (primary) buttons right, `sm` size, 10px gap.
- **Hero** (72px top padding): two-column grid, 56px gap, vertically centered.
  - Left: uppercase sage eyebrow "A home for builders" → display headline "Share what you're building." (DM Serif Display, 52px, weight 400, line-height 1.04, letter-spacing −0.01em) → 17px body paragraph (`--color-ink-soft`, max 420px) → two CTAs (`Create your account` primary `lg`, `Log in` secondary `lg`) → 13px secondary subtext.
  - Right: a product-preview card (`--color-surface`, 0.5px border, 10px radius, **no shadow**) with a faux header row and two real `FeedCard`s inside on a `--color-canvas` panel.
- **Value props**: three-column grid (40px gap) above a 0.5px top divider; each is a 22px sage Tabler icon + 17px medium title + 14px body.
- **Closing CTA band**: a centered card (56px/40px padding) — 34px serif heading, 15px body, one primary `lg` button.
- **Footer**: 0.5px top border, `--color-surface` bg; wordmark + four ghost links (`About`, `Communities`, `Guidelines`, `Privacy`) + 13px muted copyright.

**Auth modal.** Opens from any of the four entry buttons. Scrim `rgba(28,43,26,0.32)`; panel 420px max, `--color-surface`, 16px radius, `--shadow-overlay`, 28px padding, anchored 11vh from top. Title (serif 22px) + sub. Toggles between two modes:
- **Sign up**: Display name + Email + Password `Input`s, primary `Create account`, footer "Already have an account? Log in".
- **Log in**: Email + Password, primary `Log in`, footer "New to Grassroots? Create one".
Submitting closes the modal and shows a `Toast` ("Account created." / "Logged in."). In production, wire the submit to Supabase Auth (OAuth GitHub/Google + magic link per §14.1) — the prototype only fakes success.

### 2. Home feed (`/feed`, route group `(platform)`)

**Purpose.** The default authenticated surface. Read the feed, compose, react, open threads, follow people/projects, navigate.

**Layout.** Three columns inside the **960px** app wrapper, 24px gap, rails are `position: sticky` (top 80px).
- **Persistent `Navbar`** (sticky, top): wordmark, primary nav links, notification bell, avatar. The bell toggles the notifications panel.
- **Left rail (188px).** Primary nav as a vertical list (`Feed` active, `Explore`, `Projects`, `Communities`, `Saved`) — each a 18px Tabler icon + 14px label; the active item uses `--color-accent-subtle` fill + ink text + sage icon. Below: an uppercase "Your projects" label + project shortcuts (16px sage `circle-dot` + name). Bottom: a current-user chip (avatar + name + "View profile") that routes to the profile.
- **Center column (max 560px).**
  - **Composer trigger card**: avatar + a pill-shaped button reading "Share what you're building…" (`--color-canvas` fill, 0.5px strong border, 999px radius) + a primary icon-only `+` button. Both open the composer modal.
  - **Feed list**: vertical stack of `FeedCard`s, 20px gap.
- **Right rail (212px).** Two cards (`--color-surface`, 0.5px border, 18px padding): **Trending projects** (name + watcher count + Follow/Following button) and **Who to follow** (avatar + name + tagline + Follow/Following button). Follow buttons toggle in place.

**`FeedCard` anatomy** (design-system component — do not rebuild): avatar + author name (14px medium ink) + " · " + timestamp (`--color-secondary`); optional project/community tag rendered as a sage link; body copy at 14px / 1.65 `--color-ink-soft`; an action row of three outline Tabler actions — `heart` + count, `message-circle` + count, `share` + "Share". **The heart never fills** — when liked it turns sage (`--color-accent`) and the count increments. Card hover lifts the border from `--color-border` to `--color-border-strong`.

### 3. Profile (`/profile/[username]`, route group `(platform)`)

**Purpose.** A member's identity + their published activity. (Shown here as the current user's own profile, with an `Edit profile` affordance; for other users this becomes a Follow/Message pair — see prototype `03` profile variation A.)

**Layout.** Single column, max 600px, inside the app shell (left rail persists).
- **Back to feed** text link (sage on hover).
- **Header row**: `xl` avatar (72px) + identity block. Name (serif 24px) over `@username · she/her` (13px secondary). Right-aligned action (`Edit profile` secondary `sm` with `pencil` icon). Below: 14px bio (`--color-ink-soft`, 1.6). Then a stat row — `128 following · 2.3k followers · 4 projects` (17px medium number + 12px secondary label).
- **Tab bar**: `Posts` / `Projects` / `About`, 24px gap, 0.5px bottom border. Active tab is ink + medium + a 2px sage underline; inactive is secondary and shifts to ink on hover. Tabs switch the panel below:
  - **Posts**: `FeedCard` stack (this user's posts only).
  - **Projects**: 2-column card grid; each card = sage `circle-dot` + project name (15px medium), 13px description, then `{n} posts` + collaborator count (12px muted).
  - **About**: a single surface card with a label + prose.

### 4. Post detail / thread (`/feed/[postId]` or modal route)

**Purpose.** Read a single post and its replies; reply.

**Layout.** Single column, max 560px.
- **Back to feed** link.
- The root post as a full `FeedCard` (same actions as in-feed).
- **"Replies" section label** with a hairline rule.
- **Reply list**: lighter than posts on purpose — each reply is `md` avatar + (author medium + " · " + time) + 14px body + a compact action row (`heart` + count, "Reply"). Replies are separated by 0.5px bottom borders, **not** wrapped in cards, so the original post stays the visual anchor.
- **Reply composer**: avatar + a text input (pill, 999px radius) + a primary `sm` `Reply` button. Posting shows a "Reply posted." toast.

### 5. Composer modal (global, opens over feed)

**Purpose.** Create a post, optionally attached to a project.

**Layout.** Same scrim + 16px-radius surface panel as the auth modal, 560px max, anchored 12vh from top.
- Header: "Create post" (serif 18px) + ghost icon-only `x` close.
- Body: avatar + a borderless auto-growing `textarea` ("What are you working on?", 16px, min-height 96px).
- Footer (0.5px top border): left = three muted attachment icons (`photo`, `link`, `code`) + a project `<select>` styled as a sage pill (`No project` / project names); right = primary `sm` `Post`.
- **Posting** prepends the new post to the feed (author = current user, time "Just now", community = chosen project), closes the modal, and shows a "Post published." toast. Empty content is a no-op.

### 6. Notifications panel (global, from navbar bell)

**Purpose.** Surface follows, reactions, comments, mentions, community activity.

**Layout.** A dropdown anchored top-right under the bell: 340px wide, `--color-surface`, 10px radius, `--shadow-overlay`, 8px padding. Header "Notifications" + a sage "Mark all read". Below, a list of `Notification` components — unread rows carry a subtle sage tint; each shows actor text + relative time. Clicking the bell toggles it; clicking the scrim closes it.

---

## Interactions & behavior

| Interaction | Behavior | Production note |
|---|---|---|
| Open composer | `+` / pill / Share-pill → modal | Global modal; route or state |
| Publish post | Prepends to feed, closes modal, toast | `createPost` Server Action (§9.1); optimistic insert via `useOptimistic` (§7.2) |
| Like / react | Heart turns **sage**, count ±1, instant | `reactToPost`; optimistic toggle; reaction realtime channel (§7.1) |
| Comment icon | Opens the thread for that post | Navigate to post detail |
| Share | "Link copied." toast | Copy permalink |
| Follow / unfollow | Button flips `Follow` (primary) ⇄ `Following` (secondary), in place | `followUser` / `followProject`; optimistic; follower count update |
| Profile tabs | Switch Posts/Projects/About panel | Client state; data per tab |
| Nav (rail, chip, back-links) | Switch view | App Router navigation; persistent shell layout |
| Notifications bell | Toggle dropdown | Supabase Realtime on `notifications` filtered by `recipient_id` (§7.1) |
| Reply | "Reply posted." toast | `createComment`; optimistic append |
| Auth submit | Closes modal, success toast | Supabase Auth (§14.1) |

**Motion** (from architecture §12.2 — apply these, not the prototype's CSS): modal = scale `0.95→1` + fade, 150ms ease-out, backdrop fades separately; feed card entry = staggered children `0.05`, fade + 8px up; like = spring `scale 1.25→1`; button press = `whileTap scale 0.97`; page transitions = fade + 12px Y, 200ms ease-out at the layout level; notification bell bounce on arrival. All other transitions are **120ms ease** on background/border/opacity/color only — no bounces or decorative loops.

**Loading.** Every data-driven component needs a layout-accurate `*Skeleton` (architecture §6.4, §12.4) — never spinners. Route segments use `loading.tsx`; feed uses `IntersectionObserver` infinite scroll loading 300px early; new feed items enter with opacity only (no position shift).

**Empty states.** Use the `EmptyState` component with an invitation, never an apology — e.g. quiet feed → "Your feed is quiet" + "Follow people and communities to see their posts here."

---

## State management

Map the prototype's local React state to the production data layer:

| Prototype state | Production source |
|---|---|
| `posts[]` (feed/profile) | Server Component fetch → Redis `feed:home:{user_id}:{page}` (§6.1–6.2), cursor pagination |
| `post.liked` / `likes` | `post_reactions` row existence + `posts.reaction_count`; optimistic via `useOptimistic` |
| `follows{}` | `followers` / `project_followers` tables; optimistic |
| `view` / `profileTab` | App Router route + segment, not component state |
| `composeOpen`, `notifOpen`, `authOpen`, `toast` | Local client state / intercepting routes; toasts via a global toaster |
| `replies[]` | `comments` filtered by `post_id`, threaded by `parent_id` |
| `notifs[]` | `notifications` by `recipient_id`, live via Realtime |

**Write path** (all four mutating interactions): every Server Action is `requireSession()` → `checkPermission()` (§8) → Zod-validate → mutate → `revalidateTag()` (§9.1). Permission gates in the UI (`usePermissions`) are UX only, never the security boundary.

**Data model touchpoints** (architecture §5): feed posts → `posts` (+ `users` author, optional `projects` / `communities`); reactions → `post_reactions` (+ denormalized `reaction_count` via trigger); follows → `followers` / `project_followers`; profile → `users` + counts; thread replies → `comments`; notifications → `notifications`; composer project picker → `projects` owned/followed by the user.

---

## Design tokens

Exact values from the bound Grassroots design system (light mode; dark-mode equivalents flip automatically via `prefers-color-scheme`). **No hard-coded hex in component files** (architecture §12.3) — these must be the Tailwind/CSS-variable token set.

### Color
| Token | Hex | Use |
|---|---|---|
| `--color-ink` | `#1C2B1A` | Primary text, filled buttons, headings |
| `--color-ink-soft` | `#3D3D35` | Body copy, post text |
| `--color-accent` | `#6B8C6A` | **The only interactive color** — focus, links, active, like-active, following |
| `--color-accent-subtle` | `#D5E5D4` | Tint fills: avatar bg, accent badges, active nav |
| `--color-accent-mist` | `rgba(107,140,106,0.12)` | Focus-ring glow |
| `--color-accent-ink` | `#2E5C2C` | Text on accent-subtle fills |
| `--color-canvas` | `#F7F6F4` | Page background |
| `--color-surface` | `#FAFAF8` | Cards, inputs, nav |
| `--color-border` | `#E2DDD7` | Default 0.5px hairline |
| `--color-border-strong` | `#C5C0B8` | Input borders, hover dividers |
| `--color-secondary` | `#8A897F` | Secondary labels, timestamps |
| `--color-muted` | `#A5A49A` | Placeholder, tertiary |
| `--color-danger` | `#C17A5A` | Errors, destructive (warm terracotta — **never hot red**) |
| `--color-warm` | `#7A5C30` | "New" badge text |

**Rule: never introduce blue** for any hover/focus/active. Sage is the single accent; there is no second one.

### Typography
- Families: `--font-display` = **DM Serif Display** (wordmark + 1–2 display moments per page only); `--font-body` = **Inter** (everything); `--font-mono` = Courier New (code).
- **Inter uses only weights 400 and 500** — never 600/700/bold.
- Scale: display 36px (hero can go to 52px) · title 24px · heading 16px/500 · body 14px/400 · small 12px · label 11px/500 uppercase tracked 0.08em.
- Line heights: display 1.1 · title 1.2 · body **1.65** · tight 1.3.

### Spacing & layout
- Scale: 4 / 8 / 12 / 20 / 32 / 48 / 72.
- Feed single-column **max 640px** (we use 560px for the center channel inside the 3-col shell); sidebar 240px; page wrapper **max 960px**. Rails `position: sticky`.

### Radius
4 (badges) · 6 (buttons, inputs) · 10 (cards, panels) · 16 (modals, sheets) · 999 (avatars, pills).

### Borders, focus, elevation
- **All borders 0.5px**, system-wide — never 1px. Weights: default / strong / accent; empty states use 0.5px **dashed**.
- Focus is always a **box-shadow ring** `0 0 0 3px` sage @12% — never a border swap.
- **Cards have no shadow** (hairline borders only). Shadow `0 4px 16px rgba(0,0,0,0.12)` is reserved for **toasts and modals**. Scrim `rgba(28,43,26,0.32)`. No gradients, textures, glassmorphism, or backdrop-blur.

### Voice (apply to all copy)
Sentence case everywhere; verb-first CTAs; no "successfully", no "please", no exclamation marks, no emoji. Errors state what happened + what to do. Empty states are invitations.

---

## Components used (Grassroots design system)

All from the bound library — recreate with the codebase's `components/ui/*`, don't rebuild from raw HTML: `Navbar`, `FeedCard`, `Avatar` (+ `AvatarGroup`), `Button` (primary/secondary/ghost/danger; sm·md·lg; icon-only), `Input` (input/textarea, label/hint/error), `Card`, `Badge`, `EmptyState`, `Toast`, `Notification`. Icons are **Tabler Icons, outline only** (webfont) — never the `-filled` variants, even for active states.

## Assets

No raster/image assets. The wordmark is **type only** (DM Serif Display). Avatars in the prototypes are initials placeholders — production uses `users.avatar_url` / Supabase Storage. Fonts load from Google Fonts (DM Serif Display + Inter); self-host if your CSP requires it.

## Files

- `prototypes/01-landing.html` — landing + auth modal.
- `prototypes/02-app-feed-profile-thread-composer.html` — **primary build target**: feed, profile, thread, composer, notifications.
- `prototypes/03-wireframe-explorations.html` — layout-variation canvas (reference; variation A chosen throughout).
- `README.md` — this document.
- `ARCHITECTURE.md` — the Principal Architecture Document (stack, schema, API, rules) this handoff cross-references.

Source `.dc.html` design files live at the project root (`Grassroots Landing.dc.html`, `Grassroots App.dc.html`, `Grassroots Wireframes.dc.html`) if you want to edit the designs rather than the bundles.

## Scope note

This MVP covers profiles, the feed, posting, reactions/comments, following, navigation, notifications, and auth entry. The architecture document defines four more pillars not yet designed — **Projects** (dedicated pages + update timelines), **Articles** (long-form), **Communities** (member spaces + moderation), and **Messages** (real-time DMs). Those are the natural next design handoffs.
