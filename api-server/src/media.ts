import path from 'path'
import os from 'os'
import fs from 'fs'
import crypto from 'crypto'
import type { Post } from './storage.js'
import { isTwitterContent, isLinkedInContent } from './storage.js'

// Storage configuration
const isTest = process.env.CI === 'true' || process.env.NODE_ENV === 'test'
const STORAGE_DIR = isTest
  ? path.join(os.tmpdir(), `social-scheduler-test-${process.pid}`)
  : process.env.STORAGE_DIR || path.join(os.homedir(), '.social-scheduler')

export const MEDIA_DIR = path.join(STORAGE_DIR, 'media')

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

// Extension mapping
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
}

/**
 * Initialize the media storage directory
 */
export function initMediaDir(): void {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true })
    console.log(`Media directory initialized at: ${MEDIA_DIR}`)
  }
}

/**
 * Generate a UUID-based filename with the original extension
 */
export function generateMediaFilename(mimetype: string): string {
  const uuid = crypto.randomUUID()
  const ext = MIME_TO_EXT[mimetype] || '.bin'
  return `${uuid}${ext}`
}

/**
 * Get the full path to a media file
 */
export function getMediaPath(filename: string): string {
  return path.join(MEDIA_DIR, filename)
}

/**
 * Check if a MIME type is valid for upload
 */
export function isValidMediaType(mimetype: string): boolean {
  return ALLOWED_TYPES.includes(mimetype)
}

/**
 * Check if a MIME type is an image
 */
export function isImageType(mimetype: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimetype)
}

/**
 * Check if a MIME type is a video
 */
export function isVideoType(mimetype: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimetype)
}

/**
 * Get the maximum file size for a given MIME type
 */
export function getMaxSizeForType(mimetype: string): number {
  if (isImageType(mimetype)) {
    return MAX_IMAGE_SIZE
  }
  if (isVideoType(mimetype)) {
    return MAX_VIDEO_SIZE
  }
  return 0
}

/**
 * Save a media file to disk
 * @returns The filename (not full path) for storage in database
 */
export async function saveMediaFile(buffer: Buffer, mimetype: string): Promise<string> {
  const filename = generateMediaFilename(mimetype)
  const filepath = getMediaPath(filename)

  await fs.promises.writeFile(filepath, buffer)
  return filename
}

/**
 * Delete a media file from disk
 * @returns true if file was deleted, false if it didn't exist
 */
export async function deleteMediaFile(filename: string): Promise<boolean> {
  const filepath = getMediaPath(filename)

  try {
    await fs.promises.unlink(filepath)
    return true
  } catch (error) {
    // File doesn't exist or other error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

/**
 * Check if a media file exists
 */
export function mediaFileExists(filename: string): boolean {
  const filepath = getMediaPath(filename)
  return fs.existsSync(filepath)
}

/**
 * Get the MIME type from a filename extension
 */
export function getMimeTypeFromFilename(filename: string): string | undefined {
  const ext = path.extname(filename).toLowerCase()
  const extToMime: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
  }
  return extToMime[ext]
}

/**
 * Extract all media filenames from a post
 * Used for cleanup when deleting a post
 */
export function extractFilenamesFromPost(post: Post): string[] {
  const filenames: string[] = []

  // Twitter media URLs
  if (post.platform === 'twitter' && isTwitterContent(post.content) && post.content.mediaUrls) {
    for (const url of post.content.mediaUrls) {
      // Only extract if it's a local filename (not a full URL)
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        filenames.push(url)
      }
    }
  }

  // LinkedIn media URL
  if (post.platform === 'linkedin' && isLinkedInContent(post.content) && post.content.mediaUrl) {
    const url = post.content.mediaUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      filenames.push(url)
    }
  }

  return filenames
}

/**
 * Delete all media files associated with a post
 */
export async function deletePostMedia(post: Post): Promise<number> {
  const filenames = extractFilenamesFromPost(post)
  let deleted = 0

  for (const filename of filenames) {
    const wasDeleted = await deleteMediaFile(filename)
    if (wasDeleted) {
      deleted++
    }
  }

  return deleted
}
