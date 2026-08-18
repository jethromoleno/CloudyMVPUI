import type { AuthStatus } from '../services/contracts';
import type { SystemUser, UserRoleType } from '../types';

export const OFFICIAL_ROLES = ['SuperAdmin', 'Admin', 'Dispatcher', 'Encoder', 'Viewer'] as const;

export const permissionActions = {
  read: 'READ',
  create: 'CREATE',
  update: 'UPDATE',
  cancel: 'CANCEL',
  deactivate: 'DEACTIVATE',
  reactivate: 'REACTIVATE',
  assign: 'ASSIGN',
  statusChange: 'STATUS_CHANGE',
  export: 'EXPORT',
  manage: 'MANAGE',
} as const;

export const permissionResources = {
  dashboard: 'DASHBOARD',
  tripAdvice: 'TRIP_ADVICE',
  tripAssignments: 'TRIP_ASSIGNMENTS',
  tripEvents: 'TRIP_EVENTS',
  tripFuelLogs: 'TRIP_FUEL_LOGS',
  trucks: 'TRUCKS',
  employees: 'EMPLOYEES',
  referenceData: 'REFERENCE_DATA',
  settings: 'SETTINGS',
  users: 'USERS',
  usersRoles: 'USERS_ROLES',
  auditLogs: 'AUDIT_LOGS',
  inventory: 'INVENTORY',
  billing: 'BILLING',
} as const;

export const permissionRouteIds = {
  root: 'ROOT',
  login: 'LOGIN',
  hub: 'HUB',
  workspace: 'WORKSPACE',
  dashboard: 'DASHBOARD',
  trips: 'TRIPS',
  tripCreate: 'TRIP_CREATE',
  tripDetail: 'TRIP_DETAIL',
  tripEdit: 'TRIP_EDIT',
  trucks: 'TRUCKS',
  employees: 'EMPLOYEES',
  referenceData: 'REFERENCE_DATA',
  settings: 'SETTINGS',
  notFound: 'NOT_FOUND',
} as const;

export const navigationDestinations = {
  hub: 'HUB',
  dashboard: 'DASHBOARD',
  tripOperations: 'TRIP_OPERATIONS',
  tripSchedule: 'TRIP_SCHEDULE',
  tripCreate: 'TRIP_CREATE',
  trucks: 'TRUCKS',
  employees: 'EMPLOYEES',
  referenceData: 'REFERENCE_DATA',
  settings: 'SETTINGS',
  inventory: 'INVENTORY',
  billing: 'BILLING',
} as const;

export type PermissionAction = (typeof permissionActions)[keyof typeof permissionActions];
export type PermissionResource = (typeof permissionResources)[keyof typeof permissionResources];
export type PermissionRouteId = (typeof permissionRouteIds)[keyof typeof permissionRouteIds];
export type NavigationDestination = (typeof navigationDestinations)[keyof typeof navigationDestinations];
export type PermissionId = `${PermissionResource}.${PermissionAction}`;

export type PermissionIdentityState =
  'authenticated' | 'unauthenticated' | 'inactive' | 'denied' | 'unknown-role' | 'conflicting-role';

export interface PermissionIdentityDecision {
  state: PermissionIdentityState;
  role: UserRoleType | null;
  user: SystemUser | null;
  developmentOnly: boolean;
  reason: string | null;
}

export interface PermissionContext {
  recordOwnerId?: string | null;
  recordState?: string | null;
  recordIsDraft?: boolean;
  blockedReason?: string | null;
}

export interface ActionPresentation {
  visible: boolean;
  disabled: boolean;
  reason: string | null;
}

export interface EffectivePermissions {
  readonly identity: PermissionIdentityDecision;
  can(action: PermissionAction, resource: PermissionResource, context?: PermissionContext): boolean;
  canAccessRoute(route: PermissionRouteId, context?: PermissionContext): boolean;
  canAccessPath(pathname: string): boolean;
  canShowNavigation(destination: NavigationDestination): boolean;
  present(action: PermissionAction, resource: PermissionResource, context?: PermissionContext): ActionPresentation;
}

const id = (resource: PermissionResource, action: PermissionAction): PermissionId => `${resource}.${action}`;

export const permissionIds = {
  dashboardRead: id(permissionResources.dashboard, permissionActions.read),
  tripRead: id(permissionResources.tripAdvice, permissionActions.read),
  tripCreate: id(permissionResources.tripAdvice, permissionActions.create),
  tripUpdate: id(permissionResources.tripAdvice, permissionActions.update),
  tripCancel: id(permissionResources.tripAdvice, permissionActions.cancel),
  tripStatusChange: id(permissionResources.tripAdvice, permissionActions.statusChange),
  tripAssign: id(permissionResources.tripAssignments, permissionActions.assign),
  tripEventRead: id(permissionResources.tripEvents, permissionActions.read),
  tripEventCreate: id(permissionResources.tripEvents, permissionActions.create),
  tripFuelRead: id(permissionResources.tripFuelLogs, permissionActions.read),
  tripFuelCreate: id(permissionResources.tripFuelLogs, permissionActions.create),
  truckRead: id(permissionResources.trucks, permissionActions.read),
  truckCreate: id(permissionResources.trucks, permissionActions.create),
  truckUpdate: id(permissionResources.trucks, permissionActions.update),
  truckStatusChange: id(permissionResources.trucks, permissionActions.statusChange),
  truckDeactivate: id(permissionResources.trucks, permissionActions.deactivate),
  truckReactivate: id(permissionResources.trucks, permissionActions.reactivate),
  employeeRead: id(permissionResources.employees, permissionActions.read),
  employeeCreate: id(permissionResources.employees, permissionActions.create),
  employeeUpdate: id(permissionResources.employees, permissionActions.update),
  employeeDeactivate: id(permissionResources.employees, permissionActions.deactivate),
  employeeReactivate: id(permissionResources.employees, permissionActions.reactivate),
  referenceRead: id(permissionResources.referenceData, permissionActions.read),
  referenceManage: id(permissionResources.referenceData, permissionActions.manage),
  settingsRead: id(permissionResources.settings, permissionActions.read),
  settingsUpdate: id(permissionResources.settings, permissionActions.update),
  usersRead: id(permissionResources.users, permissionActions.read),
  usersManage: id(permissionResources.users, permissionActions.manage),
  usersDeactivate: id(permissionResources.users, permissionActions.deactivate),
  usersReactivate: id(permissionResources.users, permissionActions.reactivate),
  rolesManage: id(permissionResources.usersRoles, permissionActions.manage),
  rolesAssign: id(permissionResources.usersRoles, permissionActions.assign),
  auditRead: id(permissionResources.auditLogs, permissionActions.read),
} as const satisfies Record<string, PermissionId>;

const commonReadPermissions = [
  permissionIds.dashboardRead,
  permissionIds.tripRead,
  permissionIds.tripEventRead,
  permissionIds.tripFuelRead,
  permissionIds.truckRead,
  permissionIds.employeeRead,
  permissionIds.referenceRead,
] as const;

const tripOperationalPermissions = [
  permissionIds.tripCreate,
  permissionIds.tripUpdate,
  permissionIds.tripCancel,
  permissionIds.tripStatusChange,
  permissionIds.tripAssign,
] as const;

export const ROLE_PERMISSION_MATRIX: Readonly<Record<UserRoleType, readonly PermissionId[]>> = Object.freeze({
  SuperAdmin: [
    ...commonReadPermissions,
    ...tripOperationalPermissions,
    permissionIds.tripEventCreate,
    permissionIds.tripFuelCreate,
    permissionIds.truckCreate,
    permissionIds.truckUpdate,
    permissionIds.truckStatusChange,
    permissionIds.truckDeactivate,
    permissionIds.truckReactivate,
    permissionIds.employeeCreate,
    permissionIds.employeeUpdate,
    permissionIds.employeeDeactivate,
    permissionIds.employeeReactivate,
    permissionIds.referenceManage,
    permissionIds.settingsRead,
    permissionIds.settingsUpdate,
    permissionIds.usersRead,
    permissionIds.usersManage,
    permissionIds.usersDeactivate,
    permissionIds.usersReactivate,
    permissionIds.rolesManage,
    permissionIds.rolesAssign,
    permissionIds.auditRead,
  ],
  Admin: [
    ...commonReadPermissions,
    ...tripOperationalPermissions,
    permissionIds.tripEventCreate,
    permissionIds.tripFuelCreate,
    permissionIds.truckCreate,
    permissionIds.truckUpdate,
    permissionIds.truckStatusChange,
    permissionIds.truckDeactivate,
    permissionIds.truckReactivate,
    permissionIds.employeeCreate,
    permissionIds.employeeUpdate,
    permissionIds.employeeDeactivate,
    permissionIds.employeeReactivate,
    permissionIds.referenceManage,
    permissionIds.settingsRead,
    permissionIds.auditRead,
  ],
  Dispatcher: [
    ...commonReadPermissions,
    ...tripOperationalPermissions,
    permissionIds.tripEventCreate,
    permissionIds.tripFuelCreate,
    permissionIds.truckCreate,
    permissionIds.truckUpdate,
    permissionIds.truckStatusChange,
  ],
  Encoder: [
    ...commonReadPermissions,
    permissionIds.tripCreate,
    permissionIds.tripUpdate,
    permissionIds.tripEventCreate,
    permissionIds.tripFuelCreate,
  ],
  Viewer: [...commonReadPermissions],
});

const isOfficialRole = (value: string): value is UserRoleType => (OFFICIAL_ROLES as readonly string[]).includes(value);

const normalizeState = (value?: string | null) =>
  value
    ?.trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase() ?? '';

const isEncoderOwnDraft = (identity: PermissionIdentityDecision, context?: PermissionContext) => {
  const ownerMatches = Boolean(
    identity.user?.employee_id &&
    context?.recordOwnerId &&
    String(identity.user.employee_id) === String(context.recordOwnerId),
  );
  const isDraft = context?.recordIsDraft === true || normalizeState(context?.recordState) === 'DRAFT';
  return ownerMatches && isDraft;
};

const resolveIdentity = (
  user: SystemUser | null,
  authStatus: AuthStatus,
  adapterKind: 'development' | 'unconfigured-production',
): PermissionIdentityDecision => {
  const developmentOnly = adapterKind === 'development';

  if (authStatus === 'inactive' || user?.is_active === false) {
    return { state: 'inactive', role: null, user: null, developmentOnly, reason: 'The identity is inactive.' };
  }
  if (authStatus === 'denied') {
    return {
      state: 'denied',
      role: null,
      user: null,
      developmentOnly,
      reason: 'Authentication is unavailable or denied.',
    };
  }
  if (!user || authStatus === 'unauthenticated' || authStatus === 'expired') {
    return { state: 'unauthenticated', role: null, user: null, developmentOnly, reason: 'Authentication is required.' };
  }
  if (!isOfficialRole(user.role)) {
    return {
      state: 'unknown-role',
      role: null,
      user: null,
      developmentOnly,
      reason: 'The identity has an unknown role.',
    };
  }

  if (user.roles) {
    const uniqueRoles = [...new Set(user.roles)];
    if (uniqueRoles.length !== 1 || uniqueRoles[0] !== user.role) {
      return {
        state: 'conflicting-role',
        role: null,
        user: null,
        developmentOnly,
        reason: 'The identity does not resolve to exactly one effective role.',
      };
    }
  }

  return { state: 'authenticated', role: user.role, user, developmentOnly, reason: null };
};

const routeRequirement: Partial<Record<PermissionRouteId, PermissionId>> = {
  [permissionRouteIds.hub]: permissionIds.dashboardRead,
  [permissionRouteIds.workspace]: permissionIds.dashboardRead,
  [permissionRouteIds.dashboard]: permissionIds.dashboardRead,
  [permissionRouteIds.trips]: permissionIds.tripRead,
  [permissionRouteIds.tripCreate]: permissionIds.tripCreate,
  [permissionRouteIds.tripDetail]: permissionIds.tripRead,
  [permissionRouteIds.tripEdit]: permissionIds.tripUpdate,
  [permissionRouteIds.trucks]: permissionIds.truckRead,
  [permissionRouteIds.employees]: permissionIds.employeeRead,
  [permissionRouteIds.referenceData]: permissionIds.referenceRead,
  [permissionRouteIds.settings]: permissionIds.settingsRead,
};

const navigationRoute: Record<NavigationDestination, PermissionRouteId | null> = {
  [navigationDestinations.hub]: permissionRouteIds.hub,
  [navigationDestinations.dashboard]: permissionRouteIds.dashboard,
  [navigationDestinations.tripOperations]: permissionRouteIds.trips,
  [navigationDestinations.tripSchedule]: permissionRouteIds.trips,
  [navigationDestinations.tripCreate]: permissionRouteIds.tripCreate,
  [navigationDestinations.trucks]: permissionRouteIds.trucks,
  [navigationDestinations.employees]: permissionRouteIds.employees,
  [navigationDestinations.referenceData]: permissionRouteIds.referenceData,
  [navigationDestinations.settings]: permissionRouteIds.settings,
  [navigationDestinations.inventory]: null,
  [navigationDestinations.billing]: null,
};

export const permissionRouteForPath = (pathname: string): PermissionRouteId => {
  if (pathname === '/') return permissionRouteIds.root;
  if (pathname === '/login') return permissionRouteIds.login;
  if (pathname === '/hub') return permissionRouteIds.hub;
  if (pathname === '/trip-scheduling' || pathname === '/trip-scheduling/') return permissionRouteIds.workspace;
  if (pathname === '/trip-scheduling/dashboard') return permissionRouteIds.dashboard;
  if (pathname === '/trip-scheduling/trips/new') return permissionRouteIds.tripCreate;
  if (/^\/trip-scheduling\/trips\/[^/]+\/edit$/.test(pathname)) return permissionRouteIds.tripEdit;
  if (/^\/trip-scheduling\/trips\/[^/]+$/.test(pathname)) return permissionRouteIds.tripDetail;
  if (pathname === '/trip-scheduling/trips') return permissionRouteIds.trips;
  if (pathname === '/trip-scheduling/trucks') return permissionRouteIds.trucks;
  if (pathname === '/trip-scheduling/employees') return permissionRouteIds.employees;
  if (pathname === '/trip-scheduling/reference-data') return permissionRouteIds.referenceData;
  if (pathname === '/trip-scheduling/settings') return permissionRouteIds.settings;
  return permissionRouteIds.notFound;
};

export const createEffectivePermissions = ({
  adapterKind,
  authStatus,
  user,
}: {
  adapterKind: 'development' | 'unconfigured-production';
  authStatus: AuthStatus;
  user: SystemUser | null;
}): EffectivePermissions => {
  const identity = resolveIdentity(user, authStatus, adapterKind);
  const grants = new Set(identity.role ? ROLE_PERMISSION_MATRIX[identity.role] : []);
  const hasGrant = (action: PermissionAction, resource: PermissionResource) => grants.has(id(resource, action));

  const can = (action: PermissionAction, resource: PermissionResource, context?: PermissionContext) => {
    if (identity.state !== 'authenticated' || !hasGrant(action, resource)) return false;
    if (
      identity.role === 'Encoder' &&
      action === permissionActions.update &&
      resource === permissionResources.tripAdvice
    ) {
      return isEncoderOwnDraft(identity, context);
    }
    return true;
  };

  const canAccessRoute = (route: PermissionRouteId, context?: PermissionContext) => {
    if (route === permissionRouteIds.root || route === permissionRouteIds.login) return true;
    if (identity.state !== 'authenticated') return false;
    if (route === permissionRouteIds.notFound) return true;
    const requirement = routeRequirement[route];
    if (!requirement) return false;
    const [resource, action] = requirement.split('.') as [PermissionResource, PermissionAction];
    if (route === permissionRouteIds.tripEdit && identity.role === 'Encoder' && !context) {
      return grants.has(requirement);
    }
    return can(action, resource, context);
  };

  const present = (action: PermissionAction, resource: PermissionResource, context?: PermissionContext) => {
    if (identity.state !== 'authenticated' || !hasGrant(action, resource)) {
      return { visible: false, disabled: true, reason: null };
    }

    if (
      identity.role === 'Encoder' &&
      action === permissionActions.update &&
      resource === permissionResources.tripAdvice
    ) {
      const ownerMatches = Boolean(
        identity.user?.employee_id &&
        context?.recordOwnerId &&
        String(identity.user.employee_id) === String(context.recordOwnerId),
      );
      if (!ownerMatches) return { visible: false, disabled: true, reason: null };
      const isDraft = context?.recordIsDraft === true || normalizeState(context?.recordState) === 'DRAFT';
      if (!isDraft) {
        return {
          visible: true,
          disabled: true,
          reason: 'Encoder updates are limited to owned Draft trips.',
        };
      }
    }

    if (context?.blockedReason) {
      return { visible: true, disabled: true, reason: context.blockedReason };
    }
    return { visible: true, disabled: false, reason: null };
  };

  return {
    identity,
    can,
    canAccessRoute,
    canAccessPath: (pathname) => canAccessRoute(permissionRouteForPath(pathname)),
    canShowNavigation: (destination) => {
      const route = navigationRoute[destination];
      return route ? canAccessRoute(route) : false;
    },
    present,
  };
};

export const permissionContextForTrip = (trip?: {
  encoder_employee_id?: string | null;
  status?: string | null;
  is_draft?: boolean;
}): PermissionContext => ({
  recordOwnerId: trip?.encoder_employee_id,
  recordState: trip?.status,
  recordIsDraft: trip?.is_draft,
});
