import { getDataClient } from '@/lib/data'
import { FeedView } from './feed-view'
import { redirect } from 'next/navigation'

export default async function FeedPage() {
  const client = getDataClient()
  const user = await client.getCurrentUser()
  if (!user) redirect('/login')

  const [initialPosts, trending, whoToFollow, projects] = await Promise.all([
    client.getFeedPosts(),
    client.getTrendingProjects(),
    client.getWhoToFollow(),
    client.getUserProjects(),
  ])

  return (
    <FeedView
      user={user}
      initialPosts={initialPosts}
      trending={trending}
      whoToFollow={whoToFollow}
      projects={projects}
    />
  )
}
