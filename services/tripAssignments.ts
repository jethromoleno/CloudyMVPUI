import type { DataService } from './apiService';
import {
  ServiceError,
  type AssignmentAvailabilityRequest,
  type AssignmentAvailabilityResource,
  type AssignmentCommand,
  type AssignmentLedgerEntry,
  type AssignmentMutationResponse,
  type AssignmentReleaseCommand,
  type AssignmentReassignCommand,
  type TripAssignmentAvailability,
  type TripAssignmentService,
  type RequestOptions,
} from './contracts';

const ensureActiveInterval = (start: string, end: string) => {
  const startAt = Date.parse(start);
  const endAt = Date.parse(end);
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    throw new ServiceError({
      status: 400,
      code: 'INVALID_ASSIGNMENT_INTERVAL',
      kind: 'validation',
      message: 'Assignments require a valid planned start and end interval.',
      errors: { plannedInterval: ['The planned end must be later than the planned start.'] },
    });
  }
};

const overlaps = (leftStart: string, leftEnd: string, rightStart: string, rightEnd: string) =>
  Date.parse(leftStart) < Date.parse(rightEnd) && Date.parse(rightStart) < Date.parse(leftEnd);

const checkAbort = (options?: RequestOptions) => {
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

export const createDevelopmentTripAssignmentService = (data: DataService): TripAssignmentService => {
  const ledger: AssignmentLedgerEntry[] = [];
  const versions = new Map<string, number>();
  let sequence = 0;

  const versionFor = (tripId: string) => versions.get(tripId) ?? 1;
  const currentFor = (tripId: string) => ledger.filter((entry) => entry.tripId === tripId && entry.current);

  const resourceSets = async () => {
    const [employees, drivers, trucks, truckStatuses] = await Promise.all([
      data.getEmployees(),
      data.getDrivers(),
      data.getTrucks(),
      data.getTruckStatuses(),
    ]);
    return { employees, drivers, trucks, truckStatuses };
  };

  const labelFor = async (role: AssignmentCommand['role'], resourceId: string) => {
    const { employees, drivers, trucks } = await resourceSets();
    if (role === 'TRUCK') return trucks.find((truck) => String(truck.id) === resourceId)?.plate_number ?? resourceId;
    const employeeId =
      role === 'DRIVER'
        ? (drivers.find((driver) => String(driver.id) === resourceId)?.employee_id ?? resourceId)
        : resourceId;
    const employee = employees.find((item) => String(item.id) === String(employeeId));
    return employee ? `${employee.first_name} ${employee.last_name}` : resourceId;
  };

  const employeeIdFor = (
    role: AssignmentCommand['role'],
    resourceId: string,
    drivers: Awaited<ReturnType<DataService['getDrivers']>>,
  ) =>
    role === 'DRIVER'
      ? String(drivers.find((driver) => String(driver.id) === resourceId)?.employee_id ?? resourceId)
      : resourceId;

  const hasEmployeeRoleCollision = async (tripId: string, role: AssignmentCommand['role'], resourceId: string) => {
    if (role === 'TRUCK') return false;
    const drivers = await data.getDrivers();
    const requestedEmployeeId = employeeIdFor(role, resourceId, drivers);
    return currentFor(tripId).some((entry) => {
      if (entry.role === 'TRUCK' || entry.role === role) return false;
      return employeeIdFor(entry.role, entry.resourceId, drivers) === requestedEmployeeId;
    });
  };

  const availability = async (request: AssignmentAvailabilityRequest): Promise<TripAssignmentAvailability> => {
    ensureActiveInterval(request.plannedStartAt, request.plannedEndAt);
    const { employees, drivers, trucks, truckStatuses } = await resourceSets();
    const build = (id: string, label: string, active: boolean, eligible: boolean): AssignmentAvailabilityResource => {
      const own = currentFor(request.tripId).some((entry) => entry.resourceId === id);
      const conflict = ledger.find(
        (entry) =>
          entry.current &&
          entry.resourceId === id &&
          entry.tripId !== request.tripId &&
          overlaps(request.plannedStartAt, request.plannedEndAt, entry.plannedStartAt, entry.plannedEndAt),
      );
      if (!active)
        return {
          id,
          label,
          active,
          eligible: false,
          state: 'INACTIVE',
          reasons: ['Resource is inactive.'],
          conflictingTripCode: null,
          conflictingStartAt: null,
          conflictingEndAt: null,
        };
      if (!eligible)
        return {
          id,
          label,
          active,
          eligible,
          state: 'INELIGIBLE',
          reasons: ['Resource is not eligible for assignment.'],
          conflictingTripCode: null,
          conflictingStartAt: null,
          conflictingEndAt: null,
        };
      if (own)
        return {
          id,
          label,
          active,
          eligible,
          state: 'ASSIGNED_TO_TRIP',
          reasons: ['Already assigned to this trip.'],
          conflictingTripCode: null,
          conflictingStartAt: null,
          conflictingEndAt: null,
        };
      if (conflict)
        return {
          id,
          label,
          active,
          eligible,
          state: 'CONFLICT',
          reasons: ['Overlapping current assignment.'],
          conflictingTripCode: conflict.tripId,
          conflictingStartAt: conflict.plannedStartAt,
          conflictingEndAt: conflict.plannedEndAt,
        };
      return {
        id,
        label,
        active,
        eligible,
        state: 'AVAILABLE',
        reasons: [],
        conflictingTripCode: null,
        conflictingStartAt: null,
        conflictingEndAt: null,
      };
    };
    const employeeById = new Map(employees.map((employee) => [String(employee.id), employee]));
    const driverResources = drivers.map((driver) => {
      const employee = employeeById.get(String(driver.employee_id));
      const active = Boolean(employee && !employee.is_deleted);
      const eligible = active && Boolean(driver.license_number);
      return build(
        String(driver.id),
        employee ? `${employee.first_name} ${employee.last_name}` : String(driver.id),
        active,
        eligible,
      );
    });
    const helperResources = employees.map((employee) =>
      build(
        String(employee.id),
        `${employee.first_name} ${employee.last_name}`,
        !employee.is_deleted,
        !employee.is_deleted,
      ),
    );
    const truckResources = trucks.map((truck) => {
      const status = truckStatuses
        .find((item) => String(item.id) === String(truck.truck_status_id))
        ?.truck_status_code?.toUpperCase();
      const eligible = !truck.is_deleted && status === 'AVAILABLE';
      return build(String(truck.id), truck.plate_number, !truck.is_deleted, eligible);
    });
    return {
      tripId: request.tripId,
      plannedStartAt: request.plannedStartAt,
      plannedEndAt: request.plannedEndAt,
      timezone: 'Asia/Manila',
      drivers: driverResources,
      helpers: helperResources,
      trucks: truckResources,
      refreshedAt: new Date().toISOString(),
      version: versionFor(request.tripId),
      source: 'development-mock',
    };
  };

  const response = async (tripId: string, start: string, end: string): Promise<AssignmentMutationResponse> => ({
    tripId,
    current: currentFor(tripId),
    history: ledger
      .filter((entry) => entry.tripId === tripId)
      .sort((a, b) => Date.parse(a.assignedAt) - Date.parse(b.assignedAt) || a.id.localeCompare(b.id)),
    availability: await availability({ tripId, plannedStartAt: start, plannedEndAt: end, timezone: 'Asia/Manila' }),
    version: versionFor(tripId),
    source: 'development-mock',
  });

  const eligibleResource = async (command: AssignmentCommand) => {
    const available = await availability({ ...command, timezone: 'Asia/Manila' });
    const resources =
      command.role === 'DRIVER' ? available.drivers : command.role === 'HELPER' ? available.helpers : available.trucks;
    const resource = resources.find((item) => item.id === command.resourceId);
    if (!resource || resource.state === 'CONFLICT')
      throw new ServiceError({
        status: 409,
        code: 'ASSIGNMENT_CONFLICT',
        kind: 'conflict',
        message: 'Development conflict simulation: the resource has an overlapping assignment.',
        errors: { resourceId: ['Choose an available resource.'] },
      });
    if (resource.state !== 'AVAILABLE' && resource.state !== 'ASSIGNED_TO_TRIP')
      throw new ServiceError({
        status: 422,
        code: 'RESOURCE_INELIGIBLE',
        kind: 'validation',
        message: 'The selected resource is not eligible.',
      });
    return resource;
  };

  return {
    getAvailability: async (request, options) => {
      checkAbort(options);
      const result = await availability(request);
      checkAbort(options);
      return result;
    },
    getAssignments: async (tripId, options) => {
      checkAbort(options);
      const trip = (await data.getTrips()).find((item) => String(item.id ?? item.trip_id) === tripId);
      const timing = trip as (typeof trip & { planned_start_at?: string; planned_end_at?: string }) | undefined;
      if (!timing?.planned_start_at || !timing.planned_end_at)
        throw new ServiceError({
          status: 400,
          code: 'MISSING_PLANNED_INTERVAL',
          kind: 'validation',
          message: 'Availability cannot be confirmed without a planned interval.',
        });
      return response(tripId, timing.planned_start_at, timing.planned_end_at);
    },
    assign: async (command, options) => {
      checkAbort(options);
      ensureActiveInterval(command.plannedStartAt, command.plannedEndAt);
      if (command.expectedVersion !== versionFor(command.tripId))
        throw new ServiceError({
          status: 409,
          code: 'STALE_ASSIGNMENT_VERSION',
          kind: 'conflict',
          message: 'Development assignment version is stale. Refresh availability before retrying.',
        });
      await eligibleResource(command);
      if (command.role !== 'HELPER' && currentFor(command.tripId).some((entry) => entry.role === command.role))
        throw new ServiceError({
          status: 409,
          code: 'ASSIGNMENT_EXISTS',
          kind: 'conflict',
          message: 'Release or reassign the current resource first.',
        });
      if (
        command.role === 'HELPER' &&
        currentFor(command.tripId).some((entry) => entry.role === 'HELPER' && entry.resourceId === command.resourceId)
      )
        throw new ServiceError({
          status: 409,
          code: 'DUPLICATE_HELPER',
          kind: 'conflict',
          message: 'This helper is already assigned to the trip.',
        });
      if (await hasEmployeeRoleCollision(command.tripId, command.role, command.resourceId))
        throw new ServiceError({
          status: 409,
          code: 'EMPLOYEE_ROLE_COLLISION',
          kind: 'conflict',
          message: 'The same employee cannot be assigned as both driver and helper on one trip.',
        });
      const label = await labelFor(command.role, command.resourceId);
      ledger.push({
        id: `dev-assignment-${++sequence}`,
        tripId: command.tripId,
        role: command.role,
        resourceId: command.resourceId,
        resourceLabel: label,
        plannedStartAt: command.plannedStartAt,
        plannedEndAt: command.plannedEndAt,
        assignedAt: new Date().toISOString(),
        releasedAt: null,
        releaseReason: null,
        current: true,
      });
      versions.set(command.tripId, versionFor(command.tripId) + 1);
      return response(command.tripId, command.plannedStartAt, command.plannedEndAt);
    },
    reassign: async (command: AssignmentReassignCommand, options) => {
      checkAbort(options);
      ensureActiveInterval(command.plannedStartAt, command.plannedEndAt);
      if (command.expectedVersion !== versionFor(command.tripId))
        throw new ServiceError({
          status: 409,
          code: 'STALE_ASSIGNMENT_VERSION',
          kind: 'conflict',
          message: 'Development assignment version is stale. Refresh availability before retrying.',
        });
      const existing = ledger.find(
        (entry) => entry.id === command.assignmentId && entry.tripId === command.tripId && entry.current,
      );
      if (!existing || existing.role !== command.role)
        throw new ServiceError({
          status: 404,
          code: 'ASSIGNMENT_NOT_FOUND',
          kind: 'not_found',
          message: 'Current assignment was not found.',
        });
      if (existing.resourceId === command.resourceId)
        throw new ServiceError({
          status: 422,
          code: 'ASSIGNMENT_NO_CHANGE',
          kind: 'validation',
          message: 'Choose a different resource to reassign.',
        });
      await eligibleResource(command);
      if (await hasEmployeeRoleCollision(command.tripId, command.role, command.resourceId))
        throw new ServiceError({
          status: 409,
          code: 'EMPLOYEE_ROLE_COLLISION',
          kind: 'conflict',
          message: 'The same employee cannot be assigned as both driver and helper on one trip.',
        });
      const label = await labelFor(command.role, command.resourceId);
      const now = new Date().toISOString();
      existing.current = false;
      existing.releasedAt = now;
      existing.releaseReason = command.reason;
      ledger.push({
        id: `dev-assignment-${++sequence}`,
        tripId: command.tripId,
        role: command.role,
        resourceId: command.resourceId,
        resourceLabel: label,
        plannedStartAt: command.plannedStartAt,
        plannedEndAt: command.plannedEndAt,
        assignedAt: now,
        releasedAt: null,
        releaseReason: null,
        current: true,
      });
      versions.set(command.tripId, versionFor(command.tripId) + 1);
      return response(command.tripId, command.plannedStartAt, command.plannedEndAt);
    },
    release: async (command, options) => {
      checkAbort(options);
      if (command.expectedVersion !== versionFor(command.tripId))
        throw new ServiceError({
          status: 409,
          code: 'STALE_ASSIGNMENT_VERSION',
          kind: 'conflict',
          message: 'Development assignment version is stale.',
        });
      const entry = ledger.find(
        (item) => item.id === command.assignmentId && item.tripId === command.tripId && item.current,
      );
      if (!entry)
        throw new ServiceError({
          status: 404,
          code: 'ASSIGNMENT_NOT_FOUND',
          kind: 'not_found',
          message: 'Current assignment was not found.',
        });
      entry.current = false;
      entry.releasedAt = new Date().toISOString();
      entry.releaseReason = command.reason;
      versions.set(command.tripId, versionFor(command.tripId) + 1);
      return response(command.tripId, entry.plannedStartAt, entry.plannedEndAt);
    },
    releaseForLifecycle: async (tripId, reason, options) => {
      checkAbort(options);
      const entries = currentFor(tripId);
      const now = new Date().toISOString();
      entries.forEach((entry) => {
        entry.current = false;
        entry.releasedAt = now;
        entry.releaseReason = reason;
      });
      if (entries.length > 0) versions.set(tripId, versionFor(tripId) + 1);
      return { releasedCount: entries.length, source: 'development-mock' };
    },
  };
};
