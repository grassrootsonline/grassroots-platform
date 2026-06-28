'use client'

// ============================================================
// feed-card.tsx — Amendment 04 (motion adherence)
// apps/web/src/components/feed/feed-card.tsx
// ------------------------------------------------------------
// Only change vs. the shipped file: the like button no longer
// uses a Framer Motion spring scale (whileTap scale:1.25). The
// design system motion rule is "no spring, no scale transforms;
// press = opacity/color." The liked state is already conveyed by
// .action-btn.active turning sage (with the 120ms color
// transition baked into components.css), so the button is now a
// plain <button> and the unused `motion` import is dropped.
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import s from './feed-card.module.css'

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
          <div className={s.authorLine}>
            <Link
              href={`/profile/${post.author.username}`}
              className="feed-card-name"
              style={{ transition: 'var(--transition-colors)' }}
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
              className={s.projectLink}
            >
              {post.project?.name ?? post.community?.name}
            </Link>
          )}
        </div>
      </div>

      <p className="feed-card-body">{post.content}</p>

      <div className="feed-card-actions">
        <button
          onClick={handleLike}
          className={['action-btn', liked ? 'active' : ''].filter(Boolean).join(' ')}
          aria-label={liked ? 'Unlike' : 'Like'}
          aria-pressed={liked}
        >
          <i className="ti ti-heart icon-base" aria-hidden="true" />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => onOpenThread?.(post.id)}
          className="action-btn"
          aria-label="View replies"
        >
          <i className="ti ti-message-circle icon-base" aria-hidden="true" />
          <span>{post.commentCount}</span>
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/feed/${post.id}`)
          }}
          className="action-btn"
          aria-label="Share"
        >
          <i className="ti ti-share icon-base" aria-hidden="true" />
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
        <div className={`skeleton ${s.skeletonAvatar}`} />
        <div className={`feed-card-meta ${s.skeletonMeta}`}>
          <div className={`skeleton ${s.skeletonLine} ${s.skeletonLineName}`} />
          <div className={`skeleton ${s.skeletonLineTime}`} />
        </div>
      </div>
      <div className={`feed-card-body ${s.skeletonBody}`}>
        <div className={`skeleton ${s.skeletonLine} ${s.skeletonLineFull}`} />
        <div className={`skeleton ${s.skeletonLine} ${s.skeletonLineWide}`} />
        <div className={`skeleton ${s.skeletonLine} ${s.skeletonLineMed}`} />
      </div>
      <div className="feed-card-actions">
        <div className={`skeleton ${s.skeletonAction}`} />
        <div className={`skeleton ${s.skeletonAction}`} />
        <div className={`skeleton ${s.skeletonAction}`} />
      </div>
    </div>
  )
}
