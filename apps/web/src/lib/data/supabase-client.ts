import { count, eq } from 'drizzle-orm'
import { db } from '@grassroots/db'
import { users, jobPostings } from '@grassroots/db/schema'
import { createServerClient } from '@/lib/supabase/server'
import type {
  DataClient, CurrentUser, UserProfile, FeedPost,
  TrendingProject, SuggestedUser, ProfileProject, Reply,
  SidebarProject, AppNotification, JobPosting,
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

    const profile = await db.query.userProfiles.findFirst({
      where: (p, { eq }) => eq(p.userId, row.id),
    })

    return {
      id: row.id,
      name: profile?.displayName ?? row.displayName,
      username: row.username,
      avatarUrl: profile?.avatarUrl ?? row.avatarUrl,
      bio: profile?.bio ?? row.bio,
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

    const profile = await db.query.userProfiles.findFirst({
      where: (p, { eq }) => eq(p.userId, row.id),
    })

    return {
      id: row.id,
      name: profile?.displayName ?? row.displayName,
      username: row.username,
      avatarUrl: profile?.avatarUrl ?? row.avatarUrl,
      bio: profile?.bio ?? row.bio,
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

  async getPublishedJobPostings(): Promise<JobPosting[]> {
    const rows = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.status, 'published'))
    return rows.map(toJobPosting)
  }

  async getJobPostingBySlug(slug: string): Promise<JobPosting | null> {
    const row = await db.query.jobPostings.findFirst({
      where: (p, { eq }) => eq(p.slug, slug),
    })
    if (!row || row.status !== 'published') return null
    return toJobPosting(row)
  }
}

function toJobPosting(row: typeof jobPostings.$inferSelect): JobPosting {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    employmentType: row.employmentType,
    description: row.description,
  }
}
