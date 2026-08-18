import {
  ServiceError,
  services,
  TRIP_LOAD_TYPE_CODES,
  TRIP_OPERATIONS_ORDERING_VALUES,
  TRIP_STATUS_CODES,
  type TripOperationsQuery,
} from '../../services';
import { createDevelopmentTripOperationsService } from '../../services/tripOperations';

describe('Phase 2A Trip Operations service contract', () => {
  it('publishes the exact canonical status/load catalogs and active lookup boundaries', async () => {
    const lookups = await services.trips.getLookups();

    expect(lookups.statuses.map((option) => option.value)).toEqual(TRIP_STATUS_CODES);
    expect(lookups.loadTypes.map((option) => option.value)).toEqual(TRIP_LOAD_TYPE_CODES);
    expect(lookups.clients.every((option) => option.active)).toBe(true);
    expect(lookups.trucks.every((option) => option.active)).toBe(true);
    expect(lookups.drivers).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'John Doe' })]));
    expect(lookups.source).toBe('development-mock');
  });

  it('excludes Cancelled from the default active queue but exposes it through status and search', async () => {
    const active = await services.trips.list({ limit: 100 });
    expect(active.count).toBe(4);
    expect(active.results.map((row) => row.status.code)).not.toContain('CANCELLED');

    const cancelled = await services.trips.list({ filters: { status: 'CANCELLED' }, limit: 100 });
    expect(cancelled.results).toHaveLength(1);
    expect(cancelled.results[0]).toMatchObject({ id: 'trip-4', tripAdviceCode: 'T-CEB-004' });

    const searched = await services.trips.list({ search: 'T-CEB-004', limit: 100 });
    expect(searched.results).toHaveLength(1);
    expect(searched.results[0].status.code).toBe('CANCELLED');
  });

  it.each([
    ['trip advice code', 'T-CEB-001', 'trip-1'],
    ['plate number', 'ABC-1234', 'trip-1'],
    ['driver name', 'John Doe', 'trip-1'],
    ['client', 'FastTrack Shipping', 'trip-4'],
    ['consignee', 'Toledo Merchant Depot', 'trip-2'],
  ])('searches by %s through the enriched list projection', async (_field, search, expectedId) => {
    const result = await services.trips.list({ search, limit: 100 });
    expect(result.results.map((row) => row.id)).toContain(expectedId);
  });

  it('combines approved filters without component-side joins', async () => {
    const scheduled = await services.trips.list({
      filters: {
        status: 'SCHEDULED',
        clientId: 'client-3',
        branchId: 'branch-2',
        loadType: 'REF',
        truckId: 'truck-4',
        driverId: 'driver-2',
        pickupStart: '2026-06-16',
        pickupEnd: '2026-06-16',
      },
      limit: 100,
    });
    expect(scheduled.results.map((row) => row.id)).toEqual(['trip-2']);

    const transfer = await services.trips.list({
      filters: { transferOnly: true, status: 'RESCUE', loadType: 'DRY' },
      limit: 100,
    });
    expect(transfer.results.map((row) => row.id)).toEqual(['trip-5']);
  });

  it('filters trips missing a driver or truck assignment', async () => {
    const unassignedTrip = {
      ...(await services.data.getTrips()).find((trip) => trip.id === 'trip-2')!,
      id: 'trip-unassigned',
      trip_id: 'trip-unassigned',
      trip_advise_code: 'T-CEB-UNASSIGNED',
      trip_code: 'T-CEB-UNASSIGNED',
      truck_id: undefined,
      driver_id: undefined,
      status_id: 'status-sched',
      status: 'Scheduled',
      is_deleted: false,
    };
    const service = createDevelopmentTripOperationsService({
      ...services.data,
      getTrips: vi.fn().mockResolvedValue([unassignedTrip]),
    });

    const result = await service.list({ filters: { unassignedOnly: true }, limit: 100 });
    expect(result.results.map((row) => row.id)).toEqual(['trip-unassigned']);
    expect(result.results[0]).toMatchObject({
      truck: { id: null },
      driver: { id: null },
    });
  });

  it('returns approved labels, route facts, assignments, and factual unavailability only', async () => {
    const result = await services.trips.list({ search: 'T-CEB-001' });
    expect(result.results[0]).toMatchObject({
      tripAdviceCode: 'T-CEB-001',
      client: { label: 'Global Logistics Inc.', active: true },
      consignee: { label: 'Mandaue Retail Center', active: true },
      route: { originLabel: 'Manila Port', destinationLabel: 'Cebu Distribution Center' },
      truck: { label: 'ABC-1234', active: true },
      driver: { label: 'John Doe', active: true },
      loadType: { code: 'DRY', label: 'Dry' },
      status: { code: 'IN_PROGRESS', label: 'In Progress' },
    });
  });

  it('requests inactive consignee history for row projection while keeping filters active-only', async () => {
    const currentConsignees = await services.data.getConsignees();
    const historicalConsignee = currentConsignees.find((value) => value.id === 'cons-2');
    expect(historicalConsignee).toBeDefined();
    const getConsignees = vi.fn().mockResolvedValue([{ ...historicalConsignee!, is_active: false }]);
    const service = createDevelopmentTripOperationsService({ ...services.data, getConsignees });

    const result = await service.list({ search: 'T-CEB-001' });
    expect(getConsignees).toHaveBeenCalledWith(undefined, { includeInactive: true });
    expect(result.results[0]?.consignee).toMatchObject({
      id: 'cons-2',
      label: 'Mandaue Retail Center',
      active: false,
    });
  });

  it('uses every approved ordering value with deterministic cross-page order', async () => {
    for (const ordering of TRIP_OPERATIONS_ORDERING_VALUES) {
      const query: TripOperationsQuery = { ordering, page: 1, limit: 2 };
      const first = await services.trips.list(query);
      const repeated = await services.trips.list(query);
      expect(repeated.results.map((row) => row.id)).toEqual(first.results.map((row) => row.id));
    }

    const requestedPastEnd = await services.trips.list({ page: 99, limit: 2 });
    expect(requestedPastEnd).toMatchObject({ count: 4, page: 2, limit: 2, next: null, previous: 1 });
    expect(requestedPastEnd.results).toHaveLength(2);
  });

  it('rejects invalid filters, dates, lookups, and ordering with the normalized validation contract', async () => {
    const invalidQueries: TripOperationsQuery[] = [
      { filters: { pickupStart: '2026-06-20', pickupEnd: '2026-06-10' } },
      { filters: { clientId: 'missing-client' } },
      { filters: { status: 'NOT_A_STATUS' as never } },
      { ordering: 'unsupported' as never },
      { page: 0 },
      { page: Number.NaN },
      { limit: 101 },
      { limit: 1.5 },
    ];

    for (const query of invalidQueries) {
      await expect(services.trips.list(query)).rejects.toBeInstanceOf(ServiceError);
      await expect(services.trips.list(query)).rejects.toMatchObject({ status: 400, kind: 'validation' });
    }
  });

  it('honors cancellation before and after the development adapter work boundary', async () => {
    const before = new AbortController();
    before.abort();
    await expect(services.trips.list({}, { signal: before.signal })).rejects.toMatchObject({ name: 'AbortError' });

    const during = new AbortController();
    const request = services.trips.list({ search: 'John' }, { signal: during.signal });
    during.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});
