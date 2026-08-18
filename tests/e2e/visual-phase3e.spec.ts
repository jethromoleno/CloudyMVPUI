import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: 'admin123', settings: true, audit: true },
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123', settings: true, audit: true },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123', settings: false, audit: false },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123', settings: false, audit: false },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123', settings: false, audit: false },
] as const;

for (const identity of identities)
  for (const theme of ['light', 'dark'] as const)
    test(`${identity.role} ${theme} settings and audit boundary`, async ({ page }, testInfo) => {
      await page.goto('/trip-scheduling/settings');
      await page.getByLabel('Username').fill(identity.username);
      await page.getByLabel('Password').fill(identity.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText('Development auth adapter', { exact: false })).toBeHidden();
      await expect(page.getByText('Loading development workspace snapshot', { exact: false })).toBeHidden();

      if (identity.settings) {
        if (identity.role === 'SuperAdmin') await page.getByRole('tab', { name: 'Application settings' }).click();
        await expect(page.getByRole('heading', { name: 'Application settings' })).toBeVisible();
        await expect(page.getByLabel('company name')).toHaveValue(/\S+/);
        await expect(page.getByRole('tab', { name: 'Audit log' })).toHaveCount(identity.audit ? 1 : 0);
      } else {
        await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
      }

      const isDark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false;
      if (isDark !== (theme === 'dark'))
        await page
          .getByRole('banner')
          .getByRole('button', { name: theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme' })
          .click();

      const directory = resolve(`docs/evidence/phase-3e-responsive/${testInfo.project.name.replace('chromium-', '')}`);
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        animations: 'disabled',
        fullPage: true,
        path: `${directory}/${identity.role.toLowerCase()}-${theme}.png`,
      });
    });
