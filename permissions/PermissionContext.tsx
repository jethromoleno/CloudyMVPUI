import React, { createContext, useContext } from 'react';
import type { EffectivePermissions } from './policy';
import { createEffectivePermissions } from './policy';

const defaultPermissions = createEffectivePermissions({
  adapterKind: 'development',
  authStatus: 'unauthenticated',
  user: null,
});

const PermissionContext = createContext<EffectivePermissions>(defaultPermissions);

export const PermissionProvider: React.FC<{ children: React.ReactNode; value: EffectivePermissions }> = ({
  children,
  value,
}) => <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;

export const usePermissions = () => useContext(PermissionContext);
