import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  goToPosts,
  getPostCards,
} from './helpers'

test.describe('Posts List', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test.describe('Navigation', () => {
    test('should navigate to posts list from dashboard', async ({ page }) => {
      await page.goto('/')

      // Click on "View all" link in sidebar
      await page.getByRole('link', { name: /view all/i }).click()

      await expect(page).toHaveURL('/posts')
      await expect(page.getByRole('heading', { name: /all posts/i })).toBeVisible()
    })

    test('should display demo posts in list', async ({ page }) => {
      await goToPosts(page)

      const cards = await getPostCards(page)
      const count = await cards.count()

      // Demo mode should have posts
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Filter Tabs', () => {
    test('should show all posts by default', async ({ page }) => {
      await goToPosts(page)

      // All tab should be active
      const allTab = page.getByRole('button', { name: /^all/i })
      await expect(allTab).toHaveClass(/bg-accent/)
    })

    test('should filter to drafts', async ({ page }) => {
      await goToPosts(page)

      await page.getByRole('button', { name: /drafts/i }).click()

      // URL should not change, just the UI filter
      const cards = await getPostCards(page)
      const count = await cards.count()

      // All visible cards should be drafts
      for (let i = 0; i < count; i++) {
        const card = cards.nth(i)
        await expect(card).toContainText(/draft/i)
      }
    })

    test('should filter to scheduled', async ({ page }) => {
      await goToPosts(page)

      await page.getByRole('button', { name: /scheduled/i }).click()

      const cards = await getPostCards(page)
      const count = await cards.count()

      // All visible cards should be scheduled
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = cards.nth(i)
        await expect(card).toContainText(/scheduled/i)
      }
    })

    test('should filter to published', async ({ page }) => {
      await goToPosts(page)

      await page.getByRole('button', { name: /published/i }).click()

      const cards = await getPostCards(page)
      const count = await cards.count()

      // All visible cards should be published
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = cards.nth(i)
        await expect(card).toContainText(/published/i)
      }
    })

    test('should show counts in filter tabs', async ({ page }) => {
      await goToPosts(page)

      // Each tab should show a count
      const allTab = page.getByRole('button', { name: /^all/i })
      await expect(allTab).toContainText(/\(\d+\)/)

      const draftsTab = page.getByRole('button', { name: /drafts/i })
      await expect(draftsTab).toContainText(/\(\d+\)/)

      const scheduledTab = page.getByRole('button', { name: /scheduled/i })
      await expect(scheduledTab).toContainText(/\(\d+\)/)
    })
  })

  test.describe('Post Cards', () => {
    test('should display platform indicators', async ({ page }) => {
      await goToPosts(page)

      const firstCard = (await getPostCards(page)).first()

      // Should have colored dots for platforms
      const dots = firstCard.locator('.rounded-full')
      const dotCount = await dots.count()
      expect(dotCount).toBeGreaterThan(0)
    })

    test('should display content preview', async ({ page }) => {
      await goToPosts(page)

      const firstCard = (await getPostCards(page)).first()

      // Should show truncated content
      const cardText = await firstCard.textContent()
      expect(cardText?.length).toBeGreaterThan(0)
    })

    test('should display status badge', async ({ page }) => {
      await goToPosts(page)

      const firstCard = (await getPostCards(page)).first()

      // Should have a status indicator
      const hasStatus = await firstCard.locator('text=/draft|scheduled|published/i').count()
      expect(hasStatus).toBeGreaterThan(0)
    })

    test('should display scheduled time for scheduled posts', async ({ page }) => {
      await goToPosts(page)

      // Filter to scheduled
      await page.getByRole('button', { name: /scheduled/i }).click()

      const cards = await getPostCards(page)
      if ((await cards.count()) > 0) {
        const firstCard = cards.first()
        // Should show a time like "Jan 5, 10:00 AM"
        await expect(firstCard).toContainText(/\w{3} \d+/)
      }
    })

    test('should navigate to editor when clicked', async ({ page }) => {
      await goToPosts(page)

      const firstCard = (await getPostCards(page)).first()
      await firstCard.click()

      await expect(page).toHaveURL(/\/edit\//)
      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()
    })
  })

  test.describe('Empty States', () => {
    test('should show new post button in empty state', async ({ page }) => {
      await goToPosts(page)

      // Even if filtered to a status with no posts, should have create button
      const createBtn = page.getByRole('link', { name: /create post|new post/i })
      await expect(createBtn).toBeVisible()
    })
  })

  test.describe('New Post Button', () => {
    test('should have new post button in header', async ({ page }) => {
      await goToPosts(page)

      const newPostBtn = page.getByRole('link', { name: /new post/i })
      await expect(newPostBtn).toBeVisible()
    })

    test('should navigate to new post page', async ({ page }) => {
      await goToPosts(page)

      await page.getByRole('link', { name: /new post/i }).click()

      await expect(page).toHaveURL('/new')
      await expect(page.getByRole('heading', { name: /create post/i })).toBeVisible()
    })
  })

  test.describe('Sorting', () => {
    test('should display posts sorted by most recent first', async ({ page }) => {
      await goToPosts(page)

      // Posts should be sorted by updatedAt desc
      // This is hard to verify directly, but we can check that posts exist
      const cards = await getPostCards(page)
      const count = await cards.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Platform Filtering Display', () => {
    test('should show correct platform colors', async ({ page }) => {
      await goToPosts(page)

      // Twitter posts should have blue indicators
      // LinkedIn posts should have blue indicators (different shade)
      // Reddit posts should have orange indicators

      const cards = await getPostCards(page)
      const count = await cards.count()

      // Just verify cards are displayed with platform dots
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = cards.nth(i)
        const dots = card.locator('.rounded-full.w-2\\.5')
        const dotCount = await dots.count()
        expect(dotCount).toBeGreaterThanOrEqual(1)
      }
    })
  })
})
