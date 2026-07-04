import { count, eq } from 'drizzle-orm'
import { db } from '@grassroots/db'
import { users } from '@grassroots/db/schema'
import { createServerClient } from '@/lib/supabase/server'
import type {
  DataClient, CurrentUser, UserProfile, FeedPost,
  TrendingProject, SuggestedUser, ProfileProject, Reply,
  SidebarProject, AppNotification,
} from './types'

export class SupabaseDataClient implements DataClient {
  async getCurrentUser(): Promise<CurrentUser | null> {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const row = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.authId, user.id),
    })
    if (!row) return null

    return {
      id: row.id,
      name: row.displayName,
      username: row.username,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      followerCount: row.followerCount,
      followingCount: row.followingCount,
      projectCount: 0, // no projects table yet
      accountStatus: row.accountStatus,
    }
  }

  async getUserProfile(username: string): Promise<UserProfile | null> {
    const row = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, username),
    })
    if (!row) return null

    return {
      id: row.id,
      name: row.displayName,
      username: row.username,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      followerCount: row.followerCount,
      followingCount: row.followingCount,
      projectCount: 0,
    }
  }

  // No posts/projects/communities schema yet — real, empty results.
  async getFeedPosts(): Promise<FeedPost[]> { return [] }
  async getPost(_postId: string): Promise<FeedPost | null> { return null }
  async getTrendingProjects(): Promise<TrendingProject[]> { return [] }
  async getWhoToFollow(): Promise<SuggestedUser[]> { return [] }
  async getProfileProjects(_username: string): Promise<ProfileProject[]> { return [] }
  async getThreadReplies(_postId: string): Promise<Reply[]> { return [] }
  async getUserProjects(): Promise<SidebarProject[]> { return [] }
  async getNotifications(): Promise<AppNotification[]> { return [] }

  async getWaitlistCount(): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.accountStatus, 'waitlisted'))
    return row?.count ?? 0
  }
}
