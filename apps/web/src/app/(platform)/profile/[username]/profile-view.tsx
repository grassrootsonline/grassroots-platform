'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LeftRail } from '@/components/layout/left-rail'
import { FeedCard } from '@/components/feed/feed-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CurrentUser, UserProfile, FeedPost, ProfileProject, SidebarProject } from '@/lib/data'
import s from './page.module.css'

type ProfileTab = 'posts' | 'projects' | 'about'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

interface ProfileViewProps {
  viewer: CurrentUser
  profile: UserProfile
  isOwnProfile: boolean
  initialPosts: FeedPost[]
  projects: ProfileProject[]
  sidebarProjects: SidebarProject[]
}

export function ProfileView({ viewer, profile, isOwnProfile, initialPosts, projects, sidebarProjects }: ProfileViewProps) {
  const [tab, setTab] = useState<ProfileTab>('posts')

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      <LeftRail user={viewer} projects={sidebarProjects} />

      <main className={s.main}>
        <Link href="/feed" className={s.backLink}>
          <i className="ti ti-arrow-left icon-sm" aria-hidden="true" />
          Back to feed
        </Link>

        {/* Profile header */}
        <div className={s.profileHeader}>
          <div className={s.profileTop}>
            <Avatar src={profile.avatarUrl} name={profile.name} size="xl" />
            {isOwnProfile ? (
              <Button variant="secondary" size="sm" icon="pencil">
                Edit profile
              </Button>
            ) : (
              <div className={s.profileActions}>
                <Button variant="secondary" size="sm">
                  Message
                </Button>
                <Button size="sm">Follow</Button>
              </div>
            )}
          </div>

          <div className={s.profileInfo}>
            <h1 className={s.profileName}>{profile.name}</h1>
            <p className={s.profileHandle}>
              @{profile.username}
            </p>
            <p className={s.profileBio}>{profile.bio}</p>

            {/* Stats */}
            <div className={s.stats}>
              {[
                { value: profile.followingCount, label: 'following' },
                { value: formatCount(profile.followerCount), label: 'followers' },
                { value: profile.projectCount, label: 'projects' },
              ].map(({ value, label }) => (
                <div key={label} className={s.stat}>
                  <span className={s.statValue}>{value}</span>
                  <span className={s.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className={s.tabBar}>
          {(['posts', 'projects', 'about'] as ProfileTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[s.tab, tab === t ? s.tabActive : ''].filter(Boolean).join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'posts' && (
          <div className={s.posts}>
            {initialPosts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {tab === 'projects' && (
          <div className={s.projectsGrid}>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/project/${p.slug}`}
                className={s.projectCard}
              >
                <div className={s.projectCardHead}>
                  <i className={`ti ti-circle-dot ${s.projectCardIcon}`} aria-hidden="true" />
                  <span className={s.projectCardName}>{p.name}</span>
                </div>
                <p className={s.projectCardDesc}>{p.description}</p>
                <div className={s.projectCardFoot}>
                  <span>{p.postCount} posts</span>
                  <span>{p.collaboratorCount} collaborator{p.collaboratorCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <Card>
            <p className="text-body">
              {profile.bio}
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
