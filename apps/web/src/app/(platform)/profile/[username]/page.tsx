'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LeftRail } from '@/components/layout/left-rail'
import { FeedCard } from '@/components/feed/feed-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MOCK_USER, MOCK_POSTS } from '@/lib/mock-data'

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
    <div className="flex gap-6">
      <LeftRail user={MOCK_USER} />

      <main className="flex-1 max-w-[600px] min-w-0 pb-10">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors duration-[120ms] mb-5"
        >
          <i className="ti ti-arrow-left text-[14px]" aria-hidden="true" />
          Back to feed
        </Link>

        {/* Profile header */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <Avatar src={profile.avatarUrl} name={profile.name} size="xl" />
            {isOwnProfile ? (
              <Button variant="secondary" size="sm" icon="pencil">
                Edit profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  Message
                </Button>
                <Button size="sm">Follow</Button>
              </div>
            )}
          </div>

          <div className="mt-3">
            <h1
              className="text-[24px] text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
            >
              {profile.name}
            </h1>
            <p className="text-[13px] text-[var(--color-secondary)] mt-0.5">
              @{profile.username}
              {profile.pronouns && ` · ${profile.pronouns}`}
            </p>
            <p className="mt-2.5 text-[14px] text-[var(--color-ink-soft)] leading-[1.6]">
              {profile.bio}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-[500] text-[var(--color-ink)]">
                  {profile.followingCount}
                </span>
                <span className="text-[12px] text-[var(--color-secondary)]">following</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-[500] text-[var(--color-ink)]">
                  {formatCount(profile.followerCount)}
                </span>
                <span className="text-[12px] text-[var(--color-secondary)]">followers</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-[500] text-[var(--color-ink)]">
                  {profile.projectCount}
                </span>
                <span className="text-[12px] text-[var(--color-secondary)]">projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-6 border-b border-[0.5px] border-[var(--color-border)] mb-5">
          {(['posts', 'projects', 'about'] as ProfileTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'pb-3 text-[14px] capitalize transition-all duration-[120ms] border-b-2 -mb-[0.5px]',
                tab === t
                  ? 'text-[var(--color-ink)] font-[500] border-[var(--color-accent)]'
                  : 'text-[var(--color-secondary)] border-transparent hover:text-[var(--color-ink)]',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'posts' && (
          <div className="flex flex-col gap-5">
            {MOCK_POSTS.filter((_, i) => i < 3).map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {tab === 'projects' && (
          <div className="grid grid-cols-2 gap-4">
            {MOCK_PROJECTS_PROFILE.map((p) => (
              <Link
                key={p.id}
                href={`/project/${p.slug}`}
                className="bg-[var(--color-surface)] border border-[0.5px] border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 hover:border-[var(--color-border-strong)] transition-all duration-[120ms] block"
              >
                <div className="flex items-center gap-2 mb-2">
                  <i className="ti ti-circle-dot text-[var(--color-accent)] text-[16px]" aria-hidden="true" />
                  <span className="text-[15px] font-[500] text-[var(--color-ink)]">{p.name}</span>
                </div>
                <p className="text-[13px] text-[var(--color-secondary)] leading-[1.5] mb-3">
                  {p.description}
                </p>
                <div className="flex items-center gap-3 text-[12px] text-[var(--color-muted)]">
                  <span>{p.postCount} posts</span>
                  <span>{p.collaboratorCount} collaborator{p.collaboratorCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <Card>
            <p className="text-[14px] text-[var(--color-ink-soft)] leading-[var(--leading-body)]">
              {profile.bio}
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
