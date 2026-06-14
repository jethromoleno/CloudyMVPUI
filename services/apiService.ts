import { 
  User, Role, Permission, UserRoleRecord, RolePermission, AppSetting, AuditLog, AppModuleRecord, 
  TripAdvise, TripStop, TripAssignment, DriverAvailability, TripEvent, TripFuelLog, 
  TripStatusRecord, LoadType, Employee, Driver, EmployeeRoleRecord, Truck, TruckStatusRecord, 
  VehicleStatusLog, MaintenanceLog, Branch, Client, InternalClientCode, Consignee, 
  Location, Inventory, Billing, SystemUser, Trip, TripFuel, Customer
} from '../types';

// --- SEED ENUM / LOOKUP RECORDS ---

export const MOCK_ROLES: Role[] = [
  { id: 'role-superadmin', role_code: 'super_admin', role_name: 'Super Administrator', description: 'Complete system access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-dispatcher', role_code: 'dispatcher', role_name: 'Lead Dispatcher', description: 'Manages trip schedules and fleet dispatch', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-encoder', role_code: 'encoder', role_name: 'Data Encoder', description: 'Enters fuels, events, and transactional logs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_PERMISSIONS: Permission[] = [
  { id: 'perm-trips-view', permission_code: 'trips.view', module_code: 'trip_scheduling', description: 'View dispatch board and trips', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'perm-trips-create', permission_code: 'trips.create', module_code: 'trip_scheduling', description: 'Create trip advices', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'perm-trips-edit', permission_code: 'trips.edit', module_code: 'trip_scheduling', description: 'Assign fleet/drivers and modify trips', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'perm-users-manage', permission_code: 'users.manage', module_code: 'settings', description: 'Manage system users and settings', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_ROLE_PERMISSIONS: RolePermission[] = [
  { id: 'rp-1', role_id: 'role-superadmin', permission_id: 'perm-trips-view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rp-2', role_id: 'role-superadmin', permission_id: 'perm-trips-create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rp-3', role_id: 'role-superadmin', permission_id: 'perm-trips-edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rp-4', role_id: 'role-superadmin', permission_id: 'perm-users-manage', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rp-5', role_id: 'role-dispatcher', permission_id: 'perm-trips-view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rp-6', role_id: 'role-dispatcher', permission_id: 'perm-trips-create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'rp-7', role_id: 'role-dispatcher', permission_id: 'perm-trips-edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_APP_MODULES: AppModuleRecord[] = [
  { id: 'mod-1', module_code: 'trip_scheduling', label: 'Trip Scheduling', description: 'Fleet dispatcher dashboard and routes map', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mod-2', module_code: 'inventory', label: 'Inventory (Coming soon)', description: 'Container storage and warehouse logistics tracker', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mod-3', module_code: 'billing', label: 'Billing (Coming soon)', description: 'Logistics rate matrices, accounts receivable, and client invoices', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_APP_SETTINGS: AppSetting[] = [
  { id: 'setting-1', setting_key: 'company_name', setting_value: 'Cloudy Transport Services', description: 'Application organization title', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'setting-2', setting_key: 'auto_zoom_level', setting_value: '11', description: 'Fallback single-pin focus zoom', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_BRANCHES: Branch[] = [
  { id: 'branch-1', branch_code: 'MNL-HUB', branch_name: 'Metro Manila Operations', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'branch-2', branch_code: 'CEB-HUB', branch_name: 'Visayas Mandaue Hub', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'branch-3', branch_code: 'DVO-HUB', branch_name: 'Mindanao Davao Port Hub', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Replaces Customer
export const MOCK_CLIENTS: Client[] = [
  { id: 'client-1', client_code: 'GLO-001', client_name: 'Global Logistics Inc.', full_name: 'Global Logistics Philippines Inc.', address: 'Sasa Wharf, Davao City', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'client-2', client_code: 'FT-002', client_name: 'FastTrack Shipping', full_name: 'FastTrack Shipping & Sea Freight Corp.', address: 'Pier 15, South Harbor, Port Area, Manila', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_INTERNAL_CLIENT_CODES: InternalClientCode[] = [
  { id: 'icc-1', client_id: 'client-1', code: 'ICC-EXP-SASA', description: 'Davao Export Cargo Code', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'icc-2', client_id: 'client-2', code: 'ICC-DOM-PEIR', description: 'Manila Domestic Hub Code', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_CONSIGNEES: Consignee[] = [
  { id: 'cons-1', client_id: 'client-1', full_name: 'Metro Davao Supermarket', contact_no: '+63-912-345-6789', address: 'Quimpo Blvd, Davao City', city_area: 'Davao City', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cons-2', client_id: 'client-2', full_name: 'Mandaue Retail Center', contact_no: '+63-998-765-4321', address: 'A.S. Fortuna St, Mandaue City', city_area: 'Cebu Area', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_LOCATIONS: Location[] = [
  { id: 'loc-1', location_name: 'Manila Port', location_type: 'Hub', province: 'Metro Manila', region: 'NCR', address_line_1: 'Pier 15, South Harbor', latitude: 14.5995, longitude: 120.9842, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-2', location_name: 'Cebu Distribution Center', location_type: 'Warehouse', province: 'Cebu', region: 'Region VII', address_line_1: 'Mandaue City', latitude: 10.3157, longitude: 123.8854, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-3', location_name: 'Davao Terminal', location_type: 'Hub', province: 'Davao del Sur', region: 'Region XI', address_line_1: 'Sasa Wharf', latitude: 7.0707, longitude: 125.6012, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_EMPLOYEE_ROLES: EmployeeRoleRecord[] = [
  { id: 'er-1', role_code: 'Driver', label: 'Primary Driver', description: 'Heavy truck driver license holder', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'er-2', role_code: 'Helper', label: 'Truck Helper', description: 'Loading and offloading crew assistant', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'er-3', role_code: 'Encoder', label: 'Operations Encoder', description: 'Data entry clerk', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp-1', employee_code: 'EMP-001', first_name: 'John', last_name: 'Doe', full_name: 'John Doe', employee_role_id: 'er-1', contact_no: '0917-111-2233', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-2', employee_code: 'EMP-002', first_name: 'Jane', last_name: 'Smith', full_name: 'Jane Smith', employee_role_id: 'er-3', contact_no: '0917-222-3344', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-3', employee_code: 'EMP-003', first_name: 'Mike', last_name: 'Ross', full_name: 'Mike Ross', employee_role_id: 'er-1', contact_no: '0917-333-4455', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-4', employee_code: 'EMP-004', first_name: 'Bob', last_name: 'Johnson', full_name: 'Bob Johnson', employee_role_id: 'er-2', contact_no: '0917-444-5566', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 'driver-1', employee_id: 'emp-1', license_number: 'DL-NCR-12345', license_expiry: '2028-12-31', availability_status: 'Available', notes: 'Experienced Cebu-Manila RoRo driver', is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'driver-2', employee_id: 'emp-3', license_number: 'DL-MIN-67890', license_expiry: '2027-06-15', availability_status: 'Available', notes: 'Experienced long haul Mindanao-NCR highway driver', is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_DRIVER_AVAILABILITY: DriverAvailability[] = [
  { id: 'da-1', driver_id: 'driver-1', availability_date: '2026-06-14', status: 'Available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'da-2', driver_id: 'driver-2', availability_date: '2026-06-14', status: 'Available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRUCK_STATUSES: TruckStatusRecord[] = [
  { id: 'ts-avail', truck_status_code: 'Available', label: 'Available for Dispatch', description: 'Cleaned and ready', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ts-use', truck_status_code: 'In Use', label: 'In Transit', description: 'Active dispatch', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ts-maint', truck_status_code: 'Maintenance', label: 'In Maintenance', description: 'Being repaired', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_LOAD_TYPES: LoadType[] = [
  { id: 'load-dry', load_type_code: 'Dry', label: 'Dry Cargo', description: 'Standard ambient products', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'load-chilled', load_type_code: 'Chilled', label: 'Chilled Cargo', description: 'Temperature controlled fresh goods', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'load-ref', load_type_code: 'Ref', label: 'Reefer Frozen', description: 'Strictly frozen temperature cargo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'load-combi', load_type_code: 'Combi', label: 'Multi-Temp Combo', description: 'Split compartmental loader', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRUCKS: Truck[] = [
  { id: 'truck-1', plate_number: 'ABC-1234', vin: 'VIN-RE-873652', truck_size: '10-Wheeler Wing', load_type_id: 'load-dry', truck_status_id: 'ts-avail', registration_expiry: '2027-10-31', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'truck-2', plate_number: 'XYZ-5678', vin: 'VIN-MK-345398', truck_size: '6-Wheeler Closed', load_type_id: 'load-chilled', truck_status_id: 'ts-use', registration_expiry: '2026-12-15', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'truck-3', plate_number: 'RST-9012', plate_number_legacy_alias: 'RST-9012', vin: 'VIN-TY-108253', truck_size: '12-Wheeler Reefer', load_type_id: 'load-ref', truck_status_id: 'ts-maint', registration_expiry: '2027-04-20', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
] as any[];

export const MOCK_MAINTENANCE_LOGS: MaintenanceLog[] = [
  { id: 'm-1', truck_id: 'truck-3', reported_by_user_id: 'user-1', maintenance_type: 'Repair', status: 'In Progress', scheduled_date: '2026-06-12', completed_at: undefined, cost_amount: 15000, notes: 'Engine alternator overhaul and reefer compressor diagnostic test', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_STATUSES: TripStatusRecord[] = [
  { id: 'status-sched', status_code: 'Scheduled', label: 'Planned / Scheduled', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-transit', status_code: 'In Transit', label: 'Dispatched / In Transit', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-completed', status_code: 'Completed', label: 'Delivered / Completed', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-cancelled', status_code: 'Cancelled', label: 'Cancelled', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_ADVISES: TripAdvise[] = [
  {
    id: 'trip-1',
    trip_advise_code: 'T-2024-001',
    branch_id: 'branch-1',
    encoder_employee_id: 'emp-2',
    status_id: 'status-transit',
    client_id: 'client-1',
    internal_client_code_id: 'icc-1',
    consignee_id: 'cons-1',
    pickup_date: '2026-06-15',
    pickup_time_window: '08:00 AM - 12:00 PM',
    truck_size: '10-Wheeler Wing',
    load_type_id: 'load-dry',
    truck_id: 'truck-1',
    driver_id: 'driver-1',
    helper1_employee_id: 'emp-4',
    helper2_employee_id: undefined,
    is_stripper_used: false,
    loading_ref_no: 'REF-JOB-1001',
    net_weight: 8500,
    is_transfer: false,
    transfer_from_id: undefined,
    completion_date: undefined,
    remarks: 'High-priority delivery route (Manila to Cebu)',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // --- LEGACY ALIAS COMPATIBILITY KEYS ---
    trip_id: 'trip-1',
    trip_code: 'T-2024-001',
    customer_id: 'client-1',
    truck_id_legacy: 'truck-1',
    driver_id_legacy: 'driver-1',
    origin_location_id: 'loc-1',
    destination_location_id: 'loc-2',
    scheduled_start_time: '2026-06-15T08:00:00Z',
    status: 'In Transit',
    load_type: 'Dry'
  } as any,
  {
    id: 'trip-2',
    trip_advise_code: 'T-2024-002',
    branch_id: 'branch-2',
    encoder_employee_id: 'emp-2',
    status_id: 'status-sched',
    client_id: 'client-2',
    internal_client_code_id: 'icc-2',
    consignee_id: 'cons-2',
    pickup_date: '2026-06-20',
    pickup_time_window: '01:00 PM - 05:00 PM',
    truck_size: '12-Wheeler Reefer',
    load_type_id: 'load-ref',
    truck_id: 'truck-3',
    driver_id: 'driver-2',
    helper1_employee_id: undefined,
    helper2_employee_id: undefined,
    is_stripper_used: true,
    loading_ref_no: 'REF-JOB-1052',
    net_weight: 12000,
    is_transfer: false,
    transfer_from_id: undefined,
    completion_date: undefined,
    remarks: 'Reefer container transport (Cebu to Davao)',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // --- LEGACY ALIAS COMPATIBILITY KEYS ---
    trip_id: 'trip-2',
    trip_code: 'T-2024-002',
    customer_id: 'client-2',
    truck_id_legacy: 'truck-3',
    driver_id_legacy: 'driver-2',
    origin_location_id: 'loc-2',
    destination_location_id: 'loc-3',
    scheduled_start_time: '2026-06-20T13:00:00Z',
    status: 'Scheduled',
    load_type: 'Ref'
  } as any
];

export const MOCK_TRIP_STOPS: TripStop[] = [
  { id: 'stop-1', trip_advise_id: 'trip-1', stop_sequence: 1, stop_type: 'Pickup', location_id: 'loc-1', specific_address: 'Port Area Manila Core Pier 15', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-2', trip_advise_id: 'trip-1', stop_sequence: 2, stop_type: 'Dropoff', location_id: 'loc-2', specific_address: 'Mandaue City Visayas Storage Yard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_ASSIGNMENTS: TripAssignment[] = [
  { id: 'ta-1', trip_advise_id: 'trip-1', employee_id: 'emp-1', employee_role_id: 'er-1', truck_id: 'truck-1', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ta-2', trip_advise_id: 'trip-1', employee_id: 'emp-4', employee_role_id: 'er-2', truck_id: 'truck-1', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_EVENTS: TripEvent[] = [
  { id: 'event-1', trip_advise_id: 'trip-1', encoder_employee_id: 'emp-2', event_type: 'Loading_Arrival', event_timestamp: new Date().toISOString(), document_no: 'DOC-LOAD-01', remarks: 'Arrived at Manila terminal loading bay', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_FUEL_LOGS: TripFuelLog[] = [
  { id: 'fuel-1', trip_advise_id: 'trip-1', encoder_employee_id: 'emp-2', fuel_ref_no: 'TX-FUEL-883', liters: 120.5, total_amount: 7200, logged_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const MOCK_USERS: SystemUser[] = [
  { id: 'user-1', id_legacy: 1, username: 'SuperAdmin', password: 'admin123', role: 'SuperAdmin', permissions: ['inventory', 'trip_scheduling', 'billing'] }
] as any;

// Audit log helper
const MOCK_AUDIT_LOGS: AuditLog[] = [];

// Inventory placeholder store
export const MOCK_INVENTORY_STUBS: Inventory[] = [
  { id: 'inv-1', module_status: 'Placeholder', notes: 'Davao Container yard capacity stubs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Billing placeholder store
export const MOCK_BILLING_STUBS: Billing[] = [
  { id: 'bill-1', module_status: 'Placeholder', sample_source_trip_advise_id: 'trip-1', notes: 'Consolidated rates matrix billing stubs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];


// --- EXPORTED API METRIC & CRUD OPERATIONS ---

export const api = {
  // Auth & RBAC
  login: async (username: string, password: string): Promise<SystemUser> => {
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    
    // Write audit log
    MOCK_AUDIT_LOGS.push({
      id: Math.random().toString(),
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'users',
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return { ...user };
  },

  getUsers: async (): Promise<SystemUser[]> => {
    return [...MOCK_USERS];
  },

  createUser: async (user: any): Promise<SystemUser> => {
    const uuid = 'user-' + Math.floor(Math.random() * 10000);
    const newUser = { 
      ...user, 
      id: uuid, 
      id_legacy: Math.floor(Math.random() * 1000) 
    };
    MOCK_USERS.push(newUser);

    MOCK_AUDIT_LOGS.push({
      id: Math.random().toString(),
      action: 'CREATE',
      table_name: 'users',
      record_id: uuid,
      new_values: newUser,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return newUser;
  },

  deleteUser: async (id: string | number): Promise<void> => {
    const sId = String(id);
    const index = MOCK_USERS.findIndex(u => String(u.id) === sId || String((u as any).id_legacy) === sId);
    if (index !== -1) {
      MOCK_USERS.splice(index, 1);
    }
  },

  // Trips / Trip Advise Operations
  getTrips: async (): Promise<Trip[]> => {
    return [...MOCK_TRIP_ADVISES];
  },

  createTrip: async (trip: any): Promise<TripAdvise> => {
    const uuid = 'trip-' + Math.floor(Math.random() * 10000);
    const codeNum = MOCK_TRIP_ADVISES.length + 1;
    const tripCode = `T-2026-00${codeNum}`;

    // Resolve details for legacy fields
    const client = MOCK_CLIENTS.find(c => c.id === trip.client_id) || MOCK_CLIENTS[0];
    const statusObj = MOCK_TRIP_STATUSES.find(s => s.id === trip.status_id) || MOCK_TRIP_STATUSES[0];
    const loadTypeObj = MOCK_LOAD_TYPES.find(l => l.id === trip.load_type_id) || MOCK_LOAD_TYPES[0];

    const currentOrigin = trip.origin_location_id || 'loc-1';
    const currentDest = trip.destination_location_id || 'loc-2';

    const newTrip: TripAdvise = {
      id: uuid,
      trip_advise_code: trip.trip_advise_code || tripCode,
      branch_id: trip.branch_id || 'branch-1',
      encoder_employee_id: trip.encoder_employee_id || 'emp-2',
      status_id: trip.status_id || 'status-sched',
      client_id: trip.client_id || 'client-1',
      internal_client_code_id: trip.internal_client_code_id || 'icc-1',
      consignee_id: trip.consignee_id || 'cons-1',
      pickup_date: trip.pickup_date || new Date().toISOString().split('T')[0],
      pickup_time_window: trip.pickup_time_window || '08:00 AM - 12:00 PM',
      truck_size: trip.truck_size || '10-Wheeler Wing',
      load_type_id: trip.load_type_id || 'load-dry',
      truck_id: trip.truck_id || 'truck-1',
      driver_id: trip.driver_id || 'driver-1',
      helper1_employee_id: trip.helper1_employee_id,
      helper2_employee_id: trip.helper2_employee_id,
      is_stripper_used: trip.is_stripper_used || false,
      loading_ref_no: trip.loading_ref_no || '',
      net_weight: trip.net_weight || 0,
      is_transfer: trip.is_transfer || false,
      remarks: trip.remarks || '',
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Legacy backward-compatibility mapping keys
      trip_id: uuid as any,
      trip_code: trip.trip_advise_code || tripCode,
      customer_id: (trip.client_id || 'client-1') as any,
      origin_location_id: currentOrigin as any,
      destination_location_id: currentDest as any,
      scheduled_start_time: `${trip.pickup_date || new Date().toISOString().split('T')[0]}T08:00:00Z`,
      status: (statusObj?.status_code || 'Scheduled') as any,
      load_type: (loadTypeObj?.load_type_code || 'Dry') as any
    } as any;

    MOCK_TRIP_ADVISES.push(newTrip);

    // Stop tracking sequence setup
    MOCK_TRIP_STOPS.push({
      id: 'stop-' + Math.random().toString(),
      trip_advise_id: uuid,
      stop_sequence: 1,
      stop_type: 'Pickup',
      location_id: currentOrigin,
      specific_address: 'Main Pick Point Address',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    MOCK_TRIP_STOPS.push({
      id: 'stop-' + Math.random().toString(),
      trip_advise_id: uuid,
      stop_sequence: 2,
      stop_type: 'Dropoff',
      location_id: currentDest,
      specific_address: 'Final Destination Address',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    MOCK_AUDIT_LOGS.push({
      id: Math.random().toString(),
      action: 'CREATE',
      table_name: 'trip_advises',
      record_id: uuid,
      new_values: newTrip,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return newTrip;
  },

  updateTrip: async (id: string | number, trip: any): Promise<TripAdvise> => {
    const sId = String(id);
    const index = MOCK_TRIP_ADVISES.findIndex(t => String(t.id) === sId || String((t as any).trip_id) === sId);
    if (index === -1) throw new Error('Trip not found');

    const prevValues = { ...MOCK_TRIP_ADVISES[index] };

    // Update fields
    const updated = {
      ...MOCK_TRIP_ADVISES[index],
      ...trip,
      updated_at: new Date().toISOString()
    };

    // Keep legacy aliases synced!
    if (trip.pickup_date) {
      updated.scheduled_start_time = `${trip.pickup_date}T08:00:00Z`;
    }
    if (trip.trip_advise_code) {
      updated.trip_code = trip.trip_advise_code;
    }
    if (trip.client_id) {
      updated.customer_id = trip.client_id;
    }
    if (trip.status_id) {
      const statusObj = MOCK_TRIP_STATUSES.find(s => s.id === trip.status_id);
      if (statusObj) {
        updated.status = statusObj.status_code as any;
      }
    }
    if (trip.load_type_id) {
      const loadTypeObj = MOCK_LOAD_TYPES.find(l => l.id === trip.load_type_id);
      if (loadTypeObj) {
        updated.load_type = loadTypeObj.load_type_code as any;
      }
    }

    MOCK_TRIP_ADVISES[index] = updated;

    MOCK_AUDIT_LOGS.push({
      id: Math.random().toString(),
      action: 'UPDATE',
      table_name: 'trip_advises',
      record_id: sId,
      old_values: prevValues,
      new_values: updated,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return updated;
  },

  deleteTrip: async (id: string | number): Promise<void> => {
    const sId = String(id);
    const index = MOCK_TRIP_ADVISES.findIndex(t => String(t.id) === sId || String((t as any).trip_id) === sId);
    if (index !== -1) {
      MOCK_TRIP_ADVISES[index].is_deleted = true;
      // Write audit
      MOCK_AUDIT_LOGS.push({
        id: Math.random().toString(),
        action: 'DELETE',
        table_name: 'trip_advises',
        record_id: sId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  },

  // Employees Directory operations
  getEmployees: async (): Promise<Employee[]> => {
    return MOCK_EMPLOYEES.filter(e => !e.is_deleted);
  },

  createEmployee: async (emp: any): Promise<Employee> => {
    const uuid = 'emp-' + Math.floor(Math.random() * 10000);
    const code = `EMP-0${MOCK_EMPLOYEES.length + 10}`;
    const newEmp: Employee = {
      id: uuid,
      employee_code: emp.employee_code || code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      full_name: `${emp.first_name} ${emp.last_name}`,
      employee_role_id: emp.employee_role_id || 'er-1',
      contact_no: emp.contact_no || '0917-X-FLIGHT',
      employment_status: emp.employment_status || 'Active',
      is_active: true,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Legacy key
      employee_id: uuid as any,
      role: (MOCK_EMPLOYEE_ROLES.find(r => r.id === emp.employee_role_id)?.role_code || 'Helper') as any,
      license_number: emp.license_number
    } as any;

    MOCK_EMPLOYEES.push(newEmp);

    // If role is Driver, create parallel record in Drivers table
    if (newEmp.employee_role_id === 'er-1') {
      MOCK_DRIVERS.push({
        id: 'driver-' + Math.floor(Math.random() * 10000),
        employee_id: uuid,
        license_number: emp.license_number || 'DL-GEN-999',
        license_expiry: '2030-01-01',
        availability_status: 'Available',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return newEmp;
  },

  deleteEmployee: async (id: string | number): Promise<void> => {
    const sId = String(id);
    const index = MOCK_EMPLOYEES.findIndex(e => String(e.id) === sId || String((e as any).employee_id) === sId);
    if (index !== -1) {
      MOCK_EMPLOYEES[index].is_deleted = true;
      MOCK_EMPLOYEES[index].is_active = false;
    }
  },

  // Trucks / Vehicle Fleet operations
  getTrucks: async (): Promise<Truck[]> => {
    return MOCK_TRUCKS.filter(t => !t.is_deleted);
  },

  createTruck: async (truck: any): Promise<Truck> => {
    const uuid = 'truck-' + Math.floor(Math.random() * 10000);
    
    const newTruck: Truck = {
      id: uuid,
      plate_number: truck.plate_number || truck.license_plate,
      vin: truck.vin || `VIN-${Math.random().toString().slice(2, 10).toUpperCase()}`,
      truck_size: truck.truck_size || `${truck.tonner_capacity || 10}-Wheeler Cargo`,
      load_type_id: truck.load_type_id || 'load-dry',
      truck_status_id: truck.truck_status_id || 'ts-avail',
      registration_expiry: truck.registration_expiry || '2028-12-31',
      is_active: true,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Legacy keys
      truck_id: uuid as any,
      license_plate: truck.plate_number || truck.license_plate,
      tonner_capacity: truck.tonner_capacity || 15,
      status: (MOCK_TRUCK_STATUSES.find(s => s.id === truck.truck_status_id)?.truck_status_code || 'Available') as any
    } as any;

    MOCK_TRUCKS.push(newTruck);
    return newTruck;
  },

  deleteTruck: async (id: string | number): Promise<void> => {
    const sId = String(id);
    const index = MOCK_TRUCKS.findIndex(t => String(t.id) === sId || String((t as any).truck_id) === sId);
    if (index !== -1) {
      MOCK_TRUCKS[index].is_deleted = true;
    }
  },

  // Lookup / Master references endpoints
  getCustomers: async (): Promise<Customer[]> => {
    // customers maps to clients in target
    return MOCK_CLIENTS;
  },

  getLocations: async (): Promise<Location[]> => {
    // Add legacy back-compatibility lookup ID
    return MOCK_LOCATIONS.map(l => ({
      ...l,
      location_id: l.id as any,
      name: l.location_name,
      address_line_1: l.address_line_1 || ''
    } as any));
  },

  getFuelLogs: async (): Promise<TripFuel[]> => {
    return MOCK_TRIP_FUEL_LOGS.map(f => ({
      ...f,
      fuel_id: f.id as any,
      trip_id: f.trip_advise_id as any,
      encoder_id: f.encoder_employee_id as any,
    } as any));
  },

  createFuelLog: async (log: any): Promise<TripFuelLog> => {
    const uuid = 'fuel-' + Math.floor(Math.random() * 10000);
    const newLog: TripFuelLog = {
      id: uuid,
      trip_advise_id: log.trip_advise_id,
      encoder_employee_id: log.encoder_employee_id || 'emp-2',
      fuel_ref_no: log.fuel_ref_no,
      liters: Number(log.liters || 0),
      total_amount: Number(log.total_amount || 0),
      logged_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_TRIP_FUEL_LOGS.push(newLog);
    return newLog;
  }
};
