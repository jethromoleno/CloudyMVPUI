import { expect, test } from '@playwright/test';

const signIn = async (page: import('@playwright/test').Page, username: string, password: string) => {
  await page.goto('/trip-scheduling/dashboard');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Loading development workspace snapshot', { exact: false })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
};

test('Dispatcher can inspect and refresh the factual active dispatch queue', async ({ page }) => {
  await signIn(page, 'CebuDispatch', 'dispatcher123');
  await expect(page.getByRole('heading', { name: 'Active dispatch queue' })).toBeVisible();
  await expect(page.getByText(/Snapshot as of/i)).toBeVisible();
  await expect(page.getByText('Operational Alerts')).toHaveCount(0);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByText(/Updated /)).toBeVisible();
  await page
    .getByRole('row', { name: /^Open trip / })
    .first()
    .click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\//);
  await expect(page.getByRole('heading', { name: 'Trip Details', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
  await page.getByLabel('Search active dispatch queue').fill('no matching dispatch');
  await expect(page.getByText(/No active dispatch trips match/i)).toBeVisible();
});

test('Viewer receives the read-only dashboard presentation', async ({ page }) => {
  await signIn(page, 'CebuViewer', 'viewer123');
  await expect(page.getByText('Operational dashboard read-only snapshot.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeVisible();
});
