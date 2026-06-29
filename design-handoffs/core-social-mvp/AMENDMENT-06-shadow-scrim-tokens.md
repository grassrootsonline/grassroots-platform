# Amendment 06 — Shadow, scrim, and accent-border tokens

**Feature:** core-social-mvp
**Surface(s) affected:** Design-system token layer — `packages/design-system/tokens/spacing.css` and `packages/design-system/tokens/colors.css`. No component, layout, or screen change.
**Date:** 2026-06-29
**Responds to:** `handoffs/002-semantic-token-request.md`
**Depends on:** handoff `001` already applied (provisional `--shadow-overlay`, `--shadow-dropdown`, `--color-scrim`, and `--border-accent-subtle` are in `spacing.css` and `colors.css` with `/* provisional */` comments — this amendment finalizes them).

---

## ⚠ Branch & merge rule

Implement on a branch — `fix/shadow-scrim-tokens` (or append to the existing `fix/hardcoded-design-tokens` branch if it has not yet been merged). Push and stop. Do not merge. The maintainer reviews the Vercel preview.

---

## Design decisions

### 1. Shadow elevation system

The existing `--shadow-overlay: 0 4px 16px rgba(0,0,0,0.12)` in `spacing.css` is the documented canonical value for toasts and modals (design-system guide §Visual foundations). Handoff 001's provisional value (0.10/0.06 — two layers, softer) was a good idea in shape but slightly under the documented opacity. This amendment:

- **Keeps the two-layer structure** from the provisional — it gives crisper edge definition at close range while maintaining soft ambient spread. Better than the original single-layer value.
- **Aligns the primary layer opacity to the documented 0.12** — consistent with what the guide prescribes for modal-level elevation.
- **Adds proportionally lighter values for `--shadow-dropdown`** — at z-200, dropdowns sit one level below modals and should feel marginally more connected to the surface.
- **Adds dark-mode overrides for both** — on the warm-grey dark backgrounds (canvas `#1A1917`, surface `#232220`), pure-black shadows at 12% opacity nearly disappear. The dark values use ~2.5× higher opacity to produce the same perceptual contrast. These live in the `@media (prefers-color-scheme: dark)` block in `colors.css`, following the existing pattern.

**Final values:**

```
--shadow-overlay:  0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 6px rgba(0, 0, 0, 0.07);
--shadow-dropdown: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
```

Dark-mode overrides (add to `@media (prefers-color-scheme: dark)` in `colors.css`):

```
--shadow-overlay:  0 4px 24px rgba(0, 0, 0, 0.32), 0 1px 6px rgba(0, 0, 0, 0.18);
--shadow-dropdown: 0 4px 16px rgba(0, 0, 0, 0.24), 0 1px 4px rgba(0, 0, 0, 0.12);
```

> Note: the pre-existing single-value `--shadow-overlay: 0 4px 16px rgba(0,0,0,0.12)` that already lived in `spacing.css` is superseded by the new two-layer value. The `/* Elevation */` comment block should be updated accordingly (see fixture).

### 2. Scrim

**Decision: one token, neutral black, no dark-mode override.**

The original green-tinted values (`rgba(28,43,26,0.32)` for modals, `rgba(28,43,26,0.40)` for sheets) were thematic but unworkable — dark-green overlay on a warm-grey dark canvas reads as muddy. Neutral black is the conventional and correct choice; it is truly neutral across both themes and needs no `@media` override.

On the **opacity question**: using a single token for both modal and sheet scrims is the right call. One system rule. 0.40 is confirmed — it provides meaningful obscurance of the content behind the overlay, which is the functional purpose of a scrim. The original modal 0.32 was too sheer; 0.40 is closer to industry convention and works correctly against both the warm-light canvas (`#F7F6F4`) and the warm-dark canvas (`#1A1917`).

**Final value:**

```
--color-scrim: rgba(0, 0, 0, 0.40);
```

No dark-mode override. The provisional value is correct — no change.

### 3. `--border-accent-subtle`

**Decision: add the token.**

`--border-accent` (`0.5px solid var(--color-accent)`) is a strong, fully-opaque sage line — it belongs to clearly interactive states: focused inputs, active tabs, the accent badge border. The composer's `.projectSelect` is a different case: a field that is thematically affiliated with the sage accent (project colour coding), but not focused or active. A 30%-opacity sage border is semantically correct there — it says "this is in the sage family" without asserting interactivity.

Adding `--border-accent-subtle` keeps both use cases tokenized and prevents ad-hoc `rgba()` values from creeping back.

**Final value:**

```
--border-accent-subtle: 0.5px solid rgba(107, 140, 106, 0.30);
```

No dark-mode override needed — 30% sage opacity reads correctly on both the light surface (`#FAFAF8`) and the dark surface (`#232220`).

---

## What did NOT change

- All color tokens (light and dark) other than the shadow dark-mode additions.
- All spacing, radius, layout, z-index, and motion tokens.
- All component CSS, module CSS, and app code — handoff 001 already applied those changes. This amendment only finalizes the token values the code references.
- `--color-scrim` light-mode value: the provisional `rgba(0,0,0,0.40)` is confirmed; no change needed.

---

## Fixtures (`design-handoffs/core-social-mvp/fixtures/v06/`)

### `spacing.css` — full file (replaces `packages/design-system/tokens/spacing.css`)

See `fixtures/v06/spacing.css`. Key deltas vs. current repo:
- `--border-accent-subtle` added after `--border-accent`.
- `--shadow-overlay` updated from the old single-layer `0 4px 16px rgba(0,0,0,0.12)` to two-layer `0 4px 24px rgba(0,0,0,0.12), 0 1px 6px rgba(0,0,0,0.07)`.
- `--shadow-dropdown` added: `0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)`.
- `/* provisional */` comments removed; elevation comment block updated.

### `colors.css` — full file (replaces `packages/design-system/tokens/colors.css`)

See `fixtures/v06/colors.css`. Supersedes `fixtures/v05/colors.css`. Key deltas:
- `--color-scrim: rgba(0, 0, 0, 0.40)` added in the light `:root` block (finalizes the provisional).
- `--shadow-overlay` and `--shadow-dropdown` dark-mode overrides added to the `@media (prefers-color-scheme: dark)` block.
- All v05 dark neutrals (warm grey / green-on-black) retained unchanged.

---

## Execution checklist

- [ ] 1. **(required)** Replace `packages/design-system/tokens/spacing.css` with `fixtures/v06/spacing.css`. — `fix: finalize --shadow-overlay, --shadow-dropdown, --border-accent-subtle tokens (Amendment 06)`
- [ ] 2. **(required)** Replace `packages/design-system/tokens/colors.css` with `fixtures/v06/colors.css`. — `fix: add --color-scrim and dark-mode shadow overrides (Amendment 06)`
- [ ] 3. In `packages/design-system/tokens/spacing.css` and `packages/design-system/tokens/colors.css`, remove any remaining `/* provisional */` comments (the fixture files don't have them, but verify if handoff 001 added them inline).
- [ ] 4. Verify in **light mode**: open auth modal — has visible shadow, scrim is a neutral dark overlay (no green tint). Open a dropdown — has a subtle shadow. `.projectSelect` in composer shows a semi-transparent sage border (visually softer than `--border-accent`).
- [ ] 5. Verify in **dark mode** (`prefers-color-scheme: dark` or `data-theme="dark"`): modal and dropdown shadows are clearly visible against the warm-charcoal surfaces. Scrim unchanged (neutral black works in both).
- [ ] 6. Grep `rgba(28, 43, 26` across the repo — zero results (handoff 001 should have cleared these; confirm).
- [ ] 7. `pnpm lint && pnpm type-check` green. Push the branch and stop.

## Token summary (for future reference)

| Token | File | Value | Dark override |
|---|---|---|---|
| `--shadow-overlay` | `spacing.css` | `0 4px 24px rgba(0,0,0,0.12), 0 1px 6px rgba(0,0,0,0.07)` | Yes — `colors.css` dark block |
| `--shadow-dropdown` | `spacing.css` | `0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)` | Yes — `colors.css` dark block |
| `--color-scrim` | `colors.css` | `rgba(0,0,0,0.40)` | No |
| `--border-accent-subtle` | `spacing.css` | `0.5px solid rgba(107,140,106,0.30)` | No |
