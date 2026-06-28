'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LeftRail } from '@/components/layout/left-rail'
import { FeedCard } from '@/components/feed/feed-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MOCK_USER, MOCK_POSTS } from '@/lib/mock-data'
import s from './page.module.css'

type ProfileTab = 'posts' | 'projects' | 'about'

const MOCK_PROJECTS_PROFILE = [
  {
    id: '1',
    name: 'Inference Stack',
    slug: 'inference-stack',
    description: 'High-throughput batched inference for open-source LLMs.',
    postCount: 12,
    collaboratorCount: 3,
  },
  {
    id: '2',
    name: 'PromptKit',
    slug: 'promptkit',
    description: 'Structured output, retries, and a local prompt playground.',
    postCount: 8,
    collaboratorCount: 1,
  },
]

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = React.use(params)
  const [tab, setTab] = useState<ProfileTab>('posts')
  const isOwnProfile = username === MOCK_USER.username
  const profile = MOCK_USER

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      <LeftRail user={MOCK_USER} />

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
              {profile.pronouns && ` · ${profile.pronouns}`}
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
            {MOCK_POSTS.filter((_, i) => i < 3).map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {tab === 'projects' && (
          <div className={s.projectsGrid}>
            {MOCK_PROJECTS_PROFILE.map((p) => (
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
