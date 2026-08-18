import type { AppSetting, AuditLog, Customer, Employee, Location, SystemUser, Trip, TripFuel, Truck } from '../types';

export type ServiceErrorKind =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'unavailable'
  | 'cancelled'
  | 'unexpected';

export interface ServiceErrorInit {
  status: number;
  code: string;
  message: string;
  kind: ServiceErrorKind;
  errors?: Record<string, string[]>;
  requestId?: string;
  retryable?: boolean;
  cause?: unknown;
}

export class ServiceError extends Error {
  readonly status: number;
  readonly code: string;
  readonly kind: ServiceErrorKind;
  readonly errors: Record<string, string[]>;
  readonly requestId?: string;
  readonly retryable: boolean;

  constructor(init: ServiceErrorInit) {
    super(init.message, { cause: init.cause });
    this.name = 'ServiceError';
    this.status = init.status;
    this.code = init.code;
    this.kind = init.kind;
    this.errors = init.errors ?? {};
    this.requestId = init.requestId;
    this.retryable = init.retryable ?? false;
  }
}

export const normalizeServiceError = (error: unknown): ServiceError => {
  if (error instanceof ServiceError) return error;

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ServiceError({
      status: 499,
      code: 'REQUEST_CANCELLED',
      message: 'The request was cancelled.',
      kind: 'cancelled',
    });
  }

  return new ServiceError({
    status: 500,
    code: 'UNEXPECTED_ERROR',
    message: 'The service could not complete the request. Try again.',
    kind: 'unexpected',
    retryable: true,
    cause: error,
  });
};

export interface RequestOptions {
  signal?: AbortSignal;
  forceRefresh?: boolean;
}

export interface ListQuery {
  search?: string;
  filters?: Record<string, string | number | boolean | undefined>;
  ordering?: string;
  page?: number;
  limit?: number;
}

export interface PageResult<T> {
  count: number;
  page: number;
  limit: number;
  next: number | null;
  previous: number | null;
  results: T[];
  refreshedAt: string;
}

export const TRIP_STATUS_CODES = [
  'DRAFT',
  'SCHEDULED',
  'IN_PROGRESS',
  'RESCUE',
  'BACKLOAD',
  'COMPLETED',
  'CANCELLED',
  'TRANSFERRED',
] as const;

export const TRIP_LOAD_TYPE_CODES = ['DRY', 'CHILLED', 'REF', 'COMBI', 'MIXED'] as const;

export const TRIP_OPERATIONS_ORDERING_FIELDS = [
  'pickup_date',
  'trip_advise_code',
  'client',
  'status',
  'updated_at',
] as const;

export const TRIP_OPERATIONS_ORDERING_VALUES = [
  'pickup_date',
  '-pickup_date',
  'trip_advise_code',
  '-trip_advise_code',
  'client',
  '-client',
  'status',
  '-status',
  'updated_at',
  '-updated_at',
] as const;

export type TripStatusCode = (typeof TRIP_STATUS_CODES)[number];
export type TripLoadTypeCode = (typeof TRIP_LOAD_TYPE_CODES)[number];
export type TripOperationsOrderingField = (typeof TRIP_OPERATIONS_ORDERING_FIELDS)[number];
export type TripOperationsOrdering = (typeof TRIP_OPERATIONS_ORDERING_VALUES)[number];

export interface TripOperationsFilters {
  status?: TripStatusCode;
  pickupStart?: string;
  pickupEnd?: string;
  clientId?: string;
  truckId?: string;
  driverId?: string;
  loadType?: TripLoadTypeCode;
  branchId?: string;
  transferOnly?: boolean;
}

export interface TripOperationsQuery {
  search?: string;
  filters?: TripOperationsFilters;
  ordering?: TripOperationsOrdering;
  page?: number;
  limit?: number;
}

export interface TripOperationsLookupOption<TValue extends string = string> {
  value: TValue;
  label: string;
  active: boolean;
}

export interface TripOperationsReference<TValue extends string = string> {
  id: TValue | null;
  label: string | null;
  active: boolean | null;
}

export interface TripOperationsRow {
  id: string;
  tripAdviceCode: string;
  client: TripOperationsReference;
  consignee: TripOperationsReference;
  route: {
    originLabel: string | null;
    destinationLabel: string | null;
  };
  pickupDate: string;
  pickupWindow: string | null;
  truck: TripOperationsReference;
  driver: TripOperationsReference;
  loadType: {
    code: TripLoadTypeCode | null;
    label: string | null;
  };
  status: {
    code: TripStatusCode | null;
    label: string | null;
  };
  branch: TripOperationsReference;
  isTransfer: boolean;
  updatedAt: string | null;
  encoderEmployeeId: string | null;
  isDraft: boolean;
}

export interface TripOperationsLookups {
  statuses: TripOperationsLookupOption<TripStatusCode>[];
  loadTypes: TripOperationsLookupOption<TripLoadTypeCode>[];
  clients: TripOperationsLookupOption[];
  trucks: TripOperationsLookupOption[];
  drivers: TripOperationsLookupOption[];
  branches: TripOperationsLookupOption[];
  refreshedAt: string;
  source: 'development-mock';
}

export interface TripOperationsPage extends PageResult<TripOperationsRow> {
  source: 'development-mock';
}

export interface WorkspaceSnapshot {
  trips: Trip[];
  employees: Employee[];
  customers: Customer[];
  locations: Location[];
  trucks: Truck[];
  fuels: TripFuel[];
  users: SystemUser[];
  refreshedAt: string;
  source: 'development-mock';
}

export interface WorkspaceRequestOptions extends RequestOptions {
  includeAdministrativeUsers?: boolean;
}

export interface WorkspaceService {
  loadSnapshot(options?: WorkspaceRequestOptions): Promise<WorkspaceSnapshot>;
  refresh(options?: WorkspaceRequestOptions): Promise<WorkspaceSnapshot>;
}

export const VEHICLE_STATUS_CODES = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE'] as const;
export type VehicleStatusCode = (typeof VEHICLE_STATUS_CODES)[number];
export type VehicleMaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  vin: string | null;
  size: string;
  loadTypeId: string | null;
  status: VehicleStatusCode;
  registrationExpiry: string | null;
  active: boolean;
  notes: string | null;
  updatedAt: string;
  source: 'development-mock';
}

export interface VehicleMutationInput {
  plateNumber: string;
  vin?: string;
  size: string;
  loadTypeId?: string;
  registrationExpiry?: string;
  notes?: string;
}

export interface VehicleMaintenanceInput {
  vehicleId: string;
  type: string;
  status: VehicleMaintenanceStatus;
  scheduledDate?: string;
  completedAt?: string;
  costAmount?: number;
  notes?: string;
}

export interface VehicleLifecycleCommand {
  vehicleId: string;
  reason: string;
}

export interface VehicleService {
  list(): Promise<VehicleRecord[]>;
  create(input: VehicleMutationInput): Promise<VehicleRecord>;
  update(vehicleId: string, input: VehicleMutationInput): Promise<VehicleRecord>;
  changeStatus(vehicleId: string, status: VehicleStatusCode, reason: string): Promise<VehicleRecord>;
  deactivate(command: VehicleLifecycleCommand): Promise<VehicleRecord>;
  reactivate(command: VehicleLifecycleCommand): Promise<VehicleRecord>;
  addMaintenance(input: VehicleMaintenanceInput): Promise<void>;
}

export const EMPLOYEE_ROLE_CODES = ['DRIVER', 'HELPER', 'ENCODER', 'DISPATCHER', 'MANAGER'] as const;
export type EmployeeRoleCode = (typeof EMPLOYEE_ROLE_CODES)[number];
export type EmployeeEmploymentState = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'INACTIVE';

export interface EmployeeDriverExtension {
  licenseNumber: string;
  licenseExpiry: string;
  notes: string | null;
}

export interface EmployeeRecord {
  id: string;
  employeeCode: string | null;
  userId: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  role: EmployeeRoleCode;
  contactNo: string | null;
  email: string | null;
  employmentState: EmployeeEmploymentState;
  active: boolean;
  driver: EmployeeDriverExtension | null;
  updatedAt: string;
  source: 'development-mock';
}

export interface EmployeeMutationInput {
  userId?: string;
  firstName: string;
  lastName: string;
  role: EmployeeRoleCode;
  contactNo?: string;
  email?: string;
  employmentState: Exclude<EmployeeEmploymentState, 'INACTIVE'>;
  driver?: EmployeeDriverExtension;
}

export interface EmployeeLifecycleCommand {
  employeeId: string;
  reason: string;
}

export interface EmployeeService {
  list(): Promise<EmployeeRecord[]>;
  create(input: EmployeeMutationInput): Promise<EmployeeRecord>;
  update(employeeId: string, input: EmployeeMutationInput): Promise<EmployeeRecord>;
  deactivate(command: EmployeeLifecycleCommand): Promise<EmployeeRecord>;
  reactivate(command: EmployeeLifecycleCommand): Promise<EmployeeRecord>;
}

export type ReferenceDataKind = 'CLIENT' | 'CONSIGNEE' | 'LOCATION' | 'INTERNAL_CLIENT_CODE' | 'LOAD_TYPE';

export interface ReferenceDataSnapshot {
  clients: import('../types').Client[];
  consignees: import('../types').Consignee[];
  locations: import('../types').Location[];
  internalClientCodes: import('../types').InternalClientCode[];
  loadTypes: import('../types').LoadType[];
  source: 'development-mock';
}

export interface ClientMutationInput {
  clientCode: string;
  clientName: string;
  fullName?: string;
  address?: string;
}

export interface ConsigneeMutationInput {
  clientId: string;
  fullName: string;
  contactNo?: string;
  address?: string;
  cityArea?: string;
}

export interface LocationMutationInput {
  locationName: string;
  locationType: string;
  province?: string;
  region?: string;
  addressLine1?: string;
  latitude: number;
  longitude: number;
}

export interface InternalClientCodeMutationInput {
  clientId: string;
  code: string;
  description?: string;
}

export interface ReferenceDataService {
  list(): Promise<ReferenceDataSnapshot>;
  createClient(input: ClientMutationInput): Promise<import('../types').Client>;
  updateClient(clientId: string, input: ClientMutationInput): Promise<import('../types').Client>;
  setClientActive(clientId: string, active: boolean): Promise<import('../types').Client>;
  createConsignee(input: ConsigneeMutationInput): Promise<import('../types').Consignee>;
  updateConsignee(consigneeId: string, input: ConsigneeMutationInput): Promise<import('../types').Consignee>;
  setConsigneeActive(consigneeId: string, active: boolean): Promise<import('../types').Consignee>;
  createLocation(input: LocationMutationInput): Promise<import('../types').Location>;
  updateLocation(locationId: string, input: LocationMutationInput): Promise<import('../types').Location>;
  setLocationActive(locationId: string, active: boolean): Promise<import('../types').Location>;
  createInternalClientCode(input: InternalClientCodeMutationInput): Promise<import('../types').InternalClientCode>;
  updateInternalClientCode(
    codeId: string,
    input: InternalClientCodeMutationInput,
  ): Promise<import('../types').InternalClientCode>;
}

export interface TripOperationsService {
  list(query?: TripOperationsQuery, options?: RequestOptions): Promise<TripOperationsPage>;
  getLookups(options?: RequestOptions): Promise<TripOperationsLookups>;
  getById(id: string, options?: RequestOptions): Promise<Trip>;
}

export const TRIP_DETAIL_SECTIONS = ['overview', 'stops', 'assignments', 'events', 'fuel', 'activity'] as const;

export type TripDetailSection = (typeof TRIP_DETAIL_SECTIONS)[number];

export interface TripDetailReference {
  id: string | null;
  label: string | null;
  active: boolean | null;
}

export interface TripDetailFreshness {
  source: 'development-mock';
  fetchedAt: string;
  recordUpdatedAt: string | null;
}

export interface TripDetailStatus {
  code: TripStatusCode | null;
  label: string | null;
}

export interface TripDetailLoadType {
  code: TripLoadTypeCode | null;
  label: string | null;
}

export interface TripDetailRouteSummary {
  origin: TripDetailReference;
  destination: TripDetailReference;
}

export type TripAssignmentState = 'assigned' | 'partially_assigned' | 'unassigned';

export interface TripCurrentAssignments {
  state: TripAssignmentState;
  driver: TripDetailReference;
  truck: TripDetailReference;
  helpers: TripDetailReference[];
}

export interface TripQuickDetails {
  id: string;
  tripAdviceCode: string;
  status: TripDetailStatus;
  client: TripDetailReference;
  consignee: TripDetailReference;
  route: TripDetailRouteSummary;
  pickupDate: string | null;
  pickupWindow: string | null;
  assignments: TripCurrentAssignments;
  updatedAt: string | null;
  freshness: TripDetailFreshness;
}

export interface TripDetailsOverview {
  id: string;
  tripAdviceCode: string;
  status: TripDetailStatus;
  branch: TripDetailReference;
  encoder: TripDetailReference;
  client: TripDetailReference;
  internalClientCode: TripDetailReference;
  consignee: TripDetailReference;
  loadType: TripDetailLoadType;
  pickupDate: string | null;
  pickupWindow: string | null;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  transfer: {
    isTransfer: boolean;
    sourceTrip: TripDetailReference;
  };
  assignments: TripCurrentAssignments;
  createdAt: string | null;
  updatedAt: string | null;
  version: number | null;
  freshness: TripDetailFreshness;
}

export type TripDetailStopType = 'PICKUP' | 'DROPOFF' | 'OTHER';

export interface TripDetailStop {
  id: string;
  sequence: number;
  type: TripDetailStopType;
  typeLabel: string;
  location: TripDetailReference;
  locationType: string | null;
  address: string | null;
  province: string | null;
  region: string | null;
  specificAddress: string | null;
  consignee: TripDetailReference;
  scheduledAt: string | null;
  actualAt: string | null;
}

export interface TripStopsSection {
  tripId: string;
  items: TripDetailStop[];
  route: TripDetailRouteSummary;
  freshness: TripDetailFreshness;
}

export type TripAssignmentRole = 'DRIVER' | 'HELPER' | 'TRUCK' | 'UNKNOWN';

export interface TripAssignmentHistoryEntry {
  id: string;
  role: TripAssignmentRole;
  resource: TripDetailReference;
  assignedAt: string | null;
  releasedAt: string | null;
  assignedBy: TripDetailReference;
  releasedBy: TripDetailReference;
  releaseReason: string | null;
  current: boolean;
}

export interface TripAssignmentsSection {
  tripId: string;
  current: TripCurrentAssignments;
  history: TripAssignmentHistoryEntry[];
  freshness: TripDetailFreshness;
}

export interface TripDetailEvent {
  id: string;
  eventType: string;
  occurredAt: string | null;
  recordedBy: TripDetailReference;
  notes: string | null;
  documentNumber: string | null;
}

export interface TripEventsSection {
  tripId: string;
  items: TripDetailEvent[];
  freshness: TripDetailFreshness;
}

export interface TripFuelRecord {
  id: string;
  occurredAt: string | null;
  quantity: number;
  unit: 'L';
  unitPrice: number | null;
  lineCost: number | null;
  recordedBy: TripDetailReference;
  referenceNumber: string | null;
}

export interface TripFuelSection {
  tripId: string;
  items: TripFuelRecord[];
  totals: {
    quantity: number;
    unit: 'L';
    cost: number | null;
  };
  freshness: TripDetailFreshness;
}

export interface TripActivityEntry {
  id: string;
  action: string;
  occurredAt: string;
  actor: TripDetailReference;
  summary: string | null;
}

export interface TripActivitySection {
  tripId: string;
  supported: boolean;
  reason: string | null;
  items: TripActivityEntry[];
  freshness: TripDetailFreshness;
}

export interface TripDetailsService {
  getQuickDetails(id: string, options?: RequestOptions): Promise<TripQuickDetails>;
  getOverview(id: string, options?: RequestOptions): Promise<TripDetailsOverview>;
  getStops(id: string, options?: RequestOptions): Promise<TripStopsSection>;
  getAssignments(id: string, options?: RequestOptions): Promise<TripAssignmentsSection>;
  getEvents(id: string, options?: RequestOptions): Promise<TripEventsSection>;
  getFuel(id: string, options?: RequestOptions): Promise<TripFuelSection>;
  getActivity(id: string, options?: RequestOptions): Promise<TripActivitySection>;
}

export type TripSaveIntent = 'DRAFT' | 'SCHEDULED';
export type TripFormStopType = 'PICKUP' | 'DROPOFF';

export interface TripFormStopInput {
  id: string;
  sequence: number;
  type: TripFormStopType;
  locationId: string;
  specificAddress: string;
  consigneeId?: string;
}

export interface TripFormValues {
  tripAdviceCode: string;
  encoderEmployeeId: string;
  branchId: string;
  clientId: string;
  internalClientCodeId?: string;
  consigneeId?: string;
  loadTypeCode: TripLoadTypeCode | '';
  saveIntent: TripSaveIntent;
  plannedStartAt: string;
  plannedEndAt: string;
  isTransfer: boolean;
  transferFromId?: string;
  stops: TripFormStopInput[];
}

export interface TripFormLookup<T extends { value: string } = { value: string }> {
  value: T['value'];
  label: string;
  active: boolean;
}

export interface TripFormLookups {
  employees: TripFormLookup[];
  branches: TripFormLookup[];
  clients: TripFormLookup[];
  internalClientCodes: TripFormLookup[];
  consignees: TripFormLookup[];
  loadTypes: TripFormLookup<TripFormLookup & { value: TripLoadTypeCode }>[];
  locations: TripFormLookup[];
  transferSources: TripFormLookup[];
}

export interface TripFormInitialization {
  mode: 'create' | 'edit';
  tripId: string | null;
  values: TripFormValues;
  lookups: TripFormLookups;
  version: number | null;
  readOnlyAssignments: { driverLabel: string | null; truckLabel: string | null; helperLabels: string[] };
  metadata: { createdAt: string | null; updatedAt: string | null };
  source: 'development-mock';
}

export interface TripFormCreateRequest {
  values: TripFormValues;
}

export interface TripFormUpdateRequest extends TripFormCreateRequest {
  tripId: string;
  version: number;
}

export interface TripFormMutationResponse {
  trip: Trip;
  tripId: string;
  destination: string;
  version: number;
  source: 'development-mock';
}

export interface TripEditorService {
  initializeCreate(options?: RequestOptions): Promise<TripFormInitialization>;
  initializeEdit(tripId: string, options?: RequestOptions): Promise<TripFormInitialization>;
  create(request: TripFormCreateRequest, options?: RequestOptions): Promise<TripFormMutationResponse>;
  update(request: TripFormUpdateRequest, options?: RequestOptions): Promise<TripFormMutationResponse>;
}

export type AssignmentResourceType = 'DRIVER' | 'HELPER' | 'TRUCK';
export type AssignmentAvailabilityState =
  'AVAILABLE' | 'ASSIGNED_TO_TRIP' | 'CONFLICT' | 'INACTIVE' | 'INELIGIBLE' | 'UNAVAILABLE' | 'UNKNOWN';

export interface AssignmentAvailabilityRequest {
  tripId: string;
  plannedStartAt: string;
  plannedEndAt: string;
  timezone: 'Asia/Manila';
  refresh?: boolean;
  version?: number | null;
}

export interface AssignmentAvailabilityResource {
  id: string;
  label: string;
  state: AssignmentAvailabilityState;
  reasons: string[];
  conflictingTripCode: string | null;
  conflictingStartAt: string | null;
  conflictingEndAt: string | null;
  active: boolean;
  eligible: boolean;
}

export interface TripAssignmentAvailability {
  tripId: string;
  plannedStartAt: string;
  plannedEndAt: string;
  timezone: 'Asia/Manila';
  drivers: AssignmentAvailabilityResource[];
  helpers: AssignmentAvailabilityResource[];
  trucks: AssignmentAvailabilityResource[];
  refreshedAt: string;
  version: number;
  source: 'development-mock';
}

export interface AssignmentCommand {
  tripId: string;
  role: AssignmentResourceType;
  resourceId: string;
  plannedStartAt: string;
  plannedEndAt: string;
  expectedVersion: number;
  idempotencyKey?: string;
  reason?: string;
}

export interface AssignmentReleaseCommand {
  tripId: string;
  assignmentId: string;
  expectedVersion: number;
  reason: string;
  idempotencyKey?: string;
}

export interface AssignmentReassignCommand {
  tripId: string;
  assignmentId: string;
  role: Exclude<AssignmentResourceType, 'HELPER'>;
  resourceId: string;
  plannedStartAt: string;
  plannedEndAt: string;
  expectedVersion: number;
  reason: string;
  idempotencyKey?: string;
}

export interface AssignmentLedgerEntry {
  id: string;
  tripId: string;
  role: AssignmentResourceType;
  resourceId: string;
  resourceLabel: string;
  plannedStartAt: string;
  plannedEndAt: string;
  assignedAt: string;
  releasedAt: string | null;
  releaseReason: string | null;
  current: boolean;
}

export interface AssignmentMutationResponse {
  tripId: string;
  current: AssignmentLedgerEntry[];
  history: AssignmentLedgerEntry[];
  availability: TripAssignmentAvailability;
  version: number;
  source: 'development-mock';
}

export interface TripAssignmentService {
  getAvailability(
    request: AssignmentAvailabilityRequest,
    options?: RequestOptions,
  ): Promise<TripAssignmentAvailability>;
  getAssignments(tripId: string, options?: RequestOptions): Promise<AssignmentMutationResponse>;
  assign(command: AssignmentCommand, options?: RequestOptions): Promise<AssignmentMutationResponse>;
  reassign(command: AssignmentReassignCommand, options?: RequestOptions): Promise<AssignmentMutationResponse>;
  release(command: AssignmentReleaseCommand, options?: RequestOptions): Promise<AssignmentMutationResponse>;
  releaseForLifecycle(
    tripId: string,
    reason: string,
    options?: RequestOptions,
  ): Promise<{ releasedCount: number; source: 'development-mock' }>;
}

export interface TripTransitionHistoryEntry {
  id: string;
  from: TripStatusCode;
  to: TripStatusCode;
  reason: string | null;
  occurredAt: string;
  successorTripId: string | null;
}

export interface TripTransitionSnapshot {
  tripId: string;
  status: TripStatusCode;
  version: number;
  allowed: TripStatusCode[];
  history: TripTransitionHistoryEntry[];
  source: 'development-mock';
}

export interface TripTransitionCommand {
  tripId: string;
  target: Exclude<TripStatusCode, 'DRAFT' | 'SCHEDULED'>;
  expectedVersion: number;
  reason?: string;
  successorTripId?: string;
}

export interface TripTransitionService {
  getSnapshot(tripId: string, options?: RequestOptions): Promise<TripTransitionSnapshot>;
  transition(command: TripTransitionCommand, options?: RequestOptions): Promise<TripTransitionSnapshot>;
}

export type AuthStatus =
  'unauthenticated' | 'authenticating' | 'authenticated' | 'refreshing' | 'expired' | 'inactive' | 'denied';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface DevelopmentIdentitySummary {
  username: string;
  role: string;
  active?: boolean;
}

export interface AuthSnapshot {
  status: AuthStatus;
  user: SystemUser | null;
  error: ServiceError | null;
}

export interface AuthService {
  readonly adapterKind: 'development' | 'unconfigured-production';
  readonly reviewIdentities: readonly DevelopmentIdentitySummary[];
  getSnapshot(): AuthSnapshot;
  subscribe(listener: (snapshot: AuthSnapshot) => void): () => void;
  signIn(credentials: AuthCredentials): Promise<SystemUser>;
  refresh(options?: RequestOptions): Promise<SystemUser>;
  signOut(): Promise<void>;
  invalidateUser(userId: string, reason: string): Promise<void>;
}

export type PlatformRoleCode = (typeof import('../permissions/policy').OFFICIAL_ROLES)[number];
export interface UserInvitationInput {
  username: string;
  email: string;
  role: PlatformRoleCode;
}
export interface UserLifecycleCommand {
  userId: string;
  reason: string;
}
export interface UserAdministrationService {
  list(): Promise<SystemUser[]>;
  invite(input: UserInvitationInput): Promise<SystemUser>;
  assignRole(userId: string, role: PlatformRoleCode): Promise<SystemUser>;
  deactivate(command: UserLifecycleCommand): Promise<SystemUser>;
  reactivate(command: UserLifecycleCommand): Promise<SystemUser>;
}

export interface SettingsAuditSnapshot {
  settings: AppSetting[];
  auditLogs: AuditLog[];
  source: 'development-mock';
}

export interface SettingUpdateCommand {
  settingId: string;
  value: string;
  actorUserId: string;
}

export interface SettingsAuditService {
  getSnapshot(): Promise<SettingsAuditSnapshot>;
  updateSettings(commands: SettingUpdateCommand[]): Promise<AppSetting[]>;
  updateSetting(command: SettingUpdateCommand): Promise<AppSetting>;
}

export interface DispatcherDashboardTripRow {
  id: string;
  tripAdviceCode: string;
  clientLabel: string;
  pickupDate: string;
  pickupWindow: string | null;
  routeLabel: string;
  truckLabel: string | null;
  driverLabel: string | null;
  statusLabel: string;
  plannedStartPassed: boolean;
}

export interface DispatcherDashboardSnapshot {
  source: 'development-mock';
  asOf: string;
  refreshedAt: string;
  tripsToday: number;
  scheduledTrips: number;
  inProgressTrips: number;
  completedThisWeek: number;
  activeTrips: DispatcherDashboardTripRow[];
  truckAvailability: { available: number; inUse: number; maintenance: number; unavailable: number; total: number };
  driverAvailability: { available: number; assigned: number; unavailable: number; onLeave: number; total: number };
}

export interface DispatcherDashboardService {
  getSnapshot(options?: RequestOptions): Promise<DispatcherDashboardSnapshot>;
}

export interface ManagerAnalyticsSnapshot {
  source: 'development-mock';
  asOf: string;
  refreshedAt: string;
  window: { currentStart: string; currentEnd: string; previousStart: string; previousEnd: string };
  completedTrips: { current: number; previous: number };
  fuelTotals: { quantity: number; unit: 'L'; cost: number };
  statusCounts: Array<{ status: string; count: number }>;
  clientActivity: Array<{ clientLabel: string; tripCount: number }>;
}

export interface ManagerAnalyticsService {
  getSnapshot(options?: RequestOptions): Promise<ManagerAnalyticsSnapshot>;
}

export type OperationalAttentionKind = 'ACTIVE_EXCEPTION_STATUS' | 'PLANNED_START_PASSED';

export interface OperationalAttentionItem {
  id: string;
  tripAdviceCode: string;
  clientLabel: string;
  kind: OperationalAttentionKind;
  factualReason: string;
  statusLabel: string;
  plannedStartAt: string | null;
}

export interface OperationalAttentionSnapshot {
  source: 'development-mock';
  asOf: string;
  refreshedAt: string;
  items: OperationalAttentionItem[];
}

export interface OperationalAttentionService {
  getSnapshot(options?: RequestOptions): Promise<OperationalAttentionSnapshot>;
}
