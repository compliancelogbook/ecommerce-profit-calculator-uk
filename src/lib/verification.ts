import type { Platform } from '../data/types';
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

/**
 * Per-platform "fees last verified" date, additive so a new platform
 * declares its own date rather than silently inheriting (or failing to
 * match) a single shared/hardcoded constant. Existing platforms keep their
 * original 16 August 2026 launch-audit date unchanged.
 */
export const PLATFORM_VERIFIED_DATE: Record<Platform, { iso: string; display: string }> = {
  SHOPIFY: { iso: '2026-08-16', display: '16 August 2026' },
  ETSY: { iso: '2026-08-16', display: '16 August 2026' },
  EBAY: { iso: '2026-08-16', display: '16 August 2026' },
  AMAZON: { iso: '2026-08-16', display: '16 August 2026' },
  TIKTOK: { iso: '2026-08-31', display: '31 August 2026' },
  VINTED: { iso: '2026-09-02', display: '2 September 2026' },
};

/**
 * Resolves the "Fees last verified" banner for a result, using the
 * verification date of whichever platform its fee lines belong to — or
 * null when the lines don't carry a platform, or aren't uniformly verified
 * as of THAT platform's date (see allLinesVerifiedAsOf).
 */
export function verifiedBannerFor(feeLines: FeeLine[]): { display: string } | null {
  const platform = feeLines.find((l) => l.platform)?.platform;
  if (!platform) return null;
  const entry = PLATFORM_VERIFIED_DATE[platform];
  if (!allLinesVerifiedAsOf(feeLines, entry.iso)) return null;
  return { display: entry.display };
}
