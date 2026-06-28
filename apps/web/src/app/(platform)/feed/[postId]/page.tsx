'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LeftRail } from '@/components/layout/left-rail'
import { FeedCard } from '@/components/feed/feed-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { MOCK_USER, MOCK_POSTS, MOCK_REPLIES } from '@/lib/mock-data'
import s from './page.module.css'

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
    <div style={{ display: 'flex', gap: '24px' }}>
      <LeftRail user={MOCK_USER} />

      <main className={s.main}>
        <Link href="/feed" className={s.backLink}>
          <i className="ti ti-arrow-left icon-sm" aria-hidden="true" />
          Back to feed
        </Link>

        <FeedCard post={post} />

        {/* Replies section */}
        <div className={s.replies}>
          <div className={s.repliesHeader}>
            <h2 className={s.repliesLabel}>Replies</h2>
            <div className={s.repliesDivider} />
          </div>

          <div className={s.replyList}>
            {replies.map((reply) => (
              <div
                key={reply.id}
                className={s.reply}
              >
                <Link href={`/profile/${reply.author.username}`}>
                  <Avatar src={reply.author.avatarUrl} name={reply.author.name} size="md" />
                </Link>
                <div className={s.replyBody}>
                  <div className={s.replyMeta}>
                    <Link
                      href={`/profile/${reply.author.username}`}
                      className={s.replyAuthor}
                    >
                      {reply.author.name}
                    </Link>
                    <span className={s.replySep}>·</span>
                    <span className={s.replyTime}>
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className={s.replyContent}>
                    {reply.content}
                  </p>
                  <div className={s.replyActions}>
                    <button
                      onClick={() =>
                        setReplyLikes((l) => ({ ...l, [reply.id]: (l[reply.id] ?? 0) + 1 }))
                      }
                      className={s.replyActionBtn}
                    >
                      <i className="ti ti-heart icon-sm" aria-hidden="true" />
                      <span>{reply.reactionCount + (replyLikes[reply.id] ?? 0)}</span>
                    </button>
                    <button className={s.replyActionBtn}>
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply composer */}
          <div className={s.composer}>
            <Avatar src={MOCK_USER.avatarUrl} name={MOCK_USER.name} size="md" />
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              placeholder="Write a reply…"
              className={s.composerInput}
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
