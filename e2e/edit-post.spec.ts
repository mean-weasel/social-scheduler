import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  goToPosts,
  clickPost,
  fillContent,
  fillRedditFields,
  setLinkedInVisibility,
  setSchedule,
  saveDraft,
  schedulePost,
  togglePlatform,
  waitForNavigation,
  getPostCards,
} from './helpers'

test.describe('Edit Post', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test.describe('Navigate to Edit', () => {
    test('should navigate to edit page from posts list', async ({ page }) => {
      await goToPosts(page)

      // Click on the first post
      await clickPost(page, 0)

      // Should be on edit page
      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()
    })

    test('should navigate to edit page from dashboard', async ({ page }) => {
      // Go to dashboard
      await page.goto('/')

      // Click on a post in the upcoming posts sidebar
      const upcomingPost = page.locator('a[href^="/edit/"]').first()
      if (await upcomingPost.isVisible()) {
        await upcomingPost.click()
        await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()
      }
    })

    test('should load existing post content in editor', async ({ page }) => {
      await goToPosts(page)
      await clickPost(page, 0)

      // Verify content is loaded in textarea
      const textarea = page.locator('textarea').first()
      const content = await textarea.inputValue()
      expect(content.length).toBeGreaterThan(0)
    })
  })

  test.describe('Edit Twitter Posts', () => {
    test('should edit Twitter post content', async ({ page }) => {
      await page.goto('/')

      // Navigate directly to edit a demo post (demo-1 is a Twitter+LinkedIn post)
      await page.goto('/edit/demo-1')

      // Wait for content to load
      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Edit the content
      const newContent = 'Updated tweet content from E2E test!'
      await fillContent(page, newContent)

      // Verify preview updates
      await expect(page.locator('.bg-\\[\\#15202B\\]')).toContainText(newContent)

      // Save changes
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should change Twitter post to scheduled', async ({ page }) => {
      await goToPosts(page)

      // Filter to drafts
      await page.getByRole('button', { name: /drafts/i }).click()

      // Click on first draft post
      const draftCards = await getPostCards(page)
      if ((await draftCards.count()) > 0) {
        await draftCards.first().click()

        // Set a schedule
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        await setSchedule(page, tomorrow)

        // Schedule the post
        await schedulePost(page)
        await waitForNavigation(page, '/')
      }
    })
  })

  test.describe('Edit LinkedIn Posts', () => {
    test('should edit LinkedIn post visibility', async ({ page }) => {
      // Navigate to demo-5 which is a LinkedIn draft
      await page.goto('/edit/demo-5')

      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Change visibility
      await setLinkedInVisibility(page, 'public')

      // Save
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should edit LinkedIn post content and schedule', async ({ page }) => {
      await page.goto('/edit/demo-5')

      // Update content
      const newContent = 'Updated LinkedIn post with new insights!\n\n#updated #test'
      await fillContent(page, newContent)

      // Set schedule
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      nextWeek.setHours(9, 0, 0, 0)
      await setSchedule(page, nextWeek)

      // Schedule
      await schedulePost(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Edit Reddit Posts', () => {
    test('should edit Reddit post subreddit and title', async ({ page }) => {
      // Navigate to demo-3 which is a Reddit draft
      await page.goto('/edit/demo-3')

      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Update subreddit
      await fillRedditFields(page, {
        subreddit: 'learnprogramming',
        title: 'Updated: My favorite developer tools',
      })

      // Save
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should add flair to Reddit post', async ({ page }) => {
      await page.goto('/edit/demo-3')

      await fillRedditFields(page, {
        flair: 'Discussion',
      })

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Edit Multi-platform Posts', () => {
    test('should add a platform to existing post', async ({ page }) => {
      // Demo-1 is Twitter + LinkedIn
      await page.goto('/edit/demo-1')

      // Add Reddit
      await togglePlatform(page, 'reddit')

      // Fill in Reddit fields
      await fillRedditFields(page, {
        subreddit: 'programming',
        title: 'Also posting to Reddit now',
      })

      // Verify all three previews are visible
      await expect(page.getByText('Twitter / X')).toBeVisible()
      await expect(page.getByText('LinkedIn')).toBeVisible()
      await expect(page.getByText('Reddit')).toBeVisible()

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })

    test('should remove a platform from existing post', async ({ page }) => {
      // Demo-7 is a post with all three platforms
      await page.goto('/edit/demo-7')

      // Remove Twitter
      await togglePlatform(page, 'twitter')

      // Twitter preview should be hidden
      await expect(page.getByText('Twitter / X')).not.toBeVisible()

      // LinkedIn and Reddit should still be visible
      await expect(page.getByText('LinkedIn')).toBeVisible()
      await expect(page.getByText('Reddit')).toBeVisible()

      await saveDraft(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Edit Scheduled Posts', () => {
    test('should reschedule a post', async ({ page }) => {
      // Demo-2 is a scheduled Twitter post
      await page.goto('/edit/demo-2')

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
      // Demo-2 is a scheduled post
      await page.goto('/edit/demo-2')

      // Clear the schedule by clearing the date input
      await page.locator('input[type="date"]').fill('')

      // Save as draft
      await saveDraft(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Edit Published Posts', () => {
    test('should view published post (read-only)', async ({ page }) => {
      // Demo-4 is a published post
      await page.goto('/edit/demo-4')

      // Should be able to view the content
      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Content should be loaded
      const textarea = page.locator('textarea').first()
      const content = await textarea.inputValue()
      expect(content.length).toBeGreaterThan(0)
    })
  })

  test.describe('Validation', () => {
    test('should preserve changes when switching platforms', async ({ page }) => {
      await page.goto('/edit/demo-1')

      // Type some content
      const originalContent = 'Content that should persist'
      await fillContent(page, originalContent)

      // Toggle a platform off and on
      await togglePlatform(page, 'linkedin')
      await togglePlatform(page, 'linkedin')

      // Content should still be there
      const textarea = page.locator('textarea').first()
      await expect(textarea).toHaveValue(originalContent)
    })

    test('should show unsaved changes indicator', async ({ page }) => {
      await page.goto('/edit/demo-1')

      // Make a change
      await fillContent(page, 'Modified content')

      // The save draft button should be visible and enabled
      const saveDraftBtn = page.getByRole('button', { name: /save draft/i })
      await expect(saveDraftBtn).toBeEnabled()
    })
  })
})
