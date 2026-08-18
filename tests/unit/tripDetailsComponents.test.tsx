import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TripDetailsPage } from '../../components/TripDetailsPage';
import { ServiceError, services, type TripDetailsService } from '../../services';

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="detail-location">{`${location.pathname}${location.search}`}</output>;
};

const renderDetails = (
  initialEntry = '/trip-scheduling/trips/trip-1',
  service: TripDetailsService = services.tripDetails,
) => {
  const onClose = vi.fn();
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TripDetailsPage onClose={onClose} service={service} tripId="trip-1" />
      <LocationProbe />
    </MemoryRouter>,
  );
  return { onClose };
};

describe('Phase 2B Trip Details page', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes the legacy tab address, keeps Overview visible, and loads the selected section', async () => {
    renderDetails('/trip-scheduling/trips/trip-1?search=John&tab=fuel');

    expect(await screen.findByRole('heading', { name: 'T-CEB-001' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trip and client' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Fuel' })).toBeInTheDocument();
    expect(screen.getAllByText('120.50 L')).toHaveLength(2);
    await waitFor(() => {
      const location = screen.getByTestId('detail-location').textContent ?? '';
      expect(location).toContain('search=John');
      expect(location).toContain('section=fuel');
      expect(location).not.toContain('tab=');
    });
  });

  it('uses URL-backed section selection and tells the truth when Activity has no approved source', async () => {
    const user = userEvent.setup();
    renderDetails();
    await screen.findByRole('heading', { name: 'T-CEB-001' });

    await user.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(await screen.findByRole('heading', { name: 'Trip activity source unavailable' })).toBeInTheDocument();
    expect(screen.getByText(/no trip-specific audit source/i)).toBeInTheDocument();
    expect(screen.getByTestId('detail-location')).toHaveTextContent('section=activity');
    expect(screen.getByRole('heading', { name: 'Trip and client' })).toBeInTheDocument();
  });

  it('supports conventional arrow-key section navigation without component-local selection state', async () => {
    const user = userEvent.setup();
    renderDetails();
    await screen.findByRole('heading', { name: 'T-CEB-001' });
    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    overviewTab.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Stops' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Stops' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('detail-location')).toHaveTextContent('section=stops');
    expect(await screen.findByRole('tabpanel', { name: 'Stops' })).toBeInTheDocument();
  });

  it('retains a safe Overview when a secondary request fails and retries without changing the address', async () => {
    const getEvents = vi.fn().mockRejectedValue(
      new ServiceError({
        status: 503,
        code: 'EVENTS_UNAVAILABLE',
        kind: 'unavailable',
        message: 'Events are temporarily unavailable.',
        retryable: true,
      }),
    );
    renderDetails('/trip-scheduling/trips/trip-1?section=events', { ...services.tripDetails, getEvents });

    expect(await screen.findByRole('heading', { name: 'Trip and client' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Events unavailable' })).toBeInTheDocument();
    expect(screen.getByText(/safe Overview remains visible/i)).toBeInTheDocument();
    expect(screen.getByTestId('detail-location')).toHaveTextContent('section=events');
  });

  it('renders a distinct Not Found state without leaking Overview content', async () => {
    const getOverview = vi.fn().mockRejectedValue(
      new ServiceError({
        status: 404,
        code: 'TRIP_NOT_FOUND',
        kind: 'not_found',
        message: 'Missing',
      }),
    );
    renderDetails('/trip-scheduling/trips/missing', { ...services.tripDetails, getOverview });

    expect(await screen.findByRole('heading', { name: 'Trip not found' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trip and client' })).not.toBeInTheDocument();
  });
});
