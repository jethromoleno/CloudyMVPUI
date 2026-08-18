import React, { useEffect, useState } from 'react';
import { normalizeServiceError, services, type TripTransitionSnapshot } from '../services';
import { permissionActions, permissionResources, usePermissions } from '../permissions';
import { Button, ErrorState, LoadingState, SurfaceState } from './ui';

type TripTransitionTarget = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCUE' | 'BACKLOAD' | 'TRANSFERRED';

export const TripTransitionWorkflow: React.FC<{ tripId: string }> = ({ tripId }) => {
  const permissions = usePermissions();
  const canTransition = permissions.can(permissionActions.statusChange, permissionResources.tripAdvice);
  const canCancel = permissions.can(permissionActions.cancel, permissionResources.tripAdvice);
  const [snapshot, setSnapshot] = useState<TripTransitionSnapshot | null>(null);
  const [reason, setReason] = useState('');
  const [successorTripId, setSuccessorTripId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<TripTransitionTarget | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      setSnapshot(await services.tripTransitions.getSnapshot(tripId));
      setError(null);
    } catch (value) {
      setError(normalizeServiceError(value).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [tripId]);
  const submit = async (target: TripTransitionTarget) => {
    if (!snapshot) return;
    setLoading(true);
    try {
      setSnapshot(
        await services.tripTransitions.transition({
          tripId,
          target,
          expectedVersion: snapshot.version,
          reason,
          successorTripId: target === 'TRANSFERRED' ? successorTripId : undefined,
        }),
      );
      setReason('');
      setSuccessorTripId('');
      setError(null);
    } catch (value) {
      setError(normalizeServiceError(value).message);
    } finally {
      setLoading(false);
      setPendingTarget(null);
    }
  };
  if (loading && !snapshot) return <LoadingState className="min-h-32" label="Loading transition actions..." />;
  if (!canTransition && !canCancel)
    return (
      <section
        aria-label="Trip transition workflow"
        className="rounded-xl border border-violet-200 p-4 text-navy-950 dark:border-violet-500/30 dark:text-white"
      >
        <h3 className="sr-only">Trip transition workflow</h3>
        <SurfaceState title="Status changes unavailable" description="Your current role cannot change trip status." />
      </section>
    );
  return (
    <section
      aria-label="Trip transition workflow"
      className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 text-navy-950 dark:border-violet-500/30 dark:bg-violet-500/5 dark:text-white"
    >
      <h3 className="font-bold">Trip transition workflow</h3>
      <p className="mt-1 text-xs text-navy-600 dark:text-carbon-300">
        Choose an allowed status change for this trip. Cancellation requires confirmation.
      </p>
      {error && (
        <ErrorState
          className="mt-3 min-h-0"
          title="Transition unavailable"
          description={error}
          onRetry={() => void load()}
        />
      )}
      {snapshot && (
        <>
          <p className="mt-3 text-sm">
            Current status: <strong>{snapshot.status}</strong>
          </p>
          {snapshot.allowed.some((item) => ['CANCELLED', 'RESCUE', 'BACKLOAD', 'TRANSFERRED'].includes(item)) && (
            <label className="mt-3 block text-sm">
              Reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
          )}
          {snapshot.allowed.includes('TRANSFERRED') && (
            <label className="mt-3 block text-sm">
              Successor trip ID
              <input
                value={successorTripId}
                onChange={(event) => setSuccessorTripId(event.target.value)}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.allowed.map((target) => (
              <Button
                key={target}
                disabled={loading || (target === 'CANCELLED' && !canCancel)}
                onClick={() => (target === 'CANCELLED' ? setPendingTarget(target) : void submit(target))}
                size="sm"
              >
                {target.replace('_', ' ')}
              </Button>
            ))}
          </div>
          {pendingTarget === 'CANCELLED' && (
            <div
              aria-describedby="cancel-trip-confirmation-description"
              aria-labelledby="cancel-trip-confirmation-title"
              aria-modal="true"
              className="mt-4 rounded-lg border border-red-200 bg-white p-4 shadow-sm dark:border-red-500/40 dark:bg-carbon-900"
              role="alertdialog"
            >
              <h4 id="cancel-trip-confirmation-title" className="font-semibold">
                Confirm trip cancellation
              </h4>
              <p id="cancel-trip-confirmation-description" className="mt-1 text-sm">
                This development-only workflow will release the trip&apos;s development assignment ledger entries.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="danger" disabled={loading} onClick={() => void submit('CANCELLED')}>
                  Confirm cancellation
                </Button>
                <Button size="sm" variant="secondary" disabled={loading} onClick={() => setPendingTarget(null)}>
                  Keep trip active
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
