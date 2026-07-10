import { db } from '@grassroots/db'
import { boardCards, users } from '@grassroots/db/schema'
import { asc, eq } from 'drizzle-orm'
import { createServerClient } from '@/lib/supabase/server'
import { BoardView } from './board-view'

export const dynamic = 'force-dynamic'

export default async function AdminBoardPage() {
  const rows = await db
    .select({
      id: boardCards.id,
      type: boardCards.type,
      title: boardCards.title,
      body: boardCards.body,
      status: boardCards.status,
      position: boardCards.position,
      createdAt: boardCards.createdAt,
      updatedAt: boardCards.updatedAt,
      authorId: boardCards.authorId,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
    })
    .from(boardCards)
    .leftJoin(users, eq(users.id, boardCards.authorId))
    .orderBy(asc(boardCards.status), asc(boardCards.position))

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserRow = user
    ? await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.authId, user.id),
        columns: { id: true, displayName: true, username: true },
      })
    : null
  const currentProfile = currentUserRow
    ? await db.query.userProfiles.findFirst({
        where: (p, { eq }) => eq(p.userId, currentUserRow.id),
        columns: { displayName: true },
      })
    : null

  const currentUser = currentUserRow
    ? {
        id: currentUserRow.id,
        displayName: currentProfile?.displayName ?? currentUserRow.displayName,
        username: currentUserRow.username,
      }
    : null

  return (
    <BoardView
      initialCards={rows.map((r) => ({ ...r, position: parseFloat(r.position) }))}
      currentUser={currentUser}
    />
  )
}
