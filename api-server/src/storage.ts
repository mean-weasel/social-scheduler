import { db } from './db.js'
import fs from 'fs'

// Type definitions (shared with web app and MCP server)
export type Platform = 'twitter' | 'linkedin' | 'reddit'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'archived'

// Campaign interface
export interface Campaign {
  id: string
  name: string
  description?: string
  status: CampaignStatus
  createdAt: string
  updatedAt: string
}

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
  subreddit: string     // Single target subreddit
  title: string
  body?: string
  url?: string
  flairId?: string
  flairText?: string
  launchedUrl?: string  // URL of the published Reddit post
}

export type GroupType = 'reddit-crosspost'

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
  campaignId?: string
  groupId?: string       // Groups related posts (e.g., Reddit crossposts)
  groupType?: GroupType  // Type of grouping
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
  campaign_id: string | null
  group_id: string | null
  group_type: string | null
  content: string
  publish_results: string | null
}

// Campaign database row type
interface CampaignRow {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
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
    campaignId: row.campaign_id || undefined,
    groupId: row.group_id || undefined,
    groupType: row.group_type as GroupType | undefined,
    content: JSON.parse(row.content),
    publishResults: row.publish_results ? JSON.parse(row.publish_results) : undefined,
  }
}

// Convert database row to Campaign object
function rowToCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    status: row.status as CampaignStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
  campaignId?: string
  groupId?: string
  groupType?: GroupType
}): Post {
  const id = generateId()
  const timestamp = now()

  const stmt = db.prepare(`
    INSERT INTO posts (id, created_at, updated_at, scheduled_at, status, platforms, notes, campaign_id, group_id, group_type, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    timestamp,
    timestamp,
    data.scheduledAt || null,
    data.status || 'draft',
    JSON.stringify(data.platforms),
    data.notes || null,
    data.campaignId || null,
    data.groupId || null,
    data.groupType || null,
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
    campaignId: data.campaignId,
    groupId: data.groupId,
    groupType: data.groupType,
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
      campaign_id = ?,
      group_id = ?,
      group_type = ?,
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
    updated.campaignId || null,
    updated.groupId || null,
    updated.groupType || null,
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

// Clear all campaigns (for testing)
export function clearAllCampaigns(): number {
  const stmt = db.prepare('DELETE FROM campaigns')
  const result = stmt.run()
  return result.changes
}

// Clear all data (for testing) - clears posts and campaigns
export function clearAll(): { posts: number; campaigns: number } {
  const postsDeleted = clearAllPosts()
  const campaignsDeleted = clearAllCampaigns()
  return { posts: postsDeleted, campaigns: campaignsDeleted }
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

// ==================
// Campaign Operations
// ==================

export function createCampaign(data: {
  name: string
  description?: string
  status?: CampaignStatus
}): Campaign {
  const id = generateId()
  const timestamp = now()

  const stmt = db.prepare(`
    INSERT INTO campaigns (id, name, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, data.name, data.description || null, data.status || 'draft', timestamp, timestamp)

  return {
    id,
    name: data.name,
    description: data.description,
    status: data.status || 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function getCampaign(id: string): Campaign | undefined {
  const stmt = db.prepare('SELECT * FROM campaigns WHERE id = ?')
  const row = stmt.get(id) as CampaignRow | undefined
  return row ? rowToCampaign(row) : undefined
}

export function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
): Campaign | undefined {
  const existing = getCampaign(id)
  if (!existing) return undefined

  const timestamp = now()
  const updated = {
    ...existing,
    ...updates,
    updatedAt: timestamp,
  }

  const stmt = db.prepare(`
    UPDATE campaigns SET
      name = ?,
      description = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
  `)

  stmt.run(updated.name, updated.description || null, updated.status, timestamp, id)

  return updated
}

export function deleteCampaign(id: string): boolean {
  // First, remove campaign reference from all posts
  const removeRefStmt = db.prepare('UPDATE posts SET campaign_id = NULL WHERE campaign_id = ?')
  removeRefStmt.run(id)

  // Then delete the campaign
  const stmt = db.prepare('DELETE FROM campaigns WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function listCampaigns(options?: {
  status?: CampaignStatus | 'all'
  limit?: number
}): Campaign[] {
  let sql = 'SELECT * FROM campaigns WHERE 1=1'
  const params: (string | number)[] = []

  if (options?.status && options.status !== 'all') {
    sql += ' AND status = ?'
    params.push(options.status)
  }

  sql += ' ORDER BY updated_at DESC'

  if (options?.limit && options.limit > 0) {
    sql += ' LIMIT ?'
    params.push(options.limit)
  }

  const stmt = db.prepare(sql)
  const rows = stmt.all(...params) as CampaignRow[]
  return rows.map(rowToCampaign)
}

export function getCampaignPosts(campaignId: string): Post[] {
  const stmt = db.prepare('SELECT * FROM posts WHERE campaign_id = ? ORDER BY updated_at DESC')
  const rows = stmt.all(campaignId) as PostRow[]
  return rows.map(rowToPost)
}

export function addPostToCampaign(postId: string, campaignId: string): Post | undefined {
  return updatePost(postId, { campaignId })
}

export function removePostFromCampaign(postId: string): Post | undefined {
  const existing = getPost(postId)
  if (!existing) return undefined

  const timestamp = now()
  const stmt = db.prepare('UPDATE posts SET campaign_id = NULL, updated_at = ? WHERE id = ?')
  stmt.run(timestamp, postId)

  return { ...existing, campaignId: undefined, updatedAt: timestamp }
}
