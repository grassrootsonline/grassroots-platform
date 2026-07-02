import type { FeedPost } from '@/components/feed/feed-card'

export type { FeedPost }

export interface CurrentUser {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  bio: string | null
  followerCount: number
  followingCount: number
  projectCount: number
  accountStatus: 'waitlisted' | 'active' | 'suspended'
}

export interface UserProfile {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  bio: string | null
  followerCount: number
  followingCount: number
  projectCount: number
}

export interface TrendingProject {
  name: string
  slug: string
  watchers: number
}

export interface SuggestedUser {
  name: string
  username: string
  tagline: string
  avatarUrl: string | null
}

export interface ProfileProject {
  id: string
  name: string
  slug: string
  description: string
  postCount: number
  collaboratorCount: number
}

export interface Reply {
  id: string
  author: { name: string; username: string; avatarUrl: string | null }
  content: string
  createdAt: string
  reactionCount: number
}

export interface DataClient {
  getCurrentUser(): Promise<CurrentUser | null>
  getUserProfile(username: string): Promise<UserProfile | null>
  getFeedPosts(): Promise<FeedPost[]>
  getPost(postId: string): Promise<FeedPost | null>
  getTrendingProjects(): Promise<TrendingProject[]>
  getWhoToFollow(): Promise<SuggestedUser[]>
  getProfileProjects(username: string): Promise<ProfileProject[]>
  getThreadReplies(postId: string): Promise<Reply[]>
}
