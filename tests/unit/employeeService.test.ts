import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentEmployeeService } from '../../services/employees';

describe('Phase 3B employee service', () => {
  it('maps employee records to canonical roles and requires driver credentials', async () => {
    const service = createDevelopmentEmployeeService(developmentDataAdapter);
    const employees = await service.list();
    expect(employees).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'emp-1', role: 'DRIVER' })]));
    await expect(
      service.create({
        firstName: 'New',
        lastName: 'Driver',
        role: 'DRIVER',
        employmentState: 'ACTIVE',
      }),
    ).rejects.toMatchObject({ code: 'DRIVER_LICENSE_REQUIRED' });
  });

  it('requires a lifecycle reason and blocks deactivation with an active assignment', async () => {
    const service = createDevelopmentEmployeeService(developmentDataAdapter);
    await expect(service.deactivate({ employeeId: 'emp-1', reason: '' })).rejects.toMatchObject({
      code: 'REASON_REQUIRED',
    });
    await expect(service.deactivate({ employeeId: 'emp-1', reason: 'No longer rostered' })).rejects.toMatchObject({
      code: 'ACTIVE_ASSIGNMENT_BLOCKS_DEACTIVATION',
    });
  });

  it('keeps lifecycle non-destructive and supports reactivation', async () => {
    const service = createDevelopmentEmployeeService(developmentDataAdapter);
    const inactive = await service.deactivate({ employeeId: 'emp-2', reason: 'Temporary leave' });
    expect(inactive).toMatchObject({ id: 'emp-2', active: false, employmentState: 'INACTIVE' });
    const active = await service.reactivate({ employeeId: 'emp-2', reason: 'Returned to work' });
    expect(active).toMatchObject({ id: 'emp-2', active: true, employmentState: 'ACTIVE' });
  });
});
