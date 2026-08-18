import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Check, Edit2, Plus, Save, Settings2, Shield, UserCheck, Users, UserX } from 'lucide-react';
import {
  OFFICIAL_ROLES,
  permissionActions,
  permissionResources,
  ROLE_PERMISSION_MATRIX,
  usePermissions,
} from '../permissions';
import { normalizeServiceError, services } from '../services';
import type { AppSetting, AuditLog, SystemUser, UserRoleType } from '../types';
import { statusToneClasses } from '../design/statusTokens';
import { uiClasses } from '../design/tokens';
import { Button, ConfirmDialog, EmptyState, ErrorState, FormField, Modal, SearchInput, StatusBadge } from './ui';

interface UserManagementProps {
  users: SystemUser[];
  onAddUser: (user: Omit<SystemUser, 'id'>) => void | Promise<void>;
  onUpdateUser: (user: SystemUser) => void | Promise<void>;
  onDeactivateUser: (userId: string, reason: string) => void | Promise<void>;
  onReactivateUser: (userId: string, reason: string) => void | Promise<void>;
}

type SettingsTab = 'users' | 'roles' | 'settings' | 'audit';

// Role tone follows the shared brand and status palette: navy/carbon for authority
// levels, status tones for the remaining operational roles.
const roleBadgeClasses: Record<UserRoleType, string> = {
  SuperAdmin: 'border-navy-900 bg-navy-900 text-white dark:border-white dark:bg-white dark:text-carbon-950',
  Admin: statusToneClasses.info,
  Dispatcher: statusToneClasses.warning,
  Encoder: statusToneClasses.success,
  Viewer: statusToneClasses.neutral,
};

const isOfficialRole = (role: string): role is UserRoleType => (OFFICIAL_ROLES as readonly string[]).includes(role);

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeactivateUser,
  onReactivateUser,
}) => {
  const permissions = usePermissions();
  const canManageUsers = permissions.can(permissionActions.manage, permissionResources.users);
  const canAssignRoles = permissions.can(permissionActions.assign, permissionResources.usersRoles);
  const canUpdateSettings = permissions.can(permissionActions.update, permissionResources.settings);
  const canReadAudit = permissions.can(permissionActions.read, permissionResources.auditLogs);
  const canDeactivateUsers = permissions.can(permissionActions.deactivate, permissionResources.users);
  const canReactivateUsers = permissions.can(permissionActions.reactivate, permissionResources.users);

  const visibleTabs = useMemo<SettingsTab[]>(
    () => [
      ...(canManageUsers ? (['users', 'roles'] as const) : []),
      'settings',
      ...(canReadAudit ? (['audit'] as const) : []),
    ],
    [canManageUsers, canReadAudit],
  );
  const [activeTab, setActiveTab] = useState<SettingsTab>(canManageUsers ? 'users' : 'settings');
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [settingValues, setSettingValues] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditQuery, setAuditQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('Viewer');
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<{ userId: string; active: boolean } | null>(null);
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(visibleTabs[0] ?? 'settings');
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    let active = true;
    const loadAdministrativeReadModels = async () => {
      setLoadError(null);
      try {
        const snapshot = await services.settingsAudit.getSnapshot();
        if (!active) return;
        setSettings(snapshot.settings);
        setSettingValues(Object.fromEntries(snapshot.settings.map((setting) => [setting.id, setting.setting_value])));
        setAuditLogs(canReadAudit ? snapshot.auditLogs : []);
      } catch (error) {
        if (active) setLoadError(normalizeServiceError(error).message);
      }
    };
    void loadAdministrativeReadModels();
    return () => {
      active = false;
    };
  }, [canReadAudit]);

  const openUserForm = (user?: SystemUser) => {
    if (!canManageUsers) return;
    setEditingUser(user ?? null);
    setUsername(user?.username ?? '');
    setEmail(user?.email ?? '');
    setSelectedRole(user && isOfficialRole(user.role) ? user.role : 'Viewer');
    setUserFormError(null);
    setUserModalOpen(true);
  };

  const submitUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageUsers || !canAssignRoles) return;
    setUserFormError(null);
    try {
      if (editingUser) {
        await onUpdateUser({
          ...editingUser,
          username,
          email,
          role: selectedRole,
          roles: [selectedRole],
          permissions: ['trip_scheduling'],
        });
      } else {
        await onAddUser({
          username,
          email,
          role: selectedRole,
          roles: [selectedRole],
          permissions: ['trip_scheduling'],
          is_active: true,
        });
      }
      setUserModalOpen(false);
      setNotice({
        type: 'success',
        text: editingUser ? 'Effective role updated.' : 'Development invitation recorded.',
      });
    } catch (error) {
      setUserFormError(normalizeServiceError(error).message);
    }
  };

  const updateUserActiveState = async (user: SystemUser, active: boolean, reason: string) => {
    if (active ? !canReactivateUsers : !canDeactivateUsers) return;
    if (!reason.trim()) {
      setLifecycleError(`A ${active ? 'reactivation' : 'deactivation'} reason is required.`);
      return;
    }
    setLifecycleError(null);
    try {
      if (active) await onReactivateUser(user.id, reason);
      else await onDeactivateUser(user.id, reason);
      setLifecycleTarget(null);
      setNotice({ type: 'success', text: `${user.username} ${active ? 'reactivated' : 'deactivated'}.` });
    } catch (error) {
      setLifecycleError(normalizeServiceError(error).message);
    }
  };

  const openLifecycleConfirmation = (userId: string, active: boolean) => {
    setLifecycleTarget({ userId, active });
    setLifecycleReason('');
    setLifecycleError(null);
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canUpdateSettings) return;
    setNotice(null);
    try {
      const actorUserId = permissions.identity.user?.id;
      if (!actorUserId) throw new Error('An authenticated administrator is required to update settings.');
      const updated = await services.settingsAudit.updateSettings(
        settings.map((setting) => ({
          settingId: setting.id,
          value: settingValues[setting.id] ?? '',
          actorUserId,
        })),
      );
      setSettings(updated);
      if (canReadAudit) setAuditLogs((await services.settingsAudit.getSnapshot()).auditLogs);
      setNotice({ type: 'success', text: 'Development settings updated.' });
    } catch (error) {
      setNotice({
        type: 'error',
        text: `${normalizeServiceError(error).message} Entered setting values were preserved.`,
      });
    }
  };

  const tabLabels: Record<SettingsTab, { label: string; icon: React.ReactNode }> = {
    users: { label: 'Users & roles', icon: <Users aria-hidden="true" className="h-4 w-4" /> },
    roles: { label: 'Fixed permission matrix', icon: <Shield aria-hidden="true" className="h-4 w-4" /> },
    settings: { label: 'Application settings', icon: <Settings2 aria-hidden="true" className="h-4 w-4" /> },
    audit: { label: 'Audit log', icon: <Activity aria-hidden="true" className="h-4 w-4" /> },
  };
  const filteredAuditLogs = useMemo(() => {
    const query = auditQuery.trim().toLowerCase();
    if (!query) return auditLogs;
    return auditLogs.filter((entry) =>
      [
        entry.action,
        entry.table_name,
        entry.record_id,
        entry.user_id,
        JSON.stringify(entry.old_values),
        JSON.stringify(entry.new_values),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [auditLogs, auditQuery]);

  return (
    <div className="h-full overflow-y-auto bg-navy-50 p-4 dark:bg-carbon-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-navy-200 pb-5 dark:border-carbon-800 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">System Settings & Controls</h1>
            <p className="mt-1 max-w-3xl text-sm text-navy-500 dark:text-carbon-400">
              Permission-aware development presentation. Frontend checks do not replace production API authorization or
              RLS.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 dark:border-carbon-800 dark:bg-carbon-900 dark:text-carbon-300">
            <Shield aria-hidden="true" className="h-4 w-4" />
            {permissions.identity.role}
            {permissions.identity.developmentOnly ? ' - development identity' : ''}
          </span>
        </header>

        {notice && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              notice.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
            }`}
            role={notice.type === 'error' ? 'alert' : 'status'}
          >
            {notice.text}
          </div>
        )}

        <div className="flex flex-wrap gap-1 border-b border-navy-200 dark:border-carbon-800" role="tablist">
          {visibleTabs.map((tab) => (
            <button
              aria-label={tabLabels[tab].label}
              aria-selected={activeTab === tab}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-2 text-xs font-bold uppercase tracking-wide sm:px-4 ${
                activeTab === tab
                  ? 'border-navy-900 text-navy-900 dark:border-white dark:text-white'
                  : 'border-transparent text-navy-500 hover:text-navy-900 dark:text-carbon-500 dark:hover:text-white'
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
            >
              {tabLabels[tab].icon}
              <span className="hidden sm:inline">{tabLabels[tab].label}</span>
            </button>
          ))}
        </div>

        {loadError ? (
          <ErrorState description={loadError} title="Settings service unavailable" />
        ) : (
          <>
            {activeTab === 'users' && canManageUsers && (
              <section aria-labelledby="users-heading" className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-bold text-navy-900 dark:text-white" id="users-heading">
                      Platform user invitations
                    </h2>
                    <p className="text-sm text-navy-500 dark:text-carbon-400">
                      Exactly one official role is effective. Credentials and production invitations remain
                      provider-owned.
                    </p>
                  </div>
                  <Button icon={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={() => openUserForm()}>
                    Invite platform user
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-navy-200 bg-white dark:border-carbon-800 dark:bg-carbon-900">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-navy-200 bg-navy-50 text-xs uppercase tracking-wide text-navy-500 dark:border-carbon-800 dark:bg-carbon-950 dark:text-carbon-400">
                      <tr>
                        <th className="p-4">Identity</th>
                        <th className="p-4">Effective role</th>
                        <th className="p-4">Boundary</th>
                        <th className="p-4">State</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100 dark:divide-carbon-800">
                      {users.map((user) => {
                        const role = isOfficialRole(user.role) ? user.role : 'Viewer';
                        const pendingInvitation = user.invitation_status === 'PENDING';
                        const active = user.is_active !== false;
                        const rootStateBlocked = user.id === 'user-1';
                        return (
                          <tr key={user.id}>
                            <td className="p-4 font-semibold text-navy-900 dark:text-white">{user.username}</td>
                            <td className="p-4">
                              <span className={`rounded border px-2 py-1 text-xs font-bold ${roleBadgeClasses[role]}`}>
                                {role}
                              </span>
                            </td>
                            <td className="p-4 text-navy-500 dark:text-carbon-400">
                              Development-only; no password stored
                            </td>
                            <td className="p-4">
                              <StatusBadge
                                hideCue
                                label={pendingInvitation ? 'Invitation pending' : active ? 'Active' : 'Inactive'}
                                status={pendingInvitation ? 'WARNING' : active ? 'ACTIVE' : 'INACTIVE'}
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  aria-label={`Edit ${user.username}`}
                                  icon={<Edit2 aria-hidden="true" className="h-4 w-4" />}
                                  onClick={() => openUserForm(user)}
                                  size="icon"
                                  variant="secondary"
                                />
                                {active ? (
                                  <Button
                                    aria-label={`Deactivate ${user.username}`}
                                    disabled={rootStateBlocked}
                                    icon={<UserX aria-hidden="true" className="h-4 w-4" />}
                                    onClick={() => openLifecycleConfirmation(user.id, false)}
                                    size="icon"
                                    title={
                                      rootStateBlocked
                                        ? 'The default development SuperAdmin identity must remain active.'
                                        : 'Deactivate user'
                                    }
                                    variant="danger"
                                  />
                                ) : !pendingInvitation ? (
                                  <Button
                                    aria-label={`Reactivate ${user.username}`}
                                    icon={<UserCheck aria-hidden="true" className="h-4 w-4" />}
                                    onClick={() => openLifecycleConfirmation(user.id, true)}
                                    size="icon"
                                    title="Reactivate user"
                                    variant="success"
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'roles' && canManageUsers && (
              <section aria-labelledby="roles-heading" className="space-y-4">
                <div>
                  <h2 className="font-bold text-navy-900 dark:text-white" id="roles-heading">
                    Fixed MVP permission catalog
                  </h2>
                  <p className="text-sm text-navy-500 dark:text-carbon-400">
                    This catalog is read-only and comes from the centralized policy. Role capabilities are not
                    configurable in the MVP.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {OFFICIAL_ROLES.map((role) => (
                    <article
                      className="rounded-xl border border-navy-200 bg-white p-5 dark:border-carbon-800 dark:bg-carbon-900"
                      key={role}
                    >
                      <span className={`rounded border px-2 py-1 text-xs font-bold ${roleBadgeClasses[role]}`}>
                        {role}
                      </span>
                      <ul className="mt-4 space-y-2 text-xs text-navy-600 dark:text-carbon-300">
                        {ROLE_PERMISSION_MATRIX[role].map((permission) => (
                          <li className="flex items-start gap-2" key={permission}>
                            <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <code>{permission}</code>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section aria-labelledby="settings-heading" className="space-y-4">
                <div>
                  <h2 className="font-bold text-navy-900 dark:text-white" id="settings-heading">
                    Application settings
                  </h2>
                  <p className="text-sm text-navy-500 dark:text-carbon-400">
                    {canUpdateSettings
                      ? 'SuperAdmin may update development setting values.'
                      : 'Admin has read-only Settings access. Update controls are not available.'}
                  </p>
                </div>
                <form
                  className="max-w-3xl space-y-4 rounded-xl border border-navy-200 bg-white p-5 dark:border-carbon-800 dark:bg-carbon-900"
                  onSubmit={saveSettings}
                >
                  {settings.map((setting) => (
                    <FormField
                      hint={setting.description}
                      key={setting.id}
                      label={setting.setting_key.replaceAll('_', ' ')}
                    >
                      <input
                        className={`${uiClasses.field} min-h-11`}
                        disabled={!canUpdateSettings}
                        onChange={(event) =>
                          setSettingValues((current) => ({ ...current, [setting.id]: event.target.value }))
                        }
                        value={settingValues[setting.id] ?? ''}
                      />
                    </FormField>
                  ))}
                  {canUpdateSettings && (
                    <div className="flex justify-end border-t border-navy-100 pt-4 dark:border-carbon-800">
                      <Button icon={<Save aria-hidden="true" className="h-4 w-4" />} type="submit">
                        Save settings
                      </Button>
                    </div>
                  )}
                </form>
              </section>
            )}

            {activeTab === 'audit' && canReadAudit && (
              <section aria-labelledby="audit-heading" className="space-y-4">
                <div>
                  <h2 className="font-bold text-navy-900 dark:text-white" id="audit-heading">
                    Audit log
                  </h2>
                  <p className="text-sm text-navy-500 dark:text-carbon-400">
                    Read-only development activity. This adapter provides no production audit guarantee.
                  </p>
                </div>
                <FormField className="max-w-md" label="Filter audit history">
                  <SearchInput
                    className="min-h-11"
                    onChange={setAuditQuery}
                    placeholder="Action, resource, record, or value"
                    value={auditQuery}
                  />
                </FormField>
                {filteredAuditLogs.length === 0 ? (
                  <EmptyState
                    description={
                      auditLogs.length
                        ? 'No audit entries match this filter.'
                        : 'No development activity has been recorded in this in-memory session.'
                    }
                    title={auditLogs.length ? 'No matching audit entries' : 'No audit entries'}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-navy-200 bg-white dark:border-carbon-800 dark:bg-carbon-900">
                    <table className="w-full min-w-[840px] text-left text-sm">
                      <thead className="border-b border-navy-200 bg-navy-50 text-xs uppercase text-navy-500 dark:border-carbon-800 dark:bg-carbon-950 dark:text-carbon-400">
                        <tr>
                          <th className="p-4">Action</th>
                          <th className="p-4">Resource</th>
                          <th className="p-4">Record</th>
                          <th className="p-4">Actor</th>
                          <th className="p-4">Change</th>
                          <th className="p-4">Recorded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-100 dark:divide-carbon-800">
                        {filteredAuditLogs.map((entry) => (
                          <tr key={entry.id}>
                            <td className="p-4 font-semibold text-navy-900 dark:text-white">{entry.action}</td>
                            <td className="p-4 text-navy-600 dark:text-carbon-300">{entry.table_name}</td>
                            <td className="p-4 font-mono text-xs text-navy-500 dark:text-carbon-400">
                              {entry.record_id ?? '-'}
                            </td>
                            <td className="p-4 font-mono text-xs text-navy-500 dark:text-carbon-400">
                              {entry.user_id ?? 'Development adapter'}
                            </td>
                            <td className="max-w-xs p-4 text-xs text-navy-600 dark:text-carbon-300">
                              {entry.old_values || entry.new_values ? (
                                <span>
                                  {entry.old_values ? `${JSON.stringify(entry.old_values)} → ` : ''}
                                  {entry.new_values ? JSON.stringify(entry.new_values) : ''}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-4 text-navy-500 dark:text-carbon-400">
                              {new Date(entry.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <Modal
        description="Cloudy stores no password. Invitations are development-only records until a production identity provider accepts them. Select exactly one official effective role."
        onClose={() => setUserModalOpen(false)}
        open={userModalOpen && canManageUsers}
        title={editingUser ? 'Edit platform user' : 'Invite platform user'}
      >
        <form className="space-y-4" onSubmit={submitUser}>
          {userFormError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
              role="alert"
            >
              {userFormError} Current form values were preserved.
            </div>
          )}
          <FormField label="Username" required>
            <input
              className={`${uiClasses.field} min-h-11`}
              disabled={editingUser?.id === 'user-1'}
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
          </FormField>
          {!editingUser && (
            <FormField label="Invitation email" required>
              <input
                className={`${uiClasses.field} min-h-11`}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </FormField>
          )}
          <FormField label="Effective role">
            <select
              className={`${uiClasses.field} min-h-11`}
              onChange={(event) => setSelectedRole(event.target.value as UserRoleType)}
              value={selectedRole}
            >
              {OFFICIAL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-2 border-t border-navy-100 pt-4 dark:border-carbon-800">
            <Button onClick={() => setUserModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button type="submit">{editingUser ? 'Save effective role' : 'Record invitation'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        cancelLabel="Keep active"
        confirmLabel={lifecycleTarget?.active ? 'Reactivate user' : 'Deactivate user'}
        detail="The development adapter is in-memory and provides no production authorization or audit guarantee. Historical references remain readable."
        description={`${lifecycleTarget?.active ? 'Reactivate' : 'Deactivate'} ${users.find((user) => user.id === lifecycleTarget?.userId)?.username ?? 'this user'}?`}
        onCancel={() => setLifecycleTarget(null)}
        onConfirm={() => {
          const user = users.find((candidate) => candidate.id === lifecycleTarget?.userId);
          if (user && lifecycleTarget) void updateUserActiveState(user, lifecycleTarget.active, lifecycleReason);
        }}
        open={Boolean(lifecycleTarget) && (lifecycleTarget?.active ? canReactivateUsers : canDeactivateUsers)}
        title={`Confirm User ${lifecycleTarget?.active ? 'Reactivation' : 'Deactivation'}`}
      >
        <FormField label={`${lifecycleTarget?.active ? 'Reactivation' : 'Deactivation'} reason`} required>
          <textarea
            className={`${uiClasses.field} min-h-20`}
            onChange={(event) => setLifecycleReason(event.target.value)}
            value={lifecycleReason}
          />
        </FormField>
        {lifecycleError ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {lifecycleError}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
};

export default UserManagement;
