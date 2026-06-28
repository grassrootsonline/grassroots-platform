# CLAUDE.md — Grassroots Platform

> Commit this file as `CLAUDE.md` at the **root of `grassrootsonline/grassroots-platform`**.
> It is read automatically on every Claude Code run so the rules below never need re-explaining.

You are building **Project Grassroots**, the AI builders' social platform. Two documents are authoritative and override anything you'd otherwise assume:

- **Engineering** → `design-handoffs/<feature>/ARCHITECTURE.md` (Next.js 15 App Router, Supabase/Postgres, Drizzle, Upstash Redis, Framer Motion). Stack, schema, API, caching, permissions, and coding standards live there.
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
- **CSS Modules** (`*.module.css` co-located with components) for all component-scoped styles. Reference design system tokens via `var(--color-ink)`, `var(--space-md)`, `var(--border-default)` etc. — never hardcode values.
- **Design system component classes** (`.btn`, `.btn-primary`, `.feed-card`, `.avatar`, `.tab`, `.input`, etc.) are available globally. Use them in React `className` props directly.
- **Inline `style` prop** for genuinely dynamic values only (e.g. `style={{ width: progress + '%' }}`).
- **No Tailwind classes** anywhere in the codebase. `tailwindcss` and `@tailwindcss/postcss` have been removed.

## Design handoffs

Designs arrive under `design-handoffs/<feature>/` (see that folder's README). To implement one:

1. Read `packages/design-system/CLAUDE.md` + the feature `README.md`; open its `prototypes/` for look and behavior. The HTML prototype is a **reference** — recreate it as React components using design system classes and CSS Modules.
2. Build it for real per `ARCHITECTURE.md`: RSC by default, Server Actions for writes (`requireSession()` → `checkPermission()` → Zod → mutate → `revalidateTag()`), layout-accurate `*Skeleton`s, optimistic UI, the Framer Motion specs.
3. Amendments (`AMENDMENT-*.md` in a feature folder) change only what they describe — keep the diff small.

## Data & environments — seeded vs. live

This is a hard rule. The app reads data through a single switchable data layer, gated by environment:

- **`feature/*` and `development` branches → seeded data, no live services.** Set `NEXT_PUBLIC_APP_ENV=development` (or `preview`) and `USE_SEED_DATA=true`. The data layer reads from a deterministic seed module (`packages/db/seed` / `lib/data/seed.ts`) instead of Supabase. No real auth, no Redis, no realtime — auth is a seeded session, mutations update in-memory/optimistic only. Render the **"Development build · seeded data"** banner (see the prototype) whenever `USE_SEED_DATA` is true.
- **`main` → production, live backend only.** `NEXT_PUBLIC_APP_ENV=production`, `USE_SEED_DATA=false`. Connects to real Supabase (auth, Postgres, Storage, Realtime) and Upstash Redis. **Never renders seeded data and never shows the dev banner.** Seed modules must be tree-shaken / guarded out of the production bundle.

Implement this as one interface (e.g. `getDataClient()`) with two implementations (`SeedDataClient`, `SupabaseDataClient`) selected by the env flag — so feature work is fully exercisable on Vercel previews with realistic data, and `main` is the only branch wired to services. Keep the seed dataset in sync with the prototypes' content so previews match the design.

## Git workflow (from ARCHITECTURE.md §15.4)

- Branch model: `main` (production) ← `development` (integration, seeded) ← `feature/<short-description>` (seeded). Each branch gets its own Vercel preview.
- Work on a `feature/*` branch off `development` (or directly on `development` for small changes). **Push and stop — do not merge to `main`, do not open a PR.** The maintainer reviews the Vercel preview and merges manually.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `perf:`, `docs:`). Keep CI green (lint + type-check + tests). Direct pushes to `main` are prohibited.
