import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Moon, Search, Sun } from 'lucide-react';
import '../../index.css';
import {
  BlockedState,
  Button,
  ComingSoonState,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  LoadingState,
  NoResultsState,
  PermissionDeniedState,
  SearchInput,
  StatusBadge,
} from '../../components/ui';
import { uiClasses } from '../../design/tokens';

type ReviewTheme = 'light' | 'dark';

const stateItems = [
  <LoadingState key="loading" label="Loading dispatch records..." />,
  <EmptyState key="empty" description="Create the first record when the workflow is available." />,
  <NoResultsState
    key="results"
    description="No records match the active search and filters."
    onReset={() => undefined}
  />,
  <ErrorState key="error" description="The service could not load this view." onRetry={() => undefined} />,
  <PermissionDeniedState key="permission" description="Your current role cannot access this workspace." />,
  <ComingSoonState key="coming-soon" description="This module is visible but disabled for the MVP." />,
  <BlockedState key="blocked" description="Resolve the dependent record before continuing." />,
];

export const VisualReviewHarness: React.FC = () => {
  const initialTheme = new URLSearchParams(window.location.search).get('theme') === 'light' ? 'light' : 'dark';
  const [theme, setTheme] = useState<ReviewTheme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <main className="min-h-screen bg-navy-50 px-4 py-5 transition-colors dark:bg-carbon-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-200 pb-5 dark:border-carbon-800">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Phase 1A Visual Review</h1>
            <p className="mt-1 text-sm text-navy-500 dark:text-carbon-300">
              Shared component and state evidence surface
            </p>
          </div>
          <Button
            aria-label={theme === 'dark' ? 'Switch review to light theme' : 'Switch review to dark theme'}
            icon={
              theme === 'dark' ? (
                <Sun aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Moon aria-hidden="true" className="h-4 w-4" />
              )
            }
            onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            variant="secondary"
          >
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </Button>
        </header>

        <section aria-labelledby="state-heading">
          <h2 id="state-heading" className="mb-4 text-lg font-bold text-navy-900 dark:text-white">
            Shared States
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{stateItems}</div>
        </section>

        <section aria-labelledby="controls-heading" className="border-t border-navy-200 pt-8 dark:border-carbon-800">
          <h2 id="controls-heading" className="mb-4 text-lg font-bold text-navy-900 dark:text-white">
            Controls and Status
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
            <div className="space-y-5">
              <FilterBar>
                <SearchInput
                  aria-label="Search review records"
                  className="min-w-0 flex-1"
                  placeholder="Search records"
                />
                <Button icon={<Search aria-hidden="true" className="h-4 w-4" />} variant="secondary">
                  Apply
                </Button>
              </FilterBar>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Dispatch reference" hint="Required for scheduled trips." required>
                  <input className={uiClasses.field} placeholder="TRIP-2026-001" />
                </FormField>
                <FormField label="Vehicle" error="Select an available vehicle.">
                  <input aria-invalid="true" className={uiClasses.field} placeholder="Choose vehicle" />
                </FormField>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="danger">Danger</Button>
                <Button disabled>Disabled</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'DRAFT',
                  'SCHEDULED',
                  'IN_PROGRESS',
                  'COMPLETED',
                  'CANCELLED',
                  'PERMISSION_DENIED',
                  'COMING_SOON',
                ].map((status) => (
                  <StatusBadge key={status} status={status} />
                ))}
              </div>
            </div>

            <DataTable
              caption="Visual review records"
              columns={[
                { key: 'reference', header: 'Reference', cell: (row) => row.reference },
                { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
              ]}
              data={[
                { reference: 'TRIP-2026-001', status: 'SCHEDULED' },
                { reference: 'TRIP-2026-002', status: 'IN_PROGRESS' },
                { reference: 'TRIP-2026-003', status: 'COMPLETED' },
              ]}
              getRowKey={(row) => row.reference}
            />
          </div>
        </section>
      </div>
    </main>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <VisualReviewHarness />
  </React.StrictMode>,
);
