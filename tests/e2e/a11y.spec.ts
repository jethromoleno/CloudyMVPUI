import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const seriousOrCritical = (violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) =>
  violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));

const permissionReviewIdentities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: ['admin', '123'].join('') },
  { role: 'Admin', username: 'CebuAdmin', password: ['admin', '123'].join('') },
  { role: 'Dispatcher', username: 'CebuDispatch', password: ['dispatcher', '123'].join('') },
  { role: 'Encoder', username: 'CebuEncoder', password: ['encoder', '123'].join('') },
  { role: 'Viewer', username: 'CebuViewer', password: ['viewer', '123'].join('') },
] as const;

const navigateInApp = async (page: Page, path: string) => {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
};

test('login, hub, routed dashboard, and navigation drawer have no serious or critical automated violations', async ({
  page,
}) => {
  await page.goto('/login');
  expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.getByLabel('Username').fill('SuperAdmin');
  await page.getByLabel('Password').fill(['admin', '123'].join(''));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Cloudy Logistics' })).toBeVisible();
  expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.locator('button').filter({ hasText: 'Trip Scheduling' }).click();
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
  expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole('button', { name: 'Open workspace navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Workspace navigation drawer' });
    const firstDrawerAction = drawer.getByRole('button', { name: 'Return to application hub' });
    await expect(drawer).toBeVisible();
    await expect(firstDrawerAction).toBeFocused();
    expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    await page.keyboard.press('Shift+Tab');
    const lastDrawerAction = drawer.getByRole('button', { name: 'Sign out' });
    await expect(lastDrawerAction).toBeFocused();
    expect(await lastDrawerAction.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    await page.keyboard.press('Tab');
    await expect(firstDrawerAction).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Workspace navigation drawer' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open workspace navigation' })).toBeFocused();
  } else {
    await page.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect(page.getByRole('button', { name: 'Expand navigation' })).toBeVisible();
  }
});

for (const identity of permissionReviewIdentities) {
  test(`${identity.role} filtered navigation and permission state remain accessible`, async ({ page }) => {
    await page.goto('/trip-scheduling/dashboard');
    await page.getByLabel('Username').fill(identity.username);
    await page.getByLabel('Password').fill(identity.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
    expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    if ((page.viewportSize()?.width ?? 1440) < 1024) {
      await page.getByRole('button', { name: 'Open workspace navigation' }).click();
      const drawer = page.getByRole('dialog', { name: 'Workspace navigation drawer' });
      const firstDrawerAction = drawer.getByRole('button', { name: 'Return to application hub' });
      const lastDrawerAction = drawer.getByRole('button', { name: 'Sign out' });
      await expect(firstDrawerAction).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(lastDrawerAction).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Open workspace navigation' })).toBeFocused();
    }

    await navigateInApp(page, '/trip-scheduling/trips');
    await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
    expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    await page.getByLabel('Search trips').focus();
    await expect(page.getByLabel('Search trips')).toBeFocused();
    const firstTripRow = page.getByRole('row', { name: /^Open trip / }).first();
    await firstTripRow.focus();
    await expect(firstTripRow).toBeFocused();

    await firstTripRow.click();
    if ((page.viewportSize()?.width ?? 1440) >= 768) {
      await expect(page.getByRole('button', { name: 'Close Quick Details' })).toBeFocused();
      expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
      await page.getByRole('button', { name: 'Open Full Details' }).click();
    }
    await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
    expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    await navigateInApp(page, '/trip-scheduling/settings');
    if (identity.role === 'SuperAdmin' || identity.role === 'Admin') {
      await expect(page.getByRole('heading', { name: 'System Settings & Controls' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    }
    expect(seriousOrCritical((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
  });
}
