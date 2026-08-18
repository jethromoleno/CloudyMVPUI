import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBeforeUnload, useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { permissionActions, permissionContextForTrip, permissionResources, usePermissions } from '../permissions';
import {
  normalizeServiceError,
  services,
  type ServiceError,
  type TripFormInitialization,
  type TripFormStopInput,
} from '../services';
import { tripDetailPath, routePaths } from '../routes';
import type { Trip, Theme } from '../types';
import { uiClasses } from '../design/tokens';
import { Button, ConfirmDialog } from './ui';

interface TripFormPageProps {
  mode: 'create' | 'edit';
  tripId?: string;
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  theme: Theme;
}

const emptyInitialization = (mode: 'create' | 'edit'): TripFormInitialization => ({
  mode,
  tripId: null,
  values: {
    tripAdviceCode: '',
    encoderEmployeeId: '',
    branchId: '',
    clientId: '',
    loadTypeCode: '',
    saveIntent: 'DRAFT',
    plannedStartAt: '',
    plannedEndAt: '',
    isTransfer: false,
    stops: [],
  },
  lookups: {
    employees: [],
    branches: [],
    clients: [],
    internalClientCodes: [],
    consignees: [],
    loadTypes: [],
    locations: [],
    transferSources: [],
  },
  version: null,
  readOnlyAssignments: { driverLabel: null, truckLabel: null, helperLabels: [] },
  metadata: { createdAt: null, updatedAt: null },
  source: 'development-mock',
});

const FormPage: React.FC<TripFormPageProps> = ({ mode, tripId, setTrips }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ tripId?: string }>();
  const resolvedTripId = tripId ?? params.tripId;
  const permissions = usePermissions();
  const [initialization, setInitialization] = useState<TripFormInitialization>(() => emptyInitialization(mode));
  const [values, setValues] = useState(initialization.values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serviceError, setServiceError] = useState<ServiceError | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const baseline = useRef('');
  const controllerRef = useRef<AbortController | null>(null);
  const returnPath = useMemo(() => `${routePaths.trips}${location.search}`, [location.search]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    setLoading(true);
    setServiceError(null);
    const task =
      mode === 'edit' && resolvedTripId
        ? services.tripEditor.initializeEdit(resolvedTripId, { signal: controller.signal })
        : services.tripEditor.initializeCreate({ signal: controller.signal });
    void task
      .then((result) => {
        if (controller.signal.aborted) return;
        setInitialization(result);
        const nextValues =
          mode === 'create' && !result.values.encoderEmployeeId
            ? { ...result.values, encoderEmployeeId: permissions.identity.user?.employee_id ?? '' }
            : result.values;
        setValues(nextValues);
        baseline.current = JSON.stringify(nextValues);
        setDirty(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setServiceError(normalizeServiceError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mode, resolvedTripId, permissions.identity.user?.employee_id]);

  useEffect(() => {
    setDirty(Boolean(baseline.current) && baseline.current !== JSON.stringify(values));
  }, [values]);

  useBeforeUnload(
    (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    },
    { capture: true },
  );

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !confirmLeave &&
      `${currentLocation.pathname}${currentLocation.search}` !== `${nextLocation.pathname}${nextLocation.search}`,
  );

  useEffect(() => {
    if (blocker.state === 'blocked') setConfirmLeave(true);
  }, [blocker.state]);

  const presentation = permissions.present(
    mode === 'create' ? permissionActions.create : permissionActions.update,
    permissionResources.tripAdvice,
    mode === 'edit'
      ? permissionContextForTrip({
          encoder_employee_id: initialization.values.encoderEmployeeId,
          status: initialization.values.saveIntent,
          is_draft: initialization.values.saveIntent === 'DRAFT',
        })
      : undefined,
  );

  const update = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const updateStop = (id: string, patch: Partial<TripFormStopInput>) => {
    setValues((current) => ({
      ...current,
      stops: current.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    }));
  };

  const addStop = () =>
    setValues((current) => ({
      ...current,
      stops: [
        ...current.stops,
        {
          id: `temp-stop-${Date.now()}`,
          sequence: current.stops.length + 1,
          type: 'PICKUP',
          locationId: '',
          specificAddress: '',
        },
      ],
    }));
  const removeStop = (id: string) =>
    setValues((current) => ({
      ...current,
      stops: current.stops.filter((stop) => stop.id !== id).map((stop, index) => ({ ...stop, sequence: index + 1 })),
    }));
  const moveStop = (index: number, direction: -1 | 1) =>
    setValues((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.stops.length) return current;
      const stops = [...current.stops];
      [stops[index], stops[nextIndex]] = [stops[nextIndex], stops[index]];
      return { ...current, stops: stops.map((stop, position) => ({ ...stop, sequence: position + 1 })) };
    });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.tripAdviceCode.trim()) next.tripAdviceCode = 'Trip advice code is required.';
    if (!values.encoderEmployeeId) next.encoderEmployeeId = 'Encoder is required.';
    if (!values.branchId) next.branchId = 'Branch is required.';
    if (!values.clientId) next.clientId = 'Client is required.';
    if (!values.loadTypeCode) next.loadTypeCode = 'Load type is required.';
    const hasStart = Boolean(values.plannedStartAt);
    const hasEnd = Boolean(values.plannedEndAt);
    if (values.saveIntent === 'SCHEDULED') {
      if (!hasStart) next.plannedStartAt = 'Scheduled trips require a planned start.';
      if (!hasEnd) next.plannedEndAt = 'Scheduled trips require a planned end.';
      if (hasStart && hasEnd && new Date(values.plannedEndAt).getTime() <= new Date(values.plannedStartAt).getTime())
        next.plannedEndAt = 'Planned end must be later than planned start.';
      const stopIssues = [
        !values.stops.some((stop) => stop.type === 'PICKUP' && stop.locationId)
          ? 'Scheduled trips require a pickup stop with a location.'
          : null,
        !values.stops.some((stop) => stop.type === 'DROPOFF' && stop.locationId)
          ? 'Scheduled trips require a drop-off stop with a location.'
          : null,
      ].filter(Boolean);
      if (stopIssues.length) next.stops = stopIssues.join(' ');
    }
    if (
      (hasStart && Number.isNaN(new Date(values.plannedStartAt).getTime())) ||
      (hasEnd && Number.isNaN(new Date(values.plannedEndAt).getTime()))
    )
      next.plannedStartAt = 'Use a valid date and time.';
    if (values.isTransfer && (!values.transferFromId || values.transferFromId === initialization.tripId))
      next.transferFromId = 'Choose a valid source trip that is not this trip.';
    values.stops.forEach((stop, index) => {
      if (!stop.locationId) next[`stop-${stop.id}`] = `Stop ${index + 1} needs a location.`;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (saving || presentation.disabled || !validate()) return;
    setSaving(true);
    setServiceError(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result =
        mode === 'edit' && resolvedTripId && initialization.version !== null
          ? await services.tripEditor.update(
              { tripId: resolvedTripId, version: initialization.version, values },
              { signal: controller.signal },
            )
          : await services.tripEditor.create({ values }, { signal: controller.signal });
      setTrips((current) =>
        mode === 'edit'
          ? current.map((trip) => (String(trip.id || trip.trip_id) === result.tripId ? result.trip : trip))
          : [...current, result.trip],
      );
      baseline.current = JSON.stringify(values);
      setDirty(false);
      navigate(tripDetailPath(result.tripId), { replace: true });
    } catch (error) {
      const normalized = normalizeServiceError(error);
      if (normalized.kind !== 'cancelled') {
        setServiceError(normalized);
        setErrors((current) => ({
          ...current,
          ...Object.fromEntries(Object.entries(normalized.errors).map(([key, messages]) => [key, messages[0]])),
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  const refreshDevelopmentVersion = async () => {
    if (mode !== 'edit' || !resolvedTripId) return;
    setSaving(true);
    try {
      const latest = await services.tripEditor.initializeEdit(resolvedTripId);
      // Preserve local form input. This refreshes only the development
      // concurrency token; it does not claim an automatic merge.
      setInitialization(latest);
      setServiceError(null);
      setErrors((current) => {
        const next = { ...current };
        delete next.version;
        return next;
      });
    } catch (error) {
      setServiceError(normalizeServiceError(error));
    } finally {
      setSaving(false);
    }
  };

  const leave = () => {
    setDirty(false);
    setConfirmLeave(false);
    if (blocker.state === 'blocked') blocker.proceed();
    else navigate(returnPath);
  };

  const stay = () => {
    setConfirmLeave(false);
    if (blocker.state === 'blocked') blocker.reset();
  };

  if (loading)
    return (
      <main className="flex h-full items-center justify-center p-8" aria-busy="true">
        Loading trip form…
      </main>
    );
  if (serviceError?.kind === 'not_found')
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Trip not found</h1>
        <p className="mt-2">No protected trip values were loaded.</p>
        <Button className="mt-4" onClick={() => navigate(returnPath)} variant="secondary">
          Return to Trip Operations
        </Button>
      </main>
    );
  if (!presentation.visible)
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Permission denied</h1>
        <p className="mt-2">This identity cannot edit or create this trip. No protected form values were loaded.</p>
      </main>
    );
  if (
    !permissions.can(
      mode === 'create' ? permissionActions.create : permissionActions.update,
      permissionResources.tripAdvice,
      mode === 'edit'
        ? permissionContextForTrip({
            encoder_employee_id: initialization.values.encoderEmployeeId,
            status: initialization.values.saveIntent,
            is_draft: initialization.values.saveIntent === 'DRAFT',
          })
        : undefined,
    )
  )
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="mt-2">No protected route content was rendered.</p>
      </main>
    );
  if (presentation.disabled)
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Trip update unavailable</h1>
        <p className="mt-2">{presentation.reason}</p>
        <Button className="mt-4" onClick={() => navigate(tripDetailPath(resolvedTripId ?? ''))} variant="secondary">
          Return to Trip Details
        </Button>
      </main>
    );

  return (
    <main className="h-full overflow-y-auto bg-navy-50 p-4 dark:bg-carbon-950 sm:p-8">
      <form
        className="mx-auto max-w-5xl space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        noValidate
      >
        <header>
          <p className="text-sm text-navy-500 dark:text-carbon-300">
            Trip Scheduling / {mode === 'create' ? 'Create' : 'Edit'}
          </p>
          <h1 className="text-3xl font-semibold">{mode === 'create' ? 'Create Trip' : 'Edit Trip'}</h1>
          <p className="mt-2 text-sm text-navy-600 dark:text-carbon-300">
            Development-only form boundary; changes reset on refresh.
          </p>
        </header>
        {serviceError?.code === 'STALE_VERSION' ? (
          <div role="alert" className="rounded border border-amber-500 p-3 text-sm">
            <p>{serviceError.message}</p>
            <p className="mt-2">
              This refreshes the development version only. It preserves your local form values and does not merge
              changes or provide production concurrency guarantees.
            </p>
            <Button
              className="mt-3"
              disabled={saving}
              onClick={() => void refreshDevelopmentVersion()}
              variant="secondary"
            >
              Refresh version and retry
            </Button>
          </div>
        ) : serviceError ? (
          <div role="alert" className="rounded border border-red-400 p-3 text-sm">
            {serviceError.message}
          </div>
        ) : null}
        {errors.form && (
          <div role="alert" className="rounded border border-red-400 p-3 text-sm">
            {errors.form}
          </div>
        )}
        <section
          className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm dark:border-carbon-700 dark:bg-carbon-900"
          aria-labelledby="trip-fields-heading"
        >
          <h2 id="trip-fields-heading" className="mb-4 text-lg font-semibold">
            Trip information
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Trip advice code
              <input
                className={`mt-1 ${uiClasses.field}`}
                value={values.tripAdviceCode}
                onChange={(e) => update('tripAdviceCode', e.target.value)}
                aria-invalid={Boolean(errors.tripAdviceCode)}
              />
              {errors.tripAdviceCode && <span className="text-sm text-red-600">{errors.tripAdviceCode}</span>}
            </label>
            <label>
              Encoder
              <select
                className={`mt-1 ${uiClasses.field}`}
                value={values.encoderEmployeeId}
                onChange={(e) => update('encoderEmployeeId', e.target.value)}
              >
                <option value="">Select encoder</option>
                {initialization.lookups.employees.map((option) => (
                  <option key={option.value} value={option.value} disabled={!option.active}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.encoderEmployeeId && <span className="text-sm text-red-600">{errors.encoderEmployeeId}</span>}
            </label>
            {(
              [
                ['branchId', 'Branch', initialization.lookups.branches],
                ['clientId', 'Client', initialization.lookups.clients],
                ['loadTypeCode', 'Load type', initialization.lookups.loadTypes],
              ] as const
            ).map(([key, title, options]) => (
              <label key={key}>
                {title}
                <select
                  className={`mt-1 ${uiClasses.field}`}
                  aria-label={title}
                  value={values[key]}
                  onChange={(e) => update(key, e.target.value as never)}
                >
                  <option value="">Select {title.toLowerCase()}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={!option.active}>
                      {option.label}
                      {!option.active ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
                {errors[key] && <span className="text-sm text-red-600">{errors[key]}</span>}
              </label>
            ))}
            <label>
              Internal client code
              <select
                className={`mt-1 ${uiClasses.field}`}
                value={values.internalClientCodeId ?? ''}
                onChange={(e) => update('internalClientCodeId', e.target.value || undefined)}
              >
                <option value="">Not applicable</option>
                {initialization.lookups.internalClientCodes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Consignee
              <select
                className={`mt-1 ${uiClasses.field}`}
                value={values.consigneeId ?? ''}
                onChange={(e) => update('consigneeId', e.target.value || undefined)}
              >
                <option value="">Not applicable</option>
                {initialization.lookups.consignees.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <section
          className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm dark:border-carbon-700 dark:bg-carbon-900"
          aria-labelledby="schedule-heading"
        >
          <h2 id="schedule-heading" className="mb-4 text-lg font-semibold">
            Save intent and planned interval
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              Save intent
              <select
                className={`mt-1 ${uiClasses.field}`}
                aria-label="Save intent"
                value={values.saveIntent}
                onChange={(e) => update('saveIntent', e.target.value as 'DRAFT' | 'SCHEDULED')}
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </label>
            <label>
              Planned start
              <input
                type="datetime-local"
                className={`mt-1 ${uiClasses.field}`}
                value={values.plannedStartAt}
                onChange={(e) => update('plannedStartAt', e.target.value)}
                aria-invalid={Boolean(errors.plannedStartAt)}
              />
              {errors.plannedStartAt && <span className="text-sm text-red-600">{errors.plannedStartAt}</span>}
            </label>
            <label>
              Planned end
              <input
                type="datetime-local"
                className={`mt-1 ${uiClasses.field}`}
                value={values.plannedEndAt}
                onChange={(e) => update('plannedEndAt', e.target.value)}
                aria-invalid={Boolean(errors.plannedEndAt)}
              />
              {errors.plannedEndAt && <span className="text-sm text-red-600">{errors.plannedEndAt}</span>}
            </label>
          </div>
          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.isTransfer}
              onChange={(e) => update('isTransfer', e.target.checked)}
            />{' '}
            Transfer trip
          </label>
          {values.isTransfer && (
            <label className="mt-3 block">
              Source trip
              <select
                className={`mt-1 ${uiClasses.field}`}
                value={values.transferFromId ?? ''}
                onChange={(e) => update('transferFromId', e.target.value || undefined)}
              >
                <option value="">Select source trip</option>
                {initialization.lookups.transferSources.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.transferFromId && <span className="text-sm text-red-600">{errors.transferFromId}</span>}
            </label>
          )}
        </section>
        <section
          className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm dark:border-carbon-700 dark:bg-carbon-900"
          aria-labelledby="stops-heading"
        >
          <div className="flex items-center justify-between">
            <h2 id="stops-heading" className="text-lg font-semibold">
              Ordered route stops
            </h2>
            <Button icon={<Plus aria-hidden="true" size={16} />} onClick={addStop} variant="secondary">
              Add stop
            </Button>
          </div>
          {errors.stops && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {errors.stops}
            </p>
          )}
          <ol className="mt-4 space-y-3">
            {values.stops.map((stop, index) => (
              <li key={stop.id} className="rounded border p-3">
                <div className="grid gap-3 md:grid-cols-[120px_1fr_1fr_auto] md:items-start">
                  <label>
                    Type
                    <select
                      className={`mt-1 ${uiClasses.field}`}
                      value={stop.type}
                      onChange={(e) => updateStop(stop.id, { type: e.target.value as TripFormStopInput['type'] })}
                    >
                      <option value="PICKUP">Pickup</option>
                      <option value="DROPOFF">Drop-off</option>
                    </select>
                  </label>
                  <label>
                    Location
                    <select
                      className={`mt-1 ${uiClasses.field}`}
                      value={stop.locationId}
                      onChange={(e) => updateStop(stop.id, { locationId: e.target.value })}
                    >
                      <option value="">Select location</option>
                      {initialization.lookups.locations.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[`stop-${stop.id}`] && (
                      <span className="text-sm text-red-600">{errors[`stop-${stop.id}`]}</span>
                    )}
                  </label>
                  <label>
                    Specific address / facility instruction
                    <input
                      className={`mt-1 ${uiClasses.field}`}
                      value={stop.specificAddress}
                      onChange={(e) => updateStop(stop.id, { specificAddress: e.target.value })}
                    />
                  </label>
                  <div className="flex gap-1 pt-6">
                    <Button
                      aria-label={`Move stop ${index + 1} up`}
                      disabled={index === 0}
                      icon={<ArrowUp aria-hidden="true" size={16} />}
                      onClick={() => moveStop(index, -1)}
                      size="icon"
                      variant="secondary"
                    />
                    <Button
                      aria-label={`Move stop ${index + 1} down`}
                      disabled={index === values.stops.length - 1}
                      icon={<ArrowDown aria-hidden="true" size={16} />}
                      onClick={() => moveStop(index, 1)}
                      size="icon"
                      variant="secondary"
                    />
                    <Button
                      aria-label={`Remove stop ${index + 1}`}
                      icon={<Trash2 aria-hidden="true" size={16} />}
                      onClick={() => removeStop(stop.id)}
                      size="icon"
                      variant="danger"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
        {mode === 'edit' &&
          (initialization.readOnlyAssignments.driverLabel || initialization.readOnlyAssignments.truckLabel) && (
            <section className="rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Current assignments</h2>
              <p className="mt-2 text-sm">
                {initialization.readOnlyAssignments.driverLabel ?? 'Unassigned'} /{' '}
                {initialization.readOnlyAssignments.truckLabel ?? 'Unassigned'} — read-only in Phase 2C.
              </p>
            </section>
          )}
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t bg-navy-50 py-4 dark:bg-carbon-950">
          <Button onClick={() => (dirty ? setConfirmLeave(true) : navigate(returnPath))} variant="secondary">
            Cancel
          </Button>
          <Button aria-busy={saving} icon={<Save aria-hidden="true" size={16} />} isLoading={saving} type="submit">
            {saving ? 'Saving…' : mode === 'create' ? 'Create Trip' : 'Save changes'}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        cancelLabel="Stay"
        confirmLabel="Leave"
        description="Stay preserves all entered data. Leave returns to Trip Operations."
        onCancel={stay}
        onConfirm={leave}
        open={confirmLeave}
        title="Discard unsaved changes?"
      />
    </main>
  );
};

export default FormPage;
