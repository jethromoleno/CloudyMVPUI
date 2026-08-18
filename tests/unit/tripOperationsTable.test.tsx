import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TripOperationsTable } from '../../components/TripOperationsTable';
import { PermissionProvider, createEffectivePermissions } from '../../permissions';
import {
  ServiceError,
  type TripOperationsLookups,
  type TripOperationsPage,
  type TripOperationsQuery,
  type TripOperationsService,
} from '../../services';
import type { SystemUser, UserRoleType } from '../../types';

const row = {
  id: 'trip-1',
  tripAdviceCode: 'T-CEB-001',
  client: { id: 'client-1', label: 'Global Logistics Inc.', active: true },
  consignee: { id: 'cons-2', label: 'Mandaue Retail Center', active: true },
  route: { originLabel: 'Manila Port', destinationLabel: 'Cebu Distribution Center' },
  pickupDate: '2026-06-15',
  pickupWindow: '08:00 AM - 12:00 PM',
  truck: { id: 'truck-1', label: 'ABC-1234', active: true },
  driver: { id: 'driver-1', label: 'John Doe', active: true },
  loadType: { code: 'DRY' as const, label: 'Dry' },
  status: { code: 'IN_PROGRESS' as const, label: 'In Progress' },
  branch: { id: 'branch-2', label: 'Visayas Mandaue Hub', active: true },
  isTransfer: false,
  updatedAt: '2026-07-22T08:00:00Z',
  encoderEmployeeId: 'emp-2',
  isDraft: false,
};

const lookups: TripOperationsLookups = {
  statuses: [
    { value: 'SCHEDULED', label: 'Scheduled', active: true },
    { value: 'IN_PROGRESS', label: 'In Progress', active: true },
    { value: 'CANCELLED', label: 'Cancelled', active: true },
  ],
  loadTypes: [{ value: 'DRY', label: 'Dry', active: true }],
  clients: [{ value: 'client-1', label: 'Global Logistics Inc.', active: true }],
  trucks: [{ value: 'truck-1', label: 'ABC-1234', active: true }],
  drivers: [{ value: 'driver-1', label: 'John Doe', active: true }],
  branches: [{ value: 'branch-2', label: 'Visayas Mandaue Hub', active: true }],
  refreshedAt: '2026-07-22T08:00:00Z',
  source: 'development-mock',
};

const pageResult: TripOperationsPage = {
  count: 1,
  page: 1,
  limit: 25,
  next: null,
  previous: null,
  results: [row],
  refreshedAt: '2026-07-22T08:00:00Z',
  source: 'development-mock',
};

const makeService = (overrides: Partial<TripOperationsService> = {}): TripOperationsService => ({
  list: vi.fn().mockResolvedValue(pageResult),
  getLookups: vi.fn().mockResolvedValue(lookups),
  getById: vi.fn(),
  ...overrides,
});

const identity = (role: UserRoleType): SystemUser => ({
  id: `${role}-user`,
  username: role,
  role,
  roles: [role],
  employee_id: role === 'Encoder' ? 'emp-2' : undefined,
  permissions: ['trip_scheduling'],
  is_active: true,
});

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
};

const renderTable = (
  service: TripOperationsService,
  {
    role = 'Dispatcher',
    initialEntry = '/trip-scheduling/trips',
    onOpenTrip = vi.fn(),
    onEditTrip = vi.fn(),
    onCreateTrip = vi.fn(),
  }: {
    role?: UserRoleType;
    initialEntry?: string;
    onOpenTrip?: ReturnType<typeof vi.fn>;
    onEditTrip?: ReturnType<typeof vi.fn>;
    onCreateTrip?: ReturnType<typeof vi.fn>;
  } = {},
) => {
  const permissions = createEffectivePermissions({
    adapterKind: 'development',
    authStatus: 'authenticated',
    user: identity(role),
  });
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PermissionProvider value={permissions}>
        <TripOperationsTable
          onCreateTrip={onCreateTrip}
          onEditTrip={onEditTrip}
          onOpenTrip={onOpenTrip}
          tripService={service}
        />
        <LocationProbe />
      </PermissionProvider>
    </MemoryRouter>,
  );
  return { onOpenTrip, onEditTrip, onCreateTrip };
};

describe('Phase 2A Trip Operations table', () => {
  it('renders the dense approved fields, canonical status cue, freshness, and normalized defaults', async () => {
    renderTable(makeService());

    expect(screen.getByRole('heading', { name: 'Trip Operations' })).toBeInTheDocument();
    expect(await screen.findByText('T-CEB-001')).toBeInTheDocument();
    expect(screen.getAllByText('Global Logistics Inc.').length).toBeGreaterThan(0);
    expect(screen.getByText(/Manila Port/)).toHaveTextContent('Cebu Distribution Center');
    expect(screen.getByLabelText('In Progress: Active')).toBeInTheDocument();
    expect(screen.getByText('Active operations')).toBeInTheDocument();
    expect(screen.getByText(/Pickup · newest first/)).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toHaveTextContent('ordering=-pickup_date&page=1&limit=25');
  });

  it('preserves returned inactive historical reference labels without making them filter options', async () => {
    const historicalPage: TripOperationsPage = {
      ...pageResult,
      results: [
        {
          ...row,
          client: { id: 'old-client', label: 'Legacy Client', active: false },
          consignee: { id: 'old-consignee', label: 'Legacy Consignee', active: false },
          truck: { id: 'old-truck', label: 'OLD-1000', active: false },
          driver: { id: 'old-driver', label: 'Former Driver', active: false },
        },
      ],
    };
    renderTable(makeService({ list: vi.fn().mockResolvedValue(historicalPage) }));

    expect(await screen.findByText('T-CEB-001')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /^Filters/ }));
    expect(screen.getAllByText('Inactive historical label')).toHaveLength(4);
    expect(screen.getByLabelText('Client').querySelector('option[value="old-client"]')).toBeNull();
    expect(screen.getByLabelText('Truck').querySelector('option[value="old-truck"]')).toBeNull();
    expect(screen.getByLabelText('Driver').querySelector('option[value="old-driver"]')).toBeNull();
  });

  it('opens filters as an inline strip in document flow between chips and the table', async () => {
    renderTable(makeService());
    await screen.findByText('T-CEB-001');
    expect(document.getElementById('trip-operations-filters')).toBeNull();

    await userEvent.setup().click(screen.getByRole('button', { name: /^Filters/ }));

    const strip = document.getElementById('trip-operations-filters');
    expect(strip).toBeTruthy();
    expect(getComputedStyle(strip!).position).not.toBe('absolute');
    expect(screen.getByRole('combobox', { name: 'Status', exact: true })).toBeVisible();
    expect(screen.getByLabelText('Scrollable Trip Operations table')).toBeVisible();
  });

  it('debounces search, combines filters in URL state, clears one filter, and clears all', async () => {
    const user = userEvent.setup();
    renderTable(makeService());
    await screen.findByText('T-CEB-001');

    await user.type(screen.getByLabelText('Search trips'), 'John');
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('search=John'));
    await user.click(screen.getByRole('button', { name: /^Filters/ }));
    await user.selectOptions(screen.getByLabelText('Status'), 'IN_PROGRESS');
    await user.selectOptions(screen.getByLabelText('Client'), 'client-1');
    await waitFor(() => {
      const location = screen.getByTestId('location-search').textContent ?? '';
      expect(location).toContain('status=IN_PROGRESS');
      expect(location).toContain('client=client-1');
      expect(location).toContain('page=1');
    });

    await user.click(screen.getByRole('button', { name: /Clear Status: In Progress/i }));
    await waitFor(() => expect(screen.getByTestId('location-search')).not.toHaveTextContent('status='));
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    await waitFor(() => {
      const location = screen.getByTestId('location-search').textContent ?? '';
      expect(location).not.toContain('search=');
      expect(location).not.toContain('client=');
      expect(location).toContain('ordering=-pickup_date');
      expect(location).toContain('limit=25');
    });
    expect(screen.getByText('Default active operations view')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Unassigned resources'));
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('unassigned=true'));
    await user.click(screen.getByRole('button', { name: /Clear Unassigned resources/i }));
    await waitFor(() => expect(screen.getByTestId('location-search')).not.toHaveTextContent('unassigned='));
  });

  it('does not let a stale page result reset a newer page request', async () => {
    const list = vi.fn(async (query: TripOperationsQuery) => ({
      ...pageResult,
      count: 4,
      page: query.page ?? 1,
      limit: query.limit ?? 2,
      next: query.page === 2 ? null : 2,
      previous: query.page === 2 ? 1 : null,
    }));
    renderTable(makeService({ list }), {
      initialEntry: '/trip-scheduling/trips?ordering=-pickup_date&page=1&limit=2',
    });

    await screen.findByText('Showing 1-2 of 4 records');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('page=2'));
    expect(await screen.findByText('Showing 3-4 of 4 records')).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, limit: 2 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('normalizes invalid URL values with an actionable notice and blocks reversed dates', async () => {
    const service = makeService();
    renderTable(service, {
      initialEntry:
        '/trip-scheduling/trips?ordering=unsafe&page=-1&limit=500&transfer=maybe&start=2026-06-20&end=2026-06-10',
    });

    expect(await screen.findByText(/unsupported ordering value was reset/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trip filters need attention' })).toBeInTheDocument();
    expect(service.list).not.toHaveBeenCalled();
    expect(screen.getByTestId('location-search')).toHaveTextContent('ordering=-pickup_date&page=1&limit=25');
  });

  it('uses centralized role presentation and opens Quick Details from row click', async () => {
    const viewerOpen = vi.fn();
    const viewer = renderTable(makeService(), { role: 'Viewer', onOpenTrip: viewerOpen });
    await screen.findByText('T-CEB-001');
    expect(screen.queryByRole('button', { name: 'New trip' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit trip T-CEB-001' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('row', { name: 'Open trip T-CEB-001' }));
    expect(await screen.findByRole('heading', { name: 'T-CEB-001' })).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toHaveTextContent('quick=trip-1');
    expect(viewer.onOpenTrip).not.toHaveBeenCalled();
  });

  it('closes URL-backed Quick Details with Escape and restores focus to its trigger row', async () => {
    const user = userEvent.setup();
    renderTable(makeService());
    await screen.findByText('T-CEB-001');
    const trigger = screen.getByRole('row', { name: 'Open trip T-CEB-001' });

    await user.click(trigger);
    const close = await screen.findByRole('button', { name: 'Close Quick Details' });
    await waitFor(() => expect(close).toHaveFocus());
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Close Quick Details' })).not.toBeInTheDocument());
    expect(screen.getByTestId('location-search')).not.toHaveTextContent('quick=');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('preserves safe rows on recoverable refresh failure and distinguishes lookup failure', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce(pageResult)
      .mockRejectedValue(
        new ServiceError({
          status: 503,
          code: 'TRIPS_UNAVAILABLE',
          kind: 'unavailable',
          message: 'The development trip service is temporarily unavailable.',
          retryable: true,
        }),
      );
    const service = makeService({
      list,
      getLookups: vi.fn().mockRejectedValue(
        new ServiceError({
          status: 503,
          code: 'LOOKUPS_UNAVAILABLE',
          kind: 'unavailable',
          message: 'Approved lookup options could not be loaded.',
          retryable: true,
        }),
      ),
    });
    renderTable(service);

    expect(await screen.findByText('T-CEB-001')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /^Filters/ }));
    expect(await screen.findByRole('heading', { name: 'Filter options unavailable' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Refresh Trip Operations' }));
    expect(await screen.findByText(/The last safe rows and current URL context remain visible/i)).toBeInTheDocument();
    expect(screen.getByText('T-CEB-001')).toBeInTheDocument();
  });

  it.each([
    ['authentication', 'Authentication required'],
    ['authorization', 'Access restricted'],
    ['unexpected', 'Trip Operations unavailable'],
  ] as const)('renders a distinct %s initial error state without rows', async (kind, heading) => {
    const status = kind === 'authentication' ? 401 : kind === 'authorization' ? 403 : 500;
    const service = makeService({
      list: vi
        .fn()
        .mockRejectedValue(
          new ServiceError({ status, code: `${kind.toUpperCase()}_ERROR`, kind, message: `${kind} failure` }),
        ),
    });
    renderTable(service);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.queryByText('T-CEB-001')).not.toBeInTheDocument();
  });

  it('renders the empty-dataset state without opening a row', async () => {
    const empty: TripOperationsPage = { ...pageResult, count: 0, results: [] };
    const service = makeService({ list: vi.fn().mockResolvedValue(empty) });
    const first = renderTable(service);
    expect(await screen.findByRole('heading', { name: 'No records yet' })).toBeInTheDocument();
    expect(first.onOpenTrip).not.toHaveBeenCalled();
  });

  it('distinguishes no search results and restores the empty-dataset state when filters clear', async () => {
    const empty: TripOperationsPage = { ...pageResult, count: 0, results: [] };
    const service = makeService({ list: vi.fn().mockResolvedValue(empty) });
    renderTable(service, { initialEntry: '/trip-scheduling/trips?search=missing' });

    expect(await screen.findByRole('heading', { name: 'No results found' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(screen.getByTestId('location-search')).not.toHaveTextContent('search='));
    expect(await screen.findByRole('heading', { name: 'No records yet' })).toBeInTheDocument();
  });

  it('aborts obsolete requests and keeps the newest query result', async () => {
    const requests: Array<{ search?: string; resolve: (value: TripOperationsPage) => void; signal?: AbortSignal }> = [];
    const list = vi.fn(
      (query, options) =>
        new Promise<TripOperationsPage>((resolve, reject) => {
          requests.push({ search: query.search, resolve, signal: options?.signal });
          options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    renderTable(makeService({ list }));
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Search trips'), 'John');
    await waitFor(() => expect(requests.some((request) => request.search === 'John')).toBe(true));
    expect(requests.find((request) => request.search === undefined)?.signal?.aborted).toBe(true);

    const newest = requests.filter((request) => request.search === 'John').at(-1);
    await act(async () => newest?.resolve(pageResult));
    expect(await screen.findByText('T-CEB-001')).toBeInTheDocument();
  });

  it('shows New trip for Dispatcher and disables edit on completed and cancelled trips', async () => {
    const completed = {
      ...row,
      id: 'trip-done',
      tripAdviceCode: 'T-CEB-DONE',
      status: { code: 'COMPLETED' as const, label: 'Completed' },
    };
    const cancelled = {
      ...row,
      id: 'trip-cancel',
      tripAdviceCode: 'T-CEB-CANCEL',
      status: { code: 'CANCELLED' as const, label: 'Cancelled' },
    };
    renderTable(
      makeService({
        list: vi.fn().mockResolvedValue({ ...pageResult, count: 3, results: [row, completed, cancelled] }),
      }),
      { role: 'Dispatcher' },
    );
    expect(await screen.findByRole('button', { name: 'New trip' })).toBeEnabled();
    expect(await screen.findByText('T-CEB-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit trip T-CEB-001' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Edit trip T-CEB-DONE' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit trip T-CEB-CANCEL' })).toBeDisabled();
  });

  it('lets Encoder edit an owned Draft and hides edit for a foreign trip', async () => {
    const ownedDraft = {
      ...row,
      id: 'trip-draft',
      tripAdviceCode: 'T-CEB-DRAFT',
      status: { code: 'DRAFT' as const, label: 'Draft' },
      isDraft: true,
      encoderEmployeeId: 'emp-2',
    };
    const foreign = {
      ...row,
      id: 'trip-foreign',
      tripAdviceCode: 'T-CEB-FOREIGN',
      encoderEmployeeId: 'emp-99',
    };
    const completed = {
      ...row,
      id: 'trip-done',
      tripAdviceCode: 'T-CEB-DONE',
      status: { code: 'COMPLETED' as const, label: 'Completed' },
    };
    renderTable(
      makeService({
        list: vi.fn().mockResolvedValue({
          ...pageResult,
          count: 3,
          results: [ownedDraft, foreign, completed],
        }),
      }),
      { role: 'Encoder', onCreateTrip: vi.fn(), onEditTrip: vi.fn() },
    );

    expect(await screen.findByText('T-CEB-DRAFT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New trip' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Edit trip T-CEB-DRAFT' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Edit trip T-CEB-FOREIGN' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit trip T-CEB-DONE' })).toBeDisabled();
  });

  it('waits for lookups before listing lookup-backed URLs and drops unavailable ids', async () => {
    let resolveLookups: ((value: TripOperationsLookups) => void) | undefined;
    const list = vi.fn().mockResolvedValue(pageResult);
    const service = makeService({
      list,
      getLookups: () =>
        new Promise<TripOperationsLookups>((resolve) => {
          resolveLookups = resolve;
        }),
    });
    renderTable(service, { initialEntry: '/trip-scheduling/trips?client=missing' });

    expect(list).not.toHaveBeenCalled();
    await act(async () => {
      resolveLookups?.(lookups);
    });
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(screen.getByTestId('location-search')).not.toHaveTextContent('client=');
    expect(await screen.findByText(/unavailable client filter was removed/i)).toBeInTheDocument();
  });

  it('polls the visible queue every 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const list = vi.fn().mockResolvedValue(pageResult);
    renderTable(makeService({ list }));
    expect(await screen.findByText('T-CEB-001')).toBeInTheDocument();
    const initialCalls = list.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(list.mock.calls.length).toBeGreaterThan(initialCalls);
    vi.useRealTimers();
  });
});
