
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TripList from './components/TripList';
import Login from './components/Login';
import TruckList from './components/TruckList';
import EmployeeList from './components/EmployeeList';
import Hub from './components/Hub';
import UserManagement from './components/UserManagement';
import AppNavbar from './components/AppNavbar';
import { ClipboardList, Package, DollarSign, Loader2 } from 'lucide-react';
import { api } from './services/apiService';
import { 
  Trip, Employee, Customer, Location, Truck, TripFuel, 
  SystemUser, AppModule, Theme 
} from './types';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Navigation State
  const [activeModule, setActiveModule] = useState<AppModule | 'hub' | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Theme State
  const [theme, setTheme] = useState<Theme>('dark');

  // Database State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [fuels, setFuels] = useState<TripFuel[]>([]);
  const [focusedTripId, setFocusedTripId] = useState<string | number | null>(null);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Data Hydration Effect
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [t, e, c, l, v, f, u] = await Promise.all([
          api.getTrips(),
          api.getEmployees(),
          api.getCustomers(),
          api.getLocations(),
          api.getTrucks(),
          api.getFuelLogs(),
          api.getUsers()
        ]);
        setTrips(t);
        setEmployees(e);
        setCustomers(c);
        setLocations(l);
        setTrucks(v);
        setFuels(f);
        setSystemUsers(u);
      } catch (err) {
        console.error(err);
        setError("Failed to load telemetry registers from service schema");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- AUTH HANDLERS ---
  const handleLogin = async (username: string, password: string) => {
    try {
      const user = await api.login(username, password);
      setCurrentUser(user);
      setActiveModule('hub');
      setLoginError(null);
    } catch (err) {
      setLoginError("Invalid credentials. Try 'SuperAdmin' / 'admin123'");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveModule(null);
    setCurrentView('dashboard');
  };

  const handleModuleSelect = (module: AppModule | 'hub') => {
    setActiveModule(module);
    if (module !== 'hub') {
      setCurrentView('dashboard');
    }
  };

  // --- ASSET CRUD HANDLERS ---
  const handleAddTruck = async (newTruck: Omit<Truck, 'truck_id'>) => {
    const created = await api.createTruck(newTruck);
    setTrucks(prev => [...prev, created]);
  };

  const handleUpdateTruck = async (updatedTruck: Truck) => {
    const updated = await api.updateTruck(updatedTruck.id, updatedTruck);
    setTrucks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDeleteTruck = async (id: string | number) => {
    await api.deleteTruck(id);
    setTrucks(prev => prev.filter(t => String(t.id) !== String(id) && String((t as any).truck_id) !== String(id)));
  };

  const handleAddEmployee = async (newEmp: Omit<Employee, 'employee_id'>) => {
    const created = await api.createEmployee(newEmp);
    setEmployees(prev => [...prev, created]);
  };

  const handleUpdateEmployee = async (updated: Employee) => {
    const res = await api.updateEmployee(updated.id, updated);
    setEmployees(prev => prev.map(e => e.id === updated.id ? res : e));
  };

  const handleDeleteEmployee = async (id: string) => {
    await api.deleteEmployee(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // --- USER CRUD HANDLERS ---
  const handleAddUser = async (newUser: Omit<SystemUser, 'id'>) => {
    const created = await api.createUser(newUser);
    setSystemUsers(prev => [...prev, created]);
  };

  const handleUpdateUser = async (updatedUser: SystemUser) => {
    // Mock update
    setSystemUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && String(currentUser.id) === String(updatedUser.id)) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = async (id: number) => {
    setSystemUsers(prev => prev.filter(u => u.id !== id));
  };

  // --- RENDER LOGIC ---

  if (!currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
        error={loginError} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeModule === 'hub') {
    return (
      <Hub 
        user={currentUser} 
        onSelectModule={handleModuleSelect} 
        onLogout={handleLogout} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="flex h-screen bg-navy-50 dark:bg-carbon-950 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={handleLogout}
        username={currentUser.username}
        userRole={currentUser.role}
        theme={theme}
        onSelectModule={handleModuleSelect}
        activeModule={activeModule}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <AppNavbar activeModule={activeModule as AppModule} onSelectModule={handleModuleSelect} />
        
        <div className="flex-1 overflow-hidden relative">
          {(() => {
            if (activeModule === 'inventory' || activeModule === 'billing') {
              const config = activeModule === 'inventory' 
                ? { title: 'Inventory Management', icon: Package }
                : { title: 'Billing System', icon: DollarSign };
              const IconComp = config.icon;

              return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-navy-50 dark:bg-carbon-950 transition-colors duration-300">
                  <div className="p-8 bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-2xl shadow-xl max-w-md w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-350">
                    <div className="p-4 bg-navy-100/50 dark:bg-carbon-800 text-navy-600 dark:text-carbon-400 rounded-full mb-6">
                      <IconComp className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-2 font-sans tracking-tight">
                      {config.title}
                    </h2>
                    <p className="text-navy-500 dark:text-carbon-400 text-sm mb-6 leading-relaxed">
                      {config.title} is currently in placeholder mode for this MVP version.
                    </p>
                    <button 
                      onClick={() => handleModuleSelect('hub')}
                      className="px-6 py-2.5 bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black font-semibold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-md shadow-navy-900/10 dark:shadow-none"
                    >
                      Return to Hub
                    </button>
                  </div>
                </div>
              );
            }

            switch (currentView) {
              case 'dashboard':
                return (
                  <Dashboard 
                    trips={trips} 
                    trucks={trucks} 
                    fuels={fuels} 
                    theme={theme} 
                    employees={employees}
                    customers={customers}
                    locations={locations}
                    isLoading={isLoading}
                    error={error}
                    onViewTripDetail={(tripId) => {
                      setFocusedTripId(tripId);
                      setCurrentView('trip-management');
                    }}
                  />
                );
              case 'trip-management':
              case 'trips':
                return (
                  <TripList 
                    trips={trips} 
                    setTrips={setTrips} 
                    employees={employees}
                    customers={customers}
                    locations={locations}
                    trucks={trucks}
                    theme={theme}
                    isLoading={isLoading}
                    error={error}
                    userRole={currentUser.role}
                    currentView={currentView}
                    initialEditingId={focusedTripId}
                    onClearInitialEditingId={() => setFocusedTripId(null)}
                  />
                );
              case 'trucks':
                return (
                  <TruckList 
                    trucks={trucks}
                    onAdd={handleAddTruck}
                    onUpdate={handleUpdateTruck} 
                    onDelete={handleDeleteTruck}
                    theme={theme}
                    isLoading={isLoading}
                    error={error}
                    userRole={currentUser.role}
                    trips={trips}
                  />
                );
              case 'employees':
                return (
                  <EmployeeList 
                    employees={employees}
                    trips={trips}
                    onAdd={handleAddEmployee}
                    onUpdate={handleUpdateEmployee}
                    onDelete={handleDeleteEmployee}
                    theme={theme}
                    isLoading={isLoading}
                    error={error}
                    userRole={currentUser.role}
                  />
                );
              case 'settings':
                return currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin' ? (
                  <UserManagement 
                    users={systemUsers}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    userRole={currentUser.role}
                  />
                ) : (
                  <div className="p-8 max-w-md mx-auto bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-xl shadow-md text-center mt-12 animate-fade-in">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100 dark:border-red-900/30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-2">Access Restricted</h2>
                    <p className="text-sm text-navy-500 dark:text-carbon-400">
                      Standard settings and user directories are limited to administrators. Your role is configured as <span className="font-semibold text-navy-700 dark:text-white">{currentUser.role}</span>.
                    </p>
                  </div>
                );
              default:
                return (
                  <Dashboard 
                    trips={trips} 
                    trucks={trucks} 
                    fuels={fuels} 
                    theme={theme} 
                    employees={employees}
                    customers={customers}
                    locations={locations}
                    isLoading={isLoading}
                    error={error}
                    onViewTripDetail={(tripId) => {
                      setFocusedTripId(tripId);
                      setCurrentView('trip-management');
                    }}
                  />
                );
            }
          })()}
        </div>
      </main>
    </div>
  );
};

export default App;
