import { test, expect } from '@playwright/test';

test.describe('SahabahGraph E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the initial node to be loaded in the graph
    await page.waitForFunction(() => window.cy && window.cy.nodes().length > 0);
  });

  test('Search functionality filters the sidebar list', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search Sahabah...');
    await searchInput.fill('Abu Bakr');

    // Check that Abu Bakr is visible and others (like Umar) are not
    await expect(page.getByText('Abu Bakr as-Siddiq').first()).toBeVisible();
    await expect(page.getByText('Umar ibn al-Khattab')).not.toBeVisible();
  });

  test('Selecting a node from sidebar updates the Detail Panel', async ({ page }) => {
    // Click on Abu Bakr in the sidebar
    await page.getByText('Abu Bakr as-Siddiq').first().click();

    // Check Detail Panel (it's a Drawer)
    // The name should appear in the Detail Panel as h5
    await expect(page.locator('h5:has-text("Abu Bakr as-Siddiq")')).toBeVisible();
    // Check Detail Panel content (subtitle)
    await expect(page.getByRole('heading', { name: 'As-Siddiq', exact: true })).toBeVisible();
  });

  test('Adding a node from sidebar to graph', async ({ page }) => {
    // Initially only 1 node (Muhammad PBUH)
    let nodeCount = await page.evaluate(() => window.cy.nodes().length);
    expect(nodeCount).toBe(1);

    // Click "Add to Graph" in the Abu Bakr list item.
    const abuBakrItem = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: /Abu Bakr as-Siddiq/i }) })
      .first();
    await abuBakrItem.getByRole('button', { name: 'Add to Graph' }).click();

    // Verify graph now has 2 nodes
    await page.waitForFunction(() => window.cy.nodes().length === 2);
    nodeCount = await page.evaluate(() => window.cy.nodes().length);
    expect(nodeCount).toBe(2);
  });

  test('Expanding relationships from Detail Panel', async ({ page }) => {
    // Select Muhammad (PBUH) to see his relationships
    await page.getByText('Muhammad (PBUH)').first().click();

    // "Others" is a category in the data for Muhammad (PBUH)
    // The chip should be visible.
    const othersChip = page.getByRole('button').filter({ hasText: 'Others' });
    await expect(othersChip.first()).toBeVisible();
    await othersChip.first().click();

    // Verify graph has more nodes now
    await page.waitForFunction(() => window.cy.nodes().length > 1);
    const nodeCount = await page.evaluate(() => window.cy.nodes().length);
    expect(nodeCount).toBeGreaterThan(1);

    // Verify edges are created
    await page.waitForFunction(() => window.cy.edges().length > 0);
    const edgeCount = await page.evaluate(() => window.cy.edges().length);
    expect(edgeCount).toBeGreaterThan(0);
  });

  test('Right-click on graph node opens relationship context menu', async ({ page, browserName }) => {
    const clickPoint = await page.evaluate(() => {
      const node = window.cy.nodes()[0];
      const rendered = node.renderedPosition();
      const rect = window.cy.container().getBoundingClientRect();
      return { x: rect.left + rendered.x, y: rect.top + rendered.y };
    });

    if (browserName === 'webkit') {
      await page.evaluate(() => {
        window.cy.nodes()[0].emit('cxttap');
      });
    } else {
      await page.mouse.click(clickPoint.x, clickPoint.y, { button: 'right' });
    }

    const relationshipMenu = page.getByRole('menu').last();
    await expect(relationshipMenu).toBeVisible();
    await expect(relationshipMenu.getByText('Expand Relationships')).toBeVisible();
    await expect(relationshipMenu.getByText('No relationships found in data.')).not.toBeVisible();
    await expect(relationshipMenu.getByRole('menuitem').first()).toBeVisible();
  });

  test('Abu Bakr shows relationship categories in detail panel', async ({ page }) => {
    await page.getByText('Abu Bakr as-Siddiq').first().click();

    await expect(page.getByText('Expand Relationships')).toBeVisible();
    await expect(page.getByText('No relationships found in data.')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Family' })).toBeVisible();
  });

  test('Abu Bakr Family expansion does not blank the page', async ({ page }) => {
    await page.getByText('Abu Bakr as-Siddiq').first().click();

    const familyChip = page.getByRole('button', { name: 'Family' });
    await expect(familyChip).toBeVisible();
    await familyChip.click();

    await page.waitForFunction(() => window.cy && window.cy.nodes().length > 1);
    await expect(page.getByText('SahabahGraph')).toBeVisible();
    await expect(page.getByText('Expand Relationships')).toBeVisible();
  });

  test('Graph controls (Zoom and Reset)', async ({ page }) => {
    // Zoom buttons are in a Paper at the bottom
    await page.evaluate(() => window.cy.zoom());
    // Click Zoom In multiple times if needed to ensure change
    await page.getByLabel('Zoom In').click();
    await page.getByLabel('Zoom In').click();

    const zoomedIn = await page.evaluate(() => window.cy.zoom());

    await page.getByLabel('Zoom Out').click();
    await page.getByLabel('Zoom Out').click();
    await page.getByLabel('Zoom Out').click();
    await page.getByLabel('Zoom Out').click();

    const zoomedOut = await page.evaluate(() => window.cy.zoom());
    expect(zoomedOut).not.toBe(zoomedIn);

    await page.getByLabel('Reset Layout').click();
    await page.waitForTimeout(500);
  });
});
