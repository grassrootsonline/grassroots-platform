-- Migration: formalize RLS on users/user_profiles, add user_profiles policies
-- Handoff 022

-- RLS was enabled on both tables via the Supabase dashboard ahead of this
-- migration landing. These statements are idempotent and just bring that
-- state under version control.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- HANDOFF CONFLICT: handoff 022 assumed a pre-existing policy named
-- "Users can read own account_status" (from handoff 012) that needed
-- renaming to match the {table}_{operation}_{description} convention
-- (ARCHITECTURE.md §8.4). Verified against the live database (2026-07-02):
-- zero policies currently exist on public.users or public.user_profiles,
-- so there is nothing to rename. Creating the policy fresh under the
-- correct name instead.
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- user_profiles holds only public-facing fields (display_name, bio,
-- avatar_url, headline) — safe to expose to any request.
CREATE POLICY "user_profiles_select_public"
  ON user_profiles FOR SELECT
  USING (true);

-- Owner-only write. user_profiles.user_id references users.id, not
-- auth_id, so ownership is resolved through a join to users.
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_profiles.user_id
        AND users.auth_id = auth.uid()
    )
  );
