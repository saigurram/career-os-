import { test, expect } from '@playwright/test'

test.describe('Authentication flows', () => {
  test('landing page redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('unauthenticated user redirected to login from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('unauthenticated user redirected to login from curriculum', async ({ page }) => {
    await page.goto('/curriculum')
    await expect(page).toHaveURL(/login/)
  })

  test('unauthenticated user redirected to login from jobs', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page).toHaveURL(/login/)
  })

  test('unauthenticated user redirected to login from portfolio', async ({ page }) => {
    await page.goto('/portfolio')
    await expect(page).toHaveURL(/login/)
  })

  test('login page shows email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
  })

  test('signup page shows required fields', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up|create account/i })).toBeVisible()
  })

  test('login shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('notauser@test.com')
    await page.getByLabel(/password/i).fill('wrongpassword123')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 })
  })
})
