import { test, expect } from '@playwright/test';

test.describe('Projects page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/projects');
    // Skip rest of test if not authenticated
    if (page.url().includes('sign-in')) test.skip();
  });

  test('projects page loads', async ({ page }) => {
    await page.waitForLoadState('networkidle', { timeout: 8_000 });
    // Should show page heading
    const heading = page.getByRole('heading', { name: /Projects/i });
    await expect(heading).toBeVisible();
  });

  test('create project button is visible', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /New Project|Create Project/i });
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
  });

  test('create project dialog opens on button click', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /New Project|Create Project/i });
    await createBtn.click();
    // Dialog should appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('form validation prevents empty project name', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /New Project|Create Project/i });
    await createBtn.click();

    // Try to submit without filling in name
    const submitBtn = page.getByRole('button', { name: /Create|Submit/i }).last();
    await submitBtn.click();

    // Should show validation error
    const error = page.getByText(/required|cannot be empty/i);
    await expect(error).toBeVisible({ timeout: 3_000 });
  });
});
