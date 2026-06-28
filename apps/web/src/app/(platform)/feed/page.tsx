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
      <div className="flex gap-6">
        {/* Left rail */}
        <LeftRail user={MOCK_USER} />

        {/* Center feed */}
        <main className="flex-1 max-w-[560px] min-w-0">
          {/* Composer trigger */}
          <div className="flex items-center gap-3 mb-5">
            <Avatar src={MOCK_USER.avatarUrl} name={MOCK_USER.name} size="md" />
            <button
              onClick={() => setComposerOpen(true)}
              className="flex-1 h-10 px-4 text-body text-muted bg-canvas border-[0.5px] border-border-strong rounded-pill text-left hover:border-accent transition-colors duration-fast"
            >
              Share what you&apos;re building…
            </button>
            <button
              onClick={() => setComposerOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-ink text-canvas rounded-pill hover:opacity-88 transition-colors duration-fast"
              aria-label="Create post"
            >
              <i className="ti ti-plus text-[18px]" aria-hidden="true" />
            </button>
          </div>

          {/* Feed */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-5"
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

        {/* Right rail — hidden below 1024px per responsive.css --bp-lg breakpoint */}
        <aside className="w-[212px] flex-shrink-0 sticky top-[80px] self-start hidden lg:flex flex-col gap-4">
          {/* Trending projects */}
          <Card>
            <h3 className="text-small font-medium text-ink mb-md">
              Trending projects
            </h3>
            <div className="flex flex-col gap-3">
              {MOCK_TRENDING.map((p) => (
                <div key={p.slug} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/project/${p.slug}`}
                      className="navbar-link text-small font-medium truncate block"
                    >
                      {p.name}
                    </Link>
                    <p className="text-label text-secondary">
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
            <h3 className="text-small font-medium text-ink mb-md">
              Who to follow
            </h3>
            <div className="flex flex-col gap-3">
              {MOCK_WHO_TO_FOLLOW.map((u) => (
                <div key={u.username} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${u.username}`}
                        className="navbar-link text-small font-medium truncate block"
                      >
                        {u.name}
                      </Link>
                      <p className="text-label text-secondary truncate">
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
