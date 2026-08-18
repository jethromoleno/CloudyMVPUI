import { expect, Page, test } from '@playwright/test';

const signIn = async (page: Page, username = 'CebuDispatch', password = ['dispatcher', '123'].join('')) => {
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
};

test('Quick Details is URL-backed on desktop/tablet and opens as a sheet on mobile', async ({ page }) => {
  await page.goto('/trip-scheduling/trips?search=T-CEB-001&ordering=client&page=1&limit=10');
  await signIn(page);
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();

  const quickAction = page.getByRole('button', { name: 'Open Quick Details for trip T-CEB-001' });
  await quickAction.click();

  if ((page.viewportSize()?.width ?? 1440) < 768) {
    await expect(page).toHaveURL(/quick=trip-1/);
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Quick Details' })).toBeFocused();
    await page.getByRole('button', { name: 'Open Full Details' }).click();
    await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?/);
    await expect(page).not.toHaveURL(/quick=/);
    return;
  }

  await expect(page).toHaveURL(/quick=trip-1/);
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
  const panel = page.getByRole('complementary', { name: 'T-CEB-001' });
  await expect(panel.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
  await expect(panel.getByText('Global Logistics Inc.', { exact: true })).toBeVisible();
  await expect(panel.getByText(/Manila Port → Cebu Distribution Center/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close Quick Details' })).toBeFocused();

  const [panelBox, mainBox] = await Promise.all([
    panel.boundingBox(),
    page.locator('#main-content > div > section').boundingBox(),
  ]);
  expect(panelBox).not.toBeNull();
  expect(mainBox).not.toBeNull();
  expect(panelBox!.width).toBeLessThanOrEqual(420.5);
  expect(mainBox!.width).toBeGreaterThan(300);

  await page.keyboard.press('Escape');
  await expect(page).not.toHaveURL(/quick=/);
  await expect(quickAction).toBeFocused();

  await quickAction.click();
  await page.getByRole('button', { name: 'Open Full Details' }).click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?/);
  await expect(page).not.toHaveURL(/quick=/);
  await expect(page).toHaveURL(/search=T-CEB-001/);
  await expect(page).toHaveURL(/ordering=client/);
});

test('Full Details keeps Overview visible while URL-backed read-only sections load truthfully', async ({ page }) => {
  await page.goto('/trip-scheduling/trips/trip-1?search=T-CEB-001&tab=fuel&ordering=client&page=1&limit=10');
  await signIn(page);

  await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
  await expect(page).toHaveURL(/section=fuel/);
  await expect(page).not.toHaveURL(/tab=/);
  await expect(page.getByRole('heading', { name: 'Trip and client' })).toBeVisible();
  await expect(page.getByText('Global Logistics Inc.', { exact: true })).toBeVisible();
  await expect(page.getByRole('definition').filter({ hasText: '120.50 L' })).toBeVisible();
  await expect(page.getByText('Unavailable', { exact: true }).first()).toBeVisible();

  await page.getByRole('tab', { name: 'Stops' }).click();
  await expect(page).toHaveURL(/section=stops/);
  await expect(page.getByRole('heading', { name: 'Stops and route' })).toBeVisible();
  await expect(page.getByText(/Manila Port → Cebu Distribution Center/)).toBeVisible();
  await expect(page.getByText('1', { exact: true }).first()).toBeVisible();

  await page.getByRole('tab', { name: 'Assignments' }).click();
  await expect(page.getByRole('heading', { name: 'Assignment history' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Trip assignment history' })).toContainText('John Doe');
  await expect(page.getByRole('table', { name: 'Trip assignment history' })).toContainText('ABC-1234');

  await page.getByRole('tab', { name: 'Events' }).click();
  await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
  await expect(page.getByText('Loading Arrival', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Activity' }).click();
  await expect(page).toHaveURL(/section=activity/);
  await expect(page.getByRole('heading', { name: 'Trip activity source unavailable' })).toBeVisible();
  await expect(page.getByText(/no trip-specific audit source/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Trip and client' })).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: /^(Assign driver|Replace driver|Release driver|Cancel trip|Change status|Add event|Edit event|Add fuel|Export)/i,
    }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Back to Trip Operations' }).click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\?/);
  await expect(page).toHaveURL(/search=T-CEB-001/);
  await expect(page).toHaveURL(/ordering=client/);
  await expect(page).not.toHaveURL(/section=/);
});

test('direct selected-section reload reauthenticates and restores the permitted detail address', async ({ page }) => {
  await page.goto('/trip-scheduling/trips/trip-1?section=events');
  await signIn(page, 'CebuViewer', ['viewer', '123'].join(''));
  await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, 'CebuViewer', ['viewer', '123'].join(''));
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?section=events/);
  await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Trip and client' })).toBeVisible();
});
