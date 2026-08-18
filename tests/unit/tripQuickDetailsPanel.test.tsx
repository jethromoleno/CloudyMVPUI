import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripQuickDetailsPanel } from '../../components/TripQuickDetailsPanel';
import { PermissionProvider, createEffectivePermissions } from '../../permissions';
import type { SystemUser, UserRoleType } from '../../types';
import type { TripDetailsService, TripQuickDetails } from '../../services';

const details: TripQuickDetails = {
  id: 'trip-1',
  tripAdviceCode: 'T-CEB-001',
  status: { code: 'IN_PROGRESS', label: 'In Progress' },
  client: { id: 'client-1', label: 'Global Logistics Inc.', active: true },
  consignee: { id: 'cons-2', label: 'Mandaue Retail Center', active: true },
  route: {
    origin: { id: 'loc-1', label: 'Manila Port', active: true },
    destination: { id: 'loc-2', label: 'Cebu Distribution Center', active: true },
  },
  pickupDate: '2026-06-15',
  pickupWindow: '08:00 AM - 12:00 PM',
  assignments: {
    state: 'assigned',
    driver: { id: 'driver-1', label: 'John Doe', active: true },
    truck: { id: 'truck-1', label: 'ABC-1234', active: true },
    helpers: [],
  },
  updatedAt: '2026-07-22T08:00:00Z',
  freshness: { fetchedAt: '2026-07-22T08:00:00Z', recordUpdatedAt: '2026-07-22T08:00:00Z', source: 'development-mock' },
};

const identity = (role: UserRoleType): SystemUser => ({
  id: `${role}-user`,
  username: role,
  role,
  roles: [role],
  permissions: ['trip_scheduling'],
  is_active: true,
});

const renderSheet = (onClose = vi.fn(), onOpenFullDetails = vi.fn()) => {
  const service = {
    getQuickDetails: vi.fn().mockResolvedValue(details),
  } as unknown as TripDetailsService;
  const permissions = createEffectivePermissions({
    adapterKind: 'development',
    authStatus: 'authenticated',
    user: identity('Viewer'),
  });
  render(
    <PermissionProvider value={permissions}>
      <TripQuickDetailsPanel
        onClose={onClose}
        onOpenFullDetails={onOpenFullDetails}
        service={service}
        tripId="trip-1"
        variant="sheet"
      />
    </PermissionProvider>,
  );
  return { onClose, onOpenFullDetails };
};

describe('Trip Quick Details sheet', () => {
  afterEach(() => {
    document.getElementById('root')?.remove();
  });

  it('traps keyboard focus, dismisses from the backdrop, and restores body scroll', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    const { onClose } = renderSheet();
    const user = userEvent.setup();

    const close = await screen.findByRole('button', { name: 'Close Quick Details' });
    const openFull = await screen.findByRole('button', { name: 'Open Full Details' });
    await waitFor(() => expect(openFull).toBeEnabled());
    await waitFor(() => expect(close).toHaveFocus());
    expect(document.getElementById('root')?.hasAttribute('inert')).toBe(true);

    await user.tab({ shift: true });
    expect(openFull).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.click(document.querySelector('[aria-hidden="true"]') as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });
});
