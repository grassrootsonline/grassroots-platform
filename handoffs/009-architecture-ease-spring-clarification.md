# 009 — ARCHITECTURE.md: clarify ease-spring usage

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `low` |
| **Type** | `docs` |
| **Branch** | `chore/ease-spring-doc-fix` |
| **Depends on** | none |

---

## Problem

`docs/ARCHITECTURE.md` §12.2 says "no spring, no bounce" categorically. `packages/design-system/motion.css` defines `--ease-spring` and uses it in `.animate-sheet-up` for bottom sheet entrance. These contradict each other — Claude Code reading only §12.2 would (incorrectly) treat `.animate-sheet-up` as a design system bug.

`--ease-spring` is intentional and correct for bottom sheets. Bottom sheet entrance on mobile is physically grounded motion — the panel arrives from below with slight overshoot, which feels natural on touch surfaces. The restriction in §12.2 is meant to prevent bounce on interactive UI controls (buttons, cards, hover states), not to prohibit it universally.

---

## Affected files

**Edited:**
- `docs/ARCHITECTURE.md` — update §12.2 wording to scope the spring/bounce restriction correctly

---

## Token dependencies

None.

---

## Implementation

In `docs/ARCHITECTURE.md`, find §12.2. The current opening sentence reads:

```
> These comply with the design system's motion rule (`packages/design-system/motion.css` + its guide), which is binding and wins on any conflict: **restrained, functional motion only — no spring, no bounce, and no scale/shrink on press or interactive state.** Durations/easing come from the motion tokens (`--duration-*`, `--ease-*`); press and state changes use **opacity/color**, not transforms.
```

Replace with:

```
> These comply with the design system's motion rule (`packages/design-system/motion.css` + its guide), which is binding and wins on any conflict: **restrained, functional motion only — no spring or bounce on interactive controls (buttons, cards, hover, press states).** Bottom sheet entrance (`.animate-sheet-up`) is the one permitted use of `--ease-spring`, where slight overshoot on arrival is physically grounded. Durations/easing come from the motion tokens (`--duration-*`, `--ease-*`); press and state changes use **opacity/color**, not transforms.
```

Commit: `docs: clarify ease-spring usage in ARCHITECTURE.md §12.2`

---

## Verification

- [ ] §12.2 no longer says "no spring, no bounce" as a blanket rule.
- [ ] The exception for `.animate-sheet-up` / bottom sheet entrance is explicit.
- [ ] The prohibition on spring for interactive controls (buttons, cards, press states) is still clear.
