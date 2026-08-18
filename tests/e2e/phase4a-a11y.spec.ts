import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Phase 4A dispatcher dashboard has no serious or critical automated accessibility findings', async ({ page }) => {
  await page.goto('/trip-scheduling/dashboard');
  await page.getByLabel('Username').fill('CebuDispatch');
  await page.getByLabel('Password').fill('dispatcher123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual(
    [],
  );
});
