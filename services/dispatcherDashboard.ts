import type { Customer, Employee, Location, Trip, Truck } from '../types';
import type { DataService } from './apiService';
import type { DispatcherDashboardService, DispatcherDashboardSnapshot, RequestOptions } from './contracts';

const DEVELOPMENT_REFERENCE_TIME = '2026-06-14T12:00:00+08:00';

const normalize = (value?: string | null) =>
  value
    ?.trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase() ?? '';

const tripStatus = (trip: Trip) => normalize(trip.status ?? trip.status_id);

const isStatus = (trip: Trip, ...statuses: string[]) => {
  const values = [tripStatus(trip), normalize(trip.status_id)];
  return statuses.some((status) => values.includes(status));
};

const isActiveTrip = (trip: Trip) => !trip.is_deleted && !isStatus(trip, 'COMPLETED', 'CANCELLED', 'TRANSFERRED');

const labelFor = <T extends { id: string }>(
  items: T[],
  id: string | null | undefined,
  selector: (item: T) => string,
) => {
  const item = id ? items.find((candidate) => String(candidate.id) === String(id)) : undefined;
  return item ? selector(item) : null;
};

const plannedStart = (trip: Trip) => {
  if (trip.scheduled_start_time) return new Date(trip.scheduled_start_time);
  if (!trip.pickup_date) return null;
  const time = trip.pickup_time_window?.split('-')[0]?.trim() || '00:00';
  const parsed = new Date(`${trip.pickup_date}T${time}:00+08:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const createDevelopmentDispatcherDashboardService = (data: DataService): DispatcherDashboardService => ({
  getSnapshot: async (options?: RequestOptions): Promise<DispatcherDashboardSnapshot> => {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const [trips, trucks, employees, customers, locations, drivers] = await Promise.all([
      data.getTrips(),
      data.getTrucks(),
      data.getEmployees(),
      data.getCustomers(),
      data.getLocations(),
      data.getDrivers(),
    ]);
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const asOf = new Date(DEVELOPMENT_REFERENCE_TIME);
    const asOfDate = DEVELOPMENT_REFERENCE_TIME.slice(0, 10);
    const activeTrips = trips
      .filter(isActiveTrip)
      .sort((a, b) => (plannedStart(a)?.getTime() ?? 0) - (plannedStart(b)?.getTime() ?? 0))
      .map((trip) => {
        const origin = labelFor(locations as Location[], trip.origin_location_id, (location) => location.location_name);
        const destination = labelFor(
          locations as Location[],
          trip.destination_location_id,
          (location) => location.location_name,
        );
        const driverProfile = drivers.find((driver) => String(driver.id) === String(trip.driver_id));
        const driver = driverProfile
          ? labelFor(employees as Employee[], driverProfile.employee_id, (employee) => employee.full_name)
          : labelFor(employees as Employee[], trip.driver_id, (employee) => employee.full_name);
        const start = plannedStart(trip);
        return {
          id: String(trip.id),
          tripAdviceCode: trip.trip_advise_code || trip.trip_code || String(trip.id),
          clientLabel:
            labelFor(customers as Customer[], trip.client_id || trip.customer_id, (customer) => customer.client_name) ??
            'Unassigned client',
          pickupDate: trip.pickup_date || 'Unscheduled',
          pickupWindow: trip.pickup_time_window || null,
          routeLabel: origin && destination ? `${origin} → ${destination}` : 'Route details unavailable',
          truckLabel: labelFor(trucks as Truck[], trip.truck_id, (truck) => truck.plate_number),
          driverLabel: driver,
          statusLabel: trip.status || trip.status_id || 'Unknown',
          plannedStartPassed: Boolean(start && start < asOf && isStatus(trip, 'SCHEDULED')),
        };
      });

    const activeDrivers = new Set(
      trips
        .filter((trip) => isStatus(trip, 'IN_PROGRESS', 'IN_TRANSIT'))
        .map((trip) => String(trip.driver_id))
        .filter(Boolean),
    );
    const driverEmployees = (employees as Employee[]).filter(
      (employee) =>
        !employee.is_deleted && (employee.employee_role_id === 'er-1' || normalize(employee.role) === 'DRIVER'),
    );
    const driverAvailability = driverEmployees.reduce(
      (summary, employee) => {
        const profile = drivers.find((driver) => String(driver.employee_id) === String(employee.id));
        const availability = normalize(profile?.availability_status);
        const employment = normalize(employee.employment_status);
        if (employment === 'ON_LEAVE' || availability === 'ON_LEAVE' || availability === 'LEAVE') summary.onLeave += 1;
        else if (
          !employee.is_active ||
          ['INACTIVE', 'SUSPENDED'].includes(employment) ||
          ['UNAVAILABLE', 'RESTING', 'OFF_DUTY', 'SUSPENDED'].includes(availability)
        )
          summary.unavailable += 1;
        else if (
          activeDrivers.has(String(profile?.id ?? employee.id)) ||
          ['ASSIGNED', 'ON_TRIP'].includes(availability)
        )
          summary.assigned += 1;
        else summary.available += 1;
        summary.total += 1;
        return summary;
      },
      { available: 0, assigned: 0, unavailable: 0, onLeave: 0, total: 0 },
    );

    const truckAvailability = (trucks as Truck[]).reduce(
      (summary, truck) => {
        if (truck.is_deleted) return summary;
        const status = normalize(truck.status ?? truck.truck_status_id);
        if (status === 'AVAILABLE' || status === 'TS_AVAIL') summary.available += 1;
        else if (['IN_USE', 'IN_TRANSIT', 'TS_USE'].includes(status)) summary.inUse += 1;
        else if (status === 'MAINTENANCE' || status === 'TS_MAINT') summary.maintenance += 1;
        else summary.unavailable += 1;
        summary.total += 1;
        return summary;
      },
      { available: 0, inUse: 0, maintenance: 0, unavailable: 0, total: 0 },
    );

    return {
      source: 'development-mock',
      asOf: DEVELOPMENT_REFERENCE_TIME,
      refreshedAt: new Date().toISOString(),
      tripsToday: trips.filter((trip) => !trip.is_deleted && trip.pickup_date === asOfDate).length,
      scheduledTrips: trips.filter((trip) => !trip.is_deleted && isStatus(trip, 'SCHEDULED')).length,
      inProgressTrips: trips.filter((trip) => !trip.is_deleted && isStatus(trip, 'IN_PROGRESS', 'IN_TRANSIT')).length,
      completedThisWeek: trips.filter((trip) => {
        if (trip.is_deleted || !isStatus(trip, 'COMPLETED')) return false;
        const completedAt = new Date(trip.completion_date || trip.updated_at || trip.pickup_date || '');
        const days = (asOf.getTime() - completedAt.getTime()) / 86_400_000;
        return Number.isFinite(days) && days >= 0 && days <= 7;
      }).length,
      activeTrips,
      truckAvailability,
      driverAvailability,
    };
  },
});
