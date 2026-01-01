import { Page, expect } from '@playwright/test'

/**
 * Enter demo mode from the login page
 */
export async function enterDemoMode(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /try demo mode/i }).click()
  // Wait for navigation to dashboard
  await expect(page).toHaveURL('/')
  // Verify demo mode banner is visible
  await expect(page.getByText('Demo Mode')).toBeVisible()
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
 * Fill in Reddit-specific fields
 */
export async function fillRedditFields(
  page: Page,
  options: { subreddit?: string; title?: string; flair?: string }
) {
  if (options.subreddit) {
    await page.getByPlaceholder(/sideproject/i).fill(options.subreddit)
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
  await page.getByRole('button', { name: /schedule post/i }).click()
}

/**
 * Click publish now button
 */
export async function publishNow(page: Page) {
  await page.getByRole('button', { name: /publish now/i }).click()
}

/**
 * Click delete button and confirm
 */
export async function deletePost(page: Page) {
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: /delete/i }).click()
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
 * Get the demo mode banner
 */
export async function getDemoBanner(page: Page) {
  return page.locator('text=Demo Mode').first()
}

/**
 * Exit demo mode
 */
export async function exitDemoMode(page: Page) {
  await page.getByRole('button', { name: /sign in with github/i }).first().click()
  await expect(page).toHaveURL('/login')
}
