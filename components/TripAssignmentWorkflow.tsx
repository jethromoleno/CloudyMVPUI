import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import {
  normalizeServiceError,
  services,
  type AssignmentAvailabilityResource,
  type AssignmentLedgerEntry,
  type AssignmentResourceType,
  type ServiceError,
  type TripAssignmentAvailability,
  type TripAssignmentService,
} from '../services';
import { permissionActions, permissionResources, usePermissions } from '../permissions';
import { Button, ErrorState, LoadingState, StatusBadge, SurfaceState } from './ui';

interface TripAssignmentWorkflowProps {
  tripId: string;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  service?: TripAssignmentService;
}

const roleLabel: Record<AssignmentResourceType, string> = {
  DRIVER: 'Driver',
  HELPER: 'Helper',
  TRUCK: 'Truck',
};

const availabilityFor = (availability: TripAssignmentAvailability, role: AssignmentResourceType) =>
  role === 'DRIVER' ? availability.drivers : role === 'HELPER' ? availability.helpers : availability.trucks;

const ResourceSelect: React.FC<{
  label: string;
  onChoose: (resource: AssignmentAvailabilityResource) => void;
  resources: AssignmentAvailabilityResource[];
}> = ({ label, onChoose, resources }) => (
  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
    <label className="grid gap-1.5 text-xs font-semibold text-navy-700 dark:text-carbon-200">
      {label}
      <select
        className="min-h-10 rounded-lg border border-navy-200 bg-white px-3 text-sm dark:border-carbon-700 dark:bg-carbon-950"
        defaultValue=""
      >
        <option value="">Choose an available resource</option>
        {resources.map((resource) => (
          <option key={resource.id} disabled={resource.state !== 'AVAILABLE'} value={resource.id}>
            {resource.label} {resource.state === 'AVAILABLE' ? '' : `(${resource.state.replaceAll('_', ' ')})`}
          </option>
        ))}
      </select>
    </label>
    <Button
      onClick={(event) => {
        const select = event.currentTarget.parentElement?.querySelector('select');
        const resource = resources.find((item) => item.id === select?.value);
        if (resource) onChoose(resource);
      }}
      size="sm"
      variant="secondary"
    >
      Assign {label}
    </Button>
  </div>
);

export const TripAssignmentWorkflow: React.FC<TripAssignmentWorkflowProps> = ({
  tripId,
  plannedStartAt,
  plannedEndAt,
  service = services.tripAssignments,
}) => {
  const permissions = usePermissions();
  const canAssign = permissions.can(permissionActions.assign, permissionResources.tripAssignments);
  const presentation = permissions.present(permissionActions.assign, permissionResources.tripAssignments);
  const [availability, setAvailability] = useState<TripAssignmentAvailability | null>(null);
  const [history, setHistory] = useState<AssignmentLedgerEntry[]>([]);
  const [error, setError] = useState<ServiceError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const closeDialogRef = useRef<HTMLButtonElement>(null);
  const dialogReturnFocusRef = useRef<HTMLElement | null>(null);
  const [pending, setPending] = useState<
    | { action: 'assign'; role: AssignmentResourceType; resource: AssignmentAvailabilityResource }
    | {
        action: 'reassign';
        entry: AssignmentLedgerEntry;
        resource: AssignmentAvailabilityResource;
      }
    | { action: 'release'; entry: AssignmentLedgerEntry }
    | null
  >(null);

  const load = useCallback(async () => {
    if (!plannedStartAt || !plannedEndAt) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextAvailability, assignments] = await Promise.all([
        service.getAvailability({ tripId, plannedStartAt, plannedEndAt, timezone: 'Asia/Manila' }),
        service.getAssignments(tripId),
      ]);
      setAvailability(nextAvailability);
      setHistory(assignments.history);
    } catch (requestError) {
      setError(normalizeServiceError(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [plannedEndAt, plannedStartAt, service, tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pending) return;
    dialogReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => closeDialogRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setPending(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', closeOnEscape);
      dialogReturnFocusRef.current?.focus();
      dialogReturnFocusRef.current = null;
    };
  }, [pending]);

  const confirm = async () => {
    if (!pending || !availability || !plannedStartAt || !plannedEndAt) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response =
        pending.action === 'assign'
          ? await service.assign({
              tripId,
              role: pending.role,
              resourceId: pending.resource.id,
              plannedStartAt,
              plannedEndAt,
              expectedVersion: availability.version,
              reason: 'Phase 2D development review',
            })
          : pending.action === 'reassign'
            ? await service.reassign({
                tripId,
                assignmentId: pending.entry.id,
                role: pending.entry.role as 'DRIVER' | 'TRUCK',
                resourceId: pending.resource.id,
                plannedStartAt,
                plannedEndAt,
                expectedVersion: availability.version,
                reason: 'Phase 2D development review reassignment',
              })
            : await service.release({
                tripId,
                assignmentId: pending.entry.id,
                expectedVersion: availability.version,
                reason: 'Phase 2D development review release',
              });
      setAvailability(response.availability);
      setHistory(response.history);
      setSuccess(
        `Assignment ${pending.action === 'reassign' ? 'replacement' : pending.action} completed in the development review adapter.`,
      );
      setPending(null);
    } catch (requestError) {
      setError(normalizeServiceError(requestError));
      setPending(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!plannedStartAt || !plannedEndAt) {
    return (
      <SurfaceState
        className="border-amber-200 bg-amber-50/60"
        description="Set a valid planned start and end before checking availability. No assignment action is enabled."
        title="Planned interval required"
      />
    );
  }

  return (
    <section
      aria-labelledby="assignment-workflow-title"
      className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/45 p-4 dark:border-blue-500/30 dark:bg-blue-500/5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
            Phase 2D review workflow
          </p>
          <h3 id="assignment-workflow-title" className="mt-1 text-base font-bold text-navy-950 dark:text-white">
            Availability and assignment
          </h3>
          <p className="mt-1 text-xs text-navy-600 dark:text-carbon-300">
            Asia/Manila interval: {plannedStartAt} to {plannedEndAt}. Adjacent assignments are permitted; overlaps are
            rejected in this development adapter.
          </p>
        </div>
        <Button
          aria-label="Refresh availability"
          icon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}
          isLoading={isLoading}
          onClick={() => void load()}
          size="icon"
          variant="ghost"
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {isLoading ? 'Assignment request in progress.' : success}
      </p>

      {error && (
        <ErrorState
          className="min-h-0"
          description={error.message}
          onRetry={() => void load()}
          title="Assignment request failed"
        />
      )}
      {isLoading && !availability ? <LoadingState className="min-h-40" label="Checking availability..." /> : null}
      {!canAssign ? (
        <SurfaceState
          className="min-h-32"
          description={presentation.reason ?? 'Your current role cannot assign trip resources.'}
          title="Assignment unavailable"
        />
      ) : availability ? (
        <div className="space-y-3">
          <ResourceSelect
            label="Driver"
            resources={availabilityFor(availability, 'DRIVER')}
            onChoose={(resource) => {
              const entry = history.find((item) => item.current && item.role === 'DRIVER');
              setPending(
                entry ? { action: 'reassign', entry, resource } : { action: 'assign', role: 'DRIVER', resource },
              );
            }}
          />
          <ResourceSelect
            label="Helper"
            resources={availabilityFor(availability, 'HELPER')}
            onChoose={(resource) => setPending({ action: 'assign', role: 'HELPER', resource })}
          />
          <ResourceSelect
            label="Truck"
            resources={availabilityFor(availability, 'TRUCK')}
            onChoose={(resource) => {
              const entry = history.find((item) => item.current && item.role === 'TRUCK');
              setPending(
                entry ? { action: 'reassign', entry, resource } : { action: 'assign', role: 'TRUCK', resource },
              );
            }}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            {(['DRIVER', 'HELPER', 'TRUCK'] as const).map((role) => {
              const count = availabilityFor(availability, role).filter((item) => item.state === 'AVAILABLE').length;
              return (
                <StatusBadge
                  key={role}
                  label={`${count} ${roleLabel[role]} available`}
                  status={count > 0 ? 'active' : 'warning'}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {history.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">Development assignment history</h4>
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy-200 bg-white p-3 text-sm dark:border-carbon-700 dark:bg-carbon-950"
            >
              <span>
                <strong>{roleLabel[entry.role]}:</strong> {entry.resourceLabel} {entry.current ? '' : '(released)'}
              </span>
              {entry.current && canAssign ? (
                <Button onClick={() => setPending({ action: 'release', entry })} size="sm" variant="secondary">
                  Release
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {pending && (
        <div
          aria-describedby="assignment-confirmation-description"
          aria-labelledby="assignment-confirmation-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/45 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-carbon-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="assignment-confirmation-title" className="text-lg font-bold">
                  Confirm {pending.action === 'reassign' ? 'replacement' : pending.action}
                </h3>
                <p id="assignment-confirmation-description" className="mt-2 text-sm text-navy-600 dark:text-carbon-300">
                  {pending.action === 'assign'
                    ? `Assign ${pending.resource.label} as ${roleLabel[pending.role]}?`
                    : pending.action === 'reassign'
                      ? `Replace ${pending.entry.resourceLabel} with ${pending.resource.label} as ${roleLabel[pending.entry.role]}. The current assignment remains in place unless the complete replacement succeeds.`
                      : `Release ${pending.entry.resourceLabel}?`}{' '}
                  The development adapter will re-check the current version and interval before applying this simulated
                  change.
                </p>
              </div>
              <Button
                ref={closeDialogRef}
                aria-label="Cancel confirmation"
                icon={<X aria-hidden="true" className="h-4 w-4" />}
                onClick={() => setPending(null)}
                size="icon"
                variant="ghost"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setPending(null)} variant="secondary">
                Cancel
              </Button>
              <Button isLoading={isLoading} onClick={() => void confirm()}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
