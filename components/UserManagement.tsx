import React, { useState, useEffect } from 'react';
import { SystemUser, AppModule, UserRoleType } from '../types';
import { api } from '../services/apiService';
import { 
  Plus, Edit2, Trash2, X, Shield, Check, AlertTriangle, Settings2, Save, 
  Users, Lock, Unlock, Globe, Building, Clock, SlidersHorizontal, Eye, 
  Layers, Activity, Info, UserCheck, UserX, HelpCircle, ShieldAlert
} from 'lucide-react';

interface UserManagementProps {
  users: SystemUser[];
  onAddUser: (user: Omit<SystemUser, 'id'>) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (id: string | number) => void;
  userRole: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, onAddUser, onUpdateUser, onDeleteUser, userRole 
}) => {
  const isSuperAdmin = userRole === 'SuperAdmin';
  
  // --- STATE FOR SETTINGS TABS ---
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'modules' | 'settings'>('users');

  // --- GENERAL DIRECTORY / SYSTEM USERS LOCAL SYNC ---
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | number | null>(null);
  const [confirmActivateId, setConfirmActivateId] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // --- FORM STATE ---
  const initialFormState = {
    username: '',
    password: '',
    roles: ['Viewer'] as string[], // Assigned Roles multi-select support
    permissions: {
      inventory: false,
      trip_scheduling: true,
      billing: false
    }
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- ENTERPRISE APP CONFIG STATE ---
  const [appTimezone, setAppTimezone] = useState('Asia/Manila');
  const [defaultBranch, setDefaultBranch] = useState('branch-2');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [pendingTripAlertHours, setPendingTripAlertHours] = useState('2');
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Load app settings from persistent mockup store
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getAppSettings();
        const tz = settings.find(s => s.setting_key === 'app_timezone')?.setting_value || 'Asia/Manila';
        const br = settings.find(s => s.setting_key === 'default_branch_id')?.setting_value || 'branch-2';
        const to = settings.find(s => s.setting_key === 'session_timeout_minutes')?.setting_value || '60';
        const pt = settings.find(s => s.setting_key === 'pending_trip_alert_hours')?.setting_value || '2';
        
        setAppTimezone(tz);
        setDefaultBranch(br);
        setSessionTimeout(to);
        setPendingTripAlertHours(pt);
      } catch (err) {
        console.error('Failed to load settings from apiService', err);
      }
    };
    loadSettings();
  }, []);

  // Sync Roles list for check-boxes representation
  const availableRolesList = ['SuperAdmin', 'Admin', 'Dispatcher', 'Encoder', 'Viewer'];
  
  // Role mapping definitions for descriptions and transparency matrix
  const roleDefinitions = [
    {
      code: 'SuperAdmin',
      name: 'SuperAdmin Role',
      description: 'Root administrative user. Has unrestricted access to all modules, including user credential provisioning, database variables, system security parameters, and operational logs.',
      permissions: ['Users & Settings Admin', 'Full Dispatch Controls', 'Fleet Configuration Writes', 'Personnel Records Writes', 'Enterprise Analytics Access']
    },
    {
      code: 'Admin',
      name: 'Admin Role',
      description: 'Operations manager. Has full write and read capabilities across all operational modules (Trip Scheduling, Truck Fleet, Employees), but is restricted from editing global system settings, timezone, or creating/modifying credentials.',
      permissions: ['Full Dispatch Controls', 'Fleet Configuration Writes', 'Personnel Records Writes', 'Operational Reports View']
    },
    {
      code: 'Dispatcher',
      name: 'Dispatcher Role',
      description: 'Logistics Dispatch Controller. Can create and modify trip schedules, allocate vehicles and trucks, and read personnel lists.',
      permissions: ['Dispatch Scheduling Writes', 'Fleet configuration updates (limited)', 'Personnel read-only directory']
    },
    {
      code: 'Encoder',
      name: 'Encoder Role',
      description: 'Fulfillment Clerk. Can log trip advices, input fuel slips, record basic timestamps, and view core reference lists.',
      permissions: ['Fulfillment Trip Log inputs', 'Add fuel logs', 'Core listings view']
    },
    {
      code: 'Viewer',
      name: 'Viewer Role',
      description: 'Standard read-only auditor. Has complete visibility across the logistics board, tracking views, and reports, but cannot add or modify any records.',
      permissions: ['Read-only logistics board', 'No data mutation permissions']
    }
  ];

  // Helper to determine the highest role for authorization priority
  const getHighestRole = (rolesList: string[]): string => {
    if (rolesList.includes('SuperAdmin')) return 'SuperAdmin';
    if (rolesList.includes('Admin')) return 'Admin';
    if (rolesList.includes('Dispatcher')) return 'Dispatcher';
    if (rolesList.includes('Encoder')) return 'Encoder';
    return 'Viewer';
  };

  // --- ACTION HANDLERS ---
  const handleOpenFormModal = (user?: SystemUser) => {
    setAlertMsg(null);
    if (!isSuperAdmin) return; // Guard for SuperAdmin only

    if (user) {
      // Parse assigned roles or fallback to single role
      const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
      setEditingId(user.id);
      setFormData({
        username: user.username,
        password: user.password || '',
        roles: userRoles,
        permissions: {
          inventory: user.permissions.includes('inventory'),
          trip_scheduling: user.permissions.includes('trip_scheduling'),
          billing: user.permissions.includes('billing')
        }
      });
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        roles: ['Viewer'],
        permissions: {
          inventory: false,
          trip_scheduling: true,
          billing: false
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleRoleToggle = (selectedRole: string) => {
    setFormData(prev => {
      let updatedRoles = [...prev.roles];
      if (updatedRoles.includes(selectedRole)) {
        // Prevent empty roles list
        if (updatedRoles.length > 1) {
          updatedRoles = updatedRoles.filter(r => r !== selectedRole);
        }
      } else {
        updatedRoles.push(selectedRole);
      }
      return { ...prev, roles: updatedRoles };
    });
  };

  const handlePermissionToggle = (moduleKey: keyof typeof formData.permissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: !prev.permissions[moduleKey]
      }
    }));
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    if (!formData.username.trim()) {
      setAlertMsg({ type: 'error', text: 'Username is required.' });
      return;
    }

    // Determine highest selected role for legacy state compatibility
    const primaryRole = getHighestRole(formData.roles);

    const compiledPermissions: string[] = [];
    if (formData.permissions.inventory) compiledPermissions.push('inventory');
    if (formData.permissions.trip_scheduling) compiledPermissions.push('trip_scheduling');
    if (formData.permissions.billing) compiledPermissions.push('billing');

    const userInfo: any = {
      username: formData.username.trim(),
      password: formData.password || 'cloudy123',
      role: primaryRole,
      roles: formData.roles,
      permissions: compiledPermissions,
      is_active: true // default active on creation
    };

    try {
      if (editingId) {
        onUpdateUser({
          ...userInfo,
          id: editingId,
          // Retain activation flag unless toggled
          is_active: users.find(u => u.id === editingId)?.is_active !== false
        });
        setAlertMsg({ type: 'success', text: 'User profile updated successfully.' });
      } else {
        // Prevent duplicate usernames
        const exists = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase());
        if (exists) {
          setAlertMsg({ type: 'error', text: 'Username already exists. Please choose a unique identifier.' });
          return;
        }
        onAddUser(userInfo);
        setAlertMsg({ type: 'success', text: 'User profile enrolled successfully.' });
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setAlertMsg(null);
      }, 800);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to submit profile.' });
    }
  };

  const handleDeactivateTrigger = (id: string | number) => {
    setAlertMsg(null);
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    if (targetUser.username === 'SuperAdmin') {
      setAlertMsg({ type: 'error', text: 'Deactivation of default root SuperAdmin is locked.' });
      return;
    }

    setConfirmDeactivateId(id);
  };

  const executeDeactivate = () => {
    if (confirmDeactivateId) {
      const targetUser = users.find(u => u.id === confirmDeactivateId);
      if (targetUser) {
        onUpdateUser({
          ...targetUser,
          is_active: false
        });
      }
      setConfirmDeactivateId(null);
    }
  };

  const handleActivateUser = (id: string | number) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser) {
      onUpdateUser({
        ...targetUser,
        is_active: true
      });
    }
  };

  const handleSaveAppConfigurations = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaveSuccess(false);

    try {
      // Find and update each setting asynchronously
      const mockSettings = await api.getAppSettings();
      const sTz = mockSettings.find(s => s.setting_key === 'app_timezone');
      const sBranch = mockSettings.find(s => s.setting_key === 'default_branch_id');
      const sTimeout = mockSettings.find(s => s.setting_key === 'session_timeout_minutes');
      const sPending = mockSettings.find(s => s.setting_key === 'pending_trip_alert_hours');

      if (sTz) await api.updateAppSetting(sTz.id, appTimezone);
      if (sBranch) await api.updateAppSetting(sBranch.id, defaultBranch);
      if (sTimeout) await api.updateAppSetting(sTimeout.id, sessionTimeout);
      if (sPending) await api.updateAppSetting(sPending.id, pendingTripAlertHours);

      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings parameters:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full bg-navy-50 dark:bg-carbon-950 overflow-y-auto relative transition-colors duration-300">
      
      {/* HEADER BAR */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-navy-100 dark:border-carbon-805/40 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-navy-900 dark:text-white tracking-tight">System Settings & Controls</h1>
          <p className="text-navy-500 dark:text-carbon-400 text-xs mt-0.5">Control administrative credentials, view role-based authorization vectors, and config environmental variables.</p>
        </div>
        
        {/* CURRENT ROLE INFORMATIONAL PILL */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-navy-100 dark:bg-carbon-900 border border-navy-150 dark:border-carbon-800 px-3.5 py-1.5 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-navy-800 dark:text-gray-200" />
          <span className="text-[10.5px] font-bold text-navy-450 dark:text-carbon-500 uppercase tracking-wide">Current Context:</span>
          <span className="text-xs font-bold text-navy-800 dark:text-white bg-navy-200 dark:bg-carbon-800 px-1.5 py-0.5 rounded text-[10.5px]">{userRole}</span>
        </div>
      </div>

      {/* ERROR/SUCCESS BANNER */}
      {alertMsg && (
        <div className={`mb-6 p-3.5 border text-xs rounded-lg flex items-center gap-2.5 transition-all duration-300 ${
          alertMsg.type === 'error' 
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400' 
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <p className="font-semibold">{alertMsg.text}</p>
        </div>
      )}

      {/* CORE CONFIG NAVIGATION TABS */}
      <div className="flex border-b border-navy-150 dark:border-carbon-805 mb-6 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 font-sans font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-navy-900 dark:border-white text-navy-900 dark:text-white'
              : 'border-transparent text-navy-450 dark:text-carbon-500 hover:text-navy-700 dark:hover:text-carbon-350'
          }`}
        >
          <Users className="w-4 h-4" /> Users Directory
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 font-sans font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'roles'
              ? 'border-navy-900 dark:border-white text-navy-900 dark:text-white'
              : 'border-transparent text-navy-450 dark:text-carbon-500 hover:text-navy-700 dark:hover:text-carbon-350'
          }`}
        >
          <Shield className="w-4 h-4" /> Role Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2.5 font-sans font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'modules'
              ? 'border-navy-900 dark:border-white text-navy-900 dark:text-white'
              : 'border-transparent text-navy-450 dark:text-carbon-500 hover:text-navy-700 dark:hover:text-carbon-350'
          }`}
        >
          <Layers className="w-4 h-4" /> App Modules Portfolio
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 font-sans font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-navy-900 dark:border-white text-navy-900 dark:text-white'
              : 'border-transparent text-navy-450 dark:text-carbon-500 hover:text-navy-700 dark:hover:text-carbon-350'
          }`}
        >
          <Settings2 className="w-4 h-4" /> Enterprise App Config
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="grid grid-cols-1">
        
        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-navy-800 dark:text-gray-300" /> Identity Allocation Directory
                </h3>
                <p className="text-navy-550 dark:text-carbon-450 text-xs mt-0.5">
                  {isSuperAdmin 
                    ? 'Manage active logging accounts, assign multiple roles, and adjust module scope.' 
                    : 'List of registered logistics platform credentials (Admin Read Only).'}
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => handleOpenFormModal()}
                  className="bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-100 text-white dark:text-black px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-xs font-bold shrink-0 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create System User
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-carbon-900 rounded-xl border border-navy-150 dark:border-carbon-805 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-navy-50/70 dark:bg-carbon-950/40 border-b border-navy-150 dark:border-carbon-805 text-navy-450 dark:text-carbon-450 text-[10.5px] uppercase tracking-wider font-bold">
                      <th className="p-4">Staff Identifier</th>
                      <th className="p-4">Assigned Role Vectors</th>
                      <th className="p-4">Module Allowances</th>
                      <th className="p-4">Credentials Status</th>
                      <th className="p-4 text-center">Account State</th>
                      {isSuperAdmin && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50 dark:divide-carbon-805/50 text-xs">
                    {users.map((user) => {
                      const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
                      const activeState = user.is_active !== false;

                      return (
                        <tr key={user.id} className="hover:bg-navy-50/50 dark:hover:bg-carbon-850/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-navy-900 dark:bg-carbon-800 text-white dark:text-gray-300 items-center justify-center font-bold text-xs flex">
                                {user.username[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-navy-900 dark:text-white">{user.username}</p>
                                <p className="text-[10px] text-navy-400 font-mono tracking-wide">ID: {user.id}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {userRoles.map((r) => (
                                <span 
                                  key={r} 
                                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase tracking-wider ${
                                    r === 'SuperAdmin' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/40' :
                                    r === 'Admin' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40' :
                                    r === 'Dispatcher' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-900/40' :
                                    r === 'Encoder' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/40' :
                                    'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-450 border-gray-150 dark:border-gray-700'
                                  }`}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex gap-1.5 flex-wrap">
                              {user.permissions.includes('trip_scheduling') && (
                                <span className="px-2 py-0.5 bg-sky-500/10 dark:bg-sky-500/5 text-sky-700 dark:text-sky-400 border border-sky-500/15 dark:border-sky-500/10 rounded text-[9.5px] font-medium">LogiTrack</span>
                              )}
                              {user.permissions.includes('inventory') && (
                                <span className="px-2 py-0.5 bg-amber-500/10 dark:bg-amber-500/5 text-amber-700 dark:text-amber-450 border border-amber-500/15 dark:border-amber-500/10 rounded text-[9.5px] font-medium">Inventory</span>
                              )}
                              {user.permissions.includes('billing') && (
                                <span className="px-2 py-0.5 bg-purple-500/10 dark:bg-purple-500/5 text-purple-700 dark:text-purple-400 border border-purple-500/15 dark:border-purple-500/10 rounded text-[9.5px] font-medium">Billing</span>
                              )}
                              {user.permissions.length === 0 && (
                                <span className="text-navy-400 dark:text-carbon-500 italic text-[11px]">No module access configured</span>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-mono text-navy-500 dark:text-carbon-400 tracking-wide select-all bg-navy-50 dark:bg-carbon-950 px-2 py-1 rounded">
                              {user.password || '●●●●●●●●'}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            {activeState ? (
                              <button
                                onClick={() => isSuperAdmin && handleDeactivateTrigger(user.id)}
                                disabled={!isSuperAdmin}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30 text-[10px] font-bold uppercase tracking-wider ${isSuperAdmin ? 'hover:bg-red-50 hover:text-red-650 hover:border-red-200 cursor-pointer group' : ''}`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="group-hover:hidden">Active</span>
                                <span className="hidden group-hover:inline">Deactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => isSuperAdmin && handleActivateUser(user.id)}
                                disabled={!isSuperAdmin}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-150 dark:border-red-900/30 text-[10px] font-bold uppercase tracking-wider ${isSuperAdmin ? 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer' : ''}`}
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Suspended</span>
                              </button>
                            )}
                          </td>

                          {isSuperAdmin && (
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleOpenFormModal(user)} 
                                  title="Edit User profile, roles and credentials"
                                  className="p-1.5 hover:bg-navy-100 dark:hover:bg-carbon-800 text-navy-600 dark:text-carbon-400 hover:text-navy-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {user.username !== 'SuperAdmin' && (
                                  <button 
                                    onClick={() => onDeleteUser && onDeleteUser(user.id)} 
                                    title="Hard Delete credential record"
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-navy-400 hover:text-red-600 dark:text-carbon-400 dark:hover:text-red-450 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROLE PERMISSION MATRIX */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-650 dark:text-teal-400" /> Role & Privilege Vectors
              </h3>
              <p className="text-navy-550 dark:text-carbon-450 text-xs mt-0.5">
                The enterprise role hierarchy is globally mapped here. Modifications of role capabilities require configuration patches.
              </p>
            </div>

            {/* DETAILED CARDS INVENTORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleDefinitions.map((role) => (
                <div key={role.code} className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-805 p-5 rounded-xl shadow-xs relative flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-extrabold border uppercase tracking-wider ${
                        role.code === 'SuperAdmin' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-100' :
                        role.code === 'Admin' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100' :
                        role.code === 'Dispatcher' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450 border-amber-100' :
                        role.code === 'Encoder' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-100' :
                        'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-450 border-gray-150'
                      }`}>
                        {role.code}
                      </span>
                      <Lock className="w-3.5 h-3.5 text-navy-300 dark:text-carbon-600" title="Fixed Role Architecture" />
                    </div>
                    
                    <p className="text-[11.5px] text-navy-600 dark:text-carbon-400 leading-relaxed font-sans mb-4">
                      {role.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-navy-50 dark:border-carbon-805/55">
                    <p className="text-[9.5px] font-extrabold text-navy-450 dark:text-carbon-500 uppercase tracking-widest mb-1.5">Authorized Capabilities</p>
                    <ul className="space-y-1 text-[10.5px] text-navy-700 dark:text-carbon-350">
                      {role.permissions.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* HIGH DENSITY PERMISSION MATRIX */}
            <div className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-805 rounded-xl overflow-hidden shadow-xs mt-6">
              <div className="p-4 border-b border-navy-100 dark:border-carbon-800 bg-navy-50/20 dark:bg-carbon-950/30 flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider">Cross-Reference Permission Matrix</h4>
                <span className="text-[10px] font-semibold text-navy-500 dark:text-carbon-500">Read-Only transparency map</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-navy-50/30 dark:bg-carbon-950/10 border-b border-navy-100 dark:border-carbon-800 text-[10px] text-navy-450 dark:text-carbon-450 uppercase font-bold tracking-wider">
                      <th className="p-3 pl-4">Platform Module / Control Vector</th>
                      <th className="p-3 text-center">SuperAdmin</th>
                      <th className="p-3 text-center">Admin</th>
                      <th className="p-3 text-center">Dispatcher</th>
                      <th className="p-3 text-center">Encoder</th>
                      <th className="p-3 text-center">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50 dark:divide-carbon-800/40 text-[11px] text-navy-700 dark:text-carbon-300">
                    <tr>
                      <td className="p-3 pl-4 font-bold text-navy-900 dark:text-white">Credentials & Users Provisioning</td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-navy-900 dark:text-white">Enterprise Systems Configurations</td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-navy-900 dark:text-white">Trip Scheduling (Create trips/advices)</td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-navy-900 dark:text-white">Trip Allocation (Assign vehicle & staff)</td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center text-yellow-500 font-semibold">Limited</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-navy-900 dark:text-white">Fleet Truck Profile Config (Writes)</td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-navy-900 dark:text-white">Operators & Personnel Enrollments</td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                      <td className="p-3 text-center text-red-500 font-bold">-</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-navy-900 dark:text-white">Logistics Tables & Dispatch board (Read Only)</td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                      <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: APP MODULES PORTFOLIO */}
        {activeTab === 'modules' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> App Modules Portfolio
              </h3>
              <p className="text-navy-550 dark:text-carbon-450 text-xs mt-0.5">
                Overview of primary enterprise service pipelines. Custom modules are loaded relative to system dependencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* TRIP SCHEDULING - ACTIVE */}
              <div className="bg-white dark:bg-carbon-900 border-2 border-emerald-500/25 dark:border-emerald-500/10 p-6 rounded-xl relative overflow-hidden shadow-xs flex flex-col justify-between h-[200px]">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-navy-900 dark:text-white">Trip Scheduling (LogiTrack)</h4>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-[9.5px] font-bold uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-navy-550 dark:text-carbon-400 leading-relaxed font-sans mb-4">
                    Primary dispatch matrix board. Integrated with telemetry registers, route managers, operator directories, and live tracking alerts.
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" /> Fully functional Core Module
                </div>
              </div>

              {/* INVENTORY - PLACEHOLDER */}
              <div className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-805 p-6 rounded-xl relative overflow-hidden shadow-xs flex flex-col justify-between h-[200px]">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-navy-400 dark:text-carbon-500">Warehouse Inventory</h4>
                    <span className="px-2 py-0.5 rounded bg-navy-100 dark:bg-carbon-800 text-navy-500 dark:text-carbon-400 border border-navy-200 dark:border-carbon-700 text-[9.5px] font-bold uppercase tracking-wide">
                      Placeholder
                    </span>
                  </div>
                  <p className="text-xs text-navy-450 dark:text-carbon-450 leading-relaxed font-sans mb-4">
                    Container storage, warehouse pallet slots, yard allocation indices, and bulk grain transport scales. Scheduled for engineering release in Q3 2026.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-navy-500 dark:text-carbon-400 font-medium bg-navy-50 dark:bg-carbon-950 p-2 rounded">
                  <Lock className="w-3.5 h-3.5 shrink-0" /> Config & CRUD settings locked
                </div>
              </div>

              {/* BILLING - PLACEHOLDER */}
              <div className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-805 p-6 rounded-xl relative overflow-hidden shadow-xs flex flex-col justify-between h-[200px]">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-navy-440 dark:text-carbon-500">Accounts & Billing</h4>
                    <span className="px-2 py-0.5 rounded bg-navy-100 dark:bg-carbon-800 text-navy-500 dark:text-carbon-400 border border-navy-200 dark:border-carbon-700 text-[9.5px] font-bold uppercase tracking-wide">
                      Placeholder
                    </span>
                  </div>
                  <p className="text-xs text-navy-450 dark:text-carbon-450 leading-relaxed font-sans mb-4">
                    Client tariff matrices, automatic demurrage scaling, fuel surcharges, driver commission slips, and AR invoicing pipelines. Scheduled for engineering release in Q4 2026.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-navy-500 dark:text-carbon-400 font-medium bg-navy-50 dark:bg-carbon-950 p-2 rounded">
                  <Lock className="w-3.5 h-3.5 shrink-0" /> Config & CRUD settings locked
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: APP SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-navy-800 dark:text-gray-300" /> Administrative Telemetry Config
              </h3>
              <p className="text-navy-550 dark:text-carbon-450 text-xs mt-0.5">
                Set operational variables, branch definitions, and critical alerts thresholds globally for Cloudy.
              </p>
            </div>

            <form onSubmit={handleSaveAppConfigurations} className="bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-805 rounded-xl p-6 sm:p-8 max-w-2xl shadow-xs space-y-6">
              
              {configSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs rounded-lg font-bold text-center flex items-center justify-center gap-2 transition-all">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-450" /> System settings recorded and enforced across telemetry boards!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* TIMEZONE INPUT */}
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-navy-450 dark:text-carbon-500" /> Application Jet-Timezone
                  </label>
                  <select
                    value={appTimezone}
                    onChange={(e) => setAppTimezone(e.target.value)}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded-lg p-2.5 text-navy-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-navy-400 cursor-pointer"
                  >
                    <option value="Asia/Manila">Asia/Manila (PST, UTC+08:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SST, UTC+08:00)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+09:00)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                  <p className="text-[10px] text-navy-400 dark:text-carbon-500 mt-1">Default timezone used to synchronize all trip dispatch timestamp logs.</p>
                </div>

                {/* DEFAULT STORAGE HUB BRANCH */}
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-navy-450 dark:text-carbon-500" /> Primary Dispatch Branch Hub
                  </label>
                  <select
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded-lg p-2.5 text-navy-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-navy-400 cursor-pointer"
                  >
                    <option value="branch-1">MNL-HUB : Metro Manila Operations</option>
                    <option value="branch-2">CEB-HUB : Visayas Mandaue Hub</option>
                    <option value="branch-3">DVO-HUB : Mindanao Davao Port Hub</option>
                  </select>
                  <p className="text-[10px] text-navy-400 dark:text-carbon-500 mt-1">Default origin terminal pre-selected for new logi trip schedules.</p>
                </div>

                {/* PLATFORM SESSION TIMEOUT */}
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-navy-450 dark:text-carbon-500" /> Inactivity Session Expiry
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded-lg pl-3 pr-12 py-2.5 text-navy-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-navy-400"
                    />
                    <span className="absolute right-3.5 top-3 text-[10.5px] font-bold text-navy-450 dark:text-carbon-500 uppercase">mins</span>
                  </div>
                  <p className="text-[10px] text-navy-400 dark:text-carbon-500 mt-1">Time elapsed without platform action before user gets forced-login validation.</p>
                </div>

                {/* TRIP OVERDUE ALERT LIMITS */}
                <div>
                  <label className="block text-[10px] font-bold text-navy-500 dark:text-carbon-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-navy-450 dark:text-carbon-500" /> Pending Trip alert offset
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={pendingTripAlertHours}
                      onChange={(e) => setPendingTripAlertHours(e.target.value)}
                      className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded-lg pl-3 pr-14 py-2.5 text-navy-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-navy-400"
                    />
                    <span className="absolute right-3.5 top-3 text-[10.5px] font-bold text-navy-450 dark:text-carbon-500 uppercase">hours</span>
                  </div>
                  <p className="text-[10px] text-navy-400 dark:text-carbon-500 mt-1">Pickup offset margin to flag "Scheduled" trips as overdue on dispatch alert boards.</p>
                </div>

              </div>

              {/* SAVE FORM ACTION BAR */}
              <div className="pt-4 border-t border-navy-100 dark:border-carbon-800 flex justify-end">
                <button
                  type="submit"
                  disabled={!isSuperAdmin}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm ${
                    isSuperAdmin
                      ? 'bg-navy-900 dark:bg-white text-white dark:text-black hover:bg-navy-800 dark:hover:bg-gray-100 cursor-pointer'
                      : 'bg-navy-100 dark:bg-carbon-800 text-navy-400 dark:text-carbon-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" /> Save system Settings
                </button>
              </div>

              {!isSuperAdmin && (
                <div className="flex items-center gap-1.5 p-3 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Modification of enterprise database configurations is strictly locked to Root SuperAdmin users.</span>
                </div>
              )}
            </form>
          </div>
        )}

      </div>

      {/* DIALOG 1: CONFIRM USER DEACTIVATION */}
      {confirmDeactivateId && (
        <div className="fixed inset-0 bg-navy-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-scale-up">
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> Confirm User Deactivation
            </h3>
            
            <p className="text-xs text-navy-600 dark:text-carbon-400 leading-relaxed mb-5">
              Are you sure you want to suspend/deactivate the user <strong className="text-black dark:text-white">"{users.find(u => u.id === confirmDeactivateId)?.username}"</strong>? 
              Suspended users are instantly blocked from entering any module of the Cloudy Logistics suite.
            </p>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setConfirmDeactivateId(null)}
                className="bg-navy-50 hover:bg-navy-100 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-navy-800 dark:text-white px-3.5 py-2 rounded text-xs font-bold cursor-pointer"
              >
                No, Keep Active
              </button>
              <button 
                onClick={executeDeactivate}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold shadow cursor-pointer"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 2: CREATE / EDIT USER MODAL */}
      {isModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 bg-navy-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-carbon-900 rounded-xl border border-navy-150 dark:border-carbon-800 w-full max-w-md shadow-2xl overflow-hidden my-8">
            
            <div className="p-5 border-b border-navy-100 dark:border-carbon-850 flex justify-between items-center bg-navy-50/70 dark:bg-carbon-950">
              <h2 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider">
                {editingId ? 'Modify Staff Credentials Profile' : 'Enroll New Access Profile'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-450 hover:text-navy-800 dark:text-carbon-450 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
              
              {/* USERNAME INPUT */}
              <div>
                <label className="block text-[10px] font-bold text-navy-450 dark:text-carbon-500 mb-1.5 uppercase tracking-wide">Account Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="e.g. CebuDispatcher"
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded-lg p-2.5 text-navy-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-navy-500 font-semibold"
                  required 
                  disabled={editingId === 'user-1' || formData.username === 'SuperAdmin'} // Root cannot be renamed
                />
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <label className="block text-[10px] font-bold text-navy-450 dark:text-carbon-500 mb-1.5 uppercase tracking-wide">Access Password</label>
                <input 
                  type="text" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="admin123"
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded-lg p-2.5 text-navy-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-navy-500 font-mono font-bold"
                  required={!editingId}
                />
              </div>

              {/* MULTI_ROLE OPTION SELECTOR FIELD */}
              <div>
                <label className="block text-[10px] font-bold text-navy-450 dark:text-carbon-500 mb-2 uppercase tracking-wide flex items-center justify-between">
                  <span>Assign Access Roles (one or more)</span>
                  <HelpCircle className="w-3.5 h-3.5 text-navy-300 dark:text-carbon-600" title="Assign multiple roles. Highest privilege level operates as standard view level." />
                </label>
                
                <div className="space-y-2 bg-navy-50/20 dark:bg-carbon-950/20 p-3 rounded-lg border border-navy-100 dark:border-carbon-805">
                  {availableRolesList.map((roleOpt) => {
                    const isChecked = formData.roles.includes(roleOpt);
                    return (
                      <div 
                        key={roleOpt}
                        onClick={() => handleRoleToggle(roleOpt)}
                        className={`flex items-center justify-between p-2 rounded border text-xs cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-navy-900 text-white border-navy-900 dark:bg-carbon-800 dark:border-carbon-700' 
                            : 'bg-white dark:bg-carbon-900 hover:bg-navy-50 dark:hover:bg-carbon-850/30 border-navy-150 dark:border-carbon-800 text-navy-800 dark:text-carbon-300'
                        }`}
                      >
                        <span className="font-bold">{roleOpt}</span>
                        {isChecked ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px]">✓</span>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-navy-300 dark:border-carbon-700" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MODULE ACCESS ASSIGNMENT */}
              <div>
                <label className="block text-[10px] font-bold text-navy-450 dark:text-carbon-500 mb-2.5 uppercase tracking-wide">Scope permissions</label>
                <div className="space-y-2">
                  <div 
                    onClick={() => handlePermissionToggle('trip_scheduling')}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${formData.permissions.trip_scheduling ? 'bg-navy-50 dark:bg-carbon-800 border-navy-200 dark:border-carbon-700' : 'bg-white dark:bg-carbon-950 border-navy-150 dark:border-carbon-800'}`}
                  >
                    <div className="text-xs">
                      <p className={`font-bold ${formData.permissions.trip_scheduling ? 'text-navy-900 dark:text-white' : 'text-navy-450 dark:text-carbon-500'}`}>Trip Scheduling Module</p>
                      <p className="text-[10px] text-navy-400 mt-0.5">Allows access to LogiTrack dispatch desks</p>
                    </div>
                    {formData.permissions.trip_scheduling && <Check className="w-4 h-4 text-navy-900 dark:text-white" />}
                  </div>

                  <div 
                    onClick={() => handlePermissionToggle('inventory')}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${formData.permissions.inventory ? 'bg-navy-50 dark:bg-carbon-850 border-navy-200 dark:border-carbon-750' : 'bg-white dark:bg-carbon-950 border-navy-150 dark:border-carbon-800'}`}
                  >
                    <div className="text-xs">
                      <p className={`font-bold ${formData.permissions.inventory ? 'text-navy-900 dark:text-white' : 'text-navy-450 dark:text-carbon-500'}`}>Inventory Management</p>
                      <p className="text-[10px] text-navy-400 mt-0.5">Placeholder portfolio status view limits</p>
                    </div>
                    {formData.permissions.inventory && <Check className="w-4 h-4 text-navy-900 dark:text-white" />}
                  </div>

                  <div 
                    onClick={() => handlePermissionToggle('billing')}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${formData.permissions.billing ? 'bg-navy-50 dark:bg-carbon-850 border-navy-200 dark:border-carbon-750' : 'bg-white dark:bg-carbon-950 border-navy-150 dark:border-carbon-800'}`}
                  >
                    <div className="text-xs">
                      <p className={`font-bold ${formData.permissions.billing ? 'text-navy-900 dark:text-white' : 'text-navy-450 dark:text-carbon-500'}`}>Billing & Account Module</p>
                      <p className="text-[10px] text-navy-400 mt-0.5">Placeholder invoicing limits</p>
                    </div>
                    {formData.permissions.billing && <Check className="w-4 h-4 text-navy-900 dark:text-white" />}
                  </div>
                </div>
              </div>

              {/* SAVE FORM ACTIONS */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-navy-200 dark:bg-carbon-800 dark:border-carbon-700 hover:bg-navy-50 dark:hover:bg-carbon-700 text-navy-700 dark:text-white py-2 rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-100 text-white dark:text-black py-2 rounded text-xs font-bold transition-colors shadow shadow-navy-950/20"
                >
                  {editingId ? 'Save Credentials' : 'Enroll Operator'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
