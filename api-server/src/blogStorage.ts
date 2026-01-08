import { db } from './db.js'
import { generateId, now } from './storage.js'

// Type definitions
export type BlogDraftStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export interface BlogDraft {
  id: string
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  status: BlogDraftStatus
  title: string
  date: string | null
  content: string
  notes?: string
  wordCount: number
  campaignId?: string
  images: string[]
}

// Database row type
interface BlogDraftRow {
  id: string
  created_at: string
  updated_at: string
  scheduled_at: string | null
  status: string
  title: string
  date: string | null
  content: string
  notes: string | null
  word_count: number
  campaign_id: string | null
  images: string | null
}

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<BlogDraftStatus, BlogDraftStatus[]> = {
  draft: ['scheduled', 'published', 'archived'],
  scheduled: ['draft', 'published', 'archived'],
  published: ['archived'],
  archived: ['draft'],
}

export function isValidStatusTransition(from: BlogDraftStatus, to: BlogDraftStatus): boolean {
  if (from === to) return true
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

// Count words in markdown content
function countWords(content: string): number {
  // Remove markdown syntax and count words
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // Keep link text
    .replace(/[#*_~`>]/g, '') // Remove markdown symbols
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  if (!text) return 0
  return text.split(' ').filter((word) => word.length > 0).length
}

// Convert database row to BlogDraft object
function rowToBlogDraft(row: BlogDraftRow): BlogDraft {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledAt: row.scheduled_at,
    status: row.status as BlogDraftStatus,
    title: row.title,
    date: row.date,
    content: row.content,
    notes: row.notes || undefined,
    wordCount: row.word_count,
    campaignId: row.campaign_id || undefined,
    images: row.images ? JSON.parse(row.images) : [],
  }
}

// ==================
// CRUD Operations
// ==================

export function createBlogDraft(data: {
  title: string
  content?: string
  date?: string | null
  scheduledAt?: string | null
  status?: BlogDraftStatus
  notes?: string
  campaignId?: string
  images?: string[]
}): BlogDraft {
  const id = generateId()
  const timestamp = now()
  const content = data.content || ''
  const wordCount = countWords(content)
  const images = data.images || []

  const stmt = db.prepare(`
    INSERT INTO blog_drafts (id, created_at, updated_at, scheduled_at, status, title, date, content, notes, word_count, campaign_id, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    timestamp,
    timestamp,
    data.scheduledAt || null,
    data.status || 'draft',
    data.title,
    data.date || null,
    content,
    data.notes || null,
    wordCount,
    data.campaignId || null,
    JSON.stringify(images)
  )

  return {
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    scheduledAt: data.scheduledAt || null,
    status: data.status || 'draft',
    title: data.title,
    date: data.date || null,
    content,
    notes: data.notes,
    wordCount,
    campaignId: data.campaignId,
    images,
  }
}

export function getBlogDraft(id: string): BlogDraft | undefined {
  const stmt = db.prepare('SELECT * FROM blog_drafts WHERE id = ?')
  const row = stmt.get(id) as BlogDraftRow | undefined
  return row ? rowToBlogDraft(row) : undefined
}

export function updateBlogDraft(
  id: string,
  updates: Partial<Omit<BlogDraft, 'id' | 'createdAt' | 'wordCount'>>
): BlogDraft | undefined {
  const existing = getBlogDraft(id)
  if (!existing) return undefined

  const timestamp = now()

  // If content is being updated, recalculate word count
  const content = updates.content !== undefined ? updates.content : existing.content
  const wordCount = updates.content !== undefined ? countWords(content) : existing.wordCount

  const updated: BlogDraft = {
    ...existing,
    ...updates,
    content,
    wordCount,
    updatedAt: timestamp,
  }

  const stmt = db.prepare(`
    UPDATE blog_drafts SET
      updated_at = ?,
      scheduled_at = ?,
      status = ?,
      title = ?,
      date = ?,
      content = ?,
      notes = ?,
      word_count = ?,
      campaign_id = ?,
      images = ?
    WHERE id = ?
  `)

  stmt.run(
    timestamp,
    updated.scheduledAt,
    updated.status,
    updated.title,
    updated.date,
    updated.content,
    updated.notes || null,
    updated.wordCount,
    updated.campaignId || null,
    JSON.stringify(updated.images),
    id
  )

  return updated
}

export function deleteBlogDraft(id: string): boolean {
  const stmt = db.prepare('DELETE FROM blog_drafts WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function archiveBlogDraft(id: string): BlogDraft | undefined {
  return updateBlogDraft(id, { status: 'archived' })
}

export function restoreBlogDraft(id: string): BlogDraft | undefined {
  return updateBlogDraft(id, { status: 'draft', scheduledAt: null })
}

export function listBlogDrafts(options?: {
  status?: BlogDraftStatus | 'all'
  campaignId?: string
  limit?: number
}): BlogDraft[] {
  let sql = 'SELECT * FROM blog_drafts WHERE 1=1'
  const params: (string | number)[] = []

  if (options?.status && options.status !== 'all') {
    sql += ' AND status = ?'
    params.push(options.status)
  }

  if (options?.campaignId) {
    sql += ' AND campaign_id = ?'
    params.push(options.campaignId)
  }

  sql += ' ORDER BY updated_at DESC'

  if (options?.limit && options.limit > 0) {
    sql += ' LIMIT ?'
    params.push(options.limit)
  }

  const stmt = db.prepare(sql)
  const rows = stmt.all(...params) as BlogDraftRow[]
  return rows.map(rowToBlogDraft)
}

export function searchBlogDrafts(query: string, options?: { limit?: number }): BlogDraft[] {
  const searchTerm = `%${query}%`

  let sql = `
    SELECT * FROM blog_drafts
    WHERE (title LIKE ? OR content LIKE ? OR notes LIKE ?)
    AND status != 'archived'
    ORDER BY updated_at DESC
  `
  const params: (string | number)[] = [searchTerm, searchTerm, searchTerm]

  if (options?.limit && options.limit > 0) {
    sql += ' LIMIT ?'
    params.push(options.limit)
  }

  const stmt = db.prepare(sql)
  const rows = stmt.all(...params) as BlogDraftRow[]
  return rows.map(rowToBlogDraft)
}

// ==================
// Image Management
// ==================

export function addImageToDraft(draftId: string, filename: string): BlogDraft | undefined {
  const draft = getBlogDraft(draftId)
  if (!draft) return undefined

  // Avoid duplicates
  if (draft.images.includes(filename)) {
    return draft
  }

  const images = [...draft.images, filename]
  return updateBlogDraft(draftId, { images })
}

export function removeImageFromDraft(draftId: string, filename: string): BlogDraft | undefined {
  const draft = getBlogDraft(draftId)
  if (!draft) return undefined

  const images = draft.images.filter((img) => img !== filename)
  return updateBlogDraft(draftId, { images })
}

export function getDraftImages(draftId: string): string[] {
  const draft = getBlogDraft(draftId)
  return draft?.images || []
}

// ==================
// Campaign Integration
// ==================

export function addBlogDraftToCampaign(campaignId: string, draftId: string): BlogDraft | undefined {
  return updateBlogDraft(draftId, { campaignId })
}

export function removeBlogDraftFromCampaign(draftId: string): BlogDraft | undefined {
  const existing = getBlogDraft(draftId)
  if (!existing) return undefined

  const timestamp = now()
  const stmt = db.prepare('UPDATE blog_drafts SET campaign_id = NULL, updated_at = ? WHERE id = ?')
  stmt.run(timestamp, draftId)

  return { ...existing, campaignId: undefined, updatedAt: timestamp }
}

export function listBlogDraftsByCampaign(campaignId: string): BlogDraft[] {
  const stmt = db.prepare('SELECT * FROM blog_drafts WHERE campaign_id = ? ORDER BY updated_at DESC')
  const rows = stmt.all(campaignId) as BlogDraftRow[]
  return rows.map(rowToBlogDraft)
}

// ==================
// Utilities
// ==================

export function clearAllBlogDrafts(): number {
  const stmt = db.prepare('DELETE FROM blog_drafts')
  const result = stmt.run()
  return result.changes
}

// Check if an image is used by any draft (for safe deletion)
export function isImageUsedByAnyDraft(filename: string): boolean {
  const stmt = db.prepare(`SELECT id FROM blog_drafts WHERE images LIKE ?`)
  const searchTerm = `%"${filename}"%`
  const row = stmt.get(searchTerm)
  return !!row
}

// Get all drafts using a specific image
export function getDraftsUsingImage(filename: string): BlogDraft[] {
  const stmt = db.prepare(`SELECT * FROM blog_drafts WHERE images LIKE ?`)
  const searchTerm = `%"${filename}"%`
  const rows = stmt.all(searchTerm) as BlogDraftRow[]
  return rows.map(rowToBlogDraft)
}
