// Post type definitions and utilities

export type Platform = 'twitter' | 'linkedin' | 'reddit'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export interface TwitterContent {
  text: string
  mediaUrls?: string[]
}

export interface LinkedInContent {
  text: string
  visibility: 'public' | 'connections'
}

export interface RedditContent {
  subreddit: string
  title: string
  body?: string
  url?: string
  flairId?: string
  flairText?: string
}

export interface PublishResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
  publishedAt?: string
}

export interface Post {
  id: string
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  status: PostStatus
  platforms: Platform[]
  content: {
    twitter?: TwitterContent
    linkedin?: LinkedInContent
    reddit?: RedditContent
  }
  publishResults?: {
    [K in Platform]?: PublishResult
  }
}

// Character limits per platform
export const CHAR_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  reddit: 40000, // For self-post body
}

// Platform display info
export const PLATFORM_INFO: Record<Platform, { name: string; color: string; bgColor: string }> = {
  twitter: {
    name: 'Twitter / X',
    color: 'text-twitter',
    bgColor: 'bg-twitter-soft',
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'text-linkedin',
    bgColor: 'bg-linkedin-soft',
  },
  reddit: {
    name: 'Reddit',
    color: 'text-reddit',
    bgColor: 'bg-reddit-soft',
  },
}

// Helper to create a new post
export function createPost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    scheduledAt: null,
    status: 'draft',
    platforms: [],
    content: {},
    ...overrides,
  }
}

// Get the main text content for display
export function getPostPreviewText(post: Post): string {
  if (post.content.twitter?.text) {
    return post.content.twitter.text
  }
  if (post.content.linkedin?.text) {
    return post.content.linkedin.text
  }
  if (post.content.reddit?.body) {
    return post.content.reddit.body
  }
  if (post.content.reddit?.title) {
    return post.content.reddit.title
  }
  return ''
}

// Check if a post is due for publishing
export function isDue(post: Post): boolean {
  if (post.status !== 'scheduled' || !post.scheduledAt) {
    return false
  }
  return new Date(post.scheduledAt) <= new Date()
}
