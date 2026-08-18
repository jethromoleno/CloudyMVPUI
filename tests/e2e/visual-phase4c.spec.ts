import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const identities = [
  ['SuperAdmin', 'SuperAdmin', 'admin123'],
  ['Admin', 'CebuAdmin', 'admin123'],
  ['Dispatcher', 'CebuDispatch', 'dispatcher123'],
  ['Encoder', 'CebuEncoder', 'encoder123'],
  ['Viewer', 'CebuViewer', 'viewer123'],
] as const;

for (const [role, username, password] of identities)
  for (const theme of ['light', 'dark'] as const)
    test(`${role} ${theme} operational attention`, async ({ page }, testInfo) => {
      await page.goto('/trip-scheduling/dashboard');
      await page.getByLabel('Username').fill(username);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Operational attention' })).toBeVisible();
      const dark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false;
      if (dark !== (theme === 'dark'))
        await page
          .getByRole('banner')
          .getByRole('button', { name: theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme' })
          .click();
      const directory = resolve(`docs/evidence/phase-4c-responsive/${testInfo.project.name.replace('chromium-', '')}`);
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        animations: 'disabled',
        fullPage: true,
        path: `${directory}/${role.toLowerCase()}-${theme}.png`,
      });
    });
