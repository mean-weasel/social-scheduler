// API-based storage for MCP server
// Connects to the shared API server for unified data access

const API_BASE = process.env.API_URL || 'http://localhost:3001/api'

// Type definitions (shared with web app and API server)
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
}

export interface LinkedInContent {
  text: string
  visibility: 'public' | 'connections'
  mediaUrl?: string
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

// Platform-specific content type based on selected platform
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

// CRUD Operations - all async via API

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
  campaignId?: string
  groupId?: string
  limit?: number
}): Promise<Post[]> {
  const params = new URLSearchParams()

  if (options?.status && options.status !== 'all') {
    params.set('status', options.status)
  }
  if (options?.platform) {
    params.set('platform', options.platform)
  }
  if (options?.campaignId) {
    params.set('campaignId', options.campaignId)
  }
  if (options?.groupId) {
    params.set('groupId', options.groupId)
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

// Campaign CRUD Operations

export async function createCampaign(data: {
  name: string
  description?: string
  status?: CampaignStatus
}): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error(`Failed to create campaign: ${res.statusText}`)
  }

  const { campaign } = await res.json()
  return campaign
}

export async function getCampaign(id: string): Promise<{ campaign: Campaign; posts: Post[] } | undefined> {
  const res = await fetch(`${API_BASE}/campaigns/${id}`)

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to get campaign: ${res.statusText}`)
  }

  return await res.json()
}

export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
): Promise<Campaign | undefined> {
  const res = await fetch(`${API_BASE}/campaigns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to update campaign: ${res.statusText}`)
  }

  const { campaign } = await res.json()
  return campaign
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/campaigns/${id}`, {
    method: 'DELETE',
  })

  if (res.status === 404) {
    return false
  }

  if (!res.ok) {
    throw new Error(`Failed to delete campaign: ${res.statusText}`)
  }

  return true
}

export async function listCampaigns(options?: {
  status?: CampaignStatus | 'all'
  limit?: number
}): Promise<Campaign[]> {
  const params = new URLSearchParams()

  if (options?.status && options.status !== 'all') {
    params.set('status', options.status)
  }
  if (options?.limit) {
    params.set('limit', String(options.limit))
  }

  const url = `${API_BASE}/campaigns${params.toString() ? '?' + params.toString() : ''}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to list campaigns: ${res.statusText}`)
  }

  const { campaigns } = await res.json()
  return campaigns
}

export async function addPostToCampaign(campaignId: string, postId: string): Promise<Post | undefined> {
  const res = await fetch(`${API_BASE}/campaigns/${campaignId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId }),
  })

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to add post to campaign: ${res.statusText}`)
  }

  const { post } = await res.json()
  return post
}

export async function removePostFromCampaign(campaignId: string, postId: string): Promise<Post | undefined> {
  const res = await fetch(`${API_BASE}/campaigns/${campaignId}/posts/${postId}`, {
    method: 'DELETE',
  })

  if (res.status === 404) {
    return undefined
  }

  if (!res.ok) {
    throw new Error(`Failed to remove post from campaign: ${res.statusText}`)
  }

  const { post } = await res.json()
  return post
}
