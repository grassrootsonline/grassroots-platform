# Amendment 02 — Feed shell width + design-system consistency pass

**Feature:** core-social-mvp
**Screen(s) affected:** Authenticated app shell (header + 3-column layout), Home feed right rail, Thread reply row, Composer footer, Left-rail nav hover.
**Date:** 2026-06-28
**Updated source:** `Grassroots Dev Build.dc.html` (root) — the live design source. Re-bundle into `prototypes/02-app-feed-profile-thread-composer.html`.
**Source of changes:** maintainer review (Alex) — reported the development-branch feed screen had spacing/theme rules not applying; this is the corrective amendment from a full cross-reference of the build against the Grassroots design system.

---

## ⚠ Branch & merge rule (read first)

Implement this on a branch — **do not commit to `main`, do not merge, do not open a PR.**

```bash
git checkout development && git pull
git checkout -b fix/core-social-mvp-feed-layout
# ... apply the deltas below, committing in logical chunks ...
git push -u origin fix/core-social-mvp-feed-layout
# stop. The maintainer reviews the Vercel preview and merges manually.
```

Branch model is unchanged from the handoff README: **`main` ← `development` ← `feature/*` | `fix/*`**, each with its own preview. The prior change landing directly on `main` was out of process — every implementation or amendment branches off `development` first so a broken build can be caught in preview before it reaches `main`. Use a `fix/` prefix here since this corrects a shipped screen (Conventional Commits: `fix:`), per `ARCHITECTURE.md` §15.4.

---

## What changed

All deltas use existing Grassroots tokens — **no new tokens, colors, type, or spacing introduced.**

1. **App shell width (the reported bug).** The authenticated shell was capped at `--content-max-width` (960px), but the three columns need more room — left rail 188 + center 560 + right rail 212 + two 24px gaps + 40px page padding ≈ **1048px**. At 960 the right rail ("Trending projects" / "Who to follow") was pinched against the viewport edge and a horizontal scrollbar appeared. **Fix:** the authenticated app wrapper (sticky header row + content row) now uses a wider cap of **1080px**; the public landing page stays at **960px** (it is single-column and correct). In the codebase this is the `(platform)` shell container max-width vs the `(public)`/`(auth)` one — they are not the same value.

2. **Right rail can never overflow.** Two guards, both consistent with the chosen design (variation A):
   - The right rail is **hidden below 1128px** (`@media (max-width:1127px)`), the width at which the three columns stop fitting. This is standard responsive behavior — the feed center + left rail remain; the rail returns at ≥1128px. In production this is a Tailwind `hidden xl:flex` (or the project's matching breakpoint).
   - "Who to follow" **taglines shortened to 2–3 words** ("AI researcher & builder", "Open-source LLM tools", "Multimodal & robotics") to match the design intent (short meta, single line) rather than full sentences that defeated the `text-overflow: ellipsis` clamp. Keep right-rail name/tagline to one ellipsised line; do not let it wrap.

3. **Undefined utility classes were rendering unstyled — now token-backed.** The build referenced `.action-btn`, `.input`, and `.btn-icon`, none of which exist in the design system's CSS (it ships **tokens only**; components are React). They fell back to raw browser defaults. Recreated to match what the design-system components produce:
   - **Thread reply actions** (`.action-btn` — heart+count, "Reply"): inline-flex, `--text-small`, `--color-secondary`, no border/background, hover → `--color-ink`. Mirrors the `FeedCard` `ActionButton`. The reply heart **turns sage, never fills** (same rule as feed likes).
   - **Reply input** (`.input`): `--font-body` / `--text-body` / `--color-ink`, `0.5px solid --color-border-strong`, 16px inline padding, focus → sage border + `0 0 0 3px --color-accent-mist` ring (never a border swap, never blue).
   - **Composer footer icon buttons** (`.btn-icon` — photo / link / code): 28px square, transparent, `--radius-md`, hover → `--color-accent-subtle` fill + `--color-accent-ink`. Tabler **outline** glyphs only.
   - In production these are the real `components/ui/*` React components (`Button` icon-only, `Input`), not hand-rolled classes — this amendment just makes the design reference faithful.

4. **Left-rail nav hover token.** `.rail-link:hover` background corrected from `--color-canvas` to **`--color-surface`**, matching the design-system `RailLink` hover. Active state unchanged (`--color-accent-subtle` fill + ink text + sage icon).

## What did NOT change

- All copy, the warm-neutral + single-sage palette, the type scale (Inter 400/500 + DM Serif Display for the wordmark/headings), 0.5px borders, shadowless cards, and the Tabler-outline iconography were already correct and are untouched.
- Feed, profile, thread, composer, auth, notifications **behavior** is unchanged — this is a layout/consistency fix only.
- The landing page (Amendment 01) is untouched; its 960px cap is correct.
- The `seedMode` banner and the seeded-vs-live data layer rule are unchanged.

## Implementation notes

- The 1080 vs 960 split is the only structural change. Everything else is token alignment, so the visual diff on wide screens is small but the cramped/overflowing right rail on common laptop widths is resolved.
- No seed-data content changes except the three shortened taglines — keep the seed dataset's "who to follow" meta in sync (short, single line).
- Re-bundle `prototypes/02-app-feed-profile-thread-composer.html` from the updated `Grassroots Dev Build.dc.html` so the offline reference matches.

---

## Design-system update — new motion / responsive / component layers

The design-system repo (`grassrootsonline/grassroots-design-system-core`) gained three new stylesheets since the original handoff. They are now part of the bound system (imported by `styles.css`) and are **binding** for this build. Link/port all three alongside the existing tokens; do not hand-roll equivalents.

- **`motion.css` — motion tokens (use these; stop hardcoding durations/easing).** Duration scale `--duration-instant 50ms` / `--duration-fast 120ms` / `--duration-base 200ms` / `--duration-slow 320ms` / `--duration-relaxed 480ms`; easing curves `--ease-standard` / `--ease-enter` / `--ease-exit` / `--ease-spring` / `--ease-linear`; shorthands `--transition-colors` / `--transition-transform` / `--transition-shadow`; named keyframes (`gr-fade-in`, `gr-scale-in`, `gr-slide-up`, `gr-sheet-up`, …) and `.animate-*` utilities; a global `prefers-reduced-motion` collapse. **Map the architecture §12.2 Framer Motion specs onto these tokens** — e.g. modal = `gr-scale-in` at `--duration-slow`/`--ease-spring`; the 120ms hover/focus transitions throughout the build are `--duration-fast`/`--ease-standard`.
- **`responsive.css` — the canonical responsive system (supersedes the hand-rolled breakpoint in this amendment).** Named breakpoints `--bp-sm 480 / --bp-md 768 / --bp-lg 1024 / --bp-xl 1280`; `--touch-target 44px`; safe-area insets. The feed sidebar **collapses at ≤1023px** (`.feed-layout` → single column, `.feed-sidebar` hidden) — use **1024px** as the column-drop breakpoint, not the interim 1127px used above. The navbar becomes a **fixed bottom tab bar at ≤767px** (wordmark + action buttons hidden, icon+label tabs, body bottom-padding offset); cards go **full-bleed (radius 0)** on mobile; modals become **bottom sheets** (`.sheet`, slide-up, drag handle) under 768px; all interactive controls meet **44×44px** touch targets and inputs use 16px font on mobile (prevents iOS zoom). Display/title type steps down one notch under 768px.
- **`components-new.css` — new component patterns** built on the motion tokens: **Tabs** (`.tab` / `.tab-list` underline tabs + `.tab-pill` filter pills + `.tab-badge`) — the profile Posts/Projects/About tabs and any feed filter row should use these instead of bespoke `.ptab`; **Dropdown menu** (`.dropdown-menu`, items, divider, label) — for the notifications/overflow menus; **Tooltip** (`.tooltip-wrapper` / `.tooltip`); **Command palette / search** (`.command-palette`, input row, results, keyboard hints) — wire to the navbar search per architecture §6/§9 and Tabler `search`.

**Consequence for this amendment:** the right-rail/sidebar drop and the modal/notification motion should follow `responsive.css` + `motion.css` rather than the interim inline values. The prototype `Grassroots Dev Build.dc.html` already links `styles.css`, so these layers are live in it; production should consume the same files (port into `apps/web/src/styles/*` and the Tailwind 4 config per architecture §12.3 — no hard-coded durations, breakpoints, or hex).
