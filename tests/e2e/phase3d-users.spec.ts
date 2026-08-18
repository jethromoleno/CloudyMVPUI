import { expect, test } from '@playwright/test';

const signIn = async (page: import('@playwright/test').Page, username: string, password: string) => {
  await page.goto('/trip-scheduling/settings');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
};

test('SuperAdmin records a pending invitation and requires a lifecycle reason', async ({ page }) => {
  await signIn(page, 'SuperAdmin', 'admin123');
  await expect(page.getByRole('heading', { name: 'Platform user invitations' })).toBeVisible();
  await page.getByRole('button', { name: 'Invite platform user' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Username').fill('P3D Browser Invite');
  await dialog.getByLabel('Invitation email').fill('p3d-browser@example.test');
  await dialog.getByLabel('Effective role').selectOption('Viewer');
  await dialog.getByRole('button', { name: 'Record invitation' }).click();
  const row = page.getByText('P3D Browser Invite', { exact: true }).locator('xpath=ancestor::tr');
  await expect(row.getByText('Invitation pending')).toBeVisible();
  await expect(row.getByRole('button', { name: /Reactivate/ })).toHaveCount(0);

  const adminRow = page.getByText('CebuAdmin', { exact: true }).locator('xpath=ancestor::tr');
  await adminRow.getByRole('button', { name: 'Deactivate CebuAdmin' }).click();
  const lifecycleDialog = page.getByRole('dialog');
  await lifecycleDialog.getByRole('button', { name: 'Deactivate user' }).click();
  await expect(lifecycleDialog.getByText('A deactivation reason is required.')).toBeVisible();
  await lifecycleDialog.getByLabel('Deactivation reason').fill('Browser validation');
  await lifecycleDialog.getByRole('button', { name: 'Deactivate user' }).click();
  await expect(adminRow.getByText('Inactive')).toBeVisible();
  await adminRow.getByRole('button', { name: 'Reactivate CebuAdmin' }).click();
  await page.getByRole('dialog').getByLabel('Reactivation reason').fill('Browser restoration');
  await page.getByRole('dialog').getByRole('button', { name: 'Reactivate user' }).click();
  await expect(adminRow.getByText('Active')).toBeVisible();
});

for (const identity of [
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123' },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123' },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123' },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123' },
] as const)
  test(`${identity.role} has no user invitation or role-management controls`, async ({ page }) => {
    await signIn(page, identity.username, identity.password);
    await expect(page.getByRole('button', { name: /Invite platform user/ })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /Users & roles/ })).toHaveCount(0);
  });
