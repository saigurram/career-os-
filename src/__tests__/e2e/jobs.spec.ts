import { test, expect } from '@playwright/test'

test.describe('Job feed', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.TEST_USER_EMAIL) test.skip()
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(/dashboard/)
    await page.goto('/jobs')
  })

  test('jobs page loads without error', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('undefined')
  })

  test('no job shows "Junior PM" or "PM II" level', async ({ page }) => {
    await page.waitForTimeout(2000) // let jobs load
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/Junior PM|PM II/)
  })

  test('no job shows USD compensation', async ({ page }) => {
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/\$\d{2,3},\d{3}|\$\d{1,3}k\s*USD/)
  })

  test('no job shows Bangalore-only location', async ({ page }) => {
    await page.waitForTimeout(2000)
    // Job cards should not show "Bangalore" as the sole location
    const jobCards = page.locator('[data-testid="job-card"], .job-card')
    const count = await jobCards.count()
    for (let i = 0; i < count; i++) {
      const text = await jobCards.nth(i).innerText()
      // If only Bangalore (not Hyderabad), fail
      if (text.includes('Bangalore') && !text.includes('Hyderabad') && !text.includes('Remote')) {
        throw new Error(`Job card contains Bangalore-only location: ${text.slice(0, 100)}`)
      }
    }
  })

  test('empty state is handled gracefully (no crash)', async ({ page }) => {
    // If no jobs, should show a friendly empty state not an error
    await expect(page.locator('body')).not.toContainText('Cannot read properties')
    await expect(page.locator('body')).not.toContainText('TypeError')
  })
})
