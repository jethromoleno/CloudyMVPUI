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
    test(`${role} ${theme} responsive shell and trip operations`, async ({ page }, testInfo) => {
      await page.goto('/trip-scheduling/trips');
      await page.getByLabel('Username').fill(username);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();

      const dark = (await page.locator('html').getAttribute('class'))?.includes('dark') ?? false;
      if (dark !== (theme === 'dark'))
        await page
          .getByRole('banner')
          .getByRole('button', { name: theme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme' })
          .click();

      if ((page.viewportSize()?.width ?? 1440) < 1024) {
        await page.getByRole('button', { name: 'Open workspace navigation' }).click();
        await expect(page.getByRole('dialog', { name: 'Workspace navigation drawer' })).toBeVisible();
        await page.keyboard.press('Escape');
      }

      const directory = resolve(`docs/evidence/phase-5a-responsive/${testInfo.project.name.replace('chromium-', '')}`);
      mkdirSync(directory, { recursive: true });
      await page.screenshot({
        animations: 'disabled',
        fullPage: true,
        path: `${directory}/${role.toLowerCase()}-${theme}.png`,
      });
    });
