import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { appendSearch, routePaths, tripDetailPath, tripEditPath } from '../../routes';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Phase 1B static boundaries', () => {
  it('publishes only the approved operational route family and deterministic helpers', () => {
    expect(routePaths).toEqual({
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
    });
    expect(Object.values(routePaths).join(' ')).not.toMatch(/inventory|billing/);
    expect(tripDetailPath('trip / 1')).toBe('/trip-scheduling/trips/trip%20%2F%201');
    expect(tripEditPath(42)).toBe('/trip-scheduling/trips/42/edit');
    expect(appendSearch(routePaths.trips, 'search=T-CEB-001')).toBe('/trip-scheduling/trips?search=T-CEB-001');
  });

  it('removes browser AI provider code, dependencies, and secret injection', () => {
    const productionSources = [
      read('package.json'),
      read('vite.config.ts'),
      read('index.html'),
      read('App.tsx'),
      read('components/Hub.tsx'),
    ].join('\n');

    expect(productionSources).not.toContain('@google/genai');
    expect(productionSources).not.toContain('GEMINI_API_KEY');
    expect(productionSources).not.toContain('process.env.API_KEY');
    expect(productionSources).not.toContain('AI analysis');
  });

  it('keeps passwords out of the domain user model and settings surface', () => {
    expect(read('types.ts')).not.toMatch(/SystemUser[\s\S]*?password\??\s*:/);
    expect(read('components/UserManagement.tsx')).not.toMatch(/formData\.password|user\.password|type="password"/);
    expect(read('services/apiService.ts')).not.toMatch(/password\s*:/);
  });

  it('routes production components through the typed service boundary', () => {
    const componentSources = [
      'App.tsx',
      'components/Dashboard.tsx',
      'components/EmployeeList.tsx',
      'components/TripOperationsTable.tsx',
      'components/TripQuickDetailsPanel.tsx',
      'components/TripDetailsPage.tsx',
      'components/TripList.tsx',
      'components/TruckList.tsx',
      'components/UserManagement.tsx',
    ]
      .map(read)
      .join('\n');

    expect(componentSources).not.toContain('services/apiService');
    expect(componentSources).not.toMatch(/import\s+\{[^}]*MOCK_/);
    expect(componentSources).not.toContain('currentView');
  });

  it('keeps the Phase 2A Trip Operations surface read-only and behind the shared service and policy boundaries', () => {
    const tripOperationsSource = read('components/TripOperationsTable.tsx');

    expect(tripOperationsSource).toContain('services.trips');
    expect(tripOperationsSource).toContain('permissions.present');
    expect(tripOperationsSource).not.toContain('services/apiService');
    expect(tripOperationsSource).not.toMatch(/import\s+\{[^}]*MOCK_/);
    expect(tripOperationsSource).not.toMatch(/Cancel trip|Delete trip|Assign driver|Change status|Export CSV/i);
  });
});
