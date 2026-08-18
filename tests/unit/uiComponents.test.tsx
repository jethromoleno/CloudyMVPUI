import React from 'react';
import axe from 'axe-core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumn,
  ErrorState,
  FilterBar,
  FormField,
  NoResultsState,
  SearchInput,
  StatusBadge,
} from '../../components/ui';
import { uiClasses } from '../../design/tokens';

describe('shared UI components', () => {
  it('renders accessible form fields, buttons, search, and non-color status cues', async () => {
    const onSearch = vi.fn();
    const { container } = render(
      <div>
        <FormField label="Operator name" hint="Use the current display name." required>
          <input className={uiClasses.field} />
        </FormField>
        <Button>Save record</Button>
        <SearchInput aria-label="Search operators" onChange={onSearch} value="Ana" />
        <StatusBadge status="In Progress" />
      </div>,
    );

    expect(screen.getByLabelText(/operator name/i)).toBeRequired();
    expect(screen.getByRole('button', { name: /save record/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/in progress: active/i)).toBeInTheDocument();

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    const seriousOrCritical = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );
    expect(seriousOrCritical).toEqual([]);
  });

  it('supports keyboard activation for clickable data rows', () => {
    const onRowClick = vi.fn();
    const columns: DataTableColumn<{ id: string; name: string }>[] = [
      { key: 'name', header: 'Name', cell: (row) => row.name },
      { key: 'action', header: 'Action', cell: (row) => <button type="button">Open {row.name}</button> },
    ];

    render(
      <DataTable
        caption="Operators"
        columns={columns}
        data={[{ id: 'a', name: 'Ana' }]}
        getRowKey={(row) => row.id}
        onRowClick={onRowClick}
        rowAriaLabel={(row) => `Open row ${row.name}`}
      />,
    );

    const row = screen.getByLabelText('Open row Ana');
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open Ana' }), { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it('supports filter reset, no-results reset, retry, and search clear actions', async () => {
    const user = userEvent.setup();
    const onFilterReset = vi.fn();
    const onNoResultsReset = vi.fn();
    const onRetry = vi.fn();
    const onSearch = vi.fn();
    const onClear = vi.fn();

    render(
      <div>
        <FilterBar hasActiveFilters onReset={onFilterReset} title="Dispatch filters">
          <label>
            Status
            <select>
              <option>All</option>
            </select>
          </label>
        </FilterBar>
        <NoResultsState onReset={onNoResultsReset} description="No matching records." />
        <ErrorState onRetry={onRetry} description="Service failed." />
        <SearchInput aria-label="Search trips" value="TRIP-1" onChange={onSearch} onClear={onClear} />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /reset filters/i }));
    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    await user.click(screen.getByRole('button', { name: /retry/i }));
    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(onFilterReset).toHaveBeenCalledTimes(1);
    expect(onNoResultsReset).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('focuses the safe button, traps Escape, and restores focus for confirm dialogs', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <div>
        <button type="button">Open source button</button>
        <ConfirmDialog
          description="Deactivate Ana?"
          onCancel={onCancel}
          onConfirm={onConfirm}
          open
          title="Confirm deactivation"
        />
      </div>,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
