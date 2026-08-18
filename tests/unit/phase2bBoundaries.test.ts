import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Phase 2B static boundaries', () => {
  it('keeps Quick and Full Details behind typed service contracts without component-local joins', () => {
    const detailsComponents = [
      read('components/TripQuickDetailsPanel.tsx'),
      read('components/TripDetailsPage.tsx'),
    ].join('\n');

    expect(detailsComponents).toContain('services.tripDetails');
    expect(detailsComponents).not.toContain('services/apiService');
    expect(detailsComponents).not.toMatch(/import\s+\{[^}]*MOCK_/);
    expect(detailsComponents).not.toMatch(/getEmployees|getTrucks|getCustomers|getTripAssignments|getTripStops/);
  });

  it('exposes no later-phase mutations or fabricated Activity source', () => {
    const detailsComponents = [
      read('components/TripQuickDetailsPanel.tsx'),
      read('components/TripDetailsPage.tsx'),
    ].join('\n');
    const service = read('services/tripDetails.ts');

    expect(detailsComponents).not.toMatch(
      /Assign driver|Replace driver|Release driver|Cancel trip|Change status|Add event|Edit event|Delete event|Add fuel|Edit fuel|Delete fuel|Export CSV/i,
    );
    expect(service).toContain('supported: false');
    expect(service).toContain('no trip-specific audit source');
    expect(service).not.toMatch(/auditLogs|audit_entries|mockActivity/i);
  });

  it('keeps the URL as the selection source for Quick Details and Full Details sections', () => {
    const table = read('components/TripOperationsTable.tsx');
    const details = read('components/TripDetailsPage.tsx');

    expect(table).toContain("normalizedUrl.normalized.get('quick')");
    expect(details).toContain("searchParams.get('section')");
    expect(details).toContain("searchParams.get('tab')");
    expect(details).not.toMatch(/\[\s*selectedSection\s*,\s*setSelectedSection\s*\]\s*=\s*useState/);
  });
});
