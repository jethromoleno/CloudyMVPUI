
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
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [fuels, setFuels] = useState<TripFuel[]>([]);

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

  const handleDeleteTruck = async (id: number) => {
    await api.deleteTruck(id);
    setTrucks(prev => prev.filter(t => t.truck_id !== id));
  };

  const handleAddEmployee = async (newEmp: Omit<Employee, 'employee_id'>) => {
    const created = await api.createEmployee(newEmp);
    setEmployees(prev => [...prev, created]);
  };

  // --- USER CRUD HANDLERS ---
  const handleAddUser = async (newUser: Omit<SystemUser, 'id'>) => {
    const created = await api.createUser(newUser);
    setSystemUsers(prev => [...prev, created]);
  };

  const handleUpdateUser = async (updatedUser: SystemUser) => {
    // Mock update
    setSystemUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
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
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <AppNavbar activeModule={activeModule as AppModule} onSelectModule={handleModuleSelect} />
        
        <div className="flex-1 overflow-hidden relative">
          {(() => {
            switch (currentView) {
              case 'dashboard':
                return <Dashboard trips={trips} trucks={trucks} fuels={fuels} theme={theme} />;
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
                  />
                );
              case 'trucks':
                return (
                  <TruckList 
                    trucks={trucks}
                    onAdd={handleAddTruck}
                    onUpdate={() => {}} 
                    onDelete={handleDeleteTruck}
                    theme={theme}
                  />
                );
              case 'employees':
                return (
                  <EmployeeList 
                    employees={employees}
                    onAdd={handleAddEmployee}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                    theme={theme}
                  />
                );
              case 'settings':
                return currentUser.role === 'SuperAdmin' ? (
                  <UserManagement 
                    users={systemUsers}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                  />
                ) : (
                  <div className="p-8">Settings coming soon for standard users.</div>
                );
              default:
                return <Dashboard trips={trips} trucks={trucks} fuels={fuels} theme={theme} />;
            }
          })()}
        </div>
      </main>
    </div>
  );
};

export default App;
