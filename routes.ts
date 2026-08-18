export const routePaths = {
  root: '/',
  login: '/login',
  hub: '/hub',
  workspace: '/trip-scheduling',
  dashboard: '/trip-scheduling/dashboard',
  trips: '/trip-scheduling/trips',
  tripCreate: '/trip-scheduling/trips/new',
  trucks: '/trip-scheduling/trucks',
  employees: '/trip-scheduling/employees',
  referenceData: '/trip-scheduling/reference-data',
  settings: '/trip-scheduling/settings',
} as const;

export const tripDetailPath = (tripId: string | number) => `${routePaths.trips}/${encodeURIComponent(String(tripId))}`;
export const tripEditPath = (tripId: string | number) => `${tripDetailPath(tripId)}/edit`;

export const appendSearch = (path: string, search: string) => {
  const normalized = search.startsWith('?') ? search : search ? `?${search}` : '';
  return `${path}${normalized}`;
};
