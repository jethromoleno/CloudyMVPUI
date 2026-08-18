import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Fuel,
  History,
  MapPin,
  RefreshCw,
  Route,
  Truck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  normalizeServiceError,
  services,
  TRIP_DETAIL_SECTIONS,
  type ServiceError,
  type TripActivitySection,
  type TripAssignmentsSection,
  type TripDetailsOverview,
  type TripDetailsService,
  type TripDetailSection,
  type TripEventsSection,
  type TripFuelSection,
  type TripStopsSection,
} from '../services';
import { BlockedState, Button, ErrorState, LoadingState, PermissionDeniedState, StatusBadge, SurfaceState } from './ui';
import { TripAssignmentWorkflow } from './TripAssignmentWorkflow';
import { TripTransitionWorkflow } from './TripTransitionWorkflow';

interface TripDetailsPageProps {
  onClose: () => void;
  service?: TripDetailsService;
  tripId: string;
}

type SecondarySectionData =
  TripStopsSection | TripAssignmentsSection | TripEventsSection | TripFuelSection | TripActivitySection;

const sectionLabels: Record<TripDetailSection, string> = {
  overview: 'Overview',
  stops: 'Stops',
  assignments: 'Assignments',
  events: 'Events',
  fuel: 'Fuel',
  activity: 'Activity',
};

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
    second: '2-digit',
    timeZone: 'Asia/Manila',
    year: 'numeric',
  }).format(parsed);
};

const formatMoney = (value: number | null) =>
  value === null ? 'Unavailable' : new Intl.NumberFormat('en-PH', { currency: 'PHP', style: 'currency' }).format(value);

const formatCodeLabel = (value: string) =>
  value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase()) || 'Unavailable';

const DetailFact: React.FC<{ label: string; value: React.ReactNode; note?: React.ReactNode }> = ({
  label,
  note,
  value,
}) => (
  <div className="min-w-0 rounded-lg border border-navy-100 bg-navy-50/55 p-3 dark:border-carbon-800 dark:bg-carbon-950/40">
    <dt className="text-[11px] font-semibold uppercase tracking-wide text-navy-500 dark:text-carbon-400">{label}</dt>
    <dd className="mt-1.5 break-words text-sm font-semibold leading-5 text-navy-900 dark:text-white">{value}</dd>
    {note && <dd className="mt-1 text-[11px] leading-4 text-navy-500 dark:text-carbon-400">{note}</dd>}
  </div>
);

const ReferenceValue: React.FC<{ active: boolean | null; label: string | null; fallback?: string }> = ({
  active,
  fallback = 'Unavailable',
  label,
}) => (
  <>
    {label ?? fallback}
    {active === false && (
      <span className="mt-1 block text-[11px] font-normal text-amber-700 dark:text-amber-300">
        Inactive historical reference
      </span>
    )}
  </>
);

const InitialDetailError: React.FC<{ error: ServiceError; onClose: () => void; onRetry: () => void }> = ({
  error,
  onClose,
  onRetry,
}) => {
  if (error.kind === 'authentication') {
    return (
      <SurfaceState
        action={<Button onClick={onClose}>Return to Trip Operations</Button>}
        description="Sign in again to load this protected trip. No protected detail fields were rendered."
        title="Authentication required"
      />
    );
  }
  if (error.kind === 'authorization') {
    return (
      <PermissionDeniedState
        action={<Button onClick={onClose}>Return to Trip Operations</Button>}
        description="The service denied this trip-detail request. No protected detail fields were rendered."
      />
    );
  }
  if (error.kind === 'not_found') {
    return (
      <SurfaceState
        action={<Button onClick={onClose}>Return to Trip Operations</Button>}
        description="The trip identifier is invalid, unavailable, or no longer present in this development snapshot."
        title="Trip not found"
      />
    );
  }
  return <ErrorState description={error.message} onRetry={onRetry} title="Trip Details unavailable" />;
};

const SectionCard: React.FC<{
  children: React.ReactNode;
  description?: string;
  icon: React.ReactNode;
  title: string;
}> = ({ children, description, icon, title }) => (
  <section className="rounded-xl border border-navy-200 bg-white shadow-sm dark:border-carbon-800 dark:bg-carbon-900">
    <header className="flex items-start gap-3 border-b border-navy-200 p-4 dark:border-carbon-800 sm:p-5">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-navy-950 dark:text-white">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-navy-500 dark:text-carbon-400">{description}</p>}
      </div>
    </header>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

const OverviewSection: React.FC<{ overview: TripDetailsOverview }> = ({ overview }) => (
  <div className="grid gap-4 xl:grid-cols-2">
    <SectionCard
      description="Canonical trip references. Missing joins remain explicitly unavailable."
      icon={<UserRound aria-hidden="true" className="h-5 w-5" />}
      title="Trip and client"
    >
      <dl className="grid gap-2 sm:grid-cols-2">
        <DetailFact
          label="Branch"
          value={<ReferenceValue active={overview.branch.active} label={overview.branch.label} />}
        />
        <DetailFact
          label="Encoder"
          value={<ReferenceValue active={overview.encoder.active} label={overview.encoder.label} />}
        />
        <DetailFact
          label="Client"
          value={<ReferenceValue active={overview.client.active} label={overview.client.label} />}
        />
        <DetailFact
          label="Internal client code"
          value={
            <ReferenceValue active={overview.internalClientCode.active} label={overview.internalClientCode.label} />
          }
        />
        <DetailFact
          label="Consignee"
          value={<ReferenceValue active={overview.consignee.active} label={overview.consignee.label} />}
        />
        <DetailFact label="Load type" value={overview.loadType.label ?? 'Unavailable'} />
      </dl>
    </SectionCard>

    <SectionCard
      description="Approved scheduling values only; the legacy scheduled-start alias is not promoted."
      icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
      title="Schedule and lineage"
    >
      <dl className="grid gap-2 sm:grid-cols-2">
        <DetailFact label="Pickup date" value={formatDate(overview.pickupDate)} />
        <DetailFact label="Pickup window" value={overview.pickupWindow ?? 'Unavailable'} />
        <DetailFact label="Planned start" value={formatDateTime(overview.plannedStartAt)} />
        <DetailFact label="Planned end" value={formatDateTime(overview.plannedEndAt)} />
        <DetailFact label="Transfer trip" value={overview.transfer.isTransfer ? 'Yes' : 'No'} />
        <DetailFact
          label="Source trip"
          value={
            overview.transfer.isTransfer ? (
              <ReferenceValue active={overview.transfer.sourceTrip.active} label={overview.transfer.sourceTrip.label} />
            ) : (
              'Not applicable'
            )
          }
        />
      </dl>
    </SectionCard>

    <SectionCard
      description="Current resources are projected only from unreleased trip-assignment rows."
      icon={<Truck aria-hidden="true" className="h-5 w-5" />}
      title="Current assignments"
    >
      <dl className="grid gap-2 sm:grid-cols-2">
        <DetailFact
          label="Assignment state"
          value={
            <StatusBadge label={overview.assignments.state.replaceAll('_', ' ')} status={overview.assignments.state} />
          }
        />
        <DetailFact
          label="Truck"
          value={
            <ReferenceValue
              active={overview.assignments.truck.active}
              fallback="Unassigned"
              label={overview.assignments.truck.label}
            />
          }
        />
        <DetailFact
          label="Driver"
          value={
            <ReferenceValue
              active={overview.assignments.driver.active}
              fallback="Unassigned"
              label={overview.assignments.driver.label}
            />
          }
        />
        <DetailFact
          label="Helpers"
          value={
            overview.assignments.helpers.length > 0
              ? overview.assignments.helpers.map((helper) => helper.label ?? 'Unavailable').join(', ')
              : 'Unassigned'
          }
        />
      </dl>
    </SectionCard>

    <SectionCard
      description="These are record timestamps and request freshness, not an audit trail."
      icon={<Clock3 aria-hidden="true" className="h-5 w-5" />}
      title="Record metadata"
    >
      <dl className="grid gap-2 sm:grid-cols-2">
        <DetailFact label="Created" value={formatDateTime(overview.createdAt)} />
        <DetailFact label="Updated" value={formatDateTime(overview.updatedAt)} />
        <DetailFact label="Version" value={overview.version ?? 'Unavailable'} />
        <DetailFact
          label="Development snapshot fetched"
          note="This does not claim durable or real-time production data."
          value={formatDateTime(overview.freshness.fetchedAt)}
        />
      </dl>
    </SectionCard>
  </div>
);

const StopsSection: React.FC<{ section: TripStopsSection }> = ({ section }) => (
  <SectionCard
    description="Ordered route facts only. No live tracking, distance, travel-time, or route-optimization claim."
    icon={<Route aria-hidden="true" className="h-5 w-5" />}
    title="Stops and route"
  >
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
      <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>
        {section.route.origin.label ?? 'Origin unavailable'} →{' '}
        {section.route.destination.label ?? 'Destination unavailable'}
      </span>
    </div>
    {section.items.length === 0 ? (
      <SurfaceState
        className="min-h-40 border-0 shadow-none"
        description="No stop records were returned for this trip."
        title="No stops available"
      />
    ) : (
      <ol className="space-y-3">
        {section.items.map((stop) => (
          <li
            key={stop.id}
            className="grid gap-3 rounded-lg border border-navy-200 p-4 dark:border-carbon-800 md:grid-cols-[auto_minmax(0,1fr)_minmax(180px,0.7fr)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white dark:bg-white dark:text-carbon-950">
              {stop.sequence}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge hideCue label={stop.typeLabel} status={stop.type} />
                <span className="font-bold text-navy-950 dark:text-white">
                  {stop.location.label ?? 'Location unavailable'}
                </span>
              </div>
              <p className="mt-2 text-sm text-navy-600 dark:text-carbon-300">
                {[stop.specificAddress, stop.address, stop.province, stop.region].filter(Boolean).join(' · ') ||
                  'Address unavailable'}
              </p>
              {stop.location.active === false && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Inactive historical location</p>
              )}
            </div>
            <dl className="grid gap-2 text-xs">
              <div>
                <dt className="font-semibold text-navy-500 dark:text-carbon-400">Scheduled</dt>
                <dd className="mt-0.5 text-navy-900 dark:text-white">{formatDateTime(stop.scheduledAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy-500 dark:text-carbon-400">Actual</dt>
                <dd className="mt-0.5 text-navy-900 dark:text-white">{formatDateTime(stop.actualAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    )}
  </SectionCard>
);

const AssignmentsSection: React.FC<{
  section: TripAssignmentsSection;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
}> = ({ section, plannedStartAt, plannedEndAt }) => (
  <SectionCard
    description="Legacy assignment rows remain read-only compatibility history. Phase 2D adds a separately typed development review workflow below."
    icon={<UsersRound aria-hidden="true" className="h-5 w-5" />}
    title="Assignment history"
  >
    {section.history.length === 0 ? (
      <SurfaceState
        className="min-h-40 border-0 shadow-none"
        description="No authoritative trip-assignment rows were returned."
        title="No assignment history"
      />
    ) : (
      <div className="overflow-x-auto" tabIndex={0} aria-label="Scrollable assignment history">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <caption className="sr-only">Trip assignment history</caption>
          <thead>
            <tr className="border-b border-navy-200 text-navy-500 dark:border-carbon-800 dark:text-carbon-400">
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2">Released</th>
              <th className="px-3 py-2">Actors / reason</th>
              <th className="px-3 py-2">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100 dark:divide-carbon-800">
            {section.history.map((entry) => (
              <tr key={entry.id}>
                <td className="px-3 py-3 font-semibold">{entry.role}</td>
                <td className="px-3 py-3">
                  <ReferenceValue active={entry.resource.active} label={entry.resource.label} />
                </td>
                <td className="px-3 py-3">{formatDateTime(entry.assignedAt)}</td>
                <td className="px-3 py-3">{entry.current ? 'Not released' : formatDateTime(entry.releasedAt)}</td>
                <td className="px-3 py-3">
                  <span className="block">Assigned by: {entry.assignedBy.label ?? 'Unavailable'}</span>
                  {!entry.current && (
                    <span className="mt-1 block">
                      Released by: {entry.releasedBy.label ?? 'Unavailable'}
                      {entry.releaseReason ? ` · ${entry.releaseReason}` : ''}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge
                    hideCue
                    label={entry.current ? 'Current' : 'Released'}
                    status={entry.current ? 'active' : 'inactive'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    <div className="mt-5">
      <TripAssignmentWorkflow plannedEndAt={plannedEndAt} plannedStartAt={plannedStartAt} tripId={section.tripId} />
    </div>
  </SectionCard>
);

const EventsSection: React.FC<{ section: TripEventsSection }> = ({ section }) => (
  <SectionCard
    description="Operational events returned by the development data service. No event mutation is available."
    icon={<History aria-hidden="true" className="h-5 w-5" />}
    title="Events"
  >
    {section.items.length === 0 ? (
      <SurfaceState
        className="min-h-40 border-0 shadow-none"
        description="No event records were returned for this trip."
        title="No events available"
      />
    ) : (
      <ol className="space-y-3">
        {section.items.map((event) => (
          <li key={event.id} className="rounded-lg border border-navy-200 p-4 dark:border-carbon-800">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h3 className="font-bold text-navy-950 dark:text-white">{formatCodeLabel(event.eventType)}</h3>
                <p className="mt-1 text-xs text-navy-500 dark:text-carbon-400">{formatDateTime(event.occurredAt)}</p>
              </div>
              <span className="text-xs font-semibold text-navy-600 dark:text-carbon-300">
                Recorded by {event.recordedBy.label ?? 'Unavailable'}
              </span>
            </div>
            {event.notes && <p className="mt-3 text-sm text-navy-700 dark:text-carbon-200">{event.notes}</p>}
            {event.documentNumber && (
              <p className="mt-2 text-xs text-navy-500 dark:text-carbon-400">
                Document reference: {event.documentNumber}
              </p>
            )}
          </li>
        ))}
      </ol>
    )}
  </SectionCard>
);

const FuelSection: React.FC<{ section: TripFuelSection }> = ({ section }) => (
  <SectionCard
    description="Returned fuel rows only. Totals are not billing, invoice, or cost-allocation claims."
    icon={<Fuel aria-hidden="true" className="h-5 w-5" />}
    title="Fuel"
  >
    <dl className="mb-4 grid gap-2 sm:grid-cols-2">
      <DetailFact
        label="Returned quantity total"
        value={`${section.totals.quantity.toFixed(2)} ${section.totals.unit}`}
      />
      <DetailFact label="Returned line-cost total" value={formatMoney(section.totals.cost)} />
    </dl>
    {section.items.length === 0 ? (
      <SurfaceState
        className="min-h-40 border-0 shadow-none"
        description="No fuel records were returned for this trip."
        title="No fuel records available"
      />
    ) : (
      <div className="overflow-x-auto" tabIndex={0} aria-label="Scrollable fuel records">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <caption className="sr-only">Trip fuel records</caption>
          <thead>
            <tr className="border-b border-navy-200 text-navy-500 dark:border-carbon-800 dark:text-carbon-400">
              <th className="px-3 py-2">Date / time</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Unit price</th>
              <th className="px-3 py-2">Returned line cost</th>
              <th className="px-3 py-2">Recorder / reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100 dark:divide-carbon-800">
            {section.items.map((record) => (
              <tr key={record.id}>
                <td className="px-3 py-3">{formatDateTime(record.occurredAt)}</td>
                <td className="px-3 py-3 font-semibold">
                  {record.quantity.toFixed(2)} {record.unit}
                </td>
                <td className="px-3 py-3">{formatMoney(record.unitPrice)}</td>
                <td className="px-3 py-3">{formatMoney(record.lineCost)}</td>
                <td className="px-3 py-3">
                  <span className="block">{record.recordedBy.label ?? 'Unavailable'}</span>
                  {record.referenceNumber && <span className="mt-1 block">{record.referenceNumber}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </SectionCard>
);

const ActivitySection: React.FC<{ section: TripActivitySection }> = ({ section }) => (
  <SectionCard
    description="Activity requires an approved trip-specific audit source."
    icon={<Activity aria-hidden="true" className="h-5 w-5" />}
    title="Activity"
  >
    {!section.supported ? (
      <BlockedState
        className="min-h-44 border-0 shadow-none"
        description={section.reason}
        title="Trip activity source unavailable"
      />
    ) : section.items.length === 0 ? (
      <SurfaceState className="min-h-40 border-0 shadow-none" title="No activity available" />
    ) : (
      <ol className="space-y-3">
        {section.items.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-navy-200 p-4 dark:border-carbon-800">
            <strong>{entry.action}</strong> · {formatDateTime(entry.occurredAt)} ·{' '}
            {entry.actor.label ?? 'Actor unavailable'}
            {entry.summary && <p className="mt-2">{entry.summary}</p>}
          </li>
        ))}
      </ol>
    )}
  </SectionCard>
);

export const TripDetailsPage: React.FC<TripDetailsPageProps> = ({
  onClose,
  service = services.tripDetails,
  tripId,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get('section') ?? searchParams.get('tab') ?? 'overview';
  const selectedSection: TripDetailSection = (TRIP_DETAIL_SECTIONS as readonly string[]).includes(requestedSection)
    ? (requestedSection as TripDetailSection)
    : 'overview';
  const [normalizationNotice, setNormalizationNotice] = useState<string | null>(null);
  const [overview, setOverview] = useState<TripDetailsOverview | null>(null);
  const [overviewError, setOverviewError] = useState<ServiceError | null>(null);
  const [sectionData, setSectionData] = useState<SecondarySectionData | null>(null);
  const [sectionDataKey, setSectionDataKey] = useState<Exclude<TripDetailSection, 'overview'> | null>(null);
  const [sectionError, setSectionError] = useState<ServiceError | null>(null);
  const [sectionErrorKey, setSectionErrorKey] = useState<Exclude<TripDetailSection, 'overview'> | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const overviewRef = useRef(overview);
  const overviewRequestRef = useRef<{ controller: AbortController; id: number } | null>(null);
  const sectionRequestRef = useRef<{ controller: AbortController; id: number } | null>(null);
  const sequenceRef = useRef(0);

  useEffect(() => {
    overviewRef.current = overview;
  }, [overview]);

  useEffect(() => {
    const legacyTab = searchParams.get('tab');
    const invalidSection = Boolean(searchParams.get('section')) && selectedSection !== requestedSection;
    const leakedQuick = searchParams.has('quick');
    if (!legacyTab && !invalidSection && !leakedQuick) return;
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    next.delete('quick');
    if (selectedSection === 'overview') next.delete('section');
    else next.set('section', selectedSection);
    if (legacyTab) setNormalizationNotice('The legacy tab address was normalized to the canonical section address.');
    else if (invalidSection) setNormalizationNotice('The unsupported detail section was reset to Overview.');
    setSearchParams(next, { replace: true });
  }, [requestedSection, searchParams, selectedSection, setSearchParams]);

  const loadOverview = useCallback(
    async (kind: 'initial' | 'refresh', abortPrevious: boolean) => {
      if (overviewRequestRef.current) {
        if (!abortPrevious) return;
        overviewRequestRef.current.controller.abort();
      }
      const controller = new AbortController();
      const id = ++sequenceRef.current;
      overviewRequestRef.current = { controller, id };
      setOverviewError(null);
      if (!overviewRef.current) setIsOverviewLoading(true);
      else setIsRefreshing(true);
      try {
        const result = await service.getOverview(tripId, {
          forceRefresh: kind === 'refresh',
          signal: controller.signal,
        });
        if (overviewRequestRef.current?.id !== id || controller.signal.aborted) return;
        setOverview(result);
        overviewRef.current = result;
      } catch (requestError) {
        const normalized = normalizeServiceError(requestError);
        if (overviewRequestRef.current?.id !== id || normalized.kind === 'cancelled') return;
        setOverviewError(normalized);
      } finally {
        if (overviewRequestRef.current?.id === id) {
          overviewRequestRef.current = null;
          setIsOverviewLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [service, tripId],
  );

  const loadSelectedSection = useCallback(
    async (section: Exclude<TripDetailSection, 'overview'>, kind: 'initial' | 'refresh', abortPrevious: boolean) => {
      if (sectionRequestRef.current) {
        if (!abortPrevious) return;
        sectionRequestRef.current.controller.abort();
      }
      const controller = new AbortController();
      const id = ++sequenceRef.current;
      sectionRequestRef.current = { controller, id };
      setSectionError(null);
      setSectionErrorKey(null);
      setIsSectionLoading(true);
      try {
        const options = { forceRefresh: kind === 'refresh', signal: controller.signal };
        const result =
          section === 'stops'
            ? await service.getStops(tripId, options)
            : section === 'assignments'
              ? await service.getAssignments(tripId, options)
              : section === 'events'
                ? await service.getEvents(tripId, options)
                : section === 'fuel'
                  ? await service.getFuel(tripId, options)
                  : await service.getActivity(tripId, options);
        if (sectionRequestRef.current?.id !== id || controller.signal.aborted) return;
        setSectionData(result);
        setSectionDataKey(section);
      } catch (requestError) {
        const normalized = normalizeServiceError(requestError);
        if (sectionRequestRef.current?.id !== id || normalized.kind === 'cancelled') return;
        setSectionError(normalized);
        setSectionErrorKey(section);
      } finally {
        if (sectionRequestRef.current?.id === id) {
          sectionRequestRef.current = null;
          setIsSectionLoading(false);
        }
      }
    },
    [service, tripId],
  );

  useEffect(() => {
    setOverview(null);
    overviewRef.current = null;
    setSectionData(null);
    setSectionDataKey(null);
    window.scrollTo({ top: 0 });
    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 0);
    void loadOverview('initial', true);
    return () => {
      window.clearTimeout(focusTimer);
      overviewRequestRef.current?.controller.abort();
      sectionRequestRef.current?.controller.abort();
      overviewRequestRef.current = null;
      sectionRequestRef.current = null;
    };
  }, [loadOverview, tripId]);

  useEffect(() => {
    setSectionData(null);
    setSectionDataKey(null);
    setSectionError(null);
    setSectionErrorKey(null);
    if (selectedSection === 'overview') {
      sectionRequestRef.current?.controller.abort();
      sectionRequestRef.current = null;
      setIsSectionLoading(false);
      return;
    }
    void loadSelectedSection(selectedSection, 'initial', true);
  }, [loadSelectedSection, selectedSection]);

  const refresh = useCallback(() => {
    void loadOverview('refresh', false);
    if (selectedSection !== 'overview') void loadSelectedSection(selectedSection, 'refresh', false);
  }, [loadOverview, loadSelectedSection, selectedSection]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refresh]);

  const selectSection = useCallback(
    (section: TripDetailSection) => {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      next.delete('quick');
      if (section === 'overview') next.delete('section');
      else next.set('section', section);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const handleSectionKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, section: TripDetailSection) => {
      const currentIndex = TRIP_DETAIL_SECTIONS.indexOf(section);
      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TRIP_DETAIL_SECTIONS.length;
      if (event.key === 'ArrowLeft')
        nextIndex = (currentIndex - 1 + TRIP_DETAIL_SECTIONS.length) % TRIP_DETAIL_SECTIONS.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = TRIP_DETAIL_SECTIONS.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      const nextSection = TRIP_DETAIL_SECTIONS[nextIndex];
      selectSection(nextSection);
      const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      window.setTimeout(() => tabs?.[nextIndex]?.focus(), 0);
    },
    [selectSection],
  );

  const renderedSecondarySection = useMemo(() => {
    if (selectedSection === 'overview' || !sectionData || sectionDataKey !== selectedSection) return null;
    if (selectedSection === 'stops') return <StopsSection section={sectionData as TripStopsSection} />;
    if (selectedSection === 'assignments')
      return (
        <AssignmentsSection
          plannedEndAt={overview?.plannedEndAt ?? null}
          plannedStartAt={overview?.plannedStartAt ?? null}
          section={sectionData as TripAssignmentsSection}
        />
      );
    if (selectedSection === 'events') return <EventsSection section={sectionData as TripEventsSection} />;
    if (selectedSection === 'fuel') return <FuelSection section={sectionData as TripFuelSection} />;
    return <ActivitySection section={sectionData as TripActivitySection} />;
  }, [overview?.plannedEndAt, overview?.plannedStartAt, sectionData, sectionDataKey, selectedSection]);

  if (isOverviewLoading && !overview) {
    return (
      <div className="h-full overflow-y-auto bg-navy-50 p-4 dark:bg-carbon-950 sm:p-8">
        <LoadingState className="mx-auto min-h-80 max-w-3xl" label="Loading Trip Details..." />
      </div>
    );
  }

  if (overviewError && !overview) {
    return (
      <div className="h-full overflow-y-auto bg-navy-50 p-4 dark:bg-carbon-950 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <InitialDetailError
            error={overviewError}
            onClose={onClose}
            onRetry={() => void loadOverview('refresh', true)}
          />
        </div>
      </div>
    );
  }

  return (
    <main className="h-full overflow-y-auto bg-navy-50 dark:bg-carbon-950" aria-labelledby="trip-details-title">
      <div className="mx-auto max-w-[1500px] p-3 sm:p-5 lg:p-7">
        <header className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm dark:border-carbon-800 dark:bg-carbon-900 sm:p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <Button
                icon={<ArrowLeft aria-hidden="true" className="h-4 w-4" />}
                onClick={onClose}
                size="sm"
                variant="ghost"
              >
                Back to Trip Operations
              </Button>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1
                  ref={titleRef}
                  id="trip-details-title"
                  className="break-words text-2xl font-bold text-navy-950 outline-none dark:text-white sm:text-3xl"
                  tabIndex={-1}
                >
                  {overview?.tripAdviceCode ?? 'Trip Details'}
                </h1>
                {overview?.status.code && (
                  <StatusBadge label={overview.status.label ?? undefined} status={overview.status.code} />
                )}
              </div>
              <p className="mt-2 text-sm text-navy-500 dark:text-carbon-400">
                Read-only operational details from the typed development service boundary.
              </p>
            </div>
            <Button
              icon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}
              isLoading={isRefreshing || isSectionLoading}
              onClick={refresh}
              variant="secondary"
            >
              Refresh details
            </Button>
          </div>

          {normalizationNotice && (
            <div
              className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
              role="status"
            >
              {normalizationNotice} The remaining list-return context was preserved.
            </div>
          )}

          <nav className="mt-5 overflow-x-auto">
            <div
              aria-label="Trip Details sections"
              className="flex min-w-max gap-1 border-b border-navy-200 dark:border-carbon-800"
              role="tablist"
            >
              {TRIP_DETAIL_SECTIONS.map((section) => (
                <button
                  key={section}
                  type="button"
                  aria-controls={`trip-details-panel-${section}`}
                  aria-selected={selectedSection === section}
                  className={[
                    'min-h-11 rounded-t-lg border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500',
                    selectedSection === section
                      ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200'
                      : 'border-transparent text-navy-600 hover:bg-navy-50 hover:text-navy-950 dark:text-carbon-300 dark:hover:bg-carbon-800 dark:hover:text-white',
                  ].join(' ')}
                  id={`trip-details-tab-${section}`}
                  onClick={() => selectSection(section)}
                  onKeyDown={(event) => handleSectionKeyDown(event, section)}
                  role="tab"
                  tabIndex={selectedSection === section ? 0 : -1}
                >
                  {sectionLabels[section]}
                </button>
              ))}
            </div>
          </nav>
        </header>

        <div className="mt-4 space-y-4">
          {overviewError && overview && (
            <div
              className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
              role="alert"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Overview refresh failed: {overviewError.message} The last safe overview remains visible.</span>
            </div>
          )}

          {selectedSection === 'overview' && overview && (
            <div
              aria-labelledby="trip-details-tab-overview"
              id="trip-details-panel-overview"
              role="tabpanel"
            >
              <OverviewSection overview={overview} />
              <div className="mt-4">
                <TripTransitionWorkflow tripId={overview.id} />
              </div>
            </div>
          )}

          {selectedSection !== 'overview' && (
            <div
              aria-labelledby={`trip-details-tab-${selectedSection}`}
              aria-live="polite"
              id={`trip-details-panel-${selectedSection}`}
              role="tabpanel"
            >
              {isSectionLoading && (!sectionData || sectionDataKey !== selectedSection) ? (
                <LoadingState className="min-h-56" label={`Loading ${sectionLabels[selectedSection]}...`} />
              ) : sectionError && sectionErrorKey === selectedSection ? (
                sectionError.kind === 'authorization' ? (
                  <PermissionDeniedState
                    description={`The service denied the ${sectionLabels[selectedSection]} request. The selected section address is unchanged.`}
                  />
                ) : (
                  <ErrorState
                    description={`${sectionError.message} The selected section address is unchanged.`}
                    onRetry={() => void loadSelectedSection(selectedSection, 'refresh', true)}
                    title={`${sectionLabels[selectedSection]} unavailable`}
                  />
                )
              ) : (
                renderedSecondarySection
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
