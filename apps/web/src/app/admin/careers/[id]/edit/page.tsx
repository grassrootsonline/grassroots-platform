import { notFound } from 'next/navigation'
import { db } from '@grassroots/db'
import { PostingForm } from '../../posting-form'

export default async function EditPostingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const posting = await db.query.jobPostings.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  })
  if (!posting) notFound()

  return <PostingForm mode="edit" posting={posting} />
}
