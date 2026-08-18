import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentOperationalAttentionService } from '../../services/operationalAttention';

describe('development operational attention service', () => {
  it('returns only factual exception-status or planned-start-passed scheduled items', async () => {
    const snapshot = await createDevelopmentOperationalAttentionService(developmentDataAdapter).getSnapshot();
    expect(snapshot.source).toBe('development-mock');
    expect(snapshot.items.length).toBeGreaterThan(0);
    expect(
      snapshot.items.every((item) => ['ACTIVE_EXCEPTION_STATUS', 'PLANNED_START_PASSED'].includes(item.kind)),
    ).toBe(true);
  });

  it('does not include terminal trips or assign a risk score', async () => {
    const snapshot = await createDevelopmentOperationalAttentionService(developmentDataAdapter).getSnapshot();
    expect(snapshot.items.every((item) => !/completed|cancelled|transferred/i.test(item.statusLabel))).toBe(true);
    expect(snapshot.items.every((item) => !('risk' in item))).toBe(true);
  });
});
