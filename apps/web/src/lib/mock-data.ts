import type { FeedPost } from '@/components/feed/feed-card'

export const MOCK_USER = {
  id: 'u1',
  name: 'Alex Kim',
  username: 'alexkim',
  bio: 'Building tools for AI builders. Previously @anthropic. She/her.',
  pronouns: 'she/her',
  avatarUrl: null,
  followerCount: 2300,
  followingCount: 128,
  projectCount: 4,
}

export const MOCK_POSTS: FeedPost[] = [
  {
    id: 'p1',
    author: { name: 'Sarah Chen', username: 'sarahchen', avatarUrl: null },
    project: { name: 'Inference Stack', slug: 'inference-stack' },
    content:
      'Just shipped batched inference for the open-source version. 3x throughput improvement on A100s. The key was fusing the attention masks before the kernel call — turned out 60% of our latency was masking overhead.',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    reactionCount: 47,
    commentCount: 8,
    likedByMe: false,
  },
  {
    id: 'p2',
    author: { name: 'Marcus Rivera', username: 'mrivera', avatarUrl: null },
    community: { name: 'AI Tooling', slug: 'ai-tooling' },
    content:
      'Hot take: most "AI agent frameworks" are just adding complexity around what should be a direct LLM call. The simplest architecture that works is the best architecture. Fight me.',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    reactionCount: 112,
    commentCount: 34,
    likedByMe: true,
  },
  {
    id: 'p3',
    author: { name: 'Priya Nair', username: 'priyanair', avatarUrl: null },
    project: { name: 'PromptKit', slug: 'promptkit' },
    content:
      'PromptKit v0.4 is out. New features: structured output validation, automatic retry with exponential backoff, and a prompt playground that saves your history locally. Zero telemetry, MIT license.',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    reactionCount: 89,
    commentCount: 12,
    likedByMe: false,
  },
  {
    id: 'p4',
    author: { name: 'Leo Tanaka', username: 'leotanaka', avatarUrl: null },
    content:
      'Spent the afternoon reading the new Gemini 2.0 technical report. The section on long-context retrieval is worth it alone — they\'re using a sparse attention pattern that degrades gracefully instead of falling off a cliff at context boundaries.',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    reactionCount: 61,
    commentCount: 7,
    likedByMe: false,
  },
  {
    id: 'p5',
    author: { name: 'Aisha Mohammed', username: 'aisham', avatarUrl: null },
    project: { name: 'DataForge', slug: 'dataforge' },
    content:
      'Six months in on DataForge and we just crossed 1,000 users. For a solo project with no marketing, that feels meaningful. Building in public works — every update post brought people I\'d never have reached otherwise.',
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    reactionCount: 203,
    commentCount: 29,
    likedByMe: false,
  },
]

export const MOCK_TRENDING = [
  { name: 'Inference Stack', slug: 'inference-stack', watchers: 842 },
  { name: 'PromptKit', slug: 'promptkit', watchers: 631 },
  { name: 'DataForge', slug: 'dataforge', watchers: 418 },
]

export const MOCK_WHO_TO_FOLLOW = [
  {
    name: 'Oren Etzioni',
    username: 'orenetz',
    tagline: 'AI researcher & builder',
    avatarUrl: null,
  },
  {
    name: 'Liang Chen',
    username: 'liangchen',
    tagline: 'Open-source LLM tools',
    avatarUrl: null,
  },
  {
    name: 'Nadia Solvay',
    username: 'nadiasolvay',
    tagline: 'Multimodal & robotics',
    avatarUrl: null,
  },
]

export const MOCK_PLATFORM_STATS = {
  usersOnline: 1284,
  activeCommunities: 312,
  ongoingThreads: 4927,
}

export const MOCK_REPLIES = [
  {
    id: 'r1',
    author: { name: 'Marcus Rivera', username: 'mrivera', avatarUrl: null },
    content: 'This is exactly what I was waiting for. The batching approach you described sounds similar to what vLLM does — did you look at their paged attention impl?',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    reactionCount: 12,
  },
  {
    id: 'r2',
    author: { name: 'Priya Nair', username: 'priyanair', avatarUrl: null },
    content: 'The mask fusion trick is clever. We tried something similar but gave up because of numerical precision issues on bf16. Did you hit that?',
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    reactionCount: 5,
  },
  {
    id: 'r3',
    author: { name: 'Leo Tanaka', username: 'leotanaka', avatarUrl: null },
    content: 'Open sourcing the benchmarks would help a lot. Love to see this on the standard evals.',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    reactionCount: 3,
  },
]
