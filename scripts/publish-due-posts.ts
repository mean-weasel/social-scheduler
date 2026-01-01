/**
 * Publish Due Posts Script
 *
 * This script is called by GitHub Actions every 15 minutes.
 * It scans the posts/scheduled folder for posts that are due,
 * publishes them to the appropriate platforms, and moves them
 * to the posts/published folder.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// Types
interface Post {
  id: string
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  platforms: ('twitter' | 'linkedin' | 'reddit')[]
  content: {
    twitter?: { text: string; mediaUrls?: string[] }
    linkedin?: { text: string; visibility: 'public' | 'connections' }
    reddit?: { subreddit: string; title: string; body?: string; url?: string; flairId?: string }
  }
  publishResults?: Record<string, {
    success: boolean
    postId?: string
    postUrl?: string
    error?: string
    publishedAt?: string
  }>
}

// Paths
const SCHEDULED_DIR = 'posts/scheduled'
const PUBLISHED_DIR = 'posts/published'

// Ensure directories exist
function ensureDirectories() {
  if (!existsSync(SCHEDULED_DIR)) {
    mkdirSync(SCHEDULED_DIR, { recursive: true })
  }
  if (!existsSync(PUBLISHED_DIR)) {
    mkdirSync(PUBLISHED_DIR, { recursive: true })
  }
}

// Check if a post is due
function isDue(post: Post): boolean {
  if (!post.scheduledAt) return false
  return new Date(post.scheduledAt) <= new Date()
}

// Publish to Twitter
async function publishToTwitter(content: Post['content']['twitter']): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  if (!content) {
    return { success: false, error: 'No Twitter content' }
  }

  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { success: false, error: 'Twitter credentials not configured' }
  }

  try {
    // Using Twitter API v2
    // In a real implementation, you would use the twitter-api-v2 package
    // For now, we'll simulate the API call

    console.log(`[Twitter] Would post: ${content.text.slice(0, 50)}...`)

    // TODO: Implement actual Twitter API call
    // const client = new TwitterApi({ ... })
    // const result = await client.v2.tweet(content.text)

    // Simulated success for now
    return {
      success: true,
      postId: `twitter_${Date.now()}`,
      postUrl: `https://twitter.com/i/status/${Date.now()}`,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// Publish to LinkedIn
async function publishToLinkedIn(content: Post['content']['linkedin']): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  if (!content) {
    return { success: false, error: 'No LinkedIn content' }
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN

  if (!accessToken) {
    return { success: false, error: 'LinkedIn credentials not configured' }
  }

  try {
    console.log(`[LinkedIn] Would post: ${content.text.slice(0, 50)}...`)

    // TODO: Implement actual LinkedIn API call
    // Using LinkedIn Marketing API

    return {
      success: true,
      postId: `linkedin_${Date.now()}`,
      postUrl: `https://linkedin.com/feed/update/urn:li:share:${Date.now()}`,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// Publish to Reddit
async function publishToReddit(content: Post['content']['reddit']): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  if (!content) {
    return { success: false, error: 'No Reddit content' }
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const refreshToken = process.env.REDDIT_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return { success: false, error: 'Reddit credentials not configured' }
  }

  try {
    console.log(`[Reddit] Would post to r/${content.subreddit}: ${content.title}`)

    // TODO: Implement actual Reddit API call
    // Using snoowrap or raw API

    return {
      success: true,
      postId: `reddit_${Date.now()}`,
      postUrl: `https://reddit.com/r/${content.subreddit}/comments/${Date.now()}`,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// Main function
async function main() {
  console.log('='.repeat(50))
  console.log('Publish Scheduled Posts')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log('='.repeat(50))

  ensureDirectories()

  // Get all scheduled posts
  let files: string[]
  try {
    files = readdirSync(SCHEDULED_DIR).filter(f => f.endsWith('.json'))
  } catch {
    console.log('No scheduled posts found')
    return
  }

  console.log(`Found ${files.length} scheduled posts`)

  let publishedCount = 0
  let failedCount = 0

  for (const file of files) {
    const filePath = join(SCHEDULED_DIR, file)
    let post: Post

    try {
      post = JSON.parse(readFileSync(filePath, 'utf-8'))
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err)
      continue
    }

    if (!isDue(post)) {
      console.log(`Skipping ${post.id}: scheduled for ${post.scheduledAt}`)
      continue
    }

    console.log(`\nPublishing post: ${post.id}`)
    console.log(`Platforms: ${post.platforms.join(', ')}`)

    const results: Post['publishResults'] = {}
    let allSucceeded = true

    for (const platform of post.platforms) {
      console.log(`  Publishing to ${platform}...`)

      let result: { success: boolean; postId?: string; postUrl?: string; error?: string }

      switch (platform) {
        case 'twitter':
          result = await publishToTwitter(post.content.twitter)
          break
        case 'linkedin':
          result = await publishToLinkedIn(post.content.linkedin)
          break
        case 'reddit':
          result = await publishToReddit(post.content.reddit)
          break
        default:
          result = { success: false, error: `Unknown platform: ${platform}` }
      }

      results[platform] = {
        ...result,
        publishedAt: result.success ? new Date().toISOString() : undefined,
      }

      if (result.success) {
        console.log(`    ✓ Success: ${result.postUrl}`)
      } else {
        console.log(`    ✗ Failed: ${result.error}`)
        allSucceeded = false
      }
    }

    // Update post with results
    post.status = allSucceeded ? 'published' : 'failed'
    post.updatedAt = new Date().toISOString()
    post.publishResults = results

    // Move to published folder
    const newPath = join(PUBLISHED_DIR, file)
    writeFileSync(newPath, JSON.stringify(post, null, 2))

    try {
      // Remove from scheduled folder
      const fs = await import('fs/promises')
      await fs.unlink(filePath)
    } catch {
      // Ignore if file already removed
    }

    if (allSucceeded) {
      publishedCount++
    } else {
      failedCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Summary: ${publishedCount} published, ${failedCount} failed`)
  console.log('='.repeat(50))
}

main().catch(console.error)
