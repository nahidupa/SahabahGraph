import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#tour-sidebar', { timeout: 15000 });
});

test('should show the tour on first visit without beacon', async ({ page }) => {
  const tooltip = page.locator('.react-joyride__tooltip');
  const beacon = page.locator('.react-joyride__beacon');

  await expect(tooltip).toBeVisible({ timeout: 15000 });
  await expect(beacon).not.toBeVisible();
  await expect(tooltip).toContainText('Sidebar');

  const nextButton = tooltip.locator('button:has-text("Next")');
  await nextButton.click();

  await expect(tooltip).toContainText('Search');
});

test('should not show the tour if hasSeenTour is true', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('hasSeenTour', 'true'));
  await page.reload();
  await page.waitForSelector('#tour-sidebar');

  await page.waitForTimeout(2000);
  const beacon = page.locator('.react-joyride__beacon');
  const tooltip = page.locator('.react-joyride__tooltip');
  await expect(beacon).not.toBeVisible();
  await expect(tooltip).not.toBeVisible();
});

test('should start tour when clicking help button', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('hasSeenTour', 'true'));
  await page.reload();
  await page.waitForSelector('#tour-sidebar');

  // The title attribute in SahabahSidebar.tsx is t('tour.help_button')
  // In en.json it's "Tour"
  const helpButton = page.locator('button[title="Tour"]');
  await expect(helpButton).toBeVisible();
  await helpButton.click();

  const tooltip = page.locator('.react-joyride__tooltip');
  await expect(tooltip).toBeVisible({ timeout: 10000 });
});

test('should save seen status when closing via X', async ({ page }) => {
  const tooltip = page.locator('.react-joyride__tooltip');
  await expect(tooltip).toBeVisible({ timeout: 15000 });

  const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close")').first();
  await closeButton.click();

  await expect(tooltip).not.toBeVisible();

  await page.reload();
  await page.waitForSelector('#tour-sidebar');
  await page.waitForTimeout(1000);
  await expect(tooltip).not.toBeVisible();
});
