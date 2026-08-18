import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentVehicleService } from '../../services/vehicles';

describe('Phase 3A vehicle service', () => {
  it('uses canonical statuses and requires a reason for lifecycle commands', async () => {
    const service = createDevelopmentVehicleService(developmentDataAdapter);
    const vehicles = await service.list();
    expect(vehicles).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'truck-1', status: 'AVAILABLE' })]));
    await expect(service.deactivate({ vehicleId: 'truck-2', reason: '' })).rejects.toMatchObject({
      code: 'REASON_REQUIRED',
    });
  });

  it('blocks deactivation when the vehicle has an active assignment', async () => {
    const service = createDevelopmentVehicleService(developmentDataAdapter);
    await expect(service.deactivate({ vehicleId: 'truck-1', reason: 'Planned retirement' })).rejects.toMatchObject({
      code: 'ACTIVE_ASSIGNMENT_BLOCKS_DEACTIVATION',
    });
  });

  it('keeps lifecycle non-destructive and accepts only supported maintenance fields', async () => {
    const service = createDevelopmentVehicleService(developmentDataAdapter);
    const reactivated = await service.reactivate({ vehicleId: 'truck-5', reason: 'Returned to service' });
    expect(reactivated).toMatchObject({ id: 'truck-5', active: true, status: 'AVAILABLE' });
    await expect(
      service.addMaintenance({
        vehicleId: 'truck-5',
        type: 'Inspection',
        status: 'OPEN',
        scheduledDate: '2026-07-30',
        notes: 'Pre-trip inspection',
      }),
    ).resolves.toBeUndefined();
  });
});
