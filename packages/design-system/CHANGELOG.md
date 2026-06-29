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
