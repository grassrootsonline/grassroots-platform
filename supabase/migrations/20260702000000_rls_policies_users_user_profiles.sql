-- Migration: formalize RLS on users/user_profiles, add user_profiles policies
-- Handoff 022 (idempotency fix: handoff 024)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "user_profiles_select_public" ON user_profiles;
CREATE POLICY "user_profiles_select_public"
  ON user_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    )
  );
