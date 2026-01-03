import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  goToPosts,
  clickPost,
  fillContent,
  saveDraft,
  schedulePost,
  waitForNavigation,
  createTestPost,
  setSchedule,
} from './helpers'

test.describe('Edit Post', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test.describe('Navigate to Edit', () => {
    test('should navigate to edit page from posts list', async ({ page }) => {
      // Create a post first
      await createTestPost(page, { platform: 'twitter', content: 'Test post' })

      await goToPosts(page)

      // Click on the first post
      await clickPost(page, 0)

      // Should be on edit page
      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()
    })

    test('should load existing post content in editor', async ({ page }) => {
      const testContent = 'This is my test content'
      await createTestPost(page, { platform: 'twitter', content: testContent })

      await goToPosts(page)
      await clickPost(page, 0)

      // Verify content is loaded in textarea
      const textarea = page.locator('textarea').first()
      await expect(textarea).toHaveValue(testContent)
    })
  })

  test.describe('Edit Post Content', () => {
    test('should edit post content', async ({ page }) => {
      await createTestPost(page, { platform: 'twitter', content: 'Original content' })

      await goToPosts(page)
      await clickPost(page, 0)

      // Edit the content
      const newContent = 'Updated content from E2E test!'
      await fillContent(page, newContent)

      // Save changes
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should change draft post to scheduled', async ({ page }) => {
      await createTestPost(page, { platform: 'twitter', content: 'Draft to schedule' })

      await goToPosts(page)
      await clickPost(page, 0)

      // Set a schedule
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      await setSchedule(page, tomorrow)

      // Schedule the post
      await schedulePost(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Edit Scheduled Posts', () => {
    test('should reschedule a post', async ({ page }) => {
      // Create a scheduled post
      await createTestPost(page, {
        platform: 'twitter',
        content: 'Scheduled post',
        asDraft: false,
      })

      await goToPosts(page)
      await clickPost(page, 0)

      // Change the schedule
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 3)
      newDate.setHours(14, 30, 0, 0)
      await setSchedule(page, newDate)

      // Re-schedule
      await schedulePost(page)
      await waitForNavigation(page, '/')
    })

    test('should convert scheduled post to draft', async ({ page }) => {
      // Create a scheduled post
      await createTestPost(page, {
        platform: 'twitter',
        content: 'Scheduled to become draft',
        asDraft: false,
      })

      await goToPosts(page)
      await clickPost(page, 0)

      // Clear the schedule by clearing the date input
      await page.locator('input[type="date"]').fill('')

      // Save as draft
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Validation', () => {
    test('should preserve changes when switching platforms', async ({ page }) => {
      await createTestPost(page, { platform: 'twitter', content: 'Original' })

      await goToPosts(page)
      await clickPost(page, 0)

      // Type some content
      const originalContent = 'Content that should persist'
      await fillContent(page, originalContent)

      // Add LinkedIn platform
      await page.getByRole('button', { name: 'LinkedIn' }).click()

      // Content should still be there
      const textarea = page.locator('textarea').first()
      await expect(textarea).toHaveValue(originalContent)
    })

    test('should show save button as enabled when content changes', async ({ page }) => {
      await createTestPost(page, { platform: 'twitter', content: 'Original' })

      await goToPosts(page)
      await clickPost(page, 0)

      // Make a change
      await fillContent(page, 'Modified content')

      // The save draft button should be visible and enabled
      const saveDraftBtn = page.getByRole('button', { name: /save draft/i })
      await expect(saveDraftBtn).toBeEnabled()
    })
  })
})
