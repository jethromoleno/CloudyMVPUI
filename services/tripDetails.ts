import type {
  Branch,
  Consignee,
  Customer,
  DriverProfile,
  Employee,
  EmployeeRole,
  InternalClientCode,
  LoadType,
  Location,
  Trip,
  TripAssignment,
  TripStatus,
  Truck,
} from '../types';
import type { DataService } from './apiService';
import {
  ServiceError,
  type RequestOptions,
  type TripActivitySection,
  type TripAssignmentHistoryEntry,
  type TripAssignmentRole,
  type TripAssignmentsSection,
  type TripCurrentAssignments,
  type TripDetailFreshness,
  type TripDetailReference,
  type TripDetailRouteSummary,
  type TripDetailsOverview,
  type TripDetailsService,
  type TripDetailStop,
  type TripDetailStopType,
  type TripEventsSection,
  type TripFuelSection,
  type TripQuickDetails,
  type TripStopsSection,
} from './contracts';
import {
  approvedTripLoadTypeLabels,
  approvedTripStatusLabels,
  toTripLoadTypeCode,
  toTripStatusCode,
} from './tripOperations';

interface DetailReferences {
  trips: Trip[];
  branches: Branch[];
  clients: Customer[];
  consignees: Consignee[];
  internalClientCodes: InternalClientCode[];
  locations: Location[];
  loadTypes: LoadType[];
  statuses: TripStatus[];
  employees: Employee[];
  drivers: DriverProfile[];
  trucks: Truck[];
  employeeRoles: EmployeeRole[];
}

const emptyReference = (): TripDetailReference => ({ id: null, label: null, active: null });

const reference = (
  id: string | null | undefined,
  label: string | null | undefined,
  active: boolean | null | undefined,
): TripDetailReference => ({
  id: id ? String(id) : null,
  label: label?.trim() || null,
  active: active ?? null,
});

const throwIfAborted = (options?: RequestOptions) => {
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const optionalString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const optionalNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalizeRole = (role?: EmployeeRole): TripAssignmentRole => {
  const code = String(role?.role_code ?? '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
  if (code === 'DRIVER' || code === 'HELPER') return code;
  return 'UNKNOWN';
};

const stopType = (value: string): { type: TripDetailStopType; label: string } => {
  const normalized = value
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
  if (normalized === 'PICKUP') return { type: 'PICKUP', label: 'Pickup' };
  if (normalized === 'DROP' || normalized === 'DROPOFF' || normalized === 'DROP_OFF') {
    return { type: 'DROPOFF', label: 'Drop-off' };
  }
  return { type: 'OTHER', label: value.trim() || 'Other' };
};

const freshness = (trip: Trip): TripDetailFreshness => ({
  source: 'development-mock',
  fetchedAt: new Date().toISOString(),
  recordUpdatedAt: optionalString(trip.updated_at),
});

const tripNotFound = () =>
  new ServiceError({
    status: 404,
    code: 'TRIP_NOT_FOUND',
    message: 'The requested trip is unavailable or does not exist.',
    kind: 'not_found',
  });

const findEmployee = (references: DetailReferences, id?: string | null) =>
  id
    ? references.employees.find(
        (employee) => String(employee.id) === String(id) || String(employee.employee_id) === String(id),
      )
    : undefined;

const findTruck = (references: DetailReferences, id?: string | null) =>
  id
    ? references.trucks.find((truck) => String(truck.id) === String(id) || String(truck.truck_id) === String(id))
    : undefined;

const employeeReference = (employee?: Employee): TripDetailReference =>
  employee
    ? reference(employee.id, employee.full_name || `${employee.first_name} ${employee.last_name}`, employee.is_active)
    : emptyReference();

const truckReference = (truck?: Truck): TripDetailReference =>
  truck ? reference(truck.id, truck.plate_number ?? truck.license_plate, truck.is_active) : emptyReference();

const locationReference = (location?: Location): TripDetailReference =>
  location ? reference(location.id, location.location_name ?? location.name, location.is_active) : emptyReference();

const sortAssignmentsNewestFirst = (left: TripAssignment, right: TripAssignment) => {
  const leftTime = Date.parse(left.assigned_at || '');
  const rightTime = Date.parse(right.assigned_at || '');
  const normalizedLeft = Number.isNaN(leftTime) ? Number.NEGATIVE_INFINITY : leftTime;
  const normalizedRight = Number.isNaN(rightTime) ? Number.NEGATIVE_INFINITY : rightTime;
  return (
    normalizedRight - normalizedLeft || String(right.id).localeCompare(String(left.id), undefined, { numeric: true })
  );
};

const assignmentRole = (assignment: TripAssignment, references: DetailReferences): TripAssignmentRole =>
  normalizeRole(references.employeeRoles.find((role) => String(role.id) === String(assignment.employee_role_id)));

const projectCurrentAssignments = (
  assignments: TripAssignment[],
  references: DetailReferences,
): TripCurrentAssignments => {
  const current = assignments.filter((assignment) => !assignment.released_at).sort(sortAssignmentsNewestFirst);
  const driverAssignment = current.find((assignment) => assignmentRole(assignment, references) === 'DRIVER');
  const driver = findEmployee(references, driverAssignment?.employee_id);

  const helperIds = new Set<string>();
  const helpers = current
    .filter((assignment) => assignmentRole(assignment, references) === 'HELPER')
    .map((assignment) => findEmployee(references, assignment.employee_id))
    .filter((employee): employee is Employee => Boolean(employee))
    .filter((employee) => {
      const key = String(employee.id);
      if (helperIds.has(key)) return false;
      helperIds.add(key);
      return true;
    })
    .map(employeeReference);

  const truckAssignment = current.find((assignment) => Boolean(assignment.truck_id));
  const truck = findTruck(references, truckAssignment?.truck_id);
  const hasDriver = Boolean(driver);
  const hasTruck = Boolean(truck);
  const state =
    hasDriver && hasTruck
      ? 'assigned'
      : hasDriver || hasTruck || helpers.length > 0
        ? 'partially_assigned'
        : 'unassigned';

  return {
    state,
    driver: employeeReference(driver),
    truck: truckReference(truck),
    helpers,
  };
};

const projectAssignmentHistory = (
  assignments: TripAssignment[],
  references: DetailReferences,
): TripAssignmentHistoryEntry[] => {
  const entries: TripAssignmentHistoryEntry[] = [];
  const currentTruckKeys = new Set<string>();

  for (const assignment of assignments) {
    const raw = asRecord(assignment);
    const assignedByLabel = optionalString(raw.assigned_by_label);
    const releasedByLabel = optionalString(raw.released_by_label);
    const assignedBy = assignedByLabel ? reference(null, assignedByLabel, null) : emptyReference();
    const releasedBy = releasedByLabel ? reference(null, releasedByLabel, null) : emptyReference();
    const assignedAt = optionalString(assignment.assigned_at);
    const releasedAt = optionalString(assignment.released_at);
    const releaseReason = optionalString(raw.release_reason) ?? optionalString(assignment.reason);
    const employee = findEmployee(references, assignment.employee_id);

    if (employee) {
      entries.push({
        id: `${assignment.id}:employee`,
        role: assignmentRole(assignment, references),
        resource: employeeReference(employee),
        assignedAt,
        releasedAt,
        assignedBy,
        releasedBy,
        releaseReason,
        current: !releasedAt,
      });
    }

    const truck = findTruck(references, assignment.truck_id);
    if (truck) {
      const currentTruckKey = releasedAt ? String(assignment.id) : `current:${truck.id}`;
      if (!currentTruckKeys.has(currentTruckKey)) {
        currentTruckKeys.add(currentTruckKey);
        entries.push({
          id: `${assignment.id}:truck`,
          role: 'TRUCK',
          resource: truckReference(truck),
          assignedAt,
          releasedAt,
          assignedBy,
          releasedBy,
          releaseReason,
          current: !releasedAt,
        });
      }
    }
  }

  return entries.sort((left, right) => {
    const leftTime = Date.parse(left.assignedAt || '');
    const rightTime = Date.parse(right.assignedAt || '');
    const normalizedLeft = Number.isNaN(leftTime) ? Number.POSITIVE_INFINITY : leftTime;
    const normalizedRight = Number.isNaN(rightTime) ? Number.POSITIVE_INFINITY : rightTime;
    return normalizedLeft - normalizedRight || left.id.localeCompare(right.id, undefined, { numeric: true });
  });
};

const projectRoute = (items: TripDetailStop[]): TripDetailRouteSummary => ({
  origin: items.length > 0 ? items[0].location : emptyReference(),
  destination: items.length > 0 ? items[items.length - 1].location : emptyReference(),
});

const projectStops = (
  tripId: string,
  stops: Awaited<ReturnType<DataService['getTripStops']>>,
  references: DetailReferences,
): TripDetailStop[] =>
  stops
    .filter((stop) => String(stop.trip_advise_id) === tripId)
    .map((stop) => {
      const location = references.locations.find(
        (candidate) => String(candidate.id ?? candidate.location_id) === String(stop.location_id),
      );
      const normalizedType = stopType(stop.stop_type);
      return {
        id: String(stop.id),
        sequence: stop.stop_sequence,
        type: normalizedType.type,
        typeLabel: normalizedType.label,
        location: locationReference(location),
        locationType: optionalString(location?.location_type),
        address: optionalString(location?.address_line_1),
        province: optionalString(location?.province),
        region: optionalString(location?.region),
        specificAddress: optionalString(stop.specific_address),
        consignee: emptyReference(),
        scheduledAt: optionalString(stop.scheduled_at),
        actualAt: optionalString(stop.actual_at),
      };
    })
    .sort(
      (left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id, undefined, { numeric: true }),
    );

const projectOverview = (
  trip: Trip,
  assignments: TripAssignment[],
  references: DetailReferences,
): TripDetailsOverview => {
  const statusRecord = references.statuses.find((status) => String(status.id) === String(trip.status_id));
  const statusCode = toTripStatusCode(statusRecord?.status_code ?? trip.status ?? trip.status_id);
  const loadTypeRecord = references.loadTypes.find((loadType) => String(loadType.id) === String(trip.load_type_id));
  const loadTypeCode = toTripLoadTypeCode(loadTypeRecord?.load_type_code ?? trip.load_type ?? trip.load_type_id);
  const branch = references.branches.find((candidate) => String(candidate.id) === String(trip.branch_id));
  const encoder = findEmployee(references, trip.encoder_employee_id);
  const client = references.clients.find(
    (candidate) => String(candidate.id) === String(trip.client_id ?? trip.customer_id),
  );
  const internalClientCode = references.internalClientCodes.find(
    (candidate) => String(candidate.id) === String(trip.internal_client_code_id),
  );
  const consignee = references.consignees.find((candidate) => String(candidate.id) === String(trip.consignee_id));
  const sourceTrip = references.trips.find(
    (candidate) => String(candidate.id ?? candidate.trip_id) === String(trip.transfer_from_id),
  );
  const raw = asRecord(trip);

  return {
    id: String(trip.id ?? trip.trip_id),
    tripAdviceCode: String(trip.trip_advise_code ?? trip.trip_code ?? ''),
    status: {
      code: statusCode,
      label: statusCode ? approvedTripStatusLabels[statusCode] : null,
    },
    branch: branch
      ? reference(branch.id, branch.branch_name ?? branch.branch_code, branch.is_active)
      : emptyReference(),
    encoder: employeeReference(encoder),
    client: client ? reference(client.id, client.client_name ?? client.full_name, client.is_active) : emptyReference(),
    internalClientCode: internalClientCode
      ? reference(internalClientCode.id, internalClientCode.code, true)
      : emptyReference(),
    consignee: consignee ? reference(consignee.id, consignee.full_name, consignee.is_active) : emptyReference(),
    loadType: {
      code: loadTypeCode,
      label: loadTypeCode ? approvedTripLoadTypeLabels[loadTypeCode] : null,
    },
    pickupDate: optionalString(trip.pickup_date),
    pickupWindow: optionalString(trip.pickup_time_window),
    plannedStartAt: optionalString(raw.planned_start_at),
    plannedEndAt: optionalString(raw.planned_end_at),
    transfer: {
      isTransfer: trip.is_transfer === true,
      sourceTrip: sourceTrip
        ? reference(sourceTrip.id, sourceTrip.trip_advise_code ?? sourceTrip.trip_code, true)
        : emptyReference(),
    },
    assignments: projectCurrentAssignments(assignments, references),
    createdAt: optionalString(trip.created_at),
    updatedAt: optionalString(trip.updated_at),
    version: optionalNumber(raw.version),
    freshness: freshness(trip),
  };
};

export const createDevelopmentTripDetailsService = (data: DataService): TripDetailsService => {
  const loadReferences = async (): Promise<DetailReferences> => {
    const [
      trips,
      branches,
      clients,
      consignees,
      internalClientCodes,
      locations,
      loadTypes,
      statuses,
      employees,
      drivers,
      trucks,
      employeeRoles,
    ] = await Promise.all([
      data.getTrips(),
      data.getBranches(),
      data.getCustomers(),
      data.getConsignees(undefined, { includeInactive: true }),
      data.getInternalClientCodes(),
      data.getLocations(),
      data.getLoadTypes(),
      data.getTripStatuses(),
      data.getEmployees(),
      data.getDrivers(),
      data.getTrucks(),
      data.getEmployeeRoles(),
    ]);
    return {
      trips,
      branches,
      clients,
      consignees,
      internalClientCodes,
      locations,
      loadTypes,
      statuses,
      employees,
      drivers,
      trucks,
      employeeRoles,
    };
  };

  const loadCore = async (id: string, options?: RequestOptions) => {
    throwIfAborted(options);
    const [trip, references, assignments] = await Promise.all([
      data.getTripById(id),
      loadReferences(),
      data.getTripAssignments(id),
    ]);
    throwIfAborted(options);
    if (!trip) throw tripNotFound();
    return { trip, references, assignments };
  };

  return {
    getQuickDetails: async (id, options): Promise<TripQuickDetails> => {
      const [{ trip, references, assignments }, stops] = await Promise.all([
        loadCore(id, options),
        data.getTripStops(id),
      ]);
      throwIfAborted(options);
      const overview = projectOverview(trip, assignments, references);
      const projectedStops = projectStops(id, stops, references);
      return {
        id: overview.id,
        tripAdviceCode: overview.tripAdviceCode,
        status: overview.status,
        client: overview.client,
        consignee: overview.consignee,
        route: projectRoute(projectedStops),
        pickupDate: overview.pickupDate,
        pickupWindow: overview.pickupWindow,
        assignments: overview.assignments,
        updatedAt: overview.updatedAt,
        freshness: overview.freshness,
      };
    },

    getOverview: async (id, options): Promise<TripDetailsOverview> => {
      const { trip, references, assignments } = await loadCore(id, options);
      return projectOverview(trip, assignments, references);
    },

    getStops: async (id, options): Promise<TripStopsSection> => {
      const [{ trip, references }, stops] = await Promise.all([loadCore(id, options), data.getTripStops(id)]);
      throwIfAborted(options);
      const items = projectStops(id, stops, references);
      return {
        tripId: id,
        items,
        route: projectRoute(items),
        freshness: freshness(trip),
      };
    },

    getAssignments: async (id, options): Promise<TripAssignmentsSection> => {
      const { trip, references, assignments } = await loadCore(id, options);
      return {
        tripId: id,
        current: projectCurrentAssignments(assignments, references),
        history: projectAssignmentHistory(assignments, references),
        freshness: freshness(trip),
      };
    },

    getEvents: async (id, options): Promise<TripEventsSection> => {
      const [{ trip, references }, events] = await Promise.all([loadCore(id, options), data.getTripEvents(id)]);
      throwIfAborted(options);
      const items = events
        .filter((event) => String(event.trip_advise_id) === id)
        .map((event) => ({
          id: String(event.id),
          eventType: event.event_type,
          occurredAt: optionalString(event.event_timestamp),
          recordedBy: employeeReference(findEmployee(references, event.encoder_employee_id)),
          notes: optionalString(event.remarks),
          documentNumber: optionalString(event.document_no),
        }))
        .sort((left, right) => {
          const leftTime = Date.parse(left.occurredAt || '');
          const rightTime = Date.parse(right.occurredAt || '');
          const normalizedLeft = Number.isNaN(leftTime) ? Number.POSITIVE_INFINITY : leftTime;
          const normalizedRight = Number.isNaN(rightTime) ? Number.POSITIVE_INFINITY : rightTime;
          return normalizedLeft - normalizedRight || left.id.localeCompare(right.id, undefined, { numeric: true });
        });
      return { tripId: id, items, freshness: freshness(trip) };
    },

    getFuel: async (id, options): Promise<TripFuelSection> => {
      const [{ trip, references }, fuels] = await Promise.all([loadCore(id, options), data.getFuelLogs()]);
      throwIfAborted(options);
      const items = fuels
        .filter((fuel) => String(fuel.trip_advise_id) === id)
        .map((fuel) => ({
          id: String(fuel.id),
          occurredAt: optionalString(fuel.logged_at),
          quantity: Number.isFinite(fuel.liters) ? fuel.liters : 0,
          unit: 'L' as const,
          unitPrice: null,
          lineCost: Number.isFinite(fuel.total_amount) ? fuel.total_amount : null,
          recordedBy: employeeReference(findEmployee(references, fuel.encoder_employee_id)),
          referenceNumber: optionalString(fuel.fuel_ref_no),
        }))
        .sort((left, right) => {
          const leftTime = Date.parse(left.occurredAt || '');
          const rightTime = Date.parse(right.occurredAt || '');
          const normalizedLeft = Number.isNaN(leftTime) ? Number.POSITIVE_INFINITY : leftTime;
          const normalizedRight = Number.isNaN(rightTime) ? Number.POSITIVE_INFINITY : rightTime;
          return normalizedLeft - normalizedRight || left.id.localeCompare(right.id, undefined, { numeric: true });
        });
      const pricedItems = items.filter((item) => item.lineCost !== null);
      return {
        tripId: id,
        items,
        totals: {
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          unit: 'L',
          cost: pricedItems.length > 0 ? pricedItems.reduce((sum, item) => sum + (item.lineCost ?? 0), 0) : null,
        },
        freshness: freshness(trip),
      };
    },

    getActivity: async (id, options): Promise<TripActivitySection> => {
      const { trip } = await loadCore(id, options);
      return {
        tripId: id,
        supported: false,
        reason:
          'Trip-specific activity is unavailable because the approved development contract supplies no trip-specific audit source.',
        items: [],
        freshness: freshness(trip),
      };
    },
  };
};
