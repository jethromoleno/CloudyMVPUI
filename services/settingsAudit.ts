import type { AppSetting } from '../types';
import type { DataService } from './apiService';
import type { SettingUpdateCommand, SettingsAuditService } from './contracts';
import { ServiceError } from './contracts';

const fail = (code: string, message: string) => {
  throw new ServiceError({ status: 400, code, message, kind: 'validation' });
};

const validate = (setting: AppSetting, value: string) => {
  const trimmed = value.trim();
  if (!trimmed) fail('SETTING_VALUE_REQUIRED', `${setting.setting_key.replaceAll('_', ' ')} is required.`);
  if (setting.setting_key === 'app_timezone' && trimmed !== 'Asia/Manila')
    fail('TIMEZONE_UNSUPPORTED', 'Only Asia/Manila is supported in this MVP.');
  if (setting.setting_key === 'default_branch_id' && !/^branch-\d+$/.test(trimmed))
    fail('DEFAULT_BRANCH_INVALID', 'Choose a configured development branch identifier.');
  if (
    ['session_timeout_minutes', 'pending_trip_alert_hours', 'license_expiry_warning_days'].includes(setting.setting_key)
  ) {
    const numeric = Number(trimmed);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 525_600)
      fail('SETTING_VALUE_INVALID', 'Enter a whole number between 1 and 525600.');
  }
  return trimmed;
};

export const createDevelopmentSettingsAuditService = (data: DataService): SettingsAuditService => ({
  getSnapshot: async () => {
    const [settings, auditLogs] = await Promise.all([data.getAppSettings(), data.getAuditLogs()]);
    return { settings, auditLogs, source: 'development-mock' };
  },
  updateSettings: async (commands: SettingUpdateCommand[]) => {
    const settings = await data.getAppSettings();
    const prepared = commands.map(({ settingId, value, actorUserId }) => {
      const setting = settings.find((candidate) => candidate.id === settingId);
      if (!setting)
        throw new ServiceError({
          status: 404,
          code: 'SETTING_NOT_FOUND',
          message: 'Setting not found.',
          kind: 'not_found',
        });
      return { setting, nextValue: validate(setting, value), actorUserId };
    });

    return Promise.all(
      prepared.map(({ setting, nextValue, actorUserId }) =>
        setting.setting_value === nextValue ? setting : data.updateAppSetting(setting.id, nextValue, actorUserId),
      ),
    );
  },
  updateSetting: async (command) => (await createDevelopmentSettingsAuditService(data).updateSettings([command]))[0],
});
