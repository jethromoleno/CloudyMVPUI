import React, { useState, useEffect } from 'react';
import { Employee, Trip, DriverProfile, DriverAvailability } from '../types';
import { services, type EmployeeMutationInput } from '../services';
import { permissionActions, permissionResources, usePermissions } from '../permissions';
import { statusToneClasses } from '../design/statusTokens';
import { uiClasses } from '../design/tokens';
import { Button, FormField, Modal, SearchInput, StatusBadge } from './ui';
import {
  Plus,
  Edit2,
  X,
  User,
  IdCard,
  AlertTriangle,
  Loader2,
  SlidersHorizontal,
  Phone,
  Mail,
  RotateCcw,
  ShieldAlert,
  Info,
} from 'lucide-react';

// Role tone reuses the shared status palette so personnel roles stay on brand
// tokens instead of one-off decorative colors.
const roleToneClasses = (employee: Employee) =>
  employee.employee_role_id === 'er-1'
    ? statusToneClasses.info
    : employee.employee_role_id === 'er-2'
      ? statusToneClasses.warning
      : statusToneClasses.neutral;

interface EmployeeListProps {
  employees: Employee[];
  trips: Trip[];
  onAdd: (employee: EmployeeMutationInput) => Promise<void>;
  onUpdate?: (id: string, employee: EmployeeMutationInput) => Promise<void>;
  onDeactivate: (id: string, reason: string) => Promise<void>;
  onReactivate: (id: string, reason: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  theme: 'light' | 'dark';
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  trips,
  onAdd,
  onUpdate,
  onDeactivate,
  onReactivate,
  isLoading = false,
  error = null,
  theme,
}) => {
  const permissions = usePermissions();
  const canCreateEmployee = permissions.can(permissionActions.create, permissionResources.employees);
  const canUpdateEmployee = permissions.can(permissionActions.update, permissionResources.employees);
  const canDeactivateEmployee = permissions.can(permissionActions.deactivate, permissionResources.employees);
  const canReactivateEmployee = permissions.can(permissionActions.reactivate, permissionResources.employees);
  const [branchesState, setBranchesState] = useState<any[]>([]);
  const [employeeRolesState, setEmployeeRolesState] = useState<any[]>([]);
  const [driversState, setDriversState] = useState<any[]>([]);
  const [driverAvailabilityState, setDriverAvailabilityState] = useState<any[]>([]);

  const loadEmployeeResources = async () => {
    try {
      const [br, er, dr, da] = await Promise.all([
        services.data.getBranches(),
        services.data.getEmployeeRoles(),
        services.data.getDrivers(),
        services.data.getDriverAvailability(),
      ]);
      setBranchesState(br);
      setEmployeeRolesState(er);
      setDriversState(dr);
      setDriverAvailabilityState(da);
    } catch (err) {
      console.error('Error loading resources in EmployeeList:', err);
    }
  };

  useEffect(() => {
    loadEmployeeResources();
  }, [employees]);

  const MOCK_BRANCHES = branchesState;
  const MOCK_EMPLOYEE_ROLES = employeeRolesState;
  const MOCK_DRIVERS = driversState;
  const MOCK_DRIVER_AVAILABILITY = driverAvailabilityState;

  // --- Selected Employee State for Detail Overlay ---
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // --- Modals State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [lifecycleAction, setLifecycleAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // --- Filters State ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [expiringLicenseOnly, setExpiringLicenseOnly] = useState(false);

  // --- Driver state ---
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [availabilityRows, setAvailabilityRows] = useState<DriverAvailability[]>([]);

  // --- Form Local State ---
  const initialFormState = {
    first_name: '',
    last_name: '',
    employee_role_id: 'er-1', // Default 'er-1' = Driver
    contact_no: '',
    email: '',
    employment_status: 'Active',
    is_active: true,
    // Driver exception fields inside modal
    license_number: '',
    license_expiry: '2029-12-31',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Driver Availability Override Inline Form State ---
  const [newAvailDate, setNewAvailDate] = useState('2026-06-15');
  const [newAvailStatus, setNewAvailStatus] = useState('Available');
  const [newAvailNotes, setNewAvailNotes] = useState('');
  const [showAddAvailBlock, setShowAddAvailBlock] = useState(false);

  // Load Driver profile information
  const loadDriversData = async () => {
    try {
      const d = await services.data.getDrivers();
      setDrivers(d);
      const da = await services.data.getDriverAvailability();
      setAvailabilityRows(da);
    } catch (err) {
      console.error('Failed to sync driver profiles:', err);
    }
  };

  useEffect(() => {
    loadDriversData();
  }, [employees]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const selectedDriverProfile = selectedEmployee ? drivers.find((d) => d.employee_id === selectedEmployee.id) : null;
  const selectedDriverAvailability = selectedDriverProfile
    ? availabilityRows.filter((r) => r.driver_id === selectedDriverProfile.id)
    : [];

  // --- TIME HELPERS ---
  const benchmarkDate = new Date('2026-06-15');

  const checkLicenseExpiringIn30Days = (expiryStr?: string) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    const diffTime = expiry.getTime() - benchmarkDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const checkLicenseExpired = (expiryStr?: string) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    return expiry < benchmarkDate;
  };

  // --- BUSINESS RULES ---
  // A driver assigned to an "In Progress" trip cannot be deactivated.
  const isDriverAssignedToActiveTrip = (employeeId: string) => {
    const dProf = drivers.find((p) => p.employee_id === employeeId || p.id === employeeId);
    const driverId = dProf?.id;

    return trips.some((t) => {
      const isTripInProgress =
        !t.is_deleted &&
        (t.status === 'In Progress' || t.status === 'In Transit' || t.status_id === 'status-inprogress');
      if (!isTripInProgress) return false;
      return t.driver_id === employeeId || (driverId && t.driver_id === driverId);
    });
  };

  const selectedEmployeeActiveTrip = selectedEmployee ? isDriverAssignedToActiveTrip(selectedEmployee.id) : false;
  const deactivatePresentation = permissions.present(permissionActions.deactivate, permissionResources.employees, {
    blockedReason: selectedEmployeeActiveTrip
      ? 'Deactivation is blocked while this employee is assigned to an active trip.'
      : null,
  });
  const reactivatePresentation = permissions.present(permissionActions.reactivate, permissionResources.employees);

  // --- EVENT HANDLERS ---
  const handleOpenModal = (employee?: Employee) => {
    setAlertMessage(null);
    if ((employee && !canUpdateEmployee) || (!employee && !canCreateEmployee)) return;
    if (employee) {
      setEditingId(employee.id);
      const dProf = drivers.find((p) => p.employee_id === employee.id);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        employee_role_id: employee.employee_role_id || 'er-1',
        contact_no: employee.contact_no || '',
        email: employee.email || '',
        employment_status: employee.employment_status || 'Active',
        is_active: employee.is_active !== false,
        // Driver details
        license_number: dProf?.license_number || '',
        license_expiry: dProf?.license_expiry || '2029-12-31',
        availability_status: dProf?.availability_status || 'Available',
        notes: dProf?.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);
    if ((editingId && !canUpdateEmployee) || (!editingId && !canCreateEmployee)) return;

    const isDriverForm = formData.employee_role_id === 'er-1';

    // Validate email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    const roleById: Record<string, EmployeeMutationInput['role']> = {
      'er-1': 'DRIVER',
      'er-2': 'HELPER',
      'er-3': 'ENCODER',
      'er-4': 'DISPATCHER',
      'er-5': 'MANAGER',
    };
    const employmentByLabel: Record<string, EmployeeMutationInput['employmentState']> = {
      Active: 'ACTIVE',
      'On Leave': 'ON_LEAVE',
      Suspended: 'SUSPENDED',
    };
    const dataToSubmit: EmployeeMutationInput = {
      firstName: formData.first_name,
      lastName: formData.last_name,
      role: roleById[formData.employee_role_id] ?? 'HELPER',
      contactNo: formData.contact_no,
      email: formData.email,
      employmentState: employmentByLabel[formData.employment_status] ?? 'ACTIVE',
      driver: isDriverForm
        ? {
            licenseNumber: formData.license_number,
            licenseExpiry: formData.license_expiry,
            notes: formData.notes || null,
          }
        : undefined,
    };

    try {
      if (editingId) {
        if (onUpdate) {
          await onUpdate(editingId, dataToSubmit);
        }

        setAlertMessage({ type: 'success', text: 'Personnel record updated successfully.' });
      } else {
        // 1. Enroll new Employee
        await onAdd(dataToSubmit);
        setAlertMessage({ type: 'success', text: 'Personnel record enrolled successfully.' });
      }

      await loadDriversData();
      setTimeout(() => {
        setIsModalOpen(false);
        setAlertMessage(null);
      }, 1000);
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Verification fail.' });
    }
  };

  const handleDeactivateTrigger = (id: string) => {
    setAlertMessage(null);
    if (!canDeactivateEmployee) return;
    setLifecycleReason('');
    setLifecycleAction('deactivate');
    setConfirmDeactivateId(id);
  };

  const handleReactivateTrigger = (id: string) => {
    if (!canReactivateEmployee) return;
    setLifecycleReason('');
    setLifecycleAction('reactivate');
    setConfirmDeactivateId(id);
  };

  const executeLifecycle = async () => {
    if (confirmDeactivateId && (lifecycleAction === 'deactivate' ? canDeactivateEmployee : canReactivateEmployee)) {
      try {
        if (lifecycleAction === 'deactivate') await onDeactivate(confirmDeactivateId, lifecycleReason);
        else await onReactivate(confirmDeactivateId, lifecycleReason);
        setConfirmDeactivateId(null);
        await loadDriversData();
      } catch (err: any) {
        setAlertMessage({ type: 'error', text: err?.message || 'The lifecycle action could not be completed.' });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('All');
    setBranchFilter('All');
    setStatusFilter('All');
    setAvailabilityFilter('All');
    setExpiringLicenseOnly(false);
  };

  // --- MULTI-FILTER LIST LOGIC ---
  const filteredEmployees = employees.filter((emp) => {
    const profile = drivers.find((p) => p.employee_id === emp.id);

    // search query matches: name, email, phone, code, license number
    const term = searchQuery.toLowerCase();
    const nameMatch = emp.first_name.toLowerCase().includes(term) || emp.last_name.toLowerCase().includes(term);
    const codeMatch = (emp.employee_code || '').toLowerCase().includes(term);
    const emailMatch = (emp.email || '').toLowerCase().includes(term);
    const phoneMatch = (emp.contact_no || '').toLowerCase().includes(term);
    const lcsMatch = profile?.license_number ? profile.license_number.toLowerCase().includes(term) : false;

    if (searchQuery && !(nameMatch || codeMatch || emailMatch || phoneMatch || lcsMatch)) {
      return false;
    }

    // Role filter
    if (roleFilter !== 'All') {
      if (emp.employee_role_id !== roleFilter) return false;
    }

    // Branch filter
    // Employment active / inactive filter
    if (statusFilter !== 'All') {
      const isActive = emp.is_active !== false && emp.employment_status === 'Active';
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Inactive' && isActive) return false;
    }

    // Driver specific Filters
    if (emp.employee_role_id === 'er-1') {
      if (availabilityFilter !== 'All') {
        const dAvail = profile?.availability_status || 'Available';
        if (dAvail !== availabilityFilter) return false;
      }

      if (expiringLicenseOnly) {
        const isExpiring =
          checkLicenseExpiringIn30Days(profile?.license_expiry) || checkLicenseExpired(profile?.license_expiry);
        if (!isExpiring) return false;
      }
    } else {
      // If filtering by driver properties, non-drivers are excluded
      if (availabilityFilter !== 'All' || expiringLicenseOnly) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex h-full overflow-hidden bg-navy-50/60 dark:bg-carbon-950 transition-colors duration-300">
      {/* COLUMN 1: PERSONNEL LIST & FILTER CONTROLS */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden p-4 sm:p-6 lg:p-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-sans tracking-tight">
              Personnel Directory
            </h1>
            <p className="text-navy-600 dark:text-carbon-400 mt-0.5 text-xs">
              Manage employee identity, licensing, employment state, and lifecycle.
            </p>
          </div>

          {canCreateEmployee && (
            <Button icon={<Plus aria-hidden="true" className="w-4 h-4 shrink-0" />} onClick={() => handleOpenModal()}>
              Add employee
            </Button>
          )}
        </div>

        {/* ALERTS MESSAGE DISPLAY */}
        {alertMessage && (
          <div
            className={`mb-4 p-3.5 border text-xs rounded-lg flex items-center gap-2.5 shadow-sm transition-all duration-300 ${
              alertMessage.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <p className="font-medium">{alertMessage.text}</p>
          </div>
        )}

        {/* SEARCH AND COLLAPSIBLE FILTER CONTROL CENTER */}
        <div className="bg-white dark:bg-carbon-900 border border-navy-100 dark:border-carbon-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* SEARCH STRAP */}
            <div className="flex-1">
              <SearchInput
                aria-label="Search personnel"
                onChange={setSearchQuery}
                placeholder="Search by name, phone, email, license..."
                value={searchQuery}
              />
            </div>

            <Button
              aria-expanded={isFilterOpen}
              icon={<SlidersHorizontal aria-hidden="true" className="w-3.5 h-3.5" />}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              size="sm"
              variant={isFilterOpen ? 'primary' : 'secondary'}
            >
              Filter
            </Button>
          </div>

          {isFilterOpen && (
            <>
              <div className="flex justify-end pt-1 border-t border-navy-50 dark:border-carbon-800">
                {/* RESET BUTTON */}
                <Button
                  icon={<RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />}
                  onClick={handleResetFilters}
                  size="sm"
                  variant="secondary"
                >
                  Clear Filters
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                {/* ROLE PICKER */}
                <FormField label="Role">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={`${uiClasses.field} cursor-pointer`}
                  >
                    <option value="All">All Roles</option>
                    {MOCK_EMPLOYEE_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* BRANCH PICKER */}
                <FormField label="Branch">
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className={`${uiClasses.field} cursor-pointer`}
                  >
                    <option value="All">All Branches</option>
                    {MOCK_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_code}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* STATUS FILTER */}
                <FormField label="Status">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`${uiClasses.field} cursor-pointer`}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Inactive">Deactivated Only</option>
                  </select>
                </FormField>

                {/* DRIVER AVAILABILITY FILTER */}
                <FormField label="Availability">
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className={`${uiClasses.field} cursor-pointer`}
                  >
                    <option value="All">All Driver Status</option>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned / Busy</option>
                    <option value="Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </FormField>

                {/* EXPIRING LICENSE TOGGLE */}
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="expiringLicense"
                    checked={expiringLicenseOnly}
                    onChange={(e) => setExpiringLicenseOnly(e.target.checked)}
                    className="w-3.5 h-3.5 text-navy-900 border-navy-300 rounded cursor-pointer accent-navy-900"
                  />
                  <label
                    htmlFor="expiringLicense"
                    className="text-[10.5px] font-semibold text-red-700 dark:text-red-400 select-none cursor-pointer flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" /> Expiring License
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* LOADING & EMPTY CHASSIS */}
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-12 max-w-sm mx-auto">
            <AlertTriangle className="w-10 h-10 mb-3 text-red-500" />
            <h3 className="text-base font-bold">Diagnostics Pipeline Alert</h3>
            <p className="text-xs text-red-400 text-center mt-1">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-navy-500 p-12">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-navy-800 dark:text-white" />
            <p className="text-sm font-medium">Synchronizing personnel directories...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex-1 p-16 text-center border-2 border-dashed border-navy-200 dark:border-carbon-800 rounded-2xl bg-white dark:bg-carbon-900 max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center h-full">
            <User className="w-10 h-10 text-navy-300 dark:text-carbon-600 mb-3" />
            <h3 className="text-base font-bold text-navy-800 dark:text-white mb-1">No Personnel Matches</h3>
            <p className="text-xs text-navy-500 dark:text-carbon-400 mb-5 max-w-sm">
              No employee directories fit the specified filters. Try resetting the search terms or adding a new operator
              record.
            </p>
            <Button onClick={handleResetFilters} size="sm">
              Reset Filters
            </Button>
          </div>
        ) : (
          /* MAIN DIRECTORY GRID CONTAINER */
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedEmployeeId === emp.id;
                const dProf = drivers.find((p) => p.employee_id === emp.id);
                const roleDef = MOCK_EMPLOYEE_ROLES.find((r) => r.id === emp.employee_role_id);

                const isLicenseExpiring = checkLicenseExpiringIn30Days(dProf?.license_expiry);
                const isLicenseExpired = checkLicenseExpired(dProf?.license_expiry);
                const isEmpActive = emp.is_active !== false && emp.employment_status === 'Active';

                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={`border rounded-xl p-4 transition-all cursor-pointer relative flex flex-col min-h-[172px] shadow-sm active:scale-[0.99] ${
                      isSelected
                        ? 'bg-navy-900 text-white border-navy-900 dark:bg-carbon-800 dark:border-carbon-700'
                        : 'bg-white dark:bg-carbon-900 border-navy-100 dark:border-carbon-800 hover:border-navy-300 dark:hover:border-carbon-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 min-h-[30px]">
                        {/* BADGE LABELS */}
                        <div className="flex items-start gap-1 min-w-0 flex-1 overflow-hidden">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border truncate max-w-[128px] ${
                              isSelected ? 'bg-white/10 text-white border-white/20' : roleToneClasses(emp)
                            }`}
                          >
                            {roleDef?.label || emp.role || 'Personnel'}
                          </span>

                          <StatusBadge className="shrink-0" hideCue status={isEmpActive ? 'ACTIVE' : 'INACTIVE'} />
                        </div>

                        {/* ID CODE */}
                        <span
                          className={`font-mono text-[9px] tracking-widest shrink-0 pt-1 ${isSelected ? 'text-navy-300' : 'text-navy-400 dark:text-carbon-400'}`}
                        >
                          {emp.employee_code || `EMP-${emp.id.substring(4, 8).toUpperCase()}`}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold mt-3 truncate leading-snug ${isSelected ? 'text-white' : 'text-navy-900 dark:text-white'}`}
                      >
                        {emp.first_name} {emp.last_name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 min-h-[38px] border-t border-dashed border-gray-100 dark:border-gray-800">
                      <div className="flex gap-2 min-w-0 flex-1">
                        {emp.employee_role_id === 'er-1' && dProf && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isLicenseExpired ? (
                              <StatusBadge hideCue label="Expired License" status="ERROR" />
                            ) : isLicenseExpiring ? (
                              <StatusBadge hideCue label="Expiring < 30d" status="WARNING" />
                            ) : (
                              <span
                                className={`text-[10px] font-mono truncate ${isSelected ? 'text-white' : 'text-gray-500 dark:text-carbon-400'}`}
                              >
                                Lic: {dProf.license_number}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-navy-200' : 'text-navy-500 dark:text-carbon-400'}`}
                      >
                        {emp.contact_no || 'No phone'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* EMPLOYEE RIGHT-SIDE DETAIL PANEL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-40 flex justify-end bg-navy-900/35 dark:bg-black/55 backdrop-blur-xs lg:static lg:z-auto lg:block lg:w-[420px] lg:shrink-0 lg:!bg-transparent lg:backdrop-blur-none">
          <div className="w-full sm:w-[420px] lg:w-full h-full bg-white dark:bg-carbon-900 border-l border-navy-200 dark:border-carbon-800 shadow-2xl lg:shadow-md flex flex-col overflow-hidden">
            {/* PANEL HERO / COVER */}
            <div className="p-5 border-b border-navy-100 dark:border-carbon-800 bg-navy-50/70 dark:bg-carbon-950 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold font-sans text-sm">
                  {selectedEmployee.first_name[0]}
                  {selectedEmployee.last_name[0]}
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-navy-900 dark:text-white leading-tight">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h2>
                  <p className="font-mono text-[9px] text-navy-500 dark:text-carbon-400 uppercase tracking-widest mt-0.5">
                    {selectedEmployee.employee_code || `EMP-${selectedEmployee.id.substring(4, 9).toUpperCase()}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-1.5">
                {canUpdateEmployee && (
                  <Button
                    icon={<Edit2 aria-hidden="true" className="w-3 h-3 shrink-0" />}
                    onClick={() => handleOpenModal(selectedEmployee)}
                    size="sm"
                    title="Edit general profile and licensing info"
                    variant="secondary"
                  >
                    Edit
                  </Button>
                )}
                {selectedEmployee.is_active !== false
                  ? deactivatePresentation.visible && (
                      <Button
                        disabled={deactivatePresentation.disabled}
                        onClick={() => handleDeactivateTrigger(selectedEmployee.id)}
                        size="sm"
                        title={deactivatePresentation.reason ?? 'Deactivate employee'}
                        variant="danger"
                      >
                        Deactivate
                      </Button>
                    )
                  : reactivatePresentation.visible && (
                      <Button
                        onClick={() => handleReactivateTrigger(selectedEmployee.id)}
                        size="sm"
                        title="Reactivate employee"
                        variant="success"
                      >
                        Reactivate
                      </Button>
                    )}
                <Button
                  aria-label="Close employee details"
                  icon={<X aria-hidden="true" className="w-4 h-4" />}
                  onClick={() => {
                    setSelectedEmployeeId(null);
                    setShowAddAvailBlock(false);
                  }}
                  size="icon"
                  title="Close employee details"
                  variant="secondary"
                />
              </div>
            </div>

            {/* SCROLLABLE SPEC PANEL */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              {/* PRIMARY CONTACT SPEC CLUSTER */}
              <div>
                <h4 className="text-[10px] font-extrabold text-navy-500 dark:text-carbon-500 uppercase tracking-wider mb-2">
                  Personnel Details
                </h4>
                <div className="space-y-2 bg-navy-50/20 dark:bg-carbon-950/10 p-3 rounded-lg border border-navy-100/30 dark:border-carbon-800 text-xs">
                  {/* TELEPHONE */}
                  <div className="flex justify-between items-center">
                    <span className="text-navy-500 dark:text-carbon-400">Contact Phone</span>
                    <span className="font-mono text-navy-900 dark:text-white flex items-center gap-1">
                      <Phone className="w-3 h-3 text-navy-400 shrink-0" />
                      {selectedEmployee.contact_no || 'Not Configured'}
                    </span>
                  </div>

                  {/* EMAIL */}
                  <div className="flex justify-between items-center">
                    <span className="text-navy-500 dark:text-carbon-400">Work Email</span>
                    <span className="font-mono text-navy-900 dark:text-white flex items-center gap-1 text-[11px]">
                      <Mail className="w-3 h-3 text-navy-400 shrink-0" />
                      {selectedEmployee.email || `${selectedEmployee.first_name.toLowerCase()}@cloudy.ph`}
                    </span>
                  </div>

                  {/* SYSTEM ACTIVE INDICATOR */}
                  <div className="flex justify-between">
                    <span className="text-navy-500 dark:text-carbon-400">Employment Status</span>
                    <span className="font-semibold text-navy-800 dark:text-white flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${selectedEmployee.is_active !== false && selectedEmployee.employment_status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}
                      />
                      {selectedEmployee.employment_status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* DRIVER SPECIALIZED SUB-PANEL */}
              {selectedEmployee.employee_role_id === 'er-1' && (
                <div className="border-t border-navy-100 dark:border-carbon-800 pt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-widest flex items-center gap-1">
                      <IdCard className="w-4 h-4" /> Driver Fleet Credentials
                    </h4>
                    {selectedDriverProfile && (
                      <StatusBadge
                        hideCue
                        label={selectedDriverProfile.availability_status}
                        status={selectedDriverProfile.availability_status}
                      />
                    )}
                  </div>

                  {selectedDriverProfile ? (
                    <div className="space-y-4">
                      {/* LICENSING INFO BAR */}
                      <div className="grid grid-cols-2 gap-3.5 bg-navy-50/40 dark:bg-carbon-950/40 border border-navy-100 dark:border-carbon-800 p-3 rounded-lg text-xs">
                        <div>
                          <p className="text-[9px] font-bold text-navy-500 dark:text-carbon-400 uppercase">
                            License Number
                          </p>
                          <p className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">
                            {selectedDriverProfile.license_number || 'DL-GEN-8882'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-navy-500 dark:text-carbon-400 uppercase">
                            Lic expiry date
                          </p>
                          <p className="font-semibold text-navy-900 dark:text-white mt-0.5">
                            {selectedDriverProfile.license_expiry || '2028-12-31'}
                          </p>

                          {checkLicenseExpired(selectedDriverProfile.license_expiry) && (
                            <p className="text-[9px] text-red-700 font-bold mt-1 uppercase animate-bounce">
                              🚨 Expired License
                            </p>
                          )}
                          {checkLicenseExpiringIn30Days(selectedDriverProfile.license_expiry) && (
                            <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase">⚠️ Expiring &lt; 30d</p>
                          )}
                        </div>

                        {selectedDriverProfile.notes && (
                          <div className="col-span-2 pt-2 border-t border-navy-100 dark:border-carbon-800">
                            <p className="text-[9px] text-navy-500 dark:text-carbon-400 font-bold uppercase">
                              Restrictions / Notes
                            </p>
                            <p className="text-navy-600 dark:text-carbon-400 mt-0.5 text-[11px] leading-relaxed">
                              {selectedDriverProfile.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-navy-500 dark:text-carbon-500 italic">
                        Assignment availability is read-only here and is managed through the Trip Assignment workflow.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 text-center border-2 border-dotted border-navy-200 dark:border-carbon-800 rounded-lg">
                      <p className="text-xs text-navy-500">
                        Wait, this employee is classified as a Driver, but has no matching record in the nested Hybrid
                        Driver Profile database yet. Click **Edit Profile** to register their License fields.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TIMESTAMPS / DATABASE INLINE METADATA */}
              <div className="border-t border-navy-100 dark:border-carbon-800 pt-5 text-[10px] text-navy-500 dark:text-carbon-500 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Record Created Date</span>
                  <span>
                    {selectedEmployee.created_at
                      ? new Date(selectedEmployee.created_at).toLocaleString()
                      : '2026-06-15 05:10:22'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified Time</span>
                  <span>
                    {selectedEmployee.updated_at
                      ? new Date(selectedEmployee.updated_at).toLocaleString()
                      : '2026-06-15 13:22:10'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DEACTIVATION INSTRUCTIONS DIALOG */}
      <Modal
        description={
          <span>
            Are you sure you want to {lifecycleAction}{' '}
            <strong className="text-navy-900 dark:text-white">
              {employees.find((e) => e.id === confirmDeactivateId)?.full_name}
            </strong>
            ?
          </span>
        }
        footer={
          <div className="flex gap-2.5 justify-end">
            <Button onClick={() => setConfirmDeactivateId(null)} size="sm" variant="secondary">
              Cancel Action
            </Button>
            <Button disabled={!lifecycleReason.trim()} onClick={executeLifecycle} size="sm" variant="danger">
              Confirm {lifecycleAction}
            </Button>
          </div>
        }
        onClose={() => setConfirmDeactivateId(null)}
        open={Boolean(confirmDeactivateId)}
        size="sm"
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle aria-hidden="true" className="w-5 h-5 text-red-500 shrink-0" />
            Confirm Employee {lifecycleAction === 'deactivate' ? 'Deactivation' : 'Reactivation'}
          </span>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 rounded text-[11px] text-amber-700 dark:text-amber-400 leading-normal">
            <strong>OFFLINE DIRECTORY WARNING:</strong> Deactivated operators will instantly be disabled in all Trip
            Scheduling dropdown options across the board.
          </div>

          <FormField
            id="employee-lifecycle-reason"
            label={`${lifecycleAction === 'deactivate' ? 'Deactivation' : 'Reactivation'} reason`}
            required
          >
            <textarea
              value={lifecycleReason}
              onChange={(event) => setLifecycleReason(event.target.value)}
              className={uiClasses.field}
            />
          </FormField>
        </div>
      </Modal>

      {/* CREATE / ENROLL & EDIT OPERATOR DIALOG */}
      <Modal
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        size="lg"
        title={editingId ? 'Modify Fleet Personnel Record' : 'Enroll Operator Profile'}
      >
        {/* MODAL FORM CONTAINER */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* ERROR/SUCCESS IN-FORM DISPLAY */}
          {alertMessage && (
            <div
              className={`p-3 border text-xs rounded flex items-center gap-2 ${
                alertMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <p className="font-semibold">{alertMessage.text}</p>
            </div>
          )}

          {/* FIRST & LAST NAME */}
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="First Name" required>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={uiClasses.field}
              />
            </FormField>
            <FormField label="Last Name" required>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className={uiClasses.field}
              />
            </FormField>
          </div>

          {/* CONTACT INFO */}
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Contact Phone" required>
              <input
                type="text"
                value={formData.contact_no}
                placeholder="0917-XXX-XXXX"
                onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                className={uiClasses.field}
              />
            </FormField>
            <FormField label="Work Email" required>
              <input
                type="email"
                value={formData.email}
                placeholder="name@cloudy.ph"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={uiClasses.field}
              />
            </FormField>
          </div>

          {/* ROLE PICKER */}
          <FormField label="Employee Role Mapped Code">
            <select
              value={formData.employee_role_id}
              onChange={(e) => setFormData({ ...formData, employee_role_id: e.target.value })}
              className={`${uiClasses.field} cursor-pointer`}
            >
              {MOCK_EMPLOYEE_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label} ({role.role_code})
                </option>
              ))}
            </select>
          </FormField>

          {/* STATUS & IS ACTIVE CONFIGS */}
          <div className="grid grid-cols-2 gap-3.5 pt-1.5 border-t border-navy-50 dark:border-carbon-800">
            <FormField label="Employment Status">
              <select
                value={formData.employment_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employment_status: e.target.value,
                    is_active: e.target.value === 'Active',
                  })
                }
                className={`${uiClasses.field} cursor-pointer`}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Terminated / Inactive</option>
              </select>
            </FormField>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.checked,
                    employment_status: e.target.checked ? 'Active' : 'Inactive',
                  })
                }
                className="w-4 h-4 text-navy-900 accent-navy-900 border-navy-400 dark:border-carbon-700 rounded cursor-pointer"
              />
              <label
                htmlFor="isActiveCheck"
                className="text-xs font-semibold text-navy-800 dark:text-carbon-300 cursor-pointer select-none"
              >
                Active System Access
              </label>
            </div>
          </div>

          {/* DRIVER-SPECIFIC SECTION */}
          {formData.employee_role_id === 'er-1' && (
            <div className="pt-3.5 border-t-2 border-navy-100 dark:border-carbon-800/40 space-y-3.5">
              <h4 className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-widest flex items-center gap-1.5">
                <IdCard className="w-4 h-4 shrink-0" /> Operator Licensing Fields
              </h4>

              <div className="grid grid-cols-2 gap-3.5">
                <FormField label="License Number" required>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className={uiClasses.field}
                    placeholder="DL-NCR-123456"
                  />
                </FormField>
                <FormField label="License Expiry" required>
                  <input
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className={uiClasses.field}
                  />
                </FormField>
              </div>

              <FormField label="License Constraints / Notes">
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={uiClasses.field}
                  placeholder="Restricted to NCR RORO loops..."
                />
              </FormField>
            </div>
          )}

          {/* FORMS CTA */}
          <div className="pt-4 flex gap-3 border-t border-navy-50 dark:border-carbon-800">
            <Button className="flex-1" onClick={() => setIsModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button className="flex-1" type="submit">
              {editingId ? 'Save Profile' : 'Register Operator'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeList;
