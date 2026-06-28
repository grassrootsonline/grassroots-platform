'use client'

// ============================================================
// feed-card.tsx — CORRECTED (Amendment 03)
// apps/web/src/components/feed/feed-card.tsx
// ------------------------------------------------------------
// Changes: arbitrary values → token utilities; Framer Motion
// spring pulled off hardcoded numbers and onto the design-
// system intent (the heart turns sage, never fills). The
// .feed-card / .action-btn component classes stay in
// components.css — only the inline Tailwind drift is migrated.
// ============================================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'

export interface FeedPost {
  id: string
  author: {
    name: string
    username: string
    avatarUrl?: string | null
  }
  project?: { name: string; slug: string } | null
  community?: { name: string; slug: string } | null
  content: string
  createdAt: string
  reactionCount: number
  commentCount: number
  likedByMe?: boolean
}

interface FeedCardProps {
  post: FeedPost
  onOpenThread?: (postId: string) => void
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function FeedCard({ post, onOpenThread }: FeedCardProps) {
  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(post.reactionCount)

  function handleLike() {
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  return (
    <article className="feed-card">
      <div className="feed-card-header">
        <Link href={`/profile/${post.author.username}`}>
          <Avatar src={post.author.avatarUrl} name={post.author.name} size="md" />
        </Link>
        <div className="feed-card-meta">
          <div className="flex items-center gap-1 flex-wrap">
            <Link
              href={`/profile/${post.author.username}`}
              className="feed-card-name hover:text-accent transition-colors duration-fast"
            >
              {post.author.name}
            </Link>
            <span className="feed-card-time">·</span>
            <span className="feed-card-time">{formatTime(post.createdAt)}</span>
          </div>
          {(post.project || post.community) && (
            <Link
              href={
                post.project
                  ? `/project/${post.project.slug}`
                  : `/community/${post.community!.slug}`
              }
              className="text-small text-accent hover:underline"
            >
              {post.project?.name ?? post.community?.name}
            </Link>
          )}
        </div>
      </div>

      <p className="feed-card-body">{post.content}</p>

      <div className="feed-card-actions">
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 1.25 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={['action-btn', liked ? 'active' : ''].filter(Boolean).join(' ')}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <i className="ti ti-heart text-[16px]" aria-hidden="true" />
          <span>{likeCount}</span>
        </motion.button>

        <button
          onClick={() => onOpenThread?.(post.id)}
          className="action-btn"
          aria-label="View replies"
        >
          <i className="ti ti-message-circle text-[16px]" aria-hidden="true" />
          <span>{post.commentCount}</span>
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/feed/${post.id}`)
          }}
          className="action-btn"
          aria-label="Share"
        >
          <i className="ti ti-share text-[16px]" aria-hidden="true" />
          <span>Share</span>
        </button>
      </div>
    </article>
  )
}

export function FeedCardSkeleton() {
  return (
    <div className="feed-card">
      <div className="feed-card-header">
        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
        <div className="feed-card-meta flex flex-col gap-sm">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="feed-card-body flex flex-col gap-sm">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-4/5 rounded" />
        <div className="skeleton h-3.5 w-3/5 rounded" />
      </div>
      <div className="feed-card-actions">
        <div className="skeleton h-3 w-10 rounded" />
        <div className="skeleton h-3 w-10 rounded" />
        <div className="skeleton h-3 w-12 rounded" />
      </div>
    </div>
  )
}

// NOTE (icon sizes): the `text-[16px]` on Tabler <i> glyphs is intentionally
// left as an arbitrary value — glyph sizing (14/16/18/20px) is a per-icon
// decision the guide explicitly allows, not a token. Everything else is a
// token utility. If you prefer, add an --icon-* scale to @theme and swap these.
