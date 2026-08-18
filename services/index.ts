import { authService } from './authService';
import { developmentDataAdapter, type DataService } from './apiService';
import type {
  AuthService,
  DispatcherDashboardService,
  ManagerAnalyticsService,
  OperationalAttentionService,
  RequestOptions,
  TripDetailsService,
  TripAssignmentService,
  TripTransitionService,
  TripEditorService,
  TripOperationsService,
  VehicleService,
  EmployeeService,
  ReferenceDataService,
  SettingsAuditService,
  UserAdministrationService,
  WorkspaceService,
  WorkspaceSnapshot,
  WorkspaceRequestOptions,
} from './contracts';
import { createDevelopmentTripOperationsService } from './tripOperations';
import { createDevelopmentTripDetailsService } from './tripDetails';
import { createDevelopmentTripEditorService } from './tripEditor';
import { createDevelopmentTripAssignmentService } from './tripAssignments';
import { createDevelopmentTripTransitionService } from './tripTransitions';
import { createDevelopmentVehicleService } from './vehicles';
import { createDevelopmentEmployeeService } from './employees';
import { createDevelopmentReferenceDataService } from './referenceData';
import { createDevelopmentUserAdministrationService } from './users';
import { createDevelopmentSettingsAuditService } from './settingsAudit';
import { createDevelopmentDispatcherDashboardService } from './dispatcherDashboard';
import { createDevelopmentManagerAnalyticsService } from './managerAnalytics';
import { createDevelopmentOperationalAttentionService } from './operationalAttention';

const throwIfAborted = (options?: RequestOptions) => {
  if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

const loadSnapshot = async (options?: WorkspaceRequestOptions): Promise<WorkspaceSnapshot> => {
  throwIfAborted(options);
  const [trips, employees, customers, locations, trucks, fuels, users] = await Promise.all([
    developmentDataAdapter.getTrips(),
    developmentDataAdapter.getEmployees(),
    developmentDataAdapter.getCustomers(),
    developmentDataAdapter.getLocations(),
    developmentDataAdapter.getTrucks(),
    developmentDataAdapter.getFuelLogs(),
    options?.includeAdministrativeUsers ? developmentDataAdapter.getUsers() : Promise.resolve([]),
  ]);
  throwIfAborted(options);

  return {
    trips,
    employees,
    customers,
    locations,
    trucks,
    fuels,
    users,
    refreshedAt: new Date().toISOString(),
    source: 'development-mock',
  };
};

const workspace: WorkspaceService = {
  loadSnapshot,
  refresh: (options) => loadSnapshot({ ...options, forceRefresh: true }),
};

const trips: TripOperationsService = createDevelopmentTripOperationsService(developmentDataAdapter);
const tripDetails: TripDetailsService = createDevelopmentTripDetailsService(developmentDataAdapter);
const tripEditor: TripEditorService = createDevelopmentTripEditorService(developmentDataAdapter);
const tripAssignments: TripAssignmentService = createDevelopmentTripAssignmentService(developmentDataAdapter);
const tripTransitions: TripTransitionService = createDevelopmentTripTransitionService(
  developmentDataAdapter,
  tripAssignments,
);
const vehicles: VehicleService = createDevelopmentVehicleService(developmentDataAdapter);
const employees: EmployeeService = createDevelopmentEmployeeService(developmentDataAdapter);
const referenceData: ReferenceDataService = createDevelopmentReferenceDataService(developmentDataAdapter);
const users: UserAdministrationService = createDevelopmentUserAdministrationService(
  developmentDataAdapter,
  authService,
);
const settingsAudit: SettingsAuditService = createDevelopmentSettingsAuditService(developmentDataAdapter);
const dashboard: DispatcherDashboardService = createDevelopmentDispatcherDashboardService(developmentDataAdapter);
const managerAnalytics: ManagerAnalyticsService = createDevelopmentManagerAnalyticsService(developmentDataAdapter);
const operationalAttention: OperationalAttentionService =
  createDevelopmentOperationalAttentionService(developmentDataAdapter);

export const services = {
  auth: authService,
  data: developmentDataAdapter,
  workspace,
  trips,
  tripDetails,
  tripEditor,
  tripAssignments,
  tripTransitions,
  vehicles,
  employees,
  referenceData,
  users,
  settingsAudit,
  dashboard,
  managerAnalytics,
  operationalAttention,
} as const satisfies ServiceBoundary;

export interface ServiceBoundary {
  readonly auth: AuthService;
  readonly data: DataService;
  readonly workspace: WorkspaceService;
  readonly trips: TripOperationsService;
  readonly tripDetails: TripDetailsService;
  readonly tripEditor: TripEditorService;
  readonly tripAssignments: TripAssignmentService;
  readonly tripTransitions: TripTransitionService;
  readonly vehicles: VehicleService;
  readonly employees: EmployeeService;
  readonly referenceData: ReferenceDataService;
  readonly users: UserAdministrationService;
  readonly settingsAudit: SettingsAuditService;
  readonly dashboard: DispatcherDashboardService;
  readonly managerAnalytics: ManagerAnalyticsService;
  readonly operationalAttention: OperationalAttentionService;
}

export * from './contracts';
