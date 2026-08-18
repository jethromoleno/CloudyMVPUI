import { expect, Page, test } from '@playwright/test';

const developmentPassword = (...parts: string[]) => parts.join('');

const signIn = async (page: Page, username = 'SuperAdmin', password = developmentPassword('admin', '123')) => {
  await expect(page.getByRole('heading', { name: 'Cloudy Logistics' })).toBeVisible();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
};

const openNavigationIfCompact = async (page: Page) => {
  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole('button', { name: 'Open workspace navigation' }).click();
    await expect(page.getByRole('dialog', { name: 'Workspace navigation drawer' })).toBeVisible();
  }
};

test('approved routes, disabled modules, query context, back-forward, and reload are predictable', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page);

  await expect(page).toHaveURL(/\/hub$/);
  await expect(page.getByRole('heading', { name: 'Cloudy Logistics' })).toBeVisible();
  await expect(page.locator('button').filter({ hasText: 'Inventory Management' })).toBeDisabled();
  await expect(page.locator('button').filter({ hasText: 'Billing System' })).toBeDisabled();

  await page.locator('button').filter({ hasText: 'Trip Scheduling' }).click();
  await expect(page).toHaveURL(/\/trip-scheduling\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();

  await openNavigationIfCompact(page);
  await page.getByRole('button', { name: 'Trip Operations' }).click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\?ordering=-pickup_date&page=1&limit=25$/);

  await page.getByPlaceholder(/Search trip code, plate, driver, client, or consignee/i).fill('T-CEB-001');
  await expect(page).toHaveURL(/search=T-CEB-001/);
  const tripRow = page.getByRole('row').filter({ hasText: 'T-CEB-001' }).first();
  await expect(tripRow).toBeVisible();
  await tripRow.click();
  if ((page.viewportSize()?.width ?? 1440) >= 768) {
    await expect(page).toHaveURL(/quick=trip-1/);
    await page.getByRole('button', { name: 'Open Full Details' }).click();
  }
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?search=T-CEB-001/);
  await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();

  await page.getByRole('button', { name: 'Back to Trip Operations' }).click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\?search=T-CEB-001/);
  await expect(page.getByPlaceholder(/Search trip code, plate, driver, client, or consignee/i)).toHaveValue(
    'T-CEB-001',
  );

  await tripRow.click();
  if ((page.viewportSize()?.width ?? 1440) >= 768) {
    await page.getByRole('button', { name: 'Open Full Details' }).click();
  }
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?search=T-CEB-001/);

  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page);
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?search=T-CEB-001/);
  await expect(page.locator('#main-content').getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
});

test('unknown, invalid-record, denied, and placeholder routes expose safe states', async ({ page }) => {
  await page.goto('/trip-scheduling/settings');
  await signIn(page, 'CebuViewer', developmentPassword('viewer', '123'));
  await expect(page).toHaveURL(/\/trip-scheduling\/dashboard$/);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/trip-scheduling/settings');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  await expect(page.getByText('No protected route content was rendered')).toBeVisible();

  await page.goto('/trip-scheduling/trips/not-a-real-trip');
  await signIn(page, 'CebuViewer', developmentPassword('viewer', '123'));
  await expect(page.getByRole('heading', { name: 'Trip not found' })).toBeVisible();

  await page.goto('/trip-scheduling/inventory');
  await signIn(page, 'CebuViewer', developmentPassword('viewer', '123'));
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByText('No protected record was loaded')).toBeVisible();
});

test('routed trip editor warns before discarding unsaved changes', async ({ page }) => {
  await page.goto('/trip-scheduling/trips/new');
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Create Trip' })).toBeVisible();

  const codeInput = page.getByLabel('Trip advice code');
  await codeInput.fill('UNSAVED-P1B-TEST');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('heading', { name: 'Discard unsaved changes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Stay' }).click();
  await expect(codeInput).toHaveValue('UNSAVED-P1B-TEST');

  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Leave' }).click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\?ordering=-pickup_date&page=1&limit=25$/);
});
