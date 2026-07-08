import { count, eq, and, ne, isNull, desc, asc, inArray } from 'drizzle-orm'
import { db } from '@grassroots/db'
import { users, userProfiles, jobPostings, posts, postReactions, comments, follows, notifications } from '@grassroots/db/schema'
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

  // No projects/communities schema yet — real, empty results.
  async getTrendingProjects(): Promise<TrendingProject[]> { return [] }
  async getProfileProjects(_username: string): Promise<ProfileProject[]> { return [] }
  async getUserProjects(): Promise<SidebarProject[]> { return [] }

  async getFeedPosts(): Promise<FeedPost[]> {
    const rows = await db
      .select({ post: posts, user: users, profile: userProfiles })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))
      .limit(50) // simple v1 cap — no pagination yet, matches feed-view's non-paginated rendering

    const currentUser = await this.getCurrentUser()
    const likedPostIds = currentUser
      ? await getLikedPostIds(currentUser.id, rows.map((r) => r.post.id))
      : new Set<string>()
    return rows.map((r) => toFeedPost(r.post, r.user, r.profile, likedPostIds))
  }

  async getPost(postId: string): Promise<FeedPost | null> {
    const [row] = await db
      .select({ post: posts, user: users, profile: userProfiles })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1)
    if (!row) return null

    const currentUser = await this.getCurrentUser()
    const likedPostIds = currentUser
      ? await getLikedPostIds(currentUser.id, [row.post.id])
      : new Set<string>()
    return toFeedPost(row.post, row.user, row.profile, likedPostIds)
  }

  async getThreadReplies(postId: string): Promise<Reply[]> {
    const rows = await db
      .select({ comment: comments, user: users, profile: userProfiles })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt))
    return rows.map((r) => toReply(r.comment, r.user, r.profile))
  }

  async getWhoToFollow(): Promise<SuggestedUser[]> {
    const currentUser = await this.getCurrentUser()
    // Simplest v1: most recently active users, excluding self and anyone already followed.
    // No "mutual interest" ranking — that needs real usage data this platform doesn't have yet.
    const rows = await db
      .select({ user: users, profile: userProfiles })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(
        currentUser
          ? and(eq(users.accountStatus, 'active'), ne(users.id, currentUser.id))
          : eq(users.accountStatus, 'active')
      )
      .orderBy(desc(users.createdAt))
      .limit(10)

    const alreadyFollowing = currentUser ? await getFollowingIds(currentUser.id) : new Set<string>()
    return rows
      .filter((r) => !alreadyFollowing.has(r.user.id))
      .slice(0, 5)
      .map((r) => toSuggestedUser(r.user, r.profile))
  }

  async getNotifications(): Promise<AppNotification[]> {
    const currentUser = await this.getCurrentUser()
    if (!currentUser) return []

    const rows = await db
      .select({ notification: notifications, actor: users, profile: userProfiles })
      .from(notifications)
      .innerJoin(users, eq(users.id, notifications.actorId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(notifications.recipientId, currentUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20)

    return rows.map((r) => toAppNotification(r.notification, r.actor, r.profile))
  }

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

type UserRow = typeof users.$inferSelect
type ProfileRow = typeof userProfiles.$inferSelect | null
type PostRow = typeof posts.$inferSelect
type CommentRow = typeof comments.$inferSelect
type NotificationRow = typeof notifications.$inferSelect

function toAuthor(user: UserRow, profile: ProfileRow) {
  return {
    name: profile?.displayName ?? user.displayName,
    username: user.username,
    avatarUrl: profile?.avatarUrl ?? user.avatarUrl,
  }
}

function toFeedPost(post: PostRow, user: UserRow, profile: ProfileRow, likedPostIds: Set<string>): FeedPost {
  return {
    id: post.id,
    author: toAuthor(user, profile),
    project: null, // no projects schema yet
    community: null, // no communities schema yet
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    reactionCount: post.reactionCount,
    commentCount: post.commentCount,
    likedByMe: likedPostIds.has(post.id),
  }
}

function toReply(comment: CommentRow, user: UserRow, profile: ProfileRow): Reply {
  return {
    id: comment.id,
    author: toAuthor(user, profile),
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    reactionCount: comment.reactionCount,
  }
}

function toSuggestedUser(user: UserRow, profile: ProfileRow): SuggestedUser {
  return {
    id: user.id,
    name: profile?.displayName ?? user.displayName,
    username: user.username,
    tagline: profile?.headline ?? 'Building on Grassroots',
    avatarUrl: profile?.avatarUrl ?? user.avatarUrl,
  }
}

const NOTIFICATION_TEXT: Record<NotificationRow['type'], string> = {
  reaction: 'liked your post.',
  comment: 'replied to your post.',
  follow: 'started following you.',
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function toAppNotification(notification: NotificationRow, actor: UserRow, profile: ProfileRow): AppNotification {
  return {
    id: notification.id,
    actor: toAuthor(actor, profile),
    text: NOTIFICATION_TEXT[notification.type],
    time: formatRelativeTime(notification.createdAt),
    read: notification.read,
  }
}

async function getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set()
  const rows = await db
    .select({ postId: postReactions.postId })
    .from(postReactions)
    .where(and(eq(postReactions.userId, userId), inArray(postReactions.postId, postIds)))
  return new Set(rows.map((r) => r.postId))
}

async function getFollowingIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId))
  return new Set(rows.map((r) => r.followingId))
}
