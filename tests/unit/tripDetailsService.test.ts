import { ServiceError, services } from '../../services';
import { createDevelopmentTripDetailsService } from '../../services/tripDetails';

describe('Phase 2B Trip Details service contract', () => {
  it('projects Quick Details from canonical joins and ordered stops', async () => {
    const details = await services.tripDetails.getQuickDetails('trip-1');

    expect(details).toMatchObject({
      id: 'trip-1',
      tripAdviceCode: 'T-CEB-001',
      status: { code: 'IN_PROGRESS', label: 'In Progress' },
      client: { id: 'client-1', label: 'Global Logistics Inc.', active: true },
      consignee: { id: 'cons-2', label: 'Mandaue Retail Center', active: true },
      route: {
        origin: { id: 'loc-1', label: 'Manila Port' },
        destination: { id: 'loc-2', label: 'Cebu Distribution Center' },
      },
      assignments: {
        state: 'assigned',
        driver: { id: 'emp-1', label: 'John Doe' },
        truck: { id: 'truck-1', label: 'ABC-1234' },
      },
      freshness: { source: 'development-mock' },
    });
  });

  it('uses canonical planned fields while refusing legacy assignment aliases and client-based fallbacks', async () => {
    const sourceTrip = await services.data.getTripById('trip-1');
    expect(sourceTrip).toBeDefined();
    const service = createDevelopmentTripDetailsService({
      ...services.data,
      getTripById: vi.fn().mockResolvedValue({
        ...sourceTrip!,
        driver_id: 'emp-5',
        truck_id: 'truck-5',
        helper1_id: 'emp-6',
        scheduled_start_time: '2099-01-01T00:00:00Z',
        consignee_id: 'missing-consignee',
        internal_client_code_id: 'missing-code',
      }),
    });

    const overview = await service.getOverview('trip-1');
    expect(overview.assignments).toMatchObject({
      driver: { label: 'John Doe' },
      truck: { label: 'ABC-1234' },
    });
    expect(overview.plannedStartAt).toBe('2026-06-15T08:00:00+08:00');
    expect(overview.plannedEndAt).toBe('2026-06-15T12:00:00+08:00');
    expect(overview.consignee).toEqual({ id: null, label: null, active: null });
    expect(overview.internalClientCode).toEqual({ id: null, label: null, active: null });
  });

  it('orders stops, assignments, and events deterministically and retains explicit missing values', async () => {
    const [stops, assignments, events] = await Promise.all([
      services.tripDetails.getStops('trip-1'),
      services.tripDetails.getAssignments('trip-1'),
      services.tripDetails.getEvents('trip-1'),
    ]);

    expect(stops.items.map((stop) => stop.sequence)).toEqual([1, 2]);
    expect(stops.route).toMatchObject({
      origin: { label: 'Manila Port' },
      destination: { label: 'Cebu Distribution Center' },
    });
    expect(assignments.current).toMatchObject({
      driver: { label: 'John Doe' },
      truck: { label: 'ABC-1234' },
    });
    expect(assignments.history.every((entry) => entry.assignedBy.label === null)).toBe(true);
    expect(events.items.map((event) => event.occurredAt)).toEqual(
      [...events.items.map((event) => event.occurredAt)].sort(),
    );
  });

  it('preserves returned fuel amounts, exposes liters as L, and never derives unit price', async () => {
    const fuel = await services.tripDetails.getFuel('trip-1');

    expect(fuel.items).toHaveLength(1);
    expect(fuel.items[0]).toMatchObject({
      quantity: 120.5,
      unit: 'L',
      unitPrice: null,
      lineCost: 7200,
      referenceNumber: 'TX-FUEL-883',
    });
    expect(fuel.totals).toEqual({ quantity: 120.5, unit: 'L', cost: 7200 });
  });

  it('returns an explicit unsupported Activity state instead of fabricating audit entries', async () => {
    const activity = await services.tripDetails.getActivity('trip-1');

    expect(activity.supported).toBe(false);
    expect(activity.items).toEqual([]);
    expect(activity.reason).toMatch(/no trip-specific audit source/i);
  });

  it('distinguishes not-found and cancellation without returning protected detail data', async () => {
    const missing = createDevelopmentTripDetailsService({
      ...services.data,
      getTripById: vi.fn().mockResolvedValue(undefined),
    });
    await expect(missing.getOverview('missing')).rejects.toBeInstanceOf(ServiceError);
    await expect(missing.getOverview('missing')).rejects.toMatchObject({ status: 404, kind: 'not_found' });

    const controller = new AbortController();
    controller.abort();
    await expect(services.tripDetails.getOverview('trip-1', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
