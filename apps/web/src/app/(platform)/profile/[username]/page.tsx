import { getDataClient } from '@/lib/data'
import { ProfileView } from './profile-view'
import { redirect, notFound } from 'next/navigation'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const client = getDataClient()

  const viewer = await client.getCurrentUser()
  if (!viewer) redirect('/login')

  const profile = await client.getUserProfile(username)
  if (!profile) notFound()

  const [initialPosts, projects, sidebarProjects] = await Promise.all([
    client.getFeedPosts(), // TODO: filter by author once posts schema exists
    client.getProfileProjects(username),
    client.getUserProjects(),
  ])

  return (
    <ProfileView
      viewer={viewer}
      profile={profile}
      isOwnProfile={viewer.username === profile.username}
      initialPosts={initialPosts}
      projects={projects}
      sidebarProjects={sidebarProjects}
    />
  )
}
