import { expect, Page, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: ['admin', '123'].join('') },
  { role: 'Admin', username: 'CebuAdmin', password: ['admin', '123'].join('') },
  { role: 'Dispatcher', username: 'CebuDispatch', password: ['dispatcher', '123'].join('') },
  { role: 'Encoder', username: 'CebuEncoder', password: ['encoder', '123'].join('') },
  { role: 'Viewer', username: 'CebuViewer', password: ['viewer', '123'].join('') },
] as const;

const capture = async (page: Page, project: string, role: string, name: string) => {
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: `docs/evidence/phase-2b-responsive/${project}/${role.toLowerCase()}-${name}.png`,
  });
};

for (const identity of identities) {
  test(`capture ${identity.role} Quick and Full Details in both themes`, async ({ page }, testInfo) => {
    await page.goto('/trip-scheduling/trips?search=T-CEB-001&ordering=client&page=1&limit=10');
    await page.getByLabel('Username').fill(identity.username);
    await page.getByLabel('Password').fill(identity.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();

    await page.getByRole('row', { name: 'Open trip T-CEB-001' }).click();
    const contextualQuick = (page.viewportSize()?.width ?? 1440) >= 768;
    if (contextualQuick) {
      await expect(page.getByRole('button', { name: 'Close Quick Details' })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
    await capture(page, testInfo.project.name, identity.role, '01-quick-action-dark');

    if (contextualQuick) await page.getByRole('button', { name: 'Open Full Details' }).click();
    await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
    await page.getByRole('tab', { name: 'Stops' }).click();
    await expect(page.getByRole('heading', { name: 'Stops and route' })).toBeVisible();
    await capture(page, testInfo.project.name, identity.role, '02-full-stops-dark');

    await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();
    await page.getByRole('tab', { name: 'Activity' }).click();
    await expect(page.getByRole('heading', { name: 'Trip activity source unavailable' })).toBeVisible();
    await capture(page, testInfo.project.name, identity.role, '03-full-activity-light');

    await page.getByRole('button', { name: 'Back to Trip Operations' }).click();
    await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
    await page.getByRole('row', { name: 'Open trip T-CEB-001' }).click();
    if (contextualQuick) {
      await expect(page.getByRole('button', { name: 'Close Quick Details' })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
    await capture(page, testInfo.project.name, identity.role, '04-quick-action-light');
  });
}
