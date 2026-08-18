import { expect, Page, test } from '@playwright/test';

type ReviewIdentity = {
  role: 'SuperAdmin' | 'Admin' | 'Dispatcher' | 'Encoder' | 'Viewer';
  username: string;
  password: string;
};

const identities: ReviewIdentity[] = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: ['admin', '123'].join('') },
  { role: 'Admin', username: 'CebuAdmin', password: ['admin', '123'].join('') },
  { role: 'Dispatcher', username: 'CebuDispatch', password: ['dispatcher', '123'].join('') },
  { role: 'Encoder', username: 'CebuEncoder', password: ['encoder', '123'].join('') },
  { role: 'Viewer', username: 'CebuViewer', password: ['viewer', '123'].join('') },
];

const signIn = async (page: Page, identity: ReviewIdentity) => {
  await page.getByLabel('Username').fill(identity.username);
  await page.getByLabel('Password').fill(identity.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
};

const navigateInApp = async (page: Page, path: string) => {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
};

const capture = async (page: Page, projectName: string, role: string, name: string) => {
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: `docs/evidence/phase-1c-responsive/${projectName}/${role.toLowerCase()}-${name}.png`,
  });
};

for (const identity of identities) {
  test(`capture ${identity.role} permission presentation in both themes`, async ({ page }, testInfo) => {
    await page.goto('/trip-scheduling/dashboard');
    await signIn(page, identity);
    await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();

    if ((page.viewportSize()?.width ?? 1440) < 1024) {
      await page.getByRole('button', { name: 'Open workspace navigation' }).click();
      await expect(page.getByRole('dialog', { name: 'Workspace navigation drawer' })).toBeVisible();
    }
    await capture(page, testInfo.project.name, identity.role, '01-navigation-dark');
    if ((page.viewportSize()?.width ?? 1440) < 1024) {
      await page.keyboard.press('Escape');
    }

    await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();
    if (identity.role === 'SuperAdmin' || identity.role === 'Admin') {
      await navigateInApp(page, '/trip-scheduling/settings');
      await expect(page.getByRole('heading', { name: 'System Settings & Controls' })).toBeVisible();
    } else {
      await navigateInApp(page, '/trip-scheduling/trips');
      await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
    }
    await capture(page, testInfo.project.name, identity.role, '02-action-surface-light');

    await page.getByRole('banner').getByRole('button', { name: 'Switch to dark theme' }).click();
    if (identity.role === 'SuperAdmin') {
      await page.getByRole('tab', { name: 'Fixed permission matrix' }).click();
      await expect(page.getByRole('region', { name: 'Fixed MVP permission catalog' })).toBeVisible();
    } else if (identity.role === 'Admin') {
      await page.getByRole('tab', { name: 'Audit log' }).click();
      await expect(page.getByRole('region', { name: 'Audit log' })).toBeVisible();
    } else {
      await navigateInApp(page, '/trip-scheduling/settings');
      await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    }
    await capture(page, testInfo.project.name, identity.role, '03-distinction-dark');
  });
}
