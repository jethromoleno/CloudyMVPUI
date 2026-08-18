import type { DataService } from './apiService';
import {
  ServiceError,
  type RequestOptions,
  type TripAssignmentService,
  type TripStatusCode,
  type TripTransitionService,
} from './contracts';
import { toTripStatusCode } from './tripOperations';

const graph: Readonly<Record<TripStatusCode, TripStatusCode[]>> = {
  DRAFT: [],
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'TRANSFERRED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'RESCUE', 'BACKLOAD', 'TRANSFERRED'],
  RESCUE: ['COMPLETED', 'CANCELLED', 'TRANSFERRED'],
  BACKLOAD: ['COMPLETED', 'CANCELLED', 'TRANSFERRED'],
  COMPLETED: [],
  CANCELLED: [],
  TRANSFERRED: [],
};
const needsReason = new Set<TripStatusCode>(['CANCELLED', 'RESCUE', 'BACKLOAD', 'TRANSFERRED']);
const abort = (options?: RequestOptions) => {
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

export const createDevelopmentTripTransitionService = (
  data: DataService,
  assignments: TripAssignmentService,
): TripTransitionService => {
  const versions = new Map<string, number>();
  const history = new Map<
    string,
    {
      id: string;
      from: TripStatusCode;
      to: TripStatusCode;
      reason: string | null;
      occurredAt: string;
      successorTripId: string | null;
    }[]
  >();
  const current = async (tripId: string) => {
    const trip = await data.getTripById(tripId);
    if (!trip)
      throw new ServiceError({ status: 404, code: 'TRIP_NOT_FOUND', kind: 'not_found', message: 'Trip not found.' });
    const status = toTripStatusCode(trip.status ?? trip.status_id);
    if (!status)
      throw new ServiceError({
        status: 409,
        code: 'INVALID_TRIP_TRANSITION',
        kind: 'conflict',
        message: 'Trip has no approved canonical status.',
      });
    return { trip, status, version: versions.get(tripId) ?? 1 };
  };
  const snapshot = async (tripId: string) => {
    const { status, version } = await current(tripId);
    return {
      tripId,
      status,
      version,
      allowed: graph[status],
      history: history.get(tripId) ?? [],
      source: 'development-mock' as const,
    };
  };
  return {
    getSnapshot: async (tripId, options) => {
      abort(options);
      const result = await snapshot(tripId);
      abort(options);
      return result;
    },
    transition: async (command, options) => {
      abort(options);
      const { trip, status, version } = await current(command.tripId);
      if (command.expectedVersion !== version)
        throw new ServiceError({
          status: 409,
          code: 'STALE_RECORD',
          kind: 'conflict',
          message: 'Trip status changed. Refresh before retrying.',
        });
      if (!graph[status].includes(command.target))
        throw new ServiceError({
          status: 409,
          code: 'INVALID_TRIP_TRANSITION',
          kind: 'conflict',
          message: `The transition from ${status} to ${command.target} is not allowed.`,
        });
      if (needsReason.has(command.target) && !command.reason?.trim())
        throw new ServiceError({
          status: 400,
          code: 'TRANSITION_REASON_REQUIRED',
          kind: 'validation',
          message: 'A reason is required for this transition.',
          errors: { reason: ['Provide a reason.'] },
        });
      if (command.target === 'TRANSFERRED' && !command.successorTripId)
        throw new ServiceError({
          status: 400,
          code: 'TRANSFER_SUCCESSOR_REQUIRED',
          kind: 'validation',
          message: 'A successor trip is required for transfer.',
          errors: { successorTripId: ['Choose a successor trip.'] },
        });
      if (command.target === 'TRANSFERRED' && !(await data.getTripById(command.successorTripId!)))
        throw new ServiceError({
          status: 400,
          code: 'TRANSFER_SUCCESSOR_REQUIRED',
          kind: 'validation',
          message: 'The successor trip is unavailable.',
        });
      const statuses = await data.getTripStatuses();
      const targetStatus = statuses.find((item) => toTripStatusCode(item.status_code) === command.target);
      if (command.target === 'COMPLETED' || command.target === 'CANCELLED' || command.target === 'TRANSFERRED') {
        await assignments.releaseForLifecycle(
          command.tripId,
          `${command.target}: ${command.reason?.trim() || 'lifecycle transition'}`,
          options,
        );
      }
      if (command.target === 'TRANSFERRED') {
        await data.updateTrip(command.successorTripId!, { is_transfer: true, transfer_from_id: command.tripId });
      }
      await data.updateTrip(command.tripId, {
        status_id: targetStatus?.id ?? command.target,
        is_transfer: command.target === 'TRANSFERRED' || trip.is_transfer,
        transfer_from_id: trip.transfer_from_id,
        transition_reason: command.reason?.trim() || null,
      });
      const next = version + 1;
      versions.set(command.tripId, next);
      const entries = history.get(command.tripId) ?? [];
      entries.push({
        id: `dev-transition-${entries.length + 1}`,
        from: status,
        to: command.target,
        reason: command.reason?.trim() || null,
        occurredAt: new Date().toISOString(),
        successorTripId: command.successorTripId ?? null,
      });
      history.set(command.tripId, entries);
      abort(options);
      return {
        tripId: command.tripId,
        status: command.target,
        version: next,
        allowed: graph[command.target],
        history: entries,
        source: 'development-mock' as const,
      };
    },
  };
};
