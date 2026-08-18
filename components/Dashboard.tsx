import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, CalendarClock, CheckCircle2, Clock3, RefreshCw, Truck, Users } from 'lucide-react';
import { usePermissions } from '../permissions';
import {
  normalizeServiceError,
  type DispatcherDashboardSnapshot,
  type ManagerAnalyticsSnapshot,
  type OperationalAttentionSnapshot,
} from '../services/contracts';
import { services } from '../services';
import { Button, DataTable, type DataTableColumn, ErrorState, LoadingState, SearchInput, StatusBadge } from './ui';

interface DashboardProps {
  onViewTripDetail?: (tripId: string | number) => void;
}

const POLL_INTERVAL_MS = 60_000;

const Metric = ({ icon, label, value, detail }: { icon: ReactNode; label: string; value: number; detail: string }) => (
  <article className="rounded-xl border border-navy-200 bg-white p-4 dark:border-carbon-800 dark:bg-carbon-900">
    <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-navy-500 dark:text-carbon-400">
      <span>{label}</span>
      {icon}
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <strong className="text-2xl text-navy-900 dark:text-white">{value}</strong>
      <span className="text-xs text-navy-500 dark:text-carbon-400">{detail}</span>
    </div>
  </article>
);

const Availability = ({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ label: string; value: number; tone: string }>;
}) => (
  <section className="rounded-xl border border-navy-200 bg-white p-5 dark:border-carbon-800 dark:bg-carbon-900">
    <h2 className="border-b border-navy-100 pb-2 text-sm font-bold uppercase tracking-wide text-navy-900 dark:border-carbon-800 dark:text-white">
      {title}
    </h2>
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {entries.map((entry) => (
        <div className="rounded-lg bg-navy-50 p-3 dark:bg-carbon-950" key={entry.label}>
          <dt className="flex items-center gap-1.5 text-xs text-navy-600 dark:text-carbon-300">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${entry.tone}`} />
            {entry.label}
          </dt>
          <dd className="mt-1 text-xl font-bold text-navy-900 dark:text-white">{entry.value}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const formatSnapshotTime = (value: string | null) => {
  if (!value) return 'Not yet refreshed';
  return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(
    new Date(value),
  );
};

const Dashboard = ({ onViewTripDetail }: DashboardProps) => {
  const permissions = usePermissions();
  const manager = permissions.identity.role === 'Admin' || permissions.identity.role === 'SuperAdmin';
  const [snapshot, setSnapshot] = useState<DispatcherDashboardSnapshot | null>(null);
  const [analytics, setAnalytics] = useState<ManagerAnalyticsSnapshot | null>(null);
  const [attention, setAttention] = useState<OperationalAttentionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const refresh = useCallback(
    async (manual = false) => {
      if (manual) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const [next, managerSnapshot, attentionSnapshot] = await Promise.all([
          services.dashboard.getSnapshot({ forceRefresh: manual }),
          manager ? services.managerAnalytics.getSnapshot({ forceRefresh: manual }) : Promise.resolve(null),
          services.operationalAttention.getSnapshot({ forceRefresh: manual }),
        ]);
        setSnapshot(next);
        setAnalytics(managerSnapshot);
        setAttention(attentionSnapshot);
        setError(null);
      } catch (cause) {
        setError(normalizeServiceError(cause).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [manager],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const poll = () => {
      if (!document.hidden) void refresh();
    };
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', poll);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [refresh]);

  const activeTrips = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!snapshot || !search) return snapshot?.activeTrips ?? [];
    return snapshot.activeTrips.filter((trip) =>
      [trip.tripAdviceCode, trip.clientLabel, trip.routeLabel, trip.truckLabel, trip.driverLabel, trip.statusLabel]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }, [query, snapshot]);

  const columns: DataTableColumn<DispatcherDashboardSnapshot['activeTrips'][number]>[] = [
    { key: 'trip', header: 'Trip', cell: (trip) => <span className="font-mono font-bold">{trip.tripAdviceCode}</span> },
    { key: 'client', header: 'Client', cell: (trip) => trip.clientLabel },
    {
      key: 'pickup',
      header: 'Pickup',
      cell: (trip) => (
        <div className="space-y-1">
          <div>{trip.pickupDate}</div>
          {trip.pickupWindow && <div className="text-xs text-navy-500 dark:text-carbon-400">{trip.pickupWindow}</div>}
          {trip.plannedStartPassed && (
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">Planned start passed</div>
          )}
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      cell: (trip) => <span className="block max-w-56 truncate">{trip.routeLabel}</span>,
    },
    {
      key: 'resources',
      header: 'Resources',
      cell: (trip) => `${trip.truckLabel ?? 'Unassigned'} · ${trip.driverLabel ?? 'Unassigned'}`,
    },
    { key: 'status', header: 'Status', cell: (trip) => <StatusBadge status={trip.statusLabel} /> },
  ];

  if (isLoading && !snapshot) return <LoadingState className="m-8" label="Loading dispatcher dashboard snapshot" />;
  if (!snapshot && error)
    return (
      <ErrorState
        className="m-8"
        description={error}
        onRetry={() => void refresh(true)}
        title="Dashboard unavailable"
      />
    );
  if (!snapshot) return null;

  const dispatcher = permissions.identity.role === 'Dispatcher';
  return (
    <div className="h-full space-y-6 overflow-y-auto bg-navy-50 p-6 dark:bg-carbon-950">
      <header className="flex flex-col gap-4 border-b border-navy-200 pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-carbon-800">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Dispatcher Dashboard</h1>
          <p className="mt-1 text-sm text-navy-600 dark:text-carbon-300">
            {dispatcher
              ? 'Current dispatch queue and resource availability.'
              : 'Operational dashboard read-only snapshot.'}
          </p>
          <p className="mt-2 text-xs text-navy-500 dark:text-carbon-400">
            Snapshot as of {snapshot.asOf.slice(0, 10)}. Counts reflect the latest local adapter refresh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-navy-500 dark:text-carbon-400">
            Updated {formatSnapshotTime(snapshot.refreshedAt)}
          </span>
          <Button
            disabled={isRefreshing}
            icon={<RefreshCw aria-hidden="true" className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={() => void refresh(true)}
            size="sm"
          >
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </header>

      <div aria-live="polite" className="sr-only">
        {isRefreshing
          ? 'Refreshing dispatcher dashboard'
          : `Dashboard updated ${formatSnapshotTime(snapshot.refreshedAt)}`}
      </div>
      {error && (
        <ErrorState
          description={`${error} Showing the last successful snapshot.`}
          onRetry={() => void refresh(true)}
          title="Refresh failed"
        />
      )}

      {attention && (
        <section
          aria-label="Operational attention"
          className="rounded-xl border border-navy-200 bg-white p-5 dark:border-carbon-800 dark:bg-carbon-900"
        >
          <div className="border-b border-navy-100 pb-3 dark:border-carbon-800">
            <h2 className="font-bold text-navy-900 dark:text-white">Operational attention</h2>
            <p className="mt-1 text-sm text-navy-500 dark:text-carbon-400">
              Conditions that need a dispatcher decision right now.
            </p>
          </div>
          {attention.items.length === 0 ? (
            <p className="py-5 text-sm text-navy-500 dark:text-carbon-400">
              No attention conditions are present in this snapshot.
            </p>
          ) : (
            <ul className="divide-y divide-navy-100 dark:divide-carbon-800">
              {attention.items.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <button
                    className="flex w-full flex-col gap-1 py-3 text-left hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-carbon-800/40"
                    onClick={() => onViewTripDetail?.(item.id)}
                    type="button"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-navy-900 dark:text-white">
                        {item.tripAdviceCode}
                      </span>
                      <StatusBadge
                        label={
                          item.kind === 'ACTIVE_EXCEPTION_STATUS' ? 'Active exception status' : 'Planned start passed'
                        }
                        status={item.statusLabel}
                      />
                    </span>
                    <span className="text-sm text-navy-700 dark:text-carbon-200">
                      {item.clientLabel} - {item.factualReason}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-xl border border-navy-200 bg-white dark:border-carbon-800 dark:bg-carbon-900">
        <div className="flex flex-col gap-3 border-b border-navy-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-carbon-800">
          <div>
            <h2 className="font-bold text-navy-900 dark:text-white">Active dispatch queue</h2>
            <p className="text-sm text-navy-500 dark:text-carbon-400">Open a trip to inspect its authorized details.</p>
          </div>
          <SearchInput
            aria-label="Search active dispatch queue"
            placeholder="Trip, client, route, or resource"
            value={query}
            onChange={setQuery}
          />
        </div>
        <div className="overflow-x-auto">
          <DataTable
            caption="Active dispatch queue"
            columns={columns}
            data={activeTrips}
            getRowKey={(trip) => trip.id}
            isFiltered={Boolean(query)}
            noResultsDescription="No active dispatch trips match the current search. Clear the search to view the queue."
            onResetFilters={() => setQuery('')}
            onRowClick={(trip) => onViewTripDetail?.(trip.id)}
            rowAriaLabel={(trip) => `Open trip ${trip.tripAdviceCode}`}
          />
        </div>
      </section>

      <details className="rounded-xl border border-navy-200 bg-white open:pb-0 dark:border-carbon-800 dark:bg-carbon-900">
        <summary className="cursor-pointer list-none p-5 font-bold text-navy-900 marker:content-none dark:text-white [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            <span>Fleet snapshot</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-carbon-400">
              Totals and availability
            </span>
          </span>
        </summary>
        <div className="space-y-6 border-t border-navy-100 p-5 dark:border-carbon-800">
          <section aria-label="Dispatch totals" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Metric
              detail="pickup date"
              icon={<CalendarClock aria-hidden="true" className="h-4 w-4 text-blue-500" />}
              label="Trips today"
              value={snapshot.tripsToday}
            />
            <Metric
              detail="awaiting dispatch"
              icon={<Clock3 aria-hidden="true" className="h-4 w-4 text-amber-500" />}
              label="Scheduled"
              value={snapshot.scheduledTrips}
            />
            <Metric
              detail="active trips"
              icon={<Activity aria-hidden="true" className="h-4 w-4 text-cyan-500" />}
              label="In progress"
              value={snapshot.inProgressTrips}
            />
            <Metric
              detail="last seven days"
              icon={<CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-500" />}
              label="Completed"
              value={snapshot.completedThisWeek}
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <Availability
              entries={[
                { label: 'Available', value: snapshot.truckAvailability.available, tone: 'bg-emerald-500' },
                { label: 'In use', value: snapshot.truckAvailability.inUse, tone: 'bg-cyan-500' },
                { label: 'Maintenance', value: snapshot.truckAvailability.maintenance, tone: 'bg-amber-500' },
                { label: 'Unavailable', value: snapshot.truckAvailability.unavailable, tone: 'bg-zinc-400' },
              ]}
              title={`Vehicle availability (${snapshot.truckAvailability.total})`}
            />
            <Availability
              entries={[
                { label: 'Available', value: snapshot.driverAvailability.available, tone: 'bg-emerald-500' },
                { label: 'Assigned', value: snapshot.driverAvailability.assigned, tone: 'bg-cyan-500' },
                { label: 'Unavailable', value: snapshot.driverAvailability.unavailable, tone: 'bg-amber-500' },
                { label: 'On leave', value: snapshot.driverAvailability.onLeave, tone: 'bg-zinc-400' },
              ]}
              title={`Driver availability (${snapshot.driverAvailability.total})`}
            />
          </div>
        </div>
      </details>

      {manager && analytics && (
        <section aria-label="Manager analytics" className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">Manager analytics</h2>
            <p className="text-sm text-navy-500 dark:text-carbon-400">
              Aggregate for {analytics.window.currentStart} to {analytics.window.currentEnd}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Metric
              detail={`previous window ${analytics.completedTrips.previous}`}
              icon={<CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-500" />}
              label="Completed trips"
              value={analytics.completedTrips.current}
            />
            <Metric
              detail="returned fuel records"
              icon={<Activity aria-hidden="true" className="h-4 w-4 text-cyan-500" />}
              label="Fuel quantity"
              value={analytics.fuelTotals.quantity}
            />
            <Metric
              detail="returned fuel records"
              icon={<CalendarClock aria-hidden="true" className="h-4 w-4 text-blue-500" />}
              label="Fuel cost"
              value={analytics.fuelTotals.cost}
            />
            <Metric
              detail="non-deleted trips"
              icon={<Users aria-hidden="true" className="h-4 w-4 text-navy-500" />}
              label="Client activity"
              value={analytics.clientActivity.length}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Availability
              entries={analytics.statusCounts.map((entry) => ({
                label: entry.status.replace(/_/g, ' '),
                value: entry.count,
                tone: 'bg-blue-500',
              }))}
              title="Trip status counts"
            />
            <Availability
              entries={analytics.clientActivity.map((entry) => ({
                label: entry.clientLabel,
                value: entry.tripCount,
                tone: 'bg-navy-500',
              }))}
              title="Most active clients"
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
