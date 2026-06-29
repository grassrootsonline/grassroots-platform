# Phase 1 — Design system consolidation: move, clean, document

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `refactor` |
| **Branch** | `chore/design-system-consolidation` |
| **Depends on** | none |

---

## Problem

The design system information is split across several locations that Claude Code, Claude Design, and the project advisor must all reference:

- `packages/design-system/` — the live CSS source and binding style guide
- `design-handoffs/core-social-mvp/ARCHITECTURE.md` — the authoritative engineering spec (41KB), currently buried in a handoff folder
- `design-handoffs/core-social-mvp/fixtures/` — versioned CSS snapshots (v04, v05, v06) that are fully superseded by the live files in `packages/design-system/`
- `design-handoffs/core-social-mvp/AMENDMENT-01` through `AMENDMENT-06` — implemented decisions scattered across individual files with no single summary

The goal of this phase is to move the engineering spec to where it belongs (`docs/`), delete files that are now redundant, and produce a single consolidated changelog in the design system package. This is infrastructure work — no functional code changes.

---

## Background

`docs/` already exists and contains `USER_SYSTEM.md`. It is the correct home for engineering specifications. `design-handoffs/` is being progressively archived — the prototypes remain as visual references but fixtures and versioned snapshots have no ongoing value.

The root `CLAUDE.md` currently points Claude Code to `design-handoffs/<feature>/ARCHITECTURE.md`. That reference must be updated atomically with the move, in the same commit, so the repo is never in a state where the file has moved but the pointer hasn't.

---

## Affected files

**Moved:**
- `design-handoffs/core-social-mvp/ARCHITECTURE.md` → `docs/ARCHITECTURE.md`

**Edited:**
- `CLAUDE.md` (root) — update the ARCHITECTURE.md reference path; note design-handoffs is archived

**Deleted (entire directory):**
- `design-handoffs/core-social-mvp/fixtures/` — all versioned CSS snapshots (v04, v05, v06 subdirectories and any loose files). These are fully superseded by `packages/design-system/`.

**Created:**
- `packages/design-system/CHANGELOG.md` — consolidated amendment history (content below)

---

## Token dependencies

None.

---

## Implementation steps

**Step 1 — Move ARCHITECTURE.md and update root CLAUDE.md (single commit)**

Use `git mv` to preserve history:
```bash
git mv design-handoffs/core-social-mvp/ARCHITECTURE.md docs/ARCHITECTURE.md
```

Then edit `CLAUDE.md` at the root of the repo. Make these two targeted changes:

*Change 1:* Update the authoritative documents paragraph. Replace:
```
- **Engineering** → `design-handoffs/<feature>/ARCHITECTURE.md` (Next.js 15 App Router, Supabase/Postgres, Drizzle, Upstash Redis, Framer Motion). Stack, schema, API, caching, permissions, and coding standards live there.
```
with:
```
- **Engineering** → `docs/ARCHITECTURE.md` (Next.js 15 App Router, Supabase/Postgres, Drizzle, Upstash Redis, Framer Motion). Stack, schema, API, caching, permissions, and coding standards live there.
```

*Change 2:* Update the "Git workflow" footer line that references `ARCHITECTURE.md §15.4`:
```
## Git workflow (from ARCHITECTURE.md §15.4)
```
→ no change needed here (the section heading just says "from ARCHITECTURE.md" without a path — leave it).

*Change 3:* Update the "Design handoffs" section. Replace:
```
## Design handoffs

Designs arrive under `design-handoffs/<feature>/` (see that folder's README). To implement one:

1. Read `packages/design-system/CLAUDE.md` + the feature `README.md`; open its `prototypes/` for look and behavior. The HTML prototype is a **reference** — recreate it as React components using design system classes and CSS Modules.
2. Build it for real per `ARCHITECTURE.md`: RSC by default, Server Actions for writes (`requireSession()` → `checkPermission()` → Zod → mutate → `revalidateTag()`), layout-accurate `*Skeleton`s, optimistic UI, the Framer Motion specs.
3. Amendments (`AMENDMENT-*.md` in a feature folder) change only what they describe — keep the diff small.
```
with:
```
## Design handoffs

Visual prototypes live under `design-handoffs/<feature>/prototypes/` — treat them as read-only references. Amendment files in that folder are historical; the current design system state is `packages/design-system/` and its `CHANGELOG.md`.

To implement a design change:
1. Read `packages/design-system/CLAUDE.md` for style rules; open the relevant prototype in `design-handoffs/<feature>/prototypes/` for look and behavior.
2. Build it for real per `docs/ARCHITECTURE.md`: RSC by default, Server Actions for writes (`requireSession()` → `checkPermission()` → Zod → mutate → `revalidateTag()`), layout-accurate `*Skeleton`s, optimistic UI, the Framer Motion specs.
3. New design system changes arrive as advisor handoffs in `handoffs/` — read those documents for scope and implementation steps.
```

Commit both the `git mv` and the `CLAUDE.md` edits together:

Commit: `chore: move ARCHITECTURE.md to docs/ and update root CLAUDE.md`

---

**Step 2 — Delete the fixtures directory**

```bash
git rm -r design-handoffs/core-social-mvp/fixtures/
```

If the directory contains any subdirectories that git rm doesn't catch (due to nesting), remove them manually and stage the deletions.

Commit: `chore: delete superseded design system fixtures (v04/v05/v06)`

---

**Step 3 — Create `packages/design-system/CHANGELOG.md`**

Create the file at `packages/design-system/CHANGELOG.md` with the following content exactly:

---

```markdown
# Design System — Changelog

Changes to `packages/design-system/`. Consolidates Amendments 01–06 from `design-handoffs/core-social-mvp/`. Amendment files there are historical records — the live source of truth is the CSS in this folder.

---

## [06] — 2026-06-29 · Shadow and overlay tokens

Added the elevation and scrim token layer.

**`tokens/spacing.css`:**
- `--shadow-overlay` — box-shadow for modals, command palette, notification panel (z-300)
- `--shadow-dropdown` — box-shadow for dropdown menus (z-200)
- `--border-accent-subtle` — 30%-opacity sage hairline border for affiliated/selected states (contrast: `--border-accent` is fully opaque, for focus/active)

**`tokens/colors.css`:**
- `--color-scrim` — neutral `rgba(0,0,0,0.40)` backdrop for modal, sheet, and command-palette overlays; no dark override needed
- Shadow dark-mode overrides: both shadow tokens use ~2.5× higher opacity in dark mode to maintain perceptual contrast on warm-grey dark surfaces

**Removals:** hardcoded `rgba(28, 43, 26, …)` scrim values removed from `components-new.css` and `responsive.css`; all references now use `var(--color-scrim)` and `var(--shadow-dropdown)`.

---

## [05] — 2026-06-29 · Dark mode neutral palette (green-on-black)

Replaced dark-mode neutral tokens with warm Anthropic grey. Previously, all dark-mode surfaces were green-tinted, causing the sage accent to read as green-on-green. Sage accent values are unchanged — they now read as green-on-black.

**`tokens/colors.css` dark-mode overrides changed:**

| Token | Was | Now |
|---|---|---|
| `--color-canvas` | `#141A13` | `#1A1917` |
| `--color-surface` | `#1A211A` | `#232220` |
| `--color-border` | `#2A3329` | `#34322E` |
| `--color-border-strong` | `#3A4439` | `#46443F` |
| `--color-ink` | `#E8E6E1` | `#ECEAE3` |
| `--color-ink-soft` | `#C8C6C0` | `#C9C6BD` |
| `--color-secondary` | `#6E6E65` | `#8F8C83` |
| `--color-muted` | `#4E4E47` | `#615E57` |

Light mode is untouched.

---

## [04] — 2026-06-28 · Color token cleanup and motion adherence

Replaced all hardcoded hex values in component CSS with semantic tokens. Dark mode now flips correctly for all components.

**`tokens/colors.css`:** Added `--color-accent-ink: #2E5C2C` (dark: `#A9CBA8`), `--color-warm: #7A5C30` (dark: `#C9A878`), `--color-warm-subtle: #F0EAE0` (dark: `#2E211A`).

**`components/components.css`:**
- `.badge-accent`, `.avatar`, `.toast-success`: `#2E5C2C` → `var(--color-accent-ink)`
- `.badge-warm`: literals → `var(--color-warm-subtle)` / `var(--color-warm)`
- `.badge-default`: re-tokenized to `var(--color-surface)` / `var(--color-ink)` + `var(--border-default)`
- `.btn-danger`: `color: #fff` → `var(--color-canvas)`

**Motion:** `feed-card.tsx` like button — removed `whileTap={{ scale: 1.25 }}` spring. Press states are opacity/color only. No scale transforms, no spring on interactive elements (motion rule, `docs/ARCHITECTURE.md` §12.2).

---

## [03] — 2026-06-28 · SUPERSEDED — Tailwind bridge (not implemented)

Originally proposed a Tailwind 4 `@theme` bridge. Decision reversed: the platform migrated to **native CSS only**; Tailwind was removed entirely. Design system lives directly in `packages/design-system/`. Amendment 03 is archived for history — its implementation steps do not apply.

---

## [02] — 2026-06-28 · Feed shell width and design system binding

**Width fix:** Authenticated platform shell max-width raised to 1080px (was 960px, which clipped the three-column layout at common viewport widths). Public/landing pages remain 960px.

**Design system bound:** `motion.css`, `responsive.css`, and `components-new.css` added as required imports in `apps/web/src/styles/globals.css`. All durations, easing, breakpoints, and new component patterns (tabs, dropdowns, tooltips, command palette) source from these files.

**Responsive rules:** Right rail hides below 1128px. "Who to follow" taglines constrained to single-line ellipsis. Mobile: fixed bottom tab bar at ≤767px; full-bleed cards; modals become bottom sheets.

---

## [01] — 2026-06-27 · Landing page copy

Copy-only changes to the landing page. No tokens or design system changes.

- Hero eyebrow: "A home for builders" → "A home for creators"
- Hero right column: replaced faux feed preview card with a live stats card ("Live on Grassroots" — users online, active communities, ongoing threads). Figures wire to real platform metrics in production; seeded values in dev.
- Value prop cards retitled: "Build openly", "Build together", "Join the conversation"
- Hero paragraph and subtext rewritten (see Amendment 01 for exact copy)
- Footer nav: "About" → "Careers"; "Communities" → "Terms of service"
```

---

Commit: `docs: add CHANGELOG.md to packages/design-system consolidating amendments 01–06`

---

## Verification

- [ ] `docs/ARCHITECTURE.md` exists and is the full ARCHITECTURE.md content (git history shows it as a rename, not a new file).
- [ ] `design-handoffs/core-social-mvp/ARCHITECTURE.md` no longer exists.
- [ ] Root `CLAUDE.md` references `docs/ARCHITECTURE.md` — grep confirms no remaining reference to `design-handoffs/<feature>/ARCHITECTURE.md`.
- [ ] `design-handoffs/core-social-mvp/fixtures/` no longer exists (confirm with `ls design-handoffs/core-social-mvp/`).
- [ ] `packages/design-system/CHANGELOG.md` exists and is readable.
- [ ] `design-handoffs/core-social-mvp/prototypes/` is untouched (do not delete prototypes).
- [ ] `design-handoffs/core-social-mvp/AMENDMENT-01` through `AMENDMENT-06` are untouched (do not delete amendment files — archive only, but kept).
- [ ] The app builds without error (`pnpm build` or `pnpm type-check`). No import paths reference the moved or deleted files.
