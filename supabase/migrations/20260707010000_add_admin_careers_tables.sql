-- Migration: admin_users, job_postings, job_applications
-- Handoff 052

CREATE TYPE job_posting_status AS ENUM ('draft', 'published', 'closed');

CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- Deliberately zero policies — write-only via Drizzle/service role, no anon
-- read path. The first row is inserted manually; see handoff 052 background.

CREATE TABLE IF NOT EXISTS job_postings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  department       TEXT,
  location         TEXT,
  employment_type  TEXT,
  description      TEXT NOT NULL,
  status           job_posting_status NOT NULL DEFAULT 'draft',
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at     TIMESTAMPTZ,
  closed_at        TIMESTAMPTZ
);

-- Indexed from day one — per the lesson from handoff 047 (users.account_status
-- was queried directly for months before anyone noticed it lacked an index).
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings (status);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published postings are publicly readable"
  ON job_postings FOR SELECT
  USING (status = 'published');
-- No insert/update/delete policy — writes only via Drizzle/service role from
-- admin Server Actions.

CREATE TABLE IF NOT EXISTS job_applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id     UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  portfolio_url  TEXT,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_posting_id ON job_applications (posting_id);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
-- Deliberately zero policies — same write-only pattern as career_interest_signups
-- (handoff 044) and admin_users above.
