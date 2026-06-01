import { test, expect } from '@playwright/test';

test.describe('SahabahGraph E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the initial node to be loaded in the graph
    await expect(page.getByText('Muhammad (PBUH)').first()).toBeVisible({ timeout: 15000 });
    // We'll wait for the graph to be ready in the tests that need it
    await page.waitForFunction(() => (window as any).cy && (window as any).cy.nodes().length > 0, { timeout: 15000 });
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
    // Initially 5 nodes (Muhammad PBUH and 4 family members)
    let nodeCount = await page.evaluate(() => (window as any).cy.nodes().length);
    expect(nodeCount).toBe(5);

    // Click "Add to Graph" in the Abu Bakr list item.
    const abuBakrItem = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: /Abu Bakr as-Siddiq/i }) })
      .first();
    await abuBakrItem.getByRole('button', { name: 'Add to Graph' }).click();

    // Verify graph now has 6 nodes
    await page.waitForFunction(() => window.cy.nodes().length === 6);
    nodeCount = await page.evaluate(() => window.cy.nodes().length);
    expect(nodeCount).toBe(6);
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

  test('Relationship type actions are available in detail panel', async ({ page }) => {
    await page.getByText('Abu Bakr as-Siddiq').first().click();

    await expect(page.getByText('Relationship Types')).toBeVisible();
    const relationshipTypeChip = page.getByRole('button', { name: 'is the parent of' });
    await expect(relationshipTypeChip).toBeVisible();
    await relationshipTypeChip.click();

    await page.waitForFunction(() => window.cy && window.cy.edges().length > 0);
  });

  test('Abu Bakr shows relationship categories in detail panel', async ({ page }) => {
    await page.getByText('Abu Bakr as-Siddiq').first().click();

    await expect(page.getByText('Expand Relationships')).toBeVisible();
    await expect(page.getByText('No relationships found in data.')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Family' })).toBeVisible();
    await expect(page.getByText('Available Expansions')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Expand Children' })).toBeVisible();
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

  test('View switching (Timeline and Political)', async ({ page }) => {
    // Switch to Timeline View
    await page.getByRole('button', { name: 'Timeline View' }).click();
    await expect(page.getByRole('heading', { name: 'Timeline View' })).toBeVisible();

    // Switch to Political View
    await page.getByRole('button', { name: 'Political View' }).click();
    await expect(page.getByText('City Map')).toBeVisible();
    await expect(page.getByText('Governor Terms')).toBeVisible();

    // Switch back to Graph View
    await page.getByRole('button', { name: 'Graph View' }).click();
    // Wait for the graph to be visible again by checking a node
    await expect(page.getByText('Muhammad (PBUH)')).toBeVisible();
  });

  test('Language switching updates UI and direction', async ({ page }) => {
    // Open language selector
    await page.getByLabel('Language').click();
    // Select Arabic
    await page.getByRole('option', { name: 'العربية' }).click();

    // Verify RTL layout direction on the main container
    const mainBox = page.locator('div[dir="rtl"]');
    await expect(mainBox.first()).toBeVisible();

    // Verify translated text
    await expect(page.getByText('رسم بياني للصحابة')).toBeVisible();
    await expect(page.getByPlaceholder('البحث عن الصحابة...')).toBeVisible();

    // Switch back to English
    await page.getByRole('combobox', { name: 'اللغة' }).click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(page.getByPlaceholder('Search Sahabah...')).toBeVisible();
  });

  test('Sidebar and Detail Panel toggle', async ({ page }) => {
    // Collapse sidebar
    await page.locator('div').filter({ hasText: /^SahabahGraph$/ }).getByRole('button').click();

    // Now it should be collapsed. Check for expand button which DOES have a title.
    await expect(page.getByTitle('Expand Sidebar')).toBeVisible();

    // Expand sidebar
    await page.getByTitle('Expand Sidebar').click();
    await expect(page.getByText('SahabahGraph')).toBeVisible();

    // Select a node to show detail panel
    await page.getByText('Muhammad (PBUH)').first().click();
    await expect(page.getByText('Expand Relationships')).toBeVisible();

    // Collapse detail panel
    await page.getByTitle('Collapse Details').click();
    await expect(page.getByTitle('Expand Details')).toBeVisible();
    await expect(page.getByText('Expand Relationships')).not.toBeVisible();

    // Expand detail panel
    await page.getByTitle('Expand Details').click();
    await expect(page.getByText('Expand Relationships')).toBeVisible();
  });

  test('Tribe filtering', async ({ page }) => {
    // Open tribe selector
    await page.getByLabel('Tribe').click();
    // Select 'Quraish' (matched from sahabah_data.json)
    await page.getByRole('option', { name: 'Quraish' }).click();

    // Verify some Sahabi from Quraish is visible (Abu Bakr is Quraish)
    await expect(page.getByText('Abu Bakr as-Siddiq').first()).toBeVisible();

    // Select another tribe where Abu Bakr is NOT in (if possible, but let's just check 'All' works)
    await page.getByRole('combobox', { name: 'Tribe' }).click();
    await page.getByRole('option', { name: 'All Tribes' }).click();
    await expect(page.getByText('Muhammad (PBUH)')).toBeVisible();
  });

  test('Pathfinding (Show Connections)', async ({ page }) => {
    // Add Abu Bakr to graph first to have at least two nodes for selection
    const abuBakrItem = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: /Abu Bakr as-Siddiq/i }) })
      .first();
    await abuBakrItem.getByRole('button', { name: 'Add to Graph' }).click();

    // Select Muhammad (PBUH) in the graph (it should already be there)
    await page.getByText('Muhammad (PBUH)').first().click();

    // Simulate user multi-selection
    await page.evaluate(() => {
      window.cy.$('node[id="0"]').select();
      window.cy.$('node[id="1"]').select();
    });

    // Click Show Connections
    await page.getByLabel('show connections').click();

    // Verify Path Summary appears
    await expect(page.getByText('Path Summary')).toBeVisible();
  });
});
