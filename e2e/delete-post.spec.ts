import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  deletePost,
  waitForNavigation,
  getPostCards,
  createTestPost,
} from './helpers'

test.describe('Delete Post', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test('should delete a draft post from editor', async ({ page }) => {
    // Create a post first
    await createTestPost(page, { platform: 'twitter', content: 'Post to delete' })

    // Go to posts and click on the post
    await page.goto('/posts')
    const cards = await getPostCards(page)
    await cards.first().click()

    await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

    // Delete the post
    await deletePost(page)

    // Should navigate back to dashboard
    await waitForNavigation(page, '/')
  })

  test('should delete a scheduled post from editor', async ({ page }) => {
    // Create a scheduled post
    await createTestPost(page, {
      platform: 'twitter',
      content: 'Scheduled post to delete',
      asDraft: false,
    })

    // Go to posts and click on the post
    await page.goto('/posts')
    const cards = await getPostCards(page)
    await cards.first().click()

    await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

    // Delete the post
    await deletePost(page)

    // Should navigate back to dashboard
    await waitForNavigation(page, '/')
  })

  test('should cancel delete when declining confirmation', async ({ page }) => {
    // Create a post first
    await createTestPost(page, { platform: 'twitter', content: 'Post to keep' })

    // Go to posts and click on the post
    await page.goto('/posts')
    const cards = await getPostCards(page)
    await cards.first().click()

    await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

    // Click delete to open modal
    await page.getByRole('button', { name: /delete/i }).click()

    // Wait for modal and click Keep (cancel button)
    await page.getByRole('alertdialog').waitFor()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Keep' }).click()

    // Should still be on the edit page
    await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()
  })

  test('should show delete button on edit page', async ({ page }) => {
    // Create a post first
    await createTestPost(page, { platform: 'twitter', content: 'Test post' })

    // Go to posts and click on the post
    await page.goto('/posts')
    const cards = await getPostCards(page)
    await cards.first().click()

    const deleteBtn = page.getByRole('button', { name: /delete/i })
    await expect(deleteBtn).toBeVisible()
  })

  test('should not show delete button on new post page', async ({ page }) => {
    await page.goto('/new')

    const deleteBtn = page.getByRole('button', { name: /delete/i })
    await expect(deleteBtn).not.toBeVisible()
  })

  test('should show confirmation dialog before delete', async ({ page }) => {
    // Create a post first
    await createTestPost(page, { platform: 'twitter', content: 'Test post' })

    // Go to posts and click on the post
    await page.goto('/posts')
    const cards = await getPostCards(page)
    await cards.first().click()

    // Click delete to open modal
    await page.getByRole('button', { name: /delete/i }).click()

    // Modal dialog should appear with title and description
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Delete this post?')).toBeVisible()
    await expect(dialog.getByText('This action cannot be undone')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Delete' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Keep' })).toBeVisible()
  })
})
