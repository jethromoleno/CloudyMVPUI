import {
  TRIP_LOAD_TYPE_CODES,
  TRIP_OPERATIONS_ORDERING_VALUES,
  TRIP_STATUS_CODES,
  type TripLoadTypeCode,
  type TripOperationsLookups,
  type TripOperationsOrdering,
  type TripOperationsQuery,
  type TripStatusCode,
} from '../services';

export const DEFAULT_TRIP_OPERATIONS_ORDERING: TripOperationsOrdering = '-pickup_date';
export const DEFAULT_TRIP_OPERATIONS_PAGE = 1;
export const DEFAULT_TRIP_OPERATIONS_LIMIT = 25;
export const TRIP_OPERATIONS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const tripOperationsUserFilterParams = [
  'search',
  'status',
  'start',
  'end',
  'client',
  'truck',
  'driver',
  'load',
  'branch',
  'transfer',
  'unassigned',
] as const;

const supportedParams = new Set([...tripOperationsUserFilterParams, 'ordering', 'page', 'limit', 'quick']);

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const parseBoundedInteger = (value: string | null, fallback: number, maximum?: number) => {
  if (value === null) return { value: fallback, invalid: false };
  if (!/^\d+$/.test(value)) return { value: fallback, invalid: true };
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    return { value: fallback, invalid: true };
  }
  return { value: parsed, invalid: false };
};

export interface NormalizedTripOperationsUrlState {
  query: TripOperationsQuery;
  normalized: URLSearchParams;
  issues: string[];
  blockingError: string | null;
  hasUserFilters: boolean;
}

export const normalizeTripOperationsParams = (
  input: URLSearchParams,
  lookups?: TripOperationsLookups | null,
): NormalizedTripOperationsUrlState => {
  const normalized = new URLSearchParams();
  const issues: string[] = [];
  const unknownParams = [...input.keys()].filter((key) => !supportedParams.has(key));
  if (unknownParams.length > 0)
    issues.push(`Unsupported query values were removed: ${[...new Set(unknownParams)].join(', ')}.`);

  const search = input.get('search')?.trim() ?? '';
  if (search) normalized.set('search', search);

  let status: TripStatusCode | undefined;
  const requestedStatus = input.get('status');
  if (requestedStatus) {
    if ((TRIP_STATUS_CODES as readonly string[]).includes(requestedStatus)) {
      status = requestedStatus as TripStatusCode;
      normalized.set('status', status);
    } else {
      issues.push('The unsupported status filter was removed.');
    }
  }

  const start = input.get('start') ?? '';
  const end = input.get('end') ?? '';
  let pickupStart: string | undefined;
  let pickupEnd: string | undefined;
  if (start) {
    if (isIsoDate(start)) {
      pickupStart = start;
      normalized.set('start', start);
    } else {
      issues.push('The invalid pickup start date was removed.');
    }
  }
  if (end) {
    if (isIsoDate(end)) {
      pickupEnd = end;
      normalized.set('end', end);
    } else {
      issues.push('The invalid pickup end date was removed.');
    }
  }
  const blockingError =
    pickupStart && pickupEnd && pickupStart > pickupEnd
      ? 'Pickup end date must be on or after the pickup start date. Adjust the range to load results.'
      : null;

  const validateLookup = (
    param: 'client' | 'truck' | 'driver' | 'branch',
    options:
      | TripOperationsLookups[keyof Pick<TripOperationsLookups, 'clients' | 'trucks' | 'drivers' | 'branches'>]
      | undefined,
  ) => {
    const requested = input.get(param) ?? '';
    if (!requested) return undefined;
    if (options && !options.some((option) => option.value === requested)) {
      issues.push(`The unavailable ${param} filter was removed.`);
      return undefined;
    }
    normalized.set(param, requested);
    return requested;
  };

  const clientId = validateLookup('client', lookups?.clients);
  const truckId = validateLookup('truck', lookups?.trucks);
  const driverId = validateLookup('driver', lookups?.drivers);
  const branchId = validateLookup('branch', lookups?.branches);

  let loadType: TripLoadTypeCode | undefined;
  const requestedLoadType = input.get('load');
  if (requestedLoadType) {
    if ((TRIP_LOAD_TYPE_CODES as readonly string[]).includes(requestedLoadType)) {
      loadType = requestedLoadType as TripLoadTypeCode;
      normalized.set('load', loadType);
    } else {
      issues.push('The unsupported load type filter was removed.');
    }
  }

  let transferOnly = false;
  const requestedTransfer = input.get('transfer');
  if (requestedTransfer === 'true') {
    transferOnly = true;
    normalized.set('transfer', 'true');
  } else if (requestedTransfer && requestedTransfer !== 'false') {
    issues.push('The invalid transfer-only value was removed.');
  }

  let unassignedOnly = false;
  const requestedUnassigned = input.get('unassigned');
  if (requestedUnassigned === 'true') {
    unassignedOnly = true;
    normalized.set('unassigned', 'true');
  } else if (requestedUnassigned && requestedUnassigned !== 'false') {
    issues.push('The invalid unassigned-only value was removed.');
  }

  const requestedOrdering = input.get('ordering');
  const ordering = (TRIP_OPERATIONS_ORDERING_VALUES as readonly string[]).includes(requestedOrdering ?? '')
    ? (requestedOrdering as TripOperationsOrdering)
    : DEFAULT_TRIP_OPERATIONS_ORDERING;
  if (requestedOrdering && requestedOrdering !== ordering) issues.push('The unsupported ordering value was reset.');
  normalized.set('ordering', ordering);

  const parsedPage = parseBoundedInteger(input.get('page'), DEFAULT_TRIP_OPERATIONS_PAGE);
  const parsedLimit = parseBoundedInteger(input.get('limit'), DEFAULT_TRIP_OPERATIONS_LIMIT, 100);
  if (parsedPage.invalid) issues.push('The invalid page value was reset to 1.');
  if (parsedLimit.invalid) issues.push('The invalid page-size value was reset to 25.');
  normalized.set('page', String(parsedPage.value));
  normalized.set('limit', String(parsedLimit.value));

  const requestedQuickTrip = input.get('quick')?.trim() ?? '';
  if (requestedQuickTrip) {
    if (requestedQuickTrip.length <= 200) normalized.set('quick', requestedQuickTrip);
    else issues.push('The invalid Quick Details trip identifier was removed.');
  }

  const filters = {
    status,
    pickupStart,
    pickupEnd,
    clientId,
    truckId,
    driverId,
    loadType,
    branchId,
    transferOnly: transferOnly || undefined,
    unassignedOnly: unassignedOnly || undefined,
  };
  const hasUserFilters = Boolean(search || Object.values(filters).some((value) => value !== undefined));

  return {
    query: {
      search: search || undefined,
      filters,
      ordering,
      page: parsedPage.value,
      limit: parsedLimit.value,
    },
    normalized,
    issues,
    blockingError,
    hasUserFilters,
  };
};
