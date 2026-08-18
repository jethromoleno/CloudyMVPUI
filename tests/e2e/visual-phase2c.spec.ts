import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: ['admin', '123'].join('') },
  { role: 'Admin', username: 'CebuAdmin', password: ['admin', '123'].join('') },
  { role: 'Dispatcher', username: 'CebuDispatch', password: ['dispatcher', '123'].join('') },
  { role: 'Encoder', username: 'CebuEncoder', password: ['encoder', '123'].join('') },
  { role: 'Viewer', username: 'CebuViewer', password: ['viewer', '123'].join('') },
] as const;

const signInAt = async (page: Page, identity: (typeof identities)[number]) => {
  await page.goto('/trip-scheduling/dashboard');
  await page.getByLabel('Username').fill(identity.username);
  await page.getByLabel('Password').fill(identity.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
};

const navigateInApp = async (page: Page, path: string) => {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
};

const capture = async (page: Page, project: string, role: string, surface: string, theme: 'dark' | 'light') => {
  const directory = resolve(`docs/evidence/phase-2c-responsive/${project}`);
  mkdirSync(directory, { recursive: true });
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: `${directory}/${role.toLowerCase()}-${surface}-${theme}.png`,
  });
};

for (const identity of identities) {
  test(`capture ${identity.role} Create and Edit in both themes`, async ({ page }, testInfo) => {
    await signInAt(page, identity);
    await navigateInApp(page, '/trip-scheduling/trips/new');
    const canCreate = identity.role !== 'Viewer';
    if (canCreate)
      await expect(page.locator('#main-content').getByRole('heading', { name: 'Create Trip' })).toBeVisible();
    else await expect(page.locator('#main-content').getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    await capture(page, testInfo.project.name, identity.role, 'create', 'dark');

    await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();
    await capture(page, testInfo.project.name, identity.role, 'create', 'light');

    await signInAt(page, identity);
    await navigateInApp(page, '/trip-scheduling/trips/trip-1/edit');
    const canEdit = identity.role !== 'Viewer' && identity.role !== 'Encoder';
    if (canEdit) await expect(page.locator('#main-content').getByRole('heading', { name: 'Edit Trip' })).toBeVisible();
    else if (identity.role === 'Encoder')
      await expect(page.locator('#main-content').getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    else await expect(page.locator('#main-content').getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    await capture(page, testInfo.project.name, identity.role, 'edit', 'dark');

    await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();
    await capture(page, testInfo.project.name, identity.role, 'edit', 'light');
  });
}

test('capture Dispatcher validation, route-stop, transfer, and discard states', async ({ page }, testInfo) => {
  const dispatcher = identities[2];
  await signInAt(page, dispatcher);
  await navigateInApp(page, '/trip-scheduling/trips/new');
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Create Trip' })).toBeVisible();
  const form = page.locator('form');

  await form.getByRole('button', { name: 'Create Trip' }).click();
  await expect(page.getByText('Trip advice code is required.')).toBeVisible();
  await capture(page, testInfo.project.name, dispatcher.role, 'validation', 'dark');

  await page.getByLabel('Trip advice code').fill('P2C-VISUAL-STATE');
  await page.getByLabel('Branch').selectOption({ index: 1 });
  await page.getByLabel('Client', { exact: true }).selectOption({ index: 1 });
  await page.getByLabel('Load type').selectOption({ index: 1 });
  await page.getByLabel('Transfer trip').check();
  await page.getByLabel('Source trip').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Add stop' }).click();
  await page.getByRole('button', { name: 'Add stop' }).click();
  await expect(page.getByRole('button', { name: 'Move stop 2 up' })).toBeVisible();
  await capture(page, testInfo.project.name, dispatcher.role, 'transfer-stops', 'dark');

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog', { name: 'Discard unsaved changes?' })).toBeVisible();
  await capture(page, testInfo.project.name, dispatcher.role, 'discard-dialog', 'dark');
});
