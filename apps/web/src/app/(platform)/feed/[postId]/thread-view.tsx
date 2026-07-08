'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LeftRail } from '@/components/layout/left-rail'
import { FeedCard } from '@/components/feed/feed-card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { createCommentAction, reactToPostAction } from '@/actions/posts.actions'
import type { CurrentUser, FeedPost, Reply, SidebarProject } from '@/lib/data'
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

interface ThreadViewProps {
  user: CurrentUser
  post: FeedPost
  initialReplies: Reply[]
  sidebarProjects: SidebarProject[]
}

export function ThreadView({ user, post, initialReplies, sidebarProjects }: ThreadViewProps) {
  const [replies, setReplies] = useState(initialReplies)
  const [replyText, setReplyText] = useState('')
  const [replyLikes, setReplyLikes] = useState<Record<string, number>>({})

  async function handleReply() {
    if (!replyText.trim()) return
    const trimmed = replyText.trim()
    setReplyText('')

    const optimisticReply: Reply = {
      id: `r-${Date.now()}`,
      author: { name: user.name, username: user.username, avatarUrl: user.avatarUrl },
      content: trimmed,
      createdAt: new Date().toISOString(),
      reactionCount: 0,
    }
    setReplies((prev) => [...prev, optimisticReply])

    const result = await createCommentAction(post.id, trimmed)
    if ('error' in result) {
      setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id))
      toast('Could not post your reply. Try again.')
      return
    }
    setReplies((prev) => prev.map((r) => (r.id === optimisticReply.id ? { ...r, id: result.id, createdAt: result.createdAt } : r)))
    toast('Reply posted.')
  }

  return (
    <div className={s.layout}>
      <LeftRail user={user} projects={sidebarProjects} />

      <main className={s.main}>
        <Link href="/feed" className={s.backLink}>
          <i className="ti ti-arrow-left icon-sm" aria-hidden="true" />
          Back to feed
        </Link>

        <FeedCard
          post={post}
          onReact={(postId) => reactToPostAction(postId).catch(() => toast('Could not update your reaction.'))}
        />

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
            <Avatar src={user.avatarUrl} name={user.name} size="md" />
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
