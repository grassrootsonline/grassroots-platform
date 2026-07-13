# Fix admin board "New card" sheet — backdrop renders above form, blocking all clicks

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/admin-board-sheet-stacking` |
| **Depends on** | none |

---

## Problem

On `/admin/board`, clicking "New card" (or a column's add button, or an existing card to edit) opens a sheet that is fully visible but completely non-interactive — clicking into the title field, typing, or pressing any button does nothing usable. Reported by Alex directly (2026-07-12): "it shows me what resembles a ui for creating a card, but it's not interactive."

Root cause, confirmed by reading `apps/web/src/app/admin/board/board-view.tsx` (lines 362–477): the backdrop and the sheet are rendered as **siblings**, not nested:

```tsx
<AnimatePresence>
  {overlay && (
    <>
      <motion.div className="sheet-backdrop" onClick={closeOverlay} ... />
      <motion.div className="sheet" onClick={(e) => e.stopPropagation()} ...>
        {/* form content */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

`.sheet-backdrop` (`packages/design-system/responsive.css:205`) sets `z-index: var(--z-overlay)` (`200`, from `tokens/spacing.css`). `.sheet` (`responsive.css:217`) sets no `z-index` at all — it's `auto`. Per CSS stacking rules, a positioned sibling with an explicit z-index always paints above a positioned sibling with `z-index: auto`, regardless of DOM order. So the full-screen backdrop sits visually on top of the sheet. The sheet is still visible (the backdrop is a translucent scrim, not opaque), but every click — including on the title input — lands on the backdrop's `onClick={closeOverlay}` instead of the form control underneath.

This is the only place in the codebase that uses `.sheet-backdrop`/`.sheet` (confirmed via grep) — a first-usage composition mistake, not a systemic pattern bug. The CSS itself is correctly authored; nothing in `packages/design-system/` needs to change.

---

## Background

`.sheet` + `.sheet-backdrop` is documented as a mobile-modal pattern in `packages/design-system/reference.html` and `responsive.css` (`design system CLAUDE.md` binding on style). The reference implementation implies the sheet is meant to be the visual element that sits above the scrim — any correct usage needs the sheet to actually paint above the backdrop, which either requires nesting (child always paints above parent's own background, independent of z-index) or matching/exceeding z-index values on both elements. This handoff fixes the one place that got it wrong rather than changing the shared CSS.

---

## Affected files

- `apps/web/src/app/admin/board/board-view.tsx` — restructure the overlay JSX so the sheet is nested inside the backdrop

---

## Implementation steps

### 1. Nest `.sheet` inside `.sheet-backdrop`

Replace the sibling structure (lines 362–477) so the sheet motion.div is a child of the backdrop motion.div, not a sibling. This is more robust than just adding a z-index to `.sheet`, since it doesn't depend on two independently-maintained z-index values staying in sync:

```tsx
<AnimatePresence>
  {overlay && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
      className="sheet-backdrop"
      onClick={closeOverlay}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
        className="sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* unchanged form content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Everything inside the inner `motion.div` (the sheet-handle, header, fields, actions row) is unchanged — only the wrapping structure moves from two siblings to parent/child. Confirm `.sheet-backdrop`'s desktop flex-centering rule (`responsive.css:253–258`, `display: flex; align-items: center; justify-content: center`) still centers `.sheet` correctly once nested — it should, since that rule already assumes `.sheet` is a flex child of the backdrop, which was actually never true before this fix.

Commit: `fix(admin-board): nest sheet inside backdrop to fix z-index stacking blocking clicks`

---

## Verification

- [ ] On `/admin/board`, click "New card" — the sheet opens, and clicking directly into the Title field focuses it and accepts typed input.
- [ ] Click a segmented control button (Type) — it visibly toggles active state.
- [ ] Fill in a title, click "Add card" — card is created and appears in the Inbox column (optimistic update, then confirmed).
- [ ] Click an existing card to open the edit sheet — same interactivity check, plus Status segmented control (edit-only) and Delete button both work.
- [ ] Click on the backdrop itself (outside the sheet) — overlay closes, as before.
- [ ] Desktop viewport (≥768px): sheet still renders centered as a modal, not full-bleed from the bottom.
- [ ] Mobile viewport (<768px): sheet still slides up from the bottom correctly.
- [ ] `pnpm type-check` passes.
