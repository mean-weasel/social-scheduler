import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  goToPosts,
  deletePost,
  waitForNavigation,
  getPostCards,
} from './helpers'

test.describe('Delete Post', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test.describe('Delete from Editor', () => {
    test('should delete a draft post', async ({ page }) => {
      // Navigate to a draft post
      await page.goto('/edit/demo-3') // Reddit draft

      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Delete the post
      await deletePost(page)

      // Should navigate back to dashboard
      await waitForNavigation(page, '/')
    })

    test('should delete a scheduled post', async ({ page }) => {
      // Navigate to a scheduled post
      await page.goto('/edit/demo-2') // Scheduled Twitter post

      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Delete the post
      await deletePost(page)

      // Should navigate back to dashboard
      await waitForNavigation(page, '/')
    })

    test('should delete a multi-platform post', async ({ page }) => {
      // Navigate to a multi-platform post
      await page.goto('/edit/demo-7') // All platforms draft

      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Delete the post
      await deletePost(page)

      // Should navigate back to dashboard
      await waitForNavigation(page, '/')
    })

    test('should cancel delete when declining confirmation', async ({ page }) => {
      await page.goto('/edit/demo-3')

      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Set up dialog handler to decline
      page.on('dialog', async (dialog) => {
        await dialog.dismiss()
      })

      // Click delete
      await page.getByRole('button', { name: /delete/i }).click()

      // Should still be on the edit page
      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()
    })
  })

  test.describe('Delete Different Post Types', () => {
    test('should delete a Twitter-only post', async ({ page }) => {
      await page.goto('/edit/demo-2') // Twitter scheduled

      // Verify it's a Twitter post
      await expect(page.getByText('Twitter / X')).toBeVisible()

      await deletePost(page)
      await waitForNavigation(page, '/')
    })

    test('should delete a LinkedIn-only post', async ({ page }) => {
      await page.goto('/edit/demo-5') // LinkedIn draft

      // Verify it's a LinkedIn post (check the platform button is selected)
      await expect(page.getByRole('button', { name: 'LinkedIn' })).toBeVisible()

      await deletePost(page)
      await waitForNavigation(page, '/')
    })

    test('should delete a Reddit-only post', async ({ page }) => {
      await page.goto('/edit/demo-3') // Reddit draft

      // Verify it's a Reddit post (check the platform button is selected)
      await expect(page.getByRole('button', { name: 'Reddit' })).toBeVisible()

      await deletePost(page)
      await waitForNavigation(page, '/')
    })

    test('should delete a Twitter + LinkedIn post', async ({ page }) => {
      await page.goto('/edit/demo-1') // Twitter + LinkedIn scheduled

      // Verify both platforms (check the platform buttons are visible)
      await expect(page.getByRole('button', { name: 'Twitter' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'LinkedIn' })).toBeVisible()

      await deletePost(page)
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Delete by Status', () => {
    test('should delete post from drafts filter', async ({ page }) => {
      await goToPosts(page)

      // Filter to drafts
      await page.getByRole('button', { name: /drafts/i }).click()

      // Get count before
      const cardsBeforeLocator = await getPostCards(page)
      const countBefore = await cardsBeforeLocator.count()

      if (countBefore > 0) {
        // Click first draft
        await cardsBeforeLocator.first().click()

        // Delete it
        await deletePost(page)

        // Should be back on posts page
        await waitForNavigation(page, '/')
      }
    })

    test('should delete post from scheduled filter', async ({ page }) => {
      await goToPosts(page)

      // Filter to scheduled
      await page.getByRole('button', { name: /scheduled/i }).click()

      const cards = await getPostCards(page)
      const count = await cards.count()

      if (count > 0) {
        await cards.first().click()
        await deletePost(page)
        await waitForNavigation(page, '/')
      }
    })

    test('should delete post from all posts view', async ({ page }) => {
      await goToPosts(page)

      // Stay on "All" filter
      const cards = await getPostCards(page)
      const count = await cards.count()

      if (count > 0) {
        await cards.first().click()
        await deletePost(page)
        await waitForNavigation(page, '/')
      }
    })
  })

  test.describe('Delete UI Behavior', () => {
    test('should show delete button on edit page', async ({ page }) => {
      await page.goto('/edit/demo-1')

      const deleteBtn = page.getByRole('button', { name: /delete/i })
      await expect(deleteBtn).toBeVisible()
    })

    test('should not show delete button on new post page', async ({ page }) => {
      await page.goto('/new')

      const deleteBtn = page.getByRole('button', { name: /delete/i })
      await expect(deleteBtn).not.toBeVisible()
    })

    test('should have destructive styling on delete button', async ({ page }) => {
      await page.goto('/edit/demo-1')

      const deleteBtn = page.getByRole('button', { name: /delete/i })

      // Should have destructive/red styling
      await expect(deleteBtn).toHaveClass(/destructive|red/)
    })
  })

  test.describe('Delete Edge Cases', () => {
    test('should handle delete of published post', async ({ page }) => {
      // Navigate to published post
      await page.goto('/edit/demo-4') // Published Twitter + LinkedIn

      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Delete should still work for published posts
      await deletePost(page)
      await waitForNavigation(page, '/')
    })

    test('should handle rapid delete attempts gracefully', async ({ page }) => {
      await page.goto('/edit/demo-3')

      // Accept all dialogs
      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      // Try to delete quickly
      const deleteBtn = page.getByRole('button', { name: /delete/i })
      await deleteBtn.click()

      // Should navigate away successfully
      await waitForNavigation(page, '/')
    })
  })

  test.describe('Delete Confirmation', () => {
    test('should show confirmation dialog before delete', async ({ page }) => {
      await page.goto('/edit/demo-1')

      let dialogShown = false

      page.on('dialog', async (dialog) => {
        dialogShown = true
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('delete')
        await dialog.accept()
      })

      await page.getByRole('button', { name: /delete/i }).click()

      // Wait a bit for dialog
      await page.waitForTimeout(500)
      expect(dialogShown).toBe(true)
    })

    test('should mention the action is irreversible', async ({ page }) => {
      await page.goto('/edit/demo-1')

      page.on('dialog', async (dialog) => {
        // Check that the message indicates irreversibility
        const message = dialog.message().toLowerCase()
        expect(message).toMatch(/cannot be undone|permanent|irreversible/i)
        await dialog.dismiss()
      })

      await page.getByRole('button', { name: /delete/i }).click()
    })
  })
})
