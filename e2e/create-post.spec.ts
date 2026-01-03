import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  goToNewPost,
  togglePlatform,
  fillContent,
  fillRedditFields,
  setLinkedInVisibility,
  setSchedule,
  saveDraft,
  schedulePost,
  waitForNavigation,
} from './helpers'

test.describe('Create Post', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test.describe('Twitter Posts', () => {
    test('should create a Twitter draft post', async ({ page }) => {
      await goToNewPost(page)

      // Select Twitter platform
      await togglePlatform(page, 'twitter')

      // Fill in content
      await fillContent(page, 'This is a test tweet from Playwright E2E tests!')

      // Verify character count is visible
      await expect(page.getByText('/ 280')).toBeVisible()

      // Save as draft
      await saveDraft(page)

      // Should navigate back to dashboard
      await waitForNavigation(page, '/')
    })

    test('should create a Twitter scheduled post', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Scheduled tweet for tomorrow!')

      // Set schedule for tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      await setSchedule(page, tomorrow)

      // Schedule the post
      await schedulePost(page)

      await waitForNavigation(page, '/')
    })

    test('should show character count warning when approaching limit', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'twitter')

      // Fill with content near the limit
      const longText = 'A'.repeat(270)
      await fillContent(page, longText)

      // Character count should show warning color (yellow when > 90%)
      await expect(page.getByText('270')).toBeVisible()
    })

    test('should show error when exceeding character limit', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'twitter')

      // Fill with content over the limit
      const overLimitText = 'A'.repeat(290)
      await fillContent(page, overLimitText)

      // Character count should show error color
      await expect(page.getByText('290')).toBeVisible()
    })
  })

  test.describe('LinkedIn Posts', () => {
    test('should create a LinkedIn draft post with public visibility', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'Professional update from E2E tests!\n\nKey points:\n- Testing is important\n- Automation saves time')

      // Verify LinkedIn settings panel is visible
      await expect(page.getByText('LinkedIn Settings')).toBeVisible()

      // Set visibility to public (should be default)
      await setLinkedInVisibility(page, 'public')

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should create a LinkedIn post with connections-only visibility', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'A more personal update for my network.')

      // Set visibility to connections only
      await setLinkedInVisibility(page, 'connections')

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should create a LinkedIn scheduled post', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'Scheduled LinkedIn post for next week!')

      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      nextWeek.setHours(9, 0, 0, 0)
      await setSchedule(page, nextWeek)

      await schedulePost(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Reddit Posts', () => {
    test('should create a Reddit draft post', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'reddit')

      // Verify Reddit settings panel is visible
      await expect(page.getByText('Reddit Settings')).toBeVisible()

      // Fill in Reddit-specific fields
      await fillRedditFields(page, {
        subreddit: 'webdev',
        title: 'Built a social scheduler with Playwright tests',
      })

      await fillContent(page, 'Just added E2E tests to my social scheduler app. Here are some learnings...')

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should create a Reddit post with flair', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddit: 'SideProject',
        title: 'Show and Tell: My testing project',
        flair: 'Show and Tell',
      })

      await fillContent(page, 'Check out my side project with comprehensive E2E tests!')

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should create a Reddit scheduled post', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddit: 'startups',
        title: 'Launch day announcement',
      })

      await fillContent(page, 'We\'re launching next month and would love your feedback!')

      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setHours(12, 0, 0, 0)
      await setSchedule(page, nextMonth)

      await schedulePost(page)
      await waitForNavigation(page, '/')
    })

    test('should show title character count', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddit: 'test',
        title: 'This is a test title',
      })

      // Should show character count for title
      await expect(page.getByText('/ 300')).toBeVisible()
    })
  })

  test.describe('Multi-platform Posts', () => {
    test('should create a Twitter + LinkedIn draft post', async ({ page }) => {
      await goToNewPost(page)

      // Select both platforms
      await togglePlatform(page, 'twitter')
      await togglePlatform(page, 'linkedin')

      await fillContent(page, 'Cross-platform post for Twitter and LinkedIn!')

      // Both platform indicators should be visible
      await expect(page.getByText('/ 280')).toBeVisible()
      await expect(page.getByText('LinkedIn Settings')).toBeVisible()

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should create a post for all three platforms', async ({ page }) => {
      await goToNewPost(page)

      // Select all platforms
      await togglePlatform(page, 'twitter')
      await togglePlatform(page, 'linkedin')
      await togglePlatform(page, 'reddit')

      // Fill in content that works for all
      await fillContent(page, 'Exciting announcement across all platforms!')

      // Fill in Reddit-specific fields
      await fillRedditFields(page, {
        subreddit: 'webdev',
        title: 'Multi-platform post test',
      })

      // All platform previews should be visible (in the preview panel)
      const previewPanel = page.locator('.border-l.border-border')
      await expect(previewPanel.getByText('Twitter / X')).toBeVisible()
      await expect(previewPanel.getByText('LinkedIn').first()).toBeVisible()
      await expect(previewPanel.getByText('Reddit').first()).toBeVisible()

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should toggle platforms on and off', async ({ page }) => {
      await goToNewPost(page)

      const previewPanel = page.locator('.border-l.border-border')

      // Select Twitter
      await togglePlatform(page, 'twitter')
      await expect(previewPanel.getByText('Twitter / X')).toBeVisible()

      // Add LinkedIn
      await togglePlatform(page, 'linkedin')
      await expect(previewPanel.getByText('LinkedIn').first()).toBeVisible()

      // Remove Twitter
      await togglePlatform(page, 'twitter')
      // Twitter preview should be hidden
      await expect(previewPanel.getByText('Twitter / X')).not.toBeVisible()

      // LinkedIn should still be visible
      await expect(previewPanel.getByText('LinkedIn').first()).toBeVisible()
    })
  })

  test.describe('Validation', () => {
    test('should disable schedule button when no platforms selected', async ({ page }) => {
      await goToNewPost(page)

      // Don't select any platform
      await fillContent(page, 'Some content')

      // Schedule button should be disabled
      const scheduleBtn = page.getByRole('button', { name: /^schedule$/i })
      await expect(scheduleBtn).toBeDisabled()
    })

    test('should show preview as user types', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'twitter')

      const testText = 'Testing live preview functionality!'
      await fillContent(page, testText)

      // Preview should show the content
      const previewSection = page.locator('.bg-\\[\\#15202B\\]') // Twitter preview background
      await expect(previewSection).toContainText(testText)
    })

    test('should require date for scheduling', async ({ page }) => {
      await goToNewPost(page)

      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Test content')

      // Try to schedule without date
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('date')
        await dialog.accept()
      })

      await schedulePost(page)

      // Should still be on the editor page (not navigated)
      await expect(page.getByRole('heading', { name: /create post/i })).toBeVisible()
    })
  })
})
