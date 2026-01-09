// Supabase-based storage for MCP server
// Connects directly to Supabase for unified data access

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Note: Environment variables should be loaded by index.ts before importing this module

// Type definitions
export type Platform = 'twitter' | 'linkedin' | 'reddit'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'archived'
export type GroupType = 'reddit-crosspost'

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
  launchedUrl?: string
}

export interface LinkedInContent {
  text: string
  visibility: 'public' | 'connections'
  mediaUrl?: string
  launchedUrl?: string
}

export interface RedditContent {
  subreddit: string
  title: string
  body?: string
  url?: string
  flairId?: string
  flairText?: string
  launchedUrl?: string
}

export interface PublishResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
  publishedAt?: string
}

export type PlatformContent = TwitterContent | LinkedInContent | RedditContent

export interface Post {
  id: string
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  status: PostStatus
  platform: Platform
  notes?: string
  campaignId?: string
  groupId?: string
  groupType?: GroupType
  content: PlatformContent
  publishResult?: PublishResult
}

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

// Database row types (snake_case)
interface DbPost {
  id: string
  user_id: string | null
  created_at: string
  updated_at: string
  scheduled_at: string | null
  status: PostStatus
  platform: Platform
  content: PlatformContent
  notes: string | null
  publish_result: PublishResult | null
  campaign_id: string | null
  group_id: string | null
  group_type: GroupType | null
}

interface DbCampaign {
  id: string
  user_id: string | null
  name: string
  description: string | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}

interface DbBlogDraft {
  id: string
  user_id: string | null
  created_at: string
  updated_at: string
  scheduled_at: string | null
  status: BlogDraftStatus
  title: string
  date: string | null
  content: string | null
  notes: string | null
  word_count: number
  campaign_id: string | null
  images: string[]
}

// Convert database row to API format
function toPost(row: DbPost): Post {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledAt: row.scheduled_at,
    status: row.status,
    platform: row.platform,
    content: row.content,
    notes: row.notes || undefined,
    publishResult: row.publish_result || undefined,
    campaignId: row.campaign_id || undefined,
    groupId: row.group_id || undefined,
    groupType: row.group_type || undefined,
  }
}

function toCampaign(row: DbCampaign): Campaign {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toBlogDraft(row: DbBlogDraft): BlogDraft {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledAt: row.scheduled_at,
    status: row.status,
    title: row.title,
    date: row.date,
    content: row.content || '',
    notes: row.notes || undefined,
    wordCount: row.word_count,
    campaignId: row.campaign_id || undefined,
    images: row.images || [],
  }
}

// Supabase client singleton
let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      )
    }

    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

// ==================
// Post Operations
// ==================

export async function createPost(data: {
  platform: Platform
  content: PlatformContent
  scheduledAt?: string | null
  status?: PostStatus
  notes?: string
  campaignId?: string
  groupId?: string
  groupType?: GroupType
}): Promise<Post> {
  const db = getSupabase()

  const { data: row, error } = await db
    .from('posts')
    .insert({
      platform: data.platform,
      content: data.content,
      scheduled_at: data.scheduledAt || null,
      status: data.status || 'draft',
      notes: data.notes || null,
      campaign_id: data.campaignId || null,
      group_id: data.groupId || null,
      group_type: data.groupType || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`)
  }

  return toPost(row)
}

export async function getPost(id: string): Promise<Post | undefined> {
  const db = getSupabase()

  const { data: row, error } = await db
    .from('posts')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined // Not found
    throw new Error(`Failed to get post: ${error.message}`)
  }

  return toPost(row)
}

export async function updatePost(
  id: string,
  updates: Partial<Omit<Post, 'id' | 'createdAt'>>
): Promise<Post | undefined> {
  const db = getSupabase()

  const dbUpdates: Record<string, unknown> = {}
  if (updates.platform !== undefined) dbUpdates.platform = updates.platform
  if (updates.content !== undefined) dbUpdates.content = updates.content
  if (updates.scheduledAt !== undefined) dbUpdates.scheduled_at = updates.scheduledAt
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  if (updates.campaignId !== undefined) dbUpdates.campaign_id = updates.campaignId
  if (updates.groupId !== undefined) dbUpdates.group_id = updates.groupId
  if (updates.groupType !== undefined) dbUpdates.group_type = updates.groupType
  if (updates.publishResult !== undefined) dbUpdates.publish_result = updates.publishResult

  const { data: row, error } = await db
    .from('posts')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to update post: ${error.message}`)
  }

  return toPost(row)
}

export async function deletePost(id: string): Promise<boolean> {
  const db = getSupabase()

  const { error, count } = await db
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`)
  }

  return count !== null && count > 0
}

export async function archivePost(id: string): Promise<Post | undefined> {
  return updatePost(id, { status: 'archived' })
}

export async function restorePost(id: string): Promise<Post | undefined> {
  return updatePost(id, { status: 'draft' })
}

export async function listPosts(options?: {
  status?: PostStatus | 'all'
  platform?: Platform
  campaignId?: string
  groupId?: string
  limit?: number
}): Promise<Post[]> {
  const db = getSupabase()

  let query = db
    .from('posts')
    .select()
    .order('updated_at', { ascending: false })

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }
  if (options?.platform) {
    query = query.eq('platform', options.platform)
  }
  if (options?.campaignId) {
    query = query.eq('campaign_id', options.campaignId)
  }
  if (options?.groupId) {
    query = query.eq('group_id', options.groupId)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list posts: ${error.message}`)
  }

  return (data || []).map(toPost)
}

export async function searchPosts(query: string, options?: { limit?: number }): Promise<Post[]> {
  const db = getSupabase()
  const searchTerm = `%${query}%`

  // Search in content (as text), notes, and platform
  // Using textSearch for better results, but falling back to ilike for simplicity
  let dbQuery = db
    .from('posts')
    .select()
    .neq('status', 'archived')
    .or(`notes.ilike.${searchTerm},platform.ilike.${searchTerm}`)
    .order('updated_at', { ascending: false })

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    throw new Error(`Failed to search posts: ${error.message}`)
  }

  return (data || []).map(toPost)
}

// ==================
// Campaign Operations
// ==================

export async function createCampaign(data: {
  name: string
  description?: string
  status?: CampaignStatus
}): Promise<Campaign> {
  const db = getSupabase()

  const { data: row, error } = await db
    .from('campaigns')
    .insert({
      name: data.name,
      description: data.description || null,
      status: data.status || 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`)
  }

  return toCampaign(row)
}

export async function getCampaign(id: string): Promise<{ campaign: Campaign; posts: Post[] } | undefined> {
  const db = getSupabase()

  const { data: campaign, error } = await db
    .from('campaigns')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to get campaign: ${error.message}`)
  }

  const { data: posts, error: postsError } = await db
    .from('posts')
    .select()
    .eq('campaign_id', id)
    .order('updated_at', { ascending: false })

  if (postsError) {
    throw new Error(`Failed to get campaign posts: ${postsError.message}`)
  }

  return {
    campaign: toCampaign(campaign),
    posts: (posts || []).map(toPost),
  }
}

export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
): Promise<Campaign | undefined> {
  const db = getSupabase()

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.status !== undefined) dbUpdates.status = updates.status

  const { data: row, error } = await db
    .from('campaigns')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to update campaign: ${error.message}`)
  }

  return toCampaign(row)
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const db = getSupabase()

  // First, clear campaign_id from all posts
  await db
    .from('posts')
    .update({ campaign_id: null })
    .eq('campaign_id', id)

  const { error, count } = await db
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete campaign: ${error.message}`)
  }

  return count !== null && count > 0
}

export async function listCampaigns(options?: {
  status?: CampaignStatus | 'all'
  limit?: number
}): Promise<Campaign[]> {
  const db = getSupabase()

  let query = db
    .from('campaigns')
    .select()
    .order('updated_at', { ascending: false })

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list campaigns: ${error.message}`)
  }

  return (data || []).map(toCampaign)
}

export async function addPostToCampaign(campaignId: string, postId: string): Promise<Post | undefined> {
  // Verify campaign exists
  const campaignResult = await getCampaign(campaignId)
  if (!campaignResult) return undefined

  return updatePost(postId, { campaignId })
}

export async function removePostFromCampaign(_campaignId: string, postId: string): Promise<Post | undefined> {
  const db = getSupabase()

  const { data: row, error } = await db
    .from('posts')
    .update({ campaign_id: null })
    .eq('id', postId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to remove post from campaign: ${error.message}`)
  }

  return toPost(row)
}

// ==================
// Blog Draft Operations
// ==================

function calculateWordCount(content: string): number {
  const trimmed = content.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export async function createBlogDraft(data: {
  title: string
  content?: string
  date?: string | null
  scheduledAt?: string | null
  status?: BlogDraftStatus
  notes?: string
  campaignId?: string
  images?: string[]
}): Promise<BlogDraft> {
  const db = getSupabase()
  const content = data.content || ''

  const { data: row, error } = await db
    .from('blog_drafts')
    .insert({
      title: data.title,
      content,
      date: data.date || null,
      scheduled_at: data.scheduledAt || null,
      status: data.status || 'draft',
      notes: data.notes || null,
      campaign_id: data.campaignId || null,
      word_count: calculateWordCount(content),
      images: data.images || [],
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create blog draft: ${error.message}`)
  }

  return toBlogDraft(row)
}

export async function getBlogDraft(id: string): Promise<BlogDraft | undefined> {
  const db = getSupabase()

  const { data: row, error } = await db
    .from('blog_drafts')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to get blog draft: ${error.message}`)
  }

  return toBlogDraft(row)
}

export async function updateBlogDraft(
  id: string,
  updates: Partial<Omit<BlogDraft, 'id' | 'createdAt' | 'wordCount'>>
): Promise<BlogDraft | undefined> {
  const db = getSupabase()

  const dbUpdates: Record<string, unknown> = {}
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.content !== undefined) {
    dbUpdates.content = updates.content
    dbUpdates.word_count = calculateWordCount(updates.content)
  }
  if (updates.date !== undefined) dbUpdates.date = updates.date
  if (updates.scheduledAt !== undefined) dbUpdates.scheduled_at = updates.scheduledAt
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  if (updates.campaignId !== undefined) dbUpdates.campaign_id = updates.campaignId
  if (updates.images !== undefined) dbUpdates.images = updates.images

  const { data: row, error } = await db
    .from('blog_drafts')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to update blog draft: ${error.message}`)
  }

  return toBlogDraft(row)
}

export async function deleteBlogDraft(id: string): Promise<boolean> {
  const db = getSupabase()

  const { error, count } = await db
    .from('blog_drafts')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete blog draft: ${error.message}`)
  }

  return count !== null && count > 0
}

export async function archiveBlogDraft(id: string): Promise<BlogDraft | undefined> {
  return updateBlogDraft(id, { status: 'archived' })
}

export async function restoreBlogDraft(id: string): Promise<BlogDraft | undefined> {
  return updateBlogDraft(id, { status: 'draft' })
}

export async function listBlogDrafts(options?: {
  status?: BlogDraftStatus | 'all'
  campaignId?: string
  limit?: number
  search?: string
}): Promise<BlogDraft[]> {
  const db = getSupabase()

  let query = db
    .from('blog_drafts')
    .select()
    .order('updated_at', { ascending: false })

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }
  if (options?.campaignId) {
    query = query.eq('campaign_id', options.campaignId)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.search) {
    const searchTerm = `%${options.search}%`
    query = query.or(`title.ilike.${searchTerm},content.ilike.${searchTerm},notes.ilike.${searchTerm}`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list blog drafts: ${error.message}`)
  }

  return (data || []).map(toBlogDraft)
}

export async function searchBlogDrafts(query: string, options?: { limit?: number }): Promise<BlogDraft[]> {
  const db = getSupabase()
  const searchTerm = `%${query}%`

  let dbQuery = db
    .from('blog_drafts')
    .select()
    .neq('status', 'archived')
    .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},notes.ilike.${searchTerm}`)
    .order('updated_at', { ascending: false })

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    throw new Error(`Failed to search blog drafts: ${error.message}`)
  }

  return (data || []).map(toBlogDraft)
}

export async function addImageToBlogDraft(
  draftId: string,
  sourcePath: string
): Promise<{ filename: string; size: number; mimetype: string; markdown: string; draft: BlogDraft }> {
  // Note: For now, we'll just add the path to the images array
  // Full file copying would require access to the file system
  // which may not be available in all MCP contexts

  const draft = await getBlogDraft(draftId)
  if (!draft) {
    throw new Error(`Blog draft with ID ${draftId} not found`)
  }

  // Extract filename from path
  const filename = sourcePath.split('/').pop() || 'image'
  const images = [...draft.images, filename]

  const updatedDraft = await updateBlogDraft(draftId, { images })
  if (!updatedDraft) {
    throw new Error('Failed to update draft with image')
  }

  // Determine mimetype from extension
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const mimetypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  }

  return {
    filename,
    size: 0, // Would need filesystem access to get actual size
    mimetype: mimetypes[ext] || 'application/octet-stream',
    markdown: `![image](/api/blog-media/${filename})`,
    draft: updatedDraft,
  }
}

export async function getDraftImages(draftId: string): Promise<string[]> {
  const draft = await getBlogDraft(draftId)
  if (!draft) {
    throw new Error(`Blog draft with ID ${draftId} not found`)
  }
  return draft.images
}
