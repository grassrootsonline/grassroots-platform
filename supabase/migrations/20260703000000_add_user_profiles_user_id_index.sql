-- Migration: add missing FK index on user_profiles.user_id
-- Handoff 032 — ARCHITECTURE.md §6.3 requires an index on every FK column.
-- Idempotent: safe to rerun regardless of current live state, which cannot
-- be confirmed from the migration history alone (see handoff 032 background).

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON user_profiles (user_id);
