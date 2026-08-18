import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  TruckStatusType,
  Trip,
  Branch,
  LoadType,
  TruckStatus,
  MaintenanceLog,
  VehicleStatusLog,
} from '../types';
import { services } from '../services';
import { permissionActions, permissionResources, usePermissions } from '../permissions';
import { statusToneClasses } from '../design/statusTokens';
import { uiClasses } from '../design/tokens';
import { Button, FormField, Modal, SearchInput, StatusBadge } from './ui';
import {
  Plus,
  Edit2,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
  History,
  Wrench,
  Calendar,
  MapPin,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  Layers,
  Navigation,
} from 'lucide-react';

interface TruckListProps {
  trucks: Truck[];
  onAdd: (truck: any) => void | Promise<void>;
  onUpdate: (truck: Truck) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  theme?: 'light' | 'dark';
  trips?: Trip[];
}

const TruckList: React.FC<TruckListProps> = ({
  trucks,
  onAdd,
  onUpdate,
  onRefresh,
  isLoading = false,
  error = null,
  theme,
  trips = [],
}) => {
  const permissions = usePermissions();
  const canCreateTruck = permissions.can(permissionActions.create, permissionResources.trucks);
  const canUpdateTruck = permissions.can(permissionActions.update, permissionResources.trucks);
  const canChangeTruckStatus = permissions.can(permissionActions.statusChange, permissionResources.trucks);
  const canDeactivateTruck = permissions.can(permissionActions.deactivate, permissionResources.trucks);
  const canReactivateTruck = permissions.can(permissionActions.reactivate, permissionResources.trucks);

  // UI & Selection States
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'status_logs'>('details');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ title: string; body: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [lifecycleReason, setLifecycleReason] = useState('');
  const lifecycleReasonRef = useRef('');
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  // Reference tables are fetched through the typed data service.
  const [loadTypes, setLoadTypes] = useState<LoadType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [truckStatuses, setTruckStatuses] = useState<TruckStatus[]>([]);

  // Logs state for chosen truck
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [statusLogs, setStatusLogs] = useState<VehicleStatusLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [expiringFilter, setExpiringFilter] = useState(false);

  // Form States
  const initialFormState = {
    plate_number: '',
    vin: '',
    truck_size: '10-Wheeler Wing',
    load_type_id: '',
    truck_status_id: 'ts-avail',
    registration_expiry: '2027-12-31',
    is_active: true,
    remarks: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Maintenance log form state
  const initialMaintState = {
    maintenance_type: 'Preventive',
    status: 'In Progress',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost_amount: '',
    notes: '',
  };
  const [maintFormData, setMaintFormData] = useState(initialMaintState);

  // Fetch static reference metadata once
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [lt, br, ts] = await Promise.all([
          services.data.getLoadTypes(),
          services.data.getBranches(),
          services.data.getTruckStatuses(),
        ]);
        setLoadTypes(lt);
        setBranches(br);
        setTruckStatuses(ts);

        // Load capability is part of the supported Phase 3A vehicle contract.
        if (lt.length > 0) {
          setFormData((prev) => ({
            ...prev,
            load_type_id: lt[0].id,
          }));
        }
      } catch (err) {
        console.error('Failed to load schema reference catalogs', err);
      }
    };
    fetchReferences();
  }, []);

  // Load specific logs when selection changes
  useEffect(() => {
    if (selectedTruckId) {
      const loadHistory = async () => {
        setIsLoadingLogs(true);
        try {
          const [mList, sList] = await Promise.all([
            services.data.getMaintenanceLogs(selectedTruckId),
            services.data.getVehicleStatusLogs(selectedTruckId),
          ]);
          setMaintenanceLogs(mList);
          setStatusLogs(sList);
        } catch (err) {
          console.error('Failed to load logs for vehicle', err);
        } finally {
          setIsLoadingLogs(false);
        }
      };
      loadHistory();
    }
  }, [selectedTruckId]);

  // Expiry date checker (30 days from 2026-06-15)
  const isExpiringWithin30Days = (expiryStr?: string) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    const today = new Date('2026-06-15'); // Fixed system benchmark date
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    return expiry >= today && expiry <= limit;
  };

  const isExpired = (expiryStr?: string) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    const today = new Date('2026-06-15');
    return expiry < today;
  };

  // A vehicle cannot be deactivated while it has an unreleased operational assignment.
  const getActiveTripUsingTruck = (truckId: string) => {
    const activeStates = new Set([
      'status-sched',
      'status-inprogress',
      'status-rescue',
      'status-backload',
      'Scheduled',
      'In Progress',
      'Rescue',
      'Backload',
    ]);
    return trips.find((trip) => {
      const associatedId = String(trip.truck_id || '');
      return associatedId === String(truckId) && activeStates.has(String(trip.status ?? trip.status_id));
    });
  };

  // Add / Edit Truck Modal trigger
  const handleOpenModal = (truck?: Truck) => {
    if ((truck && !canUpdateTruck) || (!truck && !canCreateTruck)) return;
    if (truck) {
      setEditingId(truck.id);
      setFormData({
        plate_number: truck.plate_number || truck.license_plate || '',
        vin: truck.vin || '',
        truck_size: truck.truck_size || '10-Wheeler Wing',
        load_type_id: truck.load_type_id || loadTypes[0]?.id || '',
        truck_status_id: truck.truck_status_id || 'ts-avail',
        registration_expiry: truck.registration_expiry || '2027-12-31',
        is_active: truck.is_active !== false,
        remarks: truck.remarks || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        ...initialFormState,
        load_type_id: loadTypes[0]?.id || '',
      });
    }
    setIsModalOpen(true);
  };

  // Submit Truck Info
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((editingId && !canUpdateTruck) || (!editingId && !canCreateTruck)) return;

    // Check business rules if attempting to deactivate via edit modal
    if (editingId && !formData.is_active) {
      const activeTrip = getActiveTripUsingTruck(editingId);
      if (activeTrip) {
        setAlertMessage({
          title: 'Deactivation Blocked',
          body: `Cannot deactivate truck ${formData.plate_number} as it is currently assigned to active Trip run ${activeTrip.trip_advise_code} which is in status 'In Progress'.`,
        });
        return;
      }
    }

    const dataToSubmit: any = {
      ...formData,
      // backwards compatibility mappings
      license_plate: formData.plate_number,
      status: truckStatuses.find((s) => s.id === formData.truck_status_id)?.truck_status_code || 'Available',
    };

    try {
      if (editingId) {
        await onUpdate({ ...dataToSubmit, id: editingId });
      } else {
        await onAdd(dataToSubmit);
      }
      setIsModalOpen(false);
    } catch (submitError) {
      setAlertMessage({
        title: 'Truck update unavailable',
        body:
          submitError instanceof Error
            ? submitError.message
            : 'The development service denied or could not complete this request. Form values were preserved.',
      });
    }
  };

  // Quick deactivation from the detail panel/list or soft-delete trigger
  const handleToggleActiveState = async (truck: Truck, targetActive: boolean) => {
    if (targetActive ? !canReactivateTruck : !canDeactivateTruck) return;

    if (!targetActive) {
      // Check active trips
      const activeTrip = getActiveTripUsingTruck(truck.id);
      if (activeTrip) {
        setAlertMessage({
          title: 'Deactivation Restricted',
          body: `Truck ${truck.plate_number || truck.license_plate} is currently hauling active Run ${activeTrip.trip_advise_code} [In Progress]. Deactivation is restricted until completion.`,
        });
        return;
      }

      setConfirmAction({
        title: 'Confirm Truck Deactivation',
        message: `Are you sure you want to deactivate truck ${truck.plate_number || truck.license_plate}? It will be removed from new operational assignment choices while historical references remain readable.`,
        confirmLabel: 'Confirm deactivation',
        onConfirm: async () => {
          if (!lifecycleReasonRef.current.trim()) {
            setLifecycleError('Provide a reason before deactivating this vehicle.');
            return;
          }
          await services.vehicles.deactivate({ vehicleId: truck.id, reason: lifecycleReasonRef.current });
          setLifecycleReason('');
          lifecycleReasonRef.current = '';
          setConfirmAction(null);
          await onRefresh();
        },
      });
    } else {
      setConfirmAction({
        title: 'Confirm Vehicle Reactivation',
        message: `Provide a reason before returning ${truck.plate_number || truck.license_plate} to the Available pool.`,
        confirmLabel: 'Confirm reactivation',
        onConfirm: async () => {
          if (!lifecycleReasonRef.current.trim()) {
            setLifecycleError('Provide a reason before reactivating this vehicle.');
            return;
          }
          await services.vehicles.reactivate({ vehicleId: truck.id, reason: lifecycleReasonRef.current });
          setLifecycleReason('');
          lifecycleReasonRef.current = '';
          setConfirmAction(null);
          await onRefresh();
        },
      });
    }
  };

  // Add Maintenance Log Entry
  const handleAddMaintenanceLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckId || !canUpdateTruck) return;

    try {
      const statusByLegacyLabel = {
        Open: 'OPEN',
        'In Progress': 'IN_PROGRESS',
        Completed: 'COMPLETED',
        Cancelled: 'CANCELLED',
      } as const;
      await services.vehicles.addMaintenance({
        vehicleId: selectedTruckId,
        type: maintFormData.maintenance_type,
        status: statusByLegacyLabel[maintFormData.status as keyof typeof statusByLegacyLabel] ?? 'OPEN',
        scheduledDate: maintFormData.scheduled_date,
        completedAt: maintFormData.status === 'Completed' ? new Date().toISOString() : undefined,
        costAmount: maintFormData.cost_amount ? Number(maintFormData.cost_amount) : undefined,
        notes: maintFormData.notes || undefined,
      });

      // Auto upgrade truck status to 'Maintenance' if the maintenance status is In Progress
      if (maintFormData.status === 'In Progress') {
        const truck = trucks.find((t) => t.id === selectedTruckId);
        if (truck && truck.truck_status_id !== 'ts-maint') {
          await services.vehicles.changeStatus(selectedTruckId, 'MAINTENANCE', 'Maintenance record is in progress.');
          await onRefresh();
          // Refresh vehicle logs
          const freshLogs = await services.data.getVehicleStatusLogs(selectedTruckId);
          setStatusLogs(freshLogs);
        }
      }

      setIsMaintModalOpen(false);
      setMaintFormData(initialMaintState);
    } catch (err) {
      console.error(err);
    }
  };

  // Simple direct Status modification from details dashboard
  const handleDirectStatusChange = async (truckId: string, newStatusId: string) => {
    if (!canChangeTruckStatus) return;
    try {
      const statusById = {
        'ts-avail': 'AVAILABLE',
        'ts-use': 'IN_USE',
        'ts-maint': 'MAINTENANCE',
        'ts-inactive': 'INACTIVE',
      } as const;
      await services.vehicles.changeStatus(
        truckId,
        statusById[newStatusId as keyof typeof statusById] ?? 'AVAILABLE',
        'Status changed from vehicle management.',
      );
      await onRefresh();

      // Update logs state
      const updatedLogs = await services.data.getVehicleStatusLogs(truckId);
      setStatusLogs(updatedLogs);
    } catch (err) {
      console.error(err);
    }
  };

  // Resolved status label shared by the list rows and the detail header.
  const statusCodeFor = (truck: Truck) =>
    truckStatuses.find((s) => s.id === truck.truck_status_id)?.truck_status_code || truck.status || 'Available';

  // Get current active selection details
  const currentTruck = trucks.find((t) => t.id === selectedTruckId);
  const currentTruckActiveTrip = currentTruck ? getActiveTripUsingTruck(currentTruck.id) : undefined;
  const deactivatePresentation = permissions.present(permissionActions.deactivate, permissionResources.trucks, {
    blockedReason: currentTruckActiveTrip
      ? `Deactivation is blocked while assigned to active trip ${currentTruckActiveTrip.trip_advise_code}.`
      : null,
  });
  const reactivatePresentation = permissions.present(permissionActions.reactivate, permissionResources.trucks);

  // Filtering local listings
  const filteredTrucks = trucks.filter((t) => {
    // Search query
    const term = searchQuery.toLowerCase();
    const plate = (t.plate_number || t.license_plate || '').toLowerCase();
    const vinCode = (t.vin || '').toLowerCase();
    const comments = (t.remarks || '').toLowerCase();
    const matchesSearch = plate.includes(term) || vinCode.includes(term) || comments.includes(term);

    // Status filter
    const matchesStatus = statusFilter === 'All' || t.truck_status_id === statusFilter;

    // Branch filter
    const matchesBranch = branchFilter === 'All' || t.branch_id === branchFilter;

    // Size filter
    const matchesSize = sizeFilter === 'All' || t.truck_size === sizeFilter;

    // Expiry within 30 days filter
    const matchesExpiry = !expiringFilter || isExpiringWithin30Days(t.registration_expiry);

    return matchesSearch && matchesStatus && matchesBranch && matchesSize && matchesExpiry;
  });

  // Sizes checklist
  const sizesList = Array.from(new Set(trucks.map((t) => t.truck_size).filter(Boolean)));

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setBranchFilter('All');
    setSizeFilter('All');
    setExpiringFilter(false);
  };

  return (
    <div className="flex h-full bg-navy-50 dark:bg-carbon-950 transition-colors duration-300">
      {/* LEFT PORTION: FILTERS & SCROLLABLE VEHICLE LIST */}
      <div className="flex-1 min-w-0 flex flex-col bg-white/80 dark:bg-carbon-900/50 backdrop-blur-md h-full">
        {/* Top Header Controls area */}
        <div className="p-4 border-b border-navy-100 dark:border-carbon-800/80 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white font-sans tracking-tight">
                Cargo Fleet Directory
              </h2>
              <p className="text-xs text-navy-500 dark:text-carbon-400">
                Manage dynamic heavy equipment transport units.
              </p>
            </div>

            {canCreateTruck && (
              <Button
                icon={<Plus aria-hidden="true" className="w-3.5 h-3.5" />}
                id="btn-register-vehicle"
                onClick={() => handleOpenModal()}
                size="sm"
              >
                Add truck
              </Button>
            )}
          </div>

          {/* Search bar & compact sliders trigger */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchInput
                aria-label="Search vehicles"
                id="search-truck-input"
                onChange={setSearchQuery}
                placeholder="Search plate code, VIN, remarks..."
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

          {/* Multi-parameter dynamic filtering shelf */}
          {isFilterOpen && (
            <div className="space-y-3 pt-1">
              <div className="flex justify-end">
                <Button
                  icon={<X aria-hidden="true" className="w-3.5 h-3.5" />}
                  onClick={handleResetFilters}
                  size="sm"
                  variant="secondary"
                >
                  Clear Filters
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Status Select */}
                <FormField label="Status">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`${uiClasses.field} cursor-pointer`}
                  >
                    <option value="All">All Statuses</option>
                    {truckStatuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.truck_status_code}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Branch Select */}
                <FormField label="Branch Hub">
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className={`${uiClasses.field} cursor-pointer`}
                  >
                    <option value="All">All Hubs</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_code}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Truck Size Select */}
                <FormField label="Size Spec">
                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className={`${uiClasses.field} cursor-pointer`}
                  >
                    <option value="All">All Sizes</option>
                    {sizesList.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Registration expiry 30-day filter toggle */}
                <div className="flex flex-col justify-end">
                  <Button
                    aria-pressed={expiringFilter}
                    className="w-full"
                    icon={<Calendar aria-hidden="true" className="w-3 h-3" />}
                    onClick={() => setExpiringFilter((prev) => !prev)}
                    size="sm"
                    variant={expiringFilter ? 'warning' : 'secondary'}
                  >
                    Expiring &lt; 30d
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable List Items container */}
        <div className="flex-1 overflow-y-auto divide-y divide-navy-50 dark:divide-carbon-800/60">
          {error ? (
            <div className="p-16 text-center text-red-600 max-w-sm mx-auto">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
              <p className="text-sm font-semibold">System Diagnostics Alert</p>
              <p className="text-xs text-red-400 mt-1">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="p-16 text-center text-navy-400 font-medium">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-navy-600" />
              <p className="text-xs">Accessing telemetry fleet logs...</p>
            </div>
          ) : filteredTrucks.length === 0 ? (
            <div className="p-16 text-center max-w-sm mx-auto">
              <AlertCircle className="w-10 h-10 text-navy-300 dark:text-carbon-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-navy-800 dark:text-white">
                No active transporters match selection
              </p>
              <p className="text-xs text-navy-500 dark:text-carbon-400 mt-1">
                Try broadening your search query parameters or disabling the active filter presets.
              </p>
              {expiringFilter && (
                <Button className="mt-4" onClick={() => setExpiringFilter(false)} size="sm" variant="ghost">
                  Disable Expiring filter
                </Button>
              )}
            </div>
          ) : (
            filteredTrucks.map((truck) => {
              const isActiveSelection = truck.id === selectedTruckId;
              const isExpiredUnit = isExpired(truck.registration_expiry);
              const isSoonExpiring = isExpiringWithin30Days(truck.registration_expiry);
              const isDeactivated = truck.is_active === false;
              const matchingBranch = branches.find((b) => b.id === truck.branch_id);

              return (
                <div
                  key={truck.id}
                  onClick={() => setSelectedTruckId(truck.id)}
                  className={`p-4 transition-all cursor-pointer border-l-2 flex justify-between items-start select-none
                    ${
                      isActiveSelection
                        ? 'bg-blue-50/30 dark:bg-carbon-800/40 border-l-blue-700'
                        : 'hover:bg-navy-50/20 dark:hover:bg-carbon-900/20 border-l-transparent'
                    }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900 dark:text-white tracking-tight">
                        {truck.plate_number || truck.license_plate}
                      </span>
                      <StatusBadge hideCue label={statusCodeFor(truck)} status={statusCodeFor(truck)} />
                      {isDeactivated && <StatusBadge hideCue label="Deactivated" status="INACTIVE" />}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-navy-500 dark:text-carbon-400 font-sans">
                      <span className="font-mono text-zinc-400 text-[10px]">{truck.vin}</span>
                      <span>•</span>
                      <span>{truck.truck_size}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-navy-500 dark:text-carbon-500">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{matchingBranch?.branch_name || 'Global HQ Operations'}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    {/* Expiry alerts */}
                    {isExpiredUnit ? (
                      <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold justify-end uppercase">
                        <AlertTriangle className="w-3 h-3" /> LTO Expired!
                      </div>
                    ) : isSoonExpiring ? (
                      <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold justify-end uppercase">
                        <AlertCircle className="w-3 h-3" /> LTO Renew &lt; 30d
                      </div>
                    ) : null}

                    <div className="text-[10px] font-mono text-navy-400 dark:text-carbon-500 uppercase">
                      LTO: {truck.registration_expiry || 'No Record'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TRUCK RIGHT-SIDE DETAIL PANEL */}
      {currentTruck && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs lg:static lg:z-auto lg:block lg:w-[420px] lg:shrink-0 lg:!bg-transparent lg:backdrop-blur-none">
          <div className="w-full sm:w-[420px] lg:w-full h-full bg-navy-50 dark:bg-carbon-950 border-l border-navy-200 dark:border-carbon-800 shadow-2xl lg:shadow-md flex flex-col overflow-hidden">
            {/* Header detail */}
            <div className="p-6 bg-white dark:bg-carbon-900 border-b border-navy-200 dark:border-carbon-800/80 shrink-0">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-extra-bold font-sans tracking-tight text-navy-900 dark:text-white uppercase">
                      {currentTruck.plate_number || currentTruck.license_plate}
                    </h1>
                    <StatusBadge label={statusCodeFor(currentTruck)} status={statusCodeFor(currentTruck)} />
                  </div>
                  <p className="text-xs text-navy-500 dark:text-carbon-400 font-mono tracking-wide uppercase">
                    VIN SERIAL KEY: {currentTruck.vin || 'N/A'}
                  </p>
                </div>

                <div className="flex gap-2">
                  {canUpdateTruck && (
                    <Button
                      icon={<Edit2 aria-hidden="true" className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenModal(currentTruck)}
                      size="sm"
                      title="Edit specifications"
                      variant="secondary"
                    >
                      Specs
                    </Button>
                  )}
                  {currentTruck.is_active !== false
                    ? deactivatePresentation.visible && (
                        <Button
                          disabled={deactivatePresentation.disabled}
                          icon={<ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
                          onClick={() => handleToggleActiveState(currentTruck, false)}
                          size="sm"
                          title={deactivatePresentation.reason ?? 'Deactivate truck'}
                          variant="danger"
                        >
                          Deactivate Truck
                        </Button>
                      )
                    : reactivatePresentation.visible && (
                        <Button
                          icon={<CheckCircle aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
                          onClick={() => handleToggleActiveState(currentTruck, true)}
                          size="sm"
                          variant="success"
                        >
                          Reactivate Unit
                        </Button>
                      )}
                  <Button
                    aria-label="Close truck details"
                    icon={<X aria-hidden="true" className="w-4 h-4" />}
                    onClick={() => {
                      setSelectedTruckId(null);
                      setActiveTab('details');
                    }}
                    size="icon"
                    title="Close truck details"
                    variant="secondary"
                  />
                </div>
              </div>

              {/* Dynamic Tabs selectors */}
              <div className="flex gap-4 mt-6 border-b border-navy-100 dark:border-carbon-900/40 text-sm">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2.5 font-semibold text-xs uppercase tracking-wider relative transition-all
                    ${
                      activeTab === 'details'
                        ? 'text-navy-900 dark:text-white border-b-2 border-blue-600'
                        : 'text-navy-500 dark:text-carbon-400 hover:text-navy-800 dark:hover:text-white'
                    }`}
                >
                  Specifications Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`pb-2.5 font-semibold text-xs uppercase tracking-wider relative transition-all flex items-center gap-1.5
                    ${
                      activeTab === 'maintenance'
                        ? 'text-navy-900 dark:text-white border-b-2 border-blue-600'
                        : 'text-navy-500 dark:text-carbon-400 hover:text-navy-800 dark:hover:text-white'
                    }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-500" /> Maintenance History
                </button>
                <button
                  onClick={() => setActiveTab('status_logs')}
                  className={`pb-2.5 font-semibold text-xs uppercase tracking-wider relative transition-all flex items-center gap-1.5
                    ${
                      activeTab === 'status_logs'
                        ? 'text-navy-900 dark:text-white border-b-2 border-blue-600'
                        : 'text-navy-500 dark:text-carbon-400 hover:text-navy-800 dark:hover:text-white'
                    }`}
                >
                  <History className="w-3.5 h-3.5 text-blue-500" /> Vehicle Status Log
                </button>
              </div>
            </div>

            {/* TAB CORRESPONDING PANELS */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: DETAILS DASHBOARD */}
              {activeTab === 'details' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Status Banner Alarm Callout */}
                  {currentTruck.truck_status_id === 'ts-inactive' && (
                    <div className="p-3 bg-neutral-100 dark:bg-carbon-900 border border-neutral-200 dark:border-carbon-800 text-neutral-700 dark:text-carbon-400 rounded-lg text-xs flex gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-neutral-500" />
                      <div>
                        <h4 className="font-bold">Fleet Unit Unavailable</h4>
                        <p>
                          This transport asset is flagged as de-commissioned or inactive. It is automatically withheld
                          from scheduling dropdowns.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Specification list Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-white dark:bg-carbon-900/45 p-4 rounded-xl border border-navy-200 dark:border-carbon-900 shadow-sm text-xs">
                    <div>
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        License Plate Code
                      </span>
                      <p className="font-bold text-sm text-navy-900 dark:text-white mt-1 uppercase">
                        {currentTruck.plate_number || currentTruck.license_plate}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        VIN Chassis Serial
                      </span>
                      <p className="font-mono text-xs text-navy-800 dark:text-carbon-300 mt-1">
                        {currentTruck.vin || 'UNASSIGNED CHASSIS'}
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        Size & Weight Capacity
                      </span>
                      <p className="font-semibold text-navy-800 dark:text-carbon-300 mt-1">
                        {currentTruck.truck_size || 'Heavy Wings Carrier'}
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        Category Capacity (Tons equivalent)
                      </span>
                      <p className="font-semibold text-navy-800 dark:text-carbon-300 mt-1">
                        {currentTruck.tonner_capacity ||
                          (currentTruck.truck_size ? parseInt(currentTruck.truck_size) || 10 : 10)}{' '}
                        Tonner
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3 col-span-2">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        Load capability classification
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {loadTypes.map((lt) => {
                          const isAssigned = currentTruck.load_type_id === lt.id;
                          return (
                            <span
                              key={lt.id}
                              className={`text-[9.5px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1
                                ${
                                  isAssigned
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                    : 'bg-navy-50/20 dark:bg-carbon-900 border-dashed border-navy-200 dark:border-carbon-800 text-navy-400 dark:text-carbon-500 opacity-60'
                                }`}
                            >
                              {isAssigned && <Check className="w-2.5 h-2.5" />}
                              {lt.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        Base Operations Hub
                      </span>
                      <p className="font-semibold text-navy-800 dark:text-carbon-300 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        {branches.find((b) => b.id === currentTruck.branch_id)?.branch_name || 'Unassigned Hub'}
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        LTO Registration expiry
                      </span>
                      <p
                        className={`font-semibold mt-1 font-mono
                        ${
                          isExpired(currentTruck.registration_expiry)
                            ? 'text-red-600 font-bold'
                            : isExpiringWithin30Days(currentTruck.registration_expiry)
                              ? 'text-amber-500 font-bold'
                              : 'text-navy-800 dark:text-carbon-300'
                        }`}
                      >
                        {currentTruck.registration_expiry || 'No Record'}
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3 col-span-2">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide font-sans">
                        Active Scheduler Status Flag
                      </span>
                      <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-3 h-3 rounded-full ${currentTruck.is_active !== false ? 'bg-emerald-500' : 'bg-red-400 animate-pulse'}`}
                          ></div>
                          <span className="font-bold text-navy-900 dark:text-white uppercase tracking-wider text-[11px]">
                            {currentTruck.is_active !== false ? 'Commissioned / Active' : 'Deactivated'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3 col-span-2">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">
                        Corporate / Mechanical Remarks
                      </span>
                      <p className="text-navy-600 dark:text-carbon-400 mt-1 italic font-sans break-words bg-navy-50/30 dark:bg-carbon-900/60 p-2 rounded-lg">
                        {currentTruck.remarks || 'No remarks recorded for this fleet container transporter.'}
                      </p>
                    </div>
                  </div>

                  {/* Quick update active status dropdown directly */}
                  {canChangeTruckStatus && (
                    <div className="bg-amber-50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 space-y-3">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Quick Dispatch Operational Control
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Mutate the active dispatch availability status immediately. Any changes will register in the
                        Audit Vehicle Status Logs for maintenance and tracking.
                      </p>
                      <div className="flex gap-2">
                        {truckStatuses.map((statusObj) => {
                          const isActive = currentTruck.truck_status_id === statusObj.id;
                          return (
                            <Button
                              aria-pressed={isActive}
                              className="flex-1"
                              key={statusObj.id}
                              onClick={() => handleDirectStatusChange(currentTruck.id, statusObj.id)}
                              size="sm"
                              variant={isActive ? 'warning' : 'secondary'}
                            >
                              {statusObj.truck_status_code}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Logistics active trips details */}
                  <div className="bg-white dark:bg-carbon-900/40 p-4 rounded-xl border border-navy-200 dark:border-carbon-900/60 space-y-3">
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                      Trip scheduling allocation
                    </h4>
                    {(() => {
                      const activeTrip = getActiveTripUsingTruck(currentTruck.id);
                      if (activeTrip) {
                        return (
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs flex gap-2">
                            <Navigation className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                              <p className="font-bold">Active Cargo Allocation</p>
                              <p className="mt-1">
                                This truck is dispatched on active Run{' '}
                                <span className="underline font-bold font-mono">{activeTrip.trip_advise_code}</span>.
                              </p>
                              <p className="mt-0.5 font-mono text-[10px]">Pickup Date: {activeTrip.pickup_date}</p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <p className="text-xs text-navy-500 dark:text-carbon-400 italic">
                          No Active "In Progress" heavy cargo trips allocated to this truck right now.
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: MAINTENANCE HISTORY */}
              {activeTab === 'maintenance' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center bg-navy-100/50 dark:bg-carbon-900/30 p-2.5 rounded-lg border border-navy-200/40 dark:border-carbon-800">
                    <div>
                      <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                        Historical Repair & Service Tickets
                      </h4>
                      <p className="text-[10px] text-navy-500 mt-0.5">
                        Logs of diagnostic overhaul, PPM, and inspections.
                      </p>
                    </div>
                    {canUpdateTruck && (
                      <Button
                        icon={<Plus aria-hidden="true" className="w-3 h-3" />}
                        onClick={() => setIsMaintModalOpen(true)}
                        size="sm"
                      >
                        Log Work Order
                      </Button>
                    )}
                  </div>

                  {isLoadingLogs ? (
                    <div className="py-12 text-center text-xs text-navy-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading maintenance histories...
                    </div>
                  ) : maintenanceLogs.length === 0 ? (
                    <div className="text-center py-12 p-4 bg-white dark:bg-carbon-900/30 border-2 border-dashed border-navy-200 dark:border-carbon-800 rounded-xl">
                      <Wrench className="w-8 h-8 text-navy-300 dark:text-carbon-700 mx-auto mb-2" />
                      <h5 className="font-bold text-xs text-navy-800 dark:text-white uppercase">Clean Telemetry</h5>
                      <p className="text-[10.5px] text-navy-500 dark:text-carbon-400 mt-1">
                        No preventive/repair log indexes created for this transporter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {maintenanceLogs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-white dark:bg-carbon-900 p-4 rounded-lg border border-navy-200 dark:border-carbon-800/60 text-xs shadow-sm space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <span
                              className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border
                              ${
                                log.maintenance_type === 'Repair'
                                  ? statusToneClasses.error
                                  : log.maintenance_type === 'Inspection'
                                    ? statusToneClasses.info
                                    : log.maintenance_type === 'Preventive'
                                      ? statusToneClasses.success
                                      : statusToneClasses.neutral
                              }`}
                            >
                              {log.maintenance_type}
                            </span>
                            <span className="font-mono text-zinc-400 text-[9px]">ID: {log.id}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-navy-50 dark:border-carbon-800/80">
                            <div>
                              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">
                                Work Status
                              </span>
                              <span
                                className={`font-semibold inline-flex items-center gap-1 text-[10.5px] mt-0.5
                                ${log.status === 'Completed' ? 'text-emerald-600' : 'text-amber-500 font-bold animate-pulse'}`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${log.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                ></div>
                                {log.status}
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">
                                Logged Date
                              </span>
                              <span className="font-semibold text-navy-800 dark:text-carbon-300 font-mono inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-navy-400 shrink-0" />
                                {log.scheduled_date || 'N/A'}
                              </span>
                            </div>

                            {log.cost_amount !== undefined && (
                              <div>
                                <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">
                                  Cost Amount
                                </span>
                                <span className="font-bold text-navy-900 dark:text-emerald-400 inline-flex items-center gap-0.5">
                                  ₱{log.cost_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}

                            {log.odometer !== undefined && (
                              <div>
                                <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">
                                  Odometer Log
                                </span>
                                <span className="font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
                                  {log.odometer.toLocaleString()} KM
                                </span>
                              </div>
                            )}

                            {log.vendor_mechanic && (
                              <div className="col-span-2">
                                <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">
                                  Mechanic / Repair Vendor
                                </span>
                                <span className="font-semibold text-navy-800 dark:text-carbon-300 mt-0.5 block">
                                  {log.vendor_mechanic}
                                </span>
                              </div>
                            )}
                          </div>

                          {log.notes && (
                            <div className="bg-navy-50/10 dark:bg-carbon-950/40 p-2.5 rounded text-navy-700 dark:text-carbon-400 italic break-words mt-1 border-l-2 border-amber-400">
                              {log.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STATUS CHANGE LOGS */}
              {activeTab === 'status_logs' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                      Chronological Status Audit Trail
                    </h4>
                    <p className="text-[10px] text-navy-500 mt-0.5">
                      Audit log of telemetry and administrative transitions.
                    </p>
                  </div>

                  {isLoadingLogs ? (
                    <div className="py-12 text-center text-xs text-navy-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading status log trail...
                    </div>
                  ) : statusLogs.length === 0 ? (
                    <div className="text-center py-12 p-3 bg-white dark:bg-carbon-900/30 border-2 border-dashed border-navy-200 dark:border-carbon-800 rounded-xl">
                      <History className="w-8 h-8 text-navy-300 dark:text-carbon-700 mx-auto mb-2" />
                      <p className="text-[10.5px] text-navy-500 dark:text-carbon-400">
                        No status adjustments logged for this equipment.
                      </p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-navy-100 dark:border-carbon-800 space-y-6 pt-2">
                      {statusLogs.map((log, index) => {
                        const oldMatch =
                          truckStatuses.find((s) => s.id === log.old_status_id)?.truck_status_code || 'Available';
                        const newMatch =
                          truckStatuses.find((s) => s.id === log.new_status_id)?.truck_status_code || 'Inactive';
                        const isLatest = index === 0;

                        return (
                          <div key={log.id} className="relative text-xs">
                            {/* Dot */}
                            <div
                              className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center z-10
                              ${isLatest ? 'border-blue-600 scale-110 shadow-sm' : 'border-navy-300'}`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-blue-600' : 'bg-navy-400'}`}
                              ></div>
                            </div>

                            <span className="text-[10px] font-mono text-zinc-400 block">
                              {new Date(log.changed_at).toLocaleString()}
                            </span>

                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-navy-500 dark:text-carbon-400">{oldMatch}</span>
                              <span className="text-zinc-400 text-[10px]">➔</span>
                              <span className="font-bold text-navy-900 dark:text-white bg-blue-50/50 dark:bg-blue-950/10 px-1.5 py-0.5 rounded border border-blue-100/30">
                                {newMatch}
                              </span>
                            </div>

                            {log.reason && (
                              <p className="mt-1.5 text-navy-600 dark:text-carbon-400 font-sans text-[11px] bg-white dark:bg-carbon-900/40 p-2 rounded border border-navy-100/40 dark:border-carbon-800/40">
                                {log.reason}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ALERT DIALOG (RESTRICTION BLOCK) */}
      <Modal
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setAlertMessage(null)} size="sm">
              Acknowledge Protocol
            </Button>
          </div>
        }
        onClose={() => setAlertMessage(null)}
        open={Boolean(alertMessage)}
        size="sm"
        title={
          <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle aria-hidden="true" className="w-5 h-5 shrink-0" />
            {alertMessage?.title}
          </span>
        }
      >
        <p className="text-xs text-navy-700 dark:text-carbon-400 font-sans leading-relaxed">{alertMessage?.body}</p>
      </Modal>

      {/* CONFIRMATION DIALOG */}
      <Modal
        description={confirmAction?.message}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setLifecycleReason('');
                lifecycleReasonRef.current = '';
                setLifecycleError(null);
                setConfirmAction(null);
              }}
              size="sm"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={() => confirmAction?.onConfirm()} size="sm" variant="danger">
              {confirmAction?.confirmLabel}
            </Button>
          </div>
        }
        onClose={() => {
          setLifecycleReason('');
          lifecycleReasonRef.current = '';
          setLifecycleError(null);
          setConfirmAction(null);
        }}
        open={Boolean(confirmAction)}
        size="sm"
        title={
          <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle aria-hidden="true" className="w-5 h-5 shrink-0" />
            {confirmAction?.title}
          </span>
        }
      >
        {/* The reason keeps its own label and live error wiring so the blocked
            submit stays announced to assistive technology. */}
        <label className="block text-xs font-semibold text-navy-700 dark:text-carbon-300">
          Reason
          <textarea
            value={lifecycleReason}
            onChange={(event) => {
              setLifecycleReason(event.target.value);
              lifecycleReasonRef.current = event.target.value;
              setLifecycleError(null);
            }}
            aria-invalid={Boolean(lifecycleError)}
            aria-describedby={lifecycleError ? 'vehicle-lifecycle-reason-error' : undefined}
            className={`mt-1 ${uiClasses.field}`}
          />
        </label>
        {lifecycleError && (
          <p id="vehicle-lifecycle-reason-error" role="alert" className="mt-2 text-xs font-semibold text-red-700">
            {lifecycleError}
          </p>
        )}
      </Modal>

      {/* WORK ORDER (MAINTENANCE) LOG SLIDE MODAL */}
      <Modal
        onClose={() => setIsMaintModalOpen(false)}
        open={isMaintModalOpen}
        size="md"
        title={
          <span className="flex items-center gap-1.5">
            <Wrench aria-hidden="true" className="w-4 h-4 text-amber-500" />
            Log Maintenance Work Order
          </span>
        }
      >
        <form onSubmit={handleAddMaintenanceLogSubmit} className="space-y-4 text-xs font-sans">
          <FormField label="Work Type">
            <select
              value={maintFormData.maintenance_type}
              onChange={(e) => setMaintFormData({ ...maintFormData, maintenance_type: e.target.value })}
              className={`${uiClasses.field} cursor-pointer`}
            >
              <option value="Preventive">Preventive</option>
              <option value="Repair">Repair</option>
              <option value="Inspection">Inspection</option>
              <option value="Registration">Registration</option>
            </select>
          </FormField>

          <FormField label="Current Status">
            <select
              value={maintFormData.status}
              onChange={(e) => setMaintFormData({ ...maintFormData, status: e.target.value })}
              className={`${uiClasses.field} cursor-pointer`}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Open">Open</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </FormField>

          <FormField label="Work Order Date" required>
            <input
              type="date"
              value={maintFormData.scheduled_date}
              onChange={(e) => setMaintFormData({ ...maintFormData, scheduled_date: e.target.value })}
              className={`${uiClasses.field} font-mono`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Expenses (₱ cost)">
              <input
                type="number"
                value={maintFormData.cost_amount}
                onChange={(e) => setMaintFormData({ ...maintFormData, cost_amount: e.target.value })}
                placeholder="e.g. 15000"
                className={`${uiClasses.field} font-mono`}
              />
            </FormField>
          </div>

          <FormField label="Mechanical Notes / Technical Details">
            <textarea
              value={maintFormData.notes}
              onChange={(e) => setMaintFormData({ ...maintFormData, notes: e.target.value })}
              placeholder="Describe repair logs, diagnostic fault codes, parts replaced..."
              rows={3}
              className={uiClasses.field}
            />
          </FormField>

          <div className="pt-2 flex gap-3">
            <Button className="flex-1" onClick={() => setIsMaintModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button className="flex-1" type="submit">
              Write Log Index
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT TRANSPORTER MODAL */}
      <Modal
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        size="lg"
        title={editingId ? 'Modify Fleet Transporter specs' : 'Register Vehicle Asset'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="License Plate Code" required>
              <input
                type="text"
                value={formData.plate_number}
                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                placeholder="GKL-9012"
                className={`${uiClasses.field} uppercase font-mono`}
              />
            </FormField>

            <FormField label="Chassis (VIN)" required>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="17-DIGIT CHASSIS KEY"
                className={`${uiClasses.field} uppercase font-mono`}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Transporter Size Spec">
              <select
                value={formData.truck_size}
                onChange={(e) => setFormData({ ...formData, truck_size: e.target.value })}
                className={`${uiClasses.field} cursor-pointer`}
              >
                <option value="10-Wheeler Wing">10-Wheeler Wing</option>
                <option value="6-Wheeler Closed">6-Wheeler Closed</option>
                <option value="12-Wheeler Reefer">12-Wheeler Reefer</option>
                <option value="10-Wheeler Reefer">10-Wheeler Reefer</option>
                <option value="Flatbed Trailer">Flatbed Trailer</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="LTO Registry Expiry" required>
              <input
                type="date"
                value={formData.registration_expiry}
                onChange={(e) => setFormData({ ...formData, registration_expiry: e.target.value })}
                className={`${uiClasses.field} font-mono`}
              />
            </FormField>

            <FormField label="Load Capability">
              <select
                value={formData.load_type_id}
                onChange={(e) => setFormData({ ...formData, load_type_id: e.target.value })}
                className={`${uiClasses.field} cursor-pointer`}
              >
                {loadTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <FormField label="Initial status">
              <select
                value={formData.truck_status_id}
                onChange={(e) => setFormData({ ...formData, truck_status_id: e.target.value })}
                className={`${uiClasses.field} cursor-pointer`}
              >
                {truckStatuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.truck_status_code}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex items-center gap-3 mt-3">
              <input
                type="checkbox"
                id="is_active_chk"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-blue-500 border-navy-200 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="is_active_chk"
                className="font-bold text-navy-800 dark:text-carbon-300 cursor-pointer select-none"
              >
                Asset is Active
              </label>
            </div>
          </div>

          <FormField label="Transporter Remarks & Details">
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Record custom administrative or mechanic logs regarding tires, engines..."
              rows={2}
              className={uiClasses.field}
            />
          </FormField>

          <div className="pt-2 flex gap-3">
            <Button className="flex-1" onClick={() => setIsModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button className="flex-1" type="submit">
              {editingId ? 'Save truck' : 'Add truck'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TruckList;
