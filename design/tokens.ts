export const cloudyTokens = {
  color: {
    background: 'var(--cloudy-bg)',
    surface: 'var(--cloudy-surface)',
    surfaceMuted: 'var(--cloudy-surface-muted)',
    border: 'var(--cloudy-border)',
    text: 'var(--cloudy-text)',
    textMuted: 'var(--cloudy-text-muted)',
    focus: 'var(--cloudy-focus)',
    interactive: 'var(--cloudy-interactive)',
    interactiveHover: 'var(--cloudy-interactive-hover)',
    disabledBackground: 'var(--cloudy-disabled-bg)',
    disabledText: 'var(--cloudy-disabled-text)',
  },
  typography: {
    family: 'var(--cloudy-font-family)',
    size: {
      xs: 'var(--cloudy-text-xs)',
      sm: 'var(--cloudy-text-sm)',
      base: 'var(--cloudy-text-base)',
      lg: 'var(--cloudy-text-lg)',
      xl: 'var(--cloudy-text-xl)',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    1: 'var(--cloudy-space-1)',
    2: 'var(--cloudy-space-2)',
    3: 'var(--cloudy-space-3)',
    4: 'var(--cloudy-space-4)',
    6: 'var(--cloudy-space-6)',
  },
  sizing: {
    controlSm: 'var(--cloudy-control-height-sm)',
    controlMd: 'var(--cloudy-control-height-md)',
    controlLg: 'var(--cloudy-control-height-lg)',
  },
  border: {
    width: 'var(--cloudy-border-width)',
    color: 'var(--cloudy-border)',
  },
  radius: {
    sm: 'var(--cloudy-radius-sm)',
    md: 'var(--cloudy-radius-md)',
    lg: 'var(--cloudy-radius-lg)',
  },
  shadow: {
    sm: 'var(--cloudy-shadow-sm)',
    md: 'var(--cloudy-shadow-md)',
    lg: 'var(--cloudy-shadow-lg)',
  },
  focus: {
    ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-carbon-950',
  },
} as const;

export const uiClasses = {
  surface: 'bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 shadow-sm',
  mutedSurface: 'bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800',
  text: 'text-navy-900 dark:text-white',
  mutedText: 'text-navy-500 dark:text-carbon-400',
  field:
    'w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-400 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:bg-navy-100 disabled:text-navy-400 disabled:cursor-not-allowed dark:border-carbon-800 dark:bg-carbon-950 dark:text-white dark:placeholder-carbon-500 dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-carbon-950 dark:disabled:bg-carbon-800 dark:disabled:text-carbon-500',
} as const;

export type CloudyTokenName = keyof typeof cloudyTokens;
