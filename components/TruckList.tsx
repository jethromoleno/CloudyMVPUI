import React, { useState } from 'react';
import { Truck, TruckStatusType } from '../types';
import { Plus, Edit2, Trash2, X, AlertTriangle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface TruckListProps {
  trucks: Truck[];
  onAdd: (truck: any) => void;
  onUpdate: (truck: Truck) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
  theme?: 'light' | 'dark';
}

const TruckList: React.FC<TruckListProps> = ({ 
  trucks, onAdd, onUpdate, onDelete, isLoading = false, error = null, theme 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const initialFormState = {
    license_plate: '',
    vin: '',
    tonner_capacity: 4,
    status: 'Available' as TruckStatusType
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenModal = (truck?: Truck) => {
    if (truck) {
      setEditingId(truck.id);
      setFormData({
        license_plate: truck.license_plate || truck.plate_number || '',
        vin: truck.vin || '',
        tonner_capacity: truck.tonner_capacity || (truck.truck_size ? parseInt(truck.truck_size) : 4),
        status: truck.status || 'Available'
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: any = {
      ...formData,
      plate_number: formData.license_plate,
      truck_size: `${formData.tonner_capacity} Tons`
    };

    if (editingId) {
      onUpdate({ ...dataToSubmit, id: editingId });
    } else {
      onAdd(dataToSubmit);
    }
    setIsModalOpen(false);
  };

  const getStatusIcon = (status: TruckStatusType) => {
    switch (status) {
      case 'Available': return <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />;
      case 'In Use': return <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />;
      case 'Maintenance': return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-505" />;
      default: return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const executeDelete = () => {
    if (confirmDeleteId) {
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  // Filter local listings
  const filteredTrucks = trucks.filter(t => {
    const term = searchQuery.toLowerCase();
    const plate = (t.license_plate || t.plate_number || '').toLowerCase();
    const vinCode = (t.vin || '').toLowerCase();
    const size = (t.truck_size || '').toLowerCase();
    return plate.includes(term) || vinCode.includes(term) || size.includes(term);
  });

  return (
    <div className="p-8 h-full bg-navy-50 dark:bg-carbon-950 overflow-y-auto relative transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white font-sans tracking-tight font-heading">Truck Inventory</h1>
          <p className="text-navy-600 dark:text-carbon-400 mt-1 text-sm">Real-time status registers for fleet cargo transports.</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search license plate, VIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 text-sm rounded-lg px-4 py-2 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400 w-full sm:w-64"
          />
          <button 
            onClick={() => handleOpenModal()}
            className="bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-navy-900/10 text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-red-700 dark:text-red-400 text-sm flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">Error Accessing Fleet Data</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 text-navy-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Connecting telemetry logs...</p>
        </div>
      ) : filteredTrucks.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-navy-200 dark:border-carbon-800 rounded-xl bg-white dark:bg-carbon-900 max-w-xl mx-auto mt-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-navy-300 dark:text-carbon-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-navy-800 dark:text-white mb-1 font-heading">No Vehicles On File</h3>
          <p className="text-sm text-navy-500 dark:text-carbon-450 mb-6">
            {searchQuery ? 'No active trucks matching search criteria.' : 'Zero fleets mapped in hybrid database.'}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-navy-900 dark:bg-white text-white dark:text-black text-xs font-semibold px-4 py-2 rounded transition-colors"
            >
              Register First Truck (Plate No)
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-carbon-900 rounded-xl border border-navy-100 dark:border-carbon-805 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-50 dark:bg-carbon-950/40 border-b border-navy-100 dark:border-carbon-805 text-navy-500 dark:text-carbon-400 text-xs uppercase tracking-wider font-semibold">
                <th className="p-4">Plate Identifier</th>
                <th className="p-4">Chassis (VIN)</th>
                <th className="p-4">Cargo Capacity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 dark:divide-carbon-805/50 text-sm">
              {filteredTrucks.map((truck) => {
                const plate = truck.license_plate || truck.plate_number;
                const capacity = truck.tonner_capacity || (truck.truck_size ? parseInt(truck.truck_size) : 4);
                const statusStr = truck.status || 'Available';

                return (
                  <tr key={truck.id} className="hover:bg-navy-50 dark:hover:bg-carbon-850/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-navy-900 dark:text-white text-base font-sans tracking-tight">{plate}</div>
                      <div className="text-navy-400 dark:text-carbon-500 font-mono text-[10px] uppercase mt-0.5">UUID: {truck.id.substring(0, 8)}</div>
                    </td>
                    <td className="p-4 text-navy-600 dark:text-carbon-300 font-mono">{truck.vin || 'VIN-UNASSIGNED'}</td>
                    <td className="p-4 text-navy-600 dark:text-carbon-300 font-medium">{capacity} Tonner</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(statusStr)}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border
                          ${statusStr === 'Available' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 
                            statusStr === 'In Use' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' : 
                            'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-500/20'}`}>
                          {statusStr}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenModal(truck)}
                          className="p-2 text-navy-400 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-carbon-800 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(truck.id)}
                          className="p-2 text-navy-400 hover:text-red-600 dark:text-carbon-400 dark:hover:text-red-405 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-550" /> Confirm Destruction
            </h3>
            <p className="text-sm text-navy-600 dark:text-carbon-400 mb-6 font-sans">
              Are you sure you want to remove this truck from service registration? This action is permanent and clears associated telemetry profiles.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="bg-navy-50 hover:bg-navy-100 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-navy-800 dark:text-white px-4 py-2 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="bg-red-650 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold shadow"
              >
                Delete Truck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 rounded-lg border border-navy-150 dark:border-carbon-800 w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center bg-navy-50/50 dark:bg-carbon-950">
              <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                {editingId ? 'Modify Transporter' : 'Register Vehicle'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-800 dark:text-carbon-400 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">License Plate</label>
                <input 
                  type="text" 
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none"
                  placeholder="GKL-9012"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">Chassis VIN</label>
                <input 
                  type="text" 
                  value={formData.vin}
                  onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase()})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none"
                  placeholder="17-CHARACTER CHASSIS NO"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">Tons Capacity</label>
                  <input 
                    type="number" 
                    value={formData.tonner_capacity}
                    onChange={(e) => setFormData({...formData, tonner_capacity: Math.max(1, parseInt(e.target.value) || 1)})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none"
                    required 
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">Status Code</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as TruckStatusType})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-navy-200 dark:bg-carbon-800 dark:border-carbon-700 hover:bg-navy-50 dark:hover:bg-carbon-700 text-navy-700 dark:text-white py-2 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-navy-900 dark:bg-white text-white dark:text-black py-2 rounded text-xs font-semibold shadow-md"
                >
                  {editingId ? 'Modify Fleet' : 'Enlist fleet'}
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
