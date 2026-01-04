import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  createTestPost,
  goToPosts,
  getPostCards,
  archivePost,
  restorePost,
  filterByStatus,
  deletePost,
} from './helpers'

test.describe('Archive Post', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test('should archive a draft post from editor', async ({ page }) => {
    // Create a test post
    await createTestPost(page, { platform: 'twitter', content: 'Post to archive' })

    // Navigate to posts and click on it
    await goToPosts(page)
    const cards = await getPostCards(page)
    await cards.first().click()

    // Archive the post
    await archivePost(page)

    // Should navigate back to dashboard
    await expect(page).toHaveURL('/')
  })

  test('should show archived posts in archived filter', async ({ page }) => {
    // Create and archive a post
    await createTestPost(page, { platform: 'twitter', content: 'Archived post content' })
    await goToPosts(page)
    const cards = await getPostCards(page)
    await cards.first().click()
    await archivePost(page)

    // Go to posts list and filter by archived
    await goToPosts(page)
    await filterByStatus(page, 'archived')

    // Should see the archived post
    await expect(page.getByText('Archived post content')).toBeVisible()
  })

  test('should hide archived posts from All view', async ({ page }) => {
    // Create two posts
    await createTestPost(page, { platform: 'twitter', content: 'Visible post' })
    await createTestPost(page, { platform: 'twitter', content: 'Hidden archived post' })

    // Archive the second post
    await goToPosts(page)
    const cards = await getPostCards(page)
    await cards.first().click() // Click the most recent (second) post
    await archivePost(page)

    // Check All view - should only see the visible post
    await goToPosts(page)
    await expect(page.getByText('Visible post')).toBeVisible()
    await expect(page.getByText('Hidden archived post')).not.toBeVisible()
  })

  test('should restore archived post to drafts', async ({ page }) => {
    // Create and archive a post
    await createTestPost(page, { platform: 'twitter', content: 'Post to restore' })
    await goToPosts(page)
    let cards = await getPostCards(page)
    await cards.first().click()
    await archivePost(page)

    // Navigate to archived and restore
    await goToPosts(page)
    await filterByStatus(page, 'archived')
    cards = await getPostCards(page)
    await cards.first().click()

    // Click restore
    await restorePost(page)

    // Should navigate back to dashboard
    await expect(page).toHaveURL('/')

    // Verify restored to drafts
    await goToPosts(page)
    await filterByStatus(page, 'draft')
    await expect(page.getByText('Post to restore')).toBeVisible()
  })

  test('should permanently delete archived post', async ({ page }) => {
    // Create and archive a post
    await createTestPost(page, { platform: 'twitter', content: 'Post to delete forever' })
    await goToPosts(page)
    let cards = await getPostCards(page)
    await cards.first().click()
    await archivePost(page)

    // Go to archived and delete permanently
    await goToPosts(page)
    await filterByStatus(page, 'archived')
    cards = await getPostCards(page)
    await cards.first().click()

    // Delete the archived post
    await deletePost(page)

    // Should navigate back
    await expect(page).toHaveURL('/')

    // Verify gone - archived tab should be hidden since no archived posts remain
    await goToPosts(page)
    // The archived tab is hidden when there are no archived posts
    await expect(page.getByRole('button', { name: /archived/i })).not.toBeVisible()
  })

  test('should cancel archive confirmation', async ({ page }) => {
    // Create a test post
    await createTestPost(page, { platform: 'twitter', content: 'Post to keep' })
    await goToPosts(page)
    const cards = await getPostCards(page)
    await cards.first().click()

    // Click archive button
    await page.getByRole('button', { name: /archive/i }).click()

    // Wait for dialog and click Cancel
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()

    // Should still be on the edit page
    await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

    // Post should still exist in drafts
    await goToPosts(page)
    await filterByStatus(page, 'draft')
    await expect(page.getByText('Post to keep')).toBeVisible()
  })

  test('should show restore button only for archived posts', async ({ page }) => {
    // Create a draft post
    await createTestPost(page, { platform: 'twitter', content: 'Draft post' })
    await goToPosts(page)
    const cards = await getPostCards(page)
    await cards.first().click()

    // Should see Archive button, not Restore
    await expect(page.getByRole('button', { name: /archive/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /restore/i })).not.toBeVisible()
  })

  test('should hide archived tab when no archived posts', async ({ page }) => {
    // Create a post but don't archive it
    await createTestPost(page, { platform: 'twitter', content: 'Regular post' })

    // Go to posts
    await goToPosts(page)

    // Archived tab should not be visible when count is 0
    await expect(page.getByRole('button', { name: /archived/i })).not.toBeVisible()
  })

  test('should show archived tab when archived posts exist', async ({ page }) => {
    // Create and archive a post
    await createTestPost(page, { platform: 'twitter', content: 'To be archived' })
    await goToPosts(page)
    const cards = await getPostCards(page)
    await cards.first().click()
    await archivePost(page)

    // Go to posts
    await goToPosts(page)

    // Archived tab should now be visible
    await expect(page.getByRole('button', { name: /archived/i })).toBeVisible()
  })
})
