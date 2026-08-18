import { describe, expect, it, vi } from 'vitest';
import { createDevelopmentTripEditorService } from '../../services/tripEditor';
import { developmentDataAdapter, type DataService } from '../../services/apiService';
import type { TripFormValues } from '../../services/contracts';

const validValues: TripFormValues = {
  tripAdviceCode: 'T-CEB-001',
  encoderEmployeeId: 'emp-1',
  branchId: 'branch-1',
  clientId: 'client-1',
  loadTypeCode: 'DRY',
  saveIntent: 'DRAFT',
  plannedStartAt: '',
  plannedEndAt: '',
  isTransfer: false,
  stops: [],
};

describe('trip editor service boundary', () => {
  it('initializes Create with typed lookups and no assignment fields', async () => {
    const service = createDevelopmentTripEditorService(developmentDataAdapter);
    const result = await service.initializeCreate();
    expect(result.mode).toBe('create');
    expect(result.lookups.clients.length).toBeGreaterThan(0);
    expect(result.lookups.locations.length).toBeGreaterThan(0);
    expect(result.values.saveIntent).toBe('DRAFT');
    expect(result.values).not.toHaveProperty('truck_id');
    expect(result.values).not.toHaveProperty('driver_id');
  });

  it('initializes Edit from the route id and orders stops', async () => {
    const service = createDevelopmentTripEditorService(developmentDataAdapter);
    const result = await service.initializeEdit('trip-1');
    expect(result.tripId).toBe('trip-1');
    expect(result.values.stops.map((stop) => stop.sequence)).toEqual([1, 2]);
    expect(result.version).toBe(1);
  });

  it('distinguishes a missing edit record', async () => {
    const service = createDevelopmentTripEditorService(developmentDataAdapter);
    await expect(service.initializeEdit('missing-trip')).rejects.toMatchObject({ code: 'TRIP_NOT_FOUND', status: 404 });
  });

  it('cancels obsolete initialization requests', async () => {
    const service = createDevelopmentTripEditorService(developmentDataAdapter);
    const controller = new AbortController();
    controller.abort();
    await expect(service.initializeCreate({ signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('simulates versioned Edit conflicts without applying partial trip or stop mutations', async () => {
    const updateTrip = vi.fn().mockResolvedValue({ id: 'trip-1' });
    const saveTripStops = vi.fn().mockResolvedValue([]);
    const service = createDevelopmentTripEditorService({ updateTrip, saveTripStops } as unknown as DataService);

    await expect(service.update({ tripId: 'trip-1', version: 1, values: validValues })).resolves.toMatchObject({
      version: 2,
      source: 'development-mock',
    });
    await expect(service.update({ tripId: 'trip-1', version: 1, values: validValues })).rejects.toMatchObject({
      status: 409,
      code: 'STALE_VERSION',
      kind: 'conflict',
    });

    expect(updateTrip).toHaveBeenCalledTimes(1);
    expect(saveTripStops).toHaveBeenCalledTimes(1);
  });
});
