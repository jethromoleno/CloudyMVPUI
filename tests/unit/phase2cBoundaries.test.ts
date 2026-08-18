import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (filePath: string) => readFileSync(resolve(process.cwd(), filePath), 'utf8');

describe('Phase 2C implementation boundaries', () => {
  it('keeps the new form on the typed service boundary', () => {
    const source = read('components/TripFormPage.tsx');
    expect(source).toContain('services.tripEditor');
    expect(source).not.toMatch(/services\/apiService|MOCK_/);
  });

  it('does not submit assignment mutation fields from the editor service', () => {
    const source = read('services/tripEditor.ts');
    expect(source).not.toMatch(/truck_id:\s*request|driver_id:\s*request|helper1_employee_id|helper2_employee_id/);
  });

  it('does not introduce transition or cancellation controls in the form', () => {
    const source = read('components/TripFormPage.tsx');
    expect(source).not.toMatch(/cancelTrip|STATUS_CHANGE|IN_PROGRESS|CANCELLED/);
  });

  it('labels stale-write handling as a development-only conflict simulation with accessible recovery', () => {
    const form = read('components/TripFormPage.tsx');
    const editor = read('services/tripEditor.ts');
    expect(editor).toContain("code: 'STALE_VERSION'");
    expect(editor).toContain("kind: 'conflict'");
    expect(form).toContain('Refresh version and retry');
    expect(form).toMatch(/does not merge\s+changes/i);
    expect(form).toMatch(/production concurrency guarantees/i);
  });
});
