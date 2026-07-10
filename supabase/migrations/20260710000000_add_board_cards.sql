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
