import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cloudyTokens } from '../../design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 dark:bg-white dark:text-carbon-950 dark:hover:bg-carbon-100',
  secondary:
    'border border-navy-200 bg-white text-navy-800 hover:bg-navy-50 dark:border-carbon-700 dark:bg-carbon-900 dark:text-white dark:hover:bg-carbon-800',
  ghost:
    'text-navy-600 hover:bg-navy-100 hover:text-navy-900 dark:text-carbon-300 dark:hover:bg-carbon-800 dark:hover:text-white',
  // Filled tones keep a 4.5:1 ratio against white label text in both themes.
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700',
  warning: 'bg-amber-700 text-white hover:bg-amber-800 active:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800',
  success:
    'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-12 px-5 py-2.5 text-base',
  icon: 'h-10 w-10 p-0 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      disabled = false,
      icon,
      isLoading = false,
      size = 'md',
      trailingIcon,
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={[
          'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors motion-reduce:transition-none',
          cloudyTokens.focus.ring,
          variantClasses[variant],
          sizeClasses[size],
          isDisabled ? 'opacity-55 shadow-none' : 'cursor-pointer shadow-sm',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {isLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : icon}
        {children}
        {trailingIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
