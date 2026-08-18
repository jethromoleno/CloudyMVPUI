import { expect, test } from '@playwright/test';
const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: 'admin123', allowed: true },
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123', allowed: true },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123', allowed: true },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123', allowed: false },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123', allowed: false },
] as const;
for (const identity of identities)
  for (const theme of ['light', 'dark'] as const)
    test(`${identity.role} ${theme} transition workflow`, async ({ page }, testInfo) => {
      await page.goto('/trip-scheduling/trips/trip-1');
      await page.getByLabel('Username').fill(identity.username);
      await page.getByLabel('Password').fill(identity.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Trip transition workflow' })).toBeVisible();
      const workflow = page.getByRole('region', { name: 'Trip transition workflow' });
      if (identity.allowed) await expect(workflow.getByRole('button', { name: 'CANCELLED' })).toBeVisible();
      else await expect(workflow.getByRole('heading', { name: 'Status changes unavailable' })).toBeVisible();
      await workflow.scrollIntoViewIfNeeded();
      const dark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false;
      if (dark !== (theme === 'dark'))
        await page
          .getByRole('button', { name: theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme' })
          .first()
          .click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `docs/evidence/phase-2e-responsive/${testInfo.project.name.replace('chromium-', '')}-${identity.role.toLowerCase()}-${theme}.png`,
      });
    });
