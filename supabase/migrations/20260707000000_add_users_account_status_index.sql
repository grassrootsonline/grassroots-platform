-- Migration: add missing index on users.account_status
-- Handoff 047 — ARCHITECTURE.md §6.3 requires an index on every column used
-- in a WHERE clause. account_status has been queried directly (e.g.
-- getWaitlistCount()) since handoff 012 but was never indexed.
-- Idempotent: safe to rerun regardless of current live state, which cannot
-- be confirmed from the migration history alone (see handoff 032 for the
-- same caveat on users/user_profiles' baseline schema).

CREATE INDEX IF NOT EXISTS idx_users_account_status
  ON users (account_status);
