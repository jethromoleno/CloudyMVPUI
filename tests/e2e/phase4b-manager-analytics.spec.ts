import { expect, test } from '@playwright/test';

const signIn = async (page: import('@playwright/test').Page, username: string, password: string) => {
  await page.goto('/trip-scheduling/dashboard');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
};

test('Admin receives factual manager analytics with no report or alert workflow', async ({ page }) => {
  await signIn(page, 'CebuAdmin', 'admin123');
  await expect(page.getByRole('heading', { name: 'Manager analytics' })).toBeVisible();
  await expect(page.getByText(/not a report or real-time monitor/i)).toBeVisible();
  await expect(page.getByText('Trip status counts')).toBeVisible();
  await expect(page.getByText('Operational Alerts')).toHaveCount(0);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByText(/Updated /)).toBeVisible();
});

test('Dispatcher retains operational dashboard without manager analytics', async ({ page }) => {
  await signIn(page, 'CebuDispatch', 'dispatcher123');
  await expect(page.getByRole('heading', { name: 'Manager analytics' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Active dispatch queue' })).toBeVisible();
});
