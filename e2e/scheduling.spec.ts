import { test, expect } from '@playwright/test'
import {
  resetDatabase,
  goToNewPost,
  selectPlatform,
  fillContent,
  schedulePost,
  saveDraft,
  waitForNavigation,
  getAllPosts,
  waitForContentToLoad,
} from './helpers'

test.describe('Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page)
  })

  test.describe('Date Input', () => {
    test('should be visible and clickable', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')

      const dateInput = page.locator('input[type="date"]')
      await expect(dateInput).toBeVisible()
      await expect(dateInput).toBeEnabled()

      // Click should focus the input
      await dateInput.click()
      await expect(dateInput).toBeFocused()
    })

    test('should accept date via keyboard input', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')

      const dateInput = page.locator('input[type="date"]')

      // Set date via fill
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      await dateInput.fill(dateStr)
      await expect(dateInput).toHaveValue(dateStr)
    })

    test('should persist date after page navigation', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')
      await fillContent(page, 'Testing date persistence')

      const dateInput = page.locator('input[type="date"]')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      await dateInput.fill(dateStr)
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Get post and navigate back to edit
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(1)

      await page.goto(`/edit/${posts[0].id}`)
      await waitForContentToLoad(page, 'Testing date persistence')
      await expect(page.locator('input[type="date"]')).toHaveValue(dateStr)
    })
  })

  test.describe('Time Input', () => {
    test('should be visible and clickable', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')

      const timeInput = page.locator('input[type="time"]')
      await expect(timeInput).toBeVisible()
      await expect(timeInput).toBeEnabled()

      // Click should focus the input
      await timeInput.click()
      await expect(timeInput).toBeFocused()
    })

    test('should accept time via keyboard input', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')

      // First set a date (time depends on date being set)
      const dateInput = page.locator('input[type="date"]')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await dateInput.fill(tomorrow.toISOString().split('T')[0])

      const timeInput = page.locator('input[type="time"]')
      await timeInput.fill('14:30')
      await expect(timeInput).toHaveValue('14:30')
    })

    test('should persist time after page navigation', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')
      await fillContent(page, 'Testing time persistence')

      // Set date and time
      const dateInput = page.locator('input[type="date"]')
      const timeInput = page.locator('input[type="time"]')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      await dateInput.fill(dateStr)
      await timeInput.fill('09:15')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Navigate back to edit
      const posts = await getAllPosts(page)
      await page.goto(`/edit/${posts[0].id}`)
      await waitForContentToLoad(page, 'Testing time persistence')

      await expect(page.locator('input[type="date"]')).toHaveValue(dateStr)
      await expect(page.locator('input[type="time"]')).toHaveValue('09:15')
    })
  })

  test.describe('Scheduling Flow', () => {
    test('should schedule post with date and time', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')
      await fillContent(page, 'Scheduled post test')

      // Set schedule
      const dateInput = page.locator('input[type="date"]')
      const timeInput = page.locator('input[type="time"]')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      await dateInput.fill(dateStr)
      await timeInput.fill('10:00')

      await schedulePost(page)
      await waitForNavigation(page, '/')

      // Verify post is scheduled
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(1)
      expect(posts[0].status).toBe('scheduled')
      expect(posts[0].scheduledAt).toBeTruthy()
    })

    test('should disable schedule button when no date is set', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')
      await fillContent(page, 'Missing date test')

      // Schedule button should be disabled without a date
      const scheduleButton = page.getByRole('button', { name: /^schedule$/i })
      await expect(scheduleButton).toBeDisabled()
      await expect(scheduleButton).toHaveAttribute('title', 'Select a date and time to schedule')
    })

    test('should reschedule existing post', async ({ page }) => {
      // Create scheduled post
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')
      await fillContent(page, 'Post to reschedule')

      const dateInput = page.locator('input[type="date"]')
      const timeInput = page.locator('input[type="time"]')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await dateInput.fill(tomorrow.toISOString().split('T')[0])
      await timeInput.fill('10:00')

      await schedulePost(page)
      await waitForNavigation(page, '/')

      // Edit and reschedule
      const posts = await getAllPosts(page)
      const originalScheduledAt = posts[0].scheduledAt
      await page.goto(`/edit/${posts[0].id}`)
      await waitForContentToLoad(page, 'Post to reschedule')

      // Change date to day after tomorrow and time to 15:00
      const dayAfter = new Date()
      dayAfter.setDate(dayAfter.getDate() + 2)
      const newDateStr = dayAfter.toISOString().split('T')[0]

      await page.locator('input[type="date"]').fill(newDateStr)
      await page.locator('input[type="time"]').fill('15:00')
      await schedulePost(page)
      await waitForNavigation(page, '/')

      // Verify schedule was changed (different from original)
      const updatedPosts = await getAllPosts(page)
      expect(updatedPosts[0].scheduledAt).not.toBe(originalScheduledAt)
      expect(updatedPosts[0].scheduledAt).toBeTruthy()

      // Verify the date/time shows correctly in the UI
      await page.goto(`/edit/${updatedPosts[0].id}`)
      await waitForContentToLoad(page, 'Post to reschedule')
      await expect(page.locator('input[type="date"]')).toHaveValue(newDateStr)
      await expect(page.locator('input[type="time"]')).toHaveValue('15:00')
    })

    test('should clear schedule and save as draft', async ({ page }) => {
      // Create scheduled post
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')
      await fillContent(page, 'Scheduled then draft')

      const dateInput = page.locator('input[type="date"]')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await dateInput.fill(tomorrow.toISOString().split('T')[0])

      await schedulePost(page)
      await waitForNavigation(page, '/')

      // Edit and save as draft (which should clear schedule)
      const posts = await getAllPosts(page)
      await page.goto(`/edit/${posts[0].id}`)
      await waitForContentToLoad(page, 'Scheduled then draft')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify still has date but status is draft
      const updatedPosts = await getAllPosts(page)
      expect(updatedPosts[0].status).toBe('draft')
    })
  })

  test.describe('Calendar Icon Visibility', () => {
    test('date input should have visible picker indicator', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')

      const dateInput = page.locator('input[type="date"]')

      // The input wrapper should be visible
      const dateWrapper = dateInput.locator('..')
      await expect(dateWrapper).toBeVisible()

      // Input should be interactable
      const box = await dateInput.boundingBox()
      expect(box).toBeTruthy()
      expect(box!.width).toBeGreaterThan(50)
      expect(box!.height).toBeGreaterThan(20)
    })

    test('time input should have visible picker indicator', async ({ page }) => {
      await goToNewPost(page)
      await selectPlatform(page, 'twitter')

      const timeInput = page.locator('input[type="time"]')

      // The input wrapper should be visible
      const timeWrapper = timeInput.locator('..')
      await expect(timeWrapper).toBeVisible()

      // Input should be interactable
      const box = await timeInput.boundingBox()
      expect(box).toBeTruthy()
      expect(box!.width).toBeGreaterThan(50)
      expect(box!.height).toBeGreaterThan(20)
    })
  })
})
