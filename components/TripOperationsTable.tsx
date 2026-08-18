import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { uiClasses } from '../design/tokens';
import { permissionActions, permissionResources, usePermissions } from '../permissions';
import {
  normalizeServiceError,
  services,
  type ServiceError,
  type TripOperationsLookups,
  type TripOperationsOrderingField,
  type TripOperationsQuery,
  type TripOperationsRow,
  type TripOperationsService,
} from '../services';
import {
  BlockedState,
  Button,
  DataTable,
  type DataTableColumn,
  ErrorState,
  FilterBar,
  LoadingState,
  PermissionDeniedState,
  SearchInput,
  StatusBadge,
  SurfaceState,
} from './ui';
import {
  DEFAULT_TRIP_OPERATIONS_LIMIT,
  DEFAULT_TRIP_OPERATIONS_ORDERING,
  normalizeTripOperationsParams,
  TRIP_OPERATIONS_PAGE_SIZE_OPTIONS,
  tripOperationsUserFilterParams,
} from './tripOperationsQuery';
import { TripQuickDetailsPanel } from './TripQuickDetailsPanel';

interface TripOperationsTableProps {
  onCreateTrip?: () => void;
  onEditTrip?: (tripId: string) => void;
  onOpenTrip: (tripId: string, section?: string) => void;
  tripService?: TripOperationsService;
}

type ActiveFilter = {
  key: string;
  label: string;
  onClear: () => void;
};

type PendingSearchParams = {
  value: string;
  replace: boolean;
};

const filterControlClass = `${uiClasses.field} h-10 min-h-10 min-w-0 py-1.5 text-sm`;

const filterFieldLabelClass = 'flex flex-col gap-1.5 text-xs font-semibold text-navy-700 dark:text-carbon-200';

const filterCheckboxLabelClass =
  'flex h-10 min-h-10 w-full items-center gap-2 self-end rounded-lg border border-navy-200 bg-white px-3 text-xs font-semibold text-navy-700 dark:border-carbon-700 dark:bg-carbon-950 dark:text-carbon-200';

const filterStripClassName = 'border-0 p-3 shadow-none';

const filterStripHeaderClassName = 'mb-2 pb-2';

const filterStripContentClassName =
  'grid w-max min-w-full grid-flow-col grid-rows-2 auto-cols-[minmax(10rem,12rem)] gap-x-3 gap-y-2 xl:w-full xl:grid-flow-row xl:grid-cols-6 xl:grid-rows-2 xl:auto-cols-auto';

const formatPickupDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return value || 'Unavailable';
  return new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(parsed);
};

const formatRefreshTime = (value?: string | null) => {
  if (!value) return 'Not refreshed yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Refresh time unavailable';
  return new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    second: '2-digit',
    timeZone: 'Asia/Manila',
    year: 'numeric',
  }).format(parsed);
};

const orderingSummary = (ordering: string) => {
  switch (ordering) {
    case 'pickup_date':
      return 'Pickup · oldest first';
    case 'trip_advise_code':
      return 'Trip advice · A to Z';
    case '-trip_advise_code':
      return 'Trip advice · Z to A';
    case 'client':
      return 'Client · A to Z';
    case '-client':
      return 'Client · Z to A';
    case 'status':
      return 'Status · lifecycle';
    case '-status':
      return 'Status · reverse';
    case 'updated_at':
      return 'Activity · oldest first';
    case '-updated_at':
      return 'Activity · newest first';
    case '-pickup_date':
    default:
      return 'Pickup · newest first';
  }
};

const compareParams = (left: URLSearchParams, right: URLSearchParams) => left.toString() === right.toString();

const ReferenceFact: React.FC<{ active: boolean | null; label: string | null }> = ({ active, label }) => (
  <span>
    <span className="font-medium text-navy-800 dark:text-carbon-100">{label ?? 'Unavailable'}</span>
    {active === false && (
      <span className="mt-1 block text-[10px] text-navy-500 dark:text-carbon-400">Inactive historical label</span>
    )}
  </span>
);

export const TripOperationsTable: React.FC<TripOperationsTableProps> = ({
  onCreateTrip,
  onEditTrip,
  onOpenTrip,
  tripService = services.trips,
}) => {
  const permissions = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingSearchParams, setPendingSearchParams] = useState<PendingSearchParams | null>(null);
  const [lookups, setLookups] = useState<TripOperationsLookups | null>(null);
  const [lookupError, setLookupError] = useState<ServiceError | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(true);
  const [pageResult, setPageResult] = useState<Awaited<ReturnType<TripOperationsService['list']>> | null>(null);
  const [pageResultQueryKey, setPageResultQueryKey] = useState<string | null>(null);
  const [listError, setListError] = useState<ServiceError | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [normalizationNotice, setNormalizationNotice] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches,
  );
  const pageResultRef = useRef(pageResult);
  const activeRequestRef = useRef<{ controller: AbortController; id: number } | null>(null);
  const lookupRequestRef = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef(0);
  const quickDetailsTriggerRef = useRef<HTMLElement | null>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const previousQuickTripRef = useRef<string | null>(null);
  const keepNormalizationNoticeRef = useRef(false);

  useEffect(() => {
    pageResultRef.current = pageResult;
  }, [pageResult]);

  const effectiveSearchParams = useMemo(
    () => (pendingSearchParams ? new URLSearchParams(pendingSearchParams.value) : searchParams),
    [pendingSearchParams, searchParams],
  );
  const normalizedUrl = useMemo(
    () => normalizeTripOperationsParams(effectiveSearchParams, lookups),
    [effectiveSearchParams, lookups],
  );
  const quickTripId = normalizedUrl.normalized.get('quick');
  const queryKey = useMemo(() => {
    const listParams = new URLSearchParams(normalizedUrl.normalized);
    listParams.delete('quick');
    return listParams.toString();
  }, [normalizedUrl.normalized]);
  const query = normalizedUrl.query;
  const requestQuery = useMemo(
    () => normalizeTripOperationsParams(new URLSearchParams(queryKey), lookups).query,
    [lookups, queryKey],
  );
  const [searchDraft, setSearchDraft] = useState(query.search ?? '');

  useEffect(() => {
    if (!pendingSearchParams) return;
    if (searchParams.toString() === pendingSearchParams.value) return;
    setSearchParams(new URLSearchParams(pendingSearchParams.value), { replace: pendingSearchParams.replace });
  }, [pendingSearchParams, searchParams, setSearchParams]);

  useEffect(() => {
    if (pendingSearchParams && searchParams.toString() === pendingSearchParams.value) {
      setPendingSearchParams((current) => (current === pendingSearchParams ? null : current));
    }
  }, [pendingSearchParams, searchParams]);

  useEffect(() => {
    if (pendingSearchParams) return;
    if (!compareParams(searchParams, normalizedUrl.normalized)) {
      if (normalizedUrl.issues.length > 0) {
        setNormalizationNotice(normalizedUrl.issues.join(' '));
        keepNormalizationNoticeRef.current = true;
      } else {
        setNormalizationNotice(null);
        keepNormalizationNoticeRef.current = false;
      }
      setSearchParams(normalizedUrl.normalized, { replace: true });
      return;
    }
    if (normalizedUrl.issues.length === 0) {
      if (keepNormalizationNoticeRef.current) {
        keepNormalizationNoticeRef.current = false;
        return;
      }
      setNormalizationNotice(null);
    }
  }, [normalizedUrl.issues, normalizedUrl.normalized, pendingSearchParams, searchParams, setSearchParams]);

  useEffect(() => {
    setSearchDraft(query.search ?? '');
  }, [query.search]);

  const queueSearchParams = useCallback(
    (mutate: (next: URLSearchParams) => void, replace = false) => {
      setPendingSearchParams((current) => {
        const next = new URLSearchParams(current?.value ?? searchParams.toString());
        mutate(next);
        return {
          value: next.toString(),
          replace: current ? current.replace && replace : replace,
        };
      });
    },
    [searchParams],
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsCompactViewport(media.matches);
    updateViewport();
    media.addEventListener('change', updateViewport);
    return () => media.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setFiltersOpen(false);
      filtersButtonRef.current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filtersOpen]);

  const closeQuickDetails = useCallback(() => {
    queueSearchParams((next) => next.delete('quick'), true);
  }, [queueSearchParams]);

  useEffect(() => {
    const previousQuickTrip = previousQuickTripRef.current;
    previousQuickTripRef.current = quickTripId;
    if (!previousQuickTrip || quickTripId) return;
    const focusTimer = window.setTimeout(() => quickDetailsTriggerRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [quickTripId]);

  const updateQueryParam = useCallback(
    (key: string, value?: string | null, replace = false) => {
      setNormalizationNotice(null);
      queueSearchParams((next) => {
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.set('page', '1');
        if (!next.has('ordering')) next.set('ordering', DEFAULT_TRIP_OPERATIONS_ORDERING);
        if (!next.has('limit')) next.set('limit', String(DEFAULT_TRIP_OPERATIONS_LIMIT));
      }, replace);
    },
    [queueSearchParams],
  );

  useEffect(() => {
    if ((query.search ?? '') === searchDraft.trim()) return;
    const timer = window.setTimeout(() => updateQueryParam('search', searchDraft.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query.search, searchDraft, updateQueryParam]);

  const loadLookups = useCallback(() => {
    lookupRequestRef.current?.abort();
    const controller = new AbortController();
    lookupRequestRef.current = controller;
    setIsLookupLoading(true);
    setLookupError(null);
    void tripService
      .getLookups({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setLookups(result);
      })
      .catch((error) => {
        const normalized = normalizeServiceError(error);
        if (!controller.signal.aborted && normalized.kind !== 'cancelled') setLookupError(normalized);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLookupLoading(false);
        if (lookupRequestRef.current === controller) lookupRequestRef.current = null;
      });
  }, [tripService]);

  useEffect(() => {
    loadLookups();
    return () => lookupRequestRef.current?.abort();
  }, [loadLookups]);

  const performListRequest = useCallback(
    async (
      requestQuery: TripOperationsQuery,
      requestQueryKey: string,
      kind: 'query' | 'refresh',
      abortPrevious: boolean,
    ) => {
      if (activeRequestRef.current) {
        if (!abortPrevious) return;
        activeRequestRef.current.controller.abort();
      }

      const controller = new AbortController();
      const id = ++requestSequenceRef.current;
      activeRequestRef.current = { controller, id };
      setListError(null);
      if (pageResultRef.current) setIsRefreshing(true);
      else setIsInitialLoading(true);

      try {
        const result = await tripService.list(requestQuery, {
          signal: controller.signal,
          forceRefresh: kind === 'refresh',
        });
        if (activeRequestRef.current?.id !== id || controller.signal.aborted) return;
        setPageResult(result);
        setPageResultQueryKey(requestQueryKey);
        pageResultRef.current = result;
      } catch (error) {
        const normalized = normalizeServiceError(error);
        if (activeRequestRef.current?.id !== id || normalized.kind === 'cancelled') return;
        setListError(normalized);
      } finally {
        if (activeRequestRef.current?.id === id) {
          activeRequestRef.current = null;
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [tripService],
  );

  useEffect(() => {
    if (normalizedUrl.blockingError) {
      activeRequestRef.current?.controller.abort();
      activeRequestRef.current = null;
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }
    if (isLookupLoading) return;
    void performListRequest(requestQuery, queryKey, 'query', true);
  }, [isLookupLoading, normalizedUrl.blockingError, performListRequest, queryKey, requestQuery]);

  const refresh = useCallback(() => {
    if (normalizedUrl.blockingError) return;
    void performListRequest(requestQuery, queryKey, 'refresh', false);
  }, [normalizedUrl.blockingError, performListRequest, queryKey, requestQuery]);

  useEffect(() => {
    if (pageResult && pageResultQueryKey === queryKey && pageResult.page !== requestQuery.page) {
      updateQueryParam('page', String(pageResult.page), true);
    }
  }, [pageResult, pageResultQueryKey, queryKey, requestQuery.page, updateQueryParam]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      const activeRequest = activeRequestRef.current;
      activeRequest?.controller.abort();
      if (activeRequestRef.current === activeRequest) activeRequestRef.current = null;
    };
  }, [refresh]);

  const clearAllFilters = useCallback(() => {
    setSearchDraft('');
    setNormalizationNotice(null);
    queueSearchParams((next) => {
      for (const key of tripOperationsUserFilterParams) next.delete(key);
      next.set('page', '1');
      next.set('ordering', query.ordering ?? DEFAULT_TRIP_OPERATIONS_ORDERING);
      next.set('limit', String(query.limit ?? DEFAULT_TRIP_OPERATIONS_LIMIT));
    });
  }, [query.limit, query.ordering, queueSearchParams]);

  const lookupLabel = useCallback(
    (group: 'statuses' | 'loadTypes' | 'clients' | 'trucks' | 'drivers' | 'branches', value?: string) =>
      value ? (lookups?.[group].find((option) => option.value === value)?.label ?? value) : '',
    [lookups],
  );

  const filters = useMemo(() => query.filters ?? {}, [query.filters]);
  const activeFilters: ActiveFilter[] = [];
  if (query.search)
    activeFilters.push({ key: 'search', label: `Search: ${query.search}`, onClear: () => updateQueryParam('search') });
  if (filters.status)
    activeFilters.push({
      key: 'status',
      label: `Status: ${lookupLabel('statuses', filters.status)}`,
      onClear: () => updateQueryParam('status'),
    });
  if (filters.pickupStart)
    activeFilters.push({
      key: 'start',
      label: `From: ${filters.pickupStart}`,
      onClear: () => updateQueryParam('start'),
    });
  if (filters.pickupEnd)
    activeFilters.push({ key: 'end', label: `To: ${filters.pickupEnd}`, onClear: () => updateQueryParam('end') });
  if (filters.clientId)
    activeFilters.push({
      key: 'client',
      label: `Client: ${lookupLabel('clients', filters.clientId)}`,
      onClear: () => updateQueryParam('client'),
    });
  if (filters.truckId)
    activeFilters.push({
      key: 'truck',
      label: `Truck: ${lookupLabel('trucks', filters.truckId)}`,
      onClear: () => updateQueryParam('truck'),
    });
  if (filters.driverId)
    activeFilters.push({
      key: 'driver',
      label: `Driver: ${lookupLabel('drivers', filters.driverId)}`,
      onClear: () => updateQueryParam('driver'),
    });
  if (filters.loadType)
    activeFilters.push({
      key: 'load',
      label: `Load: ${lookupLabel('loadTypes', filters.loadType)}`,
      onClear: () => updateQueryParam('load'),
    });
  if (filters.branchId)
    activeFilters.push({
      key: 'branch',
      label: `Branch: ${lookupLabel('branches', filters.branchId)}`,
      onClear: () => updateQueryParam('branch'),
    });
  if (filters.transferOnly)
    activeFilters.push({ key: 'transfer', label: 'Transfer only', onClear: () => updateQueryParam('transfer') });
  if (filters.unassignedOnly)
    activeFilters.push({
      key: 'unassigned',
      label: 'Unassigned resources',
      onClear: () => updateQueryParam('unassigned'),
    });

  const createPresentation = permissions.present(permissionActions.create, permissionResources.tripAdvice);
  const showActionsColumn = Boolean(
    onEditTrip &&
    (permissions.identity.role === 'Encoder' ||
      permissions.present(permissionActions.update, permissionResources.tripAdvice).visible),
  );
  const ordering = query.ordering ?? DEFAULT_TRIP_OPERATIONS_ORDERING;

  const sortState = useCallback(
    (field: TripOperationsOrderingField): React.AriaAttributes['aria-sort'] => {
      if (ordering === field) return 'ascending';
      if (ordering === `-${field}`) return 'descending';
      return 'none';
    },
    [ordering],
  );

  const sortHeader = useCallback(
    (field: TripOperationsOrderingField, label: string) => {
      const active = ordering === field || ordering === `-${field}`;
      const descending = ordering === `-${field}`;
      return (
        <button
          type="button"
          className="inline-flex min-h-8 items-center gap-1 rounded px-1 text-left hover:text-navy-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:text-white"
          onClick={() => updateQueryParam('ordering', active && !descending ? `-${field}` : field)}
        >
          {label}
          {active ? (
            descending ? (
              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
            )
          ) : (
            <span aria-hidden="true" className="text-navy-300 dark:text-carbon-600">
              ↕
            </span>
          )}
        </button>
      );
    },
    [ordering, updateQueryParam],
  );

  const openQuickDetails = useCallback(
    (row: TripOperationsRow, trigger: HTMLElement) => {
      quickDetailsTriggerRef.current = trigger;
      queueSearchParams((next) => next.set('quick', row.id));
    },
    [queueSearchParams],
  );

  const openRow = useCallback(
    (row: TripOperationsRow, event: React.MouseEvent<HTMLTableRowElement> | React.KeyboardEvent<HTMLTableRowElement>) =>
      openQuickDetails(row, event.currentTarget),
    [openQuickDetails],
  );

  const columns = useMemo<DataTableColumn<TripOperationsRow>[]>(() => {
    const baseColumns: DataTableColumn<TripOperationsRow>[] = [
      {
        key: 'trip',
        header: sortHeader('trip_advise_code', 'Trip advice'),
        ariaSort: sortState('trip_advise_code'),
        headerClassName: 'sticky left-0 z-20 min-w-36 bg-navy-50 xl:min-w-32 dark:bg-carbon-900',
        className:
          'sticky left-0 z-10 min-w-36 bg-white font-semibold text-navy-950 xl:min-w-32 dark:bg-carbon-900 dark:text-white',
        cell: (row) => (
          <div>
            <span>{row.tripAdviceCode || 'Unavailable'}</span>
            <span className="mt-1 block max-w-32 truncate text-[11px] font-normal text-navy-500 sm:hidden dark:text-carbon-400">
              {row.client.label ?? 'Client unavailable'}
            </span>
          </div>
        ),
      },
      {
        key: 'client',
        header: sortHeader('client', 'Client'),
        ariaSort: sortState('client'),
        headerClassName: 'hidden min-w-40 sm:table-cell xl:min-w-36',
        className: 'hidden min-w-40 sm:table-cell xl:min-w-36',
        cell: (row) => <ReferenceFact active={row.client.active} label={row.client.label} />,
      },
      {
        key: 'consignee',
        header: 'Consignee',
        headerClassName: 'hidden min-w-40 xl:table-cell xl:min-w-36',
        className: 'hidden min-w-40 xl:table-cell xl:min-w-36',
        cell: (row) => <ReferenceFact active={row.consignee.active} label={row.consignee.label} />,
      },
      {
        key: 'route',
        header: 'Route',
        headerClassName: 'min-w-48 xl:min-w-40',
        className: 'min-w-48 xl:min-w-40',
        cell: (row) =>
          row.route.originLabel || row.route.destinationLabel ? (
            <span>
              {row.route.originLabel ?? 'Unavailable'} <span className="sr-only">to</span>{' '}
              <span aria-hidden="true">→</span> {row.route.destinationLabel ?? 'Unavailable'}
            </span>
          ) : (
            <span className="text-navy-500 dark:text-carbon-400">Route unavailable</span>
          ),
      },
      {
        key: 'pickup',
        header: sortHeader('pickup_date', 'Pickup'),
        ariaSort: sortState('pickup_date'),
        headerClassName: 'min-w-40 xl:min-w-36',
        className: 'min-w-40 xl:min-w-36',
        cell: (row) => (
          <div>
            <span className="font-medium">{formatPickupDate(row.pickupDate)}</span>
            <span className="mt-1 block text-[11px] text-navy-500 dark:text-carbon-400">
              {row.pickupWindow ?? 'Window unavailable'}
            </span>
          </div>
        ),
      },
      {
        key: 'truck',
        header: 'Truck',
        headerClassName: 'hidden min-w-32 lg:table-cell xl:min-w-28',
        className: 'hidden min-w-32 lg:table-cell xl:min-w-28',
        cell: (row) =>
          row.truck.id ? (
            <ReferenceFact active={row.truck.active} label={row.truck.label} />
          ) : (
            <StatusBadge hideCue status="UNASSIGNED" label="Unassigned" />
          ),
      },
      {
        key: 'driver',
        header: 'Driver',
        headerClassName: 'hidden min-w-40 xl:table-cell xl:min-w-32',
        className: 'hidden min-w-40 xl:table-cell xl:min-w-32',
        cell: (row) =>
          row.driver.id ? (
            <ReferenceFact active={row.driver.active} label={row.driver.label} />
          ) : (
            <StatusBadge hideCue status="UNASSIGNED" label="Unassigned" />
          ),
      },
      {
        key: 'load',
        header: 'Load type',
        headerClassName: 'hidden min-w-28 xl:table-cell',
        className: 'hidden min-w-28 xl:table-cell',
        cell: (row) => row.loadType.label ?? 'Unavailable',
      },
      {
        key: 'status',
        header: sortHeader('status', 'Status'),
        ariaSort: sortState('status'),
        headerClassName: 'min-w-36',
        className: 'min-w-36',
        cell: (row) =>
          row.status.code ? (
            <StatusBadge hideCue status={row.status.code} label={row.status.label ?? undefined} />
          ) : (
            <span className="text-navy-500 dark:text-carbon-400">Unavailable</span>
          ),
      },
      {
        key: 'updated',
        header: sortHeader('updated_at', 'Last activity'),
        ariaSort: sortState('updated_at'),
        headerClassName: 'hidden min-w-44 2xl:table-cell',
        className: 'hidden min-w-44 2xl:table-cell',
        cell: (row) => formatRefreshTime(row.updatedAt),
      },
    ];

    if (showActionsColumn) {
      baseColumns.push({
        key: 'actions',
        header: 'Actions',
        align: 'right',
        headerClassName: 'sticky right-0 z-20 w-12 min-w-12 max-w-12 bg-navy-50 dark:bg-carbon-900',
        className: 'sticky right-0 z-10 w-12 min-w-12 max-w-12 bg-white dark:bg-carbon-900',
        cell: (row) => {
          const editPresentation = permissions.present(permissionActions.update, permissionResources.tripAdvice, {
            recordOwnerId: row.encoderEmployeeId,
            recordState: row.status.code,
            recordIsDraft: row.isDraft,
            blockedReason:
              row.status.code === 'COMPLETED'
                ? 'Completed trips are read-only.'
                : row.status.code === 'CANCELLED'
                  ? 'Cancelled trips are read-only.'
                  : null,
          });
          if (!editPresentation.visible) return null;
          return (
            <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
              <Button
                aria-label={`Edit trip ${row.tripAdviceCode}`}
                disabled={editPresentation.disabled}
                icon={<Edit3 aria-hidden="true" className="h-4 w-4" />}
                onClick={() => onEditTrip?.(row.id)}
                size="icon"
                title={editPresentation.reason ?? `Edit trip ${row.tripAdviceCode}`}
                variant="ghost"
              />
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [onEditTrip, permissions, showActionsColumn, sortHeader, sortState]);

  const currentPage = pageResult?.page ?? query.page ?? 1;
  const currentLimit = pageResult?.limit ?? query.limit ?? DEFAULT_TRIP_OPERATIONS_LIMIT;
  const totalCount = pageResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentLimit));
  const resultStart = totalCount === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const resultEnd = totalCount === 0 ? 0 : Math.min(currentPage * currentLimit, totalCount);
  const availablePageSizes = [...new Set([...TRIP_OPERATIONS_PAGE_SIZE_OPTIONS, currentLimit])].sort((a, b) => a - b);
  const initialError = !pageResult && listError;
  const retainedDataWarning = pageResult && listError;

  const renderInitialState = () => {
    if (normalizedUrl.blockingError) {
      return (
        <BlockedState
          description={normalizedUrl.blockingError}
          title="Trip filters need attention"
          action={
            <Button onClick={() => updateQueryParam('end')} variant="secondary">
              Clear pickup end date
            </Button>
          }
        />
      );
    }
    if (!initialError) return null;
    if (initialError.kind === 'authentication') {
      return (
        <SurfaceState
          description="Sign in again to load the protected Trip Operations list. No protected rows were rendered."
          title="Authentication required"
        />
      );
    }
    if (initialError.kind === 'authorization') {
      return (
        <PermissionDeniedState description="The service denied this list request. No protected Trip Operations rows were rendered." />
      );
    }
    if (initialError.kind === 'validation') {
      return <BlockedState description={initialError.message} title="Trip query rejected" />;
    }
    return <ErrorState description={initialError.message} onRetry={refresh} title="Trip Operations unavailable" />;
  };

  const initialState = renderInitialState();

  return (
    <div className="flex h-full min-w-0 overflow-hidden">
      <section
        aria-labelledby="trip-operations-title"
        className="h-full min-w-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4 lg:p-5"
      >
        <header className="flex flex-col gap-4 rounded-xl border border-navy-200 bg-white p-4 shadow-sm dark:border-carbon-800 dark:bg-carbon-900 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 id="trip-operations-title" className="text-2xl font-bold text-navy-950 dark:text-white">
                  Trip Operations
                </h1>
                <span className="rounded-full border border-navy-200 bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700 dark:border-carbon-700 dark:bg-carbon-800 dark:text-carbon-200">
                  {pageResult ? `${pageResult.count} records` : 'Count pending'}
                </span>
              </div>
              <p className="mt-1 text-sm text-navy-500 dark:text-carbon-400">
                Server-style operational queue with URL-backed search, filters, ordering, and pagination.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 flex items-center gap-2 text-xs text-navy-500 dark:text-carbon-400" role="status">
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                <span>
                  {isRefreshing ? 'Refreshing...' : `Last refreshed ${formatRefreshTime(pageResult?.refreshedAt)}`}
                </span>
              </div>
              <Button
                aria-label="Refresh Trip Operations"
                disabled={Boolean(normalizedUrl.blockingError)}
                icon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}
                isLoading={isRefreshing}
                onClick={refresh}
                variant="secondary"
              >
                Refresh
              </Button>
              {createPresentation.visible && onCreateTrip && (
                <Button
                  disabled={createPresentation.disabled}
                  icon={<Plus aria-hidden="true" className="h-4 w-4" />}
                  onClick={onCreateTrip}
                  title={createPresentation.reason ?? undefined}
                >
                  New trip
                </Button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="trip-operations-search"
              className="mb-1.5 block text-xs font-semibold text-navy-700 dark:text-carbon-200"
            >
              Search trips
            </label>
            <div className="flex items-center gap-2">
              <SearchInput
                id="trip-operations-search"
                aria-describedby="trip-search-help"
                className="min-w-0 flex-1"
                onChange={setSearchDraft}
                onClear={() => setSearchDraft('')}
                placeholder="Search trip code, plate, driver, client, or consignee"
                value={searchDraft}
              />
              <Button
                ref={filtersButtonRef}
                aria-controls="trip-operations-filters"
                aria-expanded={filtersOpen}
                className="shrink-0"
                icon={<Filter aria-hidden="true" className="h-4 w-4" />}
                onClick={() => setFiltersOpen((value) => !value)}
                trailingIcon={
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                  />
                }
                variant="secondary"
              >
                Filters {activeFilters.length > 0 ? `(${activeFilters.length})` : ''}
              </Button>
            </div>
            <p id="trip-search-help" className="mt-1 text-[11px] text-navy-500 dark:text-carbon-400">
              Search updates after a short pause and remains in the browser address.
            </p>
          </div>

          {normalizationNotice && (
            <div
              className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
              role="status"
            >
              <RotateCcw aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{normalizationNotice} The remaining list context was preserved.</span>
            </div>
          )}
        </header>

        <section aria-label="Active Trip Operations filters" className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-navy-200 bg-white px-3 py-1 text-xs font-semibold text-navy-700 dark:border-carbon-700 dark:bg-carbon-900 dark:text-carbon-200">
            {filters.status ? `Status: ${lookupLabel('statuses', filters.status)}` : 'Active operations'}
          </span>
          <span className="rounded-full border border-navy-200 bg-white px-3 py-1 text-xs font-semibold text-navy-700 dark:border-carbon-700 dark:bg-carbon-900 dark:text-carbon-200">
            {orderingSummary(ordering)}
          </span>
          {activeFilters.length > 0 ? (
            <span className="text-xs font-semibold text-navy-600 dark:text-carbon-300">
              {activeFilters.length} active filter{activeFilters.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-xs font-semibold text-navy-600 dark:text-carbon-300">
              Default active operations view
            </span>
          )}
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-800 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
              onClick={filter.onClear}
              aria-label={`Clear ${filter.label}`}
            >
              {filter.label} <span aria-hidden="true">×</span>
            </button>
          ))}
          {activeFilters.length > 0 && (
            <Button onClick={clearAllFilters} size="sm" variant="ghost">
              Clear all
            </Button>
          )}
        </section>

        {filtersOpen && (
          <div
            id="trip-operations-filters"
            className="overflow-x-auto rounded-xl border border-navy-200 bg-white shadow-sm dark:border-carbon-800 dark:bg-carbon-900"
          >
            {isLookupLoading ? (
              <LoadingState className="min-h-24 border-0 shadow-none" label="Loading approved filter options..." />
            ) : lookupError ? (
              <BlockedState
                action={
                  <Button onClick={() => void loadLookups()} variant="secondary">
                    Retry filter options
                  </Button>
                }
                className="border-0 shadow-none"
                description={`${lookupError.message} Existing safe list data remains available, but lookup-dependent controls are blocked.`}
                title="Filter options unavailable"
              />
            ) : (
              <FilterBar
                className={filterStripClassName}
                contentClassName={filterStripContentClassName}
                hasActiveFilters={activeFilters.length > 0}
                headerClassName={filterStripHeaderClassName}
                onReset={clearAllFilters}
                title="Trip filters"
              >
                <label className={filterFieldLabelClass}>
                  Status
                  <select
                    className={filterControlClass}
                    onChange={(event) => updateQueryParam('status', event.target.value)}
                    value={filters.status ?? ''}
                  >
                    <option value="">Active operations (excludes Cancelled)</option>
                    {lookups?.statuses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={filterFieldLabelClass}>
                  Pickup start
                  <input
                    className={filterControlClass}
                    max={filters.pickupEnd}
                    onChange={(event) => updateQueryParam('start', event.target.value)}
                    type="date"
                    value={filters.pickupStart ?? ''}
                  />
                </label>
                <label className={filterFieldLabelClass}>
                  Pickup end
                  <input
                    aria-invalid={Boolean(normalizedUrl.blockingError)}
                    className={filterControlClass}
                    min={filters.pickupStart}
                    onChange={(event) => updateQueryParam('end', event.target.value)}
                    type="date"
                    value={filters.pickupEnd ?? ''}
                  />
                </label>
                <label className={filterFieldLabelClass}>
                  Client
                  <select
                    className={filterControlClass}
                    onChange={(event) => updateQueryParam('client', event.target.value)}
                    value={filters.clientId ?? ''}
                  >
                    <option value="">All client values</option>
                    {lookups?.clients.map((option) => (
                      <option key={option.value} disabled={!option.active} value={option.value}>
                        {option.label}
                        {!option.active ? ' (Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={filterFieldLabelClass}>
                  Truck
                  <select
                    className={filterControlClass}
                    onChange={(event) => updateQueryParam('truck', event.target.value)}
                    value={filters.truckId ?? ''}
                  >
                    <option value="">All truck values</option>
                    {lookups?.trucks.map((option) => (
                      <option key={option.value} disabled={!option.active} value={option.value}>
                        {option.label}
                        {!option.active ? ' (Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={filterFieldLabelClass}>
                  Driver
                  <select
                    className={filterControlClass}
                    onChange={(event) => updateQueryParam('driver', event.target.value)}
                    value={filters.driverId ?? ''}
                  >
                    <option value="">All driver values</option>
                    {lookups?.drivers.map((option) => (
                      <option key={option.value} disabled={!option.active} value={option.value}>
                        {option.label}
                        {!option.active ? ' (Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={filterFieldLabelClass}>
                  Load type
                  <select
                    className={filterControlClass}
                    onChange={(event) => updateQueryParam('load', event.target.value)}
                    value={filters.loadType ?? ''}
                  >
                    <option value="">All load type values</option>
                    {lookups?.loadTypes.map((option) => (
                      <option key={option.value} disabled={!option.active} value={option.value}>
                        {option.label}
                        {!option.active ? ' (Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={filterFieldLabelClass}>
                  Branch
                  <select
                    className={filterControlClass}
                    onChange={(event) => updateQueryParam('branch', event.target.value)}
                    value={filters.branchId ?? ''}
                  >
                    <option value="">All branch values</option>
                    {lookups?.branches.map((option) => (
                      <option key={option.value} disabled={!option.active} value={option.value}>
                        {option.label}
                        {!option.active ? ' (Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={filterFieldLabelClass}>
                  Sort by
                  <select
                    className={filterControlClass}
                    onChange={(event) => updateQueryParam('ordering', event.target.value)}
                    value={ordering}
                  >
                    <option value="-pickup_date">Pickup date - newest first</option>
                    <option value="pickup_date">Pickup date - oldest first</option>
                    <option value="trip_advise_code">Trip advice - A to Z</option>
                    <option value="-trip_advise_code">Trip advice - Z to A</option>
                    <option value="client">Client - A to Z</option>
                    <option value="-client">Client - Z to A</option>
                    <option value="status">Status - lifecycle order</option>
                    <option value="-status">Status - reverse lifecycle</option>
                    <option value="-updated_at">Last activity - newest first</option>
                    <option value="updated_at">Last activity - oldest first</option>
                  </select>
                </label>
                <label className={filterCheckboxLabelClass}>
                  <input
                    checked={filters.transferOnly ?? false}
                    className="h-4 w-4"
                    onChange={(event) => updateQueryParam('transfer', event.target.checked ? 'true' : undefined)}
                    type="checkbox"
                  />
                  Transfer-only trips
                </label>
                <label className={filterCheckboxLabelClass}>
                  <input
                    checked={filters.unassignedOnly ?? false}
                    className="h-4 w-4"
                    onChange={(event) => updateQueryParam('unassigned', event.target.checked ? 'true' : undefined)}
                    type="checkbox"
                  />
                  Unassigned resources
                </label>
              </FilterBar>
            )}
          </div>
        )}

        {retainedDataWarning && (
          <div
            className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                Refresh failed: {retainedDataWarning.message} The last safe rows and current URL context remain visible.
              </span>
            </div>
            <Button onClick={refresh} size="sm" variant="secondary">
              Retry
            </Button>
          </div>
        )}

        {initialState ?? (
          <div className="overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm dark:border-carbon-800 dark:bg-carbon-900">
            <div className="overflow-x-auto" tabIndex={0} aria-label="Scrollable Trip Operations table">
              <DataTable<TripOperationsRow>
                caption="Trip Operations queue"
                columns={columns}
                data={pageResult?.results ?? []}
                emptyDescription="No trip records exist in this development dataset."
                getRowKey={(row) => row.id}
                isFiltered={normalizedUrl.hasUserFilters}
                isLoading={isInitialLoading && !pageResult}
                isRowSelected={(row) => row.id === quickTripId}
                noResultsDescription="No trips match the current search and filter combination."
                onResetFilters={clearAllFilters}
                onRowClick={openRow}
                rowAriaLabel={(row) => `Open trip ${row.tripAdviceCode}`}
                tableClassName="min-w-[760px] xl:min-w-[1320px]"
              />
            </div>
            <footer className="flex flex-col gap-3 border-t border-navy-200 p-3 text-xs text-navy-600 dark:border-carbon-800 dark:text-carbon-300 sm:flex-row sm:items-center sm:justify-between">
              <span aria-live="polite">
                Showing {resultStart}-{resultEnd} of {totalCount} records
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 font-semibold">
                  Rows per page
                  <select
                    aria-label="Rows per page"
                    className={`${uiClasses.field} h-9 min-h-9 w-20 py-1 text-xs`}
                    onChange={(event) => updateQueryParam('limit', event.target.value)}
                    value={currentLimit}
                  >
                    {availablePageSizes.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  aria-label="Previous page"
                  disabled={!pageResult?.previous}
                  icon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}
                  onClick={() => updateQueryParam('page', String(Math.max(1, currentPage - 1)))}
                  size="icon"
                  variant="secondary"
                />
                <span className="min-w-24 text-center font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  aria-label="Next page"
                  disabled={!pageResult?.next}
                  icon={<ChevronRight aria-hidden="true" className="h-4 w-4" />}
                  onClick={() => updateQueryParam('page', String(currentPage + 1))}
                  size="icon"
                  variant="secondary"
                />
              </div>
            </footer>
          </div>
        )}
      </section>
      {quickTripId && (
        <TripQuickDetailsPanel
          key={quickTripId}
          onClose={closeQuickDetails}
          onOpenFullDetails={(section) => onOpenTrip(quickTripId, section)}
          tripId={quickTripId}
          variant={isCompactViewport ? 'sheet' : 'panel'}
        />
      )}
    </div>
  );
};
