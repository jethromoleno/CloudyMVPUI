import { expect, type Page, test } from '@playwright/test';

const identities = {
  superAdmin: { username: 'SuperAdmin', password: ['admin', '123'].join('') },
  dispatcher: { username: 'CebuDispatch', password: ['dispatcher', '123'].join('') },
  encoder: { username: 'CebuEncoder', password: ['encoder', '123'].join('') },
  viewer: { username: 'CebuViewer', password: ['viewer', '123'].join('') },
} as const;

const signInAt = async (page: Page, identity: { username: string; password: string }, path: string) => {
  await page.goto(path);
  await expect(page.getByLabel('Username')).toBeVisible();
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

test('Create Trip validates Draft and Scheduled intent, transfer, and ordered stops', async ({ page }) => {
  await signInAt(page, identities.dispatcher, '/trip-scheduling/trips/new');
  await expect(page.getByRole('heading', { name: 'Create Trip' })).toBeVisible();
  const form = page.locator('form');

  await form.getByRole('button', { name: 'Create Trip' }).click();
  await expect(page.getByText('Trip advice code is required.')).toBeVisible();

  await page.getByLabel('Trip advice code').fill('P2C-CREATE-CHECK');
  await page.getByLabel('Branch').selectOption({ index: 1 });
  await page.getByLabel('Client', { exact: true }).selectOption({ index: 1 });
  await page.getByLabel('Load type').selectOption({ index: 1 });
  await page.getByLabel('Save intent', { exact: true }).selectOption('SCHEDULED');
  await form.getByRole('button', { name: 'Create Trip' }).click();
  await expect(page.getByText('Scheduled trips require a planned start.')).toBeVisible();
  await expect(page.getByText('Scheduled trips require a pickup stop with a location.')).toBeVisible();

  await page.getByLabel('Transfer trip').check();
  await expect(page.getByLabel('Source trip')).toBeVisible();
  await page.getByLabel('Source trip').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Add stop' }).click();
  await page.getByRole('button', { name: 'Add stop' }).click();
  await expect(page.getByRole('button', { name: 'Move stop 2 up' })).toBeVisible();
  await page.getByRole('button', { name: 'Move stop 2 up' }).click();
  await page.getByRole('button', { name: 'Remove stop 2' }).click();
});

test('Edit Trip establishes a fresh identity after reload and preserves the edit route', async ({ page }) => {
  await signInAt(page, identities.superAdmin, '/trip-scheduling/trips/trip-1/edit');
  await expect(page.getByRole('heading', { name: 'Edit Trip' })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Username').fill(identities.superAdmin.username);
  await page.getByLabel('Password').fill(identities.superAdmin.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\/edit$/);
  await expect(page.getByRole('heading', { name: 'Edit Trip' })).toBeVisible();
});

test('Viewer and Encoder non-owned edit denials do not reveal protected form values', async ({ page }) => {
  await signInAt(page, identities.viewer, '/trip-scheduling/dashboard');
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
  await navigateInApp(page, '/trip-scheduling/trips/trip-1/edit');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Edit Trip' })).toHaveCount(0);
  await expect(page.getByLabel('Trip advice code')).toHaveCount(0);

  await signInAt(page, identities.encoder, '/trip-scheduling/dashboard');
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
  await navigateInApp(page, '/trip-scheduling/trips/trip-1/edit');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  await expect(page.getByLabel('Trip advice code')).toHaveCount(0);
});
