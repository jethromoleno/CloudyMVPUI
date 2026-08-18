import React from 'react';
import { AlertTriangle, Ban, Inbox, Loader2, Lock, PackageOpen, SearchX, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export interface SurfaceStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  role?: React.AriaRole;
}

export const SurfaceState: React.FC<SurfaceStateProps> = ({
  action,
  className = '',
  description,
  icon,
  role = 'status',
  title,
}) => (
  <div
    className={[
      'flex flex-col items-center justify-center rounded-xl border border-navy-200 bg-white p-8 text-center shadow-sm dark:border-carbon-800 dark:bg-carbon-900',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    role={role}
  >
    {icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-600 dark:border-carbon-700 dark:bg-carbon-800 dark:text-carbon-200">
        {icon}
      </div>
    )}
    <h2 className="text-base font-bold text-navy-900 dark:text-white">{title}</h2>
    {description && (
      <div className="mt-2 max-w-md text-sm leading-6 text-navy-500 dark:text-carbon-400">{description}</div>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const LoadingState: React.FC<{ label?: string; className?: string }> = ({
  className = '',
  label = 'Loading records...',
}) => (
  <SurfaceState
    className={className}
    icon={<Loader2 aria-hidden="true" className="h-6 w-6 animate-spin motion-reduce:animate-none" />}
    title={label}
  />
);

export const EmptyState: React.FC<Omit<SurfaceStateProps, 'icon' | 'title'> & { title?: string }> = ({
  title = 'No records yet',
  ...props
}) => <SurfaceState icon={<Inbox aria-hidden="true" className="h-6 w-6" />} title={title} {...props} />;

export const NoResultsState: React.FC<
  Omit<SurfaceStateProps, 'action' | 'icon' | 'title'> & { onReset?: () => void; title?: string }
> = ({ onReset, title = 'No results found', ...props }) => (
  <SurfaceState
    action={
      onReset ? (
        <Button variant="secondary" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      ) : undefined
    }
    icon={<SearchX aria-hidden="true" className="h-6 w-6" />}
    title={title}
    {...props}
  />
);

export const ErrorState: React.FC<
  Omit<SurfaceStateProps, 'action' | 'icon' | 'role' | 'title'> & { onRetry?: () => void; title?: string }
> = ({ onRetry, title = 'Something went wrong', ...props }) => (
  <SurfaceState
    action={
      onRetry ? (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : undefined
    }
    icon={<AlertTriangle aria-hidden="true" className="h-6 w-6 text-red-500" />}
    role="alert"
    title={title}
    {...props}
  />
);

export const PermissionDeniedState: React.FC<
  Omit<SurfaceStateProps, 'icon' | 'role' | 'title'> & { title?: string }
> = ({ title = 'Access restricted', ...props }) => (
  <SurfaceState
    icon={<ShieldAlert aria-hidden="true" className="h-6 w-6 text-orange-500" />}
    role="alert"
    title={title}
    {...props}
  />
);

export const ComingSoonState: React.FC<Omit<SurfaceStateProps, 'icon' | 'title'> & { title?: string }> = ({
  title = 'Coming Soon',
  ...props
}) => <SurfaceState icon={<PackageOpen aria-hidden="true" className="h-6 w-6" />} title={title} {...props} />;

export const DisabledActionHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500 dark:text-carbon-400">
    <Lock aria-hidden="true" className="h-3.5 w-3.5" />
    {children}
  </span>
);

export const BlockedState: React.FC<Omit<SurfaceStateProps, 'icon' | 'role' | 'title'> & { title?: string }> = ({
  title = 'Blocked',
  ...props
}) => <SurfaceState icon={<Ban aria-hidden="true" className="h-6 w-6" />} role="alert" title={title} {...props} />;
