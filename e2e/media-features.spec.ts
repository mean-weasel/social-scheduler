import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  goToNewPost,
  togglePlatform,
  fillContent,
  fillRedditFields,
  saveDraft,
  waitForNavigation,
  goToPosts,
  clickPost,
} from './helpers'

test.describe('Media Features', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test.describe('Twitter Media URLs', () => {
    test('should show media button when Twitter is selected', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')

      // Media button should be visible
      const mediaButton = page.locator('button[title="Add media (images/videos)"]')
      await expect(mediaButton).toBeVisible()
    })

    test('should open media input section when clicking media button', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')

      // Click media button
      await page.locator('button[title="Add media (images/videos)"]').click()

      // Media section should be visible
      await expect(page.getByText('Media Attachments')).toBeVisible()
      await expect(page.getByText('Twitter (up to 4 images or 1 video)')).toBeVisible()
    })

    test('should add a media URL for Twitter', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Check out this image!')

      // Open media section
      await page.locator('button[title="Add media (images/videos)"]').click()

      // Add a media URL
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      await page.locator('input[placeholder="https://res.cloudinary.com/..."]').first().fill(testUrl)
      await page.locator('button.bg-twitter').click()

      // URL should be added (check for the image in the media input grid, not preview)
      const mediaSection = page.locator('.mb-6.p-4.rounded-xl.border-border')
      await expect(mediaSection.locator('img[alt="Media 1"]')).toBeVisible()

      // Save and verify
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should show media count badge on media button', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Post with media')

      // Open media section and add URL
      await page.locator('button[title="Add media (images/videos)"]').click()
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      await page.locator('input[placeholder="https://res.cloudinary.com/..."]').first().fill(testUrl)
      await page.locator('button.bg-twitter').click()

      // Close media section
      await page.locator('button[title="Add media (images/videos)"]').click()

      // Media button should show count
      const mediaButton = page.locator('button[title="Add media (images/videos)"]')
      await expect(mediaButton).toContainText('1')
    })

    test('should remove media URL when clicking remove button', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')

      // Open media section and add URL
      await page.locator('button[title="Add media (images/videos)"]').click()
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      await page.locator('input[placeholder="https://res.cloudinary.com/..."]').first().fill(testUrl)
      await page.locator('button.bg-twitter').click()

      // Image should be visible in the media input section
      const mediaSection = page.locator('.mb-6.p-4.rounded-xl.border-border')
      await expect(mediaSection.locator('img[alt="Media 1"]')).toBeVisible()

      // Hover over image and click remove (within media section)
      await mediaSection.locator('.relative.group').first().hover()
      await mediaSection.locator('.relative.group button').first().click()

      // Image should be removed from input section
      await expect(mediaSection.locator('img[alt="Media 1"]')).not.toBeVisible()
    })

    test('should show media in Twitter preview panel', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Post with preview')

      // Open media section and add URL
      await page.locator('button[title="Add media (images/videos)"]').click()
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      await page.locator('input[placeholder="https://res.cloudinary.com/..."]').first().fill(testUrl)
      await page.locator('button.bg-twitter').click()

      // Check preview panel shows media
      const previewPanel = page.locator('.border-l.border-border')
      await expect(previewPanel.locator('img[alt="Media 1"]')).toBeVisible()
    })
  })

  test.describe('LinkedIn Media URL', () => {
    test('should show LinkedIn media input when LinkedIn is selected', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'linkedin')

      // Open media section
      await page.locator('button[title="Add media (images/videos)"]').click()

      // LinkedIn media section should be visible
      await expect(page.getByText('LinkedIn (1 image or video)')).toBeVisible()
    })

    test('should add a media URL for LinkedIn', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'Professional post with image')

      // Open media section
      await page.locator('button[title="Add media (images/videos)"]').click()

      // Add LinkedIn media URL
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      await page.locator('input[placeholder="https://res.cloudinary.com/..."]').fill(testUrl)

      // Preview should show the image in the media section
      const mediaSection = page.locator('.mb-6.p-4.rounded-xl.border-border')
      await expect(mediaSection.locator('img[alt="LinkedIn media"]')).toBeVisible()

      // Save
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should show LinkedIn media in preview panel', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'Post for LinkedIn')

      // Open media section and add URL
      await page.locator('button[title="Add media (images/videos)"]').click()
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      await page.locator('input[placeholder="https://res.cloudinary.com/..."]').fill(testUrl)

      // Check preview panel shows media
      const previewPanel = page.locator('.border-l.border-border')
      await expect(previewPanel.locator('img[alt="LinkedIn media"]')).toBeVisible()
    })
  })

  test.describe('Reddit Link Posts', () => {
    test('should show link URL field for Reddit', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      // Link URL field should be visible
      await expect(page.getByText('Link URL (optional)')).toBeVisible()
      await expect(page.locator('input[placeholder*="youtube.com"]')).toBeVisible()
    })

    test('should create a Reddit link post', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddit: 'videos',
        title: 'Check out this cool video!',
      })

      // Add link URL
      const videoUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ'
      await page.locator('input[placeholder*="youtube.com"]').fill(videoUrl)

      await fillContent(page, 'Found this great video, thought you might enjoy it!')

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should show link indicator in Reddit preview', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddit: 'programming',
        title: 'Interesting article',
      })

      // Add link URL
      await page.locator('input[placeholder*="youtube.com"]').fill('https://example.com/article')

      // Preview should show "(Link Post)" indicator
      const previewPanel = page.locator('.border-l.border-border')
      await expect(previewPanel.getByText('(Link Post)')).toBeVisible()
    })

    test('should show text post indicator when no URL', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddit: 'AskReddit',
        title: 'What is your favorite color?',
      })

      // Don't add link URL - it's a text post
      await fillContent(page, 'Just curious what everyone thinks!')

      // Preview should show "(Text Post)" indicator
      const previewPanel = page.locator('.border-l.border-border')
      await expect(previewPanel.getByText('(Text Post)')).toBeVisible()
    })

    test('should show link URL in Reddit preview', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddit: 'videos',
        title: 'Great video',
      })

      const videoUrl = 'https://youtube.com/watch?v=abc123'
      await page.locator('input[placeholder*="youtube.com"]').fill(videoUrl)

      // Preview should show the link
      const previewPanel = page.locator('.border-l.border-border')
      await expect(previewPanel.getByText(videoUrl)).toBeVisible()
    })
  })

  test.describe('Multi-platform Media', () => {
    test('should show both Twitter and LinkedIn media inputs', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await togglePlatform(page, 'linkedin')

      // Open media section
      await page.locator('button[title="Add media (images/videos)"]').click()

      // Both platform sections should be visible
      await expect(page.getByText('Twitter (up to 4 images or 1 video)')).toBeVisible()
      await expect(page.getByText('LinkedIn (1 image or video)')).toBeVisible()
    })

    test('should persist media URLs when editing post', async ({ page }) => {
      // Create a post with media
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Post with media to edit')

      // Add media
      await page.locator('button[title="Add media (images/videos)"]').click()
      const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
      await page.locator('input[placeholder="https://res.cloudinary.com/..."]').first().fill(testUrl)
      await page.locator('button.bg-twitter').click()

      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Go to posts and edit
      await goToPosts(page)
      await clickPost(page, 0)

      // Open media section - should show existing media
      await page.locator('button[title="Add media (images/videos)"]').click()
      const mediaSection = page.locator('.mb-6.p-4.rounded-xl.border-border')
      await expect(mediaSection.locator('img[alt="Media 1"]')).toBeVisible()
    })
  })
})
