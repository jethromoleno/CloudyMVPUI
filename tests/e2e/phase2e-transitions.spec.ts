import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: 'admin123', allowed: true },
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123', allowed: true },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123', allowed: true },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123', allowed: false },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123', allowed: false },
] as const;
const signIn = async (page: Page, username: string, password: string) => {
  await page.goto('/trip-scheduling/trips/trip-1');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Trip transition workflow' })).toBeVisible();
};
for (const identity of identities) {
  test(`${identity.role} receives the correct Phase 2E transition presentation`, async ({ page }) => {
    await signIn(page, identity.username, identity.password);
    const workflow = page.getByRole('region', { name: 'Trip transition workflow' });
    expect(
      (await new AxeBuilder({ page }).include('[aria-label="Trip transition workflow"]').analyze()).violations.filter(
        (item) => ['serious', 'critical'].includes(item.impact ?? ''),
      ),
    ).toEqual([]);
    if (identity.allowed) await expect(workflow.getByRole('button', { name: 'CANCELLED' })).toBeVisible();
    else await expect(workflow.getByRole('heading', { name: 'Status changes unavailable' })).toBeVisible();
  });
}
test('Dispatcher cancels an in-progress trip with a reason and retains the detail route', async ({ page }) => {
  await signIn(page, 'CebuDispatch', 'dispatcher123');
  const workflow = page.getByRole('region', { name: 'Trip transition workflow' });
  await workflow.getByLabel('Reason').fill('Customer cancellation request');
  await workflow.getByRole('button', { name: 'CANCELLED' }).click();
  await expect(workflow.getByRole('alertdialog', { name: 'Confirm trip cancellation' })).toBeVisible();
  await workflow.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(workflow).toContainText('Current status: CANCELLED');
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1$/);
});
