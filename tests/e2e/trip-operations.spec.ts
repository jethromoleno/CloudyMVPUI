import { expect, Page, test } from '@playwright/test';

const signIn = async (page: Page, username = 'CebuDispatch', password = ['dispatcher', '123'].join('')) => {
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
};

const openFiltersOnCompact = async (page: Page) => {
  const button = page.getByRole('button', { name: /^Filters/ });
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
};

test('default active queue is canonical, bounded, and exposes Cancelled through search and status', async ({
  page,
}) => {
  await page.goto('/trip-scheduling/trips');
  await signIn(page);

  await expect(page).toHaveURL(/ordering=-pickup_date/);
  await expect(page).toHaveURL(/page=1/);
  await expect(page).toHaveURL(/limit=25/);
  await expect(page.getByText('4 records', { exact: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'T-CEB-004' })).toHaveCount(0);
  await expect(page.getByLabel('In Progress: Active').first()).toBeVisible();

  const search = page.getByLabel('Search trips');
  await search.fill('T-CEB-004');
  await expect(page).toHaveURL(/search=T-CEB-004/);
  await expect(page.getByRole('row').filter({ hasText: 'T-CEB-004' })).toBeVisible();
  await expect(page.getByLabel('Cancelled: Stopped')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();

  await openFiltersOnCompact(page);
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('CANCELLED');
  await expect(page).toHaveURL(/status=CANCELLED/);
  await expect(page.getByRole('row').filter({ hasText: 'T-CEB-004' })).toBeVisible();
});

test('search covers plate, driver, client, and consignee with combinable clearable filters', async ({ page }) => {
  await page.goto('/trip-scheduling/trips');
  await signIn(page);
  const search = page.getByLabel('Search trips');

  for (const [term, tripCode] of [
    ['ABC-1234', 'T-CEB-001'],
    ['John Doe', 'T-CEB-001'],
    ['FastTrack Shipping', 'T-CEB-004'],
    ['Toledo Merchant Depot', 'T-CEB-002'],
  ]) {
    await search.fill(term);
    await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(term).replace(/%20/g, '(?:[+]|%20)')}`));
    await expect(page.getByRole('row').filter({ hasText: tripCode }).first()).toBeVisible();
  }

  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await openFiltersOnCompact(page);
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('SCHEDULED');
  await page.getByRole('combobox', { name: 'Client', exact: true }).selectOption('client-3');
  await page.getByRole('combobox', { name: 'Truck', exact: true }).selectOption('truck-4');
  await page.getByRole('combobox', { name: 'Driver', exact: true }).selectOption('driver-2');
  await page.getByRole('combobox', { name: 'Load type', exact: true }).selectOption('REF');
  await page.getByRole('combobox', { name: 'Branch', exact: true }).selectOption('branch-2');
  await page.getByLabel('Pickup start').fill('2026-06-16');
  await page.getByLabel('Pickup end').fill('2026-06-16');

  await expect(page.getByRole('row').filter({ hasText: 'T-CEB-002' })).toBeVisible();
  await expect(page.getByText(/8 active filters/)).toBeVisible();
  await page.getByRole('button', { name: 'Clear Status: Scheduled' }).click();
  await expect(page).not.toHaveURL(/status=/);
  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page).not.toHaveURL(/client=/);
  await expect(page.getByText('Default active operations view')).toBeVisible();

  await page.getByLabel('Unassigned resources').check();
  await expect(page).toHaveURL(/unassigned=true/);
  await page.getByRole('button', { name: 'Clear Unassigned resources' }).click();
  await expect(page).not.toHaveURL(/unassigned=/);
});

test('sorting, page/limit, stable ranges, and invalid query normalization are URL backed', async ({ page }) => {
  await page.goto('/trip-scheduling/trips?ordering=wrong&page=-3&limit=200&transfer=maybe');
  await signIn(page);

  await expect(page.getByText(/unsupported ordering value was reset/i)).toBeVisible();
  await expect(page).toHaveURL(/ordering=-pickup_date/);
  await expect(page).toHaveURL(/page=1/);
  await expect(page).toHaveURL(/limit=25/);

  const tripHeader = page.getByRole('columnheader', { name: /Trip advice/ });
  await tripHeader.getByRole('button').click();
  await expect(page).toHaveURL(/ordering=trip_advise_code/);
  await expect(tripHeader).toHaveAttribute('aria-sort', 'ascending');
  await tripHeader.getByRole('button').click();
  await expect(page).toHaveURL(/ordering=-trip_advise_code/);
  await expect(tripHeader).toHaveAttribute('aria-sort', 'descending');

  await page.evaluate(() => {
    const next = new URL(window.location.href);
    next.searchParams.set('page', '1');
    next.searchParams.set('limit', '2');
    window.history.pushState({}, '', next);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByLabel('Rows per page')).toHaveValue('2');
  await expect(page.getByText('Showing 1-2 of 4 records')).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText('Showing 3-4 of 4 records')).toBeVisible();
  await page.getByLabel('Rows per page').selectOption('10');
  await expect(page).toHaveURL(/page=1/);
  await expect(page).toHaveURL(/limit=10/);
});

test('trip navigation, browser history, refresh, and keyboard activation preserve list context', async ({ page }) => {
  await page.goto('/trip-scheduling/trips?search=T-CEB-001&status=IN_PROGRESS&ordering=client&page=1&limit=10');
  await signIn(page);

  const row = page.getByRole('row', { name: 'Open trip T-CEB-001' });
  await row.focus();
  await page.keyboard.press('Enter');
  const compact = (page.viewportSize()?.width ?? 1440) < 768;

  await expect(page).toHaveURL(/quick=trip-1/);
  if (compact) {
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();
  } else {
    await expect(page).toHaveURL(/\/trip-scheduling\/trips\?/);
    await expect(page.getByRole('complementary', { name: 'T-CEB-001' })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Close Quick Details' })).toBeFocused();

  await page.goBack();
  await expect(page).not.toHaveURL(/quick=/);
  await expect(row).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL(/quick=trip-1/);
  await page.getByRole('button', { name: 'Open Full Details' }).click();

  await expect(page).toHaveURL(/\/trip-scheduling\/trips\/trip-1\?/);
  await expect(page).toHaveURL(/search=T-CEB-001/);
  await expect(page).toHaveURL(/status=IN_PROGRESS/);
  await expect(page).toHaveURL(/ordering=client/);
  await expect(page).toHaveURL(/limit=10/);
  await expect(page.getByRole('heading', { name: 'T-CEB-001' })).toBeVisible();

  await page.getByRole('button', { name: 'Back to Trip Operations' }).click();
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Trip Operations' })).toBeVisible();
  await expect(page.getByLabel('Search trips')).toHaveValue('T-CEB-001');
  await openFiltersOnCompact(page);
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('IN_PROGRESS');

  await page.reload();
  await signIn(page);
  await expect(page.getByLabel('Search trips')).toHaveValue('T-CEB-001');
  await openFiltersOnCompact(page);
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('IN_PROGRESS');
  await expect(page).toHaveURL(/ordering=client/);
  await expect(page).toHaveURL(/page=1/);
  await expect(page).toHaveURL(/limit=10/);

  await page.getByRole('button', { name: 'Refresh Trip Operations' }).click();
  await expect(page.getByRole('button', { name: 'Refresh Trip Operations' })).toBeEnabled();
  await expect(page.getByRole('row', { name: 'Open trip T-CEB-001' })).toBeVisible();
});

test('responsive filter/table behavior does not clip the shell and exposes no later-phase mutations', async ({
  page,
}) => {
  await page.goto('/trip-scheduling/trips');
  await signIn(page, 'CebuViewer', ['viewer', '123'].join(''));

  const compact = (page.viewportSize()?.width ?? 1440) < 768;
  const filterButton = page.getByRole('button', { name: /^Filters/ });
  await expect(filterButton).toBeVisible();
  await expect(filterButton).toHaveAttribute('aria-expanded', 'false');
  await filterButton.click();
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toBeVisible();
  await expect(filterButton).toHaveAttribute('aria-expanded', 'true');
  const filterStrip = page.locator('#trip-operations-filters');
  await expect(filterStrip).toBeVisible();
  expect(await filterStrip.evaluate((element) => getComputedStyle(element).position)).not.toBe('absolute');

  if (compact) {
    await expect(page.getByLabel('Scrollable Trip Operations table')).toBeInViewport();
  }

  await expect(page.getByLabel('Scrollable Trip Operations table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(page.getByRole('button', { name: /New trip/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Edit trip/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Cancel trip|Delete trip|Assign driver|Change status/i })).toHaveCount(
    0,
  );
  const tripRow = page.getByRole('row', { name: 'Open trip T-CEB-001' });
  await expect(tripRow).toBeVisible();
  await tripRow.click();
  await expect(page).toHaveURL(/quick=trip-1/);
});

test('edit actions preserve the approved Driver column behavior at every viewport', async ({ page }) => {
  await page.goto('/trip-scheduling/trips');
  await signIn(page);

  const table = page.getByLabel('Scrollable Trip Operations table');
  const driverHeader = table.getByRole('columnheader', { name: 'Driver', exact: true });
  const actionsHeader = table.getByRole('columnheader', { name: 'Actions', exact: true });
  const editAction = page.getByRole('button', { name: 'Edit trip T-CEB-001' });

  await expect(editAction).toBeVisible();
  await expect(actionsHeader).toBeVisible();

  if (page.viewportSize()?.width !== 1440 || page.viewportSize()?.height !== 900) {
    await expect(driverHeader).toHaveCount(0);
    return;
  }

  const firstRow = table.getByRole('row', { name: 'Open trip T-CEB-001' });
  const driverCell = firstRow.getByRole('cell').filter({ hasText: 'John Doe' });
  const actionsCell = firstRow.getByRole('cell').last();

  await expect(driverHeader).toBeVisible();
  await expect(driverCell).toBeVisible();

  const [driverHeaderBox, actionsHeaderBox, driverCellBox, actionsCellBox] = await Promise.all([
    driverHeader.boundingBox(),
    actionsHeader.boundingBox(),
    driverCell.boundingBox(),
    actionsCell.boundingBox(),
  ]);

  expect(driverHeaderBox).not.toBeNull();
  expect(actionsHeaderBox).not.toBeNull();
  expect(driverCellBox).not.toBeNull();
  expect(actionsCellBox).not.toBeNull();
  expect(driverHeaderBox!.x + driverHeaderBox!.width).toBeLessThanOrEqual(actionsHeaderBox!.x + 0.5);
  expect(driverCellBox!.x + driverCellBox!.width).toBeLessThanOrEqual(actionsCellBox!.x + 0.5);
});
