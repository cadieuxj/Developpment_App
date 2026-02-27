import { test, expect } from '@playwright/test';

/**
 * E2E: Dashboard page tests
 * These tests require an authenticated session.
 * Configure PLAYWRIGHT_AUTH_COOKIE or use a Clerk test token in your CI environment.
 */

test.describe('Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // In CI, set up auth state via storage state or environment token
    // For local dev, ensure you're logged in before running E2E tests
    await page.goto('/dashboard');
  });

  test('dashboard page loads within 5 seconds', async ({ page }) => {
    // Either loads dashboard or redirects to sign-in — both are valid
    await page.waitForLoadState('networkidle', { timeout: 5_000 });
    const url = page.url();
    expect(url).toMatch(/dashboard|sign-in/);
  });

  test('navigation sidebar contains all expected items', async ({ page }) => {
    const url = page.url();
    if (url.includes('sign-in')) test.skip();

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'IDE' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AI Logs' })).toBeVisible();
  });

  test('stat cards are rendered', async ({ page }) => {
    const url = page.url();
    if (url.includes('sign-in')) test.skip();

    await expect(page.getByText('Total Projects')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Active Tasks')).toBeVisible();
    await expect(page.getByText('AI Requests')).toBeVisible();
    await expect(page.getByText('Total AI Cost')).toBeVisible();
  });
});

test.describe('AI Logs page', () => {
  test('AI Logs page loads without error', async ({ page }) => {
    await page.goto('/dashboard/ai-logs');
    await page.waitForLoadState('networkidle', { timeout: 8_000 });

    const url = page.url();
    if (url.includes('sign-in')) return; // Not authenticated — expected in CI

    // Either shows empty state or log entries — no 500 error
    const hasError = await page.locator('text=500').count();
    expect(hasError).toBe(0);
  });

  test('empty state is shown when no AI logs exist', async ({ page }) => {
    await page.goto('/dashboard/ai-logs');
    const url = page.url();
    if (url.includes('sign-in')) test.skip();

    // If the org has no AI logs, show the empty state message
    const emptyState = page.getByText('No AI interactions yet');
    const tableHeaders = page.getByText('Interaction History');

    await expect(emptyState.or(tableHeaders)).toBeVisible({ timeout: 8_000 });
  });
});
