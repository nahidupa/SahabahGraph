import { test, expect } from '@playwright/test';

test('SahabahGraph loads and displays elements', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Check title in drawer
  await expect(page.getByText('SahabahGraph')).toBeVisible();

  // Check search field
  await expect(page.getByPlaceholder('Search Sahabah...')).toBeVisible();

  // Wait for data to load and Prophet to appear in list (or at least first node)
  await expect(page.getByText('Muhammad (PBUH)')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'sahabah-home.png' });
});
