import { describe, expect, it } from 'vitest';
import { calculateEbay, type EbayInput } from '../ebay';
import { EBAY_CATEGORIES } from '../../../data/ebay.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../../data/types';

const base: EbayInput = {
  itemPrice: 30,
  itemCost: 0,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  categoryId: 'JEWELLERY',
  region: 'DOMESTIC',
  currencyConversionSelected: false,
  topRatedPremiumService: false,
  vatProfile: 'NOT_REGISTERED',
};

function line(r: ReturnType<typeof calculateEbay>, id: string) {
  return r.feeLines.find((f) => f.id === id)!;
}

describe('eBay UK Business acceptance tests', () => {
  it('EB01: Jewellery, £30, domestic, no top-rated -> raw base fees £4.975', () => {
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

  it('EB05: Jewellery, £1200 -> 14.9% on first £1000, 4% on £200 above', () => {
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

    it('manual/unsupported categories never receive the reduced per-order fee, even for a tiny sale', () => {
      const r = calculateEbay({ ...unsupported, manualCategoryRate: 0.1, itemPrice: 2 });
      expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.3, 6); // normal ≤£10 fee, not the 10p reduction
    });
  });

  it('rejects negative and non-integer/zero inputs at the engine boundary', () => {
    expect(() => calculateEbay({ ...base, itemPrice: -1 })).toThrow();
    expect(() => calculateEbay({ ...base, quantity: 0 })).toThrow();
    expect(() => calculateEbay({ ...base, quantity: 1.5 })).toThrow();
  });

  describe('2026-08-16 second follow-up audit: Jewellery split from Watches, Parts & Accessories', () => {
    it('Jewellery (#281) and Watches, Parts & Accessories (#260324) are distinct, separately selectable categories', () => {
      expect(EBAY_CATEGORIES.find((c) => c.id === 'JEWELLERY_WATCHES')).toBeUndefined();
      const jewellery = EBAY_CATEGORIES.find((c) => c.id === 'JEWELLERY')!;
      const watches = EBAY_CATEGORIES.find((c) => c.id === 'WATCHES_PARTS_ACCESSORIES')!;
      expect(jewellery.officialCategoryId).toBe('281');
      expect(watches.officialCategoryId).toBe('260324');
    });

    it('Jewellery: 14.9% up to £1,000 per item, 4% above', () => {
      const r = calculateEbay({ ...base, categoryId: 'JEWELLERY', itemPrice: 1200 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(1000 * 0.149 + 200 * 0.04, 6);
    });

    it('Watches, Parts & Accessories: 12.9% up to £750 per item, 3% above — a DIFFERENT rate to Jewellery', () => {
      const r = calculateEbay({ ...base, categoryId: 'WATCHES_PARTS_ACCESSORIES', itemPrice: 900 });
      const expected = 750 * 0.129 + 150 * 0.03;
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(expected, 6);
      // Confirm this is NOT the same figure Jewellery's rate would produce for the same £900.
      const jewelleryEquivalent = 900 * 0.149; // £900 stays within Jewellery's £1,000 tier
      expect(expected).not.toBeCloseTo(jewelleryEquivalent, 1);
    });

    it('a Watches item priced below its own £750 threshold is charged flat 12.9%, not Jewellery\'s 14.9%', () => {
      const r = calculateEbay({ ...base, categoryId: 'WATCHES_PARTS_ACCESSORIES', itemPrice: 500 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(500 * 0.129, 6);
    });
  });

  describe('2026-08-16 second follow-up audit: per-item boundary coverage for every tiered category', () => {
    const tieredCategories = [
      { id: 'WOMENS_BAGS_HANDBAGS', threshold: 800, rate1: 0.129, rate2: 0.07 },
      { id: 'JEWELLERY', threshold: 1000, rate1: 0.149, rate2: 0.04 },
      { id: 'WATCHES_PARTS_ACCESSORIES', threshold: 750, rate1: 0.129, rate2: 0.03 },
      { id: 'SMARTPHONES', threshold: 1000, rate1: 0.069, rate2: 0.03 },
    ];

    it.each(tieredCategories)('$id: quantity 1, immediately below the £$threshold boundary -> single tier only', ({ id, threshold, rate1 }) => {
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: threshold - 1 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo((threshold - 1) * rate1, 6);
    });

    it.each(tieredCategories)('$id: quantity 1, exactly AT the £$threshold boundary -> still single tier (inclusive)', ({ id, threshold, rate1 }) => {
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: threshold });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(threshold * rate1, 6);
    });

    it.each(tieredCategories)('$id: quantity 1, immediately above the £$threshold boundary -> blended tiers', ({ id, threshold, rate1, rate2 }) => {
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: threshold + 1 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(threshold * rate1 + 1 * rate2, 6);
    });

    it.each(tieredCategories)('$id: quantity > 1, each item below its own threshold -> tiered per item, not combined', ({ id, threshold, rate1 }) => {
      const perItemPrice = threshold - 50;
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: perItemPrice, quantity: 3 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(perItemPrice * rate1 * 3, 6);
    });

    it.each(tieredCategories)('$id: quantity > 1, each item individually above its own threshold -> each item blended, then multiplied', ({ id, threshold, rate1, rate2 }) => {
      const perItemPrice = threshold + 200;
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: perItemPrice, quantity: 2 });
      const perItemFee = threshold * rate1 + 200 * rate2;
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(perItemFee * 2, 6);
    });
  });

  describe('2026-08-16 second follow-up audit: postage-included vs postage-excluded FVF basis', () => {
    it('quantity 1: postage charged is included in the per-item tier basis (unambiguous — one item, one shipment)', () => {
      const r = calculateEbay({ ...base, categoryId: 'JEWELLERY', itemPrice: 900, shippingCharged: 150, quantity: 1 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(1000 * 0.149 + 50 * 0.04, 6);
      expect(line(r, 'ebay-variable-fvf').label).not.toContain('INCOMPLETE');
      expect(r.exclusions.some((e) => e.includes('INCOMPLETE'))).toBe(false);
    });

    it('quantity > 1: postage is excluded from the per-item tier basis, and the result is explicitly labelled incomplete, not a complete exact fee', () => {
      const r = calculateEbay({ ...base, categoryId: 'JEWELLERY', itemPrice: 900, shippingCharged: 150, quantity: 2 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo(900 * 0.149 * 2, 6);
      expect(line(r, 'ebay-variable-fvf').label).toContain('INCOMPLETE');
      expect(line(r, 'ebay-variable-fvf').notes).toContain('excludes');
      expect(r.exclusions.some((e) => e.includes('INCOMPLETE') && e.includes('not a complete exact fee'))).toBe(true);
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
      // Order-level fees still use the full postage-inclusive basis.
      expect(r.regulatoryFee).toBeCloseTo((900 * 2 + 150) * 0.0035, 6);
    });

    it('quantity > 1 with NO postage charged is not flagged incomplete (nothing was actually excluded)', () => {
      const r = calculateEbay({ ...base, categoryId: 'JEWELLERY', itemPrice: 900, shippingCharged: 0, quantity: 2 });
      expect(line(r, 'ebay-variable-fvf').label).not.toContain('INCOMPLETE');
    });

    it('a FLAT category is never affected by postage inclusion/exclusion regardless of quantity', () => {
      const r = calculateEbay({ ...base, categoryId: 'EVERYTHING_ELSE', itemPrice: 500, shippingCharged: 50, quantity: 3 });
      // FLAT categories always use the combined order basis (item*qty + shipping) — no per-item exclusion applies.
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBeCloseTo((500 * 3 + 50) * 0.129, 6);
      expect(line(r, 'ebay-variable-fvf').label).not.toContain('INCOMPLETE');
    });
  });

  describe('2026-08-16 second follow-up audit: category-tied reduced 10p per-order fee (no free-standing toggle)', () => {
    const reducedFeeCategoryIds = [
      'ANTIQUES',
      'ART',
      'COINS',
      'COLLECTABLES',
      'DOLLS_BEARS',
      'POTTERY_GLASS',
      'SPORTS_MEMORABILIA',
      'STAMPS',
      'HOME_FURNITURE_DIY',
    ];

    it.each(reducedFeeCategoryIds)('%s automatically gets the reduced 10p fee for a sale ≤ £10, with no separate toggle', (id) => {
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: 8 });
      expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.1, 6);
    });

    it.each(reducedFeeCategoryIds)('%s reverts to the normal 40p fee above £10', (id) => {
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: 15 });
      expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.4, 6);
    });

    it.each(reducedFeeCategoryIds)('%s has no confirmed FVF rate -> excluded unless a manual rate is supplied', (id) => {
      const r = calculateEbay({ ...base, categoryId: id, itemPrice: 8 });
      expect(line(r, 'ebay-variable-fvf').amountExVat).toBe(0);
      expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');

      const withManual = calculateEbay({ ...base, categoryId: id, itemPrice: 8, manualCategoryRate: 0.1 });
      expect(line(withManual, 'ebay-variable-fvf').amountExVat).toBeCloseTo(0.8, 6);
      // The reduced per-order fee still applies even when a manual FVF rate is supplied — it's tied to the category, not the FVF source.
      expect(line(withManual, 'ebay-per-order').amountExVat).toBeCloseTo(0.1, 6);
    });

    const ineligibleCategoryIds = ['CLOTHES_SHOES_ACCESSORIES', 'WOMENS_BAGS_HANDBAGS', 'JEWELLERY', 'WATCHES_PARTS_ACCESSORIES', 'MOBILE_PHONES', 'SMARTPHONES', 'BUSINESS_OFFICE_INDUSTRIAL', 'EVERYTHING_ELSE'];

    it.each(ineligibleCategoryIds)('%s can NEVER receive the reduced 10p fee, at any sale price', (id) => {
      const low = calculateEbay({ ...base, categoryId: id, itemPrice: 5 });
      expect(line(low, 'ebay-per-order').amountExVat).toBeCloseTo(0.3, 6);
      const atThreshold = calculateEbay({ ...base, categoryId: id, itemPrice: 10 });
      expect(line(atThreshold, 'ebay-per-order').amountExVat).toBeCloseTo(0.3, 6);
    });

    it('there is no input field on EbayInput that lets a caller assert reduced-fee eligibility independently of category', () => {
      // Structural guard: this will fail to compile (not just fail at runtime) if such a field is ever re-added,
      // because EbayInput would then have an extra key not covered by this exhaustive object.
      const allowedKeys: Record<keyof EbayInput, true> = {
        itemPrice: true,
        itemCost: true,
        shippingCharged: true,
        shippingCost: true,
        quantity: true,
        categoryId: true,
        manualCategoryRate: true,
        region: true,
        currencyConversionSelected: true,
        topRatedPremiumService: true,
        vatProfile: true,
      };
      expect(Object.keys(allowedKeys)).not.toContain('qualifiesForReducedPerOrderFee');
    });
  });

  describe('2026-08-16 second follow-up audit: total reconciliation including VAT', () => {
    it('a reduced-fee category with a manual FVF rate reconciles exactly across cash/economic totals', () => {
      const r = calculateEbay({
        ...base,
        categoryId: 'COLLECTABLES',
        manualCategoryRate: 0.129,
        itemPrice: 8,
        shippingCharged: 1,
        quantity: 1,
        currencyConversionSelected: true,
        vatProfile: 'REGISTERED',
      });
      const exVatSum = r.feeLines.reduce((acc, l) => acc + l.amountExVat, 0);
      const vatSum = r.feeLines.reduce((acc, l) => acc + (l.vatAmount ?? 0), 0);
      expect(exVatSum + vatSum).toBeCloseTo(r.totalCashFees, 6);
      expect(r.totalCashFees - r.potentiallyReclaimableVat).toBeCloseTo(r.estimatedEconomicFees, 6);
      // The per-order fee for this £9 sale should be the reduced 10p, not 30p.
      expect(line(r, 'ebay-per-order').amountExVat).toBeCloseTo(0.1, 6);
    });
  });

  describe('2026-08-16 second follow-up audit: every enabled category is fully described and traceable', () => {
    it('every category has a verified source, a formula (when schedule is present), and consistent basis semantics', () => {
      for (const cat of EBAY_CATEGORIES) {
        expect(cat.source, `${cat.id} is missing a source`).toBeTruthy();
        expect(cat.source.url, `${cat.id} source is missing a URL`).toBeTruthy();
        expect(
          ['SPEC_VERIFIED', 'AUDIT_VERIFIED', 'AUTOMATED_UNVERIFIED'].includes(cat.source.verificationStatus),
          `${cat.id} has an unexpected verificationStatus`
        ).toBe(true);

        if (cat.schedule) {
          expect(cat.source.formula, `${cat.id} has a schedule but no formula description`).toBeTruthy();
          // A schedule with a confirmed rate should never be tagged AUTOMATED_UNVERIFIED for eBay — only SPEC/AUDIT verified.
          expect(['SPEC_VERIFIED', 'AUDIT_VERIFIED']).toContain(cat.source.verificationStatus);
          if (cat.schedule.kind !== 'FLAT') {
            expect(['PER_ITEM', 'PER_ORDER', undefined]).toContain(cat.tierBasis);
          }
        } else {
          // No confirmed FVF — must require manual entry, and ideally still carry SOME confirmed fact (an ID or a reduced fee).
          expect(cat.officialCategoryId !== undefined || cat.reducedPerOrderFee !== undefined, `${cat.id} has no schedule and no other confirmed fact — should it exist at all?`).toBe(true);
        }

        if (cat.reducedPerOrderFee) {
          expect(cat.reducedPerOrderFee.source, `${cat.id} reducedPerOrderFee is missing a source`).toBeTruthy();
          expect(cat.reducedPerOrderFee.fee).toBeGreaterThan(0);
          expect(cat.reducedPerOrderFee.atOrBelowThreshold).toBeGreaterThan(0);
        }
      }
    });

    it('no category silently duplicates another\'s official category ID', () => {
      const ids = EBAY_CATEGORIES.map((c) => c.officialCategoryId).filter((id): id is string => id !== undefined);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
