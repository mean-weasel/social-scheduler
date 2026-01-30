import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert snake_case keys to camelCase
 * Used to transform Supabase responses to frontend format
 */
export function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

/**
 * Convert camelCase keys to snake_case
 * Used to transform frontend data to Supabase format
 */
export function camelToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  return result
}

/**
 * Transform a post from Supabase format (snake_case) to frontend format (camelCase)
 */
export function transformPostFromDb(dbPost: Record<string, unknown>): Record<string, unknown> {
  return {
    id: dbPost.id,
    createdAt: dbPost.created_at,
    updatedAt: dbPost.updated_at,
    scheduledAt: dbPost.scheduled_at,
    status: dbPost.status,
    platform: dbPost.platform,
    notes: dbPost.notes,
    campaignId: dbPost.campaign_id,
    groupId: dbPost.group_id,
    groupType: dbPost.group_type,
    content: dbPost.content,
    publishResult: dbPost.publish_result,
  }
}

/**
 * Transform a post from frontend format (camelCase) to Supabase format (snake_case)
 */
export function transformPostToDb(post: Record<string, unknown>): Record<string, unknown> {
  return {
    id: post.id,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
    scheduled_at: post.scheduledAt,
    status: post.status,
    platform: post.platform,
    notes: post.notes,
    campaign_id: post.campaignId,
    group_id: post.groupId,
    group_type: post.groupType,
    content: post.content,
    publish_result: post.publishResult,
  }
}

/**
 * Transform a campaign from Supabase format (snake_case) to frontend format (camelCase)
 */
export function transformCampaignFromDb(dbCampaign: Record<string, unknown>): Record<string, unknown> {
  return {
    id: dbCampaign.id,
    name: dbCampaign.name,
    description: dbCampaign.description,
    status: dbCampaign.status,
    projectId: dbCampaign.project_id,
    createdAt: dbCampaign.created_at,
    updatedAt: dbCampaign.updated_at,
  }
}

/**
 * Transform a project from Supabase format (snake_case) to frontend format (camelCase)
 */
export function transformProjectFromDb(dbProject: Record<string, unknown>): Record<string, unknown> {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description,
    hashtags: dbProject.hashtags || [],
    brandColors: dbProject.brand_colors || {},
    logoUrl: dbProject.logo_url,
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
  }
}

/**
 * Transform a project from frontend format (camelCase) to Supabase format (snake_case)
 */
export function transformProjectToDb(project: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (project.name !== undefined) result.name = project.name
  if (project.description !== undefined) result.description = project.description
  if (project.hashtags !== undefined) result.hashtags = project.hashtags
  if (project.brandColors !== undefined) result.brand_colors = project.brandColors
  if (project.logoUrl !== undefined) result.logo_url = project.logoUrl
  return result
}

/**
 * Transform an analytics connection from Supabase format (snake_case) to frontend format (camelCase)
 */
export function transformAnalyticsConnectionFromDb(dbConnection: Record<string, unknown>): Record<string, unknown> {
  return {
    id: dbConnection.id,
    userId: dbConnection.user_id,
    provider: dbConnection.provider,
    propertyId: dbConnection.property_id,
    propertyName: dbConnection.property_name,
    accessToken: dbConnection.access_token,
    refreshToken: dbConnection.refresh_token,
    tokenExpiresAt: dbConnection.token_expires_at,
    scopes: dbConnection.scopes || [],
    projectId: dbConnection.project_id,
    lastSyncAt: dbConnection.last_sync_at,
    syncStatus: dbConnection.sync_status,
    syncError: dbConnection.sync_error,
    createdAt: dbConnection.created_at,
    updatedAt: dbConnection.updated_at,
  }
}

/**
 * Transform an analytics connection from frontend format (camelCase) to Supabase format (snake_case)
 */
export function transformAnalyticsConnectionToDb(connection: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (connection.provider !== undefined) result.provider = connection.provider
  if (connection.propertyId !== undefined) result.property_id = connection.propertyId
  if (connection.propertyName !== undefined) result.property_name = connection.propertyName
  if (connection.accessToken !== undefined) result.access_token = connection.accessToken
  if (connection.refreshToken !== undefined) result.refresh_token = connection.refreshToken
  if (connection.tokenExpiresAt !== undefined) result.token_expires_at = connection.tokenExpiresAt
  if (connection.scopes !== undefined) result.scopes = connection.scopes
  if (connection.projectId !== undefined) result.project_id = connection.projectId
  if (connection.lastSyncAt !== undefined) result.last_sync_at = connection.lastSyncAt
  if (connection.syncStatus !== undefined) result.sync_status = connection.syncStatus
  if (connection.syncError !== undefined) result.sync_error = connection.syncError
  return result
}
