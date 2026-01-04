// Post type definitions and utilities

export type Platform = 'twitter' | 'linkedin' | 'reddit'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'

export interface TwitterContent {
  text: string
  mediaUrls?: string[]
}

export interface LinkedInContent {
  text: string
  visibility: 'public' | 'connections'
  mediaUrl?: string  // Single image or video URL
}

export interface RedditContent {
  subreddits: string[]  // Array of target subreddits
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
  notes?: string  // User/MCP notes for this post
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
export const PLATFORM_INFO: Record<Platform, { name: string; label: string; color: string; bgColor: string }> = {
  twitter: {
    name: 'Twitter / X',
    label: 'Twitter',
    color: 'text-twitter',
    bgColor: 'bg-twitter-soft',
  },
  linkedin: {
    name: 'LinkedIn',
    label: 'LinkedIn',
    color: 'text-linkedin',
    bgColor: 'bg-linkedin-soft',
  },
  reddit: {
    name: 'Reddit',
    label: 'Reddit',
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

// Migrate legacy post data (subreddit string → subreddits array)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migratePost(post: any): Post {
  if (post.content?.reddit?.subreddit && !post.content?.reddit?.subreddits) {
    return {
      ...post,
      content: {
        ...post.content,
        reddit: {
          ...post.content.reddit,
          subreddits: [post.content.reddit.subreddit],
          subreddit: undefined,
        },
      },
    }
  }
  return post as Post
}
