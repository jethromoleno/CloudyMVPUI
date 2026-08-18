import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Phase 3E settings and audit controls have no serious or critical automated accessibility findings', async ({
  page,
}) => {
  await page.goto('/trip-scheduling/settings');
  await page.getByLabel('Username').fill('SuperAdmin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('tab', { name: 'Application settings' }).click();
  await expect(page.getByRole('heading', { name: 'Application settings' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual(
    [],
  );

  await page.getByRole('tab', { name: 'Audit log' }).click();
  await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible();
  const auditResults = await new AxeBuilder({ page }).analyze();
  expect(
    auditResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')),
  ).toEqual([]);
});
