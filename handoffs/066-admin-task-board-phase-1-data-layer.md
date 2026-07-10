# Admin task board: data layer (board_cards)

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `feature` |
| **Branch** | `feat/admin-board-schema` |
| **Depends on** | none (new table; references `users` only) |
| **Phase** | 1 of 2 — data layer only, no UI |

---

## Problem

Alex wants an internal task board inside the admin panel to run the maintainer↔advisor loop: log bugs (with repro), ideas, and planning items as cards in status columns, which the advisor then reads from Supabase to reason about and turn into handoffs. It's admin-only tooling, not a user-facing surface.

This handoff delivers **only the data layer** — the `board_cards` table and its enums — so the table exists and is readable immediately. The board UI is a separate claude-design handoff (Phase 2) that builds a working prototype under `design-handoffs/admin-board/prototypes/` first, which the real implementation then references (the project's standard per-feature flow).

Nothing in this handoff adds a route, page, component, or Server Action.

## Data model

Two Postgres enums plus one table, following the exact conventions already in `packages/db/src/schema.ts` and `supabase/migrations/`.

```
board_card_type   : 'bug' | 'idea' | 'planning'
board_card_status : 'inbox' | 'discussing' | 'handoff' | 'done'   -- the four columns, in order
```

`board_cards`:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `author_id` | `uuid` → `users(id)` | `ON DELETE SET NULL`, **nullable** — see note below |
| `type` | `board_card_type` | `NOT NULL DEFAULT 'idea'` |
| `title` | `text` | `NOT NULL` |
| `body` | `text` | nullable — repro steps / desired behaviour / detail |
| `status` | `board_card_status` | `NOT NULL DEFAULT 'inbox'` |
| `position` | `numeric` | `NOT NULL DEFAULT 0` — ordering within a column; Phase 2's drag logic inserts fractional midpoints |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` — same as every other table; there's no `$onUpdate`/trigger in this repo, so Phase 2's update action sets it explicitly |

**`author_id` is `SET NULL`, not `CASCADE`** — a deliberate deviation from `posts`/`comments` (which cascade). A task card is a record of work that should outlive its author; if an admin account is ever removed we don't want their logged bugs to vanish. This is consistent with CLAUDE.md's `[deleted]` orphaned-author convention. If you'd rather keep strict parity with `posts`, flag it in your completion report rather than silently switching to `CASCADE`.

`author_id` as a real FK (vs. a hardcoded id) is the one concession to "team-facing eventually" — everything else stays lean and extends without a destructive migration (labels, severity, assignee, card→handoff links are all deferred).

## Affected files

- `packages/db/src/schema.ts` — add the two enums + `boardCards` table (and add `numeric` to the `drizzle-orm/pg-core` import)
- `supabase/migrations/20260710000000_add_board_cards.sql` — new

## Implementation steps

### 1. `packages/db/src/schema.ts`

Add `numeric` to the existing import, then append:

```ts
export const boardCardTypeEnum = pgEnum('board_card_type', ['bug', 'idea', 'planning']);
export const boardCardStatusEnum = pgEnum('board_card_status', ['inbox', 'discussing', 'handoff', 'done']);

export const boardCards = pgTable('board_cards', {
  id:        uuid('id').primaryKey().defaultRandom(),
  authorId:  uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  type:      boardCardTypeEnum('type').notNull().default('idea'),
  title:     text('title').notNull(),
  body:      text('body'),
  status:    boardCardStatusEnum('status').notNull().default('inbox'),
  position:  numeric('position').notNull().default('0'), // drizzle numeric default is a string
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusPositionIdx: index('idx_board_cards_status_position').on(table.status, table.position),
  authorIdx:         index('idx_board_cards_author_id').on(table.authorId),
}));
```

Commit: `feat(db): add board_cards schema for admin task board`

### 2. `supabase/migrations/20260710000000_add_board_cards.sql`

```sql
-- Migration: board_cards (admin task board)
-- Handoff 066

CREATE TYPE board_card_type   AS ENUM ('bug', 'idea', 'planning');
CREATE TYPE board_card_status AS ENUM ('inbox', 'discussing', 'handoff', 'done');

CREATE TABLE IF NOT EXISTS board_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  type        board_card_type   NOT NULL DEFAULT 'idea',
  title       TEXT NOT NULL,
  body        TEXT,
  status      board_card_status NOT NULL DEFAULT 'inbox',
  position    NUMERIC NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Board queries are always "cards in one column, in order" — indexed from day one
-- (the handoff 047 lesson, same as 052's migration).
CREATE INDEX IF NOT EXISTS idx_board_cards_status_position ON board_cards (status, position);
CREATE INDEX IF NOT EXISTS idx_board_cards_author_id       ON board_cards (author_id);

ALTER TABLE board_cards ENABLE ROW LEVEL SECURITY;
-- Deliberately ZERO policies — same write-only-via-Drizzle/service-role pattern as
-- admin_users and job_applications (handoff 052). Reads AND writes go through the
-- server Drizzle client from admin-gated Server Components/Actions, which bypasses RLS.
--
-- Unlike admin_users, middleware.ts does NOT read this table — it only checks admin
-- status via admin_users — so there is genuinely no anon-key read path needing a
-- SELECT policy. Confirm BOTH facts before merging: this is exactly the trap from
-- handoff 058, where 052 wrongly claimed admin_users had "no anon read path" and
-- RLS silently failed the admin gate closed. If Phase 2 ends up reading board_cards
-- via the anon-key client for any reason, this table needs an admin-scoped SELECT
-- policy (mirror admin_users_select_own) — but the intended design is service-role reads.
```

Apply the migration to **both** Supabase projects (schemas must stay in sync per CLAUDE.md):

- Staging — `grassroots-mimic` (`ralyzsuobkrgfgpkcchs`)
- Production — `grassroots-pulse` (`djkoetgmftfwulszepek`)

If the generated TS types are committed anywhere, regenerate them after applying.

Commit: `feat(db): add board_cards migration with RLS`

### 3. Seed (optional, staging only)

The board doesn't need production seed data — Alex's first real cards should start on a clean board, not mixed with samples. For testing the Phase 2 UI, optionally insert ~3 example rows into **staging only** (one per `type`, spread across a couple of statuses), in sentence-case per the platform writing style, e.g. a `bug` in `inbox`, an `idea` in `discussing`, a `planning` card in `handoff`. Use whatever seed mechanism the repo already prefers; do not run this against production.

> Note: admin surfaces read via the Drizzle `db` client directly (see `/admin/users`, `/admin/careers`), not the `SeedDataClient` in `lib/data/`, so no `DataClient`/`SeedDataClient` method is added in this phase.

## Verification

- [ ] Migration applies cleanly to **both** projects; `board_cards` + both enums + both indexes exist in each; schemas match.
- [ ] `packages/db/src/schema.ts` matches the SQL exactly (enum values, nullability, `SET NULL`, defaults).
- [ ] RLS is enabled with zero policies, and you've **confirmed** `middleware.ts` does not read `board_cards` (so no anon-key SELECT path exists) — state this explicitly in the completion report.
- [ ] A service-role/Drizzle `insert` + `select` round-trips a card; an anon-key `select` returns nothing (RLS blocking as intended).
- [ ] Generated types regenerated if applicable.
- [ ] `pnpm type-check` passes.
- [ ] No route added this phase — so no `middleware.ts` / `pnpm check:routes` impact yet.

## Workflow

Branch off `development` (`feat/admin-board-schema`). Push and stop — do not merge or open a PR; Alex reviews the preview. Conventional Commits with a title **and** body.

---

### Next: Phase 2 (separate claude-design handoff)

Board UI in the admin panel — four status columns, create/edit card, drag between columns (Server Actions per ARCHITECTURE.md), reusing existing design-system pieces (`.feed-card`, `.btn`, tabs, sage-only, 0.5px borders, Tabler outline icons). Built first as a working prototype in `design-handoffs/admin-board/prototypes/`. Phase 2 flags for `claude-code` at implementation time: the new admin board `page.tsx` must be added to `GATED_PATHS` (covered by the `/admin` prefix — confirm, don't assume) and any DB-reading Server Component needs `export const dynamic = 'force-dynamic'`. A token request goes to claude-design only if the column/drag states need a value with no existing token.
