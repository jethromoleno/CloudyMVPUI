import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: 'admin123', canAssign: true },
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123', canAssign: true },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123', canAssign: true },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123', canAssign: false },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123', canAssign: false },
] as const;

const seriousOrCritical = (violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) =>
  violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));

const signInAtAssignments = async (page: Page, username: string, password: string) => {
  await page.goto('/trip-scheduling/trips/trip-1?section=assignments');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Assignment history' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Availability and assignment' })).toBeVisible();
};

for (const identity of identities) {
  test(`${identity.role} receives the correct Phase 2D assignment presentation`, async ({ page }) => {
    await signInAtAssignments(page, identity.username, identity.password);
    const workflow = page.getByRole('region', { name: 'Availability and assignment' });
    await expect(workflow.getByRole('heading', { name: 'Availability and assignment' })).toBeVisible();
    expect(
      seriousOrCritical(
        (await new AxeBuilder({ page }).include('[aria-labelledby="assignment-workflow-title"]').analyze()).violations,
      ),
    ).toEqual([]);

    if (identity.canAssign) {
      await expect(workflow.getByRole('button', { name: 'Assign Driver' })).toBeVisible();
      await expect(workflow.getByRole('combobox', { name: 'Driver', exact: true })).toBeEnabled();
    } else {
      await expect(workflow.getByRole('heading', { name: 'Assignment unavailable' })).toBeVisible();
      await expect(workflow.getByRole('button', { name: /Assign (Driver|Helper|Truck)/ })).toHaveCount(0);
    }
  });
}

test('Dispatcher assigns, replaces, and releases without losing the detail context', async ({ page }) => {
  await signInAtAssignments(page, 'CebuDispatch', 'dispatcher123');
  const workflow = page.getByRole('region', { name: 'Availability and assignment' });

  await workflow.getByRole('combobox', { name: 'Driver', exact: true }).selectOption('driver-2');
  await workflow.getByRole('button', { name: 'Assign Driver' }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirm assign' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(workflow.getByText(/Driver: Mike Ross/)).toBeVisible();

  await workflow.getByRole('combobox', { name: 'Driver', exact: true }).selectOption('driver-3');
  await workflow.getByRole('button', { name: 'Assign Driver' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm replacement' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Confirm replacement' })
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(workflow.getByText(/Driver: Robert Talisay/)).toBeVisible();

  await workflow.getByRole('button', { name: 'Release' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Confirm release' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Confirm release' })
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?section=assignments/);
  await expect(workflow.getByText(/Driver: Robert Talisay \(released\)/)).toBeVisible();
});
