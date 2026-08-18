import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentManagerAnalyticsService } from '../../services/managerAnalytics';

describe('development manager analytics service', () => {
  it('returns a labeled aggregate snapshot with factual summary groups', async () => {
    const snapshot = await createDevelopmentManagerAnalyticsService(developmentDataAdapter).getSnapshot();
    expect(snapshot.source).toBe('development-mock');
    expect(snapshot.window).toEqual({
      currentStart: '2026-06-08',
      currentEnd: '2026-06-14',
      previousStart: '2026-06-01',
      previousEnd: '2026-06-07',
    });
    expect(snapshot.fuelTotals).toMatchObject({ unit: 'L' });
    expect(snapshot.statusCounts.length).toBeGreaterThan(0);
    expect(snapshot.clientActivity.length).toBeGreaterThan(0);
  });

  it('does not include deleted trips in status or client activity aggregates', async () => {
    const snapshot = await createDevelopmentManagerAnalyticsService(developmentDataAdapter).getSnapshot();
    expect(snapshot.statusCounts.reduce((total, item) => total + item.count, 0)).toBeGreaterThanOrEqual(
      snapshot.completedTrips.current,
    );
    expect(snapshot.clientActivity.reduce((total, item) => total + item.tripCount, 0)).toBeGreaterThan(0);
  });
});
