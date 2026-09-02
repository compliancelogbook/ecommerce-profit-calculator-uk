import { describe, expect, it } from 'vitest';
import { resolveVinted, type VintedRawPanelInput, type VintedResolveSharedInput } from '../vinted-resolve';

// The same composition CalculatorShell.tsx calls for the Vinted platform —
// covers the "does an enabled-but-invalid amount silently become £0" class
// of bug without needing a rendered component.

const sharedBase: VintedResolveSharedInput = {
  soldPrice: 30,
  itemCost: 10,
  shippingReceived: 0,
  shippingCost: 0,
  quantity: 1,
};

const panelBase: VintedRawPanelInput = {
  sellerRoute: 'PRIVATE',
  visibilityServicePurchased: false,
  visibilityServiceCost: '',
};

describe('resolveVinted', () => {
  it('a fully valid panel with no visibility service produces a result, no blocking error', () => {
    const r = resolveVinted(sharedBase, panelBase);
    expect(r.hasBlockingError).toBe(false);
    expect(r.result).not.toBeNull();
    expect(r.result!.estimatedProfit).toBeCloseTo(20, 6);
  });

  describe('V05: an enabled but invalid visibility-service cost blocks the entire result', () => {
    it('blank cost while enabled -> calculation blocked', () => {
      const r = resolveVinted(sharedBase, { ...panelBase, visibilityServicePurchased: true, visibilityServiceCost: '' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
      expect(r.errors.visibilityServiceCost).toBeTruthy();
    });

    it('malformed cost while enabled -> calculation blocked', () => {
      const r = resolveVinted(sharedBase, { ...panelBase, visibilityServicePurchased: true, visibilityServiceCost: 'abc' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });

    it('negative cost while enabled -> calculation blocked', () => {
      const r = resolveVinted(sharedBase, { ...panelBase, visibilityServicePurchased: true, visibilityServiceCost: '-5' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });

    it('zero cost while enabled -> calculation blocked (never silently becomes £0)', () => {
      const r = resolveVinted(sharedBase, { ...panelBase, visibilityServicePurchased: true, visibilityServiceCost: '0' });
      expect(r.hasBlockingError).toBe(true);
      expect(r.result).toBeNull();
    });
  });

  it('a valid enabled visibility-service cost is accepted and deducted from profit', () => {
    const r = resolveVinted(sharedBase, { ...panelBase, visibilityServicePurchased: true, visibilityServiceCost: '2.40' });
    expect(r.hasBlockingError).toBe(false);
    expect(r.result!.estimatedProfit).toBeCloseTo(20 - 2.4, 6);
  });

  it('an unchecked visibility service is never validated, regardless of leftover stale text in the field', () => {
    const r = resolveVinted(sharedBase, { ...panelBase, visibilityServicePurchased: false, visibilityServiceCost: 'garbage' });
    expect(r.hasBlockingError).toBe(false);
    expect(r.result).not.toBeNull();
  });

  it('Pro seller route resolves without error and carries the VAT/margin-scheme exclusion', () => {
    const r = resolveVinted(sharedBase, { ...panelBase, sellerRoute: 'PRO' });
    expect(r.hasBlockingError).toBe(false);
    expect(r.result!.confidence).toBe('EXCLUDES_VARIABLE_FEES');
  });
});
