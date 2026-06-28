'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LeftRail } from '@/components/layout/left-rail'
import { FeedCard, FeedCardSkeleton } from '@/components/feed/feed-card'
import { ComposerModal } from '@/components/feed/composer-modal'
import { Avatar } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MOCK_USER, MOCK_POSTS, MOCK_TRENDING, MOCK_WHO_TO_FOLLOW } from '@/lib/mock-data'
import type { FeedPost } from '@/components/feed/feed-card'
import s from './page.module.css'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15 } },
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS)
  const [composerOpen, setComposerOpen] = useState(false)
  const [following, setFollowing] = useState<Record<string, boolean>>({})

  function handlePublish({ content, projectId }: { content: string; projectId?: string }) {
    const newPost: FeedPost = {
      id: `new-${Date.now()}`,
      author: { name: MOCK_USER.name, username: MOCK_USER.username, avatarUrl: MOCK_USER.avatarUrl },
      content,
      createdAt: new Date().toISOString(),
      reactionCount: 0,
      commentCount: 0,
    }
    setPosts((prev) => [newPost, ...prev])
  }

  function toggleFollow(key: string) {
    setFollowing((f) => ({ ...f, [key]: !f[key] }))
  }

  return (
    <>
      <div className={s.layout}>
        {/* Left rail */}
        <LeftRail user={MOCK_USER} />

        {/* Center feed */}
        <main className={s.feed}>
          {/* Composer trigger */}
          <div className={s.composer}>
            <Avatar src={MOCK_USER.avatarUrl} name={MOCK_USER.name} size="md" />
            <button
              onClick={() => setComposerOpen(true)}
              className={s.composerInput}
            >
              Share what you&apos;re building…
            </button>
            <button
              onClick={() => setComposerOpen(true)}
              className={s.composerPlus}
              aria-label="Create post"
            >
              <i className="ti ti-plus icon-md" aria-hidden="true" />
            </button>
          </div>

          {/* Feed */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={s.posts}
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={item}>
                <FeedCard
                  post={post}
                  onOpenThread={(id) => window.location.assign(`/feed/${id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        </main>

        {/* Right rail */}
        <aside className={s.rightRail}>
          {/* Trending projects */}
          <Card>
            <h3 className={s.railHeading}>Trending projects</h3>
            <div className={s.railItems}>
              {MOCK_TRENDING.map((p) => (
                <div key={p.slug} className={s.railRow}>
                  <div className={s.railMeta}>
                    <Link href={`/project/${p.slug}`} className={s.railName}>
                      {p.name}
                    </Link>
                    <p className={s.railSub}>
                      {p.watchers.toLocaleString()} watchers
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFollow(p.slug)}
                    className={[
                      'btn btn-sm flex-shrink-0',
                      following[p.slug] ? 'btn-secondary' : 'btn-primary',
                    ].join(' ')}
                  >
                    {following[p.slug] ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Who to follow */}
          <Card>
            <h3 className={s.railHeading}>Who to follow</h3>
            <div className={s.railItems}>
              {MOCK_WHO_TO_FOLLOW.map((u) => (
                <div key={u.username} className={s.railRowStart}>
                  <div className={s.railFollowInner}>
                    <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                    <div className={s.railFollowMeta}>
                      <Link href={`/profile/${u.username}`} className={s.railName}>
                        {u.name}
                      </Link>
                      <p className={s.railSub}>
                        {u.tagline}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFollow(u.username)}
                    className={[
                      'btn btn-sm flex-shrink-0',
                      following[u.username] ? 'btn-secondary' : 'btn-primary',
                    ].join(' ')}
                  >
                    {following[u.username] ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <ComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublish={handlePublish}
        user={MOCK_USER}
      />
    </>
  )
}
