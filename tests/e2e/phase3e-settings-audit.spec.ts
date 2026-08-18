import { expect, test } from '@playwright/test';

const signIn = async (page: import('@playwright/test').Page, username: string, password: string) => {
  await page.goto('/trip-scheduling/settings');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Development auth adapter', { exact: false })).toBeHidden();
  await expect(page.getByText('Loading development workspace snapshot', { exact: false })).toBeHidden();
};

test('SuperAdmin validates a setting update and can inspect its audit event', async ({ page }) => {
  await signIn(page, 'SuperAdmin', 'admin123');
  await page.getByRole('tab', { name: 'Application settings' }).click();
  await expect(page.getByRole('heading', { name: 'Application settings' })).toBeVisible();
  const companyName = page.getByLabel('company name');
  await companyName.fill('');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('company name is required.', { exact: false })).toBeVisible();
  await companyName.fill('Cloudy Phase 3E');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Development settings updated.')).toBeVisible();
  await page.getByRole('tab', { name: 'Audit log' }).click();
  await expect(page.getByText('app_settings')).toBeVisible();
  await page.getByPlaceholder('Action, resource, record, or value').fill('Cloudy Phase 3E');
  await expect(page.getByText('Cloudy Phase 3E')).toBeVisible();
});

test('Admin can read settings and audit history but cannot update settings or manage users', async ({ page }) => {
  await signIn(page, 'CebuAdmin', 'admin123');
  await expect(page.getByRole('heading', { name: 'Application settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save settings' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Users & roles' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Audit log' }).click();
  await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible();
});
