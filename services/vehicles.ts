import type { Truck } from '../types';
import type { DataService } from './apiService';
import {
  ServiceError,
  type VehicleMaintenanceInput,
  type VehicleMutationInput,
  type VehicleRecord,
  type VehicleService,
  type VehicleStatusCode,
} from './contracts';

const statusCodeById: Record<string, VehicleStatusCode> = {
  'ts-avail': 'AVAILABLE',
  'ts-use': 'IN_USE',
  'ts-maint': 'MAINTENANCE',
  'ts-inactive': 'INACTIVE',
};

const statusIdByCode: Record<VehicleStatusCode, string> = {
  AVAILABLE: 'ts-avail',
  IN_USE: 'ts-use',
  MAINTENANCE: 'ts-maint',
  INACTIVE: 'ts-inactive',
};

const toVehicle = (truck: Truck): VehicleRecord => ({
  id: truck.id,
  plateNumber: truck.plate_number || truck.license_plate || truck.id,
  vin: truck.vin ?? null,
  size: truck.truck_size,
  loadTypeId: truck.load_type_id ?? null,
  status: statusCodeById[truck.truck_status_id] ?? (truck.is_active ? 'AVAILABLE' : 'INACTIVE'),
  registrationExpiry: truck.registration_expiry ?? null,
  active: truck.is_active !== false,
  notes: truck.remarks ?? null,
  updatedAt: truck.updated_at,
  source: 'development-mock',
});

const requiredReason = (reason: string) => {
  if (!reason.trim())
    throw new ServiceError({
      status: 400,
      code: 'REASON_REQUIRED',
      message: 'A lifecycle or status-change reason is required.',
      kind: 'validation',
    });
};

export const createDevelopmentVehicleService = (data: DataService): VehicleService => {
  const get = async (vehicleId: string) => {
    const truck = (await data.getTrucks()).find((item) => item.id === vehicleId || item.truck_id === vehicleId);
    if (!truck)
      throw new ServiceError({
        status: 404,
        code: 'VEHICLE_NOT_FOUND',
        message: 'Vehicle not found.',
        kind: 'not_found',
      });
    return truck;
  };

  const hasUnreleasedAssignment = async (vehicleId: string) => {
    const activeStates = new Set([
      'SCHEDULED',
      'IN_PROGRESS',
      'RESCUE',
      'BACKLOAD',
      'Scheduled',
      'In Progress',
      'Rescue',
      'Backload',
    ]);
    return (await data.getTrips()).some(
      (trip) => String(trip.truck_id) === vehicleId && activeStates.has(String(trip.status ?? trip.status_id)),
    );
  };

  const changeStatus = async (vehicleId: string, status: VehicleStatusCode, reason: string) => {
    requiredReason(reason);
    const vehicle = await get(vehicleId);
    if (!vehicle.is_active && status !== 'INACTIVE')
      throw new ServiceError({
        status: 409,
        code: 'INACTIVE_VEHICLE',
        message: 'Reactivate the vehicle before changing its operational status.',
        kind: 'conflict',
      });
    const updated = await data.updateTruckStatus(vehicle.id, statusIdByCode[status]);
    return toVehicle(updated);
  };

  return {
    list: async () => (await data.getTrucks()).map(toVehicle),
    create: async (input) => {
      if (!input.plateNumber.trim() || !input.size.trim())
        throw new ServiceError({
          status: 400,
          code: 'VEHICLE_REQUIRED_FIELDS',
          message: 'Plate number and vehicle size are required.',
          kind: 'validation',
        });
      return toVehicle(
        await data.createTruck({
          plate_number: input.plateNumber.trim(),
          vin: input.vin?.trim(),
          truck_size: input.size.trim(),
          load_type_id: input.loadTypeId,
          registration_expiry: input.registrationExpiry,
          remarks: input.notes?.trim(),
          truck_status_id: statusIdByCode.AVAILABLE,
        }),
      );
    },
    update: async (vehicleId, input) => {
      const vehicle = await get(vehicleId);
      if (!input.plateNumber.trim() || !input.size.trim())
        throw new ServiceError({
          status: 400,
          code: 'VEHICLE_REQUIRED_FIELDS',
          message: 'Plate number and vehicle size are required.',
          kind: 'validation',
        });
      return toVehicle(
        await data.updateTruck(vehicle.id, {
          plate_number: input.plateNumber.trim(),
          vin: input.vin?.trim(),
          truck_size: input.size.trim(),
          load_type_id: input.loadTypeId,
          registration_expiry: input.registrationExpiry,
          remarks: input.notes?.trim(),
        }),
      );
    },
    changeStatus,
    deactivate: async ({ vehicleId, reason }) => {
      requiredReason(reason);
      const vehicle = await get(vehicleId);
      if (await hasUnreleasedAssignment(vehicle.id))
        throw new ServiceError({
          status: 409,
          code: 'ACTIVE_ASSIGNMENT_BLOCKS_DEACTIVATION',
          message: 'Release active vehicle assignments before deactivation.',
          kind: 'conflict',
        });
      const statusUpdated = await data.updateTruckStatus(vehicle.id, statusIdByCode.INACTIVE);
      return toVehicle(await data.updateTruck(vehicle.id, { ...statusUpdated, is_active: false, is_deleted: false }));
    },
    reactivate: async ({ vehicleId, reason }) => {
      requiredReason(reason);
      const vehicle = await get(vehicleId);
      const statusUpdated = await data.updateTruckStatus(vehicle.id, statusIdByCode.AVAILABLE);
      return toVehicle(await data.updateTruck(vehicle.id, { ...statusUpdated, is_active: true, is_deleted: false }));
    },
    addMaintenance: async (input: VehicleMaintenanceInput) => {
      await get(input.vehicleId);
      if (!input.type.trim())
        throw new ServiceError({
          status: 400,
          code: 'MAINTENANCE_TYPE_REQUIRED',
          message: 'Maintenance type is required.',
          kind: 'validation',
        });
      await data.createMaintenanceLog({
        truck_id: input.vehicleId,
        maintenance_type: input.type.trim(),
        status: input.status,
        scheduled_date: input.scheduledDate,
        completed_at: input.completedAt,
        cost_amount: input.costAmount,
        notes: input.notes?.trim(),
      });
    },
  };
};
