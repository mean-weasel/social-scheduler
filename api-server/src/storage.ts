import { db } from './db.js'
import fs from 'fs'

// Type definitions (shared with web app and MCP server)
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

// Database row type
interface PostRow {
  id: string
  created_at: string
  updated_at: string
  scheduled_at: string | null
  status: string
  platforms: string
  notes: string | null
  content: string
  publish_results: string | null
}

// Convert database row to Post object
function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledAt: row.scheduled_at,
    status: row.status as PostStatus,
    platforms: JSON.parse(row.platforms),
    notes: row.notes || undefined,
    content: JSON.parse(row.content),
    publishResults: row.publish_results ? JSON.parse(row.publish_results) : undefined,
  }
}

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID()
}

// Get current timestamp
export function now(): string {
  return new Date().toISOString()
}

// CRUD Operations

export function createPost(data: {
  platforms: Platform[]
  content: Post['content']
  scheduledAt?: string | null
  status?: PostStatus
  notes?: string
}): Post {
  const id = generateId()
  const timestamp = now()

  const stmt = db.prepare(`
    INSERT INTO posts (id, created_at, updated_at, scheduled_at, status, platforms, notes, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    timestamp,
    timestamp,
    data.scheduledAt || null,
    data.status || 'draft',
    JSON.stringify(data.platforms),
    data.notes || null,
    JSON.stringify(data.content)
  )

  return {
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    scheduledAt: data.scheduledAt || null,
    status: data.status || 'draft',
    platforms: data.platforms,
    notes: data.notes,
    content: data.content,
  }
}

export function getPost(id: string): Post | undefined {
  const stmt = db.prepare('SELECT * FROM posts WHERE id = ?')
  const row = stmt.get(id) as PostRow | undefined
  return row ? rowToPost(row) : undefined
}

export function updatePost(
  id: string,
  updates: Partial<Omit<Post, 'id' | 'createdAt'>>
): Post | undefined {
  const existing = getPost(id)
  if (!existing) return undefined

  const timestamp = now()
  const updated = {
    ...existing,
    ...updates,
    updatedAt: timestamp,
  }

  const stmt = db.prepare(`
    UPDATE posts SET
      updated_at = ?,
      scheduled_at = ?,
      status = ?,
      platforms = ?,
      notes = ?,
      content = ?,
      publish_results = ?
    WHERE id = ?
  `)

  stmt.run(
    timestamp,
    updated.scheduledAt,
    updated.status,
    JSON.stringify(updated.platforms),
    updated.notes || null,
    JSON.stringify(updated.content),
    updated.publishResults ? JSON.stringify(updated.publishResults) : null,
    id
  )

  return updated
}

export function deletePost(id: string): boolean {
  const stmt = db.prepare('DELETE FROM posts WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function archivePost(id: string): Post | undefined {
  return updatePost(id, { status: 'archived' })
}

export function restorePost(id: string): Post | undefined {
  return updatePost(id, { status: 'draft', scheduledAt: null })
}

export function listPosts(options?: {
  status?: PostStatus | 'all'
  platform?: Platform
  limit?: number
}): Post[] {
  let sql = 'SELECT * FROM posts WHERE 1=1'
  const params: (string | number)[] = []

  if (options?.status && options.status !== 'all') {
    sql += ' AND status = ?'
    params.push(options.status)
  }

  if (options?.platform) {
    sql += ' AND platforms LIKE ?'
    params.push(`%"${options.platform}"%`)
  }

  sql += ' ORDER BY updated_at DESC'

  if (options?.limit && options.limit > 0) {
    sql += ' LIMIT ?'
    params.push(options.limit)
  }

  const stmt = db.prepare(sql)
  const rows = stmt.all(...params) as PostRow[]
  return rows.map(rowToPost)
}

// Clear all posts (for testing)
export function clearAllPosts(): number {
  const stmt = db.prepare('DELETE FROM posts')
  const result = stmt.run()
  return result.changes
}

// Migration: Import posts from JSON file
export function importFromJson(jsonPath: string): number {
  if (!fs.existsSync(jsonPath)) {
    return 0
  }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const posts = data.posts || []
    let imported = 0

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO posts (id, created_at, updated_at, scheduled_at, status, platforms, notes, content, publish_results)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const post of posts) {
      const result = insertStmt.run(
        post.id,
        post.createdAt,
        post.updatedAt,
        post.scheduledAt || null,
        post.status,
        JSON.stringify(post.platforms),
        post.notes || null,
        JSON.stringify(post.content),
        post.publishResults ? JSON.stringify(post.publishResults) : null
      )
      if (result.changes > 0) imported++
    }

    return imported
  } catch (error) {
    console.error('Error importing from JSON:', error)
    return 0
  }
}
