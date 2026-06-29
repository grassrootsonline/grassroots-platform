# Token request — scrim, overlay shadow, and dropdown shadow

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `token-request` |
| **Branch** | n/a — Claude Design produces an amendment document |
| **Depends on** | handoff `001-fix-hardcoded-design-tokens.md` defines provisional values that this formalizes |

---

## Context

Three semantic tokens were found missing during the design system audit (2026-06-29). Their absence caused critical bugs — most notably, modals had no shadow at all because `--shadow-overlay` was referenced but never defined.

Handoff `001` shipped provisional values to Claude Code to fix the bugs immediately. This document asks Claude Design to review those provisional values and produce **Amendment 06** with considered, final definitions.

There is also a secondary question about the accent border on the composer's project select — noted at the end.

---

## Tokens to formalize

### `--shadow-overlay`

**Used for:** `box-shadow` on elevated modal surfaces — the auth modal panel, composer modal panel, notification panel, command palette. These are the highest-elevation surfaces in the Z-stack (z-index 300).

**Provisional value currently in `spacing.css`:**
```css
--shadow-overlay: 0 4px 24px rgba(0, 0, 0, 0.10), 0 1px 6px rgba(0, 0, 0, 0.06);
```

**Questions for Claude Design:**
- Is this depth/spread correct for modal-level elevation?
- Should the modal shadow differ from the dropdown shadow in a meaningful way, or is a proportional reduction sufficient?
- Does this token need a dark-mode variant? On dark backgrounds, low-opacity shadows may need higher opacity to read correctly.

---

### `--shadow-dropdown`

**Used for:** `box-shadow` on `.dropdown-menu` (pop-up menus that appear at z-index 200, just below modals).

**Provisional value currently in `spacing.css`:**
```css
--shadow-dropdown: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
```

**Questions for Claude Design:**
- Is a shallower spread than `--shadow-overlay` the right call for this elevation level?
- Dark mode behaviour?

---

### `--color-scrim`

**Used for:** `background` of fixed-position overlay backdrops — auth modal, composer modal, command palette (`.command-backdrop`), bottom sheet (`.sheet-backdrop`).

**Provisional value currently in `colors.css`:**
```css
--color-scrim: rgba(0, 0, 0, 0.40);
```

**Previous hardcoded values:**
- Modal backdrops used `rgba(28, 43, 26, 0.32)` — green-tinted ink at 32% opacity.
- Sheet backdrop used `rgba(28, 43, 26, 0.40)` — same base, 40% opacity.

The green tint was thematic but not tokenized, and would look wrong in dark mode (dark-green overlay on warm-grey background). The provisional value is neutral black at 40% opacity, which works in both themes.

**Questions for Claude Design:**
- Should modal scrims and sheet scrims share the same token, or should they have separate opacity levels?
- Is `rgba(0, 0, 0, 0.40)` the right opacity, or should it be `0.32` to match the original modal value?
- Should the scrim reference a theme colour, or is neutral black appropriate here (conventional practice)?

---

## Secondary question — accent border

During the audit, `composer-modal.module.css` was found using `rgba(107, 140, 106, 0.3)` — a 30%-opacity sage border — on the `.projectSelect` element. This was replaced in handoff `001` with the existing `--border-accent` token (`0.5px solid var(--color-accent)`), which is fully opaque sage.

The visual difference is notable: fully opaque `--border-accent` reads as a much stronger sage line than the intended 30%-opacity hint. If the design intent was a subtle, semi-transparent accent border, a new token would be needed.

**Question for Claude Design:** Should `--border-accent` remain fully opaque, or should a second token (e.g. `--border-accent-subtle`) be added at reduced opacity to cover use cases like the composer's project select?

---

## Deliverable

An amendment file at `design-handoffs/core-social-mvp/AMENDMENT-06-shadow-scrim-tokens.md` following the amendment template at `design-handoffs/AMENDMENT-TEMPLATE.md`. The amendment should:

1. Finalize values for `--shadow-overlay`, `--shadow-dropdown`, and `--color-scrim`.
2. Specify whether any of these tokens need dark-mode overrides in `colors.css`.
3. Answer the `--border-accent-subtle` question.
4. Provide fixtures or find/replace instructions so Claude Code can replace the `/* provisional */` comments in `spacing.css` and `colors.css` with the amendment reference.
