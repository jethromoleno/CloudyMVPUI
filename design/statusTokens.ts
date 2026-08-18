export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'permission';

export interface StatusToken {
  code: string;
  label: string;
  tone: StatusTone;
  cue: string;
  description: string;
}

export const canonicalStatusTokens = {
  DRAFT: {
    code: 'DRAFT',
    label: 'Draft',
    tone: 'neutral',
    cue: 'Draft',
    description: 'Trip is still being authored and may omit assignments.',
  },
  SCHEDULED: {
    code: 'SCHEDULED',
    label: 'Scheduled',
    tone: 'info',
    cue: 'Planned',
    description: 'Trip is scheduled and waiting for dispatch progress.',
  },
  IN_PROGRESS: {
    code: 'IN_PROGRESS',
    label: 'In Progress',
    tone: 'warning',
    cue: 'Active',
    description: 'Trip is currently active.',
  },
  RESCUE: {
    code: 'RESCUE',
    label: 'Rescue',
    tone: 'error',
    cue: 'Exception',
    description: 'Trip needs rescue handling.',
  },
  BACKLOAD: {
    code: 'BACKLOAD',
    label: 'Backload',
    tone: 'warning',
    cue: 'Return',
    description: 'Trip is active as a backload return.',
  },
  COMPLETED: {
    code: 'COMPLETED',
    label: 'Completed',
    tone: 'success',
    cue: 'Done',
    description: 'Trip or task is completed.',
  },
  CANCELLED: {
    code: 'CANCELLED',
    label: 'Cancelled',
    tone: 'error',
    cue: 'Stopped',
    description: 'Trip has been cancelled.',
  },
  TRANSFERRED: {
    code: 'TRANSFERRED',
    label: 'Transferred',
    tone: 'neutral',
    cue: 'Moved',
    description: 'Trip has been transferred to a successor trip.',
  },
  AVAILABLE: {
    code: 'AVAILABLE',
    label: 'Available',
    tone: 'success',
    cue: 'Ready',
    description: 'Resource is available for new assignment.',
  },
  IN_USE: {
    code: 'IN_USE',
    label: 'In Use',
    tone: 'info',
    cue: 'Used',
    description: 'Resource is assigned or in use.',
  },
  MAINTENANCE: {
    code: 'MAINTENANCE',
    label: 'Maintenance',
    tone: 'warning',
    cue: 'Service',
    description: 'Resource is in maintenance.',
  },
  INACTIVE: {
    code: 'INACTIVE',
    label: 'Inactive',
    tone: 'neutral',
    cue: 'Inactive',
    description: 'Resource is inactive and withheld from new selection.',
  },
  ACTIVE: {
    code: 'ACTIVE',
    label: 'Active',
    tone: 'success',
    cue: 'Active',
    description: 'Record is active.',
  },
  ERROR: {
    code: 'ERROR',
    label: 'Error',
    tone: 'error',
    cue: 'Error',
    description: 'An error needs attention.',
  },
  SUCCESS: {
    code: 'SUCCESS',
    label: 'Success',
    tone: 'success',
    cue: 'OK',
    description: 'Action completed successfully.',
  },
  WARNING: {
    code: 'WARNING',
    label: 'Warning',
    tone: 'warning',
    cue: 'Warn',
    description: 'A non-blocking warning is present.',
  },
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    label: 'Permission denied',
    tone: 'permission',
    cue: 'Denied',
    description: 'User does not have permission for this surface or action.',
  },
  COMING_SOON: {
    code: 'COMING_SOON',
    label: 'Coming Soon',
    tone: 'warning',
    cue: 'Soon',
    description: 'Module is visible but not launchable in the MVP.',
  },
  UNASSIGNED: {
    code: 'UNASSIGNED',
    label: 'Unassigned',
    tone: 'neutral',
    cue: 'None',
    description: 'No resource is assigned.',
  },
} as const satisfies Record<string, StatusToken>;

const aliases: Record<string, keyof typeof canonicalStatusTokens> = {
  '': 'UNASSIGNED',
  STATUS_SCHED: 'SCHEDULED',
  STATUS_INPROGRESS: 'IN_PROGRESS',
  STATUS_COMPLETED: 'COMPLETED',
  STATUS_CANCELLED: 'CANCELLED',
  STATUS_RESCUE: 'RESCUE',
  STATUS_BACKLOAD: 'BACKLOAD',
  TS_AVAIL: 'AVAILABLE',
  TS_USE: 'IN_USE',
  TS_MAINT: 'MAINTENANCE',
  TS_INACTIVE: 'INACTIVE',
  IN_TRANSIT: 'IN_PROGRESS',
  ON_TRIP: 'IN_USE',
  ASSIGNED: 'IN_USE',
  SUSPENDED: 'INACTIVE',
  TERMINATED: 'INACTIVE',
  LEAVE: 'WARNING',
  ON_LEAVE: 'WARNING',
  PLACEHOLDER: 'COMING_SOON',
};

export const statusToneClasses: Record<StatusTone, string> = {
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  warning:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  neutral: 'bg-navy-50 text-navy-700 border-navy-200 dark:bg-carbon-800 dark:text-carbon-200 dark:border-carbon-700',
  permission:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
};

export const normalizeStatusCode = (value?: string | null): keyof typeof canonicalStatusTokens => {
  const normalized = String(value ?? '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s/-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();

  if (normalized in canonicalStatusTokens) {
    return normalized as keyof typeof canonicalStatusTokens;
  }

  return aliases[normalized] ?? 'UNASSIGNED';
};

export const getStatusToken = (value?: string | null): StatusToken => {
  return canonicalStatusTokens[normalizeStatusCode(value)];
};
