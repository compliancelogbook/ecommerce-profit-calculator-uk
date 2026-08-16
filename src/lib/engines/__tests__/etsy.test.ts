import { describe, expect, it } from 'vitest';
import { calculateEtsy, type EtsyInput } from '../etsy';

const base: EtsyInput = {
  itemPrice: 30,
  itemCost: 0,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  currencyConversionSelected: false,
  offsiteAdsRate: null,
  vatIdSupplied: true,
  vatProfile: 'NOT_REGISTERED',
  usdToGbpRate: 0.75, // explicit test fixture per the brief: US$1 = £0.75
};

function line(r: ReturnType<typeof calculateEtsy>, id: string) {
  return r.feeLines.find((f) => f.id === id)!;
}

describe('Etsy acceptance tests', () => {
  it('E01: £30 item, no postage, no conversion, no ad -> raw fees reconcile to £3.644', () => {
    const r = calculateEtsy(base);
    expect(line(r, 'etsy-transaction').amountExVat).toBeCloseTo(1.95, 6);
    expect(line(r, 'etsy-payments').amountExVat).toBeCloseTo(1.4, 6);
    expect(line(r, 'etsy-regulatory').amountExVat).toBeCloseTo(0.144, 6);
    expect(line(r, 'etsy-listing').amountExVat).toBeCloseTo(0.15, 6);
    const rawTotal =
      line(r, 'etsy-transaction').amountExVat +
      line(r, 'etsy-payments').amountExVat +
      line(r, 'etsy-regulatory').amountExVat +
      line(r, 'etsy-listing').amountExVat;
    expect(rawTotal).toBeCloseTo(3.644, 6);
  });

  it('E02: £30 item + £5 charged postage -> percentage fee bases include postage (basis £35)', () => {
    const r = calculateEtsy({ ...base, shippingCharged: 5 });
    expect(line(r, 'etsy-transaction').amountExVat).toBeCloseTo(35 * 0.065, 6);
    expect(line(r, 'etsy-payments').amountExVat).toBeCloseTo(35 * 0.04 + 0.2, 6);
    expect(line(r, 'etsy-regulatory').amountExVat).toBeCloseTo(35 * 0.0048, 6);
    // Listing fee is flat, unaffected by postage.
    expect(line(r, 'etsy-listing').amountExVat).toBeCloseTo(0.15, 6);
  });

  it('E03: £100 relevant basis + currency conversion selected -> £2.50', () => {
    const r = calculateEtsy({ ...base, itemPrice: 100, currencyConversionSelected: true });
    expect(r.currencyConversionFee).toBeCloseTo(2.5, 6);
  });

  it('E04: Offsite Ad 15% applies to the correct basis', () => {
    const r = calculateEtsy({ ...base, itemPrice: 100, offsiteAdsRate: 0.15 });
    expect(r.advertisingFee).toBeCloseTo(15.0, 6);
  });

  it('E05: Offsite Ad 12% respects the US$100/order cap', () => {
    const uncapped = calculateEtsy({ ...base, itemPrice: 300, offsiteAdsRate: 0.12 });
    expect(uncapped.advertisingFee).toBeCloseTo(36.0, 6); // below cap, uncapped

    const capped = calculateEtsy({ ...base, itemPrice: 700, offsiteAdsRate: 0.12 });
    // Uncapped would be 700 * 0.12 = £84; cap is $100 * 0.75 = £75.
    expect(capped.advertisingFee).toBeCloseTo(75.0, 6);
    expect(capped.assumptions.some((a) => a.includes('capped'))).toBe(true);
  });

  it('VAT is applied only to fee types confirmed as VAT-eligible, and reported unconfirmed for the rest', () => {
    const noVatId = calculateEtsy({ ...base, vatIdSupplied: false, itemPrice: 100, offsiteAdsRate: 0.15 });
    const transactionLine = line(noVatId, 'etsy-transaction');
    expect(transactionLine.vatUnconfirmed).toBeFalsy();
    expect(transactionLine.vatAmount).toBeCloseTo(transactionLine.amountExVat * 0.2, 6);

    const regulatoryLine = line(noVatId, 'etsy-regulatory');
    expect(regulatoryLine.vatUnconfirmed).toBe(true);
    expect(regulatoryLine.vatAmount).toBeUndefined();

    const adsLine = line(noVatId, 'etsy-offsite-ads');
    expect(adsLine.vatUnconfirmed).toBe(true);

    expect(noVatId.exclusions.some((e) => e.includes('not independently confirmed'))).toBe(true);
  });
});
