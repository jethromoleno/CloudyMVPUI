import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentDispatcherDashboardService } from '../../services/dispatcherDashboard';

describe('Phase 4A dispatcher dashboard service', () => {
  it('returns a typed factual development snapshot with active dispatch rows', async () => {
    const snapshot = await createDevelopmentDispatcherDashboardService(developmentDataAdapter).getSnapshot();

    expect(snapshot).toMatchObject({ source: 'development-mock', asOf: expect.stringMatching(/^2026-06-14/) });
    expect(snapshot.activeTrips).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          tripAdviceCode: expect.any(String),
          clientLabel: expect.any(String),
          routeLabel: expect.any(String),
        }),
      ]),
    );
    expect(snapshot.truckAvailability.total).toBeGreaterThanOrEqual(snapshot.truckAvailability.available);
    expect(snapshot.driverAvailability.total).toBeGreaterThanOrEqual(snapshot.driverAvailability.available);
  });

  it('keeps terminal trips out of the active dispatcher queue and uses only factual planned-start labels', async () => {
    const snapshot = await createDevelopmentDispatcherDashboardService(developmentDataAdapter).getSnapshot();

    expect(snapshot.activeTrips.some((trip) => /completed|cancelled|transferred/i.test(trip.statusLabel))).toBe(false);
    expect(snapshot.activeTrips.every((trip) => typeof trip.plannedStartPassed === 'boolean')).toBe(true);
  });
});
