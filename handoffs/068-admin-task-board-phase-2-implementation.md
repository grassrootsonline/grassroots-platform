# Admin task board: board UI (phase 2 implementation)

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `feature` |
| **Branch** | `feat/admin-board-ui` |
| **Depends on** | 066 (merged — `board_cards` schema/enums) · prototype `design-handoffs/core-social-mvp/prototypes/10-admin-task-board.dc.html` (handoff 067) |

---

## Problem

066 shipped the `board_cards` data layer; 067's prototype is now in `design-handoffs/core-social-mvp/prototypes/10-admin-task-board.dc.html`. This handoff builds the real board into the admin panel, matching that prototype: four columns (**Inbox → Discussing → Handoff → Done**), cards showing a type badge + title + 2-line body preview + author, create/edit via a sheet overlay, and drag to move a card between columns and reorder within one.

**Read the prototype first** — it is the authoritative reference for layout, states, icons, and interaction. This handoff mirrors the structure already established by `/admin/users` (handoff 061) and `/admin/careers`; **read both before starting** — same server-component-page + client-row + Server-Action pattern, reused here for consistency.

Admin-only; the existing admin shell (sidebar, gate, `nav.tsx`) already handles auth and the "not authorized" state — slot the board into it, don't rebuild it.

## Affected files

- `apps/web/src/app/admin/board/page.tsx` — new (Server Component; reads `board_cards` via `db`; `force-dynamic`)
- `apps/web/src/app/admin/board/board-view.tsx` — new (client component; columns, drag state, overlay)
- `apps/web/src/app/admin/board/board.module.css` — new (the prototype's `.board` / `.board-column` / `.board-card` / `.col-*` / `.seg` / `.avatar-xs` / `.type-badge` / `.meta-row` styles, **translated to design tokens** — see Token discipline)
- `apps/web/src/actions/admin-board.actions.ts` — new (`createCard`, `updateCard`, `moveCard`, `deleteCard`)
- `apps/web/src/app/admin/nav.tsx` — add the "Task board" nav item
- `apps/web/src/middleware.ts` — classify `/admin/board` (see Route classification)

## Implementation steps

### 1. `apps/web/src/actions/admin-board.actions.ts`

Follow the exact shape of `admin-users.actions.ts`: `'use server'`, `requireAdmin()` first in every action, Zod-validate, mutate via `db`, then `revalidatePath('/admin/board')`. Import `boardCards` (and the enums) from `@grassroots/db/schema`.

- `createCardAction({ type, title, body, status })` — insert; set `position` to the end of the target column (e.g. `max(position) + 1` within that status, or a large gap step).
- `updateCardAction(id, { type, title, body, status })` — update fields; set `updatedAt: new Date()` (there's no DB `$onUpdate` in this repo — the action bumps it explicitly).
- `moveCardAction(id, { status, beforeId | position })` — the drag write. Use **fractional positioning**: new `position` = midpoint between the neighbours it's dropped between (`(prev.position + next.position) / 2`); dropped at the end → `max + 1`; at the start → `min / 2` (or `min - 1`). The `position` column is `numeric`, so midpoints are exact; at single-user volume there's no realistic precision concern, so no rebalancing job is needed for v1 — but leave a one-line comment noting a rebalance is the fallback if positions ever converge.
- `deleteCardAction(id)` — hard delete (the prototype's trash action; no soft-delete column exists).

Zod: `type` ∈ enum, `status` ∈ enum, `title` non-empty (cap ~200), `body` optional (cap ~5000). Reject empty title (matches the prototype, which no-ops save on a blank title).

Commit: `feat(admin): add board card Server Actions (create/update/move/delete)`

### 2. `apps/web/src/app/admin/board/page.tsx`

Server Component, `export const dynamic = 'force-dynamic'` (it reads the DB — this repo has broken builds before when a DB-reading page wasn't dynamic). Read all cards via `db` ordered by `(status, position)`, pass to `board-view.tsx`. Header copy is taken verbatim from the prototype: title "Task board", subtitle "Log bugs, ideas, and planning items. The advisor reads these to turn into handoffs."

Provide a layout-accurate `BoardSkeleton` for the loading state per ARCHITECTURE.md.

Commit: `feat(admin): add task board page`

### 3. `apps/web/src/app/admin/board/board-view.tsx`

Client component. Holds the columns, the drag state, and the create/edit overlay, exactly as the prototype's `Component` does — port its logic (`moveCard`, `openCreate`/`openEdit`, `save`, `remove`, the drag handlers). Apply moves/edits **optimistically**, then call the matching Server Action and let `revalidatePath` reconcile. Use Framer Motion per ARCHITECTURE.md and `motion.css` durations.

Match the prototype precisely:
- **Card**: `badge badge-muted` type badge with the type icon, title, 2-line clamped body preview, footer avatar (`.avatar-xs` initials via the CLAUDE.md `getInitials` helper) + author + created date; `ti-grip-vertical` drag handle on hover; `draggable`.
- **Overlay** (create/edit): the `.sheet` pattern with segmented **Type** control (bug/idea/planning), a segmented **Status** control shown **only when editing**, Title input, optional Body textarea, an edit-only meta row (author/created/updated), and Save/Cancel + an edit-only danger Delete.
- **Empty states**: empty board (centered card, `ti-layout-kanban`) and empty column ("No cards yet", `ti-plant-2`, dashed border).
- **Icons** (Tabler outline only): types `bug` / `bulb` / `clipboard-list`; columns `inbox` / `messages` / `arrow-right-circle` / `circle-check`.

> Author display: v1 is single-author (Alex), but bind the avatar/name to the card's real author via `display_name` + initials fallback (CLAUDE.md user-data conventions), so it stays correct when the board goes team-facing. Handle a null `author_id` as `[deleted]` — `066` set `author_id` to `SET NULL`.

Commit: `feat(admin): build interactive board view with drag and card overlay`

### 4. `apps/web/src/app/admin/nav.tsx`

Add a "Task board" item using `ti-layout-kanban`, placed **last** (after Applications), matching the prototype sidebar. Active on `/admin/board`.

Commit: `feat(admin): add Task board nav item`

## Token discipline — do not hardcode from the prototype

The prototype's `<style>` block carries ad-hoc pixel values (e.g. `9px`/`7px`/`6px`/`4px` spacings, the `22px` `.avatar-xs`, the `2px` drop-indicator, `999px` radius, icon `font-size`s). The prototype is a **visual reference, not source** — per root `CLAUDE.md`, CSS Modules may contain **no raw px/hex/rgba**; every value must resolve to a design token.

- Map each value to an existing `--space-*` / `--radius-*` / `--text-*` / `--color-*` token.
- Where **no token fits** — the most likely gaps are the **`.avatar-xs` size (~22px)**, the **sub-`--space-sm` micro-gaps (~6–7px)**, and the **2px drop-indicator** — **stop and raise a token request to `claude-design`** (the "Token requests — stop before hardcoding" rule), don't invent a value. Flag these to Alex in your completion report; they may need a small `claude-design` amendment to land before this fully merges.
- **Sanctioned exception:** `font-size: 16px` on the Title input / Body textarea stays hardcoded (iOS zoom).
- **Shadow:** resting cards must stay **shadowless** (CLAUDE.md). The dragging card's `box-shadow: var(--shadow-dropdown)` is a design-approved transient elevation — apply it **only** on the `.is-dragging` state; do not add shadow to resting cards, and don't "correct" the drag state away.
- **Reused global DS classes** the prototype assumes exist: `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-ghost`, `.badge`/`.badge-muted`, `.input`, `.field`/`.field-label`, and the **sheet** trio `.sheet`/`.sheet-backdrop`/`.sheet-handle`. Confirm each is actually in the shipped design system; if the sheet classes aren't, that's a `claude-design` component request, not something to reimplement inline.

## Route classification

`/admin/board` is a new route — add it to `middleware.ts`. It's almost certainly covered by the existing `/admin` prefix rule in `GATED_PATHS` (as `/admin/users` and `/admin/careers` are) — **confirm that rather than assume**, and run `pnpm check:routes` before your final commit.

Commit: `chore(admin): classify /admin/board route as gated` (only if an explicit entry is needed)

## Verification

- [ ] `/admin/board` renders four columns, cards grouped by status and ordered by `position`.
- [ ] "New card" and the per-column "+" create a card (optimistic), persisting on refresh, at the end of the target column.
- [ ] Opening a card edits its fields and status; `updated_at` bumps.
- [ ] Dragging a card to another column changes its status; reordering within a column persists `position`; a refresh preserves the exact order.
- [ ] Delete removes the card.
- [ ] A non-admin calling any `admin-board` Server Action directly is rejected by `requireAdmin()`.
- [ ] `board.module.css` contains **no** raw px/hex/rgba except the input `font-size: 16px`; every gap not covered by a token was raised to `claude-design` (list them in the completion report).
- [ ] Resting cards have no shadow; only `.is-dragging` uses `--shadow-dropdown`.
- [ ] `export const dynamic = 'force-dynamic'` is on the page; `pnpm check:routes`, `pnpm type-check`, and lint all pass.
- [ ] The imported table/enum names match the **merged** `packages/db/src/schema.ts` from 066 (confirm the real names — `boardCards`, `boardCardTypeEnum`, `boardCardStatusEnum`, columns `type/title/body/status/position/authorId/createdAt/updatedAt` — rather than trusting this handoff, in case anything was adjusted at merge).

## Workflow

Branch off `development` (`feat/admin-board-ui`). Push and stop — no PR, no merge; Alex reviews the preview. Conventional Commits, title **and** body.

---

Still deferred (not in this handoff): comment/discussion threads on cards, labels, severity/priority, assignees, card→handoff links.
