import { test, expect } from '@playwright/test'
import {
  enterDemoMode,
  exitDemoMode,
  getDemoBanner,
} from './helpers'

test.describe('Demo Mode', () => {
  test.describe('Enter Demo Mode', () => {
    test('should show demo mode button on login page', async ({ page }) => {
      await page.goto('/login')

      const demoButton = page.getByRole('button', { name: /try demo mode/i })
      await expect(demoButton).toBeVisible()
    })

    test('should enter demo mode when clicking demo button', async ({ page }) => {
      await enterDemoMode(page)

      // Should be on dashboard
      await expect(page).toHaveURL('/')

      // Demo banner should be visible
      const banner = await getDemoBanner(page)
      await expect(banner).toBeVisible()
    })

    test('should show demo user avatar', async ({ page }) => {
      await enterDemoMode(page)

      // Should show demo user initials in header
      const avatar = page.locator('.rounded-full').filter({ hasText: /DE/i })
      await expect(avatar).toBeVisible()
    })
  })

  test.describe('Demo Banner', () => {
    test('should display demo mode indicator', async ({ page }) => {
      await enterDemoMode(page)

      await expect(page.getByText('Demo Mode')).toBeVisible()
    })

    test('should show explanation text', async ({ page }) => {
      await enterDemoMode(page)

      await expect(page.getByText(/sample data/i)).toBeVisible()
    })

    test('should show sign in with GitHub button', async ({ page }) => {
      await enterDemoMode(page)

      const signInBtn = page.getByRole('button', { name: /sign in with github/i })
      await expect(signInBtn).toBeVisible()
    })

    test('should show close button', async ({ page }) => {
      await enterDemoMode(page)

      const closeBtn = page.locator('button[title="Exit demo mode"]')
      await expect(closeBtn).toBeVisible()
    })
  })

  test.describe('Exit Demo Mode', () => {
    test('should exit demo mode via sign in button', async ({ page }) => {
      await enterDemoMode(page)

      await exitDemoMode(page)

      // Should be back on login page
      await expect(page).toHaveURL('/login')

      // Demo banner should not be visible
      await expect(page.getByText('Demo Mode')).not.toBeVisible()
    })

    test('should exit demo mode via close button', async ({ page }) => {
      await enterDemoMode(page)

      // Click the X button
      await page.locator('button[title="Exit demo mode"]').click()

      // Should be back on login page
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Demo Data', () => {
    test('should display demo posts on dashboard', async ({ page }) => {
      await enterDemoMode(page)

      // Should show stats
      await expect(page.getByText('Scheduled')).toBeVisible()
      await expect(page.getByText('Drafts')).toBeVisible()
      await expect(page.getByText('Published')).toBeVisible()
    })

    test('should display demo posts in posts list', async ({ page }) => {
      await enterDemoMode(page)

      await page.goto('/posts')

      // Should have posts
      const posts = page.locator('a[href^="/edit/"]')
      const count = await posts.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should display demo post in editor', async ({ page }) => {
      await enterDemoMode(page)

      // Navigate to a demo post
      await page.goto('/edit/demo-1')

      // Should load the post
      await expect(page.getByRole('heading', { name: /edit post/i })).toBeVisible()

      // Content should be loaded
      const textarea = page.locator('textarea').first()
      const content = await textarea.inputValue()
      expect(content.length).toBeGreaterThan(0)
    })
  })

  test.describe('Demo Mode Persistence', () => {
    test('should persist demo mode across page navigation', async ({ page }) => {
      await enterDemoMode(page)

      // Navigate to different pages
      await page.goto('/posts')
      await expect(page.getByText('Demo Mode')).toBeVisible()

      await page.goto('/new')
      await expect(page.getByText('Demo Mode')).toBeVisible()

      await page.goto('/settings')
      await expect(page.getByText('Demo Mode')).toBeVisible()

      await page.goto('/')
      await expect(page.getByText('Demo Mode')).toBeVisible()
    })

    test('should persist demo mode on page refresh', async ({ page }) => {
      await enterDemoMode(page)

      // Refresh the page
      await page.reload()

      // Should still be in demo mode
      await expect(page.getByText('Demo Mode')).toBeVisible()
    })
  })

  test.describe('Demo Mode Restrictions', () => {
    test('should simulate save in demo mode', async ({ page }) => {
      await enterDemoMode(page)

      await page.goto('/new')

      // Select a platform and add content
      await page.getByRole('button', { name: /twitter/i }).click()
      await page.locator('textarea').first().fill('Test tweet in demo mode')

      // Save as draft
      await page.getByRole('button', { name: /save draft/i }).click()

      // Should navigate back (simulated success)
      await expect(page).toHaveURL('/')
    })

    test('should simulate delete in demo mode', async ({ page }) => {
      await enterDemoMode(page)

      await page.goto('/edit/demo-1')

      // Set up dialog handler
      page.on('dialog', async (dialog) => {
        await dialog.accept()
      })

      // Click delete
      await page.getByRole('button', { name: /delete/i }).click()

      // Should navigate back (simulated success)
      await expect(page).toHaveURL('/')
    })
  })
})

test.describe('Dashboard in Demo Mode', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page)
  })

  test('should display calendar', async ({ page }) => {
    // Calendar header should be visible
    await expect(page.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i)).toBeVisible()
  })

  test('should display upcoming posts sidebar', async ({ page }) => {
    await expect(page.getByText(/upcoming posts/i)).toBeVisible()
  })

  test('should navigate calendar months', async ({ page }) => {
    const currentMonth = await page.locator('h2').first().textContent()

    // Click next month
    await page.locator('button').filter({ has: page.locator('svg') }).nth(2).click()

    const nextMonth = await page.locator('h2').first().textContent()
    expect(nextMonth).not.toBe(currentMonth)

    // Click previous month
    await page.locator('button').filter({ has: page.locator('svg') }).nth(0).click()
    await page.locator('button').filter({ has: page.locator('svg') }).nth(0).click()

    const prevMonth = await page.locator('h2').first().textContent()
    expect(prevMonth).not.toBe(nextMonth)
  })

  test('should click on calendar day to create new post', async ({ page }) => {
    // Click on a day in the calendar (find a link to /new with a date param)
    const dayLink = page.locator('a[href^="/new?date="]').first()
    await dayLink.click()

    await expect(page).toHaveURL(/\/new\?date=/)
    await expect(page.getByRole('heading', { name: /create post/i })).toBeVisible()
  })

  test('should show stats correctly', async ({ page }) => {
    // Stats should show numbers
    const scheduledStat = page.locator('text=Scheduled').locator('xpath=..').locator('div').first()
    const scheduledCount = await scheduledStat.textContent()
    expect(parseInt(scheduledCount || '0')).toBeGreaterThanOrEqual(0)
  })
})
