import type { Customer, Trip } from '../types';
import type { DataService } from './apiService';
import type { ManagerAnalyticsService, ManagerAnalyticsSnapshot, RequestOptions } from './contracts';

const REFERENCE_TIME = '2026-06-14T12:00:00+08:00';
const normalize = (value?: string | null) =>
  value
    ?.trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase() ?? '';
const status = (trip: Trip) => normalize(trip.status ?? trip.status_id) || 'UNKNOWN';
const dateInRange = (value: string | null | undefined, start: string, end: string) =>
  Boolean(value && value >= start && value <= end);
const labelFor = (customers: Customer[], id?: string) =>
  customers.find((customer) => String(customer.id) === String(id))?.client_name ?? 'Unassigned client';

export const createDevelopmentManagerAnalyticsService = (data: DataService): ManagerAnalyticsService => ({
  getSnapshot: async (options?: RequestOptions): Promise<ManagerAnalyticsSnapshot> => {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const [trips, fuels, customers] = await Promise.all([data.getTrips(), data.getFuelLogs(), data.getCustomers()]);
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const activeTrips = trips.filter((trip) => !trip.is_deleted);
    const currentStart = '2026-06-08';
    const currentEnd = '2026-06-14';
    const previousStart = '2026-06-01';
    const previousEnd = '2026-06-07';
    const completedIn = (start: string, end: string) =>
      activeTrips.filter(
        (trip) => status(trip) === 'COMPLETED' && dateInRange(trip.completion_date ?? trip.updated_at, start, end),
      ).length;
    const statusCounts = [
      ...activeTrips.reduce(
        (counts, trip) => counts.set(status(trip), (counts.get(status(trip)) ?? 0) + 1),
        new Map<string, number>(),
      ),
    ]
      .map(([status, count]) => ({ status, count }))
      .sort((left, right) => right.count - left.count || left.status.localeCompare(right.status));
    const activity = activeTrips.reduce((counts, trip) => {
      const clientLabel = labelFor(customers as Customer[], trip.client_id || trip.customer_id);
      counts.set(clientLabel, (counts.get(clientLabel) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());

    return {
      source: 'development-mock',
      asOf: REFERENCE_TIME,
      refreshedAt: new Date().toISOString(),
      window: { currentStart, currentEnd, previousStart, previousEnd },
      completedTrips: {
        current: completedIn(currentStart, currentEnd),
        previous: completedIn(previousStart, previousEnd),
      },
      fuelTotals: fuels.reduce(
        (total, fuel) => ({
          quantity: total.quantity + Number(fuel.liters || 0),
          unit: 'L',
          cost: total.cost + Number(fuel.total_amount || 0),
        }),
        { quantity: 0, unit: 'L' as const, cost: 0 },
      ),
      statusCounts,
      clientActivity: [...activity]
        .map(([clientLabel, tripCount]) => ({ clientLabel, tripCount }))
        .sort((left, right) => right.tripCount - left.tripCount || left.clientLabel.localeCompare(right.clientLabel))
        .slice(0, 5),
    };
  },
});
