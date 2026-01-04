// API-based storage for MCP server
// Connects to the shared API server for unified data access

const API_BASE = process.env.API_URL || 'http://localhost:3001/api'

// Type definitions (shared with web app and API server)
export type Platform = 'twitter' | 'linkedin' | 'reddit'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'

export interface TwitterContent {
  text: string
  mediaUrls?: string[]
}

export interface LinkedInContent {
  text: string
  visibility: 'public' | 'connections'
  mediaUrl?: string
}

export interface RedditContent {
  subreddits: string[]
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
  notes?: string
  content: {
    twitter?: TwitterContent
    linkedin?: LinkedInContent
    reddit?: RedditContent
  }
  publishResults?: {
    [K in Platform]?: PublishResult
  }
}

// CRUD Operations - all async via API

export async function createPost(data: {
  platforms: Platform[]
  content: Post['content']
  scheduledAt?: string | null
  status?: PostStatus
  notes?: string
}): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error(`Failed to create post: ${res.statusText}`)
  }

  const { post } = await res.json()
  return post
}

export async function getPost(id: string): Promise<Post | undefined> {
  const res = await fetch(`${API_BASE}/posts/${id}`)

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to get post: ${res.statusText}`)
  }

  const { post } = await res.json()
  return post
}

export async function updatePost(
  id: string,
  updates: Partial<Omit<Post, 'id' | 'createdAt'>>
): Promise<Post | undefined> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to update post: ${res.statusText}`)
  }

  const { post } = await res.json()
  return post
}

export async function deletePost(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'DELETE',
  })

  if (res.status === 404) {
    return false
  }

  if (!res.ok) {
    throw new Error(`Failed to delete post: ${res.statusText}`)
  }

  return true
}

export async function archivePost(id: string): Promise<Post | undefined> {
  const res = await fetch(`${API_BASE}/posts/${id}/archive`, {
    method: 'POST',
  })

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to archive post: ${res.statusText}`)
  }

  const { post } = await res.json()
  return post
}

export async function restorePost(id: string): Promise<Post | undefined> {
  const res = await fetch(`${API_BASE}/posts/${id}/restore`, {
    method: 'POST',
  })

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to restore post: ${res.statusText}`)
  }

  const { post } = await res.json()
  return post
}

export async function listPosts(options?: {
  status?: PostStatus | 'all'
  platform?: Platform
  limit?: number
}): Promise<Post[]> {
  const params = new URLSearchParams()

  if (options?.status && options.status !== 'all') {
    params.set('status', options.status)
  }
  if (options?.platform) {
    params.set('platform', options.platform)
  }
  if (options?.limit) {
    params.set('limit', String(options.limit))
  }

  const url = `${API_BASE}/posts${params.toString() ? '?' + params.toString() : ''}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to list posts: ${res.statusText}`)
  }

  const { posts } = await res.json()
  return posts
}
