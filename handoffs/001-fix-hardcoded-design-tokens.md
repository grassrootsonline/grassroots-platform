# Fix hardcoded colour and shadow values across design system and app CSS

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/hardcoded-design-tokens` |
| **Depends on** | none — provisional tokens are fully specified below |

---

## Problem

Several files bypass the design token system by hardcoding colour and shadow literals. This produces three active bugs and one token misuse:

1. **`--shadow-overlay` is undefined.** It is referenced in four files but exists nowhere in the design system. Every modal and panel silently renders with no shadow — the `var()` resolves to an empty value.

2. **Scrim backdrops use a hardcoded green-tinted colour.** `rgba(28, 43, 26, 0.32)` (modal scrims) and `rgba(28, 43, 26, 0.4)` (sheet backdrop) hard-wire the light-mode `--color-ink` hex into overlay backgrounds. These do not flip in dark mode, and look wrong against the warm Anthropic-grey dark backgrounds shipped in Amendment 05.

3. **Dropdown shadow uses the same hardcoded green-tinted base.** `components-new.css` sets `.dropdown-menu` box-shadow using `rgba(28, 43, 26, …)`. This is a design system file — the value must be a token.

4. **Tooltip dark mode does not respond to `[data-theme]`.** `components-new.css` changes the tooltip's background/border structure inside `@media (prefers-color-scheme: dark)`. That media query does not fire when the dev theme switcher forces `data-theme="dark"` on `<html>`. The inverse problem also applies: `data-theme="light"` while the system is dark leaves the tooltip in light-mode appearance because the media query still fires.

Secondary token misuse:

5. **Composer `.projectSelect` border is hardcoded.** `rgba(107, 140, 106, 0.3)` is a 30%-opacity sage value. `--border-accent` is already defined in `spacing.css` (`0.5px solid var(--color-accent)`). Use the token. Note: the existing token is fully opaque sage, which is visually different from the 30%-opacity original — this difference is flagged to Claude Design in handoff `002`.

---

## Background

The design system is fully tokenized. Every colour, shadow, and border value must reference a CSS custom property from `packages/design-system/tokens/`. Hardcoded values break dark mode flipping, create drift from the design system, and violate the binding rules in `packages/design-system/CLAUDE.md`.

`--shadow-overlay`, `--shadow-dropdown`, and `--color-scrim` are missing from the token system. Provisional values are specified below so the critical bugs can be fixed immediately. Claude Design will formalize these tokens via Amendment 06 (see handoff `002`). When that amendment lands, remove the `/* provisional */` comment and cite the amendment instead.

---

## Affected files

- `packages/design-system/tokens/spacing.css` — add `--shadow-overlay`, `--shadow-dropdown`
- `packages/design-system/tokens/colors.css` — add `--color-scrim`
- `packages/design-system/components-new.css` — replace hardcoded shadow and scrim values with tokens
- `packages/design-system/responsive.css` — replace `.sheet-backdrop` hardcoded scrim
- `apps/web/src/styles/globals.css` — add `[data-theme]` structural overrides for tooltip
- `apps/web/src/components/auth/auth-modal.module.css` — replace hardcoded scrim
- `apps/web/src/components/feed/composer-modal.module.css` — replace hardcoded scrim; fix `.projectSelect` border
- `apps/web/src/components/notifications/notification-panel.module.css` — no code change; already references `var(--shadow-overlay)` which resolves correctly once the token is defined

---

## Token dependencies

| Token | Status | Provisional value |
|---|---|---|
| `--shadow-overlay` | `provisional` | `0 4px 24px rgba(0, 0, 0, 0.10), 0 1px 6px rgba(0, 0, 0, 0.06)` |
| `--shadow-dropdown` | `provisional` | `0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)` |
| `--color-scrim` | `provisional` | `rgba(0, 0, 0, 0.40)` |
| `--border-accent` | `defined` | already `0.5px solid var(--color-accent)` in `spacing.css` — no change needed |

---

## Implementation steps

**Step 1 — Define provisional shadow tokens in `spacing.css`**

After the `--focus-ring` line, add:

```css
/* Shadows — provisional; pending Claude Design Amendment 06 (see handoffs/002) */
--shadow-overlay:  0 4px 24px rgba(0, 0, 0, 0.10), 0 1px 6px rgba(0, 0, 0, 0.06);
--shadow-dropdown: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
```

Commit: `fix: define provisional --shadow-overlay and --shadow-dropdown tokens`

---

**Step 2 — Define provisional `--color-scrim` in `colors.css`**

At the end of the `:root` block, immediately before the `@media (prefers-color-scheme: dark)` block, add:

```css
/* Scrim — provisional; pending Claude Design Amendment 06 (see handoffs/002) */
--color-scrim: rgba(0, 0, 0, 0.40);
```

No dark-mode override is needed — pure black opacity is neutral across both themes.

Commit: `fix: define provisional --color-scrim token`

---

**Step 3 — Replace hardcoded values in `components-new.css`**

Two changes in this file:

a) In `.command-backdrop`, replace:
```css
background: rgba(28, 43, 26, 0.32);
```
with:
```css
background: var(--color-scrim);
```

b) In `.dropdown-menu`, replace:
```css
box-shadow: 0 4px 16px rgba(28, 43, 26, 0.08),
            0 1px 4px  rgba(28, 43, 26, 0.04);
```
with:
```css
box-shadow: var(--shadow-dropdown);
```

Commit: `fix: components-new uses --color-scrim and --shadow-dropdown tokens`

---

**Step 4 — Replace hardcoded scrim in `responsive.css`**

In `.sheet-backdrop`, replace:
```css
background: rgba(28, 43, 26, 0.4);
```
with:
```css
background: var(--color-scrim);
```

Commit: `fix: sheet-backdrop scrim uses --color-scrim token`

---

**Step 5 — Replace hardcoded values in `auth-modal.module.css`**

In the backdrop rule (first rule in the file), replace:
```css
background: rgba(28, 43, 26, 0.32);
```
with:
```css
background: var(--color-scrim);
```

Commit: `fix: auth-modal backdrop uses --color-scrim token`

---

**Step 6 — Replace hardcoded values in `composer-modal.module.css`**

Two changes:

a) In the backdrop rule, replace:
```css
background: rgba(28, 43, 26, 0.32);
```
with:
```css
background: var(--color-scrim);
```

b) In `.projectSelect`, replace:
```css
border: 0.5px solid rgba(107, 140, 106, 0.3);
```
with:
```css
border: var(--border-accent);
```

Commit: `fix: composer-modal uses --color-scrim and --border-accent tokens`

---

**Step 7 — Add `[data-theme]` tooltip overrides in `globals.css`**

After the `[data-theme="light"]` block, add the following section. The comment explains the reason — do not remove it.

```css
/* ── Tooltip structural overrides for data-theme attribute ──────────────────
   components-new.css controls tooltip appearance in @media (prefers-color-scheme)
   blocks, but those do not respond to the [data-theme] attribute. Mirror the
   same structural rules here so the dev theme switcher works correctly.
   ─────────────────────────────────────────────────────────────────────── */
[data-theme="dark"] .tooltip {
  background: var(--color-surface);
  color: var(--color-ink);
  border: var(--border-default);
}
[data-theme="dark"] .tooltip::after {
  border-top-color: var(--color-surface);
}
[data-theme="dark"] .tooltip.tooltip-bottom::after {
  border-bottom-color: var(--color-surface);
}

[data-theme="light"] .tooltip {
  background: var(--color-ink);
  color: var(--color-canvas);
  border: none;
}
[data-theme="light"] .tooltip::after {
  border-top-color: var(--color-ink);
}
[data-theme="light"] .tooltip.tooltip-bottom::after {
  border-bottom-color: var(--color-ink);
}
```

Commit: `fix: tooltip appearance responds to data-theme attribute`

---

## Verification

- [ ] Auth modal: visible drop shadow in both light and dark mode. Scrim backdrop is a neutral dark overlay with no green tint.
- [ ] Composer modal: same as above. `.projectSelect` shows a sage hairline border.
- [ ] Notification panel: visible drop shadow in both modes (token was already referenced; now resolves).
- [ ] Command palette: neutral dark scrim backdrop, no green tint.
- [ ] Sheet (bottom drawer on mobile): neutral dark scrim.
- [ ] Dropdown menu: subtle shadow visible, no green tint, correct in both light and dark modes.
- [ ] Tooltip in dark mode (`data-theme="dark"` forced via dev nav while system is light): tooltip appears as a light surface with border — not a dark pill.
- [ ] Tooltip in light mode (`data-theme="light"` forced while system is dark): tooltip appears as a dark pill — not a light surface.
- [ ] Grep `rgba(28, 43, 26` across the entire repo — zero results.
- [ ] Grep `rgba(107, 140, 106` across the entire repo — zero results.
- [ ] In browser DevTools, inspect the computed `box-shadow` on an open modal overlay element — confirm it is not empty.
