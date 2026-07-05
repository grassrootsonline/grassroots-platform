-- Migration: add career_interest_signups table for the /careers "notify me" form
-- Handoff 044

CREATE TABLE IF NOT EXISTS career_interest_signups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE career_interest_signups ENABLE ROW LEVEL SECURITY;
-- Deliberately zero policies: this table is write-only from the app's
-- perspective (via Drizzle, which bypasses RLS — see ARCHITECTURE.md §8.1),
-- and has no legitimate read path through the Supabase JS client/anon key.
-- Reviewing submissions is an admin action via the Supabase dashboard only.
