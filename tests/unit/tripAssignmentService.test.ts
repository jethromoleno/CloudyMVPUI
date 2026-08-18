import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentTripAssignmentService } from '../../services/tripAssignments';

const interval = {
  plannedStartAt: '2026-07-24T08:00:00+08:00',
  plannedEndAt: '2026-07-24T12:00:00+08:00',
};

describe('Phase 2D development assignment contract', () => {
  it('permits adjacent half-open truck intervals and retains ordered history on release', async () => {
    const service = createDevelopmentTripAssignmentService(developmentDataAdapter);
    const first = await service.assign({
      tripId: 'phase2d-a',
      role: 'TRUCK',
      resourceId: 'truck-1',
      expectedVersion: 1,
      ...interval,
    });
    expect(first.current).toHaveLength(1);

    await expect(
      service.assign({
        tripId: 'phase2d-b',
        role: 'TRUCK',
        resourceId: 'truck-1',
        expectedVersion: 1,
        plannedStartAt: interval.plannedEndAt,
        plannedEndAt: '2026-07-24T16:00:00+08:00',
      }),
    ).resolves.toMatchObject({ current: [expect.objectContaining({ resourceId: 'truck-1' })] });

    const released = await service.release({
      tripId: 'phase2d-a',
      assignmentId: first.current[0].id,
      expectedVersion: 2,
      reason: 'Development review release',
    });
    expect(released.current).toHaveLength(0);
    expect(released.history[0]).toMatchObject({ current: false, releaseReason: 'Development review release' });
  });

  it('rejects a true overlap without creating a partial assignment and rejects stale versions', async () => {
    const service = createDevelopmentTripAssignmentService(developmentDataAdapter);
    await service.assign({
      tripId: 'phase2d-a',
      role: 'TRUCK',
      resourceId: 'truck-1',
      expectedVersion: 1,
      ...interval,
    });

    await expect(
      service.assign({
        tripId: 'phase2d-b',
        role: 'TRUCK',
        resourceId: 'truck-1',
        expectedVersion: 1,
        plannedStartAt: '2026-07-24T10:00:00+08:00',
        plannedEndAt: '2026-07-24T13:00:00+08:00',
      }),
    ).rejects.toMatchObject({ status: 409, code: 'ASSIGNMENT_CONFLICT' });
    await expect(
      service.getAvailability({
        tripId: 'phase2d-b',
        timezone: 'Asia/Manila',
        plannedStartAt: '2026-07-24T10:00:00+08:00',
        plannedEndAt: '2026-07-24T13:00:00+08:00',
      }),
    ).resolves.toMatchObject({
      trucks: expect.arrayContaining([expect.objectContaining({ id: 'truck-1', state: 'CONFLICT' })]),
    });
    await expect(
      service.assign({ tripId: 'phase2d-a', role: 'TRUCK', resourceId: 'truck-2', expectedVersion: 1, ...interval }),
    ).rejects.toMatchObject({ status: 409, code: 'STALE_ASSIGNMENT_VERSION' });
  });

  it('allows repeatable helpers but rejects duplicates and invalid intervals', async () => {
    const service = createDevelopmentTripAssignmentService(developmentDataAdapter);
    const first = await service.assign({
      tripId: 'phase2d-helpers',
      role: 'HELPER',
      resourceId: 'emp-4',
      expectedVersion: 1,
      ...interval,
    });
    const second = await service.assign({
      tripId: 'phase2d-helpers',
      role: 'HELPER',
      resourceId: 'emp-5',
      expectedVersion: first.version,
      ...interval,
    });
    expect(second.current.filter((item) => item.role === 'HELPER')).toHaveLength(2);
    await expect(
      service.assign({
        tripId: 'phase2d-helpers',
        role: 'HELPER',
        resourceId: 'emp-4',
        expectedVersion: second.version,
        ...interval,
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_HELPER' });
    await expect(
      service.getAvailability({
        tripId: 'phase2d-helpers',
        timezone: 'Asia/Manila',
        plannedStartAt: interval.plannedEndAt,
        plannedEndAt: interval.plannedStartAt,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_ASSIGNMENT_INTERVAL' });
  });

  it('rejects assigning the same employee as driver and helper', async () => {
    const service = createDevelopmentTripAssignmentService(developmentDataAdapter);
    const driver = await service.assign({
      tripId: 'phase2d-role-collision',
      role: 'DRIVER',
      resourceId: 'driver-1',
      expectedVersion: 1,
      ...interval,
    });

    await expect(
      service.assign({
        tripId: 'phase2d-role-collision',
        role: 'HELPER',
        resourceId: 'emp-1',
        expectedVersion: driver.version,
        ...interval,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'EMPLOYEE_ROLE_COLLISION' });
  });

  it('reassigns a truck atomically within the development ledger', async () => {
    const service = createDevelopmentTripAssignmentService(developmentDataAdapter);
    const first = await service.assign({
      tripId: 'phase2d-reassign',
      role: 'TRUCK',
      resourceId: 'truck-1',
      expectedVersion: 1,
      ...interval,
    });

    await expect(
      service.reassign({
        tripId: 'phase2d-reassign',
        assignmentId: first.current[0].id,
        role: 'TRUCK',
        resourceId: 'truck-2',
        expectedVersion: first.version,
        reason: 'Truck replacement',
        ...interval,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_INELIGIBLE' });
    expect(
      (await service.getAvailability({ tripId: 'phase2d-reassign', timezone: 'Asia/Manila', ...interval })).trucks.find(
        (truck) => truck.id === 'truck-1',
      ),
    ).toMatchObject({ state: 'ASSIGNED_TO_TRIP' });

    const replaced = await service.reassign({
      tripId: 'phase2d-reassign',
      assignmentId: first.current[0].id,
      role: 'TRUCK',
      resourceId: 'truck-4',
      expectedVersion: first.version,
      reason: 'Truck replacement',
      ...interval,
    });
    expect(replaced.current).toEqual([expect.objectContaining({ resourceId: 'truck-4', current: true })]);
    expect(replaced.history).toHaveLength(2);
    expect(replaced.history[0]).toMatchObject({
      resourceId: 'truck-1',
      current: false,
      releaseReason: 'Truck replacement',
    });
  });
});
