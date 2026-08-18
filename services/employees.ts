import type { DriverProfile, Employee } from '../types';
import type { DataService } from './apiService';
import {
  ServiceError,
  type EmployeeEmploymentState,
  type EmployeeMutationInput,
  type EmployeeRecord,
  type EmployeeRoleCode,
  type EmployeeService,
} from './contracts';

const roleById: Record<string, EmployeeRoleCode> = {
  'er-1': 'DRIVER',
  'er-2': 'HELPER',
  'er-3': 'ENCODER',
  'er-4': 'DISPATCHER',
  'er-5': 'MANAGER',
};
const idByRole: Record<EmployeeRoleCode, string> = {
  DRIVER: 'er-1',
  HELPER: 'er-2',
  ENCODER: 'er-3',
  DISPATCHER: 'er-4',
  MANAGER: 'er-5',
};
const employmentByLabel: Record<string, EmployeeEmploymentState> = {
  Active: 'ACTIVE',
  'On Leave': 'ON_LEAVE',
  Suspended: 'SUSPENDED',
  Inactive: 'INACTIVE',
};
const labelByEmployment: Record<Exclude<EmployeeEmploymentState, 'INACTIVE'>, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  SUSPENDED: 'Suspended',
};

const requiredReason = (reason: string) => {
  if (!reason.trim())
    throw new ServiceError({
      status: 400,
      code: 'REASON_REQUIRED',
      message: 'A lifecycle reason is required.',
      kind: 'validation',
    });
};

const validate = (input: EmployeeMutationInput) => {
  if (!input.firstName.trim() || !input.lastName.trim())
    throw new ServiceError({
      status: 400,
      code: 'EMPLOYEE_NAME_REQUIRED',
      message: 'First and last name are required.',
      kind: 'validation',
    });
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    throw new ServiceError({
      status: 400,
      code: 'EMPLOYEE_EMAIL_INVALID',
      message: 'Enter a valid email address.',
      kind: 'validation',
    });
  if (input.role === 'DRIVER' && (!input.driver?.licenseNumber.trim() || !input.driver.licenseExpiry))
    throw new ServiceError({
      status: 400,
      code: 'DRIVER_LICENSE_REQUIRED',
      message: 'Drivers require a license number and expiry date.',
      kind: 'validation',
    });
};

const toRecord = (employee: Employee, driver?: DriverProfile): EmployeeRecord => ({
  id: employee.id,
  employeeCode: employee.employee_code ?? null,
  userId: employee.user_id ?? null,
  firstName: employee.first_name,
  lastName: employee.last_name,
  fullName: employee.full_name,
  role: roleById[employee.employee_role_id] ?? 'HELPER',
  contactNo: employee.contact_no ?? null,
  email: employee.email ?? null,
  employmentState:
    employee.is_active === false ? 'INACTIVE' : (employmentByLabel[employee.employment_status] ?? 'ACTIVE'),
  active: employee.is_active !== false,
  driver: driver
    ? {
        licenseNumber: driver.license_number ?? '',
        licenseExpiry: driver.license_expiry ?? '',
        notes: driver.notes ?? null,
      }
    : null,
  updatedAt: employee.updated_at,
  source: 'development-mock',
});

export const createDevelopmentEmployeeService = (data: DataService): EmployeeService => {
  const get = async (employeeId: string) => {
    const employee = (await data.getEmployees()).find(
      (item) => item.id === employeeId || item.employee_id === employeeId,
    );
    if (!employee)
      throw new ServiceError({
        status: 404,
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found.',
        kind: 'not_found',
      });
    return employee;
  };
  const toCurrentRecord = async (employee: Employee) => {
    const driver = (await data.getDrivers()).find((item) => item.employee_id === employee.id);
    return toRecord(employee, driver);
  };
  const hasUnreleasedAssignment = async (employeeId: string) => {
    const activeStates = new Set([
      'Scheduled',
      'In Progress',
      'Rescue',
      'Backload',
      'SCHEDULED',
      'IN_PROGRESS',
      'RESCUE',
      'BACKLOAD',
    ]);
    const driverIds = new Set([
      employeeId,
      ...(await data.getDrivers()).filter((driver) => driver.employee_id === employeeId).map((driver) => driver.id),
    ]);
    return (await data.getTrips()).some(
      (trip) =>
        activeStates.has(String(trip.status ?? trip.status_id)) &&
        [trip.driver_id, trip.helper1_employee_id, trip.helper2_employee_id].some(
          (id) => id && driverIds.has(String(id)),
        ),
    );
  };
  const saveDriver = async (employee: Employee, input: EmployeeMutationInput) => {
    if (input.role === 'DRIVER' && input.driver)
      await data.updateDriverProfile(employee.id, {
        license_number: input.driver.licenseNumber.trim(),
        license_expiry: input.driver.licenseExpiry,
        notes: input.driver.notes?.trim(),
      });
  };
  const payload = (input: EmployeeMutationInput) => ({
    user_id: input.userId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    full_name: `${input.firstName.trim()} ${input.lastName.trim()}`,
    employee_role_id: idByRole[input.role],
    contact_no: input.contactNo?.trim(),
    email: input.email?.trim(),
    employment_status: labelByEmployment[input.employmentState],
    is_active: true,
  });
  return {
    list: async () => {
      const [employees, drivers] = await Promise.all([data.getEmployees(), data.getDrivers()]);
      return employees.map((employee) =>
        toRecord(
          employee,
          drivers.find((driver) => driver.employee_id === employee.id),
        ),
      );
    },
    create: async (input) => {
      validate(input);
      const employee = await data.createEmployee(payload(input));
      await saveDriver(employee, input);
      return toCurrentRecord(employee);
    },
    update: async (employeeId, input) => {
      validate(input);
      const employee = await get(employeeId);
      const updated = await data.updateEmployee(employee.id, payload(input));
      await saveDriver(updated, input);
      return toCurrentRecord(updated);
    },
    deactivate: async ({ employeeId, reason }) => {
      requiredReason(reason);
      const employee = await get(employeeId);
      if (await hasUnreleasedAssignment(employee.id))
        throw new ServiceError({
          status: 409,
          code: 'ACTIVE_ASSIGNMENT_BLOCKS_DEACTIVATION',
          message: 'Release active employee assignments before deactivation.',
          kind: 'conflict',
        });
      return toCurrentRecord(
        await data.updateEmployee(employee.id, { is_active: false, employment_status: 'Inactive', is_deleted: false }),
      );
    },
    reactivate: async ({ employeeId, reason }) => {
      requiredReason(reason);
      const employee = await get(employeeId);
      const driver = (await data.getDrivers()).find((item) => item.employee_id === employee.id);
      if (roleById[employee.employee_role_id] === 'DRIVER' && (!driver?.license_number || !driver.license_expiry))
        throw new ServiceError({
          status: 409,
          code: 'DRIVER_LICENSE_REQUIRED',
          message: 'A driver needs a license number and expiry date before reactivation.',
          kind: 'conflict',
        });
      return toCurrentRecord(
        await data.updateEmployee(employee.id, { is_active: true, employment_status: 'Active', is_deleted: false }),
      );
    },
  };
};
