# Design brief: Admin task board (Trello-style cards)

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `medium` |
| **Type** | `design-brief` |
| **Branch** | N/A — new feature folder, follow your standard `design-handoffs/<feature>/` process (suggest `admin-board`) |
| **Depends on** | none for design; the backend is handoff 066 (`claude-code`), running in parallel |

---

## Problem

Alex wants an internal task board inside the existing admin panel to run the maintainer↔advisor loop: he logs bugs (with repro steps), ideas, and planning items as cards in status columns; the advisor (Claude Cowork) reads them from Supabase to reason about and turn into handoffs. It's admin-only tooling, not a user-facing surface.

This brief covers the **board UI**. The data layer (table, enums, RLS) is scoped in handoff 066 and can proceed in parallel — it doesn't depend on final visual layout, and the column/type/field names below are locked to match it, so the eventual implementation lines up cleanly.

Per the project's standard flow, this round produces a **working prototype** under `design-handoffs/admin-board/prototypes/` (your standard `.dc.html` process) that the Phase 2 implementation handoff will reference.

---

## Goals for this round

1. **Board layout** — four columns, left to right: **Inbox → Discussing → Handoff → Done**. Trello-style horizontal columns of stacked cards, inside the admin panel shell (same nav/chrome as the dashboard/careers/users screens — it must read as part of the same admin area, not a bolted-on tool). Handle the responsive case via the design system's `responsive.css` patterns (horizontal scroll or stack on narrow widths — your call, but use the existing pattern).
2. **Card** — shows the card **type** (bug / idea / planning) as a small badge, the **title**, and a truncated **body** preview. Types need to be visually distinguishable, but **within the style rules** — sage `#6B8C6A` is the only interactive color, so differentiate types with the existing neutral/muted badge treatments and Tabler **outline** icons (e.g. bug, bulb, clipboard), not by introducing new hues. Card also shows the author (avatar with initials fallback per CLAUDE.md user-data conventions) — v1 is single-author (Alex), but design the card so it still reads correctly once the board is team-facing.
3. **Create card** — an "add card" affordance (a single new-card action defaulting to Inbox, and/or per-column). Form fields: **type** (select), **title** (required), **body** (multiline, optional). Sentence-case copy, existing `.input` / `.btn` components.
4. **Card detail / edit** — opening a card shows the full body and lets Alex edit fields and change status (move columns). Use the platform's existing overlay pattern (modal or sheet) — remember modals/toasts may carry shadow, but cards must not.
5. **Move between columns** — demonstrate the drag affordance: dragging a card to another column (status change) and reordering within a column. The actual writes are Server Actions in Phase 2 code, but the prototype should show the intended drag handle / drop-target / dragging-card states.
6. **Empty states** — both an empty board and an empty column ("no cards yet"), in the app's small-team voice.

---

## Data shape (locked to handoff 066 — please match exactly)

- **Types:** `bug` · `idea` · `planning`
- **Columns / status:** `inbox` · `discussing` · `handoff` · `done` (in that order)
- **Fields:** `title` (required), `body` (optional), `type`, `status`, author, created/updated timestamps, and a `position` for ordering within a column (what drag-reorder writes to).

---

## Reference

- **Visual style:** `packages/design-system/CLAUDE.md` — binding, same as every screen (sentence-case; Inter 400/500; sage the only interactive color; 0.5px borders; no card shadow; Tabler outline icons; no emoji; dark mode via tokens).
- **Admin shell + siblings:** the existing admin prototypes (dashboard, careers, users — from handoffs 051/061). The board should reuse the admin nav and the same card/table/badge styling. Point the new board prototype at those as its sibling so it feels native to the panel.
- **Reuse, don't invent:** the existing card component (`.feed-card`), badges (`badge-muted` / `badge-accent` / `badge-danger`), buttons (`.btn`, `.btn-sm`, variants), and inputs are already in the system — build from them.

---

## Non-goals for this round (don't design these yet)

- **Comments / discussion threads on cards** — the advisor responds in chat and via handoffs, not on the board. Deferred.
- **Labels, severity/priority, assignees, card→handoff links** — deferred "richer" scope; the schema can add them non-destructively later.
- **Multiple boards** — a single board only.
- **Real-time presence / notifications** — single-user, not needed.
- **Any auth/login design** — admin gating is server-side (same as handoff 051); just design the panel content plus the plain "not authorized" state if a non-admin lands on the URL (likely already covered by the admin shell).

---

## Token / pattern note

The board should reuse existing components. If the **column layout** or **drag states** (drag handle, drop target, dragging-card elevation) genuinely need a value with no existing token, raise a token request via your standard `design-handoffs/` amendment process rather than hardcoding — and flag it, so I can sequence the token before the Phase 2 implementation handoff. Card elevation while dragging is the most likely candidate; check whether an existing modal/elevation token already covers it before requesting a new one.

---

## Timeline

No hard deadline on this one. Flag it if the full scope doesn't fit comfortably so we can re-sequence rather than compress — and prioritize the core board + card + create/edit over the drag polish if anything has to trail.

---

## Handoff to Claude Code

Once the prototype exists, the advisor (Claude Cowork) writes the Phase 2 implementation handoff referencing it — no need to coordinate directly with Claude Code. The backend (handoff 066: `board_cards` table, enums, RLS) is already scoped and proceeds in parallel, since it doesn't depend on final visual layout.
