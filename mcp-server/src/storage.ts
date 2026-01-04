import fs from 'fs'
import path from 'path'
import os from 'os'

// Post type definitions (mirrored from main app)
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

// Storage path - uses home directory for persistence (or TEST_STORAGE_DIR env var for testing)
const STORAGE_DIR = process.env.TEST_STORAGE_DIR || path.join(os.homedir(), '.social-scheduler')
const STORAGE_PATH = path.join(STORAGE_DIR, 'posts.json')

/**
 * Ensure the storage directory exists
 */
function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

/**
 * Read all posts from storage
 */
export function readPosts(): Post[] {
  ensureStorageDir()
  if (!fs.existsSync(STORAGE_PATH)) {
    return []
  }
  try {
    const data = fs.readFileSync(STORAGE_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    return parsed.posts || []
  } catch {
    return []
  }
}

/**
 * Write all posts to storage
 */
export function writePosts(posts: Post[]): void {
  ensureStorageDir()
  fs.writeFileSync(STORAGE_PATH, JSON.stringify({ posts }, null, 2))
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString()
}

// CRUD Operations

/**
 * Create a new post
 */
export function createPost(data: {
  platforms: Platform[]
  content: Post['content']
  scheduledAt?: string | null
  status?: PostStatus
  notes?: string
}): Post {
  const posts = readPosts()
  const timestamp = now()

  const newPost: Post = {
    id: generateId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    scheduledAt: data.scheduledAt || null,
    status: data.status || 'draft',
    platforms: data.platforms,
    notes: data.notes,
    content: data.content,
  }

  posts.push(newPost)
  writePosts(posts)
  return newPost
}

/**
 * Get a post by ID
 */
export function getPost(id: string): Post | undefined {
  const posts = readPosts()
  return posts.find(p => p.id === id)
}

/**
 * Update a post
 */
export function updatePost(id: string, updates: Partial<Omit<Post, 'id' | 'createdAt'>>): Post | undefined {
  const posts = readPosts()
  const index = posts.findIndex(p => p.id === id)

  if (index === -1) return undefined

  posts[index] = {
    ...posts[index],
    ...updates,
    updatedAt: now(),
  }

  writePosts(posts)
  return posts[index]
}

/**
 * Delete a post
 */
export function deletePost(id: string): boolean {
  const posts = readPosts()
  const initialLength = posts.length
  const filtered = posts.filter(p => p.id !== id)

  if (filtered.length === initialLength) return false

  writePosts(filtered)
  return true
}

/**
 * Archive a post
 */
export function archivePost(id: string): Post | undefined {
  return updatePost(id, { status: 'archived' })
}

/**
 * Restore an archived post to draft
 */
export function restorePost(id: string): Post | undefined {
  return updatePost(id, { status: 'draft', scheduledAt: null })
}

/**
 * List posts with optional filters
 */
export function listPosts(options?: {
  status?: PostStatus | 'all'
  platform?: Platform
  limit?: number
}): Post[] {
  let posts = readPosts()

  // Filter by status
  if (options?.status && options.status !== 'all') {
    posts = posts.filter(p => p.status === options.status)
  }

  // Filter by platform
  if (options?.platform) {
    posts = posts.filter(p => p.platforms.includes(options.platform!))
  }

  // Sort by most recent first
  posts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  // Apply limit
  if (options?.limit && options.limit > 0) {
    posts = posts.slice(0, options.limit)
  }

  return posts
}
