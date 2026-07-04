# Replace hardcoded `gap: '24px'` in profile/thread layout with a spacing token

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `low` |
| **Type** | `fix` |
| **Branch** | `fix/hardcoded-gap-profile-thread` |
| **Depends on** | none |

---

## Problem

`profile-view.tsx` and `thread-view.tsx` both open their root layout with:

```tsx
<div style={{ display: 'flex', gap: '24px' }}>
```

Root `CLAUDE.md` is explicit: "Hardcoded values are never allowed — no raw px, hex, rgba, or numeric literals in any CSS Module or component style." This is a raw px literal in an inline `style` prop, which the same rule covers ("any CSS Module or component style"). The sibling route, `feed-view.tsx`, does this correctly via a CSS Module class (`className={s.layout}`) — these two files are the only ones that regressed to an inline literal.

24px exactly matches the existing `--space-relaxed` token (added in Design System Changelog [07], defined for exactly this use: "Column gaps... between-section margins"), so no new token is needed — this is a pure substitution.

---

## Affected files

- `apps/web/src/app/(platform)/profile/[username]/profile-view.tsx`
- `apps/web/src/app/(platform)/profile/[username]/page.module.css`
- `apps/web/src/app/(platform)/feed/[postId]/thread-view.tsx`
- `apps/web/src/app/(platform)/feed/[postId]/page.module.css`

---

## Token dependencies

| Token | Status | Value |
|---|---|---|
| `--space-relaxed` | `defined` | `24px` (Design System Changelog [07]) |

---

## Implementation steps

1. **`profile-view.tsx`**

   Add a `.layout` class to `page.module.css`:

   ```css
   .layout {
     display: flex;
     gap: var(--space-relaxed);
   }
   ```

   Replace the inline style:

   ```tsx
   <div className={s.layout}>
   ```

   Commit: `fix: replace hardcoded gap in profile layout with --space-relaxed token`

2. **`thread-view.tsx`**

   Same pattern — add `.layout` to `feed/[postId]/page.module.css` (or reuse if an equivalent class already exists there), replace the inline style with `className={s.layout}`.

   Commit: `fix: replace hardcoded gap in thread layout with --space-relaxed token`

---

## Verification

- [ ] Both pages render with identical visual spacing to before (24px gap unchanged).
- [ ] Grep `apps/web/src/app/(platform)/profile/[username]/profile-view.tsx` and `apps/web/src/app/(platform)/feed/[postId]/thread-view.tsx` for `24px` — confirm zero results.
- [ ] `pnpm type-check` passes.
