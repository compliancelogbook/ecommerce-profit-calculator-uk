import { describe, expect, it } from 'vitest';
import { calculateEbay, type EbayInput } from '../ebay';
import { UNSUPPORTED_CATEGORY_ID } from '../../../data/types';

const base: EbayInput = {
  itemPrice: 30,
  itemCost: 0,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  categoryId: 'JEWELLERY_WATCHES',
  region: 'DOMESTIC',
  currencyConversionSelected: false,
  topRatedPremiumService: false,
  vatProfile: 'NOT_REGISTERED',
};

function line(r: ReturnType<typeof calculateEbay>, id: string) {
  return r.feeLines.find((f) => f.id === id)!;
}

describe('eBay UK Business acceptance tests', () => {
  it('EB01: Jewellery & Watches, £30, domestic, no top-rated -> raw base fees £4.975', () => {
    const r = calculateEbay(base);
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(4.47, 6);
    expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.4, 6);
    expect(r.regulatoryFee).toBeCloseTo(0.105, 6);
    const raw = line(r, 'ebay-variable-fvf').amountExVat + line(r, 'ebay-per-order').amountExVat + r.regulatoryFee;
    expect(raw).toBeCloseTo(4.975, 6);
  });

  it('EB02: £10 sale -> per-order fee £0.30', () => {
    const r = calculateEbay({ ...base, itemPrice: 10 });
    expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.3, 6);
  });

  it('EB03: £10.01 sale -> per-order fee £0.40', () => {
    const r = calculateEbay({ ...base, itemPrice: 10.01 });
    expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.4, 6);
  });

  it("EB04: Women's Bags & Handbags, £1000 -> 12.9% on first £800, 7% on £200 above", () => {
    const r = calculateEbay({ ...base, categoryId: 'WOMENS_BAGS_HANDBAGS', itemPrice: 1000 });
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(800 * 0.129 + 200 * 0.07, 6);
  });

  it('EB05: Jewellery & Watches, £1200 -> 14.9% on first £1000, 4% on £200 above', () => {
    const r = calculateEbay({ ...base, itemPrice: 1200 });
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(1000 * 0.149 + 200 * 0.04, 6);
  });

  it('EB06: £100 Eurozone/Northern Europe -> international fee £1.05', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, region: 'EU_NORTHERN_EUROPE' });
    expect(r.internationalFee).toBeCloseTo(1.05, 6);
  });

  it('EB07: £100 US/Canada -> international fee £1.80', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, region: 'US_CANADA' });
    expect(r.internationalFee).toBeCloseTo(1.8, 6);
  });

  it('EB08: £100 Other -> international fee £2.00', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, region: 'OTHER' });
    expect(r.internationalFee).toBeCloseTo(2.0, 6);
  });

  it('EB09: £100 basis, currency conversion selected -> £2.50', () => {
    const r = calculateEbay({ ...base, itemPrice: 100, currencyConversionSelected: true });
    expect(r.currencyConversionFee).toBeCloseTo(2.5, 6);
  });

  it('EB10: Top Rated Premium Service reduces only the variable FVF by 10%', () => {
    const without = calculateEbay(base);
    const withDiscount = calculateEbay({ ...base, topRatedPremiumService: true });
    expect(line(withDiscount, 'ebay-variable-fvf').amountExVat).toBeCloseTo(line(without, 'ebay-variable-fvf').amountExVat * 0.9, 6);
    expect(line(withDiscount, 'ebay-per-order').amountExVat).toBeCloseTo(line(without, 'ebay-per-order').amountExVat, 6);
    expect(withDiscount.regulatoryFee).toBeCloseTo(without.regulatoryFee, 6);
  });

  it('Unsupported category is never silently guessed', () => {
    const r = calculateEbay({ ...base, categoryId: 'SOME_UNKNOWN_CATEGORY' });
    expect(line(r, 'ebay-variable-fvf').amountExVat).toBe(0);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    expect(r.exclusions.some((e) => e.includes('not in the verified'))).toBe(true);
  });

  describe('2026-08-16 audit: manual category rate never silently becomes 0%', () => {
    const unsupported = { ...base, categoryId: UNSUPPORTED_CATEGORY_ID };

    it('missing manual rate (undefined/null) excludes the fee', () => {
      const r1 = calculateEbay({ ...unsupported, manualCategoryRate: undefined });
      expect(line(r1, 'ebay-variable-fvf').amountExVat).toBe(0);
      expect(r1.confidence).toBe('EXCLUDES_VARIABLE_FEES');

      const r2 = calculateEbay({ ...unsupported, manualCategoryRate: null });
      expect(line(r2, 'ebay-variable-fvf').amountExVat).toBe(0);
      expect(r2.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('a 0% manual rate is rejected, not accepted as a real 0-fee calculation', () => {
      const r = calculateEbay({ ...unsupported, manualCategoryRate: 0 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBe(0);
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('a negative manual rate is rejected', () => {
      const r = calculateEbay({ ...unsupported, manualCategoryRate: -0.05 });
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('a malformed (NaN/Infinity) manual rate is rejected', () => {
      const r1 = calculateEbay({ ...unsupported, manualCategoryRate: NaN });
      expect(r1.confidence).toBe('EXCLUDES_VARIABLE_FEES');
      const r2 = calculateEbay({ ...unsupported, manualCategoryRate: Infinity });
      expect(r2.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('an implausibly high manual rate (>100%) is rejected', () => {
      const r = calculateEbay({ ...unsupported, manualCategoryRate: 1.5 });
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    });

    it('a valid manual rate is accepted and marked ASSUMPTION_DEPENDENT', () => {
      const r = calculateEbay({ ...unsupported, manualCategoryRate: 0.125, itemPrice: 100 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(12.5, 6);
      expect(r.confidence).toBe('ASSUMPTION_DEPENDENT');
    });
  });

  it('rejects negative and non-integer/zero inputs at the engine boundary', () => {
    expect(() => calculateEbay({ ...base, itemPrice: -1 })).toThrow();
    expect(() => calculateEbay({ ...base, quantity: 0 })).toThrow();
    expect(() => calculateEbay({ ...base, quantity: 1.5 })).toThrow();
  });

  describe('2026-08-16 follow-up audit: per-item threshold calculation', () => {
    it("the auditor's exact example: two £800 Jewellery items must NOT be combined into one £1,600 basis", () => {
      const r = calculateEbay({ ...base, categoryId: 'JEWELLERY_WATCHES', itemPrice: 800, quantity: 2 });
      // Each item individually stays below the £1,000 threshold, so each is charged 14.9% in full.
      const perItemFee = 800 * 0.149;
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(perItemFee * 2, 6);
      // The old (wrong) combined-basis calculation would have given 1000*0.149 + 600*0.04 = 173, which is LESS
      // than the correct per-item answer — confirm we are not accidentally reproducing that bug.
      const wrongCombinedAnswer = 1000 * 0.149 + 600 * 0.04;
      expect(line(r, 'ebay-variable-fvf').amountExVat).not.toBeCloseTo(wrongCombinedAnswer, 2);
    });

    it('quantity 1, below and above the tier boundary, is unaffected by the per-item fix (per-item basis === per-order basis)', () => {
      const below = calculateEbay({ ...base, categoryId: 'JEWELLERY_WATCHES', itemPrice: 900, quantity: 1 });
      expect(line(below, 'ebay-variable-fvf').amountExVat).toBeCloseTo(900 * 0.149, 6);

      const above = calculateEbay({ ...base, categoryId: 'JEWELLERY_WATCHES', itemPrice: 1200, quantity: 1 });
      expect(line(above, 'ebay-variable-fvf').amountExVat).toBeCloseTo(1000 * 0.149 + 200 * 0.04, 6);
    });

    it('quantity > 1 where EACH item individually crosses the threshold: each item is tiered independently, then multiplied', () => {
      const r = calculateEbay({ ...base, categoryId: 'JEWELLERY_WATCHES', itemPrice: 1200, quantity: 3 });
      const perItemFee = 1000 * 0.149 + 200 * 0.04; // = 157
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(perItemFee * 3, 6);
    });

    it('per-item basis excludes shipping for quantity > 1 (unconfirmed allocation), but includes it for quantity === 1', () => {
      const singleWithShipping = calculateEbay({ ...base, categoryId: 'JEWELLERY_WATCHES', itemPrice: 900, shippingCharged: 150, quantity: 1 });
      // qty=1: "total amount of the sale" = item + postage = 1050 -> crosses the £1,000 threshold.
      expect(line(singleWithShipping, 'ebay-variable-fvf').amountExVat).toBeCloseTo(1000 * 0.149 + 50 * 0.04, 6);
      expect(singleWithShipping.exclusions.some((e) => e.includes('excluded from the per-item'))).toBeFalsy();

      const multiWithShipping = calculateEbay({ ...base, categoryId: 'JEWELLERY_WATCHES', itemPrice: 900, shippingCharged: 150, quantity: 2 });
      // qty=2: shipping is excluded from the per-item tier basis (unconfirmed allocation) -> each item stays at 900, below threshold.
      expect(line(multiWithShipping, 'ebay-variable-fvf').amountExVat).toBeCloseTo(900 * 0.149 * 2, 6);
      expect(multiWithShipping.exclusions.some((e) => e.includes('excluded from the per-item'))).toBe(true);
      expect(multiWithShipping.confidence).toBe('EXCLUDES_VARIABLE_FEES');
      // The order-level fees (regulatory etc.) still include the full shipping charged.
      expect(multiWithShipping.regulatoryFee).toBeCloseTo((900 * 2 + 150) * 0.0035, 6);
    });

    it('a FLAT category (no threshold) is completely unaffected by per-item vs per-order basis', () => {
      const r = calculateEbay({ ...base, categoryId: 'EVERYTHING_ELSE', itemPrice: 500, quantity: 3 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(500 * 3 * 0.129, 6);
    });
  });

  describe('2026-08-16 follow-up audit: reduced 10p per-order fee', () => {
    it('applies 10p instead of 30p for a qualifying sale at or below £10', () => {
      const r = calculateEbay({ ...base, itemPrice: 8, qualifiesForReducedPerOrderFee: true });
      expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.1, 6);
    });

    it('does NOT apply when qualifiesForReducedPerOrderFee is false, even for a sale ≤ £10', () => {
      const r = calculateEbay({ ...base, itemPrice: 8, qualifiesForReducedPerOrderFee: false });
      expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.3, 6);
    });

    it('reverts to the normal 40p above £10 even for a qualifying category', () => {
      const r = calculateEbay({ ...base, itemPrice: 15, qualifiesForReducedPerOrderFee: true });
      expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.4, 6);
    });
  });

  describe('2026-08-16 follow-up audit: category IDs and known open questions are surfaced', () => {
    it('Jewellery & Watches, Women\'s Bags & Handbags and Smartphones carry a confirmed official category ID', () => {
      const jewellery = calculateEbay({ ...base, categoryId: 'JEWELLERY_WATCHES' });
      expect(line(jewellery, 'ebay-variable-fvf').label).toContain('#281');

      const bags = calculateEbay({ ...base, categoryId: 'WOMENS_BAGS_HANDBAGS', itemPrice: 100 });
      expect(line(bags, 'ebay-variable-fvf').label).toContain('#169291');

      const phones = calculateEbay({ ...base, categoryId: 'SMARTPHONES', itemPrice: 100 });
      expect(line(phones, 'ebay-variable-fvf').label).toContain('#9355');
    });
  });
});
