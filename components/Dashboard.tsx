import React, { useState, useEffect } from 'react';
import { 
  Trip, Truck, TripFuel, Theme, Employee, Customer, Location 
} from '../types';
import { 
  Activity, CalendarClock, AlertTriangle, Fuel, Clock, ArrowRight, 
  CheckCircle2, Users, Play, Milestone, ChevronRight, XCircle, Search, 
  MapPin, ShieldAlert, BadgeInfo, Calendar, Loader2, RotateCcw, Truck as TruckIcon
} from 'lucide-react';
import { api } from '../services/apiService';

interface DashboardProps {
  trips: Trip[];
  trucks: Truck[];
  fuels: TripFuel[];
  theme: Theme;
  employees: Employee[];
  customers: Customer[];
  locations: Location[];
  isLoading?: boolean;
  error?: string | null;
  onViewTripDetail?: (tripId: string | number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  trips = [], 
  trucks = [], 
  fuels = [], 
  theme, 
  employees = [], 
  customers = [], 
  locations = [], 
  isLoading = false, 
  error = null,
  onViewTripDetail 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchDrivers = async () => {
      try {
        const data = await api.getDrivers();
        if (active) setDrivers(data);
      } catch (err) {
        console.error('Error fetching drivers in Dashboard:', err);
      }
    };
    fetchDrivers();
    return () => { active = false; };
  }, [employees]);

  // 1. Current Reference Date for calculations (as per environment metadata)
  const CURRENT_DATE_STR = '2026-06-14';
  const CURRENT_TIME = new Date('2026-06-14T05:26:04-07:00');

  // Helpers for resolving linked records
  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Unassigned';
    const client = customers.find(c => c.id === clientId);
    return client ? client.client_name : 'Unknown Client';
  };

  const getTruckDetails = (truckId?: string) => {
    if (!truckId) return { plate: 'Unassigned', size: 'N/A' };
    const tk = trucks.find(t => t.id === truckId || t.truck_id === truckId);
    return tk ? { plate: tk.plate_number, size: tk.truck_size } : { plate: 'Unassigned', size: 'N/A' };
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'Unassigned';
    // driverId links to drivers.id
    const profile = drivers.find(d => d.id === driverId);
    if (!profile) {
      // fallback check if driverId refers to employee id directly
      const empDirect = employees.find(e => e.id === driverId);
      if (empDirect) return empDirect.full_name;
      return 'Unassigned';
    }
    const emp = employees.find(e => e.id === profile.employee_id);
    return emp ? emp.full_name : 'Unknown Driver';
  };

  const getLocationName = (locId?: string) => {
    if (!locId) return '';
    const loc = locations.find(l => l.id === locId || l.location_id === locId);
    return loc ? loc.location_name : 'Unknown Hub';
  };

  // --- DYNAMIC KPI COMPUTATIONS ---
  
  // A. Trips Today (Pickup date is 2026-06-14)
  const tripsToday = trips.filter(t => !t.is_deleted && t.pickup_date === CURRENT_DATE_STR);

  // B. Scheduled trips (In 'Scheduled' or equivalent status_id)
  const scheduledTrips = trips.filter(t => !t.is_deleted && (t.status === 'Scheduled' || t.status_id === 'status-sched'));

  // C. In-progress trips
  const inProgressTrips = trips.filter(t => !t.is_deleted && (t.status === 'In Progress' || t.status === 'In Transit' || t.status_id === 'status-inprogress'));

  // D. Completed trips this week (last 7 days from reference date June 14)
  const completedTripsThisWeek = trips.filter(t => {
    if (t.is_deleted) return false;
    const isCompleted = t.status === 'Completed' || t.status_id === 'status-completed';
    if (!isCompleted) return false;
    
    const dateStr = t.completion_date || t.updated_at || t.pickup_date;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const diffTime = CURRENT_TIME.getTime() - d.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Check if it was completed within current calendar week or 7 days back
    return diffDays >= 0 && diffDays <= 7;
  });

  // E. Available trucks
  const availableTrucksCount = trucks.filter(t => !t.is_deleted && (t.truck_status_id === 'ts-avail' || t.status === 'Available')).length;

  // F. Available drivers (Using full status mapping)
  const driverEmployees = employees.filter(e => !e.is_deleted && (e.employee_role_id === 'er-1' || e.role === 'Driver'));
  const activeDriverIds = new Set(
    trips
      .filter(t => !t.is_deleted && (t.status === 'In Progress' || t.status === 'In Transit' || t.status_id === 'status-inprogress'))
      .map(t => t.driver_id)
      .filter(Boolean)
  );

  let driverAvailableCount = 0;
  let driverAssignedCount = 0;
  let driverUnavailableCount = 0;
  let driverLeaveCount = 0;

  driverEmployees.forEach(emp => {
    const profile = drivers.find(p => p.employee_id === emp.id || p.id === emp.id);
    const profileId = profile?.id;
    const availStatus = profile?.availability_status || 'Available';
    
    if (emp.employment_status === 'On Leave' || emp.employment_status === 'Leave' || availStatus === 'Leave' || availStatus === 'On Leave') {
      driverLeaveCount++;
    } else if (!emp.is_active || emp.employment_status === 'Suspended' || emp.employment_status === 'Inactive' || availStatus === 'Suspended' || availStatus === 'Unavailable' || availStatus === 'Resting' || availStatus === 'Off Duty') {
      driverUnavailableCount++;
    } else if (profileId && (activeDriverIds.has(profileId) || availStatus === 'Assigned' || availStatus === 'On Trip')) {
      driverAssignedCount++;
    } else {
      driverAvailableCount++;
    }
  });

  // --- VEHICLE AVAILABILITY SNAPSHOT VALUES ---
  let truckAvailableCount = 0;
  let truckInUseCount = 0;
  let truckMaintenanceCount = 0;
  let truckInactiveCount = 0;

  trucks.forEach(tk => {
    if (tk.is_deleted) return;
    const stat = tk.status || '';
    const statusId = tk.truck_status_id || '';
    
    if (statusId === 'ts-avail' || stat === 'Available') {
      truckAvailableCount++;
    } else if (statusId === 'ts-use' || stat === 'In Use' || stat === 'In Transit') {
      truckInUseCount++;
    } else if (statusId === 'ts-maint' || stat === 'Maintenance') {
      truckMaintenanceCount++;
    } else {
      truckInactiveCount++;
    }
  });

  // --- OPERATIONAL ALERTS ---
  
  // 1) Trips Scheduled but pickup time has passed
  const overdueTrips = trips.filter(t => {
    if (t.is_deleted) return false;
    const isScheduled = t.status === 'Scheduled' || t.status_id === 'status-sched';
    if (!isScheduled) return false;
    
    const schedDate = t.scheduled_start_time ? new Date(t.scheduled_start_time) : null;
    if (!schedDate || isNaN(schedDate.getTime())) return false;
    
    // Elapse comparison
    return schedDate < CURRENT_TIME;
  });

  // 2) Trucks in maintenance
  const maintenanceTrucks = trucks.filter(tk => !tk.is_deleted && (tk.truck_status_id === 'ts-maint' || tk.status === 'Maintenance'));

  // 3) Driver license expiry within 30 days
  const expiringLicenses = driverEmployees.map(emp => {
    const profile = drivers.find(p => p.employee_id === emp.id);
    if (!profile || !profile.license_expiry) return null;
    
    const expiry = new Date(profile.license_expiry);
    if (isNaN(expiry.getTime())) return null;
    
    const diffTime = expiry.getTime() - CURRENT_TIME.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 30) {
      return {
        driverName: emp.full_name,
        licenseNo: profile.license_number,
        daysLeft: diffDays,
        expiryDate: profile.license_expiry
      };
    }
    return null;
  }).filter(Boolean);

  const totalAlertsCount = overdueTrips.length + maintenanceTrucks.length + expiringLicenses.length;

  // --- RECENT TRIPS TABLE DATA ---
  const activeTrips = trips.filter(t => !t.is_deleted);
  const searchedTrips = activeTrips.filter(t => {
    const clientCode = t.trip_advise_code || t.trip_code || '';
    const matchCode = clientCode.toLowerCase().includes(searchTerm.toLowerCase());
    const clientNameStr = getClientName(t.client_id || t.customer_id).toLowerCase();
    const matchClient = clientNameStr.includes(searchTerm.toLowerCase());
    return matchCode || matchClient;
  });

  const getTripStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'In Progress':
      case 'In Transit':
        return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
      case 'Completed':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30';
      case 'Cancelled':
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'Rescue':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30';
      case 'Backload':
        return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30';
      default:
        return 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700';
    }
  };

  const getTruckStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'In Use':
      case 'In Transit':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Maintenance':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300';
    }
  };

  // --- RENDER LOAD AND ERROR STATES FIRST ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 bg-navy-50 dark:bg-carbon-950">
        <Loader2 className="w-10 h-10 animate-spin text-navy-600 dark:text-carbon-400 mb-4" />
        <p className="text-navy-600 dark:text-carbon-400 font-medium">Assembling live fleet metrics and telemetry logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-white dark:bg-carbon-900 border border-red-200 dark:border-red-900/40 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100 dark:border-red-900/30">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-2">Failed to Load Dashboard</h2>
        <p className="text-sm text-navy-500 dark:text-carbon-450 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg uppercase tracking-wider transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-navy-50 dark:bg-carbon-950 p-6 space-y-6 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-navy-150 dark:border-carbon-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white font-sans">Trip Scheduling Dashboard</h1>
          <p className="text-navy-500 dark:text-carbon-400 mt-1 text-sm">
            Operational center for Cloudy Transport Services. Local Date: <span className="font-semibold text-navy-700 dark:text-zinc-200">June 14, 2026</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-lg text-xs font-mono text-navy-600 dark:text-carbon-400 shadow-sm shadow-navy-100/10">
            <Clock className="w-3.5 h-3.5 text-navy-400 dark:text-carbon-450" />
            05:26 AM MDT
          </div>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase">Live Sync Active</span>
        </div>
      </header>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-carbon-900 p-4 border border-navy-150 dark:border-carbon-800 rounded-xl shadow-sm hover:border-navy-250 dark:hover:border-carbon-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-500 dark:text-carbon-400 uppercase tracking-wider">Trips Today</span>
            <div className="p-1 px-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold">Today</div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy-900 dark:text-white">{tripsToday.length}</span>
            <span className="text-[10px] text-navy-400 dark:text-carbon-500">planned</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-carbon-900 p-4 border border-navy-150 dark:border-carbon-800 rounded-xl shadow-sm hover:border-navy-250 dark:hover:border-carbon-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-500 dark:text-carbon-400 uppercase tracking-wider">Scheduled</span>
            <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy-900 dark:text-white">{scheduledTrips.length}</span>
            <span className="text-[10px] text-navy-400 dark:text-carbon-500">awaiting</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-carbon-900 p-4 border border-navy-150 dark:border-carbon-800 rounded-xl shadow-sm hover:border-navy-250 dark:hover:border-carbon-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-500 dark:text-carbon-400 uppercase tracking-wider">In Progress</span>
            <Activity className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy-900 dark:text-white">{inProgressTrips.length}</span>
            <span className="text-[10px] text-navy-400 dark:text-carbon-500">en route</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-carbon-900 p-4 border border-navy-150 dark:border-carbon-800 rounded-xl shadow-sm hover:border-navy-250 dark:hover:border-carbon-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-500 dark:text-carbon-400 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy-900 dark:text-white">{completedTripsThisWeek.length}</span>
            <span className="text-[10px] text-navy-400 dark:text-carbon-500">completed/wk</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white dark:bg-carbon-900 p-4 border border-navy-150 dark:border-carbon-800 rounded-xl shadow-sm hover:border-navy-250 dark:hover:border-carbon-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-500 dark:text-carbon-400 uppercase tracking-wider">Ready Trucks</span>
            <TruckIcon className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy-900 dark:text-white">{availableTrucksCount}</span>
            <span className="text-[10px] text-navy-400 dark:text-carbon-500">/ {trucks.filter(t => !t.is_deleted).length} fleet</span>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-white dark:bg-carbon-900 p-4 border border-navy-150 dark:border-carbon-800 rounded-xl shadow-sm hover:border-navy-250 dark:hover:border-carbon-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy-500 dark:text-carbon-400 uppercase tracking-wider">Ready Drivers</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy-900 dark:text-white">{driverAvailableCount}</span>
            <span className="text-[10px] text-navy-400 dark:text-carbon-500">/ {driverEmployees.length} total</span>
          </div>
        </div>
      </div>

      {/* DETAILED LAYOUT GRID (TWO-COLUMNS: MAIN TABLE & ALERTS + SNAPSHOTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RECENT TRIPS TABLE (LEFT COLUMN 8/12) */}
        <div className="lg:col-span-8 bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          
          <div className="p-5 border-b border-navy-150 dark:border-carbon-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy-900 dark:text-white font-sans flex items-center gap-2">
                <Milestone className="w-4 h-4 text-navy-500" /> Active Dispatch logs
              </h2>
              <p className="text-xs text-navy-450 dark:text-carbon-400 mt-0.5">Click any record row to open or focus details inside the editor workspace.</p>
            </div>
            
            <div className="relative max-w-xs w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400 dark:text-carbon-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search trip code or client..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg text-xs font-medium placeholder-navy-400 dark:placeholder-carbon-500 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-500 dark:focus:ring-carbon-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {searchedTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                <p className="text-sm font-semibold text-navy-700 dark:text-zinc-300">No Match Logs Found</p>
                <p className="text-xs text-navy-400 dark:text-carbon-500 mt-1 max-w-sm">No trip advices fit the filters or match search results. Clear your search or add a trip entry.</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="mt-4 px-3 py-1.5 border border-navy-200 dark:border-carbon-800 rounded-lg text-xs font-medium bg-white dark:bg-carbon-900 text-navy-700 dark:text-zinc-200 hover:bg-navy-50"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy-50/50 dark:bg-carbon-850/40 text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase tracking-widest border-b border-navy-200 dark:border-carbon-800">
                    <th className="py-3 px-4">Trip Code</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Pickup window</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Route summary</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 dark:divide-carbon-850/30 text-xs">
                  {searchedTrips.map(trip => {
                    const tk = getTruckDetails(trip.truck_id);
                    const driver = getDriverName(trip.driver_id);
                    const client = getClientName(trip.client_id || trip.customer_id);
                    
                    const orig = getLocationName(trip.origin_location_id);
                    const dest = getLocationName(trip.destination_location_id);
                    const hasRoute = orig && dest;

                    return (
                      <tr 
                        key={trip.id}
                        onClick={() => onViewTripDetail && onViewTripDetail(trip.id)}
                        className="hover:bg-navy-100/50 dark:hover:bg-carbon-850/25 cursor-pointer transition-colors duration-150 group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-navy-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                          {trip.trip_advise_code || trip.trip_code}
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-0.5 transition-all text-blue-500" />
                        </td>
                        <td className="py-3 px-4 font-medium text-navy-700 dark:text-carbon-300">
                          {client}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-navy-800 dark:text-zinc-200">{trip.pickup_date}</span>
                            <span className="text-[10px] text-navy-450 dark:text-carbon-500 font-mono">{trip.pickup_time_window || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-navy-600 dark:text-carbon-350">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-bold text-navy-800 dark:text-zinc-200">{tk.plate}</span>
                            <span className="text-[10px] text-navy-450 dark:text-carbon-500">{tk.size}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-navy-600 dark:text-carbon-350">
                          {driver}
                        </td>
                        <td className="py-3 px-4">
                          {hasRoute ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-navy-700 dark:text-carbon-300 font-medium truncate max-w-[90px]">{orig}</span>
                              <ArrowRight className="w-3 h-3 text-navy-400 shrink-0" />
                              <span className="text-navy-700 dark:text-carbon-300 font-medium truncate max-w-[90px]">{dest}</span>
                            </div>
                          ) : (
                            <span className="text-navy-400 dark:text-carbon-550 italic">Cebu Depot Shuttle</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTripStatusBadgeClass(trip.status as string)}`}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ALERTS & SNAPSHOTS (RIGHT COLUMN 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* OPERATIONAL ALERTS PANEL */}
          <div className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-navy-100 dark:border-carbon-850">
              <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Operational Alerts
              </h2>
              {totalAlertsCount > 0 ? (
                <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/30">
                  {totalAlertsCount} Alert{totalAlertsCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-xs font-bold px-2 rounded-full border border-green-200 dark:border-green-900/20">
                  Optimal
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {totalAlertsCount === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs text-navy-500 dark:text-carbon-400">All vehicles, drivers, and pickup registers are within optimal operational bounds.</p>
                </div>
              )}

              {/* 1. Overdue Scheduled Trips Alert */}
              {overdueTrips.map(trip => (
                <div 
                  key={trip.id}
                  onClick={() => onViewTripDetail && onViewTripDetail(trip.id)}
                  className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/25 rounded-xl cursor-pointer hover:border-red-300 transition-all flex items-start gap-2.5 group"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-red-800 dark:text-red-400 group-hover:underline">Overdue Scheduled Pickup</p>
                    <p className="text-red-700 dark:text-red-450 mt-0.5">
                      Trip <span className="font-mono font-bold">{trip.trip_advise_code || trip.trip_code}</span> was slated for <span className="font-semibold">{trip.pickup_date}</span> but remains pending.
                    </p>
                  </div>
                </div>
              ))}

              {/* 2. Trucks In Maintenance Alert */}
              {maintenanceTrucks.map(tk => (
                <div 
                  key={tk.id}
                  className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/25 rounded-xl flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-800 dark:text-amber-450">Vehicle fleet Maintenance</p>
                    <p className="text-amber-700 dark:text-amber-500 mt-0.5">
                      Truck <span className="font-mono font-bold text-amber-900 dark:text-zinc-200">{tk.plate_number}</span> is entered as active Maintenance and unavailable for dispatch.
                    </p>
                  </div>
                </div>
              ))}

              {/* 3. Driver Expiry Alerts */}
              {expiringLicenses.map((lic, idx) => lic && (
                <div 
                  key={idx}
                  className="p-3 bg-blue-50/50 dark:bg-blue-955/10 border border-blue-100 dark:border-blue-900/25 rounded-xl flex items-start gap-2.5"
                >
                  <BadgeInfo className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-blue-800 dark:text-blue-400">License Expiration Warning</p>
                    <p className="text-blue-700 dark:text-blue-450 mt-0.5">
                      Driver <span className="font-semibold">{lic.driverName}</span>'s license ({lic.licenseNo}) expires in <span className="font-bold text-blue-600 dark:text-blue-400">{lic.daysLeft} days</span> ({lic.expiryDate}).
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FLEET AVAILABILITY SNAPSHOT */}
          <div className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-navy-100 dark:border-carbon-855 pb-2">
              <TruckIcon className="w-4 h-4 text-navy-500" /> Vehicle fleet Snapshot
            </h2>

            <div className="space-y-3">
              {/* Available */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Available
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{truckAvailableCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${trucks.length ? (truckAvailableCount / trucks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* In Use */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> In Use / Transit
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{truckInUseCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${trucks.length ? (truckInUseCount / trucks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Maintenance */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> In Maintenance
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{truckMaintenanceCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${trucks.length ? (truckMaintenanceCount / trucks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Inactive */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-400"></span> Inactive / Expired
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{truckInactiveCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-zinc-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${trucks.length ? (truckInactiveCount / trucks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DRIVER AVAILABILITY SNAPSHOT */}
          <div className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-navy-100 dark:border-carbon-855 pb-2">
              <Users className="w-4 h-4 text-navy-500" /> Driver Availability Snapshot
            </h2>

            <div className="space-y-3">
              {/* Available */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Available
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{driverAvailableCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${driverEmployees.length ? (driverAvailableCount / driverEmployees.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Assigned */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Assigned
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{driverAssignedCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${driverEmployees.length ? (driverAssignedCount / driverEmployees.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Unavailable */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> Inactive / Unavailable
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{driverUnavailableCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${driverEmployees.length ? (driverUnavailableCount / driverEmployees.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* On Leave */}
              <div>
                <div className="flex justify-between text-xs text-navy-600 dark:text-carbon-400 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-400"></span> On Leave
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{driverLeaveCount}</span>
                </div>
                <div className="w-full bg-navy-100 dark:bg-carbon-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-zinc-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${driverEmployees.length ? (driverLeaveCount / driverEmployees.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
