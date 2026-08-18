import { expect, Page, test } from '@playwright/test';

type ReviewIdentity = {
  role: 'SuperAdmin' | 'Admin' | 'Dispatcher' | 'Encoder' | 'Viewer';
  username: string;
  password: string;
};

const reviewIdentities: ReviewIdentity[] = [
  { role: 'SuperAdmin', username: 'SuperAdmin', password: ['admin', '123'].join('') },
  { role: 'Admin', username: 'CebuAdmin', password: ['admin', '123'].join('') },
  { role: 'Dispatcher', username: 'CebuDispatch', password: ['dispatcher', '123'].join('') },
  { role: 'Encoder', username: 'CebuEncoder', password: ['encoder', '123'].join('') },
  { role: 'Viewer', username: 'CebuViewer', password: ['viewer', '123'].join('') },
];

const signInAt = async (page: Page, identity: Pick<ReviewIdentity, 'username' | 'password'>, path: string) => {
  await page.goto(path);
  await page.getByLabel('Username').fill(identity.username);
  await page.getByLabel('Password').fill(identity.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
};

const navigation = async (page: Page) => {
  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole('button', { name: 'Open workspace navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Workspace navigation drawer' });
    await expect(drawer).toBeVisible();
    return drawer;
  }
  return page.getByRole('complementary', { name: 'Trip Scheduling workspace navigation' });
};

const navigateInApp = async (page: Page, path: string) => {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
};

for (const identity of reviewIdentities) {
  test(`${identity.role} receives the approved navigation model`, async ({ page }) => {
    await signInAt(page, identity, '/trip-scheduling/dashboard');
    await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();

    const nav = await navigation(page);
    await expect(nav.getByRole('button', { name: 'Trip Operations' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Trip Schedule' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Truck Management' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Employee Directory' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Create Trip' })).toHaveCount(identity.role === 'Viewer' ? 0 : 1);
    await expect(nav.getByRole('button', { name: 'Settings' })).toHaveCount(
      identity.role === 'SuperAdmin' || identity.role === 'Admin' ? 1 : 0,
    );
    await expect(nav.getByText('Inventory', { exact: true })).toHaveCount(0);
    await expect(nav.getByText('Billing', { exact: true })).toHaveCount(0);
  });

  test(`${identity.role} receives the approved routed surface matrix`, async ({ page }) => {
    await signInAt(page, identity, '/trip-scheduling/dashboard');
    await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();

    await navigateInApp(page, '/trip-scheduling/trips');
    await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
    if (identity.role === 'Viewer' || identity.role === 'Encoder') {
      await expect(page.getByRole('button', { name: /Edit trip/ })).toHaveCount(0);
    } else {
      await expect(page.getByRole('button', { name: /Edit trip T-CEB-/ }).first()).toBeVisible();
    }

    await navigateInApp(page, '/trip-scheduling/trips/trip-1');
    await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Trip Operations' })).toBeVisible();

    await navigateInApp(page, '/trip-scheduling/trucks');
    await expect(page.getByRole('heading', { name: 'Cargo Fleet Directory' })).toBeVisible();

    await navigateInApp(page, '/trip-scheduling/employees');
    await expect(page.getByRole('heading', { name: 'Personnel Directory' })).toBeVisible();

    await navigateInApp(page, '/trip-scheduling/trips/new');
    if (identity.role === 'Viewer') {
      await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
      await expect(page.locator('#main-content').getByRole('heading', { name: 'Create Trip' })).toHaveCount(0);
    } else {
      await expect(page.getByRole('heading', { name: 'Create Trip' })).toBeVisible();
    }

    await navigateInApp(page, '/trip-scheduling/trips/trip-1/edit');
    if (identity.role === 'Viewer') {
      await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    } else if (identity.role === 'Encoder') {
      await expect(page.locator('#main-content').getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Edit Trip' })).toBeVisible();
    }

    await navigateInApp(page, '/trip-scheduling/settings');
    if (identity.role === 'SuperAdmin' || identity.role === 'Admin') {
      await expect(page.getByRole('heading', { name: 'System Settings & Controls' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'System Settings & Controls' })).toHaveCount(0);
    }
  });
}

test('Viewer can read operational pages but has no mutation presentation', async ({ page }) => {
  await signInAt(page, reviewIdentities[4], '/trip-scheduling/trips');
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
  await expect(page.getByRole('button', { name: /New trip/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Edit trip/ })).toHaveCount(0);

  await navigateInApp(page, '/trip-scheduling/trucks');
  await expect(page.getByRole('heading', { name: 'Cargo Fleet Directory' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add truck' })).toHaveCount(0);

  await navigateInApp(page, '/trip-scheduling/employees');
  await expect(page.getByRole('heading', { name: 'Personnel Directory' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add employee' })).toHaveCount(0);

  await navigateInApp(page, '/trip-scheduling/settings');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  await expect(page.getByText('No protected route content was rendered')).toBeVisible();
});

test('Dispatcher receives operational mutations but not lifecycle or settings controls', async ({ page }) => {
  await signInAt(page, reviewIdentities[2], '/trip-scheduling/trips');
  await expect(page.getByRole('button', { name: /New trip/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Edit trip T-CEB-/ }).first()).toBeVisible();

  await navigateInApp(page, '/trip-scheduling/trucks');
  await expect(page.getByRole('button', { name: 'Add truck' })).toBeVisible();
  await page.getByText('ABC-1234', { exact: true }).first().click();
  await expect(page.getByRole('button', { name: /Specs/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Deactivate/ })).toHaveCount(0);

  await navigateInApp(page, '/trip-scheduling/employees');
  await expect(page.getByRole('button', { name: 'Add employee' })).toHaveCount(0);

  await navigateInApp(page, '/trip-scheduling/settings');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
});

test('Encoder can create and read but can edit only an owned Draft trip', async ({ page }) => {
  await signInAt(page, reviewIdentities[3], '/trip-scheduling/trips');
  await expect(page.getByRole('button', { name: /New trip/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Edit trip/ })).toHaveCount(0);

  await navigateInApp(page, '/trip-scheduling/trips/trip-1/edit');
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  await expect(page.getByLabel('Trip advice code')).toHaveCount(0);

  await navigateInApp(page, '/trip-scheduling/trucks');
  await expect(page.getByRole('button', { name: 'Add truck' })).toHaveCount(0);
  await navigateInApp(page, '/trip-scheduling/employees');
  await expect(page.getByRole('button', { name: 'Add employee' })).toHaveCount(0);
});

test('Admin has read-only settings while SuperAdmin alone receives user and role administration', async ({ page }) => {
  await signInAt(page, reviewIdentities[1], '/trip-scheduling/settings');
  await expect(page.getByRole('heading', { name: 'System Settings & Controls' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Application settings' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Audit log' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Users & roles' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save settings' })).toHaveCount(0);
  await expect(page.getByText('Admin has read-only Settings access.')).toBeVisible();

  await page.reload();
  await signInAt(page, reviewIdentities[0], '/trip-scheduling/settings');
  await expect(page.getByRole('tab', { name: 'Users & roles' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Fixed permission matrix' })).toBeVisible();
  await page.getByRole('tab', { name: 'Application settings' }).click();
  await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible();
});

test('authorized state-blocked lifecycle action remains visible, disabled, and explained', async ({ page }) => {
  await signInAt(page, reviewIdentities[0], '/trip-scheduling/trucks');
  await page.getByText('ABC-1234', { exact: true }).first().click();
  const deactivate = page.getByRole('button', { name: 'Deactivate Truck' });
  await expect(deactivate).toBeVisible();
  await expect(deactivate).toBeDisabled();
  await expect(deactivate).toHaveAttribute('title', 'Deactivation is blocked while assigned to active trip T-CEB-001.');
});

test('SuperAdmin reactivation requires a reason and keeps the vehicle lifecycle non-destructive', async ({ page }) => {
  await signInAt(page, reviewIdentities[0], '/trip-scheduling/trucks');
  await page.getByText('GHI-7890', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Reactivate Unit' }).click();

  const confirmation = page.getByRole('dialog', { name: 'Confirm Vehicle Reactivation' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Confirm reactivation' }).click();
  await expect(confirmation.getByRole('alert')).toContainText('Provide a reason before reactivating this vehicle.');

  await confirmation.getByLabel('Reason').fill('Returned from inspection.');
  await confirmation.getByRole('button', { name: 'Confirm reactivation' }).click();
  await expect(confirmation).toBeHidden();
  await expect(page.getByRole('button', { name: 'Deactivate Truck' })).toBeVisible();
});

test('SuperAdmin employee lifecycle requires a reason and preserves the record', async ({ page }) => {
  await signInAt(page, reviewIdentities[0], '/trip-scheduling/employees');
  await page.getByText('Jane Smith', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Deactivate' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Confirm Employee Deactivation' });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByRole('button', { name: 'Confirm deactivate' })).toBeDisabled();
  await confirmation.getByLabel('Deactivation reason').fill('Temporary leave.');
  await confirmation.getByRole('button', { name: 'Confirm deactivate' }).click();
  await expect(confirmation).toBeHidden();
  await expect(page.getByRole('button', { name: 'Reactivate' })).toBeVisible();
});

test('inactive development identity fails closed without rendering protected content', async ({ page }) => {
  await signInAt(
    page,
    { username: 'InactiveViewer', password: ['viewer', '123'].join('') },
    '/trip-scheduling/dashboard',
  );
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('alert')).toContainText(/inactive/i);
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toHaveCount(0);
});

test('authenticated denial never flashes protected Settings or user content', async ({ page }) => {
  await signInAt(page, reviewIdentities[4], '/trip-scheduling/dashboard');
  await expect(page.getByRole('heading', { name: 'Dispatcher Dashboard' })).toBeVisible();
  await page.evaluate(() => {
    const reviewWindow = window as typeof window & {
      __permissionFlashObserver?: MutationObserver;
      __protectedContentObserved?: boolean;
    };
    reviewWindow.__protectedContentObserved = false;
    reviewWindow.__permissionFlashObserver = new MutationObserver(() => {
      const renderedText = document.body.textContent ?? '';
      if (
        renderedText.includes('System Settings & Controls') ||
        renderedText.includes('Development identity profiles')
      ) {
        reviewWindow.__protectedContentObserved = true;
      }
    });
    reviewWindow.__permissionFlashObserver.observe(document.body, { childList: true, subtree: true });
  });

  await navigateInApp(page, '/trip-scheduling/settings');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  const protectedContentObserved = await page.evaluate(() => {
    const reviewWindow = window as typeof window & {
      __permissionFlashObserver?: MutationObserver;
      __protectedContentObserved?: boolean;
    };
    reviewWindow.__permissionFlashObserver?.disconnect();
    return reviewWindow.__protectedContentObserved;
  });
  expect(protectedContentObserved).toBe(false);
});
