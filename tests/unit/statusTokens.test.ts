import { describe, expect, it } from 'vitest';
import { canonicalStatusTokens, getStatusToken, normalizeStatusCode } from '../../design/statusTokens';

describe('status token catalog', () => {
  it('includes approved canonical Phase 1A codes and the Phase 0 DRAFT amendment', () => {
    expect(canonicalStatusTokens.DRAFT).toMatchObject({ label: 'Draft', cue: 'Draft' });
    expect(canonicalStatusTokens.SCHEDULED.code).toBe('SCHEDULED');
    expect(canonicalStatusTokens.IN_PROGRESS.code).toBe('IN_PROGRESS');
    expect(canonicalStatusTokens.COMING_SOON.code).toBe('COMING_SOON');
    expect(canonicalStatusTokens.PERMISSION_DENIED.tone).toBe('permission');
  });

  it('normalizes legacy labels and mock ids to canonical token codes', () => {
    expect(normalizeStatusCode('In Progress')).toBe('IN_PROGRESS');
    expect(normalizeStatusCode('ts-avail')).toBe('AVAILABLE');
    expect(normalizeStatusCode('status-cancelled')).toBe('CANCELLED');
    expect(getStatusToken('Placeholder')).toMatchObject({ code: 'COMING_SOON', cue: 'Soon' });
  });
});
