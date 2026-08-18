import type { Customer, Trip } from '../types';
import type { DataService } from './apiService';
import type {
  OperationalAttentionItem,
  OperationalAttentionService,
  OperationalAttentionSnapshot,
  RequestOptions,
} from './contracts';

const REFERENCE_TIME = '2026-06-14T12:00:00+08:00';
const normalize = (value?: string | null) =>
  value
    ?.trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase() ?? '';
const tripStatus = (trip: Trip) => normalize(trip.status ?? trip.status_id);
const isStatus = (trip: Trip, ...statuses: string[]) =>
  [tripStatus(trip), normalize(trip.status_id)].some((value) => statuses.includes(value));
const plannedStart = (trip: Trip) => {
  if (trip.scheduled_start_time) return trip.scheduled_start_time;
  if (!trip.pickup_date) return null;
  return `${trip.pickup_date}T${trip.pickup_time_window?.split('-')[0]?.trim() || '00:00'}:00+08:00`;
};
const clientLabel = (customers: Customer[], trip: Trip) =>
  customers.find((customer) => String(customer.id) === String(trip.client_id || trip.customer_id))?.client_name ??
  'Unassigned client';

export const createDevelopmentOperationalAttentionService = (data: DataService): OperationalAttentionService => ({
  getSnapshot: async (options?: RequestOptions): Promise<OperationalAttentionSnapshot> => {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const [trips, customers] = await Promise.all([data.getTrips(), data.getCustomers()]);
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const asOf = new Date(REFERENCE_TIME);
    const items = trips
      .filter((trip) => !trip.is_deleted && !isStatus(trip, 'COMPLETED', 'CANCELLED', 'TRANSFERRED'))
      .flatMap<OperationalAttentionItem>((trip) => {
        const start = plannedStart(trip);
        const common = {
          id: String(trip.id),
          tripAdviceCode: trip.trip_advise_code || trip.trip_code || String(trip.id),
          clientLabel: clientLabel(customers as Customer[], trip),
          statusLabel: trip.status || trip.status_id || 'Unknown',
          plannedStartAt: start,
        };
        if (isStatus(trip, 'RESCUE', 'BACKLOAD'))
          return [
            {
              ...common,
              kind: 'ACTIVE_EXCEPTION_STATUS' as const,
              factualReason: `Current status is ${common.statusLabel}.`,
            },
          ];
        if (isStatus(trip, 'SCHEDULED') && start && new Date(start) < asOf)
          return [
            {
              ...common,
              kind: 'PLANNED_START_PASSED' as const,
              factualReason: 'Scheduled planned start is before the snapshot time.',
            },
          ];
        return [];
      })
      .sort((left, right) => (left.plannedStartAt ?? '').localeCompare(right.plannedStartAt ?? ''));
    return { source: 'development-mock', asOf: REFERENCE_TIME, refreshedAt: new Date().toISOString(), items };
  },
});
