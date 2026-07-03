# 014 — Token request: landing page and auth screen values

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `design` |
| **Branch** | `design/landing-auth-tokens` |
| **Depends on** | none |

---

## Context

Handoff 013 (landing page + auth screens) was built without design tokens for several component-specific values. Claude Code correctly identified most of these as needing tokens, but used hardcoded values with comments rather than blocking on a token request. Per CLAUDE.md process rules, those values must now be tokenised before the hardcoded numbers can be removed.

This is a focused token addition — no component pattern changes, no prototype work required. Read the CSS files listed below and define the tokens. Claude Code will do handoff 015 once these tokens are merged.

---

## Values requiring tokens

### Layout tokens

These are structural measurements that will likely recur across components. They belong in `packages/design-system/tokens/spacing.css`.

| Value | Where used | Proposed token name | Notes |
|---|---|---|---|
| `56px` | `.nav { height }` in `(auth)/page.module.css` | `--nav-height` | The platform navbar almost certainly uses the same value. Check `components/layout/navbar.tsx` — if it uses `56px` without a token, this token fixes both. |
| `480px` | `.heroSubtext { max-width }` in `(auth)/page.module.css` | `--panel-max-width` | Also a good fit for the auth panel max-width on `/signup` and `/login` (currently `440px` in the design brief — resolve to one canonical value). |
| `380px` | `grid-template-columns: 1fr 380px` in `(auth)/page.module.css` | `--stats-card-width` | Landing-page specific. If this only ever appears in the landing page grid, a component-local CSS variable (`--_stats-width: 380px` at `:root` of that file) might be more appropriate than a global token. Design call. |

### Typography tokens

These belong in `packages/design-system/tokens/typography.css`.

| Value | Where used | Proposed token name | Notes |
|---|---|---|---|
| `52px` | `.heroHeading { font-size }` in `(auth)/page.module.css` | `--text-hero` | Landing-page hero heading. Above `--text-display: 36px`. DM Serif Display, weight 400. On mobile (`max-width: 768px`), Claude Code falls back to `--text-display` — so this token only applies above the 768px breakpoint. |

### Avatar / component size tokens

These belong in `packages/design-system/tokens/spacing.css` (with the other fixed-size tokens) or could go in a new `tokens/components.css` if enough component-size tokens accumulate.

| Value | Where used | Proposed token name | Notes |
|---|---|---|---|
| `28px` | `width + height` of `.miniAvatar` in `(auth)/page.module.css` | `--avatar-xs` (or `--size-avatar-xs`) | Smallest avatar variant. We have no avatar size tokens yet. Consider defining the full set: `--avatar-xs: 28px`, `--avatar-sm: 32px` (placeholder), `--avatar-md: 40px` (placeholder, used in existing `.avatar-md` class), `--avatar-lg: 56px` (placeholder). Design discretion on the exact scale. |
| `-8px` | `margin-left` of `.miniAvatarOffset` in `(auth)/page.module.css` | `--avatar-stack-offset` | Negative value for avatar stack overlap. Likely `calc(-1 * --avatar-xs / 3.5)` or similar. If you define `--avatar-xs`, the offset can be derived; otherwise explicit token. |
| `2px` | `border-width` in `.miniAvatarOffset` in `(auth)/page.module.css` | None needed — see note | This `2px solid` is a visual separator between overlapping avatars. Since CLAUDE.md sets all borders at `0.5px`, this is a component-specific exception for the knockout technique. Document it explicitly: in a code comment confirm this is permitted. If a `--avatar-stack-border` token would help, add one. Design call. |

### Spacing tokens

| Value | Where used | Proposed token name | Notes |
|---|---|---|---|
| `10px` | `padding-block` of `.ctaBtn` in `(auth)/page.module.css` | Consider whether to add a token between `--space-sm: 8px` and `--space-md: 12px`, or round to `--space-md` | A 2px difference at CTA button height is perceptible. If the button visual needs exactly `10px`, a token is warranted. If `--space-md` reads correctly in the prototype, round and document. |

### Decorative / motion values

| Value | Where used | Action |
|---|---|---|
| `height: 3px` | `.accentStripe` on `/waitlisted` | This is a pure decorative value. Add `--accent-stripe-height: 3px` to `spacing.css`, or confirm it is an intentional one-off with a comment. Either way, remove the hardcoded `3px` from the module. |
| `animationDelay: 50ms` | Stats card on landing page | Add `--delay-stagger: 50ms` to `motion.css` alongside the existing duration tokens. Animation stagger delay is a motion design value and belongs with the other motion tokens. |

---

## Files to update

- `packages/design-system/tokens/spacing.css` — `--nav-height`, `--panel-max-width`, `--avatar-xs`, `--avatar-stack-offset`, `--accent-stripe-height`, and any avatar size scale tokens
- `packages/design-system/tokens/typography.css` — `--text-hero`
- `packages/design-system/motion.css` — `--delay-stagger`
- `packages/design-system/CHANGELOG.md` — [Amendment 08] or next in sequence

---

## Deliverable

Updated token files only. No prototype changes needed — Claude Code has already built the components and will swap in the tokens via handoff 015.

Note in the CHANGELOG: for each token, document the value, the component it was introduced for, and any design notes (e.g. "avatar stack offset is derived from `--avatar-xs`").
