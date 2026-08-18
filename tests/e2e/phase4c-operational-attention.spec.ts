import { expect, test } from '@playwright/test';

test('Dispatcher can inspect factual operational attention and open trip details', async ({ page }) => {
  await page.goto('/trip-scheduling/dashboard');
  await page.getByLabel('Username').fill('CebuDispatch');
  await page.getByLabel('Password').fill('dispatcher123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Operational attention' })).toBeVisible();
  await expect(page.getByText(/not a risk score, threshold, notification, or resolution workflow/i)).toBeVisible();
  await page.getByRole('region', { name: 'Operational attention' }).getByRole('button').first().click();
  await expect(page.getByRole('heading', { name: 'Trip Details', exact: true })).toBeVisible();
});
