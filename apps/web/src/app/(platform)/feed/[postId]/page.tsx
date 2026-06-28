'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LeftRail } from '@/components/layout/left-rail'
import { FeedCard } from '@/components/feed/feed-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { MOCK_USER, MOCK_POSTS, MOCK_REPLIES } from '@/lib/mock-data'

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const mins = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function ThreadPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = React.use(params)
  const post = MOCK_POSTS.find((p) => p.id === postId) ?? MOCK_POSTS[0]
  const [replies, setReplies] = useState(MOCK_REPLIES)
  const [replyText, setReplyText] = useState('')
  const [replyLikes, setReplyLikes] = useState<Record<string, number>>({})

  function handleReply() {
    if (!replyText.trim()) return
    setReplies((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        author: { name: MOCK_USER.name, username: MOCK_USER.username, avatarUrl: MOCK_USER.avatarUrl },
        content: replyText.trim(),
        createdAt: new Date().toISOString(),
        reactionCount: 0,
      },
    ])
    setReplyText('')
    toast('Reply posted.')
  }

  return (
    <div className="flex gap-6">
      <LeftRail user={MOCK_USER} />

      <main className="flex-1 max-w-[560px] min-w-0 pb-10">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-small text-secondary hover:text-accent transition-colors duration-fast mb-5"
        >
          <i className="ti ti-arrow-left text-[14px]" aria-hidden="true" />
          Back to feed
        </Link>

        <FeedCard post={post} />

        {/* Replies section */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-small font-medium uppercase tracking-label text-accent">
              Replies
            </h2>
            <div className="flex-1 h-[0.5px] bg-border" />
          </div>

          <div className="flex flex-col">
            {replies.map((reply, i) => (
              <div
                key={reply.id}
                className={[
                  'flex items-start gap-3 py-4',
                  i < replies.length - 1 ? 'border-b border-[0.5px] border-border' : '',
                ].join(' ')}
              >
                <Link href={`/profile/${reply.author.username}`}>
                  <Avatar src={reply.author.avatarUrl} name={reply.author.name} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Link
                      href={`/profile/${reply.author.username}`}
                      className="text-body font-medium text-ink hover:text-accent transition-colors duration-fast"
                    >
                      {reply.author.name}
                    </Link>
                    <span className="text-secondary text-small">·</span>
                    <span className="text-small text-secondary">
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-body text-ink-soft leading-[1.65]">
                    {reply.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2.5">
                    <button
                      onClick={() =>
                        setReplyLikes((l) => ({ ...l, [reply.id]: (l[reply.id] ?? 0) + 1 }))
                      }
                      className="flex items-center gap-1.5 text-small text-secondary hover:text-accent transition-colors duration-fast"
                    >
                      <i className="ti ti-heart text-[14px]" aria-hidden="true" />
                      <span>{reply.reactionCount + (replyLikes[reply.id] ?? 0)}</span>
                    </button>
                    <button className="text-small text-secondary hover:text-accent transition-colors duration-fast">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply composer */}
          <div className="flex items-center gap-3 mt-5">
            <Avatar src={MOCK_USER.avatarUrl} name={MOCK_USER.name} size="md" />
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              placeholder="Write a reply…"
              className="flex-1 h-9 px-4 text-body bg-canvas border-[0.5px] border-border-strong rounded-pill outline-none focus:border-accent focus:shadow-[var(--focus-ring)] transition-colors duration-fast placeholder:text-muted"
            />
            <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>
              Reply
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
