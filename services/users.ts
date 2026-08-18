import { OFFICIAL_ROLES } from '../permissions';
import type { SystemUser } from '../types';
import type { DataService } from './apiService';
import type { AuthService, PlatformRoleCode, UserAdministrationService, UserInvitationInput } from './contracts';
import { ServiceError } from './contracts';

const validRole = (role: string): role is PlatformRoleCode => (OFFICIAL_ROLES as readonly string[]).includes(role);
const failure = (code: string, message: string, status = 400) => {
  throw new ServiceError({ status, code, message, kind: status === 404 ? 'not_found' : 'validation' });
};
export const createDevelopmentUserAdministrationService = (
  data: DataService,
  auth: AuthService,
): UserAdministrationService => {
  const get = async (id: string) => {
    const value = (await data.getUsers()).find((user) => user.id === id);
    if (!value) failure('USER_NOT_FOUND', 'User not found.', 404);
    return value as SystemUser;
  };
  const checkRole = (role: string) => {
    if (!validRole(role)) failure('INVALID_PLATFORM_ROLE', 'Choose one official platform role.');
    return role;
  };
  return {
    list: () => data.getUsers(),
    invite: async (input: UserInvitationInput) => {
      if (!input.username.trim()) failure('USERNAME_REQUIRED', 'Username is required.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) failure('EMAIL_INVALID', 'Enter a valid invitation email.');
      checkRole(input.role);
      if ((await data.getUsers()).some((user) => user.username.toLowerCase() === input.username.trim().toLowerCase()))
        failure('USERNAME_DUPLICATE', 'Username is already in use.');
      return data.createUser({
        username: input.username.trim(),
        email: input.email.trim(),
        role: input.role,
        roles: [input.role],
        permissions: ['trip_scheduling'],
        is_active: false,
        invitation_status: 'PENDING',
      });
    },
    assignRole: async (userId, role) => {
      checkRole(role);
      const user = await get(userId);
      return data.updateUser(user.id, { role, roles: [role] });
    },
    deactivate: async ({ userId, reason }) => {
      if (!reason.trim()) failure('REASON_REQUIRED', 'A deactivation reason is required.');
      const user = await get(userId);
      const updated = await data.updateUser(user.id, { is_active: false });
      await auth.invalidateUser(
        user.id,
        'Your account was deactivated. Sign in again after an administrator reactivates it.',
      );
      return updated;
    },
    reactivate: async ({ userId, reason }) => {
      if (!reason.trim()) failure('REASON_REQUIRED', 'A reactivation reason is required.');
      const user = await get(userId);
      if (user.invitation_status === 'PENDING') {
        failure(
          'INVITATION_PENDING',
          'This invitation is still pending provider acceptance and cannot be reactivated.',
        );
      }
      return data.updateUser(user.id, { is_active: true });
    },
  };
};
