import type { ConfidenceLevel } from './types';

// Precedence (worst wins): a missing/applicable-but-excluded fee is worse
// than a disclosed assumption, which is worse than a fully verified,
// exactly-calculated input. Every engine should collect signals as it goes
// and reduce with `worstConfidence` rather than hand-order if/else branches
// — that ordering is easy to get subtly wrong (see the 2026-08-16 audit,
// which found Shopify/Etsy overstating certainty for exactly this reason).
const PRECEDENCE: Record<ConfidenceLevel, number> = {
  EXACT_FOR_SELECTED_INPUTS: 0,
  ASSUMPTION_DEPENDENT: 1,
  EXCLUDES_VARIABLE_FEES: 2,
};

export function worstConfidence(signals: ConfidenceLevel[]): ConfidenceLevel {
  return signals.reduce<ConfidenceLevel>(
    (worst, s) => (PRECEDENCE[s] > PRECEDENCE[worst] ? s : worst),
    'EXACT_FOR_SELECTED_INPUTS'
  );
}
