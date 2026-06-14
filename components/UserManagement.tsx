import React, { useState } from 'react';
import { SystemUser, AppModule, UserRoleType } from '../types';
import { Plus, Edit2, Trash2, X, Shield, Check, AlertTriangle } from 'lucide-react';

interface UserManagementProps {
  users: SystemUser[];
  onAddUser: (user: Omit<SystemUser, 'id'>) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (id: string | number) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);

  const initialFormState = {
    username: '',
    password: '',
    role: 'Viewer' as UserRoleType,
    permissions: {
      inventory: false,
      trip_scheduling: false,
      billing: false
    }
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenModal = (user?: SystemUser) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        username: user.username,
        password: user.password || '', 
        role: user.role,
        permissions: {
          inventory: user.permissions.includes('inventory'),
          trip_scheduling: user.permissions.includes('trip_scheduling'),
          billing: user.permissions.includes('billing')
        }
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const permissionsArray: string[] = [];
    if (formData.permissions.inventory) permissionsArray.push('inventory');
    if (formData.permissions.trip_scheduling) permissionsArray.push('trip_scheduling');
    if (formData.permissions.billing) permissionsArray.push('billing');

    const userData: any = {
      username: formData.username,
      password: formData.password,
      role: formData.role,
      permissions: permissionsArray
    };

    if (editingId) {
      onUpdateUser({ ...userData, id: editingId });
    } else {
      onAddUser(userData);
    }
    setIsModalOpen(false);
  };

  const togglePermission = (key: keyof typeof formData.permissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-navy-900 dark:text-blue-500" /> User Management
          </h3>
          <p className="text-navy-500 dark:text-carbon-400 text-sm mt-1">Create users and assign access permissions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium shadow-md shadow-navy-900/10 dark:shadow-none"
        >
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-navy-100 dark:border-carbon-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy-50 dark:bg-carbon-900 text-navy-500 dark:text-carbon-400 text-xs uppercase tracking-wider font-semibold">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Access Permissions</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50 dark:divide-carbon-800 text-sm">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-navy-50 dark:hover:bg-carbon-800/50">
                <td className="p-4 text-navy-900 dark:text-white font-medium">{user.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    user.role === 'SuperAdmin' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' :
                    user.role === 'Admin' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                    'bg-navy-100 dark:bg-carbon-800 text-navy-600 dark:text-carbon-400 border-navy-200 dark:border-carbon-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {user.permissions.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-navy-50 dark:bg-carbon-800 rounded border border-navy-200 dark:border-carbon-700 text-xs text-navy-600 dark:text-carbon-300 capitalize">
                        {p.replace('_', ' ')}
                      </span>
                    ))}
                    {user.permissions.length === 0 && <span className="text-navy-400 dark:text-carbon-500 italic text-xs">No access</span>}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(user)} className="p-2 text-navy-400 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {user.username !== 'SuperAdmin' && (
                      <button onClick={() => setConfirmDeleteId(user.id)} className="p-2 text-navy-400 hover:text-red-600 dark:text-carbon-400 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 rounded-lg border border-navy-100 dark:border-carbon-800 w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                {editingId ? 'Edit User' : 'Create User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-800 dark:text-carbon-400 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-400 mb-2 uppercase">Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-400 mb-2 uppercase">Password</label>
                <input 
                  type="text" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600"
                  placeholder={editingId ? "Leave blank to keep current" : ""}
                  required={!editingId}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-400 mb-2 uppercase">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRoleType})}
                  className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Encoder">Encoder</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-400 mb-3 uppercase">Module Access</label>
                <div className="space-y-3">
                  <div 
                    onClick={() => togglePermission('inventory')}
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${formData.permissions.inventory ? 'bg-navy-50 dark:bg-carbon-800 border-navy-300 dark:border-carbon-600' : 'bg-white dark:bg-carbon-950 border-navy-200 dark:border-carbon-800'}`}
                  >
                    <span className={formData.permissions.inventory ? 'text-navy-900 dark:text-white font-medium' : 'text-navy-500 dark:text-carbon-400'}>Inventory Management</span>
                    {formData.permissions.inventory && <Check className="w-4 h-4 text-navy-900 dark:text-white" />}
                  </div>
                  <div 
                    onClick={() => togglePermission('trip_scheduling')}
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${formData.permissions.trip_scheduling ? 'bg-navy-50 dark:bg-carbon-800 border-navy-300 dark:border-carbon-600' : 'bg-white dark:bg-carbon-950 border-navy-200 dark:border-carbon-800'}`}
                  >
                    <span className={formData.permissions.trip_scheduling ? 'text-navy-900 dark:text-white font-medium' : 'text-navy-500 dark:text-carbon-400'}>Trip Scheduling (LogiTrack)</span>
                    {formData.permissions.trip_scheduling && <Check className="w-4 h-4 text-navy-900 dark:text-white" />}
                  </div>
                  <div 
                    onClick={() => togglePermission('billing')}
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${formData.permissions.billing ? 'bg-navy-50 dark:bg-carbon-800 border-navy-300 dark:border-carbon-600' : 'bg-white dark:bg-carbon-950 border-navy-200 dark:border-carbon-800'}`}
                  >
                    <span className={formData.permissions.billing ? 'text-navy-900 dark:text-white font-medium' : 'text-navy-500 dark:text-carbon-400'}>Billing System</span>
                    {formData.permissions.billing && <Check className="w-4 h-4 text-navy-900 dark:text-white" />}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-navy-200 dark:bg-carbon-800 dark:border-carbon-700 hover:bg-navy-50 dark:hover:bg-carbon-700 text-navy-700 dark:text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black py-2.5 rounded-lg transition-colors text-sm font-semibold shadow-md shadow-navy-900/10 dark:shadow-none"
                >
                  {editingId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Confirm User Deletion
            </h3>
            <p className="text-sm text-navy-600 dark:text-carbon-400 mb-6">
              Are you sure you want to delete this user profile? They will instantly lose access permissions to all modules.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="bg-navy-50 hover:bg-navy-100 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-navy-800 dark:text-white px-4 py-2 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onDeleteUser(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold shadow"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;