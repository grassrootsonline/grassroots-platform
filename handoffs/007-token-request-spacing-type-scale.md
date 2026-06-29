# 007 — Token request: spacing scale gaps and type scale intermediate values

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `design` |
| **Branch** | `design/spacing-type-scale-additions` |
| **Depends on** | none |

---

## Problem

The current spacing and type scales have gaps that product CSS modules have been filling with hardcoded pixel values. These values need proper tokens before Claude Code can eliminate the remaining hardcoded sizes (handoff 008 depends on this handoff).

---

## Spacing scale — missing intermediate values

Current scale in `tokens/spacing.css`:

```
--space-xs:  4px
--space-sm:  8px
--space-md:  12px
--space-lg:  20px   ← 8px gap between md and lg
--space-xl:  32px   ← 12px gap between lg and xl
--space-2xl: 48px
--space-3xl: 72px
```

Two values appear extensively in product CSS modules but have no token:

**`16px`** — appears in 10+ places across four files:
- `feed/page.module.css`: `.composerInput { padding: 0 16px }`, `.layout { gap: 24px }` (see 24px below)
- `feed/[postId]/page.module.css`: `.reply { padding: 16px 0 }`, `.replyActions { gap: 16px }`, `.composerInput { padding: 0 16px }`
- `profile/[username]/page.module.css`: `.profileTop { gap: 16px }`, `.projectsGrid { gap: 16px }`, `.projectCard { padding: 16px }`
- `(public)/page.module.css`: `.ctaContent { gap: 16px }`

16px sits between `--space-md` (12px) and `--space-lg` (20px). Neither is a close enough substitute — 12px would feel tight and 20px would feel loose in these contexts.

**`24px`** — appears in 5+ places:
- `feed/page.module.css`: `.layout { gap: 24px }`
- `profile/[username]/page.module.css`: `.tabBar { gap: 24px }`
- `feed/[postId]/page.module.css`: `.replies { margin-top: 24px }`, `.repliesHeader { margin-bottom: 24px }`

24px sits between `--space-lg` (20px) and `--space-xl` (32px). Again, neither substitute fits — 20px is noticeably tighter, 32px is notably more spacious.

**Naming is yours to decide.** One option that doesn't require renaming existing tokens:

```css
--space-base:  16px;  /* Product grid unit — between md and lg */
--space-2lg:   24px;  /* Between lg and xl */
```

Or restructure the md–xl segment however you see fit. What matters is that 16px and 24px are first-class tokens.

---

## Spacing scale — values that can round to existing tokens

These hardcoded values exist in product CSS but are close enough to existing tokens that the advisor recommends rounding rather than adding more tokens. Claude Code will apply these substitutions in handoff 008 without a new token:

| Current value | Substitute | Files affected | Notes |
|---|---|---|---|
| `6px` | `var(--space-sm)` (8px) | profile, thread pages | Icon-row gap — 2px difference is imperceptible |
| `10px` | `var(--space-md)` (12px) | profile `.profileBio margin-top`, thread `.replyActions margin-top` | Minor visual rounding |
| `28px` | `var(--space-xl)` (32px) | `auth-modal.module.css` `.panel { padding: 28px }` | Panel padding — 4px more is fine |

---

## Type scale — missing intermediate values

Current scale in `tokens/typography.css`:

```
--text-display:  36px  (font-display, hero only)
--text-title:    24px  (font-display, section headings)
--text-heading:  16px  (font-body 500, card titles)
--text-body:     14px
--text-small:    12px
--text-label:    11px
```

**`17px` — `.statValue` in `profile/[username]/page.module.css`**

The profile page stat row (follower count, following count, post count) uses `font-size: 17px; font-weight: var(--weight-medium)`. This is numeric emphasis — slightly larger than body to give the count visual weight against its label. There's no existing token for this. `--text-heading` (16px) is close but the 1px difference is meaningful for numerals. Request: `--text-stat: 17px` or whatever naming fits the scale.

**`18px` — `.heading` in `composer-modal.module.css`** (design question)

The composer modal heading uses `font-family: var(--font-display); font-size: 18px`. This is between `--text-title` (24px) and `--text-heading` (16px). Two possible resolutions — please advise:

1. **Map to `--text-title` (24px)**: If 24px is acceptable for this compact modal, Claude Code rounds up and no new token is needed.
2. **New token** (e.g. `--text-subheading: 20px` or `22px`): If the composer heading needs to be a tighter display size, a new intermediate token should be added.

Also worth confirming: should `font-display` (DM Serif Display) continue to be used for the composer heading, or should this be `font-body` at `--text-heading`? The composer is functional UI, not a "display moment."

**`22px` — `.heading` in `auth-modal.module.css`** (advisor recommendation: round to existing token)

Auth modal heading uses `font-family: var(--font-display); font-size: 22px`. The advisor recommends rounding this to `var(--text-title)` (24px) — the 2px difference is imperceptible on display type, and auth is a key "display moment" where DM Serif Display at 24px is appropriate. No new token needed here unless you disagree.

---

## Deliverable

- Add `--space-base: 16px` and `--space-2lg: 24px` (or equivalent names) to `tokens/spacing.css`
- Add `--text-stat: 17px` to `tokens/typography.css`
- Clarify / resolve the composer modal heading question (token or rounding)
- Update `CHANGELOG.md` per `packages/design-system/CONTRIBUTING.md`

**App follow-up (do not edit app files):** Note in the CHANGELOG that handoff 008 will sweep the CSS modules to replace all hardcoded px values with the new tokens.
