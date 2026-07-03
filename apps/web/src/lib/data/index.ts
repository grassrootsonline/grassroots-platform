import { SeedDataClient } from './seed-client'
import { SupabaseDataClient } from './supabase-client'
import type { DataClient } from './types'

export function getDataClient(): DataClient {
  return process.env.USE_SEED_DATA === 'true'
    ? new SeedDataClient()
    : new SupabaseDataClient()
}

export type {
  DataClient, CurrentUser, UserProfile, FeedPost,
  TrendingProject, SuggestedUser, ProfileProject, Reply,
} from './types'
