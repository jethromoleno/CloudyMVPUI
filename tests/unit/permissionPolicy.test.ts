import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createEffectivePermissions,
  navigationDestinations,
  OFFICIAL_ROLES,
  permissionActions,
  permissionIds,
  permissionResources,
  permissionRouteForPath,
  permissionRouteIds,
  ROLE_PERMISSION_MATRIX,
} from '../../permissions/policy';
import type { SystemUser, UserRoleType } from '../../types';

const makeUser = (role: string, overrides: Partial<SystemUser> = {}): SystemUser => ({
  id: `user-${role.toLowerCase()}`,
  username: `Review${role}`,
  role,
  roles: [role],
  permissions: ['trip_scheduling'],
  is_active: true,
  ...overrides,
});

const policyFor = (role: UserRoleType, overrides: Partial<SystemUser> = {}) =>
  createEffectivePermissions({
    adapterKind: 'development',
    authStatus: 'authenticated',
    user: makeUser(role, overrides),
  });

describe('Phase 1C centralized permission policy', () => {
  it('publishes the five fixed roles and stable namespaced permission identifiers', () => {
    expect(OFFICIAL_ROLES).toEqual(['SuperAdmin', 'Admin', 'Dispatcher', 'Encoder', 'Viewer']);
    expect(new Set(Object.values(permissionIds)).size).toBe(Object.values(permissionIds).length);
    Object.values(permissionIds).forEach((permission) => expect(permission).toMatch(/^[A-Z_]+\.[A-Z_]+$/));
    expect(Object.values(ROLE_PERMISSION_MATRIX).flat()).not.toContain('INVENTORY.READ');
    expect(Object.values(ROLE_PERMISSION_MATRIX).flat()).not.toContain('BILLING.READ');
    expect(
      Object.values(ROLE_PERMISSION_MATRIX)
        .flat()
        .some((permission) => permission.endsWith('.EXPORT')),
    ).toBe(false);
  });

  it.each<{
    role: UserRoleType;
    expected: readonly string[];
  }>([
    {
      role: 'SuperAdmin',
      expected: Object.values(permissionIds),
    },
    {
      role: 'Admin',
      expected: [
        permissionIds.dashboardRead,
        permissionIds.tripRead,
        permissionIds.tripCreate,
        permissionIds.tripUpdate,
        permissionIds.tripCancel,
        permissionIds.tripStatusChange,
        permissionIds.tripAssign,
        permissionIds.tripEventRead,
        permissionIds.tripEventCreate,
        permissionIds.tripFuelRead,
        permissionIds.tripFuelCreate,
        permissionIds.truckRead,
        permissionIds.truckCreate,
        permissionIds.truckUpdate,
        permissionIds.truckStatusChange,
        permissionIds.truckDeactivate,
        permissionIds.truckReactivate,
        permissionIds.employeeRead,
        permissionIds.employeeCreate,
        permissionIds.employeeUpdate,
        permissionIds.employeeDeactivate,
        permissionIds.employeeReactivate,
        permissionIds.referenceRead,
        permissionIds.referenceManage,
        permissionIds.settingsRead,
        permissionIds.auditRead,
      ],
    },
    {
      role: 'Dispatcher',
      expected: [
        permissionIds.dashboardRead,
        permissionIds.tripRead,
        permissionIds.tripCreate,
        permissionIds.tripUpdate,
        permissionIds.tripCancel,
        permissionIds.tripStatusChange,
        permissionIds.tripAssign,
        permissionIds.tripEventRead,
        permissionIds.tripEventCreate,
        permissionIds.tripFuelRead,
        permissionIds.tripFuelCreate,
        permissionIds.truckRead,
        permissionIds.truckCreate,
        permissionIds.truckUpdate,
        permissionIds.truckStatusChange,
        permissionIds.employeeRead,
        permissionIds.referenceRead,
      ],
    },
    {
      role: 'Encoder',
      expected: [
        permissionIds.dashboardRead,
        permissionIds.tripRead,
        permissionIds.tripCreate,
        permissionIds.tripUpdate,
        permissionIds.tripEventRead,
        permissionIds.tripEventCreate,
        permissionIds.tripFuelRead,
        permissionIds.tripFuelCreate,
        permissionIds.truckRead,
        permissionIds.employeeRead,
        permissionIds.referenceRead,
      ],
    },
    {
      role: 'Viewer',
      expected: [
        permissionIds.dashboardRead,
        permissionIds.tripRead,
        permissionIds.tripEventRead,
        permissionIds.tripFuelRead,
        permissionIds.truckRead,
        permissionIds.employeeRead,
        permissionIds.referenceRead,
      ],
    },
  ])('$role matches every approved policy identifier', ({ role, expected }) => {
    expect(new Set(ROLE_PERMISSION_MATRIX[role])).toEqual(new Set(expected));
  });

  it.each([
    ['SuperAdmin', true, true, true] as const,
    ['Admin', false, true, true] as const,
    ['Dispatcher', false, false, false] as const,
    ['Encoder', false, false, false] as const,
    ['Viewer', false, false, false] as const,
  ])('keeps exact Settings and administrative distinctions for %s', (role, users, settings, audit) => {
    const policy = policyFor(role);
    expect(policy.can(permissionActions.manage, permissionResources.users)).toBe(users);
    expect(policy.can(permissionActions.assign, permissionResources.usersRoles)).toBe(users);
    expect(policy.can(permissionActions.update, permissionResources.settings)).toBe(users);
    expect(policy.can(permissionActions.read, permissionResources.settings)).toBe(settings);
    expect(policy.can(permissionActions.read, permissionResources.auditLogs)).toBe(audit);
  });

  it('models Encoder own-Draft updates without inventing a role union or override', () => {
    const policy = policyFor('Encoder', { employee_id: 'emp-2' });
    const ownDraft = { recordOwnerId: 'emp-2', recordState: 'DRAFT' };
    const ownScheduled = { recordOwnerId: 'emp-2', recordState: 'SCHEDULED' };
    const anotherDraft = { recordOwnerId: 'emp-9', recordState: 'DRAFT' };

    expect(policy.can(permissionActions.update, permissionResources.tripAdvice, ownDraft)).toBe(true);
    expect(policy.can(permissionActions.update, permissionResources.tripAdvice, ownScheduled)).toBe(false);
    expect(policy.can(permissionActions.update, permissionResources.tripAdvice, anotherDraft)).toBe(false);
    expect(policy.present(permissionActions.update, permissionResources.tripAdvice, ownScheduled)).toEqual({
      visible: true,
      disabled: true,
      reason: 'Encoder updates are limited to owned Draft trips.',
    });
    expect(policy.present(permissionActions.update, permissionResources.tripAdvice, anotherDraft).visible).toBe(false);
    expect(policy.can(permissionActions.assign, permissionResources.tripAssignments)).toBe(false);
    expect(policy.can(permissionActions.cancel, permissionResources.tripAdvice)).toBe(false);
  });

  it('hides never-permitted actions and disables authorized state-blocked actions with explanations', () => {
    const viewer = policyFor('Viewer');
    const admin = policyFor('Admin');
    expect(viewer.present(permissionActions.create, permissionResources.tripAdvice)).toEqual({
      visible: false,
      disabled: true,
      reason: null,
    });
    expect(
      admin.present(permissionActions.deactivate, permissionResources.trucks, {
        blockedReason: 'Truck has an active assignment.',
      }),
    ).toEqual({ visible: true, disabled: true, reason: 'Truck has an active assignment.' });
  });

  it.each([
    ['SuperAdmin', true, true, true] as const,
    ['Admin', true, true, true] as const,
    ['Dispatcher', true, true, false] as const,
    ['Encoder', true, true, false] as const,
    ['Viewer', false, false, false] as const,
  ])('maps route and navigation presentation for %s', (role, canCreate, canEditPotentially, canOpenSettings) => {
    const policy = policyFor(role);
    [
      permissionRouteIds.hub,
      permissionRouteIds.workspace,
      permissionRouteIds.dashboard,
      permissionRouteIds.trips,
      permissionRouteIds.tripDetail,
      permissionRouteIds.trucks,
      permissionRouteIds.employees,
      permissionRouteIds.notFound,
    ].forEach((route) => expect(policy.canAccessRoute(route)).toBe(true));
    expect(policy.canAccessRoute(permissionRouteIds.tripCreate)).toBe(canCreate);
    expect(policy.canAccessRoute(permissionRouteIds.tripEdit)).toBe(canEditPotentially);
    expect(policy.canAccessRoute(permissionRouteIds.settings)).toBe(canOpenSettings);
    expect(policy.canShowNavigation(navigationDestinations.tripCreate)).toBe(canCreate);
    expect(policy.canShowNavigation(navigationDestinations.settings)).toBe(canOpenSettings);
    expect(policy.canShowNavigation(navigationDestinations.trucks)).toBe(true);
    expect(policy.canShowNavigation(navigationDestinations.employees)).toBe(true);
    expect(policy.canShowNavigation(navigationDestinations.inventory)).toBe(false);
    expect(policy.canShowNavigation(navigationDestinations.billing)).toBe(false);
  });

  it('keeps path classification deterministic and Not Found distinct from permission denial', () => {
    expect(permissionRouteForPath('/trip-scheduling/trips/new')).toBe(permissionRouteIds.tripCreate);
    expect(permissionRouteForPath('/trip-scheduling/trips/trip-1/edit')).toBe(permissionRouteIds.tripEdit);
    expect(permissionRouteForPath('/trip-scheduling/trips/trip-1')).toBe(permissionRouteIds.tripDetail);
    expect(permissionRouteForPath('/trip-scheduling/inventory')).toBe(permissionRouteIds.notFound);
    expect(policyFor('Viewer').canAccessPath('/trip-scheduling/inventory')).toBe(true);
    expect(policyFor('Viewer').canAccessPath('/trip-scheduling/settings')).toBe(false);
  });

  it('fails closed for unauthenticated, inactive, denied, unknown, and conflicting identities', () => {
    const cases = [
      createEffectivePermissions({ adapterKind: 'development', authStatus: 'unauthenticated', user: null }),
      createEffectivePermissions({
        adapterKind: 'development',
        authStatus: 'authenticated',
        user: makeUser('Viewer', { is_active: false }),
      }),
      createEffectivePermissions({ adapterKind: 'unconfigured-production', authStatus: 'denied', user: null }),
      createEffectivePermissions({
        adapterKind: 'development',
        authStatus: 'authenticated',
        user: makeUser('Unknown'),
      }),
      createEffectivePermissions({
        adapterKind: 'development',
        authStatus: 'authenticated',
        user: makeUser('Admin', { roles: ['Admin', 'Viewer'] }),
      }),
    ];

    expect(cases.map((policy) => policy.identity.state)).toEqual([
      'unauthenticated',
      'inactive',
      'denied',
      'unknown-role',
      'conflicting-role',
    ]);
    cases.forEach((policy) => expect(policy.canAccessRoute(permissionRouteIds.dashboard)).toBe(false));
    expect(cases[0].identity.developmentOnly).toBe(true);
    expect(cases[2].identity.developmentOnly).toBe(false);
  });
});

describe('Phase 1C static presentation boundaries', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

  it('keeps platform-role policy comparisons inside the centralized permission boundary', () => {
    const phaseOwnedSources = [
      'App.tsx',
      'components/Sidebar.tsx',
      'components/Hub.tsx',
      'components/TripList.tsx',
      'components/TruckList.tsx',
      'components/EmployeeList.tsx',
      'components/UserManagement.tsx',
    ]
      .map(read)
      .join('\n');
    const directPlatformRoleComparison =
      /(?:currentUser\.role|userRole|\.role)\s*(?:===|!==)\s*['"](?:SuperAdmin|Admin|Dispatcher|Encoder|Viewer)['"]/;
    const roleMembershipPolicy = /roles?\.includes\(['"](?:SuperAdmin|Admin|Dispatcher|Encoder|Viewer)['"]\)/;
    expect(phaseOwnedSources).not.toMatch(directPlatformRoleComparison);
    expect(phaseOwnedSources).not.toMatch(roleMembershipPolicy);
    expect(read('components/Sidebar.tsx')).not.toMatch(/roles\s*:/);
  });

  it('states the frontend boundary truthfully and avoids prohibited entity-delete presentation', () => {
    const sources = [read('App.tsx'), read('components/UserManagement.tsx'), read('README.md')].join('\n');
    expect(sources).toContain('not a production security boundary');
    expect(sources).toMatch(/production API authorization/i);
    expect(sources).toMatch(/\bRLS\b/);
    expect(
      [
        read('components/TripList.tsx'),
        read('components/TruckList.tsx'),
        read('components/EmployeeList.tsx'),
        read('components/UserManagement.tsx'),
      ].join('\n'),
    ).not.toMatch(/(?:delete|hard-delete)\s+(?:trip|truck|employee|user)/i);
  });
});
