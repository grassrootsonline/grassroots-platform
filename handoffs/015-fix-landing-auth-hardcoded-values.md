# 015 — Fix hardcoded values in landing page and auth screens

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/landing-auth-hardcoded-values` |
| **Depends on** | 014 (Claude Design must deliver and merge new tokens first) |

---

## Context

Audit of development branch found hardcoded values in the landing page and auth/waitlist screen CSS modules. These were left with acknowledging comments but not resolved. Per CLAUDE.md, no hardcoded values are allowed — values must reference design system tokens.

**Part A** of this handoff (inline style fixes) can be done immediately — these values already have tokens, they are just in the wrong place. **Part B** (token substitutions) must wait for handoff 014 tokens to be merged. Read the CHANGELOG before starting Part B to get the canonical token names.

---

## Part A — Fix inline style violations (no new tokens needed)

These three inline styles use static values and must move to the corresponding CSS module.

### Fix 1 — Landing page: value card icon colour

**File:** `apps/web/src/app/(auth)/page.tsx`

Line 96:
```tsx
<i className={`ti ti-${vp.icon} icon-lg`} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
```

Remove the `style` prop. Add `.valueCardIcon` to the CSS module:

```css
/* apps/web/src/app/(auth)/page.module.css */
.valueCardIcon {
  color: var(--color-accent);
}
```

Apply the class in JSX:
```tsx
<i className={`ti ti-${vp.icon} icon-lg ${s.valueCardIcon}`} aria-hidden="true" />
```

### Fix 2 — Landing page: stats card animation delay

**File:** `apps/web/src/app/(auth)/page.tsx`

Line 59:
```tsx
<div className={`${s.statsCard} animate-slide-up`} style={{ animationDelay: '50ms' }}>
```

Remove the `style` prop. Add the delay to the CSS module using the `--delay-stagger` token from handoff 014:

```css
/* apps/web/src/app/(auth)/page.module.css */
.statsCard {
  /* existing styles */
  animation-delay: var(--delay-stagger);
}
```

Note: `--delay-stagger` comes from handoff 014 / motion.css. If 014 is not yet merged, defer this specific fix until it is. The inline style is acceptable temporarily but must be resolved once the token lands.

### Fix 3 — Waitlist page: ti-leaf icon colour

**File:** `apps/web/src/app/(waitlisted)/waitlisted/page.tsx`

Line 30:
```tsx
<i className="ti ti-leaf icon-lg" style={{ color: 'var(--color-accent-ink)' }} aria-hidden="true" />
```

Remove the `style` prop. Add `.leafIcon` to the waitlist page CSS module:

```css
/* apps/web/src/app/(waitlisted)/waitlisted/page.module.css */
.leafIcon {
  color: var(--color-accent-ink);
}
```

Apply in JSX:
```tsx
<i className={`ti ti-leaf icon-lg ${s.leafIcon}`} aria-hidden="true" />
```

---

## Part B — Replace hardcoded values with tokens (requires handoff 014)

Before running these substitutions, `git pull` the branch that contains the 014 token additions and read `packages/design-system/CHANGELOG.md` to confirm token names.

**File:** `apps/web/src/app/(auth)/page.module.css`

| Current hardcoded value | Replace with | Token source |
|---|---|---|
| `.nav { height: 56px }` | `var(--nav-height)` | spacing.css |
| `.heroHeading { font-size: 52px }` | `var(--text-hero)` | typography.css |
| `.heroSubtext { max-width: 480px }` | `var(--panel-max-width)` | spacing.css |
| `.ctaBtn { padding: 10px var(--space-relaxed) }` | `var(--space-TOKEN) var(--space-relaxed)` — confirm token name from 014 CHANGELOG | spacing.css |
| `.heroGrid { grid-template-columns: 1fr 380px }` | `1fr var(--stats-card-width)` or `1fr var(--_stats-width)` — see 014 for design's decision | spacing.css or local variable |
| `.miniAvatar { width: 28px; height: 28px }` | `var(--avatar-xs)` each | spacing.css |
| `.miniAvatarOffset { margin-left: -8px }` | `var(--avatar-stack-offset)` | spacing.css |
| `.miniAvatarOffset { border: 2px solid }` | See 014 — if `--avatar-stack-border` exists, use it; if confirmed one-off, add explicit comment | spacing.css or comment |
| `@media (max-width: 768px)` breakpoint value | Leave as-is — this matches `responsive.css` breakpoint; check and align |  |

**File:** `apps/web/src/app/(waitlisted)/waitlisted/page.module.css`

| Current hardcoded value | Replace with | Token source |
|---|---|---|
| `.accentStripe { height: 3px }` | `var(--accent-stripe-height)` | spacing.css |

---

## Also check: `--nav-height` in navbar.tsx

The platform navbar at `apps/web/src/components/layout/navbar.tsx` likely uses a hardcoded `56px` for its height as well. If it does, replace that value with `var(--nav-height)` in the same commit. The landing page nav and the platform nav must use the same token.

---

## Verification checklist

- [ ] Part A complete: zero `style={}` props with static values in the three files listed
- [ ] Part B complete: zero raw `px` values in `(auth)/page.module.css` and `(waitlisted)/page.module.css` except `font-size: 16px` on inputs
- [ ] `pnpm type-check` passes
- [ ] Visual spot-check: landing page hero, stats card, nav, and value prop cards look correct in browser; waitlist page icon renders correctly in sage

Commit: `fix: replace hardcoded values in landing page and auth screens with design tokens`
