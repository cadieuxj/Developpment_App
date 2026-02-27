import { test, expect } from '@playwright/test';

/**
 * E2E: Authentication flows
 * These tests verify that auth routing works correctly.
 * NOTE: For full auth testing, configure Clerk test mode or use a seeded test account.
 */

test.describe('Authentication', () => {
  test('landing page is accessible without authentication', async ({ page }) => {
    await page.goto('/');
    // Should not redirect to sign-in — landing page is public
    expect(page.url()).not.toContain('/sign-in');
  });

  test('unauthenticated /dashboard redirects to /sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to sign-in
    await page.waitForURL(/sign-in/, { timeout: 10_000 });
    expect(page.url()).toContain('sign-in');
  });

  test('sign-in page renders correctly', async ({ page }) => {
    await page.goto('/sign-in');
    // Clerk renders a sign-in form
    await expect(page.locator('form, [data-testid="sign-in"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('sign-up page renders correctly', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.locator('form, [data-testid="sign-up"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
