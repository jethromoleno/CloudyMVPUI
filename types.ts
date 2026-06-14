// Cloudy Hybrid Database Schema TypeScript Definitions

export type Theme = 'light' | 'dark';
export type UserRoleType = 'SuperAdmin' | 'Admin' | 'Dispatcher' | 'Encoder' | 'Viewer' | string;

// For backward compatibility
export type UserRoleLegacy = UserRoleType;

// 1. users
export interface User {
  id: string; // UUID Primary Key
  auth_user_id?: string; // UUID Nullable
  full_name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy Alias for User Management and Auth session state
export interface SystemUser {
  id: string;
  username: string;
  password?: string;
  role: string; // role code
  permissions: string[]; // module codes
}

// 2. roles
export interface Role {
  id: string; // UUID Primary Key
  role_code: string; // Unique, e.g. super_admin, dispatcher, encoder
  role_name: string; // Unique
  description?: string;
  created_at: string;
  updated_at: string;
}

// 3. permissions
export interface Permission {
  id: string; // UUID Primary Key
  permission_code: string; // Unique atomic permission, e.g. trips.create
  module_code: string; // Groups by app_modules.module_code
  description?: string;
  created_at: string;
  updated_at: string;
}

// 4. user_roles
export interface UserRole {
  id: string; // UUID
  user_id: string; // UUID FK -> users
  role_id: string; // UUID FK -> roles
  assigned_by_user_id?: string; // UUID FK -> users
  assigned_at: string;
  unique_user_role?: string;
  created_at: string;
  updated_at: string;
}

// For backward compatibility
export type UserRoleRecord = UserRole;

// 5. role_permissions
export interface RolePermission {
  id: string; // UUID
  role_id: string; // UUID FK -> roles
  permission_id: string; // UUID FK -> permissions
  unique_role_permission?: string;
  created_at: string;
  updated_at: string;
}

// 6. app_settings
export interface AppSetting {
  id: string; // UUID
  setting_key: string; // Unique
  setting_value: string;
  description?: string;
  updated_by_user_id?: string; // UUID FK -> users
  created_at: string;
  updated_at: string;
}

// 7. audit_logs
export interface AuditLog {
  id: string; // UUID
  user_id?: string; // UUID FK -> users
  action: string; // CREATE, UPDATE, DELETE, LOGIN
  table_name: string;
  record_id?: string; // UUID
  old_values?: any; // JSONB
  new_values?: any; // JSONB
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

// 8. app_modules
export interface AppModuleDefinition {
  id: string; // UUID
  module_code: string; // e.g. inventory, trip_scheduling, billing, settings
  label: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// For backward compatibility
export type AppModuleRecord = AppModuleDefinition;

export type AppModule = 'inventory' | 'trip_scheduling' | 'billing' | 'settings';

// 9. trip_advises
export interface TripAdvise {
  id: string; // UUID Primary Key
  trip_advise_code: string; // Business trip code
  branch_id?: string; // UUID FK -> branches
  encoder_employee_id: string; // UUID FK -> employees
  status_id: string; // UUID FK -> trip_statuses
  client_id: string; // UUID FK -> clients
  internal_client_code_id?: string; // UUID FK -> internal_client_codes
  consignee_id?: string; // UUID FK -> consignees
  pickup_date: string; // DATE format (YYYY-MM-DD)
  pickup_time_window?: string; // pickup time text window
  truck_size: string; // Planned size
  load_type_id: string; // UUID FK -> load_types
  truck_id?: string; // UUID FK -> trucks
  driver_id?: string; // UUID FK -> drivers (extension, not generic employee id)
  helper1_employee_id?: string; // UUID FK -> employees
  helper2_employee_id?: string; // UUID FK -> employees
  is_stripper_used: boolean;
  loading_ref_no?: string;
  net_weight?: number;
  is_transfer: boolean;
  transfer_from_id?: string; // UUID FK -> trip_advises
  completion_date?: string;
  remarks?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;

  // Legacy aliases for full backward compatibility
  trip_id?: string;
  trip_code?: string;
  customer_id?: string;
  origin_location_id?: string;
  destination_location_id?: string;
  scheduled_start_time?: string;
  status?: string;
  load_type?: string;
}

// Trip Advice mapping for full component backward compatibility
export type Trip = TripAdvise;

// 10. trip_stops
export interface TripStop {
  id: string; // UUID
  trip_advise_id: string; // UUID FK -> trip_advises
  stop_sequence: number; // Ordered sequence count
  stop_type: string; // Pickup, Dropoff, Other
  location_id?: string; // UUID FK -> locations
  specific_address?: string;
  scheduled_at?: string;
  actual_at?: string;
  created_at: string;
  updated_at: string;
}

// 11. trip_assignments
export interface TripAssignment {
  id: string; // UUID
  trip_advise_id: string; // UUID FK -> trip_advises
  employee_id: string; // UUID FK -> employees
  employee_role_id: string; // UUID FK -> employee_roles
  truck_id?: string; // UUID FK -> trucks
  assigned_at: string;
  released_at?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

// 12. driver_availability
export interface DriverAvailability {
  id: string; // UUID
  driver_id: string; // UUID FK -> drivers
  availability_date: string; // DATE
  status: string; // Available, Assigned, Leave, Suspended
  start_time?: string; // TIME
  end_time?: string; // TIME
  notes?: string;
  unique_driver_date?: string;
  created_at: string;
  updated_at: string;
}

// 13. trip_events
export interface TripEvent {
  id: string; // UUID Primary Key
  trip_advise_id: string; // UUID FK -> trip_advises
  encoder_employee_id: string; // UUID FK -> employees
  event_type: string; // Milestone description
  event_timestamp: string;
  document_no?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

// 14. trip_fuel_logs
export interface TripFuelLog {
  id: string; // UUID
  trip_advise_id: string; // UUID FK -> trip_advises
  encoder_employee_id: string; // UUID FK -> employees
  fuel_ref_no: string;
  liters: number;
  total_amount: number;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

// Legacy alias for fuel
export type TripFuel = TripFuelLog;

// 15. trip_statuses
export interface TripStatus {
  id: string; // UUID
  status_code: string; // UNIQUE e.g. Scheduled, In Transit, Completed, Cancelled
  label: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// For backward compatibility
export type TripStatusRecord = TripStatus;
export type TripStatusType = 'Scheduled' | 'In Transit' | 'Completed' | 'Cancelled' | 'Rescue' | 'Backload' | string;

// 16. load_types
export interface LoadType {
  id: string; // UUID
  load_type_code: string; // Dry, Chilled, Ref, Combi, etc.
  label: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 17. employees
export interface Employee {
  id: string; // UUID Primary Key
  user_id?: string; // UUID FK -> users
  employee_code?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_role_id: string; // UUID FK -> employee_roles
  contact_no?: string;
  employment_status: string; // Active, On Leave, Suspended, Terminated
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;

  // Legacy aliases for full backward compatibility
  employee_id?: string;
  role?: string;
  license_number?: string;
}

// 18. drivers (extension)
export interface DriverProfile {
  id: string; // UUID Primary Key
  employee_id: string; // UUID FK -> employees
  license_number?: string;
  license_expiry?: string; // DATE
  availability_status: string; // Available, Assigned, etc.
  notes?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// For backward compatibility
export type Driver = DriverProfile;

// 19. employee_roles
export interface EmployeeRole {
  id: string; // UUID Primary Key
  role_code: string; // Driver, Helper, Encoder, Dispatcher, Manager
  label: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// For backward compatibility
export type EmployeeRoleRecord = EmployeeRole;
export type EmployeeRoleType = 'Driver' | 'Helper' | 'Encoder' | 'Dispatcher' | string;

// 20. trucks
export interface Truck {
  id: string; // UUID Primary Key
  plate_number: string;
  vin?: string;
  truck_size: string; // capacity or category
  load_type_id?: string; // UUID FK -> load_types
  truck_status_id: string; // UUID FK -> truck_statuses
  registration_expiry?: string; // DATE
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;

  // Legacy aliases for full backward compatibility
  truck_id?: string;
  license_plate?: string;
  tonner_capacity?: number;
  status?: string;
}

// 21. truck_statuses
export interface TruckStatus {
  id: string; // UUID
  truck_status_code: string; // Available, In Use, Maintenance, Inactive
  label: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// For backward compatibility
export type TruckStatusRecord = TruckStatus;
export type TruckStatusType = 'Available' | 'In Use' | 'Maintenance' | string;

// 22. vehicle_status_logs
export interface VehicleStatusLog {
  id: string; // UUID
  truck_id: string; // UUID FK -> trucks
  old_status_id?: string; // UUID FK -> truck_statuses
  new_status_id: string; // UUID FK -> truck_statuses
  changed_by_user_id?: string; // UUID FK -> users
  changed_at: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

// 23. maintenance_logs
export interface MaintenanceLog {
  id: string; // UUID
  truck_id: string; // UUID FK -> trucks
  reported_by_user_id?: string; // UUID FK -> users
  maintenance_type: string; // Preventive, Repair, Inspection, Registration
  status: string; // Open, In Progress, Completed, Cancelled
  scheduled_date?: string; // DATE
  completed_at?: string;
  cost_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 24. branches
export interface Branch {
  id: string; // UUID Key
  branch_code: string;
  branch_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 25. clients (Equivalent of Customer)
export interface Client {
  id: string; // UUID Key
  client_code?: string;
  client_name: string;
  full_name?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Customer = Client; // Alias for backward compatibility

// 26. internal_client_codes
export interface InternalClientCode {
  id: string; // UUID
  client_id: string; // UUID FK -> clients
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 27. consignees
export interface Consignee {
  id: string; // UUID
  client_id: string; // UUID FK -> clients
  full_name: string;
  contact_no?: string;
  address?: string;
  city_area?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 28. locations
export interface Location {
  id: string; // UUID Primary Key
  location_name: string;
  location_type: string; // City, Warehouse, Hub, Province, Store, etc.
  province?: string;
  region?: string;
  address_line_1?: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Legacy aliases for full backward compatibility
  location_id?: string;
  name?: string;
  city?: string;
}

// 29. inventory
export interface Inventory {
  id: string; // UUID
  module_status: string; // "Placeholder"
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 30. billing
export interface Billing {
  id: string; // UUID
  module_status: string; // "Placeholder"
  sample_source_trip_advise_id?: string; // UUID FK -> trip_advises
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Helper interface for resolving Foreign Keys in UI
export interface EnrichedTrip extends TripAdvise {
  customer_name: string; // client name
  driver_name: string;
  truck_plate: string;
  origin_name: string;
  destination_name: string;
}
