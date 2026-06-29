# 005 — globals.css: Amendment 06 dark-theme overrides

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/globals-dark-theme-amendment06` |
| **Depends on** | none |

---

## Problem

`apps/web/src/styles/globals.css` has two `[data-theme]` attribute blocks that mirror the dark/light token values for the dev theme switcher. These blocks were last updated for Amendment 05 (warm-grey dark neutrals) and are missing the three new Amendment 06 tokens:

- `--shadow-overlay` dark override
- `--shadow-dropdown` dark override
- `--border-accent-subtle` dark override (new token, no value in either [data-theme] block)

When a developer forces dark mode via the switcher on a light-mode system (i.e. `data-theme="dark"` wins over `@media (prefers-color-scheme: light)`), these tokens fall back to their light-mode defaults: nearly invisible shadows and a light-mode sage border. The `@media` block in `colors.css` has the correct values, but `[data-theme]` attribute selectors have higher specificity and shadow the media query — so `[data-theme="dark"]` must explicitly declare everything `colors.css` declares in its dark block.

Additionally, `[data-theme="light"]` does not include `--border-accent-subtle`. A dark-mode system user who forces light via the switcher will have `--border-accent-subtle` set to the dark-accent RGB (`rgba(138, 173, 137, 0.30)`) from the `colors.css` @media block, which `[data-theme="light"]` should reset.

This gap was documented in `packages/design-system/CHANGELOG.md` Amendment 06, "App follow-up required" block.

---

## Background

Two dark-mode mechanisms coexist:

1. `@media (prefers-color-scheme: dark)` in `tokens/colors.css` — responds to system preference. Correct for production.
2. `[data-theme="dark"]` in `globals.css` — the dev theme switcher. Higher specificity (0,2,0 vs 0,1,0). Must mirror every override that lives in the colors.css @media block, or the switcher shows stale values.

Shadow tokens are defined in `spacing.css` (light-mode values) and overridden in `colors.css` @media block (dark-mode values). The `[data-theme="dark"]` block in globals.css must also declare the dark values, or the switcher shows light-mode shadows in forced-dark mode.

---

## Affected files

**Edited:**
- `apps/web/src/styles/globals.css` — add Amendment 06 tokens to `[data-theme="dark"]` and `[data-theme="light"]`
- `packages/design-system/CHANGELOG.md` — add missing `---` separator between [06] and [05]

---

## Token dependencies

| Token | Status | Defined in |
|---|---|---|
| `--shadow-overlay` | ✅ defined | `tokens/spacing.css` (light), `tokens/colors.css` @media (dark) |
| `--shadow-dropdown` | ✅ defined | `tokens/spacing.css` (light), `tokens/colors.css` @media (dark) |
| `--border-accent-subtle` | ✅ defined | `tokens/spacing.css` (light), `tokens/colors.css` @media (dark) |

---

## Implementation steps

### Step 1 — Add Amendment 06 overrides to `[data-theme="dark"]`

Open `apps/web/src/styles/globals.css`. Find the `:root[data-theme="dark"]` block. It currently ends with:

```css
  --color-warm-subtle:    #2E211A;
}
```

Add three lines before the closing `}`:

```css
  --shadow-overlay:        0 4px 24px rgba(0, 0, 0, 0.32), 0 1px 6px rgba(0, 0, 0, 0.18);
  --shadow-dropdown:       0 4px 16px rgba(0, 0, 0, 0.24), 0 1px 4px rgba(0, 0, 0, 0.12);
  --border-accent-subtle:  0.5px solid rgba(138, 173, 137, 0.30);
```

Also update the comment above the `[data-theme]` blocks from:

```css
   Values mirror the v05 canonical fixture in tokens/colors.css.
```

to:

```css
   Values mirror tokens/colors.css — updated through Amendment 06.
```

### Step 2 — Add `--border-accent-subtle` reset to `[data-theme="light"]`

Find the `:root[data-theme="light"]` block. It currently ends with:

```css
  --color-warm-subtle:    #F0EAE0;
}
```

Add one line before the closing `}`:

```css
  --border-accent-subtle:  0.5px solid rgba(107, 140, 106, 0.30);
```

This ensures a dark-mode system user who forces light via the switcher gets the correct light-mode sage, not the dark-mode accent RGB that the `colors.css` @media block would otherwise set.

Commit both changes together: `fix: add Amendment 06 shadow and border-accent-subtle to globals.css dark/light theme blocks`

### Step 3 — Fix missing separator in CHANGELOG.md

Open `packages/design-system/CHANGELOG.md`. Between the [06] and [05] entries there is no `---` divider, unlike every other entry. Find:

```markdown
**App follow-up required:** ...
```

(the closing block of the [06] entry) and add `---` on a blank line after it, before `## [05]`:

```markdown
---

## [05] — 2026-06-29 · Dark mode neutral palette (green-on-black)
```

Include in the same commit.

---

## Verification

- [ ] In the dev build with theme switcher set to dark: modals and dropdowns have visibly deeper shadows than in light mode.
- [ ] In the dev build with theme switcher set to dark: `.projectSelect` in the composer shows the dark-accent sage border (`rgba(138, 173, 137, 0.30)`), not the light sage.
- [ ] In the dev build with theme switcher set to light on a dark-mode system: `.projectSelect` shows the light sage border (`rgba(107, 140, 106, 0.30)`), not the dark sage.
- [ ] The `[data-theme="dark"]` block comment references Amendment 06.
- [ ] No other token values changed. Only the three additions to `[data-theme="dark"]` and one addition to `[data-theme="light"]`.
- [ ] `packages/design-system/CHANGELOG.md` has `---` between every entry, including between [06] and [05].
