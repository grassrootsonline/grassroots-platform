# Amendment 05 — Dark-mode neutral palette (green-on-black)

**Feature:** core-social-mvp
**Surface(s) affected:** Design-system color layer in `packages/design-system/`. The functional change is the dark-mode block of `tokens/colors.css`. Two non-shipped copies also carry the stale dark values and should be synced for consistency (`CLAUDE.md` guide text, `reference.html` showcase). No light-mode change. No component, layout, or app-code change.
**Date:** 2026-06-29
**Depends on:** Amendment 04 (token-backing + dark-mode parity). This amendment **supersedes Amendment 04's `colors.css`** — `fixtures/v05/colors.css` is the complete, current token file; ship it instead of v04's.
**Repo model:** single repo. `packages/design-system/` is the source of truth; the edit lands there directly.
**Source of changes:** maintainer design call.

---

## ⚠ Branch & merge rule

Implement on a branch — do not commit to `main`, do not merge. Push the `fix/` branch and stop; the maintainer reviews the Vercel preview and merges manually. (Can ride the same `fix/` branch as Amendment 04.)

## Intent

Keep the sage accent on a true warm-black ("green on black"). Previously the dark theme tinted the **neutrals** green too (canvas `#141A13`, surface `#1A211A`, borders `#2A33xx`), so the look read as green-on-green. This swaps those neutrals to a **warm "anthropic" grey** family while keeping sage as the only interactive color — so the green pops against neutral charcoal instead of blending into a green-cast background.

## Repo state (verified on `development`)

- `packages/design-system/tokens/colors.css` already has **Amendment 04** applied (canonical header, `--color-accent-ink`, the `--color-warm` pair), but its **dark block is still the old green-tinted set** (`#141A13` / `#1A211A` / `#2A3329` / `#3A4439`). This is the one file that drives the running app's dark mode.
- `packages/design-system/CLAUDE.md` (the binding style guide) still says "canvas → `#141A13`, accent → `#8AAD89`" in its **Dark mode** paragraph — stale, but doc-only.
- `packages/design-system/reference.html` is a **standalone showcase** with its *own inlined* `:root` token block. That block is both pre-v04 (no `--color-accent-ink` / `--color-warm*`) and pre-v05 (old green-tinted dark values), and the page hardcodes greens (`#2E5C2C`), `#EAE7E1`/`#5A5950`, `#7A5C30`/`#F0EAE0`, and `color:#fff`. **Not shipped to the app** — sync only if you want the reference page to show green-on-black.

## What changed — dark-mode block only

| Token | Was (green-tinted) | Now (warm grey) |
|---|---|---|
| `--color-canvas` | `#141A13` | `#1A1917` |
| `--color-surface` | `#1A211A` | `#232220` |
| `--color-border` | `#2A3329` | `#34322E` |
| `--color-border-strong` | `#3A4439` | `#46443F` |
| `--color-ink` | `#E8E6E1` | `#ECEAE3` |
| `--color-ink-soft` | `#C8C6C0` | `#C9C6BD` |
| `--color-secondary` | `#6E6E65` | `#8F8C83` |
| `--color-muted` | `#4E4E47` | `#615E57` |
| `--color-accent-subtle` | `#1E3020` | `#26301E` |
| `--color-danger-subtle` | `#2A1F1A` | `#2E211A` |
| `--color-warm-subtle` | `#2A1F1A` | `#2E211A` |

**Kept (the green):** `--color-accent #8AAD89`, `--color-accent-ink #A9CBA8`, `--color-accent-mist`, `--color-danger`, `--color-warm`. Accent fills (badges, avatar initials, like-active, links, focus ring) stay sage — that's the green-on-black.

## What did NOT change

- **Light mode is untouched** — every `:root` value is identical.
- No new tokens; no token *names* changed. Only dark-mode hex values.
- No component / CSS-module / app-code change. Dark mode flips automatically via `@media (prefers-color-scheme: dark)` (architecture rule: never hand-author dark overrides in components).

## Fixtures

| Fixture | Target |
|---|---|
| `fixtures/v05/colors.css` | `packages/design-system/tokens/colors.css` (full file — supersedes `fixtures/v04/colors.css`) |

`CLAUDE.md` and `reference.html` are in-place edits (find/replace below), not fixtures — they're large files where a targeted swap is safer than shipping a full copy.

## Execution checklist

- [ ] 1. **(required — the change)** Replace `packages/design-system/tokens/colors.css` with `fixtures/v05/colors.css`. This swaps the dark block's green-tinted neutrals for warm grey; sage accents are kept. — `feat: warm-grey dark-mode neutrals (green-on-black)`
- [ ] 2. Verify in **dark mode** (`prefers-color-scheme: dark`): canvas/cards read as warm charcoal (not green-cast); sage accents (Following badge, avatar initials, links, focus ring) still pop. Confirm **light mode unchanged**.
- [ ] 3. **(doc sync)** In `packages/design-system/CLAUDE.md`, in the **Dark mode** paragraph, replace `the tokens flip themselves (canvas → `#141A13`, accent → `#8AAD89`, etc.).` with: `the tokens flip themselves. The dark neutrals are a warm "anthropic" grey (canvas → `#1A1917`, surface → `#232220`) so the sage accent (→ `#8AAD89`) reads as green-on-black rather than green-on-green.` — `docs: dark-mode guide matches v05 tokens`
- [ ] 4. **(optional — showcase only, skip if not maintaining `reference.html`)** Sync `packages/design-system/reference.html` to the current tokens:
  - In its inlined `@media (prefers-color-scheme: dark)` `:root` block, set the dark values to the v05 set (`--color-canvas:#1A1917; --color-surface:#232220; --color-border:#34322E; --color-border-strong:#46443F; --color-ink:#ECEAE3; --color-ink-soft:#C9C6BD; --color-secondary:#8F8C83; --color-muted:#615E57;`) and add the missing dark tokens `--color-accent-subtle:#26301E; --color-accent-ink:#A9CBA8; --color-warm:#C9A878; --color-warm-subtle:#2E211A;`.
  - In the light `:root` block add `--color-accent-ink:#2E5C2C; --color-warm:#7A5C30; --color-warm-subtle:#F0EAE0;` so the page has the v04 tokens.
  - Replace hardcoded hex with tokens (matches Amendment 04): `.badge-accent`/`.avatar`/`.toast-success`/`.tab-badge`/`.command-item-icon` inline `#2E5C2C` → `var(--color-accent-ink)`; `.ref-mobile-hint` `color:#2E5C2C` → `var(--color-accent-ink)`; `.badge-default` `#EAE7E1`/`#5A5950` → `var(--color-surface)`/`var(--color-ink)` + `border:var(--border-default)`; `.badge-warm` `#F0EAE0`/`#7A5C30` → `var(--color-warm-subtle)`/`var(--color-warm)`; `.btn-danger` `color:#fff` → `var(--color-canvas)`. — `chore: sync reference.html showcase to v04/v05 tokens`
- [ ] 5. If Amendment 04's `colors.css` was already applied, step 1 overwrites it — expected; v05 includes 04's token-backing (identical light values + `accent-ink`/`warm` tokens).

## Note for the design-system maintainers

Steps 3–4 above keep the in-repo `CLAUDE.md` and `reference.html` in sync. The **bound** design-system source (the upstream that generates the skill guide) still documents `#141A13` too — update it there when the design system is next regenerated so future skill text matches.
