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
  projectId?: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  hashtags: string[]
  brandColors: {
    primary?: string
    secondary?: string
    accent?: string
  }
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectAccount {
  id: string
  projectId: string
  accountId: string
  createdAt: string
}

export interface ProjectAnalytics {
  totalCampaigns: number
  totalPosts: number
  scheduledPosts: number
  publishedPosts: number
  draftPosts: number
  failedPosts: number
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
  project_id: string | null
  created_at: string
  updated_at: string
}

interface DbProject {
  id: string
  user_id: string | null
  name: string
  description: string | null
  hashtags: string[]
  brand_colors: Record<string, string>
  logo_url: string | null
  created_at: string
  updated_at: string
}

interface DbProjectAccount {
  id: string
  project_id: string
  account_id: string
  created_at: string
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
    projectId: row.project_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    hashtags: row.hashtags || [],
    brandColors: row.brand_colors || {},
    logoUrl: row.logo_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProjectAccount(row: DbProjectAccount): ProjectAccount {
  return {
    id: row.id,
    projectId: row.project_id,
    accountId: row.account_id,
    createdAt: row.created_at,
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

// ==================
// Project Operations
// ==================

const PROJECT_SOFT_LIMIT = 3

export async function createProject(data: {
  name: string
  description?: string
  hashtags?: string[]
  brandColors?: Record<string, string>
  logoUrl?: string
}): Promise<{ project: Project; atLimit: boolean }> {
  const db = getSupabase()

  // Check current count for soft limit
  const { count } = await db
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const atLimit = (count || 0) >= PROJECT_SOFT_LIMIT

  const { data: row, error } = await db
    .from('projects')
    .insert({
      name: data.name,
      description: data.description || null,
      hashtags: data.hashtags || [],
      brand_colors: data.brandColors || {},
      logo_url: data.logoUrl || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  return { project: toProject(row), atLimit }
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = getSupabase()

  const { data: row, error } = await db
    .from('projects')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to get project: ${error.message}`)
  }

  return toProject(row)
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<Project | undefined> {
  const db = getSupabase()

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.hashtags !== undefined) dbUpdates.hashtags = updates.hashtags
  if (updates.brandColors !== undefined) dbUpdates.brand_colors = updates.brandColors
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl

  const { data: row, error } = await db
    .from('projects')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to update project: ${error.message}`)
  }

  return toProject(row)
}

export async function deleteProject(id: string): Promise<{ success: boolean; campaignsDeleted: number }> {
  const db = getSupabase()

  // Get count of campaigns that will be affected
  const { count: campaignCount } = await db
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  // Delete project (cascading delete will handle campaigns via ON DELETE SET NULL)
  // Note: Campaigns become unassigned, not deleted. Posts within those campaigns remain.
  const { error } = await db
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`)
  }

  return { success: true, campaignsDeleted: campaignCount || 0 }
}

export async function listProjects(options?: {
  limit?: number
  offset?: number
}): Promise<{ projects: Project[]; total: number; softLimit: number; atLimit: boolean }> {
  const db = getSupabase()

  let query = db
    .from('projects')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 100) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`)
  }

  const total = count || 0
  return {
    projects: (data || []).map(toProject),
    total,
    softLimit: PROJECT_SOFT_LIMIT,
    atLimit: total >= PROJECT_SOFT_LIMIT,
  }
}

export async function getProjectWithCampaigns(id: string): Promise<{ project: Project; campaigns: Campaign[] } | undefined> {
  const project = await getProject(id)
  if (!project) return undefined

  const db = getSupabase()
  const { data: campaigns, error } = await db
    .from('campaigns')
    .select()
    .eq('project_id', id)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get project campaigns: ${error.message}`)
  }

  return {
    project,
    campaigns: (campaigns || []).map(toCampaign),
  }
}

export async function getProjectAnalytics(id: string): Promise<ProjectAnalytics | undefined> {
  const project = await getProject(id)
  if (!project) return undefined

  const db = getSupabase()

  // Get campaign IDs
  const { data: campaigns } = await db
    .from('campaigns')
    .select('id')
    .eq('project_id', id)

  const campaignIds = (campaigns || []).map(c => c.id)
  const totalCampaigns = campaignIds.length

  if (totalCampaigns === 0) {
    return {
      totalCampaigns: 0,
      totalPosts: 0,
      scheduledPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      failedPosts: 0,
    }
  }

  // Get post statuses
  const { data: posts } = await db
    .from('posts')
    .select('status')
    .in('campaign_id', campaignIds)

  const postStatuses = posts || []

  return {
    totalCampaigns,
    totalPosts: postStatuses.length,
    scheduledPosts: postStatuses.filter(p => p.status === 'scheduled').length,
    publishedPosts: postStatuses.filter(p => p.status === 'published').length,
    draftPosts: postStatuses.filter(p => p.status === 'draft').length,
    failedPosts: postStatuses.filter(p => p.status === 'failed').length,
  }
}

// ==================
// Project Account Operations
// ==================

export async function addAccountToProject(projectId: string, accountId: string): Promise<ProjectAccount> {
  const db = getSupabase()

  // Verify project exists
  const project = await getProject(projectId)
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  const { data: row, error } = await db
    .from('project_accounts')
    .insert({
      project_id: projectId,
      account_id: accountId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Account is already associated with this project')
    }
    throw new Error(`Failed to add account to project: ${error.message}`)
  }

  return toProjectAccount(row)
}

export async function removeAccountFromProject(projectId: string, accountId: string): Promise<boolean> {
  const db = getSupabase()

  const { error, count } = await db
    .from('project_accounts')
    .delete()
    .eq('project_id', projectId)
    .eq('account_id', accountId)

  if (error) {
    throw new Error(`Failed to remove account from project: ${error.message}`)
  }

  return count !== null && count > 0
}

export async function getProjectAccounts(projectId: string): Promise<ProjectAccount[]> {
  const db = getSupabase()

  const { data, error } = await db
    .from('project_accounts')
    .select()
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get project accounts: ${error.message}`)
  }

  return (data || []).map(toProjectAccount)
}

// ==================
// Campaign-Project Operations
// ==================

export async function moveCampaignToProject(
  campaignId: string,
  targetProjectId: string | null
): Promise<Campaign | undefined> {
  const db = getSupabase()

  // Verify campaign exists
  const campaignResult = await getCampaign(campaignId)
  if (!campaignResult) return undefined

  // If targeting a project, verify it exists
  if (targetProjectId) {
    const project = await getProject(targetProjectId)
    if (!project) {
      throw new Error(`Target project with ID ${targetProjectId} not found`)
    }
  }

  const { data: row, error } = await db
    .from('campaigns')
    .update({ project_id: targetProjectId })
    .eq('id', campaignId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return undefined
    throw new Error(`Failed to move campaign: ${error.message}`)
  }

  return toCampaign(row)
}

export async function listCampaignsByProject(
  projectId: string | null,
  options?: { status?: CampaignStatus | 'all'; limit?: number }
): Promise<Campaign[]> {
  const db = getSupabase()

  let query = db
    .from('campaigns')
    .select()
    .order('updated_at', { ascending: false })

  if (projectId === null) {
    query = query.is('project_id', null)
  } else {
    query = query.eq('project_id', projectId)
  }

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list campaigns by project: ${error.message}`)
  }

  return (data || []).map(toCampaign)
}
