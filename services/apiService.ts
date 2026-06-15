import { 
  User, Role, Permission, UserRole, RolePermission, AppSetting, AuditLog, AppModuleDefinition, 
  TripAdvise, TripStop, TripAssignment, DriverAvailability, TripEvent, TripFuelLog, 
  TripStatus, LoadType, Employee, Driver, EmployeeRole, Truck, TruckStatus, 
  VehicleStatusLog, MaintenanceLog, Branch, Client, InternalClientCode, Consignee, 
  Location, Inventory, Billing, SystemUser, Trip, TripFuel, Customer
} from '../types';

// --- SEED ENUM / LOOKUP RECORDS ---

export const MOCK_ROLES: Role[] = [
  { id: 'role-superadmin', role_code: 'super_admin', role_name: 'Super Administrator', description: 'Complete system access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-admin', role_code: 'admin', role_name: 'Administrator', description: 'Branch management and reports', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-dispatcher', role_code: 'dispatcher', role_name: 'Lead Dispatcher', description: 'Manages trip schedules and fleet dispatch', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-encoder', role_code: 'encoder', role_name: 'Data Encoder', description: 'Enters fuels, events, and transactional logs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'role-viewer', role_code: 'viewer', role_name: 'Viewer', description: 'Read-only access to schedules and tracking', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
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

export const MOCK_APP_MODULES: AppModuleDefinition[] = [
  { id: 'mod-1', module_code: 'trip_scheduling', label: 'Trip Scheduling', description: 'Fleet dispatcher dashboard and routes map', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mod-2', module_code: 'inventory', label: 'Inventory (Coming soon)', description: 'Container storage and warehouse logistics tracker', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mod-3', module_code: 'billing', label: 'Billing (Coming soon)', description: 'Logistics rate matrices, accounts receivable, and client invoices', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_APP_SETTINGS: AppSetting[] = [
  { id: 'setting-1', setting_key: 'company_name', setting_value: 'Cloudy Transport Services', description: 'Application organization title', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'setting-2', setting_key: 'app_timezone', setting_value: 'Asia/Manila', description: 'Default system timezone for all timestamps', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'setting-3', setting_key: 'default_branch_id', setting_value: 'branch-2', description: 'Default branch for new trip entries', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'setting-4', setting_key: 'session_timeout_minutes', setting_value: '60', description: 'User session timeout in minutes', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'setting-5', setting_key: 'pending_trip_alert_hours', setting_value: '2', description: 'Hours before pickup to flag still-Scheduled trips as overdue', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'setting-6', setting_key: 'license_expiry_warning_days', setting_value: '30', description: 'Days before expiry to show driver license warning', updated_by_user_id: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const MOCK_BRANCHES: Branch[] = [
  { id: 'branch-1', branch_code: 'MNL-HUB', branch_name: 'Metro Manila Operations', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'branch-2', branch_code: 'CEB-HUB', branch_name: 'Visayas Mandaue Hub', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'branch-3', branch_code: 'DVO-HUB', branch_name: 'Mindanao Davao Port Hub', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'client-1', client_code: 'GLO-001', client_name: 'Global Logistics Inc.', full_name: 'Global Logistics Philippines Inc.', address: 'Sasa Wharf, Davao City', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'client-2', client_code: 'FT-002', client_name: 'FastTrack Shipping', full_name: 'FastTrack Shipping & Sea Freight Corp.', address: 'Pier 15, South Harbor, Port Area, Manila', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'client-3', client_code: 'CEB-003', client_name: 'Cebu Retailers Corp', full_name: 'Cebu Allied Retailers and Distributors Corp', address: 'Mandaue Reclamation Area, Cebu', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_INTERNAL_CLIENT_CODES: InternalClientCode[] = [
  { id: 'icc-1', client_id: 'client-1', code: 'ICC-EXP-SASA', description: 'Davao Export Cargo Code', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'icc-2', client_id: 'client-2', code: 'ICC-DOM-PEIR', description: 'Manila Domestic Hub Code', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'icc-3', client_id: 'client-3', code: 'ICC-VIS-CEBU', description: 'Cebu Visayas Local Hub Code', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_CONSIGNEES: Consignee[] = [
  { id: 'cons-1', client_id: 'client-1', full_name: 'Metro Davao Supermarket', contact_no: '+63-912-345-6789', address: 'Quimpo Blvd, Davao City', city_area: 'Davao City', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cons-2', client_id: 'client-2', full_name: 'Mandaue Retail Center', contact_no: '+63-998-765-4321', address: 'A.S. Fortuna St, Mandaue City', city_area: 'Cebu Area', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cons-3', client_id: 'client-3', full_name: 'Toledo Merchant Depot', contact_no: '+63-915-222-3344', address: 'Sangi Road, Toledo City, Cebu', city_area: 'Toledo Port', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_LOCATIONS: Location[] = [
  { id: 'loc-1', location_name: 'Manila Port', location_type: 'Hub', province: 'Metro Manila', region: 'NCR', address_line_1: 'Pier 15, South Harbor', latitude: 14.5995, longitude: 120.9842, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-2', location_name: 'Cebu Distribution Center', location_type: 'Warehouse', province: 'Cebu', region: 'Region VII', address_line_1: 'Mandaue City', latitude: 10.3157, longitude: 123.8854, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-3', location_name: 'Davao Terminal', location_type: 'Hub', province: 'Davao del Sur', region: 'Region XI', address_line_1: 'Sasa Wharf', latitude: 7.0707, longitude: 125.6012, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-4', location_name: 'Toledo Port Terminal', location_type: 'Hub', province: 'Cebu', region: 'Region VII', address_line_1: 'Barangay Sangi, Toledo City', latitude: 10.3752, longitude: 123.6389, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'loc-5', location_name: 'Mactan MEPZ Warehouse', location_type: 'Warehouse', province: 'Cebu', region: 'Region VII', address_line_1: 'MEPZ 1, Lapu-Lapu City', latitude: 10.3122, longitude: 123.9785, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_EMPLOYEE_ROLES: EmployeeRole[] = [
  { id: 'er-1', role_code: 'Driver', label: 'Primary Driver', description: 'Heavy truck driver license holder', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'er-2', role_code: 'Helper', label: 'Truck Helper', description: 'Loading and offloading crew assistant', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'er-3', role_code: 'Encoder', label: 'Operations Encoder', description: 'Data entry clerk', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'er-4', role_code: 'Dispatcher', label: 'Fleet Dispatcher', description: 'Schedules and coordinates active runs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'er-5', role_code: 'Admin Staff', label: 'Administrative Staff', description: 'Office support and administrative personnel', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp-1', employee_code: 'EMP-001', first_name: 'John', last_name: 'Doe', full_name: 'John Doe', employee_role_id: 'er-1', branch_id: 'branch-2', contact_no: '0917-111-2233', email: 'john.doe@cloudy.ph', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-2', employee_code: 'EMP-002', first_name: 'Jane', last_name: 'Smith', full_name: 'Jane Smith', employee_role_id: 'er-3', branch_id: 'branch-2', contact_no: '0917-222-3344', email: 'jane.smith@cloudy.ph', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-3', employee_code: 'EMP-003', first_name: 'Mike', last_name: 'Ross', full_name: 'Mike Ross', employee_role_id: 'er-1', branch_id: 'branch-2', contact_no: '0917-333-4455', email: 'mike.ross@cloudy.ph', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-4', employee_code: 'EMP-004', first_name: 'Bob', last_name: 'Johnson', full_name: 'Bob Johnson', employee_role_id: 'er-2', branch_id: 'branch-2', contact_no: '0917-444-5566', email: 'bob.johnson@cloudy.ph', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-5', employee_code: 'EMP-005', first_name: 'Sergio', last_name: 'Go', full_name: 'Sergio Go', employee_role_id: 'er-4', branch_id: 'branch-2', contact_no: '0917-555-6677', email: 'sergio.go@cloudy.ph', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-6', employee_code: 'EMP-006', first_name: 'Robert', last_name: 'Talisay', full_name: 'Robert Talisay', employee_role_id: 'er-1', branch_id: 'branch-2', contact_no: '0917-666-7788', email: 'robert.talisay@cloudy.ph', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'emp-7', employee_code: 'EMP-007', first_name: 'Cardo', last_name: 'Dalisay', full_name: 'Cardo Dalisay', employee_role_id: 'er-2', branch_id: 'branch-2', contact_no: '0917-777-8899', email: 'cardo.dalisay@cloudy.ph', employment_status: 'Active', is_active: true, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 'driver-1', employee_id: 'emp-1', license_number: 'DL-NCR-12345', license_expiry: '2028-12-31', availability_status: 'Available', notes: 'Experienced Cebu-Manila RoRo driver', is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'driver-2', employee_id: 'emp-3', license_number: 'DL-MIN-67890', license_expiry: '2027-06-15', availability_status: 'Available', notes: 'Experienced long haul Mindanao-NCR highway driver', is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'driver-3', employee_id: 'emp-6', license_number: 'DL-VIS-98765', license_expiry: '2029-04-20', availability_status: 'Available', notes: 'Cebu local logistics and Toledo routes expert', is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_DRIVER_AVAILABILITY: DriverAvailability[] = [
  { id: 'da-1', driver_id: 'driver-1', availability_date: '2026-06-14', status: 'Available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'da-2', driver_id: 'driver-2', availability_date: '2026-06-14', status: 'Available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'da-3', driver_id: 'driver-3', availability_date: '2026-06-14', status: 'Available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'da-4', driver_id: 'driver-1', availability_date: '2026-06-15', status: 'Assigned', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'da-5', driver_id: 'driver-2', availability_date: '2026-06-15', status: 'Available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRUCK_STATUSES: TruckStatus[] = [
  { id: 'ts-avail', truck_status_code: 'Available', label: 'Available for Dispatch', description: 'Cleaned and ready', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ts-use', truck_status_code: 'In Use', label: 'In Transit', description: 'Active dispatch', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ts-maint', truck_status_code: 'Maintenance', label: 'In Maintenance', description: 'Being repaired', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ts-inactive', truck_status_code: 'Inactive', label: 'Inactive / Retaliated', description: 'Suspended or expired registration', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_LOAD_TYPES: LoadType[] = [
  { id: 'load-dry', load_type_code: 'Dry', label: 'Dry Cargo', description: 'Standard ambient products', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'load-chilled', load_type_code: 'Chilled', label: 'Chilled Cargo', description: 'Temperature controlled fresh goods', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'load-ref', load_type_code: 'Ref', label: 'Reefer Frozen', description: 'Strictly frozen temperature cargo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'load-combi', load_type_code: 'Combi', label: 'Multi-Temp Combo', description: 'Split compartmental loader', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRUCKS: Truck[] = [
  { id: 'truck-1', plate_number: 'ABC-1234', vin: 'VIN-RE-873652', truck_size: '10-Wheeler Wing', load_type_id: 'load-dry', truck_status_id: 'ts-avail', registration_expiry: '2027-10-31', branch_id: 'branch-2', is_active: true, is_deleted: false, remarks: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'truck-2', plate_number: 'XYZ-5678', vin: 'VIN-MK-345398', truck_size: '6-Wheeler Closed', load_type_id: 'load-chilled', truck_status_id: 'ts-use', registration_expiry: '2026-12-15', branch_id: 'branch-2', is_active: true, is_deleted: false, remarks: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'truck-3', plate_number: 'RST-9012', vin: 'VIN-TY-108253', truck_size: '12-Wheeler Reefer', load_type_id: 'load-ref', truck_status_id: 'ts-maint', registration_expiry: '2027-04-20', branch_id: 'branch-2', is_active: true, is_deleted: false, remarks: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'truck-4', plate_number: 'MNK-4455', vin: 'VIN-AB-983120', truck_size: '10-Wheeler Reefer', load_type_id: 'load-ref', truck_status_id: 'ts-avail', registration_expiry: '2028-01-10', branch_id: 'branch-2', is_active: true, is_deleted: false, remarks: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'truck-5', plate_number: 'GHI-7890', vin: 'VIN-ZZ-554433', truck_size: 'Flatbed Trailer', load_type_id: 'load-dry', truck_status_id: 'ts-inactive', registration_expiry: '2026-05-15', branch_id: 'branch-1', is_active: true, is_deleted: false, remarks: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
] as any[];

export const MOCK_VEHICLE_STATUS_LOGS: VehicleStatusLog[] = [
  { id: 'vsl-1', truck_id: 'truck-3', old_status_id: 'ts-avail', new_status_id: 'ts-maint', changed_by_user_id: 'user-1', changed_at: new Date().toISOString(), reason: 'Scheduled preventive compressor service', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'vsl-2', truck_id: 'truck-5', old_status_id: 'ts-avail', new_status_id: 'ts-inactive', changed_by_user_id: 'user-1', changed_at: new Date().toISOString(), reason: 'Registration expired, awaiting LTO renewal schedules', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_MAINTENANCE_LOGS: MaintenanceLog[] = [
  { id: 'm-1', truck_id: 'truck-3', reported_by_user_id: 'user-1', maintenance_type: 'Repair', status: 'In Progress', scheduled_date: '2026-06-12', completed_at: undefined, cost_amount: 15000, notes: 'Engine alternator overhaul and reefer compressor diagnostic test', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm-2', truck_id: 'truck-5', reported_by_user_id: 'user-1', maintenance_type: 'Inspection', status: 'Completed', scheduled_date: '2026-06-10', completed_at: new Date().toISOString(), cost_amount: 2500, notes: 'LTO Emission and Roadworthiness standards check', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_STATUSES: TripStatus[] = [
  { id: 'status-sched', status_code: 'Scheduled', label: 'Planned / Scheduled', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-inprogress', status_code: 'In Progress', label: 'In Progress', sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-completed', status_code: 'Completed', label: 'Delivered / Completed', sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-cancelled', status_code: 'Cancelled', label: 'Cancelled', sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-rescue', status_code: 'Rescue', label: 'Rescue Deployment Needed', sort_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'status-backload', status_code: 'Backload', label: 'Backload Return Trip', sort_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_ADVISES: TripAdvise[] = [
  {
    id: 'trip-1',
    trip_advise_code: 'T-CEB-001',
    branch_id: 'branch-2', // Cebu branch
    encoder_employee_id: 'emp-2',
    status_id: 'status-inprogress',
    client_id: 'client-1',
    internal_client_code_id: 'icc-1',
    consignee_id: 'cons-2', // Mandaue Retail
    pickup_date: '2026-06-15',
    pickup_time_window: '08:00 AM - 12:00 PM',
    truck_size: '10-Wheeler Wing',
    load_type_id: 'load-dry',
    truck_id: 'truck-1',
    driver_id: 'driver-1',
    helper1_employee_id: 'emp-4',
    is_stripper_used: false,
    loading_ref_no: 'REF-CEB-101',
    net_weight: 8500,
    is_transfer: false,
    remarks: 'Local Cebu haul - Manila container arrival transfer to Mandaue Depot',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // --- LEGACY ALIAS COMPATIBILITY KEYS ---
    trip_id: 'trip-1',
    trip_code: 'T-CEB-001',
    customer_id: 'client-1',
    origin_location_id: 'loc-1', // Manila Port
    destination_location_id: 'loc-2', // Cebu Distribution Center
    scheduled_start_time: '2026-06-15T08:00:00Z',
    status: 'In Progress',
    load_type: 'Dry'
  } as any,
  {
    id: 'trip-2',
    trip_advise_code: 'T-CEB-002',
    branch_id: 'branch-2',
    encoder_employee_id: 'emp-2',
    status_id: 'status-sched',
    client_id: 'client-3',
    internal_client_code_id: 'icc-3',
    consignee_id: 'cons-3', // Toledo Depot
    pickup_date: '2026-06-16',
    pickup_time_window: '01:00 PM - 05:00 PM',
    truck_size: '10-Wheeler Reefer',
    load_type_id: 'load-ref',
    truck_id: 'truck-4',
    driver_id: 'driver-2',
    helper1_employee_id: 'emp-4',
    is_stripper_used: false,
    loading_ref_no: 'REF-CEB-202',
    net_weight: 12000,
    is_transfer: false,
    remarks: 'Reefer fish delivery route Cebu Mandaue to Toledo Port Terminal',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // --- LEGACY ALIAS COMPATIBILITY KEYS ---
    trip_id: 'trip-2',
    trip_code: 'T-CEB-002',
    customer_id: 'client-3',
    origin_location_id: 'loc-2',
    destination_location_id: 'loc-4',
    scheduled_start_time: '2026-06-16T13:00:00Z',
    status: 'Scheduled',
    load_type: 'Ref'
  } as any,
  {
    id: 'trip-3',
    trip_advise_code: 'T-CEB-003',
    branch_id: 'branch-2',
    encoder_employee_id: 'emp-2',
    status_id: 'status-completed',
    client_id: 'client-1',
    internal_client_code_id: 'icc-1',
    consignee_id: 'cons-2',
    pickup_date: '2026-06-12',
    pickup_time_window: '06:00 AM - 10:00 AM',
    truck_size: '6-Wheeler Closed',
    load_type_id: 'load-chilled',
    truck_id: 'truck-2',
    driver_id: 'driver-3',
    helper1_employee_id: 'emp-7',
    is_stripper_used: true,
    loading_ref_no: 'REF-CEB-303',
    net_weight: 4500,
    is_transfer: false,
    completion_date: new Date().toISOString(),
    remarks: 'Mactan Economic Zone electronics shuttle run to Cebu Port Terminal',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // --- LEGACY ALIAS COMPATIBILITY KEYS ---
    trip_id: 'trip-3',
    trip_code: 'T-CEB-003',
    customer_id: 'client-1',
    origin_location_id: 'loc-5', // Mactan MEPZ
    destination_location_id: 'loc-2', // Cebu CDC
    scheduled_start_time: '2026-06-12T06:00:00Z',
    status: 'Completed',
    load_type: 'Chilled'
  } as any,
  {
    id: 'trip-4',
    trip_advise_code: 'T-CEB-004',
    branch_id: 'branch-2',
    encoder_employee_id: 'emp-2',
    status_id: 'status-cancelled',
    client_id: 'client-2',
    internal_client_code_id: 'icc-2',
    consignee_id: 'cons-2',
    pickup_date: '2026-06-13',
    pickup_time_window: '10:00 AM - 02:00 PM',
    truck_size: '12-Wheeler Reefer',
    load_type_id: 'load-ref',
    truck_id: 'truck-3',
    driver_id: 'driver-2',
    is_stripper_used: false,
    loading_ref_no: 'REF-CEB-404',
    net_weight: 15000,
    is_transfer: false,
    remarks: 'Cancelled due to scheduled compressor service on truck-3',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // --- LEGACY ALIAS COMPATIBILITY KEYS ---
    trip_id: 'trip-4',
    trip_code: 'T-CEB-004',
    customer_id: 'client-2',
    origin_location_id: 'loc-2',
    destination_location_id: 'loc-3',
    scheduled_start_time: '2026-06-13T10:00:00Z',
    status: 'Cancelled',
    load_type: 'Ref'
  } as any,
  {
    id: 'trip-5',
    trip_advise_code: 'T-CEB-005',
    branch_id: 'branch-2',
    encoder_employee_id: 'emp-2',
    status_id: 'status-rescue',
    client_id: 'client-1',
    internal_client_code_id: 'icc-1',
    consignee_id: 'cons-1',
    pickup_date: '2026-06-14',
    pickup_time_window: '02:00 PM - 06:00 PM',
    truck_size: '10-Wheeler Wing',
    load_type_id: 'load-dry',
    truck_id: 'truck-1',
    driver_id: 'driver-1',
    is_stripper_used: false,
    loading_ref_no: 'REF-CEB-505',
    net_weight: 9005,
    is_transfer: true,
    transfer_from_id: 'trip-4',
    remarks: 'Rescue run deployed to recover dry goods from transfer logistics',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // --- LEGACY ALIAS COMPATIBILITY KEYS ---
    trip_id: 'trip-5',
    trip_code: 'T-CEB-005',
    customer_id: 'client-1',
    origin_location_id: 'loc-5',
    destination_location_id: 'loc-3',
    scheduled_start_time: '2026-06-14T14:00:00Z',
    status: 'Rescue',
    load_type: 'Dry'
  } as any
];

export const MOCK_TRIP_STOPS: TripStop[] = [
  { id: 'stop-1', trip_advise_id: 'trip-1', stop_sequence: 1, stop_type: 'Pickup', location_id: 'loc-1', specific_address: 'Port Area Manila Core Pier 15', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-2', trip_advise_id: 'trip-1', stop_sequence: 2, stop_type: 'Dropoff', location_id: 'loc-2', specific_address: 'Mandaue City Visayas Storage Yard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-3', trip_advise_id: 'trip-2', stop_sequence: 1, stop_type: 'Pickup', location_id: 'loc-2', specific_address: 'Mandaue Cold Storage facility', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-4', trip_advise_id: 'trip-2', stop_sequence: 2, stop_type: 'Dropoff', location_id: 'loc-4', specific_address: 'Toledo Port fish cargo exit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-5', trip_advise_id: 'trip-3', stop_sequence: 1, stop_type: 'Pickup', location_id: 'loc-5', specific_address: 'MEPZ 1 Gate 2 warehouse complex', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-6', trip_advise_id: 'trip-3', stop_sequence: 2, stop_type: 'Dropoff', location_id: 'loc-2', specific_address: 'Cebu Distribution Center Hub B', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-7', trip_advise_id: 'trip-4', stop_sequence: 1, stop_type: 'Pickup', location_id: 'loc-2', specific_address: 'Mandaue distribution depot', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-8', trip_advise_id: 'trip-4', stop_sequence: 2, stop_type: 'Dropoff', location_id: 'loc-3', specific_address: 'Sasa Terminal, Davao City', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-9', trip_advise_id: 'trip-5', stop_sequence: 1, stop_type: 'Pickup', location_id: 'loc-5', specific_address: 'MEPZ warehouse yard', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'stop-10', trip_advise_id: 'trip-5', stop_sequence: 2, stop_type: 'Dropoff', location_id: 'loc-3', specific_address: 'Davao Port Depot exit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_ASSIGNMENTS: TripAssignment[] = [
  { id: 'ta-1', trip_advise_id: 'trip-1', employee_id: 'emp-1', employee_role_id: 'er-1', truck_id: 'truck-1', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ta-2', trip_advise_id: 'trip-1', employee_id: 'emp-4', employee_role_id: 'er-2', truck_id: 'truck-1', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ta-3', trip_advise_id: 'trip-2', employee_id: 'emp-3', employee_role_id: 'er-1', truck_id: 'truck-4', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ta-4', trip_advise_id: 'trip-3', employee_id: 'emp-6', employee_role_id: 'er-1', truck_id: 'truck-2', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ta-5', trip_advise_id: 'trip-5', employee_id: 'emp-1', employee_role_id: 'er-1', truck_id: 'truck-1', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ta-6', trip_advise_id: 'trip-5', employee_id: 'emp-4', employee_role_id: 'er-2', truck_id: 'truck-1', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_EVENTS: TripEvent[] = [
  { id: 'event-1', trip_advise_id: 'trip-1', encoder_employee_id: 'emp-2', event_type: 'Loading_Arrival', event_timestamp: new Date().toISOString(), document_no: 'DOC-LOAD-01', remarks: 'Arrived at Manila terminal loading bay', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export const MOCK_TRIP_FUEL_LOGS: TripFuelLog[] = [
  { id: 'fuel-1', trip_advise_id: 'trip-1', encoder_employee_id: 'emp-2', fuel_ref_no: 'TX-FUEL-883', liters: 120.5, total_amount: 7200, logged_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const MOCK_USERS: SystemUser[] = [
  { id: 'user-1', id_legacy: 1, username: 'SuperAdmin', password: 'admin123', role: 'SuperAdmin', roles: ['SuperAdmin'], permissions: ['inventory', 'trip_scheduling', 'billing'], is_active: true },
  { id: 'user-2', id_legacy: 2, username: 'CebuAdmin', password: 'admin123', role: 'Admin', roles: ['Admin'], permissions: ['inventory', 'trip_scheduling', 'billing'], is_active: true },
  { id: 'user-3', id_legacy: 3, username: 'CebuDispatch', password: 'dispatcher123', role: 'Dispatcher', roles: ['Dispatcher'], permissions: ['trip_scheduling'], is_active: true },
  { id: 'user-4', id_legacy: 4, username: 'CebuEncoder', password: 'encoder123', role: 'Encoder', roles: ['Encoder'], permissions: ['trip_scheduling'], is_active: true },
  { id: 'user-5', id_legacy: 5, username: 'CebuViewer', password: 'viewer123', role: 'Viewer', roles: ['Viewer'], permissions: ['trip_scheduling'], is_active: true }
] as any;

// Active logged in user slot in mock memory
let CURRENT_SESSION_USER: SystemUser | null = MOCK_USERS[0];

// Audit log helper
const MOCK_AUDIT_LOGS: AuditLog[] = [];

export const MOCK_USER_ROLES: UserRole[] = [
  { id: 'ur-1', user_id: 'user-1', role_id: 'role-superadmin', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ur-2', user_id: 'user-2', role_id: 'role-admin', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ur-3', user_id: 'user-3', role_id: 'role-dispatcher', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ur-4', user_id: 'user-4', role_id: 'role-encoder', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ur-5', user_id: 'user-5', role_id: 'role-viewer', assigned_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Inventory placeholder store
export const MOCK_INVENTORY_STUBS: Inventory[] = [
  { id: 'inv-1', module_status: 'Placeholder', notes: 'Davao Container yard capacity stubs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Billing placeholder store
export const MOCK_BILLING_STUBS: Billing[] = [
  { id: 'bill-1', module_status: 'Placeholder', sample_source_trip_advise_id: 'trip-1', notes: 'Consolidated rates matrix billing stubs', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Adapter: resolve legacy aliases for TripAdvise
export function adaptTripAdvise(trip: TripAdvise, statuses: TripStatus[], loadTypes: LoadType[]): TripAdvise {
  const statusObj = statuses.find(s => s.id === trip.status_id);
  const loadTypeObj = loadTypes.find(l => l.id === trip.load_type_id);
  return {
    ...trip,
    trip_id: trip.id,
    trip_code: trip.trip_advise_code,
    customer_id: trip.client_id,
    status: (statusObj?.status_code ?? '') as any,
    load_type: (loadTypeObj?.load_type_code ?? '') as any,
  } as TripAdvise;
}

// Adapter: resolve legacy aliases for Employee
export function adaptEmployee(emp: Employee, employeeRoles: EmployeeRole[]): Employee {
  const roleObj = employeeRoles.find(r => r.id === emp.employee_role_id);
  return {
    ...emp,
    employee_id: emp.id,
    role: (roleObj?.role_code ?? '') as any,
  } as Employee;
}

// Adapter: resolve legacy aliases for Truck
export function adaptTruck(truck: Truck, truckStatuses: TruckStatus[]): Truck {
  const statusObj = truckStatuses.find(s => s.id === truck.truck_status_id);
  return {
    ...truck,
    truck_id: truck.id,
    license_plate: truck.plate_number,
    status: (statusObj?.truck_status_code ?? '') as any,
  } as Truck;
}


// --- EXPORTED API METRIC & CRUD OPERATIONS ---

export class ApiError extends Error {
  code: string;
  field_errors?: Record<string, string[]>;
  constructor(message: string, code: string = 'api_error', field_errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.field_errors = field_errors;
  }
}

const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- AUTH & RBAC ---

  // POST /api/v1/auth/login/
  login: async (username: string, password: string): Promise<SystemUser> => {
    await delay(120);
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (!user) {
      throw new ApiError('Invalid username or password.', 'authentication_failed', {
        username: ['Ensure this field is correct.'],
        password: ['Ensure this field is correct.']
      });
    }
    if (!user.is_active) {
      throw new ApiError('User account is deactivated.', 'user_inactive');
    }
    CURRENT_SESSION_USER = user;

    MOCK_AUDIT_LOGS.push({
      id: 'audit-' + Math.floor(Math.random() * 100000),
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'users',
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return JSON.parse(JSON.stringify(user));
  },

  // GET /api/v1/users/me/
  getCurrentUser: async (): Promise<SystemUser | null> => {
    await delay(60);
    return CURRENT_SESSION_USER ? JSON.parse(JSON.stringify(CURRENT_SESSION_USER)) : null;
  },

  // GET /api/v1/users/me/
  me: async (): Promise<SystemUser | null> => {
    return api.getCurrentUser();
  },

  // GET /api/v1/users/
  getUsers: async (): Promise<SystemUser[]> => {
    await delay(100);
    return JSON.parse(JSON.stringify(MOCK_USERS));
  },

  // POST /api/v1/users/
  createUser: async (user: any): Promise<SystemUser> => {
    await delay(150);
    if (!user.username) {
      throw new ApiError('Username is required.', 'validation_error', { username: ['This field is required.'] });
    }
    const uuid = 'user-' + Math.floor(Math.random() * 10000);
    const newUser = { 
      ...user, 
      id: uuid, 
      id_legacy: Math.floor(Math.random() * 1000),
      is_active: user.is_active !== false,
      roles: user.roles || [user.role || 'Viewer'],
      role: user.role || 'Viewer',
      permissions: user.permissions || ['trip_scheduling']
    };
    MOCK_USERS.push(newUser);

    MOCK_AUDIT_LOGS.push({
      id: 'audit-' + Math.floor(Math.random() * 100000),
      action: 'CREATE',
      table_name: 'users',
      record_id: uuid,
      new_values: newUser,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return JSON.parse(JSON.stringify(newUser));
  },

  // PATCH /api/v1/users/{id}/roles/
  updateUserRoles: async (userId: string, roles: string[]): Promise<SystemUser> => {
    await delay(150);
    const index = MOCK_USERS.findIndex(u => u.id === userId);
    if (index === -1) throw new ApiError('User not found.', 'not_found');
    if (roles && roles.length > 0) {
      MOCK_USERS[index].role = roles[0];
      MOCK_USERS[index].roles = roles;
    }
    return JSON.parse(JSON.stringify(MOCK_USERS[index]));
  },

  // DELETE /api/v1/users/{id}/
  deleteUser: async (id: string | number): Promise<void> => {
    await delay(100);
    const sId = String(id);
    const index = MOCK_USERS.findIndex(u => String(u.id) === sId || String((u as any).id_legacy) === sId);
    if (index !== -1) {
      MOCK_USERS.splice(index, 1);
    }
  },

  // GET /api/v1/dashboard/summary/
  getDashboardSummary: async () => {
    await delay(120);
    const totalTrips = MOCK_TRIP_ADVISES.filter(t => !t.is_deleted).length;
    const activeTrips = MOCK_TRIP_ADVISES.filter(t => !t.is_deleted && t.status_id === 'status-inprogress').length;
    const completedTrips = MOCK_TRIP_ADVISES.filter(t => !t.is_deleted && t.status_id === 'status-completed').length;
    const totalTrucks = MOCK_TRUCKS.filter(t => !t.is_deleted).length;
    const maintTrucks = MOCK_TRUCKS.filter(t => !t.is_deleted && t.truck_status_id === 'ts-maint').length;
    const activeDrivers = MOCK_DRIVERS.filter(d => !d.is_deleted && d.availability_status === 'Available').length;

    return {
      totalTrips,
      activeTrips,
      completedTrips,
      totalTrucks,
      maintTrucks,
      activeDrivers,
      recentAlertsCount: 2
    };
  },

  // --- TRIPS / TRIP ADVISE OPERATIONS ---

  // GET /api/v1/trip-advises/
  getTrips: async (filters?: any): Promise<Trip[]> => {
    await delay(100);
    let results = [...MOCK_TRIP_ADVISES];
    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        results = results.filter(t => 
          (t.trip_advise_code && t.trip_advise_code.toLowerCase().includes(query)) ||
          (t.trip_code && t.trip_code.toLowerCase().includes(query)) ||
          (t.remarks && t.remarks.toLowerCase().includes(query))
        );
      }
      if (filters.status_id && filters.status_id !== 'All') {
        results = results.filter(t => t.status_id === filters.status_id);
      }
      if (filters.branch_id && filters.branch_id !== 'All') {
        results = results.filter(t => t.branch_id === filters.branch_id);
      }
    }
    return JSON.parse(JSON.stringify(results));
  },

  // GET /api/v1/trip-advises/
  getTripAdvise: async (filters?: any): Promise<TripAdvise[]> => {
    return api.getTrips(filters);
  },

  // GET /api/v1/trip-advises/{id}/
  getTripAdviseById: async (id: string): Promise<TripAdvise | undefined> => {
    await delay(70);
    const trip = MOCK_TRIP_ADVISES.find(t => t.id === id && !t.is_deleted);
    return trip ? JSON.parse(JSON.stringify(trip)) : undefined;
  },

  // GET /api/v1/trip-advises/{id}/
  getTripById: async (id: string): Promise<Trip | undefined> => {
    return api.getTripAdviseById(id);
  },

  // POST /api/v1/trip-advises/
  createTrip: async (trip: any): Promise<TripAdvise> => {
    await delay(150);
    const uuid = 'trip-' + Math.floor(Math.random() * 10000);
    const codeNum = MOCK_TRIP_ADVISES.length + 1;
    const tripCode = `T-CEB-0${codeNum}`;

    const statusObj = MOCK_TRIP_STATUSES.find(s => s.id === trip.status_id) || MOCK_TRIP_STATUSES[0];
    const loadTypeObj = MOCK_LOAD_TYPES.find(l => l.id === trip.load_type_id) || MOCK_LOAD_TYPES[0];

    const currentOrigin = trip.origin_location_id || 'loc-2';
    const currentDest = trip.destination_location_id || 'loc-4';

    const newTrip: TripAdvise = {
      id: uuid,
      trip_advise_code: trip.trip_advise_code || trip.trip_code || tripCode,
      branch_id: trip.branch_id || 'branch-2',
      encoder_employee_id: trip.encoder_employee_id || 'emp-2',
      status_id: trip.status_id || 'status-sched',
      client_id: trip.client_id || 'client-3',
      internal_client_code_id: trip.internal_client_code_id || 'icc-3',
      consignee_id: trip.consignee_id || 'cons-3',
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
      net_weight: Number(trip.net_weight || 0),
      is_transfer: trip.is_transfer || false,
      remarks: trip.remarks || '',
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      trip_id: uuid as any,
      trip_code: trip.trip_advise_code || trip.trip_code || tripCode,
      customer_id: (trip.client_id || 'client-3') as any,
      origin_location_id: currentOrigin as any,
      destination_location_id: currentDest as any,
      scheduled_start_time: `${trip.pickup_date || new Date().toISOString().split('T')[0]}T08:00:00Z`,
      status: (statusObj?.status_code || 'Scheduled') as any,
      load_type: (loadTypeObj?.load_type_code || 'Dry') as any
    } as any;

    MOCK_TRIP_ADVISES.push(newTrip);

    MOCK_TRIP_STOPS.push({
      id: 'stop-' + Math.floor(Math.random() * 10000),
      trip_advise_id: uuid,
      stop_sequence: 1,
      stop_type: 'Pickup',
      location_id: currentOrigin,
      specific_address: 'Main Pick Point Address Cebu',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    MOCK_TRIP_STOPS.push({
      id: 'stop-' + Math.floor(Math.random() * 10000),
      trip_advise_id: uuid,
      stop_sequence: 2,
      stop_type: 'Dropoff',
      location_id: currentDest,
      specific_address: 'Final Destination Address Cebu',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    MOCK_AUDIT_LOGS.push({
      id: 'audit-' + Math.floor(Math.random() * 100000),
      action: 'CREATE',
      table_name: 'trip_advises',
      record_id: uuid,
      new_values: JSON.parse(JSON.stringify(newTrip)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return JSON.parse(JSON.stringify(newTrip));
  },

  // POST /api/v1/trip-advises/
  createTripAdvise: async (trip: any): Promise<TripAdvise> => {
    return api.createTrip(trip);
  },

  // PATCH /api/v1/trip-advises/{id}/
  updateTrip: async (id: string | number, trip: any): Promise<TripAdvise> => {
    await delay(120);
    const sId = String(id);
    const index = MOCK_TRIP_ADVISES.findIndex(t => String(t.id) === sId || String((t as any).trip_id) === sId);
    if (index === -1) throw new ApiError('Trip not found.', 'not_found');

    const prevValues = { ...MOCK_TRIP_ADVISES[index] };

    const updated = {
      ...MOCK_TRIP_ADVISES[index],
      ...trip,
      updated_at: new Date().toISOString()
    };

    if (trip.pickup_date) {
      updated.scheduled_start_time = `${trip.pickup_date}T08:00:00Z`;
    }
    if (trip.trip_advise_code || trip.trip_code) {
      updated.trip_code = trip.trip_advise_code || trip.trip_code;
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
      id: 'audit-' + Math.floor(Math.random() * 100000),
      action: 'UPDATE',
      table_name: 'trip_advises',
      record_id: sId,
      old_values: JSON.parse(JSON.stringify(prevValues)),
      new_values: JSON.parse(JSON.stringify(updated)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return JSON.parse(JSON.stringify(updated));
  },

  // PATCH /api/v1/trip-advises/{id}/
  updateTripAdvise: async (id: string | number, trip: any): Promise<TripAdvise> => {
    return api.updateTrip(id, trip);
  },

  // POST /api/v1/trip-advises/{id}/cancel/
  cancelTripAdvise: async (id: string | number): Promise<TripAdvise> => {
    return api.updateTrip(id, { status_id: 'status-cancelled' });
  },

  // DELETE /api/v1/trip-advises/{id}/
  deleteTrip: async (id: string | number): Promise<void> => {
    await delay(100);
    const sId = String(id);
    const index = MOCK_TRIP_ADVISES.findIndex(t => String(t.id) === sId || String((t as any).trip_id) === sId);
    if (index !== -1) {
      MOCK_TRIP_ADVISES[index].is_deleted = true;

      MOCK_AUDIT_LOGS.push({
        id: 'audit-' + Math.floor(Math.random() * 100000),
        action: 'DELETE',
        table_name: 'trip_advises',
        record_id: sId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  },

  // GET /api/v1/trip-advises/{id}/stops/
  getTripStops: async (tripAdviseId?: string): Promise<TripStop[]> => {
    await delay(80);
    if (tripAdviseId) {
      return JSON.parse(JSON.stringify(MOCK_TRIP_STOPS.filter(s => s.trip_advise_id === tripAdviseId)));
    }
    return JSON.parse(JSON.stringify(MOCK_TRIP_STOPS));
  },

  // POST /api/v1/trip-advises/{id}/stops/
  saveTripStops: async (tripAdviseId: string, stops: TripStop[]): Promise<TripStop[]> => {
    await delay(120);
    for (let i = MOCK_TRIP_STOPS.length - 1; i >= 0; i--) {
      if (MOCK_TRIP_STOPS[i].trip_advise_id === tripAdviseId) {
        MOCK_TRIP_STOPS.splice(i, 1);
      }
    }
    const savedStops: TripStop[] = stops.map((s, idx) => ({
      ...s,
      id: String(s.id).startsWith('temp-') ? 'stop-' + (Math.floor(Math.random() * 10000) + 1000) : s.id,
      trip_advise_id: tripAdviseId,
      stop_sequence: idx + 1,
      created_at: s.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    MOCK_TRIP_STOPS.push(...savedStops);
    return JSON.parse(JSON.stringify(savedStops));
  },

  // GET /api/v1/trip-assignments/
  getTripAssignments: async (tripAdviseId?: string): Promise<TripAssignment[]> => {
    await delay(70);
    if (tripAdviseId) {
      return JSON.parse(JSON.stringify(MOCK_TRIP_ASSIGNMENTS.filter(a => a.trip_advise_id === tripAdviseId)));
    }
    return JSON.parse(JSON.stringify(MOCK_TRIP_ASSIGNMENTS));
  },

  // GET /api/v1/trip-advises/{id}/events/
  getTripEvents: async (tripAdviseId?: string): Promise<TripEvent[]> => {
    await delay(80);
    if (tripAdviseId) {
      return JSON.parse(JSON.stringify(MOCK_TRIP_EVENTS.filter(e => e.trip_advise_id === tripAdviseId)));
    }
    return JSON.parse(JSON.stringify(MOCK_TRIP_EVENTS));
  },

  // GET /api/v1/driver-availability/
  getDriverAvailability: async (driverId?: string, date?: string): Promise<DriverAvailability[]> => {
    await delay(80);
    let results = [...MOCK_DRIVER_AVAILABILITY];
    if (driverId) results = results.filter(d => d.driver_id === driverId);
    if (date) results = results.filter(d => d.availability_date === date);
    return JSON.parse(JSON.stringify(results));
  },

  // PATCH /api/v1/driver-availability/{id}/
  updateDriverAvailability: async (id: string, da: Partial<DriverAvailability>): Promise<DriverAvailability> => {
    await delay(100);
    const index = MOCK_DRIVER_AVAILABILITY.findIndex(item => item.id === id);
    if (index === -1) throw new ApiError('Driver availability entry not found.', 'not_found');
    MOCK_DRIVER_AVAILABILITY[index] = {
      ...MOCK_DRIVER_AVAILABILITY[index],
      ...da,
      updated_at: new Date().toISOString()
    };
    return JSON.parse(JSON.stringify(MOCK_DRIVER_AVAILABILITY[index]));
  },

  // POST /api/v1/driver-availability/
  createDriverAvailability: async (da: any): Promise<DriverAvailability> => {
    await delay(100);
    const newDa: DriverAvailability = {
      id: 'da-' + Math.floor(Math.random() * 10000),
      driver_id: da.driver_id,
      availability_date: da.availability_date,
      status: da.status || 'Available',
      notes: da.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_DRIVER_AVAILABILITY.push(newDa);
    return JSON.parse(JSON.stringify(newDa));
  },

  // DELETE /api/v1/driver-availability/{id}/
  deleteDriverAvailability: async (id: string): Promise<void> => {
    await delay(70);
    const idx = MOCK_DRIVER_AVAILABILITY.findIndex(da => da.id === id);
    if (idx !== -1) {
      MOCK_DRIVER_AVAILABILITY.splice(idx, 1);
    }
  },

  // GET /api/v1/drivers/
  getDrivers: async (): Promise<Driver[]> => {
    await delay(80);
    return JSON.parse(JSON.stringify(MOCK_DRIVERS.filter(d => !d.is_deleted)));
  },

  // PATCH /api/v1/drivers/{id}/
  updateDriverProfile: async (idOrEmployeeId: string, profileData: Partial<Driver>): Promise<Driver> => {
    await delay(100);
    let driver = MOCK_DRIVERS.find(d => d.id === idOrEmployeeId || d.employee_id === idOrEmployeeId);
    if (!driver) {
      driver = {
        id: 'driver-' + Math.floor(Math.random() * 10000),
        employee_id: idOrEmployeeId,
        license_number: profileData.license_number || 'DL-GEN-999',
        license_expiry: profileData.license_expiry || '2030-01-01',
        availability_status: profileData.availability_status || 'Available',
        notes: profileData.notes || '',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      MOCK_DRIVERS.push(driver);
    } else {
      Object.assign(driver, {
        ...profileData,
        updated_at: new Date().toISOString()
      });
    }

    const empIndex = MOCK_EMPLOYEES.findIndex(e => e.id === driver!.employee_id);
    if (empIndex !== -1) {
      if (profileData.license_number) {
        MOCK_EMPLOYEES[empIndex].license_number = profileData.license_number;
      }
    }

    return JSON.parse(JSON.stringify(driver));
  },

  // --- EMPLOYEES DIRECTORY OPERATIONS ---

  // GET /api/v1/employees/
  getEmployees: async (filters?: any): Promise<Employee[]> => {
    await delay(100);
    let results = MOCK_EMPLOYEES.filter(e => !e.is_deleted);
    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        results = results.filter(e => 
          e.full_name.toLowerCase().includes(query) ||
          (e.contact_no && e.contact_no.toLowerCase().includes(query)) ||
          (e.email && e.email.toLowerCase().includes(query)) ||
          (e.license_number && e.license_number.toLowerCase().includes(query))
        );
      }
      if (filters.role_id && filters.role_id !== 'All') {
        results = results.filter(e => e.employee_role_id === filters.role_id);
      }
      if (filters.branch_id && filters.branch_id !== 'All') {
        results = results.filter(e => e.branch_id === filters.branch_id);
      }
      if (filters.is_active !== undefined) {
        results = results.filter(e => e.is_active === filters.is_active);
      }
    }
    return JSON.parse(JSON.stringify(results));
  },

  // POST /api/v1/employees/
  createEmployee: async (emp: any): Promise<Employee> => {
    await delay(120);
    const uuid = 'emp-' + Math.floor(Math.random() * 10000);
    const code = `EMP-0${MOCK_EMPLOYEES.length + 10}`;
    const newEmp: Employee = {
      id: uuid,
      employee_code: emp.employee_code || code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      full_name: `${emp.first_name} ${emp.last_name}`,
      employee_role_id: emp.employee_role_id || 'er-1',
      branch_id: emp.branch_id || 'branch-2',
      contact_no: emp.contact_no || '0917-X-FLIGHT',
      email: emp.email || `${emp.first_name.toLowerCase()}.${emp.last_name.toLowerCase()}@cloudy.ph`,
      employment_status: emp.employment_status || 'Active',
      is_active: true,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      employee_id: uuid as any,
      role: (MOCK_EMPLOYEE_ROLES.find(r => r.id === emp.employee_role_id)?.role_code || 'Helper') as any,
      license_number: emp.license_number
    } as any;

    MOCK_EMPLOYEES.push(newEmp);

    if (newEmp.employee_role_id === 'er-1') {
      MOCK_DRIVERS.push({
        id: 'driver-' + Math.floor(Math.random() * 10000),
        employee_id: uuid,
        license_number: emp.license_number || 'DL-GEN-999',
        license_expiry: emp.license_expiry || '2030-01-01',
        availability_status: 'Available',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return JSON.parse(JSON.stringify(newEmp));
  },

  // PATCH /api/v1/employees/{id}/
  updateEmployee: async (id: string, emp: any): Promise<Employee> => {
    await delay(110);
    const sId = String(id);
    const index = MOCK_EMPLOYEES.findIndex(e => String(e.id) === sId);
    if (index === -1) throw new ApiError('Employee not found.', 'not_found');
    MOCK_EMPLOYEES[index] = { ...MOCK_EMPLOYEES[index], ...emp, updated_at: new Date().toISOString() };
    return JSON.parse(JSON.stringify(MOCK_EMPLOYEES[index]));
  },

  // POST /api/v1/employees/{id}/deactivate/
  deactivateEmployee: async (id: string): Promise<void> => {
    await delay(100);
    const index = MOCK_EMPLOYEES.findIndex(e => e.id === id);
    if (index !== -1) {
      MOCK_EMPLOYEES[index].is_active = false;
      MOCK_EMPLOYEES[index].employment_status = 'Inactive';
    }
  },

  // DELETE /api/v1/employees/{id}/
  deleteEmployee: async (id: string | number): Promise<void> => {
    await delay(90);
    const sId = String(id);
    const index = MOCK_EMPLOYEES.findIndex(e => String(e.id) === sId || String((e as any).employee_id) === sId);
    if (index !== -1) {
      MOCK_EMPLOYEES[index].is_deleted = true;
      MOCK_EMPLOYEES[index].is_active = false;
    }
  },

  // --- TRUCKS / VEHICLE FLEET OPERATIONS ---

  // GET /api/v1/trucks/
  getTrucks: async (filters?: any): Promise<Truck[]> => {
    await delay(100);
    let results = MOCK_TRUCKS.filter(t => !t.is_deleted);
    if (filters) {
      if (filters.truck_status_id && filters.truck_status_id !== 'All') {
        results = results.filter(t => t.truck_status_id === filters.truck_status_id);
      }
      if (filters.branch_id && filters.branch_id !== 'All') {
        results = results.filter(t => t.branch_id === filters.branch_id);
      }
    }
    return JSON.parse(JSON.stringify(results));
  },

  // POST /api/v1/trucks/
  createTruck: async (truck: any): Promise<Truck> => {
    await delay(130);
    const uuid = 'truck-' + Math.floor(Math.random() * 10000);
    
    const newTruck: Truck = {
      id: uuid,
      plate_number: truck.plate_number || truck.license_plate,
      vin: truck.vin || `VIN-${Math.random().toString().slice(2, 10).toUpperCase()}`,
      truck_size: truck.truck_size || `${truck.tonner_capacity || 10}-Wheeler Cargo`,
      load_type_id: truck.load_type_id || 'load-dry',
      truck_status_id: truck.truck_status_id || 'ts-avail',
      registration_expiry: truck.registration_expiry || '2028-12-31',
      branch_id: truck.branch_id || 'branch-2',
      remarks: truck.remarks || '',
      is_active: true,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      truck_id: uuid as any,
      license_plate: truck.plate_number || truck.license_plate,
      tonner_capacity: truck.tonner_capacity || 15,
      status: (MOCK_TRUCK_STATUSES.find(s => s.id === truck.truck_status_id)?.truck_status_code || 'Available') as any
    } as any;

    MOCK_TRUCKS.push(newTruck);
    return JSON.parse(JSON.stringify(newTruck));
  },

  // PATCH /api/v1/trucks/{id}/
  updateTruck: async (id: string, truck: any): Promise<Truck> => {
    await delay(110);
    const sId = String(id);
    const index = MOCK_TRUCKS.findIndex(t => String(t.id) === sId);
    if (index === -1) throw new ApiError('Truck not found.', 'not_found');
    MOCK_TRUCKS[index] = { ...MOCK_TRUCKS[index], ...truck, updated_at: new Date().toISOString() };
    return JSON.parse(JSON.stringify(MOCK_TRUCKS[index]));
  },

  // POST /api/v1/trucks/{id}/status/
  updateTruckStatus: async (id: string, statusId: string): Promise<Truck> => {
    await delay(100);
    const sId = String(id);
    const index = MOCK_TRUCKS.findIndex(t => String(t.id) === sId);
    if (index === -1) throw new ApiError('Truck not found.', 'not_found');
    
    const oldStatusId = MOCK_TRUCKS[index].truck_status_id;
    MOCK_TRUCKS[index].truck_status_id = statusId;
    MOCK_TRUCKS[index].updated_at = new Date().toISOString();
    
    MOCK_VEHICLE_STATUS_LOGS.push({
      id: 'vsl-' + Math.floor(Math.random() * 10000),
      truck_id: sId,
      old_status_id: oldStatusId,
      new_status_id: statusId,
      changed_by_user_id: 'user-1',
      changed_at: new Date().toISOString(),
      reason: 'Status updated through dispatch console',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return JSON.parse(JSON.stringify(MOCK_TRUCKS[index]));
  },

  // DELETE /api/v1/trucks/{id}/
  deleteTruck: async (id: string | number): Promise<void> => {
    await delay(90);
    const sId = String(id);
    const index = MOCK_TRUCKS.findIndex(t => String(t.id) === sId || String((t as any).truck_id) === sId);
    if (index !== -1) {
      MOCK_TRUCKS[index].is_deleted = true;
    }
  },

  // GET /api/v1/trucks/{id}/maintenance-logs/
  getMaintenanceLogs: async (truckId?: string): Promise<MaintenanceLog[]> => {
    await delay(80);
    if (truckId) return JSON.parse(JSON.stringify(MOCK_MAINTENANCE_LOGS.filter(m => m.truck_id === truckId)));
    return JSON.parse(JSON.stringify(MOCK_MAINTENANCE_LOGS));
  },

  // GET /api/v1/trucks/{id}/status-logs/
  getVehicleStatusLogs: async (truckId?: string): Promise<VehicleStatusLog[]> => {
    await delay(80);
    if (truckId) return JSON.parse(JSON.stringify(MOCK_VEHICLE_STATUS_LOGS.filter(v => v.truck_id === truckId)));
    return JSON.parse(JSON.stringify(MOCK_VEHICLE_STATUS_LOGS));
  },

  // POST /api/v1/trucks/{id}/maintenance-logs/
  createMaintenanceLog: async (log: {
    truck_id: string;
    reported_by_user_id?: string;
    maintenance_type: string;
    status: string;
    scheduled_date?: string;
    completed_at?: string;
    cost_amount?: number;
    odometer?: number;
    vendor_mechanic?: string;
    notes?: string;
  }): Promise<MaintenanceLog> => {
    await delay(120);
    const uuid = 'm-' + Math.floor(Math.random() * 10000);
    const newLog: MaintenanceLog = {
      ...log,
      id: uuid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_MAINTENANCE_LOGS.push(newLog);
    return JSON.parse(JSON.stringify(newLog));
  },

  // --- LOOKUP / REFERENCE REFERENTIAL TABLES ---

  // GET /api/v1/customers/
  getCustomers: async (): Promise<Customer[]> => {
    await delay(70);
    return JSON.parse(JSON.stringify(MOCK_CLIENTS));
  },

  // GET /api/v1/locations/
  getLocations: async (): Promise<Location[]> => {
    await delay(80);
    const mapped = MOCK_LOCATIONS.filter(l => l.is_active).map(l => ({
      ...l,
      location_id: l.id as any,
      name: l.location_name,
      address_line_1: l.address_line_1 || ''
    } as any));
    return JSON.parse(JSON.stringify(mapped));
  },

  // GET /api/v1/fuel-logs/
  getFuelLogs: async (): Promise<TripFuel[]> => {
    await delay(80);
    const mapped = MOCK_TRIP_FUEL_LOGS.map(f => ({
      ...f,
      fuel_id: f.id as any,
      trip_id: f.trip_advise_id as any,
      encoder_id: f.encoder_employee_id as any,
    } as any));
    return JSON.parse(JSON.stringify(mapped));
  },

  // POST /api/v1/fuel-logs/
  createFuelLog: async (log: any): Promise<TripFuelLog> => {
    await delay(100);
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
    return JSON.parse(JSON.stringify(newLog));
  },

  // GET /api/v1/roles/
  getRoles: async (): Promise<Role[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(MOCK_ROLES));
  },

  // GET /api/v1/permissions/
  getPermissions: async (): Promise<Permission[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(MOCK_PERMISSIONS));
  },

  // GET /api/v1/branches/
  getBranches: async (): Promise<Branch[]> => {
    await delay(70);
    return JSON.parse(JSON.stringify(MOCK_BRANCHES.filter(b => b.is_active)));
  },

  // GET /api/v1/clients/
  getClients: async (): Promise<Client[]> => {
    await delay(70);
    return JSON.parse(JSON.stringify(MOCK_CLIENTS.filter(c => c.is_active)));
  },

  // GET /api/v1/consignees/
  getConsignees: async (clientId?: string): Promise<Consignee[]> => {
    await delay(70);
    let results = MOCK_CONSIGNEES.filter(c => c.is_active);
    if (clientId) {
      results = results.filter(c => c.client_id === clientId);
    }
    return JSON.parse(JSON.stringify(results));
  },

  // GET /api/v1/internal-client-codes/
  getInternalClientCodes: async (clientId?: string): Promise<InternalClientCode[]> => {
    await delay(75);
    if (clientId) {
      return JSON.parse(JSON.stringify(MOCK_INTERNAL_CLIENT_CODES.filter(c => c.client_id === clientId)));
    }
    return JSON.parse(JSON.stringify(MOCK_INTERNAL_CLIENT_CODES));
  },

  // GET /api/v1/load-types/
  getLoadTypes: async (): Promise<LoadType[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(MOCK_LOAD_TYPES));
  },

  // GET /api/v1/trip-statuses/
  getTripStatuses: async (): Promise<TripStatus[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(MOCK_TRIP_STATUSES));
  },

  // GET /api/v1/truck-statuses/
  getTruckStatuses: async (): Promise<TruckStatus[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(MOCK_TRUCK_STATUSES));
  },

  // GET /api/v1/employee-roles/
  getEmployeeRoles: async (): Promise<EmployeeRole[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(MOCK_EMPLOYEE_ROLES));
  },

  // GET /api/v1/user-roles/
  getUserRoles: async (userId?: string): Promise<UserRole[]> => {
    await delay(60);
    if (userId) return JSON.parse(JSON.stringify(MOCK_USER_ROLES.filter(ur => ur.user_id === userId)));
    return JSON.parse(JSON.stringify(MOCK_USER_ROLES));
  },

  // GET /api/v1/role-permissions/
  getRolePermissions: async (roleId?: string): Promise<RolePermission[]> => {
    await delay(60);
    if (roleId) return JSON.parse(JSON.stringify(MOCK_ROLE_PERMISSIONS.filter(rp => rp.role_id === roleId)));
    return JSON.parse(JSON.stringify(MOCK_ROLE_PERMISSIONS));
  },

  // GET /api/v1/settings/
  getAppSettings: async (): Promise<AppSetting[]> => {
    await delay(63);
    return JSON.parse(JSON.stringify(MOCK_APP_SETTINGS));
  },

  // PATCH /api/v1/settings/{id}/
  updateAppSetting: async (id: string, value: string): Promise<AppSetting> => {
    await delay(100);
    const index = MOCK_APP_SETTINGS.findIndex(s => s.id === id);
    if (index === -1) throw new ApiError('Setting not found.', 'not_found');
    MOCK_APP_SETTINGS[index] = { ...MOCK_APP_SETTINGS[index], setting_value: value, updated_at: new Date().toISOString() };
    return JSON.parse(JSON.stringify(MOCK_APP_SETTINGS[index]));
  }
};
