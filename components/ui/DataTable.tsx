import React from 'react';
import { LoadingState, NoResultsState, EmptyState, ErrorState } from './State';

export interface DataTableColumn<T> {
  align?: 'left' | 'center' | 'right';
  ariaSort?: React.AriaAttributes['aria-sort'];
  cell: (row: T) => React.ReactNode;
  className?: string;
  header: React.ReactNode;
  headerClassName?: string;
  key: string;
}

export interface DataTableProps<T> {
  caption: string;
  columns: DataTableColumn<T>[];
  data: T[];
  emptyDescription?: React.ReactNode;
  error?: string | null;
  getRowKey: (row: T) => React.Key;
  isFiltered?: boolean;
  isLoading?: boolean;
  noResultsDescription?: React.ReactNode;
  onResetFilters?: () => void;
  onRowClick?: (
    row: T,
    event: React.MouseEvent<HTMLTableRowElement> | React.KeyboardEvent<HTMLTableRowElement>,
  ) => void;
  isRowSelected?: (row: T) => boolean;
  rowAriaLabel?: (row: T) => string;
  tableClassName?: string;
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function DataTable<T>({
  caption,
  columns,
  data,
  emptyDescription,
  error,
  getRowKey,
  isFiltered = false,
  isLoading = false,
  noResultsDescription,
  onResetFilters,
  onRowClick,
  isRowSelected,
  rowAriaLabel,
  tableClassName = '',
}: DataTableProps<T>) {
  const selectedRowClass = 'bg-navy-100 dark:bg-carbon-800/60';
  const colSpan = columns.length;

  return (
    <table className={['w-full border-collapse text-left', tableClassName].filter(Boolean).join(' ')}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-navy-200 bg-navy-50/70 text-xs font-semibold text-navy-600 dark:border-carbon-800 dark:bg-carbon-900/70 dark:text-carbon-300">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              aria-sort={column.ariaSort}
              className={['px-4 py-3', alignClasses[column.align ?? 'left'], column.headerClassName]
                .filter(Boolean)
                .join(' ')}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-navy-100 text-xs dark:divide-carbon-800/70">
        {isLoading && (
          <tr>
            <td colSpan={colSpan} className="p-4">
              <LoadingState className="min-h-44 border-0 shadow-none" label="Loading table records..." />
            </td>
          </tr>
        )}
        {!isLoading && error && (
          <tr>
            <td colSpan={colSpan} className="p-4">
              <ErrorState
                className="min-h-44 border-0 shadow-none"
                description={error}
                title="Table data unavailable"
              />
            </td>
          </tr>
        )}
        {!isLoading && !error && data.length === 0 && (
          <tr>
            <td colSpan={colSpan} className="p-4">
              {isFiltered ? (
                <NoResultsState
                  className="min-h-44 border-0 shadow-none"
                  description={noResultsDescription}
                  onReset={onResetFilters}
                />
              ) : (
                <EmptyState className="min-h-44 border-0 shadow-none" description={emptyDescription} />
              )}
            </td>
          </tr>
        )}
        {!isLoading &&
          !error &&
          data.map((row) => {
            const clickable = Boolean(onRowClick);
            const selected = isRowSelected?.(row) ?? false;
            return (
              <tr
                key={getRowKey(row)}
                aria-label={rowAriaLabel?.(row)}
                aria-selected={selected || undefined}
                className={[
                  'transition-colors motion-reduce:transition-none',
                  clickable
                    ? 'cursor-pointer hover:bg-navy-50 focus-visible:bg-navy-50 dark:hover:bg-carbon-800/40 dark:focus-visible:bg-carbon-800/40'
                    : '',
                  selected ? selectedRowClass : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={clickable ? (event) => onRowClick?.(row, event) : undefined}
                onKeyDown={
                  clickable
                    ? (event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick?.(row, event);
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      'px-4 py-3',
                      alignClasses[column.align ?? 'left'],
                      column.className,
                      selected ? selectedRowClass : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
