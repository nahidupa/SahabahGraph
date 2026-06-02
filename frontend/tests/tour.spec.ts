import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#tour-sidebar', { timeout: 15000 });
});

test('should show the tour on first visit', async ({ page }) => {
  const beacon = page.locator('.react-joyride__beacon');
  const tooltip = page.locator('.react-joyride__tooltip');

  await expect(beacon.or(tooltip)).toBeVisible({ timeout: 15000 });

  if (await beacon.isVisible()) {
      await beacon.click();
  }

  await expect(tooltip).toBeVisible();
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

  const helpButton = page.locator('button[title="Tour"]');
  await expect(helpButton).toBeVisible();
  await helpButton.click();

  const beacon = page.locator('.react-joyride__beacon');
  const tooltip = page.locator('.react-joyride__tooltip');

  await expect(beacon.or(tooltip)).toBeVisible({ timeout: 10000 });
});
