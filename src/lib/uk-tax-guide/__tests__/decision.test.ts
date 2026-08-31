import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_TYPE_OPTIONS,
  PERSONAL_POSSESSION_CGT_THRESHOLD,
  TRADING_ALLOWANCE_THRESHOLD,
  decide,
  parseGrossTradingIncome,
  type GuidanceOutcome,
} from '../decision';

// Phrases this guide must never produce — a bare verdict, a claim that
// reporting itself creates tax, or a claim that the allowance and actual
// expenses can both be deducted at once.
const FORBIDDEN_PATTERNS = [
  /\byou are taxable\b/i,
  /\byou are not taxable\b/i,
  /\byour income is taxable\b/i,
  /automatically (owe|means you owe) tax/i,
];

function allText(outcome: GuidanceOutcome): string {
  return [outcome.headline, ...outcome.points, outcome.nextStep].join(' ');
}

function assertNoForbiddenClaims(outcome: GuidanceOutcome) {
  const text = allText(outcome);
  for (const pattern of FORBIDDEN_PATTERNS) {
    expect(text).not.toMatch(pattern);
  }
}

describe('UK Online Seller Tax Guide — decision logic', () => {
  describe('personal possessions', () => {
    it('unwanted personal items, no £6,000 disposal -> likely no action, no forbidden claims', () => {
      const r = decide({ activityType: 'PERSONAL_POSSESSIONS', personalItemSoldFor6kOrMore: false });
      expect(r.kind).toBe('PERSONAL_LIKELY_NO_ACTION');
      assertNoForbiddenClaims(r);
      // Never claims volume/proceeds alone create liability.
      expect(allText(r)).toMatch(/does not by itself automatically create a tax liability/i);
    });

    it('personal possession sold for £6,000 or more -> possible CGT, never calculates the liability', () => {
      const r = decide({ activityType: 'PERSONAL_POSSESSIONS', personalItemSoldFor6kOrMore: true });
      expect(r.kind).toBe('PERSONAL_POSSIBLE_CGT');
      assertNoForbiddenClaims(r);
      expect(allText(r)).toMatch(/cannot calculate your Capital Gains Tax/i);
      // £6,000 is not a blanket allowance across all sales.
      expect(allText(r)).toMatch(/not a blanket annual allowance/i);
      // CGT is on the gain, not the full proceeds.
      expect(allText(r)).toMatch(/gain.*not automatically the whole amount/i);
      expect(r.sourceIds).toContain('cgt-personal-possessions');
    });

    it(`the £${PERSONAL_POSSESSION_CGT_THRESHOLD} threshold is exposed as a named constant, not a magic number`, () => {
      expect(PERSONAL_POSSESSION_CGT_THRESHOLD).toBe(6000);
    });
  });

  describe('trading activity — the £1,000 threshold', () => {
    it('trading income below £1,000 -> below-threshold outcome', () => {
      const r = decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 400 });
      expect(r.kind).toBe('TRADING_BELOW_THRESHOLD');
      assertNoForbiddenClaims(r);
    });

    it('trading income exactly £1,000 -> below-threshold outcome (HMRC: "£1,000 or less...may not have to tell HMRC")', () => {
      const r = decide({ activityType: 'TRADING_MADE_OR_UPCYCLED', grossTradingIncome: TRADING_ALLOWANCE_THRESHOLD });
      expect(r.kind).toBe('TRADING_BELOW_THRESHOLD');
    });

    it('trading income above £1,000 -> above-threshold outcome, never claims the whole figure is taxed', () => {
      const r = decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 2500 });
      expect(r.kind).toBe('TRADING_ABOVE_THRESHOLD');
      assertNoForbiddenClaims(r);
      expect(allText(r)).toMatch(/does not mean your entire sales figure is automatically taxed/i);
    });

    it('never claims the trading allowance and actual expenses can both be deducted', () => {
      const r = decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 5000 });
      expect(allText(r)).toMatch(/cannot normally deduct both/i);
      expect(allText(r)).not.toMatch(/deduct both the allowance and (your )?actual expenses\b(?!.*cannot)/i);
    });

    it('does not calculate tax due or give a filing conclusion', () => {
      const r = decide({ activityType: 'TRADING_MADE_OR_UPCYCLED', grossTradingIncome: 3000 });
      expect(allText(r)).toMatch(/cannot calculate the tax you owe/i);
      // The outcome type itself has no numeric "tax owed" field at all.
      expect(r).not.toHaveProperty('taxOwed');
      expect(r).not.toHaveProperty('taxDue');
    });

    it('combined activity across multiple platforms/side hustles is described as ONE combined test, not per-platform', () => {
      const r = decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 1200 });
      expect(allText(r)).toMatch(/combined gross trading income/i);
      expect(allText(r)).toMatch(/not £1,000 per marketplace or per side hustle/i);
    });

    it('the £1,000 threshold is exposed as a named constant, not a magic number', () => {
      expect(TRADING_ALLOWANCE_THRESHOLD).toBe(1000);
    });

    it('already completing Self Assessment changes only the wording of the next step, not the threshold outcome', () => {
      const already = decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 5000, alreadyDoesSelfAssessment: true });
      const notYet = decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 5000, alreadyDoesSelfAssessment: false });
      expect(already.kind).toBe('TRADING_ABOVE_THRESHOLD');
      expect(notYet.kind).toBe('TRADING_ABOVE_THRESHOLD');
      expect(allText(already)).toMatch(/already complete Self Assessment/i);
      expect(allText(notYet)).toMatch(/may need to register/i);
    });

    it('clearly distinguishes gross income from profit', () => {
      const r = decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 3000 });
      expect(allText(r)).toMatch(/gross trading income — before expenses/i);
    });
  });

  describe('mixed personal and trading activity', () => {
    it('never forces a definitive taxable/not-taxable verdict — routes to the official checker', () => {
      const r = decide({
        activityType: 'MIXED',
        personalItemSoldFor6kOrMore: false,
        grossTradingIncome: 2000,
      });
      expect(r.kind).toBe('MIXED_ROUTE_TO_CHECKER');
      assertNoForbiddenClaims(r);
      expect(allText(r)).toMatch(/exactly where a single yes\/no answer would be misleading/i);
    });

    it('combines both the personal and trading explanations', () => {
      const r = decide({
        activityType: 'MIXED',
        personalItemSoldFor6kOrMore: true,
        grossTradingIncome: 5000,
      });
      expect(allText(r)).toMatch(/Capital Gains Tax/i);
      expect(allText(r)).toMatch(/combined gross trading income/i);
      expect(r.sourceIds).toEqual(expect.arrayContaining(['cgt-personal-possessions', 'trading-allowance']));
    });

    it('mixed with trading below £1,000 and no CGT-relevant disposal still routes to the checker, not a bare "no action" verdict', () => {
      const r = decide({
        activityType: 'MIXED',
        personalItemSoldFor6kOrMore: false,
        grossTradingIncome: 200,
      });
      expect(r.kind).toBe('MIXED_ROUTE_TO_CHECKER');
    });
  });

  describe('unsure', () => {
    it('routes to the official checker with calm, non-alarming wording', () => {
      const r = decide({ activityType: 'UNSURE' });
      expect(r.kind).toBe('UNSURE_ROUTE_TO_CHECKER');
      expect(allText(r)).toMatch(/you may need to check or tell hmrc/i);
      assertNoForbiddenClaims(r);
      // No enforcement-style language.
      expect(allText(r)).not.toMatch(/\b(penalty|fine|prosecut|investigat)/i);
    });

    it('unsure requires no other fields at all', () => {
      expect(() => decide({ activityType: 'UNSURE' })).not.toThrow();
    });
  });

  describe('marketplace reporting is never presented as a new tax threshold', () => {
    it('no outcome claims marketplace reporting automatically means tax is due', () => {
      const allOutcomes = [
        decide({ activityType: 'PERSONAL_POSSESSIONS', personalItemSoldFor6kOrMore: false }),
        decide({ activityType: 'PERSONAL_POSSESSIONS', personalItemSoldFor6kOrMore: true }),
        decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 500 }),
        decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: 5000 }),
        decide({ activityType: 'UNSURE' }),
      ];
      for (const outcome of allOutcomes) {
        expect(allText(outcome)).not.toMatch(/30 sales/i);
        expect(allText(outcome)).not.toMatch(/€2,000|EUR ?2,000/i);
        assertNoForbiddenClaims(outcome);
      }
    });

    it('the unsure outcome explicitly separates reporting from liability', () => {
      const r = decide({ activityType: 'UNSURE' });
      expect(allText(r)).toMatch(/does not automatically mean you owe tax/i);
    });
  });

  describe('caller-bug guards (decide() should never silently guess a missing required field)', () => {
    it('throws if personalItemSoldFor6kOrMore is missing for a personal-possessions activity type', () => {
      expect(() => decide({ activityType: 'PERSONAL_POSSESSIONS' })).toThrow();
    });

    it('throws if grossTradingIncome is missing for a trading activity type', () => {
      expect(() => decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE' })).toThrow();
    });

    it('throws if grossTradingIncome is negative or non-finite', () => {
      expect(() => decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: -5 })).toThrow();
      expect(() => decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: Infinity })).toThrow();
      expect(() => decide({ activityType: 'TRADING_BOUGHT_FOR_RESALE', grossTradingIncome: NaN })).toThrow();
    });

    it('throws if MIXED is missing either required field', () => {
      expect(() => decide({ activityType: 'MIXED', grossTradingIncome: 500 })).toThrow();
      expect(() => decide({ activityType: 'MIXED', personalItemSoldFor6kOrMore: true })).toThrow();
    });
  });

  describe('parseGrossTradingIncome — invalid, negative, empty and non-finite money inputs', () => {
    it('rejects an empty string — blank must never silently become £0 for a required field', () => {
      expect(parseGrossTradingIncome('').ok).toBe(false);
      expect(parseGrossTradingIncome('   ').ok).toBe(false);
    });

    it('accepts £0 as an explicit, valid answer', () => {
      const r = parseGrossTradingIncome('0');
      expect(r).toEqual({ ok: true, value: 0 });
    });

    it('rejects negative amounts', () => {
      expect(parseGrossTradingIncome('-1').ok).toBe(false);
      expect(parseGrossTradingIncome('-0.01').ok).toBe(false);
    });

    it('rejects non-finite and malformed input', () => {
      for (const bad of ['Infinity', '-Infinity', 'NaN', 'abc', '1e10', '1,000', '12.34.56', '0x10']) {
        expect(parseGrossTradingIncome(bad).ok, bad).toBe(false);
      }
    });

    it('accepts valid decimal amounts', () => {
      expect(parseGrossTradingIncome('1250.50')).toEqual({ ok: true, value: 1250.5 });
      expect(parseGrossTradingIncome('1000')).toEqual({ ok: true, value: 1000 });
    });
  });

  describe('ACTIVITY_TYPE_OPTIONS covers exactly the five required categories', () => {
    it('has exactly 5 options', () => {
      expect(ACTIVITY_TYPE_OPTIONS).toHaveLength(5);
    });

    it('includes personal possessions, resale, made/upcycled, mixed and unsure', () => {
      const values = ACTIVITY_TYPE_OPTIONS.map((o) => o.value);
      expect(values).toEqual(['PERSONAL_POSSESSIONS', 'TRADING_BOUGHT_FOR_RESALE', 'TRADING_MADE_OR_UPCYCLED', 'MIXED', 'UNSURE']);
    });
  });
});
