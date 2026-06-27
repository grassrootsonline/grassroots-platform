export interface User {
  id: string
  username: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  coverUrl?: string | null
  pronouns?: string | null
  followerCount: number
  followingCount: number
  postCount: number
  isVerified?: boolean
  createdAt: string
}

export interface Project {
  id: string
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  ownerId: string
  followerCount: number
  viewCount: number
  isPublished: boolean
  createdAt: string
}

export interface Post {
  id: string
  authorId: string
  projectId?: string | null
  communityId?: string | null
  content: string
  reactionCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  authorId: string
  postId?: string | null
  parentId?: string | null
  content: string
  reactionCount: number
  createdAt: string
}

export interface Notification {
  id: string
  recipientId: string
  actorId?: string | null
  eventType: string
  entityType: string
  entityId: string
  isRead: boolean
  createdAt: string
}
