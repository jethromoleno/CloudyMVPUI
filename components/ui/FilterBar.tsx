import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';

export interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  hasActiveFilters?: boolean;
  headerClassName?: string;
  onReset?: () => void;
  title?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  className = '',
  contentClassName,
  hasActiveFilters = false,
  headerClassName = '',
  onReset,
  title = 'Filters',
}) => (
  <section
    aria-label={title}
    className={[
      'rounded-xl border border-navy-200 bg-white p-4 shadow-sm dark:border-carbon-800 dark:bg-carbon-900',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <div
      className={[
        'mb-3 flex items-center justify-between gap-3 border-b border-navy-100 pb-2 dark:border-carbon-800',
        headerClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-navy-900 dark:text-white">
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-blue-500" />
        {title}
      </h2>
      {hasActiveFilters && onReset && (
        <Button size="sm" variant="ghost" onClick={onReset}>
          Reset filters
        </Button>
      )}
    </div>
    <div
      className={
        contentClassName ?? 'grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
      }
    >
      {children}
    </div>
  </section>
);
