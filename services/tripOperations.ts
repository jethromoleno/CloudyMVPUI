import type { Branch, Customer, DriverProfile, Employee, LoadType, Location, Trip, TripStatus, Truck } from '../types';
import type { DataService } from './apiService';
import {
  ServiceError,
  TRIP_LOAD_TYPE_CODES,
  TRIP_OPERATIONS_ORDERING_VALUES,
  TRIP_STATUS_CODES,
  type RequestOptions,
  type TripLoadTypeCode,
  type TripOperationsFilters,
  type TripOperationsLookupOption,
  type TripOperationsLookups,
  type TripOperationsOrdering,
  type TripOperationsOrderingField,
  type TripOperationsPage,
  type TripOperationsQuery,
  type TripOperationsReference,
  type TripOperationsRow,
  type TripOperationsService,
  type TripStatusCode,
} from './contracts';

type ReferenceSnapshot = {
  statuses: TripStatus[];
  loadTypes: LoadType[];
  clients: Customer[];
  consignees: Awaited<ReturnType<DataService['getConsignees']>>;
  locations: Location[];
  trucks: Truck[];
  drivers: DriverProfile[];
  employees: Employee[];
  branches: Branch[];
};

export const approvedTripStatusLabels: Readonly<Record<TripStatusCode, string>> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  RESCUE: 'Rescue',
  BACKLOAD: 'Backload',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  TRANSFERRED: 'Transferred',
};

export const approvedTripLoadTypeLabels: Readonly<Record<TripLoadTypeCode, string>> = {
  DRY: 'Dry',
  CHILLED: 'Chilled',
  REF: 'Refrigerated',
  COMBI: 'Combi',
  MIXED: 'Mixed',
};

const statusOrder = new Map(TRIP_STATUS_CODES.map((code, index) => [code, index]));
const orderingAllowlist = new Set<string>(TRIP_OPERATIONS_ORDERING_VALUES);
const filterAllowlist = new Set<keyof TripOperationsFilters>([
  'status',
  'pickupStart',
  'pickupEnd',
  'clientId',
  'truckId',
  'driverId',
  'loadType',
  'branchId',
  'transferOnly',
]);

const throwIfAborted = (options?: RequestOptions) => {
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

const normalizeCode = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s/-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();

const statusAliases: Readonly<Record<string, TripStatusCode>> = {
  STATUS_SCHED: 'SCHEDULED',
  STATUS_INPROGRESS: 'IN_PROGRESS',
  STATUS_COMPLETED: 'COMPLETED',
  STATUS_CANCELLED: 'CANCELLED',
  STATUS_RESCUE: 'RESCUE',
  STATUS_BACKLOAD: 'BACKLOAD',
};

const loadTypeAliases: Readonly<Record<string, TripLoadTypeCode>> = {
  LOAD_DRY: 'DRY',
  LOAD_CHILLED: 'CHILLED',
  LOAD_REF: 'REF',
  LOAD_COMBI: 'COMBI',
  LOAD_MIXED: 'MIXED',
};

export const toTripStatusCode = (value?: string | null): TripStatusCode | null => {
  const normalized = normalizeCode(value);
  if ((TRIP_STATUS_CODES as readonly string[]).includes(normalized)) return normalized as TripStatusCode;
  return statusAliases[normalized] ?? null;
};

export const toTripLoadTypeCode = (value?: string | null): TripLoadTypeCode | null => {
  const normalized = normalizeCode(value);
  if ((TRIP_LOAD_TYPE_CODES as readonly string[]).includes(normalized)) return normalized as TripLoadTypeCode;
  return loadTypeAliases[normalized] ?? null;
};

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const validationError = (code: string, message: string, errors: Record<string, string[]>) =>
  new ServiceError({ status: 400, code, message, errors, kind: 'validation' });

const validateQuery = (query: TripOperationsQuery, references: ReferenceSnapshot) => {
  const filters = query.filters ?? {};
  const unknownFilters = Object.keys(filters).filter((key) => !filterAllowlist.has(key as keyof TripOperationsFilters));
  if (unknownFilters.length > 0) {
    throw validationError('UNSUPPORTED_FILTER', 'One or more Trip Operations filters are not supported.', {
      filters: unknownFilters.map((key) => `Unsupported filter: ${key}`),
    });
  }

  if (query.ordering && !orderingAllowlist.has(query.ordering)) {
    throw validationError('UNSUPPORTED_ORDERING', `Ordering field '${query.ordering}' is not supported.`, {
      ordering: ['Use pickup_date, trip_advise_code, client, status, or updated_at, optionally prefixed with -.'],
    });
  }

  const errors: Record<string, string[]> = {};
  if (filters.status && !(TRIP_STATUS_CODES as readonly string[]).includes(filters.status)) {
    errors.status = ['Choose an approved canonical trip status.'];
  }
  if (filters.loadType && !(TRIP_LOAD_TYPE_CODES as readonly string[]).includes(filters.loadType)) {
    errors.loadType = ['Choose an approved canonical load type.'];
  }
  if (filters.pickupStart && !isIsoDate(filters.pickupStart)) errors.pickupStart = ['Use a valid YYYY-MM-DD date.'];
  if (filters.pickupEnd && !isIsoDate(filters.pickupEnd)) errors.pickupEnd = ['Use a valid YYYY-MM-DD date.'];
  if (filters.pickupStart && filters.pickupEnd && filters.pickupStart > filters.pickupEnd) {
    errors.pickupEnd = ['End date must be on or after the start date.'];
  }
  if (query.page !== undefined && (!Number.isSafeInteger(query.page) || query.page < 1)) {
    errors.page = ['Page must be a positive integer.'];
  }
  if (query.limit !== undefined && (!Number.isSafeInteger(query.limit) || query.limit < 1 || query.limit > 100)) {
    errors.limit = ['Limit must be an integer from 1 through 100.'];
  }

  const referenceIds = {
    clientId: new Set(references.clients.map((value) => String(value.id))),
    truckId: new Set(references.trucks.map((value) => String(value.id))),
    driverId: new Set(references.drivers.map((value) => String(value.id))),
    branchId: new Set(references.branches.map((value) => String(value.id))),
  };
  for (const key of Object.keys(referenceIds) as (keyof typeof referenceIds)[]) {
    const value = filters[key];
    if (value && !referenceIds[key].has(value)) errors[key] = ['The requested lookup value is unavailable.'];
  }

  if (Object.keys(errors).length > 0) {
    throw validationError('INVALID_TRIP_OPERATIONS_QUERY', 'The Trip Operations query is invalid.', errors);
  }
};

const reference = (id: string | null, label: string | null, active: boolean | null): TripOperationsReference => ({
  id,
  label,
  active,
});

const projectTrip = (trip: Trip, references: ReferenceSnapshot): TripOperationsRow => {
  const statusRecord = references.statuses.find((status) => status.id === trip.status_id);
  const statusCode = toTripStatusCode(statusRecord?.status_code ?? trip.status ?? trip.status_id);
  const loadTypeRecord = references.loadTypes.find((loadType) => loadType.id === trip.load_type_id);
  const loadTypeCode = toTripLoadTypeCode(loadTypeRecord?.load_type_code ?? trip.load_type ?? trip.load_type_id);
  const client = references.clients.find((value) => String(value.id) === String(trip.client_id ?? trip.customer_id));
  const consignee = references.consignees.find((value) => String(value.id) === String(trip.consignee_id));
  const truck = references.trucks.find((value) => String(value.id) === String(trip.truck_id));
  const driverProfile = references.drivers.find((value) => String(value.id) === String(trip.driver_id));
  const driver = references.employees.find(
    (value) =>
      String(value.id) === String(driverProfile?.employee_id ?? trip.driver_id) ||
      String(value.employee_id) === String(driverProfile?.employee_id ?? trip.driver_id),
  );
  const origin = references.locations.find(
    (value) => String(value.id ?? value.location_id) === String(trip.origin_location_id),
  );
  const destination = references.locations.find(
    (value) => String(value.id ?? value.location_id) === String(trip.destination_location_id),
  );
  const branch = references.branches.find((value) => String(value.id) === String(trip.branch_id));

  return {
    id: String(trip.id ?? trip.trip_id),
    tripAdviceCode: String(trip.trip_advise_code ?? trip.trip_code ?? ''),
    client: reference(
      client ? String(client.id) : null,
      client?.client_name ?? client?.full_name ?? null,
      client?.is_active ?? null,
    ),
    consignee: reference(
      consignee ? String(consignee.id) : null,
      consignee?.full_name ?? null,
      consignee?.is_active ?? null,
    ),
    route: {
      originLabel: origin?.location_name ?? origin?.name ?? null,
      destinationLabel: destination?.location_name ?? destination?.name ?? null,
    },
    pickupDate: trip.pickup_date,
    pickupWindow: trip.pickup_time_window ?? null,
    truck: reference(
      truck ? String(truck.id) : null,
      truck?.plate_number ?? truck?.license_plate ?? null,
      truck?.is_active ?? null,
    ),
    driver: reference(
      driverProfile ? String(driverProfile.id) : null,
      driver?.full_name ?? null,
      driver?.is_active ?? null,
    ),
    loadType: {
      code: loadTypeCode,
      label: loadTypeCode ? approvedTripLoadTypeLabels[loadTypeCode] : null,
    },
    status: {
      code: statusCode,
      label: statusCode ? approvedTripStatusLabels[statusCode] : null,
    },
    branch: reference(
      branch ? String(branch.id) : null,
      branch?.branch_name ?? branch?.branch_code ?? null,
      branch?.is_active ?? null,
    ),
    isTransfer: trip.is_transfer === true,
    updatedAt: trip.updated_at ?? null,
    encoderEmployeeId: trip.encoder_employee_id ?? null,
    isDraft: trip.is_draft === true || statusCode === 'DRAFT',
  };
};

const applyFilters = (rows: TripOperationsRow[], query: TripOperationsQuery) => {
  const filters = query.filters ?? {};
  const search = query.search?.trim().toLocaleLowerCase() ?? '';
  let filtered = rows;

  if (!filters.status && !search) filtered = filtered.filter((row) => row.status.code !== 'CANCELLED');
  if (filters.status) filtered = filtered.filter((row) => row.status.code === filters.status);
  if (filters.pickupStart) filtered = filtered.filter((row) => row.pickupDate >= filters.pickupStart!);
  if (filters.pickupEnd) filtered = filtered.filter((row) => row.pickupDate <= filters.pickupEnd!);
  if (filters.clientId) filtered = filtered.filter((row) => row.client.id === filters.clientId);
  if (filters.truckId) filtered = filtered.filter((row) => row.truck.id === filters.truckId);
  if (filters.driverId) filtered = filtered.filter((row) => row.driver.id === filters.driverId);
  if (filters.loadType) filtered = filtered.filter((row) => row.loadType.code === filters.loadType);
  if (filters.branchId) filtered = filtered.filter((row) => row.branch.id === filters.branchId);
  if (filters.transferOnly) filtered = filtered.filter((row) => row.isTransfer);

  if (search) {
    filtered = filtered.filter((row) =>
      [row.tripAdviceCode, row.truck.label, row.driver.label, row.client.label, row.consignee.label]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(search)),
    );
  }

  return filtered;
};

const compareNullable = (left: string | null, right: string | null) => {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
};

const orderRows = (rows: TripOperationsRow[], ordering: TripOperationsOrdering = '-pickup_date') => {
  const descending = ordering.startsWith('-');
  const field = (descending ? ordering.slice(1) : ordering) as TripOperationsOrderingField;
  const direction = descending ? -1 : 1;
  return [...rows].sort((left, right) => {
    let comparison = 0;
    if (field === 'pickup_date') comparison = compareNullable(left.pickupDate, right.pickupDate);
    if (field === 'trip_advise_code') comparison = compareNullable(left.tripAdviceCode, right.tripAdviceCode);
    if (field === 'client') comparison = compareNullable(left.client.label, right.client.label);
    if (field === 'updated_at') comparison = compareNullable(left.updatedAt, right.updatedAt);
    if (field === 'status') {
      comparison =
        (left.status.code ? (statusOrder.get(left.status.code) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER) -
        (right.status.code ? (statusOrder.get(right.status.code) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER);
    }
    if (comparison !== 0) return comparison * direction;
    const codeComparison = compareNullable(left.tripAdviceCode, right.tripAdviceCode);
    return codeComparison !== 0 ? codeComparison : left.id.localeCompare(right.id, undefined, { numeric: true });
  });
};

const toOption = <TValue extends string>(
  value: TValue,
  label: string,
  active = true,
): TripOperationsLookupOption<TValue> => ({ value, label, active });

export const createDevelopmentTripOperationsService = (data: DataService): TripOperationsService => {
  let inFlightReferences: Promise<ReferenceSnapshot> | null = null;

  const loadReferences = () => {
    if (inFlightReferences) return inFlightReferences;
    const request = Promise.all([
      data.getTripStatuses(),
      data.getLoadTypes(),
      data.getCustomers(),
      data.getConsignees(undefined, { includeInactive: true }),
      data.getLocations(),
      data.getTrucks(),
      data.getDrivers(),
      data.getEmployees(),
      data.getBranches(),
    ]).then(([statuses, loadTypes, clients, consignees, locations, trucks, drivers, employees, branches]) => ({
      statuses,
      loadTypes,
      clients,
      consignees,
      locations,
      trucks,
      drivers,
      employees,
      branches,
    }));
    inFlightReferences = request;
    const clearRequest = () => {
      if (inFlightReferences === request) inFlightReferences = null;
    };
    void request.then(clearRequest, clearRequest);
    return request;
  };

  return {
    list: async (query: TripOperationsQuery = {}, options?: RequestOptions): Promise<TripOperationsPage> => {
      throwIfAborted(options);
      const [trips, references] = await Promise.all([data.getTrips(), loadReferences()]);
      throwIfAborted(options);
      validateQuery(query, references);

      const projected = trips.filter((trip) => !trip.is_deleted).map((trip) => projectTrip(trip, references));
      const filtered = applyFilters(projected, query);
      const ordered = orderRows(filtered, query.ordering);
      const requestedPage = query.page ?? 1;
      const limit = query.limit ?? 25;
      const totalPages = Math.max(1, Math.ceil(ordered.length / limit));
      const page = Math.min(requestedPage, totalPages);
      const offset = (page - 1) * limit;

      return {
        count: ordered.length,
        page,
        limit,
        next: offset + limit < ordered.length ? page + 1 : null,
        previous: page > 1 ? page - 1 : null,
        results: ordered.slice(offset, offset + limit),
        refreshedAt: new Date().toISOString(),
        source: 'development-mock',
      };
    },
    getLookups: async (options?: RequestOptions): Promise<TripOperationsLookups> => {
      throwIfAborted(options);
      const references = await loadReferences();
      throwIfAborted(options);

      const driverOptions = references.drivers
        .map((driver) => {
          const employee = references.employees.find(
            (value) =>
              String(value.id) === String(driver.employee_id) ||
              String(value.employee_id) === String(driver.employee_id),
          );
          return employee && employee.is_active ? toOption(String(driver.id), employee.full_name, true) : null;
        })
        .filter((value): value is TripOperationsLookupOption => value !== null);

      return {
        statuses: TRIP_STATUS_CODES.map((code) => toOption(code, approvedTripStatusLabels[code], true)),
        loadTypes: TRIP_LOAD_TYPE_CODES.map((code) => toOption(code, approvedTripLoadTypeLabels[code], true)),
        clients: references.clients
          .filter((client) => client.is_active)
          .map((client) => toOption(String(client.id), client.client_name ?? client.full_name ?? 'Unavailable')),
        trucks: references.trucks
          .filter((truck) => truck.is_active)
          .map((truck) => toOption(String(truck.id), truck.plate_number ?? truck.license_plate ?? 'Unavailable')),
        drivers: driverOptions,
        branches: references.branches
          .filter((branch) => branch.is_active)
          .map((branch) => toOption(String(branch.id), branch.branch_name ?? branch.branch_code)),
        refreshedAt: new Date().toISOString(),
        source: 'development-mock',
      };
    },
    getById: async (id, options) => {
      throwIfAborted(options);
      const trip = await data.getTripById(id);
      throwIfAborted(options);
      if (!trip) {
        throw new ServiceError({
          status: 404,
          code: 'TRIP_NOT_FOUND',
          message: 'The requested trip is unavailable or does not exist.',
          kind: 'not_found',
        });
      }
      return trip;
    },
  };
};
