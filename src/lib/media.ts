// Media validation utilities for URL-based media handling

/**
 * Validate if a string is a properly formatted URL
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Common image file extensions
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']

/**
 * Common video file extensions
 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']

/**
 * Known video hosting platforms
 */
const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'dailymotion.com']

/**
 * Check if a URL points to an image based on extension or known image hosts
 */
export function isImageUrl(url: string): boolean {
  if (!isValidMediaUrl(url)) return false
  const lowered = url.toLowerCase()

  // Check file extension
  if (IMAGE_EXTENSIONS.some(ext => lowered.includes(ext))) {
    return true
  }

  // Check known image CDNs
  const imageHosts = [
    'cloudinary.com',
    'imgur.com',
    'images.unsplash.com',
    'i.redd.it',
    'pbs.twimg.com',
    'media.licdn.com',
  ]

  try {
    const parsed = new URL(url)
    return imageHosts.some(host => parsed.hostname.includes(host))
  } catch {
    return false
  }
}

/**
 * Check if a URL points to a video based on extension or known video hosts
 */
export function isVideoUrl(url: string): boolean {
  if (!isValidMediaUrl(url)) return false
  const lowered = url.toLowerCase()

  // Check file extension
  if (VIDEO_EXTENSIONS.some(ext => lowered.includes(ext))) {
    return true
  }

  // Check known video hosts
  try {
    const parsed = new URL(url)
    return VIDEO_HOSTS.some(host => parsed.hostname.includes(host))
  } catch {
    return false
  }
}

/**
 * Determine the media type from a URL
 */
export function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  if (isImageUrl(url)) return 'image'
  if (isVideoUrl(url)) return 'video'
  return 'unknown'
}

/**
 * Validate a media URL and return an error message if invalid
 */
export function validateMediaUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' }
  }

  if (!isValidMediaUrl(url)) {
    return { valid: false, error: 'Invalid URL format. Must start with http:// or https://' }
  }

  const mediaType = getMediaType(url)
  if (mediaType === 'unknown') {
    return {
      valid: true,
      error: 'Could not detect media type. Preview may not display correctly.'
    }
  }

  return { valid: true }
}

/**
 * Platform-specific media limits
 */
export const MEDIA_LIMITS = {
  twitter: {
    maxImages: 4,
    maxVideos: 1,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxVideoSize: 512 * 1024 * 1024, // 512MB
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    supportedVideoFormats: ['mp4', 'mov'],
  },
  linkedin: {
    maxImages: 1,
    maxVideos: 1,
    maxImageSize: 8 * 1024 * 1024, // 8MB
    maxVideoSize: 200 * 1024 * 1024, // 200MB
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    supportedVideoFormats: ['mp4'],
  },
  reddit: {
    maxImages: 20,
    maxVideos: 1,
    maxImageSize: 20 * 1024 * 1024, // 20MB
    maxVideoSize: 1024 * 1024 * 1024, // 1GB
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    supportedVideoFormats: ['mp4', 'mov'],
  },
} as const

/**
 * Get a human-readable description of the media type
 */
export function getMediaTypeLabel(url: string): string {
  const type = getMediaType(url)
  switch (type) {
    case 'image':
      return 'Image'
    case 'video':
      return 'Video'
    default:
      return 'Media'
  }
}
