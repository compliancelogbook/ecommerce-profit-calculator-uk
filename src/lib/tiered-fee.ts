import type { FeeTier, PercentageSchedule } from '../data/types';
import { money, percentOf, sum, type Money } from './decimal';

export interface TierBreakdown {
  from: number;
  upTo: number | null;
  rate: number;
  amountInTier: number;
  fee: number;
}

export interface TieredResult {
  total: Money;
  breakdown: TierBreakdown[];
}

/**
 * Applies a threshold/tiered percentage schedule to a basis amount.
 * Shared by eBay (Final Value Fee categories) and Amazon (referral fee
 * categories) — both are "rate A up to £X, then rate B above" in shape.
 */
export function applyTieredRate(basis: Money, tiers: FeeTier[]): TieredResult {
  let remaining = basis;
  let from = money(0);
  const breakdown: TierBreakdown[] = [];
  const parts: Money[] = [];

  for (const tier of tiers) {
    if (remaining.lte(0)) {
      breakdown.push({ from: from.toNumber(), upTo: tier.upTo, rate: tier.rate, amountInTier: 0, fee: 0 });
      continue;
    }
    const tierCeiling = tier.upTo === null ? null : money(tier.upTo);
    const tierWidth = tierCeiling === null ? remaining : tierCeiling.minus(from);
    const amountInTier = Money_min(remaining, tierWidth.gt(0) ? tierWidth : money(0));
    const fee = percentOf(amountInTier, tier.rate);
    parts.push(fee);
    breakdown.push({
      from: from.toNumber(),
      upTo: tier.upTo,
      rate: tier.rate,
      amountInTier: amountInTier.toNumber(),
      fee: fee.toNumber(),
    });
    remaining = remaining.minus(amountInTier);
    if (tierCeiling !== null) from = tierCeiling;
  }

  return { total: sum(parts), breakdown };
}

function Money_min(a: Money, b: Money): Money {
  return a.lte(b) ? a : b;
}

export function applySchedule(basis: Money, schedule: PercentageSchedule): TieredResult {
  if (schedule.kind === 'FLAT') {
    const fee = percentOf(basis, schedule.rate);
    return {
      total: fee,
      breakdown: [{ from: 0, upTo: null, rate: schedule.rate, amountInTier: basis.toNumber(), fee: fee.toNumber() }],
    };
  }
  if (schedule.kind === 'THRESHOLD_FLAT') {
    const bracket = schedule.tiers.find((t) => t.upTo === null || basis.lte(t.upTo)) ?? schedule.tiers[schedule.tiers.length - 1];
    const fee = percentOf(basis, bracket.rate);
    return {
      total: fee,
      breakdown: [{ from: 0, upTo: bracket.upTo, rate: bracket.rate, amountInTier: basis.toNumber(), fee: fee.toNumber() }],
    };
  }
  return applyTieredRate(basis, schedule.tiers);
}
