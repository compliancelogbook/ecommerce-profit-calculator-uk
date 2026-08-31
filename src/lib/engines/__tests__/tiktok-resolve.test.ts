import { describe, expect, it } from 'vitest';
import { resolveTikTok, type TikTokRawPanelInput, type TikTokResolveSharedInput } from '../tiktok-resolve';
import { UNSUPPORTED_CATEGORY_ID } from '../../../data/types';

// This is exactly the composition CalculatorShell.tsx calls for the TikTok
// platform — testing it directly here is what covers the UI-level "does an
// invalid enabled rate silently fall back to an apparently-exact result"
// class of bug, without needing a rendered component.

const sharedBase: TikTokResolveSharedInput = {
  soldPrice: 100,
  itemCost: 0,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  vatProfile: 'NOT_REGISTERED',
};

const panelBase: TikTokRawPanelInput = {
  categoryId: 'AUTOMOTIVE_MOTORCYCLE__ALL', // 9%
  manualCategoryRate: '',
  sellerDiscount: '0',
  platformDiscount: '0',
  promotionalRateEnabled: false,
  promotionalRate: '',
  affiliateCommissionRate: '',
  otherActualCosts: '0',
};

describe('resolveTikTok', () => {
  it('a fully valid panel produces a result, no blocking error', () => {
    const r = resolveTikTok(sharedBase, panelBase);
    expect(r.hasBlockingError).toBe(false);
    expect(r.result).not.toBeNull();
    expect(r.result?.platformTransactionFee).toBeCloseTo(9, 6);
  });

  describe('an enabled but invalid promotional rate blocks the entire result', () => {
    it('blank promotional rate while enabled -> no result', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, promotionalRateEnabled: true, promotionalRate: '' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
      expect(r.errors.promotionalRate).toBeTruthy();
    });

    it('malformed promotional rate while enabled -> no result', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, promotionalRateEnabled: true, promotionalRate: 'abc' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });

    it('zero promotional rate while enabled -> no result (0% is not a supported override value)', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, promotionalRateEnabled: true, promotionalRate: '0' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });

    it('negative promotional rate while enabled -> no result', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, promotionalRateEnabled: true, promotionalRate: '-5' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });

    it('above-ceiling promotional rate while enabled -> no result', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, promotionalRateEnabled: true, promotionalRate: '999' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });
  });

  describe('a supplied (nonblank) invalid affiliate rate blocks the entire result', () => {
    it('out-of-range affiliate rate -> no result, not a silently-excluded apparently-exact calculation', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, affiliateCommissionRate: '90' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
      expect(r.errors.affiliateCommissionRate).toBeTruthy();
    });

    it('below-floor affiliate rate -> no result', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, affiliateCommissionRate: '0.5' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });

    it('malformed affiliate rate -> no result', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, affiliateCommissionRate: 'xyz' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });
  });

  it('blank or exactly 0 affiliate rate continues to mean "not applicable" — never blocks', () => {
    const blank = resolveTikTok(sharedBase, { ...panelBase, affiliateCommissionRate: '' });
    const zero = resolveTikTok(sharedBase, { ...panelBase, affiliateCommissionRate: '0' });
    expect(blank.hasBlockingError).toBe(false);
    expect(blank.result).not.toBeNull();
    expect(zero.hasBlockingError).toBe(false);
    expect(zero.result).not.toBeNull();
  });

  it('disabled promotional rate uses the verified category rate', () => {
    const r = resolveTikTok(sharedBase, { ...panelBase, promotionalRateEnabled: false, promotionalRate: '' });
    expect(r.hasBlockingError).toBe(false);
    expect(r.result?.platformTransactionFee).toBeCloseTo(9, 6); // AUTOMOTIVE_MOTORCYCLE__ALL is 9%
  });

  it('a valid promotional rate REPLACES rather than stacks with the category rate', () => {
    const r = resolveTikTok(sharedBase, { ...panelBase, promotionalRateEnabled: true, promotionalRate: '3' });
    expect(r.hasBlockingError).toBe(false);
    // 3%, not 9% (category) + 3% (promo) = 12%.
    expect(r.result?.platformTransactionFee).toBeCloseTo(3, 6);
  });

  describe('discount cross-field validation', () => {
    it('combined seller + platform discount exceeding the subtotal blocks the result with a clear inline error on both fields', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, sellerDiscount: '60', platformDiscount: '60' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
      expect(r.errors.sellerDiscount).toBeTruthy();
      expect(r.errors.platformDiscount).toBeTruthy();
    });

    it('discounts exactly equal to the subtotal are valid, not blocking', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, sellerDiscount: '50', platformDiscount: '50' });
      expect(r.hasBlockingError).toBe(false);
      expect(r.result).not.toBeNull();
    });

    it('seller discount alone exceeding the subtotal blocks the result', () => {
      const r = resolveTikTok(sharedBase, { ...panelBase, sellerDiscount: '150', platformDiscount: '0' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });

    it('scales with quantity — the same combined discount is valid at a larger quantity', () => {
      const r = resolveTikTok(
        { ...sharedBase, quantity: 2 },
        { ...panelBase, sellerDiscount: '60', platformDiscount: '60' }
      );
      expect(r.hasBlockingError).toBe(false);
      expect(r.result).not.toBeNull();
    });
  });

  it('an unsupported category with no manual rate excludes the commission (soft, not blocking) — manualCategoryRate is not in the blocking set', () => {
    const r = resolveTikTok(sharedBase, { ...panelBase, categoryId: UNSUPPORTED_CATEGORY_ID });
    expect(r.hasBlockingError).toBe(false);
    expect(r.result).not.toBeNull();
    expect(r.result?.platformTransactionFee).toBe(0);
  });
});
