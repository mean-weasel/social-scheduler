import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  goToNewPost,
  togglePlatform,
  fillContent,
  fillRedditFields,
  saveDraft,
  waitForNavigation,
  clickPost,
  getAllPosts,
} from './helpers'

test.describe('Published Links', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test.describe('UI Display', () => {
    test('should show Published Links section when a platform is selected', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')

      // Published Links button should be visible
      await expect(page.getByRole('button', { name: /published links/i })).toBeVisible()
    })

    test('should not show Published Links section when no platform is selected', async ({ page }) => {
      await goToNewPost(page)

      // Published Links button should not be visible
      await expect(page.getByRole('button', { name: /published links/i })).not.toBeVisible()
    })

    test('should expand Published Links section when clicked', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')

      // Click to expand
      await page.getByRole('button', { name: /published links/i }).click()

      // Should show Twitter input field
      await expect(page.getByPlaceholder('https://twitter.com/user/status/...')).toBeVisible()
    })

    test('should show correct platform fields based on selected platforms', async ({ page }) => {
      await goToNewPost(page)

      // Select Twitter
      await togglePlatform(page, 'twitter')
      await page.getByRole('button', { name: /published links/i }).click()
      await expect(page.getByPlaceholder('https://twitter.com/user/status/...')).toBeVisible()
      await expect(page.getByPlaceholder('https://linkedin.com/posts/...')).not.toBeVisible()

      // Add LinkedIn
      await togglePlatform(page, 'linkedin')
      await expect(page.getByPlaceholder('https://linkedin.com/posts/...')).toBeVisible()
    })
  })

  test.describe('Twitter Launched URL', () => {
    test('should save Twitter launched URL', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Test post with launched URL')

      // Expand Published Links and add URL
      await page.getByRole('button', { name: /published links/i }).click()
      const twitterUrl = 'https://twitter.com/user/status/123456789'
      await page.getByPlaceholder('https://twitter.com/user/status/...').fill(twitterUrl)

      // Save draft
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify in database
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(1)
      expect(posts[0].content.twitter?.launchedUrl).toBe(twitterUrl)
    })

    test('should persist Twitter launched URL on reload', async ({ page }) => {
      // Create post with launched URL
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Twitter persistence test')
      await page.getByRole('button', { name: /published links/i }).click()
      const twitterUrl = 'https://twitter.com/user/status/987654321'
      await page.getByPlaceholder('https://twitter.com/user/status/...').fill(twitterUrl)
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Click on the post to edit
      await clickPost(page, 0)

      // Published Links should be expanded and URL should be present
      await expect(page.getByPlaceholder('https://twitter.com/user/status/...')).toHaveValue(twitterUrl)
    })
  })

  test.describe('LinkedIn Launched URL', () => {
    test('should save LinkedIn launched URL', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'LinkedIn post with launched URL')

      // Expand Published Links and add URL
      await page.getByRole('button', { name: /published links/i }).click()
      const linkedInUrl = 'https://linkedin.com/posts/user_activity-123456789'
      await page.getByPlaceholder('https://linkedin.com/posts/...').fill(linkedInUrl)

      // Save draft
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify in database
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(1)
      expect(posts[0].content.linkedin?.launchedUrl).toBe(linkedInUrl)
    })

    test('should persist LinkedIn launched URL on reload', async ({ page }) => {
      // Create post with launched URL
      await goToNewPost(page)
      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'LinkedIn persistence test')
      await page.getByRole('button', { name: /published links/i }).click()
      const linkedInUrl = 'https://linkedin.com/posts/user_activity-111222333'
      await page.getByPlaceholder('https://linkedin.com/posts/...').fill(linkedInUrl)
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Click on the post to edit
      await clickPost(page, 0)

      // Published Links should be expanded and URL should be present
      await expect(page.getByPlaceholder('https://linkedin.com/posts/...')).toHaveValue(linkedInUrl)
    })
  })

  test.describe('Reddit Launched URLs', () => {
    test('should show one URL field per subreddit', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      // Add subreddits
      await fillRedditFields(page, {
        subreddits: ['programming', 'webdev'],
        title: 'Test Reddit post',
      })

      // Expand Published Links
      await page.getByRole('button', { name: /published links/i }).click()

      // Should show one input per subreddit
      await expect(page.getByPlaceholder('https://reddit.com/r/programming/...')).toBeVisible()
      await expect(page.getByPlaceholder('https://reddit.com/r/webdev/...')).toBeVisible()
    })

    test('should save Reddit launched URLs per subreddit', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')
      await fillRedditFields(page, {
        subreddits: ['javascript', 'typescript'],
        title: 'TypeScript vs JavaScript',
      })
      await fillContent(page, 'Comparing the two languages')

      // Expand Published Links and add URLs
      await page.getByRole('button', { name: /published links/i }).click()
      const jsUrl = 'https://reddit.com/r/javascript/comments/abc123'
      const tsUrl = 'https://reddit.com/r/typescript/comments/def456'
      await page.getByPlaceholder('https://reddit.com/r/javascript/...').fill(jsUrl)
      await page.getByPlaceholder('https://reddit.com/r/typescript/...').fill(tsUrl)

      // Save draft
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify in database
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(1)
      expect(posts[0].content.reddit?.launchedUrls?.javascript).toBe(jsUrl)
      expect(posts[0].content.reddit?.launchedUrls?.typescript).toBe(tsUrl)
    })

    test('should persist Reddit launched URLs on reload', async ({ page }) => {
      // Create post with launched URLs
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')
      await fillRedditFields(page, {
        subreddits: ['reactjs'],
        title: 'React tips',
      })
      await fillContent(page, 'Some React tips')
      await page.getByRole('button', { name: /published links/i }).click()
      const reactUrl = 'https://reddit.com/r/reactjs/comments/xyz789'
      await page.getByPlaceholder('https://reddit.com/r/reactjs/...').fill(reactUrl)
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Click on the post to edit
      await clickPost(page, 0)

      // Published Links should be expanded and URL should be present
      await expect(page.getByPlaceholder('https://reddit.com/r/reactjs/...')).toHaveValue(reactUrl)
    })
  })

  test.describe('Multi-platform Launched URLs', () => {
    test('should save launched URLs for multiple platforms', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'Cross-posted content')

      // Expand Published Links and add URLs for both
      await page.getByRole('button', { name: /published links/i }).click()
      const twitterUrl = 'https://twitter.com/user/status/multi123'
      const linkedInUrl = 'https://linkedin.com/posts/user_activity-multi456'
      await page.getByPlaceholder('https://twitter.com/user/status/...').fill(twitterUrl)
      await page.getByPlaceholder('https://linkedin.com/posts/...').fill(linkedInUrl)

      // Save draft
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify in database
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(1)
      expect(posts[0].content.twitter?.launchedUrl).toBe(twitterUrl)
      expect(posts[0].content.linkedin?.launchedUrl).toBe(linkedInUrl)
    })

    test('should show count badge when URLs are filled', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await togglePlatform(page, 'linkedin')
      await fillContent(page, 'Post with multiple URLs')

      // Expand and add URLs
      await page.getByRole('button', { name: /published links/i }).click()
      await page.getByPlaceholder('https://twitter.com/user/status/...').fill('https://twitter.com/test')
      await page.getByPlaceholder('https://linkedin.com/posts/...').fill('https://linkedin.com/test')

      // Collapse section
      await page.getByRole('button', { name: /published links/i }).click()

      // Should show count of 2
      await expect(page.getByRole('button', { name: /published links/i })).toContainText('(2)')
    })
  })

  test.describe('Auto-expand behavior', () => {
    test('should auto-expand Published Links when loading post with URLs', async ({ page }) => {
      // Create post with launched URL
      await goToNewPost(page)
      await togglePlatform(page, 'twitter')
      await fillContent(page, 'Auto-expand test')
      await page.getByRole('button', { name: /published links/i }).click()
      await page.getByPlaceholder('https://twitter.com/user/status/...').fill('https://twitter.com/autoexpand')
      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Navigate to edit
      await clickPost(page, 0)

      // Published Links should be auto-expanded (input visible without clicking)
      await expect(page.getByPlaceholder('https://twitter.com/user/status/...')).toBeVisible()
    })
  })
})
