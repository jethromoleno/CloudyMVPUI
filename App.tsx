import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import ApplicationShell from './components/ApplicationShell';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import { ReferenceDataPage } from './components/ReferenceDataPage';
import Hub from './components/Hub';
import Login from './components/Login';
import { TripDetailsPage } from './components/TripDetailsPage';
import TripFormPage from './components/TripFormPage';
import TripList, { TripRouteMode } from './components/TripList';
import { TripOperationsTable } from './components/TripOperationsTable';
import TruckList from './components/TruckList';
import UserManagement from './components/UserManagement';
import { BlockedState, Button, ErrorState, LoadingState, PermissionDeniedState, SurfaceState } from './components/ui';
import {
  createEffectivePermissions,
  PermissionProvider,
  permissionActions,
  permissionContextForTrip,
  permissionResources,
  permissionRouteIds,
  usePermissions,
} from './permissions';
import { AuthSnapshot, normalizeServiceError, ServiceError, services, type EmployeeMutationInput } from './services';
import { appendSearch, routePaths, tripDetailPath, tripEditPath } from './routes';
import type { AppModule, Customer, Employee, Location, SystemUser, Theme, Trip, TripFuel, Truck } from './types';

interface TripScreenProps {
  customers: Customer[];
  employees: Employee[];
  error: string | null;
  isLoading: boolean;
  locations: Location[];
  mode: TripRouteMode;
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  theme: Theme;
  trips: Trip[];
  trucks: Truck[];
}

const RouteSurface: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-full items-center justify-center overflow-y-auto bg-navy-50 p-4 dark:bg-carbon-950 sm:p-8">
    {children}
  </div>
);

const NotFoundRoute: React.FC<{ authenticated?: boolean }> = ({ authenticated = false }) => {
  const navigate = useNavigate();
  return (
    <RouteSurface>
      <SurfaceState
        action={
          <Button onClick={() => navigate(authenticated ? routePaths.dashboard : routePaths.login)}>
            {authenticated ? 'Go to Dashboard' : 'Go to Login'}
          </Button>
        }
        description="The requested address is not part of the approved Cloudy MVP route map. No protected record was loaded."
        title="Page not found"
      />
    </RouteSurface>
  );
};

const TripScreen: React.FC<TripScreenProps> = ({
  customers,
  employees,
  error,
  isLoading,
  locations,
  mode,
  setTrips,
  theme,
  trips,
  trucks,
}) => {
  const permissions = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ tripId?: string }>();
  const routeTripId = params.tripId ? decodeURIComponent(params.tripId) : null;
  const selectedTrip = routeTripId ? trips.find((trip) => String(trip.id || trip.trip_id) === routeTripId) : null;

  if (mode === 'edit' && routeTripId && !selectedTrip) {
    return (
      <RouteSurface>
        <SurfaceState
          action={
            <Button onClick={() => navigate(appendSearch(routePaths.trips, location.search), { replace: true })}>
              Return to Trip Operations
            </Button>
          }
          description="The trip identifier is invalid, unavailable, or no longer present in this development snapshot."
          title="Trip not found"
        />
      </RouteSurface>
    );
  }

  if (mode === 'edit' && selectedTrip) {
    const editPresentation = permissions.present(
      permissionActions.update,
      permissionResources.tripAdvice,
      permissionContextForTrip(selectedTrip),
    );
    if (!editPresentation.visible) {
      return (
        <RouteSurface>
          <PermissionDeniedState
            action={<Button onClick={() => navigate(tripDetailPath(routeTripId ?? ''))}>Return to Trip Details</Button>}
            description="This identity cannot update the requested trip. No edit controls were loaded. Frontend permission checks are presentation behavior only and are not a production security boundary."
          />
        </RouteSurface>
      );
    }
    if (editPresentation.disabled) {
      return (
        <RouteSurface>
          <BlockedState
            action={<Button onClick={() => navigate(tripDetailPath(routeTripId ?? ''))}>Return to Trip Details</Button>}
            description={editPresentation.reason}
            title="Trip update unavailable"
          />
        </RouteSurface>
      );
    }
  }

  const listContext = new URLSearchParams(location.search);
  listContext.delete('date');
  listContext.delete('tab');
  listContext.delete('section');
  listContext.delete('quick');
  const keepListSearch = (path: string) => appendSearch(path, listContext.toString());
  const closeToList = () => navigate(keepListSearch(routePaths.trips), { replace: true });

  if (mode === 'detail' && routeTripId) {
    return <TripDetailsPage onClose={closeToList} tripId={routeTripId} />;
  }

  if (mode === 'operations' && new URLSearchParams(location.search).get('view') !== 'map') {
    return (
      <TripOperationsTable
        onCreateTrip={() => navigate(keepListSearch(routePaths.tripCreate))}
        onEditTrip={(tripId) => navigate(keepListSearch(tripEditPath(tripId)))}
        onOpenTrip={(tripId, section) => {
          const next = new URLSearchParams(listContext);
          if (section && section !== 'overview') next.set('section', section);
          else next.delete('section');
          navigate(appendSearch(tripDetailPath(tripId), next.toString()));
        }}
      />
    );
  }

  return (
    <TripList
      customers={customers}
      employees={employees}
      error={error}
      isLoading={isLoading}
      locations={locations}
      onCloseRoute={closeToList}
      onCreateTrip={(date) => {
        const next = new URLSearchParams(location.search);
        next.delete('view');
        if (date) next.set('date', date);
        navigate(appendSearch(routePaths.tripCreate, next.toString()));
      }}
      onEditTrip={(tripId) => navigate(keepListSearch(tripEditPath(tripId)))}
      onOpenTrip={(tripId, tab) => {
        const next = new URLSearchParams(location.search);
        next.delete('tab');
        next.delete('quick');
        if (tab && tab !== 'overview') next.set('section', tab);
        else next.delete('section');
        navigate(appendSearch(tripDetailPath(tripId), next.toString()));
      }}
      onRouteSave={(tripId) => navigate(keepListSearch(tripDetailPath(tripId)), { replace: true })}
      routeMode={mode}
      routeTripId={routeTripId}
      setTrips={setTrips}
      theme={theme}
      trips={trips}
      trucks={trucks}
    />
  );
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthSnapshot>(() => services.auth.getSnapshot());
  const [loginError, setLoginError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serviceError, setServiceError] = useState<ServiceError | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [fuels, setFuels] = useState<TripFuel[]>([]);

  const permissions = useMemo(
    () =>
      createEffectivePermissions({
        adapterKind: services.auth.adapterKind,
        authStatus: auth.status,
        user: auth.user,
      }),
    [auth.status, auth.user],
  );
  const currentUser = permissions.identity.state === 'authenticated' ? permissions.identity.user : null;
  const loginState = location.state as { from?: { pathname?: string; search?: string } } | null;
  const intendedPath = loginState?.from?.pathname
    ? `${loginState.from.pathname}${loginState.from.search ?? ''}`
    : routePaths.hub;
  const postLoginPath = permissions.canAccessPath(loginState?.from?.pathname ?? routePaths.hub)
    ? intendedPath
    : routePaths.dashboard;

  useEffect(() => services.auth.subscribe(setAuth), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const applySnapshot = useCallback((snapshot: Awaited<ReturnType<typeof services.workspace.loadSnapshot>>) => {
    setTrips(snapshot.trips);
    setEmployees(snapshot.employees);
    setCustomers(snapshot.customers);
    setLocations(snapshot.locations);
    setTrucks(snapshot.trucks);
    setFuels(snapshot.fuels);
    setSystemUsers(snapshot.users);
    setLastRefreshedAt(snapshot.refreshedAt);
  }, []);

  const loadWorkspace = useCallback(
    async (kind: 'initial' | 'refresh', signal?: AbortSignal) => {
      if (!currentUser) return;
      if (kind === 'initial') setIsLoading(true);
      else setIsRefreshing(true);
      setServiceError(null);

      try {
        const options = {
          signal,
          includeAdministrativeUsers: permissions.can(permissionActions.read, permissionResources.users),
        };
        const snapshot =
          kind === 'initial'
            ? await services.workspace.loadSnapshot(options)
            : await services.workspace.refresh(options);
        applySnapshot(snapshot);
      } catch (error) {
        const normalized = normalizeServiceError(error);
        if (normalized.kind !== 'cancelled') setServiceError(normalized);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [applySnapshot, currentUser, permissions],
  );

  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();
    void loadWorkspace('initial', controller.signal);
    return () => controller.abort();
  }, [currentUser, loadWorkspace]);

  useEffect(() => {
    if (!currentUser) return;
    const refreshWhenVisible = () => {
      if (!document.hidden) void loadWorkspace('refresh');
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [currentUser, loadWorkspace]);

  const toggleTheme = () => setTheme((value) => (value === 'dark' ? 'light' : 'dark'));

  const handleLogin = async (username: string, password: string) => {
    setLoginError(null);
    try {
      await services.auth.signIn({ username, password });
    } catch (error) {
      setLoginError(normalizeServiceError(error).message);
    }
  };

  const handleLogout = async () => {
    await services.auth.signOut();
    setTrips([]);
    setEmployees([]);
    setCustomers([]);
    setLocations([]);
    setTrucks([]);
    setFuels([]);
    setSystemUsers([]);
    setServiceError(null);
    navigate(routePaths.login, { replace: true });
  };

  const handleModuleSelect = (module: AppModule) => {
    if (module === 'trip_scheduling') navigate(routePaths.dashboard);
  };

  const refreshTrucks = async () => setTrucks((await services.workspace.refresh()).trucks);
  const refreshEmployees = async () => setEmployees((await services.workspace.refresh()).employees);

  const handleAddTruck = async (newTruck: Omit<Truck, 'truck_id'>) => {
    await services.vehicles.create({
      plateNumber: newTruck.plate_number || newTruck.license_plate || '',
      vin: newTruck.vin,
      size: newTruck.truck_size,
      loadTypeId: newTruck.load_type_id,
      registrationExpiry: newTruck.registration_expiry,
      notes: newTruck.remarks,
    });
    await refreshTrucks();
  };

  const handleUpdateTruck = async (updatedTruck: Truck) => {
    await services.vehicles.update(updatedTruck.id, {
      plateNumber: updatedTruck.plate_number || updatedTruck.license_plate || '',
      vin: updatedTruck.vin,
      size: updatedTruck.truck_size,
      loadTypeId: updatedTruck.load_type_id,
      registrationExpiry: updatedTruck.registration_expiry,
      notes: updatedTruck.remarks,
    });
    await refreshTrucks();
  };

  const handleAddEmployee = async (input: EmployeeMutationInput) => {
    await services.employees.create(input);
    await refreshEmployees();
  };

  const handleUpdateEmployee = async (id: string, input: EmployeeMutationInput) => {
    await services.employees.update(id, input);
    await refreshEmployees();
  };

  const handleDeactivateEmployee = async (id: string, reason: string) => {
    await services.employees.deactivate({ employeeId: id, reason });
    await refreshEmployees();
  };

  const handleReactivateEmployee = async (id: string, reason: string) => {
    await services.employees.reactivate({ employeeId: id, reason });
    await refreshEmployees();
  };

  const handleAddUser = async (newUser: Omit<SystemUser, 'id'>) => {
    const created = await services.users.invite({
      username: newUser.username,
      email: newUser.email ?? '',
      role: newUser.role as import('./services').PlatformRoleCode,
    });
    setSystemUsers((rows) => [...rows, created]);
  };

  const handleUpdateUser = async (updatedUser: SystemUser) => {
    const updated = await services.users.assignRole(
      updatedUser.id,
      updatedUser.role as import('./services').PlatformRoleCode,
    );
    setSystemUsers((rows) => rows.map((user) => (user.id === updated.id ? updated : user)));
  };

  const handleDeactivateUser = async (userId: string, reason: string) => {
    const updated = await services.users.deactivate({ userId, reason });
    setSystemUsers((rows) => rows.map((user) => (user.id === updated.id ? updated : user)));
  };

  const handleReactivateUser = async (userId: string, reason: string) => {
    const updated = await services.users.reactivate({ userId, reason });
    setSystemUsers((rows) => rows.map((user) => (user.id === updated.id ? updated : user)));
  };

  const protectedRedirect = (
    <Navigate
      replace
      state={{ from: { pathname: location.pathname, search: location.search } }}
      to={routePaths.login}
    />
  );

  const deniedRoute = (
    <RouteSurface>
      <PermissionDeniedState
        action={<Button onClick={() => navigate(routePaths.dashboard)}>Return to Dashboard</Button>}
        description="This authenticated identity cannot access the requested surface. No protected route content was rendered. Frontend checks are presentation behavior only and are not a production security boundary."
      />
    </RouteSurface>
  );

  const routePresentation = (route: Parameters<typeof permissions.canAccessRoute>[0], content: React.ReactNode) =>
    permissions.canAccessRoute(route) ? content : deniedRoute;

  const workspaceContent = currentUser ? (
    <ApplicationShell
      isRefreshing={isRefreshing}
      lastRefreshedAt={lastRefreshedAt}
      onLogout={handleLogout}
      onRefresh={() => void loadWorkspace('refresh')}
      onToggleTheme={toggleTheme}
      theme={theme}
      user={currentUser}
    >
      {isLoading ? (
        <RouteSurface>
          <LoadingState label="Loading development workspace snapshot..." />
        </RouteSurface>
      ) : serviceError?.kind === 'authorization' ? (
        <RouteSurface>
          <PermissionDeniedState
            action={<Button onClick={() => void loadWorkspace('refresh')}>Retry permitted request</Button>}
            description={`${serviceError.message} The current route and recoverable page state were preserved.`}
          />
        </RouteSurface>
      ) : serviceError ? (
        <RouteSurface>
          <ErrorState
            description={`${serviceError.message}${serviceError.requestId ? ` Reference: ${serviceError.requestId}` : ''}`}
            onRetry={() => void loadWorkspace('refresh')}
            title="Workspace service unavailable"
          />
        </RouteSurface>
      ) : (
        <>
          <div className="sr-only" role="status">
            {isRefreshing
              ? 'Refreshing workspace snapshot'
              : lastRefreshedAt
                ? `Development snapshot refreshed at ${lastRefreshedAt}`
                : ''}
          </div>
          <Routes>
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route
              path="dashboard"
              element={routePresentation(
                permissionRouteIds.dashboard,
                <Dashboard onViewTripDetail={(tripId) => navigate(tripDetailPath(tripId))} />,
              )}
            />
            <Route
              path="trips"
              element={routePresentation(
                permissionRouteIds.trips,
                <TripScreen
                  customers={customers}
                  employees={employees}
                  error={null}
                  isLoading={false}
                  locations={locations}
                  mode={new URLSearchParams(location.search).get('view') === 'schedule' ? 'schedule' : 'operations'}
                  setTrips={setTrips}
                  theme={theme}
                  trips={trips}
                  trucks={trucks}
                />,
              )}
            />
            <Route
              path="trips/new"
              element={routePresentation(
                permissionRouteIds.tripCreate,
                <TripFormPage mode="create" setTrips={setTrips} theme={theme} />,
              )}
            />
            <Route
              path="trips/:tripId"
              element={routePresentation(
                permissionRouteIds.tripDetail,
                <TripScreen
                  customers={customers}
                  employees={employees}
                  error={null}
                  isLoading={false}
                  locations={locations}
                  mode="detail"
                  setTrips={setTrips}
                  theme={theme}
                  trips={trips}
                  trucks={trucks}
                />,
              )}
            />
            <Route
              path="trips/:tripId/edit"
              element={routePresentation(
                permissionRouteIds.tripEdit,
                <TripFormPage mode="edit" setTrips={setTrips} theme={theme} />,
              )}
            />
            <Route
              path="trucks"
              element={routePresentation(
                permissionRouteIds.trucks,
                <TruckList
                  error={null}
                  isLoading={false}
                  onAdd={handleAddTruck}
                  onUpdate={handleUpdateTruck}
                  onRefresh={refreshTrucks}
                  theme={theme}
                  trips={trips}
                  trucks={trucks}
                />,
              )}
            />
            <Route
              path="employees"
              element={routePresentation(
                permissionRouteIds.employees,
                <EmployeeList
                  employees={employees}
                  error={null}
                  isLoading={false}
                  onAdd={handleAddEmployee}
                  onUpdate={handleUpdateEmployee}
                  onDeactivate={handleDeactivateEmployee}
                  onReactivate={handleReactivateEmployee}
                  theme={theme}
                  trips={trips}
                />,
              )}
            />
            <Route
              path="reference-data"
              element={routePresentation(permissionRouteIds.referenceData, <ReferenceDataPage />)}
            />
            <Route
              path="settings"
              element={routePresentation(
                permissionRouteIds.settings,
                <UserManagement
                  onAddUser={handleAddUser}
                  onDeactivateUser={handleDeactivateUser}
                  onReactivateUser={handleReactivateUser}
                  onUpdateUser={handleUpdateUser}
                  users={systemUsers}
                />,
              )}
            />
            <Route path="*" element={<NotFoundRoute authenticated />} />
          </Routes>
        </>
      )}
    </ApplicationShell>
  ) : (
    protectedRedirect
  );

  return (
    <PermissionProvider value={permissions}>
      <Routes>
        <Route
          path={routePaths.root}
          element={<Navigate replace to={currentUser ? routePaths.hub : routePaths.login} />}
        />
        <Route
          path={routePaths.login}
          element={
            currentUser ? (
              <Navigate replace to={postLoginPath} />
            ) : (
              <Login
                developmentIdentities={services.auth.reviewIdentities}
                error={loginError}
                isAuthenticating={auth.status === 'authenticating'}
                onLogin={handleLogin}
                onToggleTheme={toggleTheme}
                theme={theme}
              />
            )
          }
        />
        <Route
          path={routePaths.hub}
          element={
            currentUser ? (
              <Hub
                onLogout={handleLogout}
                onSelectModule={handleModuleSelect}
                onToggleTheme={toggleTheme}
                theme={theme}
                user={currentUser}
              />
            ) : (
              protectedRedirect
            )
          }
        />
        <Route path={`${routePaths.workspace}/*`} element={workspaceContent} />
        <Route path="*" element={<NotFoundRoute authenticated={Boolean(currentUser)} />} />
      </Routes>
    </PermissionProvider>
  );
};

export default App;
