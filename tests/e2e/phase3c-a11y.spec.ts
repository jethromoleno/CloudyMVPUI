import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Phase 3C reference data has no serious or critical automated accessibility findings', async ({ page }) => {
  await page.goto('/trip-scheduling/reference-data');
  await page.getByLabel('Username').fill('SuperAdmin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Customer & Reference Data' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual(
    [],
  );
});
