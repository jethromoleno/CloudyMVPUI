import type { Branch, Client, Consignee, InternalClientCode, Location, Trip, TripStop } from '../types';
import { type DataService } from './apiService';
import {
  ServiceError,
  type RequestOptions,
  type TripFormCreateRequest,
  type TripFormInitialization,
  type TripFormLookups,
  type TripFormStopInput,
  type TripFormUpdateRequest,
  type TripEditorService,
  type TripLoadTypeCode,
} from './contracts';

const throwIfAborted = (options?: RequestOptions) => {
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

const active = (value: { is_active?: boolean }) => value.is_active !== false;
const label = (value: {
  branch_name?: string;
  client_name?: string;
  full_name?: string;
  location_name?: string;
  label?: string;
  code?: string;
  load_type_code?: string;
}) =>
  value.branch_name ??
  value.client_name ??
  value.full_name ??
  value.location_name ??
  value.label ??
  value.code ??
  value.load_type_code ??
  'Unavailable';

const stopType = (value: string): TripFormStopInput['type'] =>
  value.toUpperCase() === 'DROPOFF' || value.toUpperCase() === 'DROP' ? 'DROPOFF' : 'PICKUP';

const toStops = (stops: TripStop[]): TripFormStopInput[] =>
  [...stops]
    .sort((a, b) => a.stop_sequence - b.stop_sequence)
    .map((stop, index) => ({
      id: stop.id || `temp-stop-${index + 1}`,
      sequence: index + 1,
      type: stopType(stop.stop_type),
      locationId: stop.location_id ?? '',
      specificAddress: stop.specific_address ?? '',
    }));

const toTripStop = (stop: TripFormStopInput, tripId: string): TripStop => ({
  id: stop.id,
  trip_advise_id: tripId,
  stop_sequence: stop.sequence,
  stop_type: stop.type,
  location_id: stop.locationId,
  specific_address: stop.specificAddress,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const code = (value: string | undefined) => value?.trim().toUpperCase() ?? '';

export const createDevelopmentTripEditorService = (data: DataService): TripEditorService => {
  // This is a bounded client-side conflict simulation for the development
  // adapter. It proves the Phase 2C UI contract only; it is not a durable
  // server-managed version or production compare-and-update mechanism.
  const versions = new Map<string, number>();

  const versionFor = (tripId: string, rawVersion?: number) => {
    const existing = versions.get(tripId);
    if (existing !== undefined) return existing;
    const initial = rawVersion ?? 1;
    versions.set(tripId, initial);
    return initial;
  };

  const getLookups = async (tripId?: string, clientId?: string, options?: RequestOptions): Promise<TripFormLookups> => {
    throwIfAborted(options);
    const [branches, clients, internalCodes, consignees, loadTypes, locations, trips, employees] = await Promise.all([
      data.getBranches(),
      data.getClients(),
      data.getInternalClientCodes(clientId),
      data.getConsignees(clientId, { includeInactive: true }),
      data.getLoadTypes(),
      data.getLocations(),
      data.getTrips(),
      data.getEmployees(),
    ]);
    throwIfAborted(options);
    return {
      employees: employees.map((value) => ({ value: value.id, label: value.full_name, active: active(value) })),
      branches: (branches as Branch[]).map((value) => ({
        value: value.id,
        label: label(value),
        active: active(value),
      })),
      clients: (clients as Client[]).map((value) => ({ value: value.id, label: label(value), active: active(value) })),
      internalClientCodes: (internalCodes as InternalClientCode[]).map((value) => ({
        value: value.id,
        label: value.code,
        active: true,
      })),
      consignees: (consignees as Consignee[]).map((value) => ({
        value: value.id,
        label: label(value),
        active: active(value),
      })),
      loadTypes: loadTypes.map((value) => ({
        value: code(value.load_type_code) as TripLoadTypeCode,
        label: label(value),
        active: true,
      })),
      locations: locations.map((value: Location) => ({ value: value.id, label: label(value), active: active(value) })),
      transferSources: trips
        .filter((value: Trip) => String(value.id) !== String(tripId) && !value.is_deleted)
        .map((value: Trip) => ({ value: value.id, label: value.trip_advise_code, active: true })),
    };
  };

  const baseValues = (trip?: Trip, stops: TripFormStopInput[] = []): TripFormInitialization => {
    const raw = (trip ?? {}) as Trip & { planned_start_at?: string; planned_end_at?: string; version?: number };
    const status = code(raw.status ?? 'DRAFT');
    return {
      mode: trip ? 'edit' : 'create',
      tripId: trip?.id ?? null,
      values: {
        tripAdviceCode: raw.trip_advise_code ?? '',
        encoderEmployeeId: raw.encoder_employee_id ?? '',
        branchId: raw.branch_id ?? '',
        clientId: raw.client_id ?? raw.customer_id ?? '',
        internalClientCodeId: raw.internal_client_code_id,
        consigneeId: raw.consignee_id,
        loadTypeCode: code(raw.load_type ?? '') as TripLoadTypeCode,
        saveIntent: status === 'DRAFT' ? 'DRAFT' : 'SCHEDULED',
        plannedStartAt: raw.planned_start_at ?? raw.scheduled_start_time ?? '',
        plannedEndAt: raw.planned_end_at ?? '',
        isTransfer: Boolean(raw.is_transfer),
        transferFromId: raw.transfer_from_id,
        stops,
      },
      lookups: {} as TripFormLookups,
      version: trip ? versionFor(String(trip.id), raw.version) : null,
      readOnlyAssignments: { driverLabel: null, truckLabel: null, helperLabels: [] },
      metadata: { createdAt: raw.created_at ?? null, updatedAt: raw.updated_at ?? null },
      source: 'development-mock',
    };
  };

  return {
    initializeCreate: async (options) => {
      const result = baseValues();
      result.lookups = await getLookups(undefined, undefined, options);
      return result;
    },
    initializeEdit: async (tripId, options) => {
      throwIfAborted(options);
      const trip = await data.getTripById(tripId);
      if (!trip)
        throw new ServiceError({ status: 404, code: 'TRIP_NOT_FOUND', message: 'Trip not found.', kind: 'not_found' });
      const stops = await data.getTripStops(tripId);
      const result = baseValues(trip, toStops(stops));
      result.lookups = await getLookups(tripId, result.values.clientId, options);
      const [assignments, employees, trucks] = await Promise.all([
        data.getTripAssignments(tripId),
        data.getEmployees(),
        data.getTrucks(),
      ]);
      const current = assignments.filter((assignment) => !assignment.released_at);
      const driver = current.find((assignment) => !assignment.truck_id);
      const truck = current.find((assignment) => Boolean(assignment.truck_id));
      result.readOnlyAssignments = {
        driverLabel: driver
          ? (employees.find((employee) => employee.id === driver.employee_id)?.full_name ?? 'Assigned driver')
          : null,
        truckLabel: truck
          ? (trucks.find((item) => item.id === truck.truck_id)?.plate_number ?? 'Assigned truck')
          : null,
        helperLabels: [],
      };
      return result;
    },
    create: async (request: TripFormCreateRequest, options) => {
      throwIfAborted(options);
      const trip = await data.createTrip({
        trip_advise_code: request.values.tripAdviceCode,
        encoder_employee_id: request.values.encoderEmployeeId,
        branch_id: request.values.branchId,
        client_id: request.values.clientId,
        internal_client_code_id: request.values.internalClientCodeId,
        consignee_id: request.values.consigneeId,
        load_type_id: request.values.loadTypeCode,
        status_id: request.values.saveIntent,
        pickup_date: request.values.plannedStartAt.slice(0, 10),
        planned_start_at: request.values.plannedStartAt,
        planned_end_at: request.values.plannedEndAt,
        is_transfer: request.values.isTransfer,
        transfer_from_id: request.values.transferFromId,
      });
      const tripId = String(trip.id);
      await data.saveTripStops(
        tripId,
        request.values.stops.map((stop) => toTripStop(stop, tripId)),
      );
      throwIfAborted(options);
      versions.set(tripId, 1);
      return {
        trip,
        tripId,
        destination: `/trip-scheduling/trips/${encodeURIComponent(tripId)}`,
        version: 1,
        source: 'development-mock',
      };
    },
    update: async (request: TripFormUpdateRequest, options) => {
      throwIfAborted(options);
      const currentVersion = versionFor(request.tripId);
      if (request.version !== currentVersion) {
        throw new ServiceError({
          status: 409,
          code: 'STALE_VERSION',
          kind: 'conflict',
          message:
            'Development conflict simulation: this trip changed after the form was opened. Your local values were not applied or overwritten.',
          errors: { version: ['Refresh the development version before retrying.'] },
        });
      }

      // The version is checked before either local write. A stale request
      // therefore performs no trip or stop mutation and no automatic merge.
      const trip = await data.updateTrip(request.tripId, {
        trip_advise_code: request.values.tripAdviceCode,
        encoder_employee_id: request.values.encoderEmployeeId,
        branch_id: request.values.branchId,
        client_id: request.values.clientId,
        internal_client_code_id: request.values.internalClientCodeId,
        consignee_id: request.values.consigneeId,
        load_type_id: request.values.loadTypeCode,
        status_id: request.values.saveIntent,
        pickup_date: request.values.plannedStartAt.slice(0, 10),
        planned_start_at: request.values.plannedStartAt,
        planned_end_at: request.values.plannedEndAt,
        is_transfer: request.values.isTransfer,
        transfer_from_id: request.values.transferFromId,
        version: request.version,
      });
      await data.saveTripStops(
        request.tripId,
        request.values.stops.map((stop) => toTripStop(stop, request.tripId)),
      );
      throwIfAborted(options);
      const nextVersion = currentVersion + 1;
      versions.set(request.tripId, nextVersion);
      return {
        trip,
        tripId: request.tripId,
        destination: `/trip-scheduling/trips/${encodeURIComponent(request.tripId)}`,
        version: nextVersion,
        source: 'development-mock',
      };
    },
  };
};
