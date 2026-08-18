import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentTripTransitionService } from '../../services/tripTransitions';
import { createDevelopmentTripAssignmentService } from '../../services/tripAssignments';

describe('Phase 2E development transition contract', () => {
  it('enforces the approved graph, reason requirement, and stale versions', async () => {
    const assignments = createDevelopmentTripAssignmentService(developmentDataAdapter);
    const service = createDevelopmentTripTransitionService(developmentDataAdapter, assignments);
    const initial = await service.getSnapshot('trip-2');
    await expect(
      service.transition({ tripId: 'trip-2', target: 'COMPLETED', expectedVersion: initial.version }),
    ).rejects.toMatchObject({ code: 'INVALID_TRIP_TRANSITION' });
    await expect(
      service.transition({ tripId: 'trip-2', target: 'CANCELLED', expectedVersion: initial.version }),
    ).rejects.toMatchObject({ code: 'TRANSITION_REASON_REQUIRED' });
    const cancelled = await service.transition({
      tripId: 'trip-2',
      target: 'CANCELLED',
      expectedVersion: initial.version,
      reason: 'Customer requested cancellation',
    });
    expect(cancelled.status).toBe('CANCELLED');
    await expect(
      service.transition({ tripId: 'trip-2', target: 'IN_PROGRESS', expectedVersion: initial.version }),
    ).rejects.toMatchObject({ code: 'STALE_RECORD' });
  });
});
