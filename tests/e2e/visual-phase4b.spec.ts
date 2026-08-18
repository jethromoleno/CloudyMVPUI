import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: 'admin123', manager: true },
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123', manager: true },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123', manager: false },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123', manager: false },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123', manager: false },
] as const;

for (const identity of identities)
  for (const theme of ['light', 'dark'] as const)
    test(`${identity.role} ${theme} manager analytics`, async ({ page }, testInfo) => {
      await page.goto('/trip-scheduling/dashboard');
      await page.getByLabel('Username').fill(identity.username);
      await page.getByLabel('Password').fill(identity.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
      if (identity.manager) await expect(page.getByRole('heading', { name: 'Manager analytics' })).toBeVisible();
      else await expect(page.getByRole('heading', { name: 'Manager analytics' })).toHaveCount(0);
      const dark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false;
      if (dark !== (theme === 'dark'))
        await page
          .getByRole('banner')
          .getByRole('button', { name: theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme' })
          .click();
      const directory = resolve(`docs/evidence/phase-4b-responsive/${testInfo.project.name.replace('chromium-', '')}`);
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        animations: 'disabled',
        fullPage: true,
        path: `${directory}/${identity.role.toLowerCase()}-${theme}.png`,
      });
    });
