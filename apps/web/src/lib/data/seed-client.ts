import type {
  DataClient, CurrentUser, UserProfile, FeedPost,
  TrendingProject, SuggestedUser, ProfileProject, Reply,
  SidebarProject, AppNotification,
} from './types'
import {
  MOCK_USER, MOCK_POSTS, MOCK_TRENDING,
  MOCK_WHO_TO_FOLLOW, MOCK_REPLIES, MOCK_WAITLIST_COUNT,
  MOCK_SIDEBAR_PROJECTS, MOCK_NOTIFICATIONS,
} from '@/lib/mock-data'

const MOCK_PROFILE_PROJECTS: ProfileProject[] = [
  { id: '1', name: 'Inference Stack', slug: 'inference-stack', description: 'High-throughput batched inference for open-source LLMs.', postCount: 12, collaboratorCount: 3 },
  { id: '2', name: 'PromptKit', slug: 'promptkit', description: 'Structured output, retries, and a local prompt playground.', postCount: 8, collaboratorCount: 1 },
]

export class SeedDataClient implements DataClient {
  async getCurrentUser(): Promise<CurrentUser | null> {
    const { pronouns: _pronouns, account_status, ...rest } = MOCK_USER
    return { ...rest, accountStatus: account_status }
  }

  async getUserProfile(_username: string): Promise<UserProfile | null> {
    const { pronouns: _pronouns, account_status: _s, ...rest } = MOCK_USER
    return rest
  }

  async getFeedPosts(): Promise<FeedPost[]> { return MOCK_POSTS }

  async getPost(postId: string): Promise<FeedPost | null> {
    return MOCK_POSTS.find((p) => p.id === postId) ?? MOCK_POSTS[0] ?? null
  }

  async getTrendingProjects(): Promise<TrendingProject[]> { return MOCK_TRENDING }
  async getWhoToFollow(): Promise<SuggestedUser[]> { return MOCK_WHO_TO_FOLLOW }
  async getProfileProjects(_username: string): Promise<ProfileProject[]> { return MOCK_PROFILE_PROJECTS }
  async getThreadReplies(_postId: string): Promise<Reply[]> { return MOCK_REPLIES }
  async getWaitlistCount(): Promise<number> { return MOCK_WAITLIST_COUNT }
  async getUserProjects(): Promise<SidebarProject[]> { return MOCK_SIDEBAR_PROJECTS }
  async getNotifications(): Promise<AppNotification[]> { return MOCK_NOTIFICATIONS }
}
