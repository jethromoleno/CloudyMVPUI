import { expect, Page, test } from '@playwright/test';

const identities = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: ['admin', '123'].join('') },
  { role: 'Admin', username: 'CebuAdmin', password: ['admin', '123'].join('') },
  { role: 'Dispatcher', username: 'CebuDispatch', password: ['dispatcher', '123'].join('') },
  { role: 'Encoder', username: 'CebuEncoder', password: ['encoder', '123'].join('') },
  { role: 'Viewer', username: 'CebuViewer', password: ['viewer', '123'].join('') },
] as const;

const capture = async (page: Page, project: string, role: string, name: string) => {
  await page.addStyleTag({
    content: `
      html, body, #root {
        height: auto !important;
        min-height: 100% !important;
        overflow: visible !important;
      }

      #root > div {
        height: auto !important;
        min-height: 100vh !important;
        overflow: visible !important;
      }

      #main-content,
      #main-content > section {
        flex: none !important;
        height: auto !important;
        overflow: visible !important;
      }
    `,
  });
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: `docs/evidence/phase-2a-responsive/${project}/${role.toLowerCase()}-${name}.png`,
  });
};

for (const identity of identities) {
  test(`capture ${identity.role} Trip Operations in both themes`, async ({ page }, testInfo) => {
    await page.goto('/trip-scheduling/trips');
    await page.getByLabel('Username').fill(identity.username);
    await page.getByLabel('Password').fill(identity.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'T-CEB-001' })).toBeVisible();

    if ((page.viewportSize()?.width ?? 1440) < 768) {
      await page.getByRole('button', { name: /^Filters/ }).click();
      await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toBeVisible();
    }
    await capture(page, testInfo.project.name, identity.role, '01-operations-dark');

    await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();
    await capture(page, testInfo.project.name, identity.role, '02-operations-light');
  });
}
