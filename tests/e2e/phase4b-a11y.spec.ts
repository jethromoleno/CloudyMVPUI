import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Phase 4B manager analytics has no serious or critical automated accessibility findings', async ({ page }) => {
  await page.goto('/trip-scheduling/dashboard');
  await page.getByLabel('Username').fill('CebuAdmin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Manager analytics' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
});
