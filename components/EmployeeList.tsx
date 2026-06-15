import React, { useState, useEffect } from 'react';
import { Employee, Trip, DriverProfile, DriverAvailability } from '../types';
import { api } from '../services/apiService';
import { 
  Plus, Edit2, Trash2, X, User, IdCard, AlertTriangle, Loader2, 
  Search, SlidersHorizontal, MapPin, Phone, Mail, RotateCcw, 
  CheckCircle2, ShieldAlert, Clock, Building, Calendar, Info, 
  CheckSquare, FileSpreadsheet, Lock
} from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  trips: Trip[];
  onAdd: (employee: any) => void;
  onUpdate?: (employee: Employee) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
  theme: 'light' | 'dark';
  userRole?: string;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, trips, onAdd, onUpdate, onDelete, isLoading = false, error = null, theme, userRole 
}) => {
  const [branchesState, setBranchesState] = useState<any[]>([]);
  const [employeeRolesState, setEmployeeRolesState] = useState<any[]>([]);
  const [driversState, setDriversState] = useState<any[]>([]);
  const [driverAvailabilityState, setDriverAvailabilityState] = useState<any[]>([]);

  const loadEmployeeResources = async () => {
    try {
      const [br, er, dr, da] = await Promise.all([
        api.getBranches(),
        api.getEmployeeRoles(),
        api.getDrivers(),
        api.getDriverAvailability()
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

  const isWritable = userRole === 'SuperAdmin' || userRole === 'Admin';
  
  // --- Selected Employee State for Right Detail View ---
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // --- Modals State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  
  // --- Filters State ---
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
    branch_id: 'branch-1',
    contact_no: '',
    email: '',
    employment_status: 'Active',
    is_active: true,
    // Driver exception fields inside modal
    license_number: '',
    license_expiry: '2029-12-31',
    availability_status: 'Available',
    notes: ''
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
      const d = await api.getDrivers();
      setDrivers(d);
      const da = await api.getDriverAvailability();
      setAvailabilityRows(da);
    } catch (err) {
      console.error('Failed to sync driver profiles:', err);
    }
  };

  useEffect(() => {
    loadDriversData();
  }, [employees]);

  // Sync selected employee ID if list initializes or changes
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees]);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const selectedDriverProfile = selectedEmployee ? drivers.find(d => d.employee_id === selectedEmployee.id) : null;
  const selectedDriverAvailability = selectedDriverProfile ? availabilityRows.filter(r => r.driver_id === selectedDriverProfile.id) : [];

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
    const dProf = drivers.find(p => p.employee_id === employeeId || p.id === employeeId);
    const driverId = dProf?.id;

    return trips.some(t => {
      const isTripInProgress = !t.is_deleted && (
        t.status === 'In Progress' || 
        t.status === 'In Transit' || 
        t.status_id === 'status-inprogress'
      );
      if (!isTripInProgress) return false;
      return (
        t.driver_id === employeeId || 
        (driverId && t.driver_id === driverId)
      );
    });
  };

  // --- EVENT HANDLERS ---
  const handleOpenModal = (employee?: Employee) => {
    setAlertMessage(null);
    if (employee) {
      setEditingId(employee.id);
      const dProf = drivers.find(p => p.employee_id === employee.id);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        employee_role_id: employee.employee_role_id || 'er-1',
        branch_id: employee.branch_id || 'branch-1',
        contact_no: employee.contact_no || '',
        email: employee.email || '',
        employment_status: employee.employment_status || 'Active',
        is_active: employee.is_active !== false,
        // Driver details
        license_number: dProf?.license_number || '',
        license_expiry: dProf?.license_expiry || '2029-12-31',
        availability_status: dProf?.availability_status || 'Available',
        notes: dProf?.notes || ''
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

    const isDriverForm = formData.employee_role_id === 'er-1';

    // Validate email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    const dataToSubmit: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      full_name: `${formData.first_name} ${formData.last_name}`,
      employee_role_id: formData.employee_role_id,
      branch_id: formData.branch_id,
      contact_no: formData.contact_no,
      email: formData.email,
      employment_status: formData.employment_status,
      is_active: formData.is_active,
      role: (MOCK_EMPLOYEE_ROLES.find(r => r.id === formData.employee_role_id)?.role_code || 'Helper')
    };

    try {
      if (editingId) {
        // Business Rule: Check if we are deactivating a driver assigned to an active trip
        const isNowInactive = !formData.is_active || formData.employment_status !== 'Active';
        if (isNowInactive && isDriverAssignedToActiveTrip(editingId)) {
          setAlertMessage({ 
            type: 'error', 
            text: 'ERROR: This operator is currently assigned to an In Progress Trip. Deactivation is blocked.' 
          });
          return;
        }

        // 1. Submit update for Employee
        if (onUpdate) {
          await onUpdate({ ...dataToSubmit, id: editingId });
        }

        // 2. Submit update for parallel driver record if role is Driver
        if (isDriverForm) {
          await api.updateDriverProfile(editingId, {
            license_number: formData.license_number,
            license_expiry: formData.license_expiry,
            availability_status: formData.availability_status,
            notes: formData.notes
          });
        }
        
        setAlertMessage({ type: 'success', text: 'Personnel record updated successfully.' });
      } else {
        // 1. Enroll new Employee
        const createdEmployee = await onAdd(dataToSubmit);
        
        // Parallel Driver Registration is already handled in apiService.createEmployee
        // But let's overwrite it with the custom license & status input values
        if (isDriverForm && createdEmployee?.id) {
          await api.updateDriverProfile(createdEmployee.id, {
            license_number: formData.license_number,
            license_expiry: formData.license_expiry,
            availability_status: formData.availability_status,
            notes: formData.notes
          });
        }
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
    if (isDriverAssignedToActiveTrip(id)) {
      setAlertMessage({ 
        type: 'error', 
        text: 'ERROR: This operator is currently assigned to an In Progress Trip. Deactivation is blocked.' 
      });
      return;
    }
    setConfirmDeactivateId(id);
  };

  const executeDeactivate = async () => {
    if (confirmDeactivateId) {
      try {
        const empToDeactivate = employees.find(e => e.id === confirmDeactivateId);
        if (empToDeactivate) {
          const updatedRecord = {
            ...empToDeactivate,
            is_active: false,
            employment_status: 'Inactive'
          };
          if (onUpdate) {
            await onUpdate(updatedRecord);
          }
          // Also update driver status
          await api.updateDriverProfile(confirmDeactivateId, {
            availability_status: 'Suspended'
          });
        }
        setConfirmDeactivateId(null);
        await loadDriversData();
      } catch (err: any) {
        console.error('Failed to deactivate personnel:', err);
      }
    }
  };

  // --- ADD OVERRIDE AVAILABILITY ROW ---
  const handleAddAvailabilityRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverProfile) return;

    try {
      await api.createDriverAvailability({
        driver_id: selectedDriverProfile.id,
        availability_date: newAvailDate,
        status: newAvailStatus,
        notes: newAvailNotes
      });

      // Update current driver status profile too
      await api.updateDriverProfile(selectedDriverProfile.id, {
        availability_status: newAvailStatus
      });

      // Update parent employee and trigger state propagation down to Dashboard
      if (selectedEmployee && onUpdate) {
        let updatedStatus = selectedEmployee.employment_status;
        if (newAvailStatus === 'Leave') {
          updatedStatus = 'On Leave';
        } else if (newAvailStatus === 'Suspended') {
          updatedStatus = 'Suspended';
        } else if (newAvailStatus === 'Available') {
          updatedStatus = 'Active';
        }

        await onUpdate({
          ...selectedEmployee,
          employment_status: updatedStatus,
          updated_at: new Date().toISOString()
        });
      }

      setNewAvailNotes('');
      setShowAddAvailBlock(false);
      await loadDriversData();
    } catch (err) {
      console.error('Failed to log availability override:', err);
    }
  };

  const handleDeleteAvailabilityRow = async (id: string) => {
    try {
      await api.deleteDriverAvailability(id);
      await loadDriversData();
    } catch (err) {
      console.error('Failed to delete availability record:', err);
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
  const filteredEmployees = employees.filter(emp => {
    const profile = drivers.find(p => p.employee_id === emp.id);
    
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
    if (branchFilter !== 'All') {
      if (emp.branch_id !== branchFilter) return false;
    }

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
        const isExpiring = checkLicenseExpiringIn30Days(profile?.license_expiry) || checkLicenseExpired(profile?.license_expiry);
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
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-64px)] overflow-hidden bg-navy-50/60 dark:bg-carbon-950 transition-colors duration-300">
      
      {/* COLUMN 1: PERSONNEL LIST & FILTER CONTROLS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 lg:p-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-sans tracking-tight">Personnel Directory</h1>
            <p className="text-navy-600 dark:text-carbon-400 mt-0.5 text-xs">Manage operator licenses, scheduling status, and operations branches.</p>
          </div>
          
          {isWritable && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-100 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-semibold shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" /> Add New Employee
            </button>
          )}
        </div>

        {/* ALERTS MESSAGE DISPLAY */}
        {alertMessage && (
          <div className={`mb-4 p-3.5 border text-xs rounded-lg flex items-center gap-2.5 shadow-sm transition-all duration-300 ${
            alertMessage.type === 'error' 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400' 
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <p className="font-medium">{alertMessage.text}</p>
          </div>
        )}

        {/* OMNI-FILTER CONTROL CENTER */}
        <div className="bg-white dark:bg-carbon-900 border border-navy-100 dark:border-carbon-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* SEARCH STRAP */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-navy-400 dark:text-carbon-500" />
              <input
                type="text"
                placeholder="Search by name, phone, email, license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 text-xs rounded-lg pl-9 pr-4 py-2.5 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            
            {/* RESET BUTTON */}
            <button 
              onClick={handleResetFilters}
              className="bg-navy-50 dark:bg-carbon-800 hover:bg-navy-100 dark:hover:bg-carbon-700 text-navy-700 dark:text-carbon-300 border border-navy-200/60 dark:border-carbon-700 px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-semibold shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1 border-t border-navy-50 dark:border-carbon-800">
            {/* ROLE PICKER */}
            <div>
              <label className="block text-[9.5px] font-bold text-navy-500 dark:text-carbon-500 mb-1 uppercase tracking-wider">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-navy-50/40 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-1.5 text-[11px] text-navy-800 dark:text-carbon-300 focus:outline-none focus:ring-1 focus:ring-navy-500 cursor-pointer"
              >
                <option value="All">All Roles</option>
                {MOCK_EMPLOYEE_ROLES.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* BRANCH PICKER */}
            <div>
              <label className="block text-[9.5px] font-bold text-navy-500 dark:text-carbon-500 mb-1 uppercase tracking-wider">Branch</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full bg-navy-50/40 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-1.5 text-[11px] text-navy-800 dark:text-carbon-300 focus:outline-none focus:ring-1 focus:ring-navy-500 cursor-pointer"
              >
                <option value="All">All Branches</option>
                {MOCK_BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_code}</option>
                ))}
              </select>
            </div>

            {/* STATUS FILTER */}
            <div>
              <label className="block text-[9.5px] font-bold text-navy-500 dark:text-carbon-500 mb-1 uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-navy-50/40 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-1.5 text-[11px] text-navy-800 dark:text-carbon-300 focus:outline-none focus:ring-1 focus:ring-navy-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Deactivated Only</option>
              </select>
            </div>

            {/* DRIVER AVAILABILITY FILTER */}
            <div>
              <label className="block text-[9.5px] font-bold text-navy-500 dark:text-carbon-500 mb-1 uppercase tracking-wider">Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full bg-navy-50/40 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-1.5 text-[11px] text-navy-800 dark:text-carbon-300 focus:outline-none focus:ring-1 focus:ring-navy-500 cursor-pointer"
              >
                <option value="All">All Driver Status</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned / Busy</option>
                <option value="Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* EXPIRING LICENSE TOGGLE */}
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="expiringLicense"
                checked={expiringLicenseOnly}
                onChange={(e) => setExpiringLicenseOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-navy-900 border-navy-300 rounded cursor-pointer accent-navy-900"
              />
              <label htmlFor="expiringLicense" className="text-[10.5px] font-semibold text-red-700 dark:text-red-400 select-none cursor-pointer flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" /> Expiring License
              </label>
            </div>
          </div>
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
            <p className="text-xs text-navy-500 dark:text-carbon-400 mb-5 max-w-sm">No employee directories fit the specified filters. Try resetting the search terms or adding a new operator record.</p>
            <button 
              onClick={handleResetFilters}
              className="bg-navy-900 dark:bg-white text-white dark:text-black py-2 px-4 rounded text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* MAIN DIRECTORY GRID CONTAINER */
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedEmployeeId === emp.id;
                const dProf = drivers.find(p => p.employee_id === emp.id);
                const roleDef = MOCK_EMPLOYEE_ROLES.find(r => r.id === emp.employee_role_id);
                const branchDef = MOCK_BRANCHES.find(b => b.id === emp.branch_id);
                
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
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border truncate max-w-[128px] ${
                            isSelected
                              ? 'bg-white/10 text-white border-white/20'
                              : emp.employee_role_id === 'er-1'
                                ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'
                                : emp.employee_role_id === 'er-2'
                                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                                  : 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30'
                          }`}>
                            {roleDef?.label || emp.role || 'Personnel'}
                          </span>

                          {!isEmpActive ? (
                            <span className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider uppercase shrink-0">
                              Inactive
                            </span>
                          ) : (
                            <span className={`border px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider uppercase shrink-0 ${
                              isSelected 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' 
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100'
                            }`}>
                              Active
                            </span>
                          )}
                        </div>

                        {/* ID CODE */}
                        <span className={`font-mono text-[9px] tracking-widest shrink-0 pt-1 ${isSelected ? 'text-navy-300' : 'text-navy-400 dark:text-carbon-400'}`}>
                          {emp.employee_code || `EMP-${emp.id.substring(4, 8).toUpperCase()}`}
                        </span>
                      </div>

                      <h3 className={`text-sm font-bold mt-3 truncate leading-snug ${isSelected ? 'text-white' : 'text-navy-900 dark:text-white'}`}>
                        {emp.first_name} {emp.last_name}
                      </h3>
                      
                      <div className={`flex items-center gap-1 text-[10.5px] mt-1 min-w-0 ${isSelected ? 'text-navy-200' : 'text-navy-500 dark:text-carbon-400'}`}>
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{branchDef?.branch_name || 'Unassigned Hub'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 min-h-[38px] border-t border-dashed border-gray-100 dark:border-gray-800">
                      <div className="flex gap-2 min-w-0 flex-1">
                        {emp.employee_role_id === 'er-1' && dProf && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isLicenseExpired ? (
                              <span className="bg-red-600 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-0.5 animate-pulse">
                                <ShieldAlert className="w-2.5 h-2.5" /> Expired License
                              </span>
                            ) : isLicenseExpiring ? (
                              <span className="bg-amber-500 text-black text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                Expiring &lt; 30d
                              </span>
                            ) : (
                              <span className={`text-[10px] font-mono truncate ${isSelected ? 'text-white' : 'text-gray-500 dark:text-carbon-400'}`}>
                                Lic: {dProf.license_number}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <span className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-navy-200' : 'text-navy-500 dark:text-carbon-400'}`}>
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

      {/* COLUMN 2: SPLIT PANEL PERSISTENT PROFILE VIEW & DETAILS */}
      <div className="w-full lg:w-[410px] bg-white dark:bg-carbon-900 border-t lg:border-t-0 lg:border-l border-navy-200 dark:border-carbon-800 h-full flex flex-col overflow-hidden relative shadow-md">
        {selectedEmployee ? (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* PANEL HERO / COVER */}
            <div className="p-5 border-b border-navy-100 dark:border-carbon-800 bg-navy-50/70 dark:bg-carbon-950 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold font-sans text-sm">
                  {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
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

              {isWritable && (
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleOpenModal(selectedEmployee)}
                    title="Edit general profile and licensing info"
                    className="p-1 px-2.5 bg-white dark:bg-carbon-800 border border-navy-200 dark:border-carbon-700 rounded-md hover:bg-navy-50 dark:hover:bg-carbon-700 text-navy-800 dark:text-white text-xs font-semibold cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 shrink-0 inline mr-1" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeactivateTrigger(selectedEmployee.id)}
                    title="Soft Deactivate personnel"
                    className="p-1 px-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold cursor-pointer"
                  >
                    Deactivate
                  </button>
                </div>
              )}
            </div>

            {/* SCROLLABLE SPEC PANEL */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              
              {/* PRIMARY CONTACT SPEC CLUSTER */}
              <div>
                <h4 className="text-[10px] font-extrabold text-navy-500 dark:text-carbon-500 uppercase tracking-wider mb-2">Personnel Details</h4>
                <div className="space-y-2 bg-navy-50/20 dark:bg-carbon-950/10 p-3 rounded-lg border border-navy-100/30 dark:border-carbon-800 text-xs">
                  
                  {/* BRANCH */}
                  <div className="flex justify-between">
                    <span className="text-navy-500 dark:text-carbon-400">Branch Terminal</span>
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {MOCK_BRANCHES.find(b => b.id === selectedEmployee.branch_id)?.branch_name || 'Global Terminal'}
                    </span>
                  </div>

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
                      <span className={`w-2 h-2 rounded-full ${selectedEmployee.is_active !== false && selectedEmployee.employment_status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {selectedEmployee.employment_status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* DRIVER SPECIALIZED SUB-PANEL */}
              {selectedEmployee.employee_role_id === 'er-1' && (
                <div className="border-t border-navy-100 dark:border-carbon-800 pt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1">
                      <IdCard className="w-4 h-4" /> Driver Fleet Credentials
                    </h4>
                    {selectedDriverProfile && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedDriverProfile.availability_status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 
                        selectedDriverProfile.availability_status === 'Assigned' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' : 
                        'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                      }`}>
                        {selectedDriverProfile.availability_status}
                      </span>
                    )}
                  </div>

                  {selectedDriverProfile ? (
                    <div className="space-y-4">
                      
                      {/* LICENSING INFO BAR */}
                      <div className="grid grid-cols-2 gap-3.5 bg-purple-50/20 dark:bg-purple-950/5 border border-purple-100/40 dark:border-purple-900/10 p-3 rounded-lg text-xs">
                        <div>
                          <p className="text-[9px] font-bold text-purple-500 uppercase">License Number</p>
                          <p className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">{selectedDriverProfile.license_number || 'DL-GEN-8882'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-purple-500 uppercase">Lic expiry date</p>
                          <p className="font-semibold text-navy-900 dark:text-white mt-0.5">{selectedDriverProfile.license_expiry || '2028-12-31'}</p>
                          
                          {checkLicenseExpired(selectedDriverProfile.license_expiry) && (
                            <p className="text-[9px] text-red-700 font-bold mt-1 uppercase animate-bounce">🚨 Expired License</p>
                          )}
                          {checkLicenseExpiringIn30Days(selectedDriverProfile.license_expiry) && (
                            <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase">⚠️ Expiring &lt; 30d</p>
                          )}
                        </div>

                        {selectedDriverProfile.notes && (
                          <div className="col-span-2 pt-2 border-t border-purple-100/20">
                            <p className="text-[9px] text-purple-400 font-bold uppercase">Restrictions / Notes</p>
                            <p className="text-navy-600 dark:text-carbon-400 mt-0.5 text-[11px] leading-relaxed">{selectedDriverProfile.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* DRIVER AVAILABILITY HISTORY/ROWS */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-extrabold text-navy-500 dark:text-carbon-500 uppercase tracking-wider">Availability overrides</h5>
                          <button 
                            onClick={() => setShowAddAvailBlock(!showAddAvailBlock)}
                            className="text-[10.5px] font-extrabold text-navy-900 dark:text-white hover:underline uppercase flex items-center gap-0.5"
                          >
                            {showAddAvailBlock ? 'Collapse' : '+ Override Row'}
                          </button>
                        </div>

                        {/* OVERRIDE INLINE BLOCK */}
                        {showAddAvailBlock && (
                          <form onSubmit={handleAddAvailabilityRow} className="bg-navy-50/50 dark:bg-carbon-950/40 p-3 rounded-lg border border-navy-200 dark:border-carbon-800 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1">Target Date</label>
                                <input 
                                  type="date"
                                  value={newAvailDate}
                                  onChange={(e) => setNewAvailDate(e.target.value)}
                                  className="w-full bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 text-[11px] rounded p-1 text-navy-900 dark:text-white focus:outline-none"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1">Status Code</label>
                                <select 
                                  value={newAvailStatus}
                                  onChange={(e) => setNewAvailStatus(e.target.value)}
                                  className="w-full bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 text-[11px] rounded p-1 text-navy-900 dark:text-white cursor-pointer focus:outline-none"
                                >
                                  <option value="Available">Available</option>
                                  <option value="Assigned">Assigned</option>
                                  <option value="Leave">On Leave</option>
                                  <option value="Suspended">Suspended</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-navy-500 uppercase mb-0.5">Notes/Remarks</label>
                              <input 
                                type="text"
                                placeholder="Resting / Local Toledo run only..."
                                value={newAvailNotes}
                                onChange={(e) => setNewAvailNotes(e.target.value)}
                                className="w-full bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 text-[11px] rounded p-1 text-navy-900 dark:text-white focus:outline-none"
                              />
                            </div>

                            <button 
                              type="submit"
                              className="w-full bg-navy-900 dark:bg-white text-white dark:text-black py-1 rounded text-[10.5px] font-bold transition-all hover:opacity-90 cursor-pointer"
                            >
                              Log Availability Overwrite
                            </button>
                          </form>
                        )}

                        {/* AVAILABILITY LOG DATA TABLE */}
                        {selectedDriverAvailability.length === 0 ? (
                          <p className="text-[11px] text-navy-500 dark:text-carbon-500 italic">No specific scheduling overrides recorded. Operator defaults to Available status.</p>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {selectedDriverAvailability.map(da => (
                              <div key={da.id} className="bg-white dark:bg-carbon-900 p-2.5 rounded border border-navy-100 dark:border-carbon-800 text-[11.5px] relative flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-navy-800 dark:text-white">{da.availability_date}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                                      da.status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 
                                      da.status === 'Assigned' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' : 
                                      'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                                    }`}>
                                      {da.status}
                                    </span>
                                  </div>
                                  {da.notes && <p className="text-navy-500 dark:text-carbon-400 text-[10.5px] mt-1">{da.notes}</p>}
                                </div>
                                <button 
                                  onClick={() => handleDeleteAvailabilityRow(da.id)}
                                  className="text-navy-400 hover:text-red-500 p-0.5 self-center cursor-pointer"
                                  title="Delete override log"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center border-2 border-dotted border-purple-100 dark:border-carbon-800 rounded-lg">
                      <p className="text-xs text-navy-500">Wait, this employee is classified as a Driver, but has no matching record in the nested Hybrid Driver Profile database yet. Click **Edit Profile** to register their License fields.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TIMESTAMPS / DATABASE INLINE METADATA */}
              <div className="border-t border-navy-100 dark:border-carbon-800 pt-5 text-[10px] text-navy-500 dark:text-carbon-500 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Record Created Date</span>
                  <span>{selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleString() : '2026-06-15 05:10:22'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified Time</span>
                  <span>{selectedEmployee.updated_at ? new Date(selectedEmployee.updated_at).toLocaleString() : '2026-06-15 13:22:10'}</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 h-full bg-navy-50/50 text-center">
            <User className="w-9 h-9 text-navy-300 dark:text-carbon-600 mb-2" />
            <h3 className="font-bold text-sm text-navy-900 dark:text-white">Profile Detail Panel</h3>
            <p className="text-xs text-navy-500 max-w-xs mt-1">Select any employee from the directory menu to explore license status, metadata, and manage availability logs.</p>
          </div>
        )}
      </div>

      {/* CONFIRM DEACTIVATION INSTRUCTIONS DIALOG */}
      {confirmDeactivateId && (
        <div className="fixed inset-0 bg-navy-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> Confirm Operator Deactivation
            </h3>
            
            <p className="text-xs text-navy-600 dark:text-carbon-400 leading-relaxed mb-4">
              Are you sure you want to deactivate <strong className="text-black dark:text-white">{employees.find(e => e.id === confirmDeactivateId)?.full_name}</strong>?
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 p-3 rounded text-[11px] text-amber-700 dark:text-amber-400 mb-6 leading-normal">
              <strong>OFFLINE DIRECTORY WARNING:</strong> Deactivated operators will instantly be disabled in all Trip Scheduling dropdown options across the board.
            </div>

            <div className="flex gap-2.5 justify-end">
              <button 
                onClick={() => setConfirmDeactivateId(null)}
                className="bg-navy-50 hover:bg-navy-100 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-navy-800 dark:text-white px-4 py-2 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel Action
              </button>
              <button 
                onClick={executeDeactivate}
                className="bg-red-700 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold shadow cursor-pointer"
              >
                Deactivate Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / ENROLL & EDIT OPERATOR DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-carbon-900 rounded-xl border border-navy-200 dark:border-carbon-800 w-full max-w-md shadow-2xl overflow-hidden my-8">
            
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center bg-navy-50/70 dark:bg-carbon-950">
              <h2 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                {editingId ? 'Modify Fleet Personnel Record' : 'Enroll Operator Profile'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-800 dark:text-carbon-400 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* MODAL FORM CONTAINER */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              
              {/* ERROR/SUCCESS IN-FORM DISPLAY */}
              {alertMessage && (
                <div className={`p-3 border text-xs rounded flex items-center gap-2 ${
                  alertMessage.type === 'error' 
                    ? 'bg-red-50 text-red-700 border-red-200' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <p className="font-semibold">{alertMessage.text}</p>
                </div>
              )}

              {/* FIRST & LAST NAME */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-1 tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-500"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-1 tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-500"
                    required 
                  />
                </div>
              </div>

              {/* CONTACT INFO */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-1 tracking-wider">Contact Phone</label>
                  <input 
                    type="text" 
                    value={formData.contact_no}
                    placeholder="0917-XXX-XXXX"
                    onChange={(e) => setFormData({...formData, contact_no: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-1 tracking-wider">Work Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    placeholder="name@cloudy.ph"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* ROLE PICKER */}
              <div>
                <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-1 tracking-wider">Employee Role Mapped Code</label>
                <select 
                  value={formData.employee_role_id}
                  onChange={(e) => setFormData({...formData, employee_role_id: e.target.value})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {MOCK_EMPLOYEE_ROLES.map(role => (
                    <option key={role.id} value={role.id}>{role.label} ({role.role_code})</option>
                  ))}
                </select>
              </div>

              {/* BRANCH PICKER */}
              <div>
                <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-1 tracking-wider">Operations Branch Hub</label>
                <select 
                  value={formData.branch_id}
                  onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {MOCK_BRANCHES.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                  ))}
                </select>
              </div>

              {/* STATUS & IS ACTIVE CONFIGS */}
              <div className="grid grid-cols-2 gap-3.5 pt-1.5 border-t border-navy-50 dark:border-carbon-800">
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-1 tracking-wider">Employment Status</label>
                  <select 
                    value={formData.employment_status}
                    onChange={(e) => setFormData({
                      ...formData, 
                      employment_status: e.target.value,
                      is_active: e.target.value === 'Active'
                    })}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Terminated / Inactive</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 pt-5">
                  <input 
                    type="checkbox" 
                    id="isActiveCheck"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({
                      ...formData, 
                      is_active: e.target.checked,
                      employment_status: e.target.checked ? 'Active' : 'Inactive'
                    })}
                    className="w-4 h-4 text-navy-900 accent-navy-900 border-navy-400 dark:border-carbon-700 rounded cursor-pointer"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-semibold text-navy-800 dark:text-carbon-300 cursor-pointer select-none">
                    Active System Access
                  </label>
                </div>
              </div>
              
              {/* DRIVER-SPECIFIC SECTION */}
              {formData.employee_role_id === 'er-1' && (
                <div className="pt-3.5 border-t-2 border-purple-100/50 dark:border-carbon-800/40 space-y-3.5">
                  <h4 className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                    <IdCard className="w-4 h-4 shrink-0" /> Operator Licensing Fields
                  </h4>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-purple-500 uppercase mb-1 tracking-wider">License Number</label>
                      <input 
                        type="text" 
                        value={formData.license_number}
                        onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                        className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-500"
                        placeholder="DL-NCR-123456"
                        required={formData.employee_role_id === 'er-1'}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-500 uppercase mb-1 tracking-wider">License Expiry</label>
                      <input 
                        type="date" 
                        value={formData.license_expiry}
                        onChange={(e) => setFormData({...formData, license_expiry: e.target.value})}
                        className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                        required={formData.employee_role_id === 'er-1'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-purple-500 uppercase mb-1 tracking-wider">Availability state</label>
                      <select 
                        value={formData.availability_status}
                        onChange={(e) => setFormData({...formData, availability_status: e.target.value})}
                        className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Resting">Resting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-500 uppercase mb-1 tracking-wider">License Constraints / Notes</label>
                      <input 
                        type="text" 
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                        placeholder="Restricted to NCR RORO loops..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FORMS CTA */}
              <div className="pt-4 flex gap-3 border-t border-navy-50 dark:border-carbon-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-navy-200 dark:bg-carbon-800 dark:border-carbon-700 hover:bg-navy-50 dark:hover:bg-carbon-700 text-navy-700 dark:text-white py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-navy-900 dark:bg-white text-white dark:text-black hover:opacity-90 py-2 rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                >
                  {editingId ? 'Save Profile' : 'Register Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
