import { test, expect } from '@playwright/test'

// These tests require a test user in Supabase
// Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials
    if (!process.env.TEST_USER_EMAIL) {
      test.skip()
    }
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(/dashboard/)
  })

  test('dashboard loads with key sections', async ({ page }) => {
    // Multiple nav elements match — use first()
    await expect(page.getByText(/curriculum|progress|jobs/i).first()).toBeVisible()
  })

  test('progress ring is visible', async ({ page }) => {
    // Framer Motion animates from opacity:0 — wait for it to finish
    await expect(page.locator('[data-testid="progress-ring"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('stat cards are visible', async ({ page }) => {
    // 4 stat cards exist — assert at least the first is visible
    await expect(page.locator('[data-testid="stat-card"]').first()).toBeVisible()
  })

  test('navigation links to curriculum', async ({ page }) => {
    await page.getByRole('link', { name: /curriculum/i }).click()
    await expect(page).toHaveURL(/curriculum/)
  })

  test('navigation links to jobs', async ({ page }) => {
    await page.getByRole('link', { name: /jobs/i }).click()
    await expect(page).toHaveURL(/jobs/)
  })

  test('navigation links to portfolio', async ({ page }) => {
    await page.getByRole('link', { name: /portfolio/i }).click()
    await expect(page).toHaveURL(/portfolio/)
  })
})
