import { expect, Page, test } from '@playwright/test';

const signIn = async (page: Page) => {
  await page.getByLabel('Username').fill('SuperAdmin');
  await page.getByLabel('Password').fill(['admin', '123'].join(''));
  await page.getByRole('button', { name: 'Sign In' }).click();
};

const capture = async (page: Page, projectName: string, name: string) => {
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: `docs/evidence/phase-1b-responsive/${projectName}/${name}.png`,
  });
};

const openNavigationIfCompact = async (page: Page) => {
  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole('button', { name: 'Open workspace navigation' }).click();
    await expect(page.getByRole('dialog', { name: 'Workspace navigation drawer' })).toBeVisible();
  }
};

test('capture Phase 1B routed shell evidence in both themes', async ({ page }, testInfo) => {
  await page.goto('/trip-scheduling/dashboard');
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();

  await capture(page, testInfo.project.name, '01-dashboard-dark');
  await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();
  await capture(page, testInfo.project.name, '02-dashboard-light');

  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await openNavigationIfCompact(page);
    await capture(page, testInfo.project.name, '02a-navigation-drawer-light');
  } else {
    await page.getByRole('button', { name: 'Collapse navigation' }).click();
    await capture(page, testInfo.project.name, '02a-dashboard-collapsed-light');
    await page.getByRole('button', { name: 'Expand navigation' }).click();
  }
  await page.getByRole('button', { name: 'Trip Operations' }).click();
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'T-CEB-001' }).first()).toBeVisible();
  await capture(page, testInfo.project.name, '03-trips-light');

  await page.getByRole('banner').getByRole('button', { name: 'Switch to dark theme' }).click();
  await capture(page, testInfo.project.name, '04-trips-dark');

  await page.getByRole('row').filter({ hasText: 'T-CEB-001' }).first().click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1/);
  await expect(page.getByRole('button', { name: 'Close trip details' })).toBeVisible();
  await capture(page, testInfo.project.name, '05-trip-detail-dark');

  await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();
  await capture(page, testInfo.project.name, '06-trip-detail-light');
});
