# Cloudy Google AI Studio Prompt Pack

Use these prompts in Google AI Studio to evolve the current Cloudy UI from the exported app in `Google AI Studio/` into the PRD-aligned MVP. Apply them in order. Each prompt assumes the current app already has `App.tsx`, `types.ts`, `services/apiService.ts`, and components for Login, Hub, Dashboard, TripList, TruckList, EmployeeList, Sidebar, AppNavbar, and UserManagement.

## Prompt 0 - Global Context And Guardrails

```text
You are modifying an existing Vite React + TypeScript logistics web app called Cloudy.

Current app context:
- The app is a fleet/logistics MVP for a trucking company.
- Existing screens/components include Login, Hub, Sidebar, AppNavbar, Dashboard, TripList, TruckList, EmployeeList, and UserManagement.
- Existing data is currently mocked in services/apiService.ts.
- Existing domain types are in types.ts.
- The active MVP module is Trip Scheduling.
- Inventory and Billing must remain visible as hub modules, but they are placeholders only and must not be implemented.

Target stack alignment:
- Frontend: React + TypeScript
- Backend target: Django REST Framework, later exposed through /api/v1/
- Database target: Supabase PostgreSQL
- Auth target: Supabase Auth JWT, but keep mock auth usable until backend integration exists.

Final hybrid schema tables to align the frontend model with:
users, roles, permissions, user_roles, role_permissions, app_settings, audit_logs, app_modules,
trip_advises, trip_stops, trip_assignments, driver_availability, trip_events, trip_fuel_logs,
trip_statuses, load_types, employees, drivers, employee_roles, trucks, truck_statuses,
vehicle_status_logs, maintenance_logs, branches, clients, internal_client_codes, consignees,
locations, inventory, billing.

MVP scope:
- Implement UI for Login, Hub, Dashboard, Trip Management, Trip Schedule/create-edit trip advice, Truck Management, Employee Directory, and Settings/RBAC.
- Keep Inventory and Billing as disabled or "Coming soon" placeholders.
- Do not add real backend calls yet. Keep apiService.ts mock-backed, but design function names and payloads to map cleanly to future Django REST endpoints.

Do not remove existing working features unless replacing them with a PRD-aligned equivalent.
Keep the UI operational after every change.
Use clean TypeScript interfaces and avoid any implicit any types.
Prefer compact operational UI over marketing-style layouts.
Every list screen must include loading, empty, and error states.
Every destructive action must require confirmation.
```

## Prompt 1 - Align TypeScript Schema With Hybrid Database

```text
Update the current Cloudy frontend schema in types.ts and the mock data in services/apiService.ts to match the hybrid database direction.

Required changes:
1. Replace the simplified role model:
   - Current: SuperAdmin, Admin, User
   - Target: SuperAdmin, Admin, Dispatcher, Encoder, Viewer

2. Keep app modules:
   - inventory
   - trip_scheduling
   - billing

3. Add or refine TypeScript interfaces for these frontend models:
   - User
   - Role
   - Permission
   - UserRole
   - RolePermission
   - AppModuleDefinition
   - AppSetting
   - AuditLog
   - Branch
   - Client
   - InternalClientCode
   - Consignee
   - Location
   - Employee
   - DriverProfile
   - EmployeeRole
   - Truck
   - TruckStatus
   - VehicleStatusLog
   - MaintenanceLog
   - TripAdvise
   - TripStop
   - TripAssignment
   - DriverAvailability
   - TripEvent
   - TripFuelLog
   - TripStatus
   - LoadType

4. Use frontend-friendly IDs for mock data but name fields close to backend schema:
   - id
   - created_at
   - updated_at
   - is_deleted where applicable
   - created_by and updated_by on user-editable records where useful

5. Preserve compatibility with the existing UI by adding adapter/helper functions if needed instead of breaking every component at once.

6. Seed mock data for:
   - 5 users across the target roles
   - 3 branches
   - at least 5 employees, including drivers, helpers, dispatchers, and encoders
   - at least 4 trucks with varied statuses
   - trip statuses: Scheduled, In Progress, Completed, Cancelled, Rescue, Backload
   - load types: Dry, Chilled, Ref, Combi
   - at least 5 trip_advises with realistic Cebu logistics sample data
   - trip_stops for each trip
   - trip_assignments for assigned trips
   - driver_availability rows
   - maintenance_logs and vehicle_status_logs

7. Keep apiService.ts mock-backed, but expose future-ready methods:
   - login
   - getCurrentUser
   - getDashboardSummary
   - getTripAdvise
   - getTripAdviseById
   - createTripAdvise
   - updateTripAdvise
   - cancelTripAdvise
   - getTripStops
   - getTripAssignments
   - getDriverAvailability
   - getEmployees
   - createEmployee
   - updateEmployee
   - deactivateEmployee
   - getTrucks
   - createTruck
   - updateTruck
   - updateTruckStatus
   - getMaintenanceLogs
   - getUsers
   - createUser
   - updateUserRoles

Acceptance criteria:
- The app compiles.
- Existing screens still render.
- TypeScript has no implicit any errors.
- Inventory and Billing remain placeholder modules only.
```

## Prompt 2 - Rework Hub, Navigation, And Role-Based Visibility

```text
Rework Cloudy's Hub, Sidebar, AppNavbar, and route/view switching to match the PRD module structure.

Required user flow:
1. User logs in.
2. User lands on the Hub.
3. Hub shows three modules:
   - Trip Scheduling: active
   - Inventory Management: placeholder / coming soon
   - Billing System: placeholder / coming soon
4. Selecting Trip Scheduling opens the operational workspace with these views:
   - Dashboard
   - Trip Management
   - Trip Schedule
   - Truck Management
   - Employee Directory
   - Settings

Role-based visibility:
- SuperAdmin: all views including Settings user management.
- Admin: all operational views, settings read-only or limited config, no user creation.
- Dispatcher: Dashboard, Trip Management, Trip Schedule, Truck Management, Employee Directory read.
- Encoder: Dashboard, Trip Management read/update allowed fields, Trip Schedule create only.
- Viewer: read-only Dashboard, Trip Management, Truck Management, Employee Directory.

UI requirements:
- Keep a compact logistics operations layout.
- Use clear active states for current module and current view.
- Disabled Inventory and Billing modules must be visually obvious but still present.
- If a user attempts to access a restricted view, show a simple "Access restricted" state inside the content area.
- Do not create a marketing landing page.

Acceptance criteria:
- All target roles can log in from mock users.
- Visible navigation changes by role.
- The app never shows User Management actions to non-SuperAdmin users.
- Inventory and Billing do not expose CRUD screens.
```

## Prompt 3 - Dashboard MVP

```text
Build or refine the Trip Scheduling Dashboard for Cloudy.

Data sources:
- trip_advises
- trip_stops
- trip_assignments
- trucks
- truck_statuses
- driver_availability
- trip_fuel_logs
- employees

Dashboard content:
1. KPI strip:
   - Trips today
   - Scheduled trips
   - In-progress trips
   - Completed trips this week
   - Available trucks
   - Available drivers

2. Recent trips table:
   - Trip advice code
   - Client
   - Pickup date/time
   - Truck
   - Driver
   - Status
   - Next stop or route summary

3. Vehicle availability snapshot:
   - Available
   - In Use
   - Maintenance
   - Inactive

4. Driver availability snapshot:
   - Available
   - Assigned
   - Unavailable
   - On Leave

5. Operational alerts:
   - Trips still Scheduled but pickup time has passed
   - Trucks in Maintenance
   - Drivers with license expiry within 30 days if license expiry exists in mock data

UI requirements:
- Use compact cards or panels, but do not nest cards inside cards.
- Use status badges with distinct colors for trip and truck statuses.
- Include empty, loading, and error states.
- Clicking a recent trip should open or focus the Trip Management detail/edit flow if that exists.

Acceptance criteria:
- Dashboard summary is derived from mock data, not hardcoded UI numbers.
- All KPIs update if mock data changes.
- Dashboard remains readable on laptop and tablet widths.
```

## Prompt 4 - Trip Management List And Detail

```text
Refine the Trip Management screen for Cloudy.

Purpose:
Trip Management is for viewing, filtering, searching, and updating existing trip advice records.

Required table columns:
- Trip advice code
- Status
- Client
- Internal client code
- Consignee
- Pickup date/time
- Truck size
- Truck plate
- Driver
- Helper(s)
- Load type
- Transfer flag
- Net weight
- Route summary
- Last updated

Required filters:
- Search by trip advice code, client, consignee, truck plate, driver name
- Status
- Pickup date range
- Branch
- Load type
- Truck
- Driver
- Transfer only

Required row actions:
- View details
- Edit trip
- Update status
- Cancel trip, with confirmation
- View stops
- View event history

Detail panel or modal:
- Show trip header
- Show assignment details
- Show ordered pickup/drop stops
- Show event history
- Show fuel logs if present
- Show audit metadata where available

Business rules to represent in the UI:
- Cancelled trips should be visually distinct and not editable except notes/status history.
- Completed trips should be read-only by default.
- If a trip has no stops, show a warning state.
- If truck or driver assignment conflicts with another trip on the same pickup date, show a conflict warning.

Acceptance criteria:
- All filters work against mock data.
- Status badges match the allowed trip statuses.
- Destructive cancel action requires confirmation.
- Detail view does not require navigating away from the list.
```

## Prompt 5 - Trip Schedule Create/Edit Form

```text
Create or refine the Trip Schedule screen for creating and editing trip advice records.

Purpose:
Dispatchers and encoders create a trip advice, assign available driver/helper/truck, and define pickup/drop stops.

Required form sections:
1. Trip identity
   - Trip advice code
   - Branch
   - Client
   - Internal client code
   - Consignee
   - Pickup date/time
   - Status, default Scheduled

2. Assignment
   - Truck size
   - Truck
   - Driver
   - Helper 1
   - Helper 2
   - Load type

3. Route/stops
   - Dynamic ordered stops
   - Each stop has stop type Pickup/Drop, location, specific site name, city/area, notes
   - Add stop
   - Remove stop with confirmation
   - Reorder stops

4. Cargo and references
   - Loading reference number
   - Net weight
   - Transfer status
   - Transfer source trip if transfer status is true
   - Remarks

Validation rules:
- Trip advice code is required and unique in mock data.
- Client is required.
- Pickup date/time is required.
- Truck is required.
- Driver is required.
- At least one Pickup stop and one Drop stop are required.
- Driver and truck cannot be double-booked for overlapping Scheduled/In Progress trips on the same pickup date.
- Helper cannot be the same employee as the driver.
- Helper 1 and Helper 2 cannot be the same employee.
- Net weight cannot be negative.

UX requirements:
- Show available/unavailable labels in driver and truck dropdowns.
- Disable unavailable drivers/trucks but show why they are unavailable.
- Show inline validation errors.
- Include Save Draft, Schedule Trip, and Cancel buttons.
- After save, update the mock data and return to Trip Management or show the saved trip detail.

Acceptance criteria:
- New trip records appear in Trip Management and Dashboard.
- Stops are saved with sequence numbers.
- Conflict warnings work using current mock data.
- Form remains usable on laptop and tablet widths.
```

## Prompt 6 - Truck Management MVP

```text
Refine Truck Management for Cloudy.

Required features:
- List all trucks.
- Add truck.
- Edit truck.
- Update truck status.
- Soft deactivate truck instead of hard delete.
- View maintenance history.
- Add maintenance log.
- View vehicle status log.

Required truck fields:
- Plate number
- VIN
- Truck size / tonner capacity
- Load type capability if available
- Current status
- Registration expiry
- Branch
- Active flag
- Remarks

Required filters:
- Search by plate number or VIN
- Status
- Branch
- Truck size
- Registration expiring within 30 days

Business rules:
- A truck assigned to an In Progress trip cannot be deactivated.
- A truck in Maintenance cannot be selected for new trip scheduling.
- Status changes must create a vehicle status log entry in mock data.
- Maintenance log entries must include maintenance type, date, odometer if available, cost if available, vendor/mechanic, and notes.

UX requirements:
- Use clear truck status badges.
- Confirm deactivation.
- Show an empty state if no trucks match filters.
- Keep layout dense and operations-focused.

Acceptance criteria:
- Truck status changes update Dashboard availability counts.
- Maintenance logs can be added and viewed from the truck detail panel.
- Deactivated trucks are hidden from assignment dropdowns by default.
```

## Prompt 7 - Employee Directory And Driver Availability

```text
Refine Employee Directory for Cloudy.

Required features:
- List employees.
- Add employee.
- Edit employee.
- Soft deactivate employee.
- View driver profile for employees with Driver role.
- Manage driver availability rows.

Required employee fields:
- First name
- Last name
- Employee role: Driver, Helper, Dispatcher, Encoder, Admin Staff
- Phone
- Email
- Branch
- Active flag
- Created/updated metadata where available

Driver-specific fields:
- License number
- License expiry date
- Availability status
- Restrictions or notes

Required filters:
- Search by employee name, phone, email, license number
- Role
- Branch
- Active/inactive
- Driver availability status
- License expiring within 30 days

Business rules:
- A driver assigned to an In Progress trip cannot be deactivated.
- Inactive employees cannot appear in new trip assignment dropdowns.
- Drivers with expired licenses must be disabled in trip assignment dropdowns.
- Driver availability updates must affect Trip Schedule dropdowns and Dashboard driver counts.

UX requirements:
- Use role/status badges.
- Confirm deactivation.
- Include empty, loading, and error states.
- Keep all forms inline in modal or side panel; do not create a marketing page.

Acceptance criteria:
- Employee changes update assignment dropdowns.
- Driver availability changes update Dashboard.
- License expiry warning is visible for affected drivers.
```

## Prompt 8 - Settings And RBAC

```text
Refine Settings for Cloudy with a SuperAdmin-focused RBAC interface.

Required sections:
1. Users
   - List users
   - Create user
   - Activate/deactivate user
   - Assign one or more roles
   - View module permissions

2. Roles
   - Display roles: SuperAdmin, Admin, Dispatcher, Encoder, Viewer
   - Show role descriptions
   - Show assigned permissions
   - Keep role editing disabled unless you can implement it cleanly in mock data

3. App modules
   - Trip Scheduling active
   - Inventory placeholder
   - Billing placeholder

4. App settings
   - App timezone, default Asia/Manila
   - Default branch
   - Session timeout display
   - Operational thresholds like pending trip alert hours

Permission matrix:
- SuperAdmin: full access, including users and settings.
- Admin: all operational modules, no user creation.
- Dispatcher: create/update trip schedule, truck management update, employee read.
- Encoder: create trip advice, update limited trip fields, read core lists.
- Viewer: read-only.

UX requirements:
- Non-SuperAdmin users must not see user creation controls.
- Show a read-only permission matrix for transparency.
- Include confirmation before deactivating a user.
- Do not expose Inventory or Billing CRUD settings beyond placeholder module status.

Acceptance criteria:
- Mock users can be created by SuperAdmin.
- Role assignment changes affect visible navigation/actions immediately.
- Viewer role cannot mutate data.
```

## Prompt 9 - Future Backend API Contract Shape

```text
Refactor services/apiService.ts so the mock service mirrors the future Django REST API contract while still using local mock arrays.

Base API convention to model in method names and comments:
- /api/v1/

Target endpoints to mirror:
- POST /api/v1/auth/login/
- GET /api/v1/users/me/
- GET /api/v1/dashboard/summary/
- GET /api/v1/trip-advises/
- POST /api/v1/trip-advises/
- GET /api/v1/trip-advises/{id}/
- PATCH /api/v1/trip-advises/{id}/
- POST /api/v1/trip-advises/{id}/cancel/
- GET /api/v1/trip-advises/{id}/stops/
- GET /api/v1/trip-advises/{id}/events/
- GET /api/v1/trucks/
- POST /api/v1/trucks/
- PATCH /api/v1/trucks/{id}/
- POST /api/v1/trucks/{id}/status/
- GET /api/v1/trucks/{id}/maintenance-logs/
- POST /api/v1/trucks/{id}/maintenance-logs/
- GET /api/v1/employees/
- POST /api/v1/employees/
- PATCH /api/v1/employees/{id}/
- POST /api/v1/employees/{id}/deactivate/
- GET /api/v1/driver-availability/
- PATCH /api/v1/driver-availability/{id}/
- GET /api/v1/settings/
- PATCH /api/v1/settings/{id}/
- GET /api/v1/roles/
- GET /api/v1/permissions/

Standardize mock service responses:
- Return Promises.
- Simulate loading latency with a small delay helper.
- Throw typed errors with code, message, and optional field errors.
- Support pagination/filter parameters for list methods.
- Keep all mutations immutable from the component perspective.

Acceptance criteria:
- Components consume apiService methods rather than directly importing mock arrays.
- Every list screen can pass filters into apiService.
- The service can later be swapped with real fetch/axios calls without changing component props heavily.
```

## Prompt 10 - UI States, Responsiveness, And Polish Pass

```text
Perform a final UI quality pass across the Cloudy app.

Required global improvements:
- Add consistent LoadingState, EmptyState, ErrorState, ConfirmDialog, StatusBadge, DataTable, FormField, and PageHeader reusable components if they do not already exist.
- Ensure all tables have readable column alignment, sticky headers where practical, and no text overlap.
- Ensure all forms have inline validation messages and consistent spacing.
- Ensure all buttons have clear labels and disabled states.
- Ensure all destructive actions use ConfirmDialog.
- Ensure role-restricted actions are hidden or disabled with a clear reason.
- Ensure Inventory and Billing are visibly "Coming soon" and cannot be entered as active CRUD modules.

Responsive targets:
- Desktop/laptop width: dense operations dashboard with sidebar.
- Tablet width: sidebar can collapse or remain compact.
- Mobile width: basic usability is acceptable, but no text should overlap or overflow buttons/cards.

Design direction:
- Professional logistics operations tool.
- Avoid landing-page hero sections.
- Avoid decorative gradient blobs or marketing copy.
- Use status colors purposefully:
  - Green for available/completed/success.
  - Blue for scheduled/info.
  - Amber for pending/warning/maintenance.
  - Red for cancelled/blocked/errors.
  - Gray for inactive/read-only.

Acceptance criteria:
- No screen is blank.
- No visible text overlaps.
- Empty/error/loading states exist for Dashboard, Trip Management, Trip Schedule, Truck Management, Employee Directory, and Settings.
- The app compiles without TypeScript errors.
```

## Optional All-In-One Prompt

Use this only if you want AI Studio to attempt the full update in one pass. The step-by-step prompts above are safer.

```text
Using the existing Cloudy Vite React + TypeScript app, update the UI and frontend schema to match the Cloudy Logistics Web App MVP PRD direction.

The MVP is a fleet/trucking logistics operations app. It has Login, a Hub with Trip Scheduling active plus Inventory and Billing placeholders, and a Trip Scheduling workspace with Dashboard, Trip Management, Trip Schedule, Truck Management, Employee Directory, and Settings/RBAC.

Align the frontend model with these hybrid schema tables:
users, roles, permissions, user_roles, role_permissions, app_settings, audit_logs, app_modules,
trip_advises, trip_stops, trip_assignments, driver_availability, trip_events, trip_fuel_logs,
trip_statuses, load_types, employees, drivers, employee_roles, trucks, truck_statuses,
vehicle_status_logs, maintenance_logs, branches, clients, internal_client_codes, consignees,
locations, inventory, billing.

Update types.ts and services/apiService.ts with future-backend-ready TypeScript interfaces and mock service methods. Keep data mocked for now but design methods around future /api/v1/ Django REST endpoints. Implement role-based UI visibility for SuperAdmin, Admin, Dispatcher, Encoder, and Viewer. SuperAdmin can manage users and roles; Viewer is read-only; Inventory and Billing remain non-implemented placeholders.

Feature requirements:
- Dashboard with derived KPIs, recent trips, truck availability, driver availability, and alerts.
- Trip Management with search, filters, detail panel, status update, cancel confirmation, stops/events/fuel visibility.
- Trip Schedule create/edit form with client, consignee, pickup date, branch, truck, driver, helpers, load type, transfer flag, net weight, remarks, and dynamic ordered pickup/drop stops.
- Double-booking warnings for truck/driver conflicts.
- Truck Management with add/edit/status update/deactivate, maintenance logs, vehicle status logs.
- Employee Directory with add/edit/deactivate, driver profile, license expiry warning, and driver availability.
- Settings/RBAC with users, roles, permission matrix, app modules, and app settings.

UI requirements:
- Compact professional logistics operations interface.
- No marketing landing page.
- Loading, empty, and error states on every major screen.
- Confirmation for destructive actions.
- No text overlap at desktop, tablet, or mobile widths.
- TypeScript must compile without implicit any errors.
```
