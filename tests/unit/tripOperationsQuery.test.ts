import {
  DEFAULT_TRIP_OPERATIONS_LIMIT,
  DEFAULT_TRIP_OPERATIONS_ORDERING,
  normalizeTripOperationsParams,
} from '../../components/tripOperationsQuery';
import { services } from '../../services';

describe('Phase 2A Trip Operations URL state', () => {
  it('adds stable defaults without inventing user filters', () => {
    const state = normalizeTripOperationsParams(new URLSearchParams());
    expect(state.query).toMatchObject({
      ordering: DEFAULT_TRIP_OPERATIONS_ORDERING,
      page: 1,
      limit: DEFAULT_TRIP_OPERATIONS_LIMIT,
    });
    expect(state.normalized.toString()).toBe('ordering=-pickup_date&page=1&limit=25');
    expect(state.hasUserFilters).toBe(false);
  });

  it('preserves combinable approved values and removes unsupported query state', async () => {
    const lookups = await services.trips.getLookups();
    const state = normalizeTripOperationsParams(
      new URLSearchParams(
        'search=John&status=IN_PROGRESS&start=2026-06-01&end=2026-06-30&client=client-1&truck=truck-1&driver=driver-1&load=DRY&branch=branch-2&transfer=true&unassigned=true&ordering=client&page=2&limit=10&unknown=unsafe',
      ),
      lookups,
    );

    expect(state.query).toMatchObject({
      search: 'John',
      ordering: 'client',
      page: 2,
      limit: 10,
      filters: {
        status: 'IN_PROGRESS',
        pickupStart: '2026-06-01',
        pickupEnd: '2026-06-30',
        clientId: 'client-1',
        truckId: 'truck-1',
        driverId: 'driver-1',
        loadType: 'DRY',
        branchId: 'branch-2',
        transferOnly: true,
        unassignedOnly: true,
      },
    });
    expect(state.normalized.has('unknown')).toBe(false);
    expect(state.issues.join(' ')).toContain('Unsupported query values were removed');
  });

  it('normalizes invalid page, limit, order, catalog, lookup, boolean, and date values', async () => {
    const lookups = await services.trips.getLookups();
    const state = normalizeTripOperationsParams(
      new URLSearchParams(
        'status=UNKNOWN&start=bad&client=missing&transfer=sometimes&unassigned=sometimes&ordering=wrong&page=-3&limit=101',
      ),
      lookups,
    );

    expect(state.query).toMatchObject({ page: 1, limit: 25, ordering: '-pickup_date' });
    expect(state.query.filters).not.toMatchObject({ status: expect.anything(), clientId: expect.anything() });
    expect(state.issues.length).toBeGreaterThanOrEqual(7);
  });

  it('blocks a reversed valid date range instead of submitting it', () => {
    const state = normalizeTripOperationsParams(new URLSearchParams('start=2026-06-20&end=2026-06-10'));
    expect(state.blockingError).toMatch(/must be on or after/i);
    expect(state.query.filters).toMatchObject({ pickupStart: '2026-06-20', pickupEnd: '2026-06-10' });
  });

  it('preserves Quick Details selection without treating it as a list filter', () => {
    const state = normalizeTripOperationsParams(
      new URLSearchParams('quick=trip-1&search=John&ordering=-pickup_date&page=2&limit=25'),
    );

    expect(state.normalized.get('quick')).toBe('trip-1');
    expect(state.query.search).toBe('John');
    expect(state.query.page).toBe(2);
    expect(state.issues).toEqual([]);
  });
});
