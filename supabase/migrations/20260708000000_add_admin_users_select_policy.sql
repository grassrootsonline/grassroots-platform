-- Migration: add missing self-read policy on admin_users
-- Handoff 058 — corrects an error in handoff 052's original migration, which
-- claimed admin_users had "no anon read path." It does: middleware.ts's admin
-- gate reads it via the anon-key Supabase JS client, the same way the
-- account_status check reads `users`. Without this policy, RLS silently
-- blocks that read for everyone, so the admin gate always fails closed.

DROP POLICY IF EXISTS "admin_users_select_own" ON admin_users;
CREATE POLICY "admin_users_select_own"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = admin_users.user_id
        AND users.auth_id = auth.uid()
    )
  );
-- Still no insert/update/delete policy, and no policy letting a user read
-- *another* user's admin_users row — this only lets someone confirm their
-- own admin status, which is exactly what the middleware gate needs.
