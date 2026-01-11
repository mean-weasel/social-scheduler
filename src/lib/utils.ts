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
    createdAt: dbCampaign.created_at,
    updatedAt: dbCampaign.updated_at,
  }
}
