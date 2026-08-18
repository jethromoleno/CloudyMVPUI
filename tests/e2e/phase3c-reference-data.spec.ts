import { expect, test } from '@playwright/test';

const signIn = async (page: import('@playwright/test').Page, username: string, password: string) => {
  await page.goto('/trip-scheduling/reference-data');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
};

test('SuperAdmin manages reference data and keeps inactive values visible', async ({ page }) => {
  await signIn(page, 'SuperAdmin', 'admin123');
  await expect(page.getByRole('heading', { name: 'Customer & Reference Data' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Client' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Client code').fill('P3C-E2E');
  await dialog.getByLabel('Client name').fill('Phase 3C Browser Client');
  await dialog.getByRole('button', { name: 'Save reference data' }).click();
  await expect(page.getByText('Phase 3C Browser Client', { exact: true })).toBeVisible();
  const row = page.getByText('Phase 3C Browser Client', { exact: true }).locator('..').locator('..');
  await row.getByRole('button', { name: 'Deactivate' }).click();
  await expect(row.getByText('Inactive')).toBeVisible();
});

for (const identity of [
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123' },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123' },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123' },
] as const)
  test(`${identity.role} can read reference data without manage controls`, async ({ page }) => {
    await signIn(page, identity.username, identity.password);
    await expect(page.getByRole('heading', { name: 'Customer & Reference Data' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Client/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
