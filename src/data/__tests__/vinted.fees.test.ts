import { describe, expect, it } from 'vitest';
import {
  HMRC_VAT_MARGIN_SCHEME_SOURCE,
  VINTED_BUYER_PROTECTION_DETAILED_SOURCE,
  VINTED_BUYER_PROTECTION_MARKETING_SOURCE,
  VINTED_BUYER_PROTECTION_RANGE,
  VINTED_MANDATORY_SELLER_FEE,
  VINTED_PRICELIST_SOURCE,
  VINTED_PRO_GUIDE_SOURCE,
  VINTED_ZERO_SELLING_FEE_SOURCE,
} from '../vinted.fees';

const OFFICIAL_VINTED_SOURCES = [
  VINTED_ZERO_SELLING_FEE_SOURCE,
  VINTED_BUYER_PROTECTION_MARKETING_SOURCE,
  VINTED_BUYER_PROTECTION_DETAILED_SOURCE,
  VINTED_PRICELIST_SOURCE,
  VINTED_PRO_GUIDE_SOURCE,
];

describe('Vinted UK source integrity', () => {
  it('every official Vinted source is a real vinted.co.uk URL, verified on 2026-09-02', () => {
    for (const s of OFFICIAL_VINTED_SOURCES) {
      expect(s.url).toMatch(/^https:\/\/www\.vinted\.co\.uk\//);
      expect(s.verifiedAt).toBe('2026-09-02');
      expect(s.verificationStatus).toBe('AUDIT_VERIFIED');
    }
  });

  it('the four mandated official URLs are present exactly', () => {
    const urls = new Set(OFFICIAL_VINTED_SOURCES.map((s) => s.url));
    expect(urls.has('https://www.vinted.co.uk/how_it_works')).toBe(true);
    expect(urls.has('https://www.vinted.co.uk/help/342-buyer-protection-fee-on-vinted')).toBe(true);
    expect(urls.has('https://www.vinted.co.uk/pricelist')).toBe(true);
    expect(urls.has('https://www.vinted.co.uk/pro-guide')).toBe(true);
  });

  it('the mandatory seller fee is £0, matching the "zero selling fees" source', () => {
    expect(VINTED_MANDATORY_SELLER_FEE).toBe(0);
    expect(VINTED_ZERO_SELLING_FEE_SOURCE.formula).toMatch(/£0/);
  });

  it('the detailed Buyer Protection source describes a VARIABLE fee, not a fixed one', () => {
    expect(VINTED_BUYER_PROTECTION_DETAILED_SOURCE.formula).toMatch(/variable/i);
    expect(VINTED_BUYER_PROTECTION_DETAILED_SOURCE.formula).toMatch(/3%-8%|3% to 8%/);
  });

  it('the marketing-page Buyer Protection source is retained but explicitly marked as unused for calculation', () => {
    expect(VINTED_BUYER_PROTECTION_MARKETING_SOURCE.formula).toMatch(/5%/);
    expect(VINTED_BUYER_PROTECTION_MARKETING_SOURCE.notes).toMatch(/does NOT hard-code|not used to calculate/i);
  });

  it('the Buyer Protection fee is documented as VAT-inclusive and paid by the buyer', () => {
    expect(VINTED_BUYER_PROTECTION_DETAILED_SOURCE.formula).toMatch(/VAT-inclusive/i);
    expect(VINTED_BUYER_PROTECTION_DETAILED_SOURCE.formula).toMatch(/buyer/i);
  });

  it('Bump/Showcase is documented as an optional, seller-paid service with no fixed universal price', () => {
    expect(VINTED_PRICELIST_SOURCE.formula).toMatch(/optional/i);
    expect(VINTED_PRICELIST_SOURCE.formula).toMatch(/no universal fixed price/i);
  });

  it('the Pro guide source confirms Pro registration, free listing, and VAT-inclusive pricing', () => {
    expect(VINTED_PRO_GUIDE_SOURCE.formula).toMatch(/Pro registration required/i);
    expect(VINTED_PRO_GUIDE_SOURCE.formula).toMatch(/VAT/i);
  });

  it('the HMRC VAT margin scheme source is statutory, not a Vinted-published figure', () => {
    expect(HMRC_VAT_MARGIN_SCHEME_SOURCE.verificationStatus).toBe('STATUTORY');
    expect(HMRC_VAT_MARGIN_SCHEME_SOURCE.url).toMatch(/^https:\/\/www\.gov\.uk\//);
  });

  it('cites GOV.UK\'s current live VAT margin schemes page, not the withdrawn VAT Notice 718 URL', () => {
    expect(HMRC_VAT_MARGIN_SCHEME_SOURCE.url).toBe('https://www.gov.uk/vat-margin-schemes');
    expect(HMRC_VAT_MARGIN_SCHEME_SOURCE.url).not.toMatch(/margin-and-global-accounting-scheme-vat-notice-718/);
    expect(HMRC_VAT_MARGIN_SCHEME_SOURCE.notes).not.toMatch(/VAT Notice 718/);
  });

  it('was independently re-verified (not left with a null date) when the source was corrected', () => {
    expect(HMRC_VAT_MARGIN_SCHEME_SOURCE.verifiedAt).toBe('2026-09-02');
  });

  it('the permitted indicative Buyer Protection range matches the published 3%-8% + £0.30-£0.80 band exactly', () => {
    expect(VINTED_BUYER_PROTECTION_RANGE.lowPct).toBe(0.03);
    expect(VINTED_BUYER_PROTECTION_RANGE.lowFixed).toBe(0.3);
    expect(VINTED_BUYER_PROTECTION_RANGE.highPct).toBe(0.08);
    expect(VINTED_BUYER_PROTECTION_RANGE.highFixed).toBe(0.8);
    // Never the marketing page's 5%/£0.70 point figure.
    expect(VINTED_BUYER_PROTECTION_RANGE).not.toHaveProperty('pct', 0.05);
  });
});
