import type { FeeLine } from './types';

/**
 * True only when EVERY fee line in the result is an automatically
 * calculated rule independently verified as of `verifiedDateIso` — never
 * when the result mixes verified rules with unverified/automated/manual
 * ones. A single AUTOMATED_UNVERIFIED or user-entered line (no
 * verificationStatus at all) disqualifies the whole result, by design:
 * showing "fees last verified" over a mixed result would imply a blanket
 * verification that isn't true.
 */
export function allLinesVerifiedAsOf(feeLines: FeeLine[], verifiedDateIso: string): boolean {
  if (feeLines.length === 0) return false;
  return feeLines.every(
    (l) =>
      (l.verificationStatus === 'SPEC_VERIFIED' || l.verificationStatus === 'AUDIT_VERIFIED') &&
      l.verifiedAt === verifiedDateIso
  );
}
