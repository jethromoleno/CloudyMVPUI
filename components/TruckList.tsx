import React, { useState, useEffect } from 'react';
import { Truck, TruckStatusType, Trip, Branch, LoadType, TruckStatus, MaintenanceLog, VehicleStatusLog } from '../types';
import { api } from '../services/apiService';
import { 
  Plus, Edit2, Trash2, X, AlertTriangle, AlertCircle, CheckCircle, Loader2, 
  Search, Info, History, Wrench, Calendar, DollarSign, MapPin, 
  SlidersHorizontal, Check, ShieldCheck, Layers, Navigation
} from 'lucide-react';

interface TruckListProps {
  trucks: Truck[];
  onAdd: (truck: any) => void;
  onUpdate: (truck: Truck) => void;
  onDelete: (id: string | number) => void;
  isLoading?: boolean;
  error?: string | null;
  theme?: 'light' | 'dark';
  userRole?: string;
  trips?: Trip[];
}

const TruckList: React.FC<TruckListProps> = ({ 
  trucks, onAdd, onUpdate, onDelete, isLoading = false, error = null, theme, userRole, trips = [] 
}) => {
  const isWritable = userRole === 'SuperAdmin' || userRole === 'Admin';
  
  // UI & Selection States
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'status_logs'>('details');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ title: string; body: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Reference tables fetched from apiService
  const [loadTypes, setLoadTypes] = useState<LoadType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [truckStatuses, setTruckStatuses] = useState<TruckStatus[]>([]);

  // Logs state for chosen truck
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [statusLogs, setStatusLogs] = useState<VehicleStatusLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Filters State
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
    branch_id: '',
    is_active: true,
    remarks: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Maintenance log form state
  const initialMaintState = {
    maintenance_type: 'Preventive',
    status: 'In Progress',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost_amount: '',
    odometer: '',
    vendor_mechanic: '',
    notes: ''
  };
  const [maintFormData, setMaintFormData] = useState(initialMaintState);

  // Fetch static reference metadata once
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [lt, br, ts] = await Promise.all([
          api.getLoadTypes(),
          api.getBranches(),
          api.getTruckStatuses()
        ]);
        setLoadTypes(lt);
        setBranches(br);
        setTruckStatuses(ts);
        
        // Auto default the branch & load capability in initial state
        if (br.length > 0 && lt.length > 0) {
          setFormData(prev => ({
            ...prev,
            branch_id: br[0].id,
            load_type_id: lt[0].id
          }));
        }
      } catch (err) {
        console.error("Failed to load schema reference catalogs", err);
      }
    };
    fetchReferences();
  }, []);

  // Set default selected truck on load or state updates
  useEffect(() => {
    if (trucks.length > 0 && !selectedTruckId) {
      setSelectedTruckId(trucks[0].id);
    }
  }, [trucks, selectedTruckId]);

  // Load specific logs when selection changes
  useEffect(() => {
    if (selectedTruckId) {
      const loadHistory = async () => {
        setIsLoadingLogs(true);
        try {
          const [mList, sList] = await Promise.all([
            api.getMaintenanceLogs(selectedTruckId),
            api.getVehicleStatusLogs(selectedTruckId)
          ]);
          setMaintenanceLogs(mList);
          setStatusLogs(sList);
        } catch (err) {
          console.error("Failed to load logs for vehicle", err);
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

  // Check if truck is currently assigned to any In Progress trip
  const getActiveTripUsingTruck = (truckId: string) => {
    return trips.find(trip => {
      const associatedId = String(trip.truck_id || '');
      const isInProgress = trip.status_id === 'status-inprogress' || trip.status === 'In Progress';
      return associatedId === String(truckId) && isInProgress;
    });
  };

  // Add / Edit Truck Modal trigger
  const handleOpenModal = (truck?: Truck) => {
    if (truck) {
      setEditingId(truck.id);
      setFormData({
        plate_number: truck.plate_number || truck.license_plate || '',
        vin: truck.vin || '',
        truck_size: truck.truck_size || '10-Wheeler Wing',
        load_type_id: truck.load_type_id || (loadTypes[0]?.id || ''),
        truck_status_id: truck.truck_status_id || 'ts-avail',
        registration_expiry: truck.registration_expiry || '2027-12-31',
        branch_id: truck.branch_id || (branches[0]?.id || ''),
        is_active: truck.is_active !== false,
        remarks: truck.remarks || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        ...initialFormState,
        branch_id: branches[0]?.id || '',
        load_type_id: loadTypes[0]?.id || ''
      });
    }
    setIsModalOpen(true);
  };

  // Submit Truck Info
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check business rules if attempting to deactivate via edit modal
    if (editingId && !formData.is_active) {
      const activeTrip = getActiveTripUsingTruck(editingId);
      if (activeTrip) {
        setAlertMessage({
          title: "Deactivation Blocked",
          body: `Cannot deactivate truck ${formData.plate_number} as it is currently assigned to active Trip run ${activeTrip.trip_advise_code} which is in status 'In Progress'.`
        });
        return;
      }
    }

    const dataToSubmit: any = {
      ...formData,
      // backwards compatibility mappings
      license_plate: formData.plate_number,
      status: truckStatuses.find(s => s.id === formData.truck_status_id)?.truck_status_code || 'Available'
    };

    if (editingId) {
      onUpdate({ ...dataToSubmit, id: editingId });
    } else {
      onAdd(dataToSubmit);
    }
    setIsModalOpen(false);
  };

  // Quick deactivation from the detail panel/list or soft-delete trigger
  const handleToggleActiveState = async (truck: Truck, targetActive: boolean) => {
    if (!isWritable) return;

    if (!targetActive) {
      // Check active trips
      const activeTrip = getActiveTripUsingTruck(truck.id);
      if (activeTrip) {
        setAlertMessage({
          title: "Deactivation Restricted",
          body: `Truck ${truck.plate_number || truck.license_plate} is currently hauling active Run ${activeTrip.trip_advise_code} [In Progress]. Deactivation is restricted until completion.`
        });
        return;
      }

      setConfirmAction({
        title: "Confirm Soft Deactivation",
        message: `Are you sure you want to deactivate and mark truck ${truck.plate_number || truck.license_plate} as soft-deleted? It will be removed from operational dispatcher views.`,
        onConfirm: async () => {
          setConfirmAction(null);
          await proceedToggleActiveState(truck, false);
        }
      });
    } else {
      await proceedToggleActiveState(truck, true);
    }
  };

  const proceedToggleActiveState = async (truck: Truck, targetActive: boolean) => {
    const updated: Truck = {
      ...truck,
      is_active: targetActive,
      is_deleted: !targetActive, // consistently set is_deleted=true when deactivating
      updated_at: new Date().toISOString()
    };
    // Also, if deactivated, we can update status to 'Inactive' as well
    if (!targetActive) {
      updated.truck_status_id = 'ts-inactive';
      updated.status = 'Inactive';
    } else {
      updated.truck_status_id = 'ts-avail';
      updated.status = 'Available';
    }

    // Status change creates a status log in api Service too!
    if (updated.truck_status_id !== truck.truck_status_id) {
      await api.updateTruckStatus(truck.id, updated.truck_status_id);
    }

    onUpdate(updated);
  };

  // Add Maintenance Log Entry
  const handleAddMaintenanceLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckId) return;

    try {
      const payload = {
        truck_id: selectedTruckId,
        reported_by_user_id: 'user-1',
        maintenance_type: maintFormData.maintenance_type,
        status: maintFormData.status,
        scheduled_date: maintFormData.scheduled_date,
        completed_at: maintFormData.status === 'Completed' ? new Date().toISOString() : undefined,
        cost_amount: maintFormData.cost_amount ? Number(maintFormData.cost_amount) : undefined,
        odometer: maintFormData.odometer ? Number(maintFormData.odometer) : undefined,
        vendor_mechanic: maintFormData.vendor_mechanic || undefined,
        notes: maintFormData.notes || undefined
      };

      const newLog = await api.createMaintenanceLog(payload);
      setMaintenanceLogs(prev => [newLog, ...prev]);
      
      // Auto upgrade truck status to 'Maintenance' if the maintenance status is In Progress
      if (payload.status === 'In Progress') {
        const truck = trucks.find(t => t.id === selectedTruckId);
        if (truck && truck.truck_status_id !== 'ts-maint') {
          const updated = await api.updateTruckStatus(selectedTruckId, 'ts-maint');
          onUpdate(updated);
          // Refresh vehicle logs
          const freshLogs = await api.getVehicleStatusLogs(selectedTruckId);
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
    if (!isWritable) return;
    try {
      const updated = await api.updateTruckStatus(truckId, newStatusId);
      onUpdate(updated);
      
      // Update logs state
      const updatedLogs = await api.getVehicleStatusLogs(truckId);
      setStatusLogs(updatedLogs);
    } catch (err) {
      console.error(err);
    }
  };

  // Get current active selection details
  const currentTruck = trucks.find(t => t.id === selectedTruckId);

  // Filtering local listings
  const filteredTrucks = trucks.filter(t => {
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
  const sizesList = Array.from(new Set(trucks.map(t => t.truck_size).filter(Boolean)));

  return (
    <div className="flex h-full bg-navy-50 dark:bg-carbon-950 transition-colors duration-300">
      
      {/* LEFT PORTION: FILTERS & SCROLLABLE VEHICLE LIST */}
      <div className="w-full lg:w-1/2 flex flex-col border-r border-navy-200 dark:border-carbon-800/80 bg-white/80 dark:bg-carbon-900/50 backdrop-blur-md h-full">
        
        {/* Top Header Controls area */}
        <div className="p-4 border-b border-navy-100 dark:border-carbon-800/80 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white font-sans tracking-tight">Cargo Fleet Directory</h2>
              <p className="text-xs text-navy-500 dark:text-carbon-400">Manage dynamic heavy equipment transport units.</p>
            </div>
            
            {isWritable && (
              <button 
                onClick={() => handleOpenModal()}
                id="btn-register-vehicle"
                className="bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-100 text-white dark:text-black text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Enlist Transporter
              </button>
            )}
          </div>

          {/* Search bar & compact sliders trigger */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search plate code, VIN, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-truck-input"
                className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 text-xs rounded-lg pl-9 pr-3 py-2 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400"
              />
            </div>
          </div>

          {/* Multi-parameter dynamic filtering shelf */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Status Select */}
            <div>
              <label className="block text-[8.5px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-0.5 tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 text-[10.5px] p-1.5 rounded-md focus:outline-none dark:text-white"
              >
                <option value="All">All Statuses</option>
                {truckStatuses.map(s => (
                  <option key={s.id} value={s.id}>{s.truck_status_code}</option>
                ))}
              </select>
            </div>

            {/* Branch Select */}
            <div>
              <label className="block text-[8.5px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-0.5 tracking-wider">Branch Hub</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 text-[10.5px] p-1.5 rounded-md focus:outline-none dark:text-white"
              >
                <option value="All">All Hubs</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_code}</option>
                ))}
              </select>
            </div>

            {/* Truck Size Select */}
            <div>
              <label className="block text-[8.5px] font-bold text-navy-500 dark:text-carbon-400 uppercase mb-0.5 tracking-wider">Size Spec</label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 text-[10.5px] p-1.5 rounded-md focus:outline-none dark:text-white"
              >
                <option value="All">All Sizes</option>
                {sizesList.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Registration expiry 30-day filter toggle */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setExpiringFilter(prev => !prev)}
                className={`w-full py-1.5 px-2 rounded-md border text-[10px] font-semibold transition-all flex items-center justify-center gap-1
                  ${expiringFilter 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                    : 'bg-navy-50/55 dark:bg-carbon-950 border-navy-200 dark:border-carbon-800 text-navy-600 dark:text-carbon-400 hover:bg-navy-100/50'}`}
              >
                <Calendar className="w-3 h-3" /> Expiring &lt; 30d
              </button>
            </div>
          </div>
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
              <p className="text-sm font-semibold text-navy-800 dark:text-white">No active transporters match selection</p>
              <p className="text-xs text-navy-500 dark:text-carbon-400 mt-1">Try broadening your search query parameters or disabling the active filter presets.</p>
              {expiringFilter && (
                <button 
                  onClick={() => setExpiringFilter(false)}
                  className="mt-4 text-xs font-bold text-blue-500 hover:underline"
                >
                  Disable Expiring filter
                </button>
              )}
            </div>
          ) : (
            filteredTrucks.map((truck) => {
              const isActiveSelection = truck.id === selectedTruckId;
              const isExpiredUnit = isExpired(truck.registration_expiry);
              const isSoonExpiring = isExpiringWithin30Days(truck.registration_expiry);
              const isDeactivated = truck.is_active === false;
              const matchingBranch = branches.find(b => b.id === truck.branch_id);

              return (
                <div 
                  key={truck.id}
                  onClick={() => setSelectedTruckId(truck.id)}
                  className={`p-4 transition-all cursor-pointer border-l-2 flex justify-between items-start select-none
                    ${isActiveSelection 
                      ? 'bg-blue-50/30 dark:bg-carbon-800/40 border-l-blue-700' 
                      : 'hover:bg-navy-50/20 dark:hover:bg-carbon-900/20 border-l-transparent'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900 dark:text-white tracking-tight">{truck.plate_number || truck.license_plate}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider
                        ${truck.truck_status_id === 'ts-avail' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100/40' : 
                          truck.truck_status_id === 'ts-use' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100/40' : 
                          truck.truck_status_id === 'ts-maint' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100/40' : 
                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/40'}`}>
                        {truckStatuses.find(s => s.id === truck.truck_status_id)?.truck_status_code || truck.status || 'Available'}
                      </span>
                      {isDeactivated && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border border-dashed">
                          Deactivated
                        </span>
                      )}
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

      {/* RIGHT PORTION: CONSOLE DETAIL & LOGS SIDE PANEL */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-navy-50 dark:bg-carbon-950 h-full overflow-hidden">
        {currentTruck ? (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header detail */}
            <div className="p-6 bg-white dark:bg-carbon-900 border-b border-navy-200 dark:border-carbon-800/80 shrink-0">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-extra-bold font-sans tracking-tight text-navy-900 dark:text-white uppercase">
                      {currentTruck.plate_number || currentTruck.license_plate}
                    </h1>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border
                        ${currentTruck.truck_status_id === 'ts-avail' ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20' : 
                          currentTruck.truck_status_id === 'ts-use' ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20' : 
                          currentTruck.truck_status_id === 'ts-maint' ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20' : 
                          'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'}`}>
                      {truckStatuses.find(s => s.id === currentTruck.truck_status_id)?.truck_status_code || currentTruck.status || 'Available'}
                    </span>
                  </div>
                  <p className="text-xs text-navy-500 dark:text-carbon-400 font-mono tracking-wide uppercase">VIN SERIAL KEY: {currentTruck.vin || 'N/A'}</p>
                </div>

                <div className="flex gap-2">
                  {isWritable && (
                    <>
                      <button
                        onClick={() => handleOpenModal(currentTruck)}
                        className="p-2 border border-navy-200 dark:border-carbon-800 hover:bg-navy-100/50 dark:hover:bg-carbon-800 text-navy-700 dark:text-white rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
                        title="Edit specifications"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Specs
                      </button>

                      {currentTruck.is_active !== false ? (
                        <button
                          onClick={() => handleToggleActiveState(currentTruck, false)}
                          className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/40 rounded-lg p-2 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-red-600 shrink-0" /> Soft Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleActiveState(currentTruck, true)}
                          className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 rounded-lg p-2 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Reactivate Unit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Tabs selectors */}
              <div className="flex gap-4 mt-6 border-b border-navy-100 dark:border-carbon-900/40 text-sm">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2.5 font-semibold text-xs uppercase tracking-wider relative transition-all
                    ${activeTab === 'details' 
                      ? 'text-navy-900 dark:text-white border-b-2 border-blue-600' 
                      : 'text-navy-500 dark:text-carbon-400 hover:text-navy-800 dark:hover:text-white'}`}
                >
                  Specifications Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`pb-2.5 font-semibold text-xs uppercase tracking-wider relative transition-all flex items-center gap-1.5
                    ${activeTab === 'maintenance' 
                      ? 'text-navy-900 dark:text-white border-b-2 border-blue-600' 
                      : 'text-navy-500 dark:text-carbon-400 hover:text-navy-800 dark:hover:text-white'}`}
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-500" /> Maintenance History
                </button>
                <button
                  onClick={() => setActiveTab('status_logs')}
                  className={`pb-2.5 font-semibold text-xs uppercase tracking-wider relative transition-all flex items-center gap-1.5
                    ${activeTab === 'status_logs' 
                      ? 'text-navy-900 dark:text-white border-b-2 border-blue-600' 
                      : 'text-navy-500 dark:text-carbon-400 hover:text-navy-800 dark:hover:text-white'}`}
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
                        <p>This transport asset is flagged as de-commissioned or inactive. It is automatically withheld from scheduling dropdowns.</p>
                      </div>
                    </div>
                  )}

                  {/* Specification list Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-white dark:bg-carbon-900/45 p-4 rounded-xl border border-navy-200 dark:border-carbon-900 shadow-sm text-xs">
                    <div>
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">License Plate Code</span>
                      <p className="font-bold text-sm text-navy-900 dark:text-white mt-1 uppercase">{currentTruck.plate_number || currentTruck.license_plate}</p>
                    </div>

                    <div>
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">VIN Chassis Serial</span>
                      <p className="font-mono text-xs text-navy-800 dark:text-carbon-300 mt-1">{currentTruck.vin || 'UNASSIGNED CHASSIS'}</p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">Size & Weight Capacity</span>
                      <p className="font-semibold text-navy-800 dark:text-carbon-300 mt-1">{currentTruck.truck_size || 'Heavy Wings Carrier'}</p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">Category Capacity (Tons equivalent)</span>
                      <p className="font-semibold text-navy-800 dark:text-carbon-300 mt-1">
                        {currentTruck.tonner_capacity || (currentTruck.truck_size ? parseInt(currentTruck.truck_size) || 10 : 10)} Tonner
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3 col-span-2">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">Load capability classification</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {loadTypes.map(lt => {
                          const isAssigned = currentTruck.load_type_id === lt.id;
                          return (
                            <span 
                              key={lt.id}
                              className={`text-[9.5px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1
                                ${isAssigned 
                                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' 
                                  : 'bg-navy-50/20 dark:bg-carbon-900 border-dashed border-navy-200 dark:border-carbon-800 text-navy-400 dark:text-carbon-500 opacity-60'}`}
                            >
                              {isAssigned && <Check className="w-2.5 h-2.5" />}
                              {lt.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">Base Operations Hub</span>
                      <p className="font-semibold text-navy-800 dark:text-carbon-300 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        {branches.find(b => b.id === currentTruck.branch_id)?.branch_name || 'Unassigned Hub'}
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">LTO Registration expiry</span>
                      <p className={`font-semibold mt-1 font-mono
                        ${isExpired(currentTruck.registration_expiry) ? 'text-red-600 font-bold' : 
                          isExpiringWithin30Days(currentTruck.registration_expiry) ? 'text-amber-500 font-bold' : 
                          'text-navy-800 dark:text-carbon-300'}`}>
                        {currentTruck.registration_expiry || 'No Record'}
                      </p>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3 col-span-2">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide font-sans">Active Scheduler Status Flag</span>
                      <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3 h-3 rounded-full ${currentTruck.is_active !== false ? 'bg-emerald-500' : 'bg-red-400 animate-pulse'}`}></div>
                          <span className="font-bold text-navy-900 dark:text-white uppercase tracking-wider text-[11px]">
                            {currentTruck.is_active !== false ? 'Commissioned / Active' : 'Deactivated / Soft Locked'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-navy-50 dark:border-carbon-800/80 pt-3 col-span-2">
                      <span className="text-[9.5px] font-bold text-navy-400 dark:text-carbon-400 uppercase tracking-wide">Corporate / Mechanical Remarks</span>
                      <p className="text-navy-600 dark:text-carbon-400 mt-1 italic font-sans break-words bg-navy-50/30 dark:bg-carbon-900/60 p-2 rounded-lg">
                        {currentTruck.remarks || 'No remarks recorded for this fleet container transporter.'}
                      </p>
                    </div>
                  </div>

                  {/* Quick update active status dropdown directly */}
                  {isWritable && (
                    <div className="bg-amber-50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30 space-y-3">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Quick Dispatch Operational Control
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">Mutate the active dispatch availability status immediately. Any changes will register in the Audit Vehicle Status Logs for maintenance and tracking.</p>
                      <div className="flex gap-2">
                        {truckStatuses.map(statusObj => {
                          const isActive = currentTruck.truck_status_id === statusObj.id;
                          return (
                            <button
                              key={statusObj.id}
                              onClick={() => handleDirectStatusChange(currentTruck.id, statusObj.id)}
                              className={`flex-1 py-1 px-1 text-[10px] font-semibold rounded border uppercase tracking-wider transition-all
                                ${isActive 
                                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm' 
                                  : 'bg-white dark:bg-carbon-900 text-navy-700 dark:text-carbon-400 hover:bg-amber-100/30 border-navy-200 dark:border-carbon-800'}`}
                            >
                              {statusObj.truck_status_code}
                            </button>
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
                              <p className="mt-1">This truck is dispatched on active Run <span className="underline font-bold font-mono">{activeTrip.trip_advise_code}</span>.</p>
                              <p className="mt-0.5 font-mono text-[10px]">Pickup Date: {activeTrip.pickup_date}</p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <p className="text-xs text-navy-500 dark:text-carbon-400 italic">No Active "In Progress" heavy cargo trips allocated to this truck right now.</p>
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
                      <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">Historical Repair & Service Tickets</h4>
                      <p className="text-[10px] text-navy-500 mt-0.5">Logs of diagnostic overhaul, PPM, and inspections.</p>
                    </div>
                    {isWritable && (
                      <button 
                        onClick={() => setIsMaintModalOpen(true)}
                        className="bg-navy-900 hover:bg-navy-800 dark:bg-white text-white dark:text-black font-bold text-[10.5px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3 h-3" /> Log Work Order
                      </button>
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
                      <p className="text-[10.5px] text-navy-500 dark:text-carbon-400 mt-1">No preventive/repair log indexes created for this transporter.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {maintenanceLogs.map(log => (
                        <div key={log.id} className="bg-white dark:bg-carbon-900 p-4 rounded-lg border border-navy-200 dark:border-carbon-800/60 text-xs shadow-sm space-y-2">
                          <div className="flex justify-between items-start">
                            <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border
                              ${log.maintenance_type === 'Repair' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100' :
                                log.maintenance_type === 'Inspection' ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-100' :
                                log.maintenance_type === 'Preventive' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100' :
                                'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-100'}`}>
                              {log.maintenance_type}
                            </span>
                            <span className="font-mono text-zinc-400 text-[9px]">ID: {log.id}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-navy-50 dark:border-carbon-800/80">
                            <div>
                              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">Work Status</span>
                              <span className={`font-semibold inline-flex items-center gap-1 text-[10.5px] mt-0.5
                                ${log.status === 'Completed' ? 'text-emerald-600' : 'text-amber-500 font-bold animate-pulse'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                {log.status}
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">Logged Date</span>
                              <span className="font-semibold text-navy-800 dark:text-carbon-300 font-mono inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-navy-400 shrink-0" />
                                {log.scheduled_date || 'N/A'}
                              </span>
                            </div>

                            {log.cost_amount !== undefined && (
                              <div>
                                <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">Cost Amount</span>
                                <span className="font-bold text-navy-900 dark:text-emerald-400 inline-flex items-center gap-0.5">
                                  ₱{log.cost_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}

                            {log.odometer !== undefined && (
                              <div>
                                <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">Odometer Log</span>
                                <span className="font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
                                  {log.odometer.toLocaleString()} KM
                                </span>
                              </div>
                            )}

                            {log.vendor_mechanic && (
                              <div className="col-span-2">
                                <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest block">Mechanic / Repair Vendor</span>
                                <span className="font-semibold text-navy-800 dark:text-carbon-300 mt-0.5 block">{log.vendor_mechanic}</span>
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
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">Chronological Status Audit Trail</h4>
                    <p className="text-[10px] text-navy-500 mt-0.5">Audit log of telemetry and administrative transitions.</p>
                  </div>

                  {isLoadingLogs ? (
                    <div className="py-12 text-center text-xs text-navy-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading status log trail...
                    </div>
                  ) : statusLogs.length === 0 ? (
                    <div className="text-center py-12 p-3 bg-white dark:bg-carbon-900/30 border-2 border-dashed border-navy-200 dark:border-carbon-800 rounded-xl">
                      <History className="w-8 h-8 text-navy-300 dark:text-carbon-700 mx-auto mb-2" />
                      <p className="text-[10.5px] text-navy-500 dark:text-carbon-400">No status adjustments logged for this equipment.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-navy-100 dark:border-carbon-800 space-y-6 pt-2">
                      {statusLogs.map((log, index) => {
                        const oldMatch = truckStatuses.find(s => s.id === log.old_status_id)?.truck_status_code || 'Available';
                        const newMatch = truckStatuses.find(s => s.id === log.new_status_id)?.truck_status_code || 'Inactive';
                        const isLatest = index === 0;

                        return (
                          <div key={log.id} className="relative text-xs">
                            {/* Dot */}
                            <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center z-10
                              ${isLatest ? 'border-blue-600 scale-110 shadow-sm' : 'border-navy-300'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-blue-600' : 'bg-navy-400'}`}></div>
                            </div>

                            <span className="text-[10px] font-mono text-zinc-400 block">{new Date(log.changed_at).toLocaleString()}</span>
                            
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-navy-500 dark:text-carbon-400">{oldMatch}</span>
                              <span className="text-zinc-400 text-[10px]">➔</span>
                              <span className="font-bold text-navy-900 dark:text-white bg-blue-50/50 dark:bg-blue-950/10 px-1.5 py-0.5 rounded border border-blue-100/30">{newMatch}</span>
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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-navy-400 justify-self-center p-12">
            <Info className="w-12 h-12 text-navy-300 dark:text-carbon-700 mb-2 animate-bounce" />
            <p className="text-sm font-semibold">No equipment index selected</p>
            <p className="text-xs text-navy-500 max-w-xs text-center mt-1">Select a transporter from the fleet listings directory sidebar to monitor status logs and maintenance tickets.</p>
          </div>
        )}
      </div>

      {/* ALERT DIALOG (RESTRICTION BLOCK) */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white dark:bg-carbon-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 border-b border-rose-50 dark:border-red-950 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">{alertMessage.title}</h3>
            </div>
            <p className="text-xs text-navy-700 dark:text-carbon-400 font-sans leading-relaxed">
              {alertMessage.body}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAlertMessage(null)}
                className="bg-navy-900 hover:bg-navy-800 dark:bg-white text-white dark:text-black font-bold text-xs px-4 py-2 rounded-lg shadow-md transition-all"
              >
                Acknowledge Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 border-b border-rose-50 dark:border-carbon-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">{confirmAction.title}</h3>
            </div>
            <p className="text-xs text-navy-700 dark:text-carbon-400 font-sans leading-relaxed">
              {confirmAction.message}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="bg-navy-100 hover:bg-navy-200 dark:bg-carbon-800 text-navy-900 dark:text-carbon-200 font-bold text-xs px-4 py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md transition-all"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORK ORDER (MAINTENANCE) LOG SLIDE MODAL */}
      {isMaintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[90] p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-4 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center bg-navy-50/50 dark:bg-carbon-950">
              <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-500" /> Log Maintenance Work Order
              </h3>
              <button onClick={() => setIsMaintModalOpen(false)} className="text-navy-400 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaintenanceLogSubmit} className="p-4 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1 tracking-wider">Work Type</label>
                  <select
                    value={maintFormData.maintenance_type}
                    onChange={(e) => setMaintFormData({...maintFormData, maintenance_type: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Repair">Repair</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Registration">Registration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1 tracking-wider">Current Status</label>
                  <select
                    value={maintFormData.status}
                    onChange={(e) => setMaintFormData({...maintFormData, status: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Open">Open</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1 tracking-wider">Work Order Date</label>
                <input
                  type="date"
                  value={maintFormData.scheduled_date}
                  onChange={(e) => setMaintFormData({...maintFormData, scheduled_date: e.target.value})}
                  required
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1 tracking-wider">Expenses (₱ cost)</label>
                  <input
                    type="number"
                    value={maintFormData.cost_amount}
                    onChange={(e) => setMaintFormData({...maintFormData, cost_amount: e.target.value})}
                    placeholder="e.g. 15000"
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1 tracking-wider">Odometer reading (KM)</label>
                  <input
                    type="number"
                    value={maintFormData.odometer}
                    onChange={(e) => setMaintFormData({...maintFormData, odometer: e.target.value})}
                    placeholder="e.g. 182740"
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1 tracking-wider">Vendor Mechanic / Shop Name</label>
                <input
                  type="text"
                  value={maintFormData.vendor_mechanic}
                  onChange={(e) => setMaintFormData({...maintFormData, vendor_mechanic: e.target.value})}
                  placeholder="e.g. Cummins Service Center, Cebu"
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-navy-500 uppercase mb-1 tracking-wider">Mechanical Notes / Technical Details</label>
                <textarea
                  value={maintFormData.notes}
                  onChange={(e) => setMaintFormData({...maintFormData, notes: e.target.value})}
                  placeholder="Describe repair logs, diagnostic fault codes, parts replaced..."
                  rows={3}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-300 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMaintModalOpen(false)}
                  className="flex-1 border border-navy-200 dark:border-carbon-800 hover:bg-navy-50 dark:hover:bg-carbon-800 text-navy-700 dark:text-white font-bold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-navy-900 hover:bg-navy-800 dark:bg-white text-white dark:text-black font-bold py-2 rounded-lg shadow-md transition-all"
                >
                  Write Log Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TRANSPORTER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[90] p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-4 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center bg-navy-50/50 dark:bg-carbon-950">
              <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                {editingId ? 'Modify Fleet Transporter specs' : 'Register Vehicle Asset'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">License Plate Code</label>
                  <input
                    type="text"
                    value={formData.plate_number}
                    onChange={(e) => setFormData({...formData, plate_number: e.target.value.toUpperCase()})}
                    required
                    placeholder="GKL-9012"
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">Chassis (VIN)</label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase()})}
                    required
                    placeholder="17-DIGIT CHASSIS KEY"
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">Transporter Size Spec</label>
                  <select
                    value={formData.truck_size}
                    onChange={(e) => setFormData({...formData, truck_size: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                  >
                    <option value="10-Wheeler Wing">10-Wheeler Wing</option>
                    <option value="6-Wheeler Closed">6-Wheeler Closed</option>
                    <option value="12-Wheeler Reefer">12-Wheeler Reefer</option>
                    <option value="10-Wheeler Reefer">10-Wheeler Reefer</option>
                    <option value="Flatbed Trailer">Flatbed Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">Operational Branch</label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">LTO Registry Expiry</label>
                  <input
                    type="date"
                    value={formData.registration_expiry}
                    onChange={(e) => setFormData({...formData, registration_expiry: e.target.value})}
                    required
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">Load Capability</label>
                  <select
                    value={formData.load_type_id}
                    onChange={(e) => setFormData({...formData, load_type_id: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                  >
                    {loadTypes.map(lt => (
                      <option key={lt.id} value={lt.id}>{lt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">Initial status</label>
                  <select
                    value={formData.truck_status_id}
                    onChange={(e) => setFormData({...formData, truck_status_id: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                  >
                    {truckStatuses.map(s => (
                      <option key={s.id} value={s.id}>{s.truck_status_code}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <input
                    type="checkbox"
                    id="is_active_chk"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-500 border-navy-200 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="is_active_chk" className="font-bold text-navy-800 dark:text-carbon-300 cursor-pointer select-none">
                    Asset is Active
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-navy-500 dark:text-carbon-300 uppercase mb-1 tracking-wider">Transporter Remarks & Details</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  placeholder="Record custom administrative or mechanic logs regarding tires, engines..."
                  rows={2}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-300 dark:border-carbon-800 rounded-md p-2 text-xs focus:outline-none dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-navy-200 dark:border-carbon-800 hover:bg-navy-50 dark:hover:bg-carbon-800 text-navy-700 dark:text-white font-bold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-navy-900 hover:bg-navy-800 dark:bg-white text-white dark:text-black font-bold py-2 rounded-lg shadow-md transition-all"
                >
                  Enlist Transporter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TruckList;
