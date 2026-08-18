import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: 'admin123', lifecycle: true },
  { role: 'Admin', username: 'CebuAdmin', password: 'admin123', lifecycle: true },
  { role: 'Dispatcher', username: 'CebuDispatch', password: 'dispatcher123', lifecycle: false },
  { role: 'Encoder', username: 'CebuEncoder', password: 'encoder123', lifecycle: false },
  { role: 'Viewer', username: 'CebuViewer', password: 'viewer123', lifecycle: false },
] as const;

for (const identity of identities)
  for (const theme of ['light', 'dark'] as const)
    test(`${identity.role} ${theme} employee management`, async ({ page }, testInfo) => {
      await page.goto('/trip-scheduling/employees');
      await page.getByLabel('Username').fill(identity.username);
      await page.getByLabel('Password').fill(identity.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('heading', { name: 'Personnel Directory' })).toBeVisible();

      const isDark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false;
      if (isDark !== (theme === 'dark'))
        await page
          .getByRole('banner')
          .getByRole('button', { name: theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme' })
          .click();

      await page.getByText('Jane Smith', { exact: true }).first().click();
      await expect(page.getByRole('button', { name: 'Deactivate' })).toHaveCount(identity.lifecycle ? 1 : 0);
      await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(identity.lifecycle ? 1 : 0);

      const directory = resolve(`docs/evidence/phase-3b-responsive/${testInfo.project.name.replace('chromium-', '')}`);
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        animations: 'disabled',
        fullPage: true,
        path: `${directory}/${identity.role.toLowerCase()}-${theme}.png`,
      });
    });
