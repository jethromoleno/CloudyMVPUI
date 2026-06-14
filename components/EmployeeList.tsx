import React, { useState } from 'react';
import { Employee } from '../types';
import { Plus, Edit2, Trash2, X, User, IdCard, AlertTriangle, Loader2 } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onAdd: (employee: any) => void;
  onUpdate?: (employee: Employee) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
  theme: 'light' | 'dark';
}

const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, onAdd, onUpdate, onDelete, isLoading = false, error = null, theme 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const initialFormState = {
    first_name: '',
    last_name: '',
    employee_role_id: 'er-1', // Default er-1 = Primary Driver
    license_number: '',
    contact_no: '',
    employment_status: 'Active'
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        employee_role_id: employee.employee_role_id || 'er-1',
        license_number: employee.license_number || '',
        contact_no: employee.contact_no || '',
        employment_status: employee.employment_status || 'Active'
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
      full_name: `${formData.first_name} ${formData.last_name}`,
    };

    if (editingId) {
      if (onUpdate) {
        onUpdate({ ...dataToSubmit, id: editingId });
      }
    } else {
      onAdd(dataToSubmit);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTrigger = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = () => {
    if (confirmDeleteId) {
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  // Filter local list
  const filteredEmployees = employees.filter(emp => {
    const term = searchQuery.toLowerCase();
    return (
      emp.first_name.toLowerCase().includes(term) ||
      emp.last_name.toLowerCase().includes(term) ||
      (emp.employee_code || '').toLowerCase().includes(term) ||
      (emp.role || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-8 h-full bg-navy-50 dark:bg-carbon-950 overflow-y-auto relative transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white font-sans tracking-tight">Employee Directory</h1>
          <p className="text-navy-600 dark:text-carbon-400 mt-1 text-sm">Personnel resource hub mapped to Cloudy Hybrid DB columns.</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search personnel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 text-sm rounded-lg px-4 py-2 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600 w-full sm:w-64"
          />
          <button 
            onClick={() => handleOpenModal()}
            className="bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-navy-900/10 dark:shadow-none text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-sm flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">Error Loading Employees</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 text-navy-500">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Fetching operation logs & profiles...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        /* EMPTY STATE */
        <div className="p-16 text-center border-2 border-dashed border-navy-200 dark:border-carbon-800 rounded-xl bg-white dark:bg-carbon-900 max-w-xl mx-auto mt-8 shadow-sm">
          <User className="w-12 h-12 text-navy-300 dark:text-carbon-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-navy-800 dark:text-white mb-1">No Personnel Records</h3>
          <p className="text-sm text-navy-500 dark:text-carbon-450 mb-6">
            {searchQuery ? 'No employees matched your search term.' : ' Cloudy hybrid schema has zero employees assigned yet.'}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-navy-900 dark:bg-white text-white dark:text-black text-xs font-semibold px-4 py-2 rounded transition-colors"
            >
              Seed First Employee
            </button>
          )}
        </div>
      ) : (
        /* EMPLOYEES GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="bg-white dark:bg-carbon-900 border border-navy-100 dark:border-carbon-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-11 h-11 bg-navy-50 dark:bg-carbon-850 rounded-full flex items-center justify-center text-navy-500 dark:text-carbon-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(emp)}
                    className="p-1.5 text-navy-400 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-carbon-800 rounded transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTrigger(emp.id)}
                    className="p-1.5 text-navy-400 hover:text-red-600 dark:text-carbon-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-base font-bold text-navy-900 dark:text-white mb-1">{emp.first_name} {emp.last_name}</h3>
              <p className="font-mono text-xs text-navy-400 dark:text-carbon-500 mb-4">{emp.employee_code || `EMP-ID-${emp.id.substring(0,6).toUpperCase()}`}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border
                  ${emp.employee_role_id === 'er-1' || emp.role === 'Driver' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/20' : 
                    emp.employee_role_id === 'er-2' || emp.role === 'Helper' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' : 
                    'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-450 border-sky-100 dark:border-sky-500/20'}`}>
                  {emp.role || (emp.employee_role_id === 'er-1' ? 'Driver' : emp.employee_role_id === 'er-2' ? 'Helper' : 'Encoder')}
                </span>
                <span className="text-[11px] text-navy-400 dark:text-carbon-500 font-mono">
                  {emp.contact_no || 'No Contact Info'}
                </span>
              </div>

              {(emp.employee_role_id === 'er-1' || emp.role === 'Driver') && (
                <div className="pt-3 border-t border-navy-50 dark:border-carbon-805 mt-4">
                  <div className="flex items-center gap-1.5 text-navy-550 dark:text-carbon-400 text-xs font-mono">
                    <IdCard className="w-3.5 h-3.5 text-navy-400 dark:text-carbon-500" />
                    <span>LCS: {emp.license_number || 'DL-NCR-878932'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM DESTRUCTION MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Confirm Deletion
            </h3>
            <p className="text-sm text-navy-600 dark:text-carbon-400 mb-6">
              Are you sure you want to remove this employee record? This action is destructive and cannot be reversed.
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
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold shadow"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 rounded-lg border border-navy-150 dark:border-carbon-800 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center bg-navy-50 dark:bg-carbon-950">
              <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                {editingId ? 'Edit Employee Record' : 'Enroll Employee'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-800 dark:text-carbon-400 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">Contact Number</label>
                <input 
                  type="text" 
                  value={formData.contact_no}
                  placeholder="0917-XXX-XXXX"
                  onChange={(e) => setFormData({...formData, contact_no: e.target.value})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">Hybrid Schema Role Code</label>
                <select 
                  value={formData.employee_role_id}
                  onChange={(e) => setFormData({...formData, employee_role_id: e.target.value})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="er-1">Driver (er-1)</option>
                  <option value="er-2">Helper (er-2)</option>
                  <option value="er-3">Encoder (er-3)</option>
                </select>
              </div>
              
              {formData.employee_role_id === 'er-1' && (
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-455 uppercase mb-1 tracking-wider">Heavy Truck License Number</label>
                  <input 
                    type="text" 
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600"
                    placeholder="DL-NCR-123456"
                    required
                  />
                </div>
              )}

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
