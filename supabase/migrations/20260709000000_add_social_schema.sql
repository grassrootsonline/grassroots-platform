-- Migration: posts, post_reactions, comments, follows, notifications
-- Handoff 059 — social schema for the live feed. Feed is all-posts,
-- reverse-chronological for v1; no project/community FK columns (no
-- projects/communities tables exist yet — out of scope per handoff 059).

CREATE TABLE IF NOT EXISTS posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  comment_count  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ -- soft delete, same pattern as users.deleted_at
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);

CREATE TABLE IF NOT EXISTS post_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT post_reactions_post_user_unique UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- v1 is a flat reply list (matches ThreadView's rendering — no nested replies), so no parent_comment_id.

CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT follows_follower_following_unique UNIQUE (follower_id, following_id)
);
-- Enforce follower_id != following_id in the Server Action, not a DB CHECK constraint —
-- simpler, and the only write path is the action.

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);

CREATE TYPE notification_type AS ENUM ('reaction', 'comment', 'follow');

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         notification_type NOT NULL,
  post_id      UUID REFERENCES posts(id) ON DELETE CASCADE, -- null for 'follow'
  read         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications (recipient_id);

-- RLS — defense-in-depth / future-anon-read-path measure. The current
-- DataClient reads through Drizzle with the service-role connection, which
-- bypasses RLS entirely, so nothing today depends on these policies to
-- function — but enable RLS anyway per the platform-wide "always on"
-- convention (handoff 054), same lesson as the RLS gaps in 054 and 058.

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_all" ON posts FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = posts.author_id AND users.auth_id = auth.uid())
);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = posts.author_id AND users.auth_id = auth.uid())
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_reactions_select_all" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "post_reactions_insert_own" ON post_reactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = post_reactions.user_id AND users.auth_id = auth.uid())
);
CREATE POLICY "post_reactions_delete_own" ON post_reactions FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = post_reactions.user_id AND users.auth_id = auth.uid())
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = comments.author_id AND users.auth_id = auth.uid())
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = follows.follower_id AND users.auth_id = auth.uid())
);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = follows.follower_id AND users.auth_id = auth.uid())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = notifications.recipient_id AND users.auth_id = auth.uid())
);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = notifications.recipient_id AND users.auth_id = auth.uid())
);
