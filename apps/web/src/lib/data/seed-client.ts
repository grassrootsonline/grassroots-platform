import type {
  DataClient, CurrentUser, UserProfile, FeedPost,
  TrendingProject, SuggestedUser, ProfileProject, Reply,
  SidebarProject, AppNotification, JobPosting,
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

const MOCK_JOB_POSTINGS: JobPosting[] = [
  {
    id: '1',
    slug: 'founding-engineer',
    title: 'Founding Engineer',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full-time',
    description: 'Help us build the social platform for AI builders, from the ground up. You will work across the full stack — frontend, backend, and infra — with a small, senior team.',
  },
  {
    id: '2',
    slug: 'community-lead',
    title: 'Community Lead',
    department: 'Community',
    location: 'Remote',
    employmentType: 'Full-time',
    description: 'Own the day-to-day health of the Grassroots community — onboarding new builders, moderation, and running programs that help people ship.',
  },
]

export class SeedDataClient implements DataClient {
  async getCurrentUser(): Promise<CurrentUser | null> {
    const { pronouns: _pronouns, account_status, ...rest } = MOCK_USER
    return { ...rest, accountStatus: account_status }
  }

  async getUserProfile(_username: string): Promise<UserProfile | null> {
    const { pronouns: _pronouns, account_status: _s, ...rest } = MOCK_USER
    return { ...rest, isFollowedByViewer: false } // seed mode only ever shows the viewer's own profile
  }

  async getFeedPosts(): Promise<FeedPost[]> { return MOCK_POSTS }

  async getUserPosts(username: string): Promise<FeedPost[]> {
    return MOCK_POSTS.filter((p) => p.author.username === username)
  }

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

  async getPublishedJobPostings(): Promise<JobPosting[]> { return MOCK_JOB_POSTINGS }

  async getJobPostingBySlug(slug: string): Promise<JobPosting | null> {
    return MOCK_JOB_POSTINGS.find((p) => p.slug === slug) ?? null
  }
}
