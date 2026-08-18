import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentSettingsAuditService } from '../../services/settingsAudit';

describe('Phase 3E settings and audit service', () => {
  it('returns settings and audit history through the typed development boundary', async () => {
    const snapshot = await createDevelopmentSettingsAuditService(developmentDataAdapter).getSnapshot();
    expect(snapshot.source).toBe('development-mock');
    expect(snapshot.settings).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'setting-1' })]));
  });

  it('validates supported setting values and records a structured update event', async () => {
    const service = createDevelopmentSettingsAuditService(developmentDataAdapter);
    await expect(
      service.updateSetting({ settingId: 'setting-2', value: 'America/New_York', actorUserId: 'user-1' }),
    ).rejects.toMatchObject({ code: 'TIMEZONE_UNSUPPORTED' });
    await expect(
      service.updateSetting({ settingId: 'setting-4', value: '0', actorUserId: 'user-1' }),
    ).rejects.toMatchObject({ code: 'SETTING_VALUE_INVALID' });

    const updated = await service.updateSetting({
      settingId: 'setting-1',
      value: 'Cloudy Transport Services QA',
      actorUserId: 'user-1',
    });
    expect(updated).toMatchObject({
      id: 'setting-1',
      setting_value: 'Cloudy Transport Services QA',
      updated_by_user_id: 'user-1',
    });
    const audit = (await service.getSnapshot()).auditLogs.at(-1);
    expect(audit).toMatchObject({
      action: 'UPDATE',
      table_name: 'app_settings',
      record_id: 'setting-1',
      user_id: 'user-1',
      old_values: expect.objectContaining({ setting_key: 'company_name' }),
      new_values: expect.objectContaining({ setting_value: 'Cloudy Transport Services QA' }),
    });
  });

  it('validates the complete settings submission before changing any setting', async () => {
    const service = createDevelopmentSettingsAuditService(developmentDataAdapter);
    const before = await service.getSnapshot();
    const companyName = before.settings.find((setting) => setting.id === 'setting-1');

    await expect(
      service.updateSettings([
        { settingId: 'setting-1', value: 'Should not persist', actorUserId: 'user-1' },
        { settingId: 'setting-4', value: '0', actorUserId: 'user-1' },
      ]),
    ).rejects.toMatchObject({ code: 'SETTING_VALUE_INVALID' });

    const after = await service.getSnapshot();
    expect(after.settings.find((setting) => setting.id === 'setting-1')?.setting_value).toBe(
      companyName?.setting_value,
    );
  });
});
