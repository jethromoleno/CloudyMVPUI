import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  RefreshCw,
  Truck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  normalizeServiceError,
  services,
  type ServiceError,
  type TripDetailsService,
  type TripQuickDetails,
} from '../services';
import { permissionActions, permissionResources, usePermissions } from '../permissions';
import { Button, ErrorState, LoadingState, PermissionDeniedState, StatusBadge, SurfaceState } from './ui';

interface TripQuickDetailsPanelProps {
  onClose: () => void;
  onOpenFullDetails: (section?: string) => void;
  service?: TripDetailsService;
  tripId: string;
  /** Desktop side panel vs mobile bottom sheet. Defaults to panel. */
  variant?: 'panel' | 'sheet';
}

const formatDate = (value: string | null) => {
  if (!value) return 'Unavailable';
  const parsed = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Manila',
    year: 'numeric',
  }).format(parsed);
};

const formatDateTime = (value: string | null) => {
  if (!value) return 'Unavailable';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    timeZone: 'Asia/Manila',
    year: 'numeric',
  }).format(parsed);
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Fact: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="rounded-lg border border-navy-100 bg-navy-50/65 p-3 dark:border-carbon-800 dark:bg-carbon-950/45">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500 dark:text-carbon-400">
      {icon}
      <span>{label}</span>
    </div>
    <div className="mt-1.5 text-sm font-semibold leading-5 text-navy-900 dark:text-white">{value}</div>
  </div>
);

const InitialError: React.FC<{ error: ServiceError; onRetry: () => void }> = ({ error, onRetry }) => {
  if (error.kind === 'authentication') {
    return (
      <SurfaceState
        className="min-h-64 border-0 shadow-none"
        description="Sign in again to load this protected trip summary."
        title="Authentication required"
      />
    );
  }
  if (error.kind === 'authorization') {
    return (
      <PermissionDeniedState
        className="min-h-64 border-0 shadow-none"
        description="The service denied this trip-detail request. No protected detail fields were rendered."
      />
    );
  }
  if (error.kind === 'not_found') {
    return (
      <SurfaceState
        action={
          <Button onClick={onRetry} size="sm" variant="secondary">
            Retry
          </Button>
        }
        className="min-h-64 border-0 shadow-none"
        description="The selected trip is invalid, unavailable, or no longer present in this development snapshot."
        title="Trip not found"
      />
    );
  }
  return (
    <ErrorState
      className="min-h-64 border-0 shadow-none"
      description={error.message}
      onRetry={onRetry}
      title="Quick Details unavailable"
    />
  );
};

export const TripQuickDetailsPanel: React.FC<TripQuickDetailsPanelProps> = ({
  onClose,
  onOpenFullDetails,
  service = services.tripDetails,
  tripId,
  variant = 'panel',
}) => {
  const permissions = usePermissions();
  const [details, setDetails] = useState<TripQuickDetails | null>(null);
  const [error, setError] = useState<ServiceError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<{ controller: AbortController; id: number } | null>(null);
  const requestSequenceRef = useRef(0);
  const detailsRef = useRef(details);

  useEffect(() => {
    detailsRef.current = details;
  }, [details]);

  const load = useCallback(
    async (kind: 'initial' | 'refresh', abortPrevious: boolean) => {
      if (requestRef.current) {
        if (!abortPrevious) return;
        requestRef.current.controller.abort();
      }
      const controller = new AbortController();
      const id = ++requestSequenceRef.current;
      requestRef.current = { controller, id };
      setError(null);
      if (detailsRef.current) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const result = await service.getQuickDetails(tripId, {
          forceRefresh: kind === 'refresh',
          signal: controller.signal,
        });
        if (requestRef.current?.id !== id || controller.signal.aborted) return;
        setDetails(result);
        detailsRef.current = result;
      } catch (requestError) {
        const normalized = normalizeServiceError(requestError);
        if (requestRef.current?.id !== id || normalized.kind === 'cancelled') return;
        setError(normalized);
      } finally {
        if (requestRef.current?.id === id) {
          requestRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [service, tripId],
  );

  useEffect(() => {
    setDetails(null);
    detailsRef.current = null;
    void load('initial', true);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      requestRef.current?.controller.abort();
      requestRef.current = null;
    };
  }, [load, tripId]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) void load('refresh', false);
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [load]);

  useEffect(() => {
    if (variant !== 'sheet') return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const appRoot = document.getElementById('root');
    appRoot?.setAttribute('inert', '');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = Array.from(sheetRef.current.querySelectorAll(focusableSelector)) as HTMLElement[];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      appRoot?.removeAttribute('inert');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [variant]);

  const needsAssignment = Boolean(
    details && (!details.assignments.driver.id || !details.assignments.truck.id),
  );
  const statusCode = details?.status.code ?? null;
  const canOfferTransition = Boolean(
    statusCode && !['COMPLETED', 'CANCELLED'].includes(statusCode),
  );
  const assignPresentation = permissions.present(permissionActions.assign, permissionResources.tripAssignments, {
    recordState: statusCode,
  });
  const transitionPresentation = permissions.present(
    permissionActions.statusChange,
    permissionResources.tripAdvice,
    {
      recordState: statusCode,
    },
  );

  const header = (
    <header className="border-b border-navy-200 p-4 dark:border-carbon-800">
      {variant === 'sheet' && (
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-navy-200 dark:bg-carbon-700" aria-hidden="true" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
            Quick Details
          </p>
          <h2 id="trip-quick-details-title" className="mt-1 truncate text-xl font-bold text-navy-950 dark:text-white">
            {details?.tripAdviceCode || 'Loading trip...'}
          </h2>
        </div>
        <Button
          ref={closeButtonRef}
          aria-label="Close Quick Details"
          icon={<X aria-hidden="true" className="h-5 w-5" />}
          onClick={onClose}
          size="icon"
          title="Close Quick Details (Escape)"
          variant="ghost"
        />
      </div>
      {details?.status.code && (
        <StatusBadge className="mt-3" label={details.status.label ?? undefined} status={details.status.code} />
      )}
    </header>
  );

  const body = (
    <div aria-label="Scrollable Quick Details content" className="min-h-0 flex-1 overflow-y-auto p-4" tabIndex={0}>
      {isLoading && !details ? (
        <LoadingState className="min-h-64 border-0 shadow-none" label="Loading Quick Details..." />
      ) : error && !details ? (
        <InitialError error={error} onRetry={() => void load('refresh', true)} />
      ) : details ? (
        <div className="space-y-4">
          {error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
              role="alert"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Refresh failed: {error.message} The last safe trip summary remains visible.</span>
            </div>
          )}

          <div className="grid gap-2">
            <Fact
              icon={<UserRound aria-hidden="true" className="h-4 w-4" />}
              label="Client"
              value={details.client.label ?? 'Unavailable'}
            />
            <Fact
              icon={<UsersRound aria-hidden="true" className="h-4 w-4" />}
              label="Consignee"
              value={details.consignee.label ?? 'Unavailable'}
            />
            <Fact
              icon={<MapPin aria-hidden="true" className="h-4 w-4" />}
              label="Route"
              value={
                details.route.origin.label || details.route.destination.label
                  ? `${details.route.origin.label ?? 'Unavailable'} → ${details.route.destination.label ?? 'Unavailable'}`
                  : 'Unavailable'
              }
            />
            <Fact
              icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />}
              label="Pickup"
              value={`${formatDate(details.pickupDate)} · ${details.pickupWindow ?? 'Window unavailable'}`}
            />
            <Fact
              icon={<Truck aria-hidden="true" className="h-4 w-4" />}
              label="Current truck"
              value={details.assignments.truck.label ?? 'Unassigned'}
            />
            <Fact
              icon={<UserRound aria-hidden="true" className="h-4 w-4" />}
              label="Current driver"
              value={details.assignments.driver.label ?? 'Unassigned'}
            />
          </div>

          {details.assignments.helpers.length > 0 && (
            <Fact
              icon={<UsersRound aria-hidden="true" className="h-4 w-4" />}
              label="Helpers"
              value={details.assignments.helpers.map((helper) => helper.label ?? 'Unavailable').join(', ')}
            />
          )}
        </div>
      ) : null}
    </div>
  );

  const footer = (
    <footer className="border-t border-navy-200 p-4 dark:border-carbon-800">
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-navy-500 dark:text-carbon-400">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          {details ? `Fetched ${formatDateTime(details.freshness.fetchedAt)}` : 'Freshness pending'}
        </span>
        <Button
          aria-label="Refresh Quick Details"
          disabled={!details && isLoading}
          icon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}
          isLoading={isRefreshing}
          onClick={() => void load('refresh', false)}
          size="icon"
          variant="ghost"
        />
      </div>
      {details && (
        <div className="mb-2 flex flex-wrap gap-2">
          {needsAssignment && assignPresentation.visible && (
            <Button
              className="flex-1"
              disabled={assignPresentation.disabled}
              onClick={() => onOpenFullDetails('assignments')}
              size="sm"
              title={assignPresentation.reason ?? undefined}
              variant="secondary"
            >
              Assign resources
            </Button>
          )}
          {canOfferTransition && transitionPresentation.visible && (
            <Button
              className="flex-1"
              disabled={transitionPresentation.disabled}
              onClick={() => onOpenFullDetails('overview')}
              size="sm"
              title={transitionPresentation.reason ?? 'Open status actions on trip details'}
              variant="secondary"
            >
              Update status
            </Button>
          )}
        </div>
      )}
      <Button
        className="w-full"
        disabled={!details}
        onClick={() => onOpenFullDetails()}
        trailingIcon={<ExternalLink aria-hidden="true" className="h-4 w-4" />}
      >
        Open Full Details
      </Button>
    </footer>
  );

  if (variant === 'sheet') {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-navy-950/55 backdrop-blur-[1px]"
          onClick={onClose}
        />
        <div
          aria-labelledby="trip-quick-details-title"
          aria-modal="true"
          className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-navy-200 bg-white shadow-2xl dark:border-carbon-800 dark:bg-carbon-900"
          ref={sheetRef}
          role="dialog"
        >
          {header}
          {body}
          {footer}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <aside
      aria-labelledby="trip-quick-details-title"
      className="flex h-full w-[min(420px,48vw)] shrink-0 flex-col overflow-hidden border-l border-navy-200 bg-white shadow-[-14px_0_28px_-24px_rgba(15,23,42,0.55)] dark:border-carbon-800 dark:bg-carbon-900"
    >
      {header}
      {body}
      {footer}
    </aside>
  );
};
