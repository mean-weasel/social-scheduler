import { Page, expect, TestInfo } from '@playwright/test'

const API_BASE = 'http://localhost:3001/api'

/**
 * Generate a unique test ID for content isolation in parallel tests.
 * Uses a combination of worker index and random string to ensure uniqueness.
 */
export function generateTestId(testInfo: TestInfo): string {
  const workerId = testInfo.parallelIndex
  const random = Math.random().toString(36).substring(2, 8)
  return `w${workerId}-${random}`
}

/**
 * Create unique content string for a test
 */
export function uniqueContent(baseContent: string, testId: string): string {
  return `${baseContent} [${testId}]`
}

/**
 * Reset the test database before each test
 */
export async function resetDatabase() {
  try {
    const response = await fetch(`${API_BASE}/posts/reset`, { method: 'POST' })
    if (!response.ok) {
      console.warn('Failed to reset database:', response.statusText)
    }
  } catch (error) {
    console.warn('Error resetting database:', error)
  }
}

/**
 * Initialize the app - just navigate to the dashboard
 * (No login required since we use localStorage)
 */
export async function enterDemoMode(page: Page) {
  // Reset the database before each test to ensure clean state
  await resetDatabase()

  await page.goto('/')
  // Wait for the dashboard to load - look for the header
  await expect(page.getByRole('link', { name: 'Social Scheduler', exact: true })).toBeVisible()
}

/**
 * Navigate to create new post
 */
export async function goToNewPost(page: Page) {
  await page.goto('/new')
  await expect(page.getByRole('heading', { name: /create post/i })).toBeVisible()
}

/**
 * Navigate to posts list
 */
export async function goToPosts(page: Page) {
  await page.goto('/posts')
  await expect(page.getByRole('heading', { name: /all posts/i })).toBeVisible()
}

/**
 * Select a platform in the editor
 */
export async function selectPlatform(page: Page, platform: 'twitter' | 'linkedin' | 'reddit') {
  const platformNames = {
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    reddit: 'Reddit',
  }
  await page.getByRole('button', { name: platformNames[platform] }).click()
}

/**
 * Toggle platform selection
 */
export async function togglePlatform(page: Page, platform: 'twitter' | 'linkedin' | 'reddit') {
  await selectPlatform(page, platform)
}

/**
 * Fill in the main content textarea
 */
export async function fillContent(page: Page, content: string) {
  const textarea = page.locator('textarea').first()
  await textarea.fill(content)
}

/**
 * Add notes to a post
 */
export async function fillNotes(page: Page, notes: string) {
  // Click the Notes section to expand it
  await page.getByRole('button', { name: /notes/i }).click()
  // Fill in the notes textarea (it's the one with "Add notes about this post" placeholder)
  const notesTextarea = page.getByPlaceholder(/add notes about this post/i)
  await notesTextarea.fill(notes)
}

/**
 * Fill in Reddit-specific fields
 */
export async function fillRedditFields(
  page: Page,
  options: { subreddit?: string; subreddits?: string[]; title?: string; flair?: string }
) {
  // Handle single subreddit (legacy) or multiple subreddits
  const subredditsToAdd = options.subreddits || (options.subreddit ? [options.subreddit] : [])
  for (const sub of subredditsToAdd) {
    const input = page.getByPlaceholder(/type subreddit, press enter/i)
    await input.fill(sub)
    await input.press('Enter')
  }
  if (options.title) {
    await page.getByPlaceholder(/title for your reddit post/i).fill(options.title)
  }
  if (options.flair) {
    await page.getByPlaceholder(/show and tell/i).fill(options.flair)
  }
}

/**
 * Set LinkedIn visibility
 */
export async function setLinkedInVisibility(page: Page, visibility: 'public' | 'connections') {
  const buttonText = visibility === 'public' ? 'Public' : 'Connections Only'
  await page.getByRole('button', { name: buttonText, exact: true }).click()
}

/**
 * Set schedule date and time
 */
export async function setSchedule(page: Page, date: Date) {
  const dateStr = date.toISOString().split('T')[0]
  const timeStr = date.toTimeString().slice(0, 5)

  await page.locator('input[type="date"]').fill(dateStr)
  await page.locator('input[type="time"]').fill(timeStr)
}

/**
 * Click save as draft button
 */
export async function saveDraft(page: Page) {
  await page.getByRole('button', { name: /save draft/i }).click()
}

/**
 * Click schedule button
 */
export async function schedulePost(page: Page) {
  await page.getByRole('button', { name: /^schedule$/i }).click()
}

/**
 * Click publish now button
 */
export async function publishNow(page: Page) {
  await page.getByRole('button', { name: /publish now/i }).click()
}

/**
 * Click delete button and confirm in modal dialog
 */
export async function deletePost(page: Page) {
  // Click the delete button
  await page.getByRole('button', { name: /delete/i }).click()

  // Wait for the confirmation dialog modal to appear and click Delete
  await page.getByRole('alertdialog').waitFor()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
}

/**
 * Click archive button and confirm in modal dialog
 */
export async function archivePost(page: Page) {
  // Click the archive button
  await page.getByRole('button', { name: /archive/i }).click()

  // Wait for the confirmation dialog modal to appear and click Archive
  await page.getByRole('alertdialog').waitFor()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Archive' }).click()
}

/**
 * Click restore button to restore an archived post
 */
export async function restorePost(page: Page) {
  await page.getByRole('button', { name: /restore/i }).click()
}

/**
 * Filter posts list by status
 */
export async function filterByStatus(page: Page, status: 'all' | 'draft' | 'scheduled' | 'published' | 'archived') {
  const statusNames: Record<string, string> = {
    all: 'All',
    draft: 'Drafts',
    scheduled: 'Scheduled',
    published: 'Published',
    archived: 'Archived',
  }
  await page.getByRole('button', { name: new RegExp(statusNames[status], 'i') }).click()
}

/**
 * Get post cards from the posts list
 */
export async function getPostCards(page: Page) {
  return page.locator('a[href^="/edit/"]')
}

/**
 * Click on a post to edit it
 */
export async function clickPost(page: Page, index: number = 0) {
  const cards = await getPostCards(page)
  await cards.nth(index).click()
  await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()
}

/**
 * Verify character count is displayed
 */
export async function verifyCharacterCount(page: Page, platform: 'twitter' | 'linkedin' | 'reddit') {
  const limits = {
    twitter: '280',
    linkedin: '3000',
    reddit: '40000',
  }
  // Check that the character limit is visible somewhere on the page
  await expect(page.getByText(limits[platform])).toBeVisible()
}

/**
 * Wait for navigation after action
 */
export async function waitForNavigation(page: Page, url: string | RegExp) {
  await expect(page).toHaveURL(url)
}

/**
 * Create a test post with given options
 */
export async function createTestPost(
  page: Page,
  options: {
    platform?: 'twitter' | 'linkedin' | 'reddit'
    content?: string
    asDraft?: boolean
  } = {}
) {
  const { platform = 'twitter', content = 'Test post content', asDraft = true } = options

  await page.goto('/new')
  await expect(page.getByRole('heading', { name: /create post/i })).toBeVisible()

  // Select platform
  await page.getByRole('button', { name: platform, exact: false }).click()

  // Fill content
  const textarea = page.locator('textarea').first()
  await textarea.fill(content)

  // Save
  if (asDraft) {
    await page.getByRole('button', { name: /save draft/i }).click()
  } else {
    // Set a schedule date in the future
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(dateStr)
    await page.locator('input[type="time"]').fill('12:00')
    await page.getByRole('button', { name: /^schedule$/i }).click()
  }

  // Wait for navigation back to dashboard
  await expect(page).toHaveURL('/')
}

// ============================================
// Database State Verification Helpers
// ============================================

interface PostFromAPI {
  id: string
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  platforms: string[]
  notes?: string
  content: {
    twitter?: {
      text: string
      mediaUrls?: string[]
      launchedUrl?: string
    }
    linkedin?: {
      text: string
      visibility: 'public' | 'connections'
      mediaUrl?: string
      launchedUrl?: string
    }
    reddit?: {
      subreddits: string[]
      title: string
      body?: string
      url?: string
      flairId?: string
      flairText?: string
      launchedUrls?: Record<string, string>
    }
  }
}

/**
 * Get all posts from the database via API
 */
export async function getAllPosts(page: Page): Promise<PostFromAPI[]> {
  const response = await page.request.get(`${API_BASE}/posts`)
  const data = await response.json()
  return data.posts
}

/**
 * Get the count of posts in the database
 */
export async function getPostCount(page: Page): Promise<number> {
  const posts = await getAllPosts(page)
  return posts.length
}

/**
 * Get a specific post by ID from the database
 */
export async function getPostById(page: Page, id: string): Promise<PostFromAPI | null> {
  const response = await page.request.get(`${API_BASE}/posts/${id}`)
  if (!response.ok()) return null
  const data = await response.json()
  return data.post
}

/**
 * Extract post ID from URL like /edit/abc-123
 */
export function extractPostIdFromUrl(url: string): string | null {
  const match = url.match(/\/edit\/([a-f0-9-]+)/)
  return match ? match[1] : null
}

