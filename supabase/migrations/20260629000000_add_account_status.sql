-- Migration: add account_status enum and column to users
-- Handoff 012

CREATE TYPE account_status AS ENUM ('waitlisted', 'active', 'suspended');

ALTER TABLE users
  ADD COLUMN account_status account_status NOT NULL DEFAULT 'waitlisted';

-- Users can read their own account_status
CREATE POLICY "Users can read own account_status"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);
