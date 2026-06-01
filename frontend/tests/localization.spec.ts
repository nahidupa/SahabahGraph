import { test, expect } from '@playwright/test';

test('should display names and biographies in different languages', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173');

  // Wait for sidebar to load
  await expect(page.getByText('Abu Bakr as-Siddiq').first()).toBeVisible({ timeout: 10000 });

  // Select Abu Bakr
  await page.getByText('Abu Bakr as-Siddiq').first().click();

  // Check English name in DetailPanel
  await expect(page.locator('h5').filter({ hasText: 'Abu Bakr as-Siddiq' })).toBeVisible();

  // Switch to Bangla
  // The select is in the sidebar
  await page.locator('select').selectOption('bn');
  await expect(page.locator('h5').filter({ hasText: 'আবু বকর ইবনে কুহাফা' })).toBeVisible();

  // Switch to German
  await page.locator('select').selectOption('de');
  await expect(page.locator('h5').filter({ hasText: 'Abū Bakr' })).toBeVisible();
});
