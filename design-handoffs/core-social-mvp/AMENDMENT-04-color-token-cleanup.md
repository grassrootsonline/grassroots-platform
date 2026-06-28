# Amendment 04 — Color-token cleanup (dark-mode parity) + motion adherence

**Feature:** core-social-mvp
**Surface(s) affected:** Design-system color layer (`tokens/colors.css`, `components.css`, `components-new.css`) and two platform files (`badge.module.css`, `feed-card.tsx`). No visual change in **light mode** — this closes a dark-mode hole and one motion-guideline miss.
**Date:** 2026-06-28
**Depends on:** Amendment 03 (the platform consumes the design system as the `packages/design-system/` package — CSS-first, Tailwind removed).
**Repo model:** `packages/design-system/` is the **single source of truth** — the design system lives in the platform repo and is maintained here directly. There is no longer a `design-system-core` upstream to sync from, so edits land in `packages/design-system/` and stay put.
**Source of changes:** maintainer review of the merged `development` branch.

---

## ⚠ Branch & merge rule

Implement on a branch — **do not commit to `main`, do not merge.**

```bash
git checkout development && git pull
git checkout -b fix/core-social-mvp-color-token-cleanup
# apply, commit per chunk, push
git push -u origin fix/core-social-mvp-color-token-cleanup
# stop. Maintainer reviews the Vercel preview and merges manually.
```

Single repo — all edits land in `grassroots-platform`.

---

## Root cause

The design system gained semantic tokens — `--color-accent-ink` and the `--color-warm` / `--color-warm-subtle` pair, each with a dark-mode value — but **the repos are running an older snapshot from before those tokens existed.** So a handful of component rules still hardcode the raw greens/warms instead of referencing tokens:

- `components.css` → `.badge-accent` `#2E5C2C`, `.avatar` `#2E5C2C`, `.toast-success` `#2E5C2C`, `.badge-warm` `#F0EAE0`/`#7A5C30`, `.badge-default` `#EAE7E1`/`#5A5950`, `.btn-danger` `#fff`
- `components-new.css` → avatar `#2E5C2C`
- platform `badge.module.css` → `.warm` `#F0EAE0`/`#7A5C30` (a local literal, with the comment "warm is not yet in the design system tokens" — that comment is now stale; the tokens exist)

**Light mode looks correct** (the literals happen to equal the light values), which is why it slipped through. **Dark mode is where it breaks:** these stay dark-green / light-warm on the dark canvas instead of flipping to `--color-accent-ink #A9CBA8` / `--color-warm #C9A878`. Light is the canonical/default mode; the fix restores dark as graceful parity rather than a broken state.

Separately, `feed-card.tsx`'s like button uses a Framer Motion spring scale (`whileTap={{ scale: 1.25 }}`), which violates the motion rule: **"no spring, no scale transforms; press = opacity/color."** The liked state is already carried by `.action-btn.active` turning sage.

## What changed

All deltas reference **existing** tokens — nothing new is invented. The `--color-accent-ink` / `--color-warm` tokens already exist in the canonical `tokens/colors.css` (this amendment ships that canonical file so older repo copies are brought up to date).

1. **`packages/design-system/tokens/colors.css`** — confirm it matches the canonical file in `fixtures/v04/colors.css` (defines `--color-accent-ink`, `--color-warm`, `--color-warm-subtle` + dark values). If the repo's copy is the older one, replace it.
2. **`packages/design-system/components/components.css`** — replace with `fixtures/v04/components.css`. Hex → tokens:
   - `.badge-accent` `#2E5C2C` → `var(--color-accent-ink)`
   - `.avatar` `#2E5C2C` → `var(--color-accent-ink)`
   - `.toast-success` `#2E5C2C` → `var(--color-accent-ink)`
   - `.badge-warm` `#F0EAE0`/`#7A5C30` → `var(--color-warm-subtle)` / `var(--color-warm)`
   - `.badge-default` `#EAE7E1`/`#5A5950` → `var(--color-surface)` / `var(--color-ink)` + `var(--border-default)` — **aligned to the app's already-tokenized default badge** (resolves the only "no exact token" case without inventing tokens). Visually a hair lighter in light mode; correct in dark.
   - `.btn-danger` `color:#fff` → `var(--color-canvas)` (matches `.btn-primary`'s filled-text)
3. **`packages/design-system/components-new.css`** — one swap: the avatar/initials rule `color: #2E5C2C` → `var(--color-accent-ink)`. (Single line; no fixture shipped — find `#2E5C2C` and replace.)
4. **`apps/web/src/components/ui/badge.module.css`** — replace with `fixtures/v04/badge.module.css`. `.warm` now uses `var(--color-warm-subtle)` / `var(--color-warm)`; the stale comment is removed.
5. **`apps/web/src/components/feed/feed-card.tsx`** — replace with `fixtures/v04/feed-card.tsx`. Like button is a plain `<button>` (sage `.active` state + 120ms color transition); the unused `motion` import is dropped; `aria-pressed` added.
6. **`Badge.default` / `Toast.success` variant sources** — wherever the design-system package ships these (the component `.jsx` / bundle source, not a generated artifact), point the `default` badge (`#EAE7E1`/`#5A5950`) and `success` toast (`#2E5C2C`) at the same tokens, so the React components match the CSS classes.

## What did NOT change

- **Light mode is pixel-identical** except the default badge (intentionally re-tokenized to the app's existing treatment).
- No token *values* changed; no new tokens added. Palette, type, spacing, borders, radii untouched.
- All component behavior, layout, and copy unchanged.

## Fixtures (in `design-handoffs/core-social-mvp/fixtures/v04/`)

| Fixture | Target (all in `grassroots-platform`) |
|---|---|
| `colors.css` | `packages/design-system/tokens/colors.css` |
| `components.css` | `packages/design-system/components/components.css` |
| `badge.module.css` | `apps/web/src/components/ui/badge.module.css` |
| `feed-card.tsx` | `apps/web/src/components/feed/feed-card.tsx` |

`components-new.css` is a one-line find/replace (`#2E5C2C` → `var(--color-accent-ink)`) in `packages/design-system/` — no fixture.

## Where the edits land — single repo

`packages/design-system/` is the **source of truth** (maintained directly in the platform repo; no `design-system-core` upstream to sync from). All edits land in `grassroots-platform` and stay put — there is no re-vendor step that could revert them.

- Design-system layer → `packages/design-system/` (`tokens/colors.css`, `components/components.css`, `components-new.css`, and the `Badge`/`Toast` component sources).
- App layer → `apps/web/src/components/` (`badge.module.css`, `feed-card.tsx`).

## Execution checklist (commit per chunk)

- [ ] **1.** `packages/design-system/`: update `tokens/colors.css` (if older), swap hex→tokens in `components/components.css` + `components-new.css`, and token-back the `Badge.default` / `Toast.success` component sources. — `fix: token-back hardcoded greens/warms for dark-mode parity`
- [ ] **2.** `apps/web/`: drop in `fixtures/v04/badge.module.css` + `fixtures/v04/feed-card.tsx`. — `fix: tokenize warm badge; remove spring scale from like (motion adherence)`
- [ ] **3.** Verify in **dark mode** (`prefers-color-scheme: dark`): accent badges, avatar initials, the success toast, and the warm badge all flip (no stranded dark-green / light-warm). Confirm **light mode is unchanged** apart from the default badge.
- [ ] **4.** Re-grep the repo for `#2E5C2C|#EAE7E1|#5A5950|#7A5C30|#F0EAE0|color:\s*#fff` in `*.css`/`*.tsx`/`*.jsx` (excluding `tokens/colors.css`) — should return nothing. Confirms no hardcoded hex remains.
- [ ] **5.** `pnpm lint && pnpm type-check` green. Push the `fix/` branch and stop.

## Guardrail

The adherence linter already lists `--color-accent-ink` / `--color-warm` / `--color-warm-subtle` as known tokens — extend the "no raw hex in component code" rule to cover `.module.css` and the `packages/design-system/` `*.css` so a future literal is caught in CI rather than in dark mode.
