# 008 — Replace all hardcoded px values in CSS modules

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `fix` |
| **Branch** | `fix/hardcoded-px-values` |
| **Depends on** | handoff 007 (new spacing and type tokens must be merged before this) |

---

## Problem

After handoff 007 delivers the missing spacing and type tokens, a full sweep of product CSS modules can eliminate all remaining hardcoded pixel values. This handoff documents every substitution across every affected file in one place.

**Do not start this handoff until `packages/design-system/CHANGELOG.md` confirms that handoff 007's tokens have landed.** The tokens `--space-base`, `--space-2lg` (or whatever Claude Design names them), and `--text-stat` must exist before the substitutions below can be applied.

---

## Affected files

**Edited:**
- `apps/web/src/components/auth/auth-modal.module.css`
- `apps/web/src/components/feed/composer-modal.module.css`
- `apps/web/src/app/(platform)/profile/[username]/page.module.css`
- `apps/web/src/app/(platform)/feed/page.module.css`
- `apps/web/src/app/(platform)/feed/[postId]/page.module.css`
- `apps/web/src/app/(public)/page.module.css`

---

## Token dependencies

| Token | Status when this handoff runs | Source |
|---|---|---|
| `--space-base` | ✅ defined (via handoff 007) | `tokens/spacing.css` |
| `--space-2lg` | ✅ defined (via handoff 007) | `tokens/spacing.css` |
| `--text-stat` | ✅ defined (via handoff 007) | `tokens/typography.css` |
| `--text-title` | ✅ already defined | `tokens/typography.css` |
| `--text-heading` | ✅ already defined | `tokens/typography.css` |

> **Note on token names:** handoff 007 lets Claude Design choose the names for the 16px and 24px spacing tokens and the stat type token. Before running this handoff, read `packages/design-system/CHANGELOG.md` to confirm the exact token names chosen, and substitute the correct names below where `--space-base`, `--space-2lg`, and `--text-stat` appear.

---

## Substitution table (all files)

| File | Selector / property | Old value | New value | Notes |
|---|---|---|---|---|
| `auth-modal.module.css` | `.panel` `padding` | `28px` | `var(--space-xl)` | 32px — 4px more, acceptable panel padding |
| `auth-modal.module.css` | `.heading` `font-size` | `22px` | `var(--text-title)` | 24px — display font, 2px rounding |
| `auth-modal.module.css` | `.subtitle` `margin-bottom` | `24px` | `var(--space-2lg)` | new token |
| `auth-modal.module.css` | `.form` `gap` | `16px` | `var(--space-base)` | new token |
| `composer-modal.module.css` | `.heading` `font-size` | `18px` | See note ① | depends on 007 design decision |
| `profile/page.module.css` | `.profileTop` `gap` | `16px` | `var(--space-base)` | new token |
| `profile/page.module.css` | `.tabBar` `gap` | `24px` | `var(--space-2lg)` | new token |
| `profile/page.module.css` | `.projectsGrid` `gap` | `16px` | `var(--space-base)` | new token |
| `profile/page.module.css` | `.projectCard` `padding` | `16px` | `var(--space-base)` | new token |
| `profile/page.module.css` | `.backLink` `gap` | `6px` | `var(--space-sm)` | 8px — icon+text gap |
| `profile/page.module.css` | `.profileBio` `margin-top` | `10px` | `var(--space-md)` | 12px — minor rounding |
| `profile/page.module.css` | `.statValue` `font-size` | `17px` | `var(--text-stat)` | new token |
| `profile/page.module.css` | `.projectCardName` `font-size` | `15px` | `var(--text-heading)` | 16px — 1px rounding |
| `feed/page.module.css` | `.layout` `gap` | `24px` | `var(--space-2lg)` | new token |
| `feed/page.module.css` | `.composerInput` `padding` | `0 16px` | `0 var(--space-base)` | new token |
| `feed/[postId]/page.module.css` | `.replies` `margin-top` | `24px` | `var(--space-2lg)` | new token |
| `feed/[postId]/page.module.css` | `.repliesHeader` `margin-bottom` | `16px` | `var(--space-base)` | new token |
| `feed/[postId]/page.module.css` | `.reply` `padding` | `16px 0` | `var(--space-base) 0` | new token |
| `feed/[postId]/page.module.css` | `.replyActions` `gap` | `16px` | `var(--space-base)` | new token |
| `feed/[postId]/page.module.css` | `.replyActions` `margin-top` | `10px` | `var(--space-md)` | 12px — minor rounding |
| `feed/[postId]/page.module.css` | `.replyActionBtn` `gap` | `6px` | `var(--space-sm)` | 8px — icon+text gap |
| `feed/[postId]/page.module.css` | `.composerInput` `padding` | `0 16px` | `0 var(--space-base)` | new token |
| `(public)/page.module.css` | `.ctaContent` `gap` | `16px` | `var(--space-base)` | new token |

---

## Note ①: composer modal heading

The resolution of the `18px` heading in `composer-modal.module.css` depends on Claude Design's answer in handoff 007:

- If Claude Design says **round to `--text-title` (24px)**: replace `font-size: 18px` with `font-size: var(--text-title)`.
- If Claude Design delivers a **new intermediate token** (e.g. `--text-subheading`): use that token name.
- If Claude Design says **use `--text-heading`**: replace with `var(--text-heading)` and confirm whether to also change `font-family` from `var(--font-display)` to `var(--font-body)`.

Read the handoff 007 CHANGELOG entry for the answer before editing this file.

---

## Exclusion: composer textarea `font-size: 16px`

`composer-modal.module.css` `.textarea { font-size: 16px }` is **intentionally hardcoded** and must not be changed. iOS Safari zooms into any input with `font-size` below 16px on focus. This is a browser compatibility requirement, not a token violation.

---

## Implementation

Apply all substitutions in a single commit per file, or group related files. Keep the diff readable — one file per commit is fine.

Commit message pattern: `fix: replace hardcoded px values with design tokens in [filename]`

Final commit when all files are done: `fix: all hardcoded px values replaced with design tokens`

---

## Verification

- [ ] `grep -r "font-size: [0-9]*px" apps/web/src/components apps/web/src/app` returns no results except the intentional `font-size: 16px` in `.textarea`.
- [ ] `grep -r "gap: [0-9]*px\|padding: [0-9]*px\|margin[^:]*: [0-9]*px" apps/web/src/components apps/web/src/app` returns no results except `font-size: 16px`.
- [ ] Visual regression check: profile stats row, composer modal, auth modal, and feed layout all render correctly at standard viewport widths.
- [ ] `pnpm type-check` passes.
