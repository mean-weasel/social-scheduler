import { test, expect } from '@playwright/test'
import {
  resetDatabase,
  goToNewPost,
  togglePlatform,
  fillContent,
  fillRedditFields,
  saveDraft,
  schedulePost,
  setSchedule,
  waitForNavigation,
  getAllPosts,
} from './helpers'

test.describe('Reddit Cross-posting', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page)
  })

  test.describe('Multiple Subreddit Post Creation', () => {
    test('should create separate posts for each subreddit', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      // Add 3 subreddits
      await fillRedditFields(page, {
        subreddits: ['startups', 'SaaS', 'sideproject'],
        title: 'Launching my new product',
      })
      await fillContent(page, 'Check out what I built!')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify 3 separate posts were created
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(3)

      // Verify each post has a different subreddit
      const subreddits = posts.map(p => p.content.reddit?.subreddit).sort()
      expect(subreddits).toEqual(['SaaS', 'sideproject', 'startups'])

      // Verify all posts have the same content
      for (const post of posts) {
        expect(post.content.reddit?.title).toBe('Launching my new product')
        expect(post.content.reddit?.body).toContain('Check out what I built!')
      }
    })

    test('should link posts with shared groupId', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['webdev', 'programming'],
        title: 'Code tip of the day',
      })
      await fillContent(page, 'Here is a useful trick...')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      const posts = await getAllPosts(page)
      expect(posts.length).toBe(2)

      // Verify both posts share the same groupId
      expect(posts[0].groupId).toBeTruthy()
      expect(posts[1].groupId).toBeTruthy()
      expect(posts[0].groupId).toBe(posts[1].groupId)

      // Verify groupType is 'reddit-crosspost'
      expect(posts[0].groupType).toBe('reddit-crosspost')
      expect(posts[1].groupType).toBe('reddit-crosspost')
    })

    test('should create single post for single subreddit (no groupId)', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['webdev'],
        title: 'Single subreddit post',
      })
      await fillContent(page, 'Just one subreddit')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      const posts = await getAllPosts(page)
      expect(posts.length).toBe(1)

      // Single post should NOT have groupId
      expect(posts[0].groupId).toBeFalsy()
      expect(posts[0].groupType).toBeFalsy()
      expect(posts[0].content.reddit?.subreddit).toBe('webdev')
    })
  })

  test.describe('Independent Scheduling', () => {
    test('should schedule all subreddit posts with same initial time', async ({ page }) => {
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['startups', 'entrepreneur'],
        title: 'My startup journey',
      })
      await fillContent(page, 'How I built my company')

      // Set schedule
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      await setSchedule(page, tomorrow)

      await schedulePost(page)
      await waitForNavigation(page, '/')

      const posts = await getAllPosts(page)
      expect(posts.length).toBe(2)

      // Both should be scheduled
      expect(posts[0].status).toBe('scheduled')
      expect(posts[1].status).toBe('scheduled')

      // Both should have scheduledAt set
      expect(posts[0].scheduledAt).toBeTruthy()
      expect(posts[1].scheduledAt).toBeTruthy()
    })

    test('should allow editing individual subreddit post schedule', async ({ page }) => {
      // Create cross-posts
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['startups', 'entrepreneur'],
        title: 'My startup journey',
      })
      await fillContent(page, 'How I built my company')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      await setSchedule(page, tomorrow)

      await schedulePost(page)
      await waitForNavigation(page, '/')

      // Get the posts
      let posts = await getAllPosts(page)
      expect(posts.length).toBe(2)
      const entrepreneurPost = posts.find(p => p.content.reddit?.subreddit === 'entrepreneur')!

      // Edit the entrepreneur post to a different time
      await page.goto(`/edit/${entrepreneurPost.id}`)

      // Change to day after tomorrow at 3pm
      const dayAfter = new Date()
      dayAfter.setDate(dayAfter.getDate() + 2)
      dayAfter.setHours(15, 0, 0, 0)

      await page.locator('input[type="date"]').fill(dayAfter.toISOString().split('T')[0])
      await page.locator('input[type="time"]').fill('15:00')

      await schedulePost(page)
      await waitForNavigation(page, '/')

      // Verify the posts now have different schedules
      posts = await getAllPosts(page)
      const updatedStartup = posts.find(p => p.content.reddit?.subreddit === 'startups')!
      const updatedEntrepreneur = posts.find(p => p.content.reddit?.subreddit === 'entrepreneur')!

      // The schedules should be different
      expect(updatedStartup.scheduledAt).not.toBe(updatedEntrepreneur.scheduledAt)

      // Verify the UI shows correct times
      await page.goto(`/edit/${updatedStartup.id}`)
      await expect(page.locator('input[type="time"]')).toHaveValue('10:00')

      await page.goto(`/edit/${updatedEntrepreneur.id}`)
      await expect(page.locator('input[type="time"]')).toHaveValue('15:00')
    })

    test('should allow different statuses for grouped posts', async ({ page }) => {
      // Create cross-posts as drafts
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['webdev', 'javascript'],
        title: 'JS tip',
      })
      await fillContent(page, 'Use const by default')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      let posts = await getAllPosts(page)
      expect(posts.length).toBe(2)

      // Both should be drafts
      expect(posts[0].status).toBe('draft')
      expect(posts[1].status).toBe('draft')

      // Schedule only the webdev post
      const webdevPost = posts.find(p => p.content.reddit?.subreddit === 'webdev')!
      await page.goto(`/edit/${webdevPost.id}`)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await setSchedule(page, tomorrow)
      await schedulePost(page)
      await waitForNavigation(page, '/')

      // Verify different statuses
      posts = await getAllPosts(page)
      const updatedWebdev = posts.find(p => p.content.reddit?.subreddit === 'webdev')!
      const updatedJs = posts.find(p => p.content.reddit?.subreddit === 'javascript')!

      expect(updatedWebdev.status).toBe('scheduled')
      expect(updatedJs.status).toBe('draft')

      // They should still share the same groupId
      expect(updatedWebdev.groupId).toBe(updatedJs.groupId)
    })
  })

  test.describe('Post Content Independence', () => {
    test('should allow editing individual post content independently', async ({ page }) => {
      // Create cross-posts
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['startups', 'smallbusiness'],
        title: 'Original title',
      })
      await fillContent(page, 'Original content')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      let posts = await getAllPosts(page)
      const startupPost = posts.find(p => p.content.reddit?.subreddit === 'startups')!

      // Edit just the startups post title
      await page.goto(`/edit/${startupPost.id}`)

      // Change the Reddit title
      const titleInput = page.locator('input[placeholder="Title for your Reddit post"]')
      await titleInput.clear()
      await titleInput.fill('Updated title for startups')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify only the startups post was updated
      posts = await getAllPosts(page)
      const updatedStartup = posts.find(p => p.content.reddit?.subreddit === 'startups')!
      const smallbizPost = posts.find(p => p.content.reddit?.subreddit === 'smallbusiness')!

      expect(updatedStartup.content.reddit?.title).toBe('Updated title for startups')
      expect(smallbizPost.content.reddit?.title).toBe('Original title')
    })

    test('should track launchedUrl independently per subreddit', async ({ page }) => {
      // Create cross-posts
      await goToNewPost(page)
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['webdev', 'programming'],
        title: 'Code tutorial',
      })
      await fillContent(page, 'Learn something new')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      let posts = await getAllPosts(page)
      const webdevPost = posts.find(p => p.content.reddit?.subreddit === 'webdev')!

      // Add launchedUrl to just the webdev post
      await page.goto(`/edit/${webdevPost.id}`)

      // Expand Published Links section
      await page.getByText('Published Links').click()

      // Fill in the Reddit launched URL
      const redditUrlInput = page.locator('input[placeholder="https://reddit.com/r/..."]')
      await redditUrlInput.fill('https://reddit.com/r/webdev/comments/abc123')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Verify only webdev post has launchedUrl
      posts = await getAllPosts(page)
      const updatedWebdev = posts.find(p => p.content.reddit?.subreddit === 'webdev')!
      const programmingPost = posts.find(p => p.content.reddit?.subreddit === 'programming')!

      expect(updatedWebdev.content.reddit?.launchedUrl).toBe('https://reddit.com/r/webdev/comments/abc123')
      expect(programmingPost.content.reddit?.launchedUrl).toBeFalsy()
    })
  })

  test.describe('Edge Cases', () => {
    test('should handle mixed platform post with multiple subreddits', async ({ page }) => {
      await goToNewPost(page)

      // Select Twitter AND Reddit
      await togglePlatform(page, 'twitter')
      await togglePlatform(page, 'reddit')

      await fillRedditFields(page, {
        subreddits: ['startups', 'entrepreneur'],
        title: 'Big announcement',
      })
      await fillContent(page, 'We just launched!')

      await saveDraft(page)
      await waitForNavigation(page, '/')

      // Should create 3 posts: 1 Twitter + 2 Reddit
      const posts = await getAllPosts(page)
      expect(posts.length).toBe(3)

      const twitterPosts = posts.filter(p => p.platforms.includes('twitter'))
      const redditPosts = posts.filter(p => p.platforms.includes('reddit'))

      expect(twitterPosts.length).toBe(1)
      expect(redditPosts.length).toBe(2)

      // Reddit posts should be grouped
      expect(redditPosts[0].groupId).toBe(redditPosts[1].groupId)

      // Twitter post should not be in the group
      expect(twitterPosts[0].groupId).toBeFalsy()
    })
  })
})
