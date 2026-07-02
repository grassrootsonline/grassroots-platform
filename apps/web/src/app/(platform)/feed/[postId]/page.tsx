import { getDataClient } from '@/lib/data'
import { ThreadView } from './thread-view'
import { redirect, notFound } from 'next/navigation'

export default async function ThreadPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const client = getDataClient()

  const user = await client.getCurrentUser()
  if (!user) redirect('/login')

  const post = await client.getPost(postId)
  if (!post) notFound()

  const initialReplies = await client.getThreadReplies(postId)

  return <ThreadView user={user} post={post} initialReplies={initialReplies} />
}
