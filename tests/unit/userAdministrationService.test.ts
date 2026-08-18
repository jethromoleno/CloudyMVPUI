import { describe, expect, it, vi } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import type { AuthService } from '../../services/contracts';
import { createDevelopmentUserAdministrationService } from '../../services/users';

const createService = () => {
  const invalidateUser = vi.fn(async () => undefined);
  const auth = { invalidateUser } as unknown as AuthService;
  return { service: createDevelopmentUserAdministrationService(developmentDataAdapter, auth), invalidateUser };
};

describe('Phase 3D user administration service', () => {
  it('creates only a pending development invitation with one official role', async () => {
    const { service } = createService();
    const invited = await service.invite({
      username: 'P3DUnitInvite',
      email: 'p3d-unit@example.test',
      role: 'Dispatcher',
    });

    expect(invited).toMatchObject({
      username: 'P3DUnitInvite',
      email: 'p3d-unit@example.test',
      role: 'Dispatcher',
      roles: ['Dispatcher'],
      invitation_status: 'PENDING',
      is_active: false,
    });
    await expect(
      service.invite({ username: 'InvalidRole', email: 'invalid@example.test', role: 'NotAnOfficialRole' as 'Viewer' }),
    ).rejects.toMatchObject({ code: 'INVALID_PLATFORM_ROLE' });
  });

  it('requires reasons, preserves the effective role, and invalidates a current in-memory session on deactivation', async () => {
    const { service, invalidateUser } = createService();
    const target = (await service.list()).find((user) => user.id === 'user-2');
    expect(target).toBeDefined();

    await expect(service.deactivate({ userId: 'user-2', reason: '' })).rejects.toMatchObject({
      code: 'REASON_REQUIRED',
    });
    const deactivated = await service.deactivate({ userId: 'user-2', reason: 'Temporary access hold' });
    expect(deactivated).toMatchObject({ id: 'user-2', is_active: false, role: target?.role, roles: target?.roles });
    expect(invalidateUser).toHaveBeenCalledWith('user-2', expect.any(String));

    await expect(service.reactivate({ userId: 'user-2', reason: '' })).rejects.toMatchObject({
      code: 'REASON_REQUIRED',
    });
    const reactivated = await service.reactivate({ userId: 'user-2', reason: 'Access restored' });
    expect(reactivated).toMatchObject({ id: 'user-2', is_active: true, role: target?.role, roles: target?.roles });
  });

  it('does not reactivate pending invitations before provider acceptance', async () => {
    const { service } = createService();
    const invited = await service.invite({
      username: 'P3DPendingInvite',
      email: 'p3d-pending@example.test',
      role: 'Viewer',
    });
    await expect(service.reactivate({ userId: invited.id, reason: 'Incorrectly requested' })).rejects.toMatchObject({
      code: 'INVITATION_PENDING',
    });
  });
});
