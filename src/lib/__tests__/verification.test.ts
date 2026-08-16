import { describe, expect, it } from 'vitest';
import { allLinesVerifiedAsOf } from '../verification';
import type { FeeLine } from '../types';

const DATE = '2026-08-16';

function makeLine(overrides: Partial<FeeLine>): FeeLine {
  return { id: 'x', label: 'x', amountExVat: 1, category: 'transaction', ...overrides };
}

describe('allLinesVerifiedAsOf', () => {
  it('false when there are no fee lines', () => {
    expect(allLinesVerifiedAsOf([], DATE)).toBe(false);
  });

  it('true when every line is SPEC_VERIFIED as of the date', () => {
    const lines = [
      makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: DATE }),
      makeLine({ verificationStatus: 'AUDIT_VERIFIED', verifiedAt: DATE }),
    ];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(true);
  });

  it('false when any single line is AUTOMATED_UNVERIFIED — mixed results never imply blanket verification', () => {
    const lines = [
      makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: DATE }),
      makeLine({ verificationStatus: 'AUTOMATED_UNVERIFIED', verifiedAt: null }),
    ];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(false);
  });

  it('false when any line is a user-entered/manual line with no verification status at all', () => {
    const lines = [makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: DATE }), makeLine({})];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(false);
  });

  it('false when a line was verified on a different date', () => {
    const lines = [makeLine({ verificationStatus: 'SPEC_VERIFIED', verifiedAt: '2026-01-01' })];
    expect(allLinesVerifiedAsOf(lines, DATE)).toBe(false);
  });
});
