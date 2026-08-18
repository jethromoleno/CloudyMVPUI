import { expect, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: 'admin123' },
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123' },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123' },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123' },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123' },
] as const;

for (const identity of identities) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${identity.role} ${theme} assignment workflow visual evidence`, async ({ page }, testInfo) => {
      await page.goto('/trip-scheduling/trips/trip-1?section=assignments');
      await page.getByLabel('Username').fill(identity.username);
      await page.getByLabel('Password').fill(identity.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Availability and assignment' })).toBeVisible();
      if (identity.role === 'Encoder' || identity.role === 'Viewer') {
        await expect(page.getByRole('heading', { name: 'Assignment unavailable' })).toBeVisible();
      } else {
        await expect(page.getByRole('combobox', { name: 'Driver', exact: true })).toBeEnabled();
      }

      const isDark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false;
      if (isDark !== (theme === 'dark')) {
        await page
          .getByRole('button', { name: theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme' })
          .first()
          .click();
      }
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/);
      else await expect(page.locator('html')).not.toHaveClass(/dark/);

      const normalizedProject = testInfo.project.name.replace('chromium-', '');
      await page.screenshot({
        fullPage: true,
        path: `docs/evidence/phase-2d-responsive/${normalizedProject}-${identity.role.toLowerCase()}-${theme}.png`,
      });
    });
  }
}
