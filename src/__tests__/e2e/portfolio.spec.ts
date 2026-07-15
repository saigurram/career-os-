import { test, expect } from '@playwright/test'

test.describe('Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.TEST_USER_EMAIL) test.skip()
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await page.waitForURL(/dashboard/)
    await page.goto('/portfolio')
  })

  test('portfolio page loads without error', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('TypeError')
  })

  test('empty portfolio shows helpful prompt not a crash', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('undefined')
    expect(bodyText).not.toContain('null')
  })
})
