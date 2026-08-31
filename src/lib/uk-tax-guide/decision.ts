// Pure, deterministic decision logic for the UK Online Seller Tax Guide.
// No React, no I/O, no storage — a plain function of its input, fully unit
// testable. Every claim here traces to UK_TAX_GUIDE_SOURCES (sources.ts),
// itself checked directly against the official pages before this was
// written. This is educational guidance, never a personalised tax
// calculation: no branch here computes tax owed, a Capital Gains Tax
// liability, or gives a bare "taxable"/"not taxable" verdict — every
// outcome routes an uncertain or complex case to HMRC's own checker instead
// of guessing on the user's behalf.

import { UK_TAX_GUIDE_SOURCES, type SourceId } from './sources';

export type ActivityType =
  | 'PERSONAL_POSSESSIONS'
  | 'TRADING_BOUGHT_FOR_RESALE'
  | 'TRADING_MADE_OR_UPCYCLED'
  | 'MIXED'
  | 'UNSURE';

export const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'PERSONAL_POSSESSIONS', label: 'Selling unwanted personal possessions' },
  { value: 'TRADING_BOUGHT_FOR_RESALE', label: 'Buying goods intending to resell them for profit' },
  { value: 'TRADING_MADE_OR_UPCYCLED', label: 'Making or upcycling goods intending to sell them' },
  { value: 'MIXED', label: 'A mixture of personal possessions and trading activity' },
  { value: 'UNSURE', label: 'Unsure' },
];

/** The £1,000 trading-income test is inclusive at exactly £1,000 — HMRC's own wording is "£1,000 or less...may not have to tell HMRC" (see TRADING_ALLOWANCE). */
export const TRADING_ALLOWANCE_THRESHOLD = 1000;

/** The Capital Gains Tax personal-possessions consideration threshold (see CGT_PERSONAL_POSSESSIONS). */
export const PERSONAL_POSSESSION_CGT_THRESHOLD = 6000;

export interface DecisionInput {
  activityType: ActivityType;
  /** Combined gross trading income (£, before expenses) for the relevant UK tax year, across ALL trading activities and platforms. Required when activityType involves trading. */
  grossTradingIncome?: number | null;
  /** Whether any individual personal possession, or qualifying collection/set, was sold for £6,000 or more. Required when activityType involves personal possessions. */
  personalItemSoldFor6kOrMore?: boolean | null;
  /** Optional. Only changes the wording of the "next step" for the above-threshold trading outcome — never required. */
  alreadyDoesSelfAssessment?: boolean | null;
}

export type GuidanceOutcomeKind =
  | 'UNSURE_ROUTE_TO_CHECKER'
  | 'PERSONAL_LIKELY_NO_ACTION'
  | 'PERSONAL_POSSIBLE_CGT'
  | 'TRADING_BELOW_THRESHOLD'
  | 'TRADING_ABOVE_THRESHOLD'
  | 'MIXED_ROUTE_TO_CHECKER';

export interface GuidanceOutcome {
  kind: GuidanceOutcomeKind;
  headline: string;
  points: string[];
  nextStep: string;
  sourceIds: SourceId[];
}

function decidePersonalPossessions(soldFor6kOrMore: boolean | null): GuidanceOutcome {
  if (soldFor6kOrMore === true) {
    return {
      kind: 'PERSONAL_POSSIBLE_CGT',
      headline: 'This may be worth checking — Capital Gains Tax on a personal possession',
      points: [
        'Selling unwanted personal belongings occasionally is not automatically trading income. The number of sales you make, or your total marketplace proceeds, does not by itself automatically create a tax liability.',
        `A personal possession, or a qualifying collection or set, sold for £${PERSONAL_POSSESSION_CGT_THRESHOLD.toLocaleString('en-GB')} or more may need to be considered under the Capital Gains Tax rules.`,
        `The £${PERSONAL_POSSESSION_CGT_THRESHOLD.toLocaleString('en-GB')} figure is not a blanket annual allowance across all your marketplace sales — it applies per item, or per qualifying collection/set.`,
        'Capital Gains Tax is based on the gain (profit) you made on that item, not automatically the whole amount it sold for.',
      ],
      nextStep:
        'You may need to check or tell HMRC. This guide cannot calculate your Capital Gains Tax — use the official guidance and checker below to work out what applies to your situation.',
      sourceIds: [UK_TAX_GUIDE_SOURCES.CGT_PERSONAL_POSSESSIONS.id, UK_TAX_GUIDE_SOURCES.PLATFORM_INCOME_CHECKER.id],
    };
  }
  return {
    kind: 'PERSONAL_LIKELY_NO_ACTION',
    headline: 'Occasional sales of unwanted personal items are usually not trading income',
    points: [
      'Selling ordinary unwanted personal belongings occasionally is not automatically trading income.',
      'The number of sales you make, or your total marketplace proceeds, does not by itself automatically create a tax liability.',
      `If any single personal possession, or a qualifying collection/set, was sold for £${PERSONAL_POSSESSION_CGT_THRESHOLD.toLocaleString('en-GB')} or more, different rules may apply.`,
    ],
    nextStep:
      'Based on what you told us, this is unlikely to need reporting — but if anything above applies to you, or you are unsure, check the official HMRC guidance below.',
    sourceIds: [UK_TAX_GUIDE_SOURCES.CGT_PERSONAL_POSSESSIONS.id, UK_TAX_GUIDE_SOURCES.PLATFORM_INCOME_CHECKER.id],
  };
}

function decideTrading(grossTradingIncome: number, alreadyDoesSelfAssessment: boolean | null): GuidanceOutcome {
  const incomeDisplay = `£${grossTradingIncome.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (grossTradingIncome <= TRADING_ALLOWANCE_THRESHOLD) {
    return {
      kind: 'TRADING_BELOW_THRESHOLD',
      headline: `Your combined trading income looks to be at or under the £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} tax-free allowance`,
      points: [
        'Goods bought, made or upcycled with the intention of selling for profit may amount to trading.',
        `The £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} test is based on your combined gross trading income — before expenses — across ALL your trading activities and platforms for the tax year, not £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} per marketplace or per side hustle.`,
        `You told us your combined gross trading income is ${incomeDisplay}, which is at or under that £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} allowance.`,
      ],
      nextStep:
        'Based on what you told us, you may not need to tell HMRC about this income — but if your circumstances change, or you are unsure, check the official HMRC guidance below.',
      sourceIds: [UK_TAX_GUIDE_SOURCES.TRADING_ALLOWANCE.id, UK_TAX_GUIDE_SOURCES.TAX_HELP_FOR_HUSTLES.id, UK_TAX_GUIDE_SOURCES.PLATFORM_INCOME_CHECKER.id],
    };
  }

  const registrationPoint =
    alreadyDoesSelfAssessment === true
      ? "You already complete Self Assessment, so you'll likely need to include this income on your return."
      : 'You may need to register for and complete Self Assessment to tell HMRC about this income.';

  return {
    kind: 'TRADING_ABOVE_THRESHOLD',
    headline: `Your combined trading income is over the £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} tax-free allowance`,
    points: [
      'Goods bought, made or upcycled with the intention of selling for profit may amount to trading.',
      `The £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} test is based on your combined gross trading income — before expenses — across ALL your trading activities and platforms for the tax year, not £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} per marketplace or per side hustle.`,
      `You told us your combined gross trading income is ${incomeDisplay}, which is over £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')}, so you may need to tell HMRC about it.`,
      `Exceeding £${TRADING_ALLOWANCE_THRESHOLD.toLocaleString('en-GB')} does not mean your entire sales figure is automatically taxed — what you actually owe depends on your income, your allowable expenses, and whether you claim the trading allowance instead of your actual expenses. You cannot normally deduct both the allowance and your actual expenses for the same income.`,
      registrationPoint,
    ],
    nextStep:
      'This guide cannot calculate the tax you owe or file anything on your behalf. Use the official HMRC guidance below to work out your next step.',
    sourceIds: [UK_TAX_GUIDE_SOURCES.TRADING_ALLOWANCE.id, UK_TAX_GUIDE_SOURCES.TAX_HELP_FOR_HUSTLES.id, UK_TAX_GUIDE_SOURCES.PLATFORM_INCOME_CHECKER.id],
  };
}

function unsureOutcome(): GuidanceOutcome {
  return {
    kind: 'UNSURE_ROUTE_TO_CHECKER',
    headline: "Not sure? HMRC's own checker is the best next step",
    points: [
      'Whether selling counts as trading depends on your intentions and pattern of activity, not just the number of sales.',
      'Marketplace reporting to HMRC and your own tax liability are different questions — a platform sharing your sales data with HMRC does not automatically mean you owe tax.',
    ],
    nextStep:
      'You may need to check or tell HMRC. The official HMRC online-platform income checker below will ask a few more specific questions and give you a more definitive answer than this general guide can.',
    sourceIds: [UK_TAX_GUIDE_SOURCES.PLATFORM_INCOME_CHECKER.id, UK_TAX_GUIDE_SOURCES.NO_TAX_CHANGES_ANNOUNCEMENT.id],
  };
}

function combineMixed(personalPart: GuidanceOutcome, tradingPart: GuidanceOutcome): GuidanceOutcome {
  return {
    kind: 'MIXED_ROUTE_TO_CHECKER',
    headline: 'Your situation includes both personal possessions and trading — this needs individual checking',
    points: [
      'You told us your situation includes both personal possessions and trading-style activity. Mixed situations like this are exactly where a single yes/no answer would be misleading, so this guide is deliberately not giving you one.',
      ...personalPart.points,
      ...tradingPart.points,
    ],
    nextStep:
      'You may need to check or tell HMRC, separately, for each part of your situation. Use the official HMRC online-platform income checker below — it is built for exactly this kind of mixed situation.',
    sourceIds: Array.from(new Set([...personalPart.sourceIds, ...tradingPart.sourceIds])),
  };
}

/**
 * Resolves a guidance outcome for an already-validated input. Callers
 * (the UI) are responsible for validating required fields before calling
 * this — like the fee-calculation engines elsewhere in this app, this
 * throws on a caller bug (a required field missing for the given
 * activityType) rather than silently guessing a value.
 */
export function decide(input: DecisionInput): GuidanceOutcome {
  const needsPersonal = input.activityType === 'PERSONAL_POSSESSIONS' || input.activityType === 'MIXED';
  const needsTrading =
    input.activityType === 'TRADING_BOUGHT_FOR_RESALE' ||
    input.activityType === 'TRADING_MADE_OR_UPCYCLED' ||
    input.activityType === 'MIXED';

  if (needsPersonal && (input.personalItemSoldFor6kOrMore === null || input.personalItemSoldFor6kOrMore === undefined)) {
    throw new Error('decide() called without personalItemSoldFor6kOrMore for an activityType that requires it.');
  }
  if (needsTrading) {
    if (
      input.grossTradingIncome === null ||
      input.grossTradingIncome === undefined ||
      !Number.isFinite(input.grossTradingIncome) ||
      input.grossTradingIncome < 0
    ) {
      throw new Error('decide() called without a valid non-negative grossTradingIncome for an activityType that requires it.');
    }
  }

  if (input.activityType === 'UNSURE') {
    return unsureOutcome();
  }
  if (input.activityType === 'PERSONAL_POSSESSIONS') {
    return decidePersonalPossessions(input.personalItemSoldFor6kOrMore ?? null);
  }
  if (input.activityType === 'TRADING_BOUGHT_FOR_RESALE' || input.activityType === 'TRADING_MADE_OR_UPCYCLED') {
    return decideTrading(input.grossTradingIncome as number, input.alreadyDoesSelfAssessment ?? null);
  }
  // MIXED
  const personalPart = decidePersonalPossessions(input.personalItemSoldFor6kOrMore ?? null);
  const tradingPart = decideTrading(input.grossTradingIncome as number, input.alreadyDoesSelfAssessment ?? null);
  return combineMixed(personalPart, tradingPart);
}

// --- Input parsing (mirrors the app-wide "never guess" validation philosophy) ---

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Combined gross trading income: blank means "not answered yet" (not £0 —
 * this is a required field on the trading/mixed path, so a blank value
 * must never silently become a valid £0 answer). Negative, malformed and
 * non-finite ("Infinity", "NaN", scientific notation, etc.) are all rejected.
 */
export function parseGrossTradingIncome(raw: string): ParseResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Enter your combined gross trading income for the tax year (enter 0 if none).' };
  }
  if (!/^\d*\.?\d+$/.test(trimmed)) {
    return { ok: false, error: 'Enter a valid, non-negative amount (e.g. 850 or 1250.50).' };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return { ok: false, error: 'Enter a valid, non-negative amount.' };
  }
  if (n < 0) {
    return { ok: false, error: 'Amount cannot be negative.' };
  }
  return { ok: true, value: n };
}
