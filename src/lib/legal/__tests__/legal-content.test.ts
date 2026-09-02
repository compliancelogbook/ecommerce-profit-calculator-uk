import { describe, expect, it } from 'vitest';
import { COMPANY } from '../company';
import { LEGAL_SOURCE_LIST } from '../sources';
import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../privacy-content';
import { TERMS_SECTIONS, TERMS_UPDATED } from '../terms-content';

function allText(sections: { heading: string; body: string[] }[]): string {
  return sections.map((s) => `${s.heading} ${s.body.join(' ')}`).join(' ');
}

describe('company details', () => {
  it('carries the verified operator, trading name, company number, registration and registered office', () => {
    expect(COMPANY.operatorName).toBe('Compliance Logbook Ltd');
    expect(COMPANY.tradingName).toBe('EasyFeezy');
    expect(COMPANY.companyNumber).toBe('16932013');
    expect(COMPANY.registeredIn).toBe('England and Wales');
    expect(COMPANY.registeredOffice).toMatch(/Shelton Street/);
    expect(COMPANY.registeredOffice).toMatch(/WC2H 9JQ/);
    expect(COMPANY.contactEmail).toBe('jade@compliancelogbook.com');
  });

  it('never carries a telephone number or a residential-looking address field', () => {
    expect(Object.keys(COMPANY)).not.toContain('phone');
    expect(Object.keys(COMPANY)).not.toContain('telephone');
    expect(Object.keys(COMPANY)).not.toContain('residentialAddress');
  });
});

describe('legal sources', () => {
  it('every source has a URL, publisher and a verification date', () => {
    for (const s of LEGAL_SOURCE_LIST) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.publisher.length).toBeGreaterThan(0);
      expect(s.dateVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('never describes a source or the pages it supports as "bulletproof" or a compliance guarantee', () => {
    for (const s of LEGAL_SOURCE_LIST) {
      expect(s.claim).not.toMatch(/bulletproof/i);
      expect(s.claim).not.toMatch(/guarantees? (legal )?compliance/i);
    }
  });
});

describe('Privacy Policy content', () => {
  const text = allText(PRIVACY_SECTIONS);

  it('has an update date in ISO format', () => {
    expect(PRIVACY_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('states calculator inputs are not submitted to EasyFeezy', () => {
    expect(text).toMatch(/not submitted to EasyFeezy/i);
  });

  it('states EasyFeezy currently sets no cookies, no local/session storage, and no analytics/advertising scripts', () => {
    expect(text).toMatch(/does not currently set any cookies/i);
    expect(text).toMatch(/local storage or session storage/i);
    expect(text).toMatch(/does not run analytics, advertising or affiliate-tracking scripts/i);
  });

  it('never makes the absolute claim that no personal data is ever processed', () => {
    expect(text).not.toMatch(/no personal data is ever processed/i);
    expect(text).not.toMatch(/we never process any personal data/i);
  });

  it('explains hosting/technical information may be processed, without inventing a specific Vercel retention period', () => {
    expect(text).toMatch(/Vercel/);
    expect(text).toMatch(/IP address/i);
    expect(text).not.toMatch(/\d+\s*(day|month|year)s?\b.*(retain|retention|delete|kept)/i);
    expect(text).not.toMatch(/retains? nothing/i);
  });

  it('lists the core UK GDPR individual rights and the right to complain to the ICO', () => {
    expect(text).toMatch(/access/i);
    expect(text).toMatch(/rectification/i);
    expect(text).toMatch(/erasure/i);
    expect(text).toMatch(/restriction/i);
    expect(text).toMatch(/portability/i);
    expect(text).toMatch(/object/i);
    expect(text).toMatch(/complain to the (information commissioner|ico)/i);
  });

  it('publishes the verified contact email, and never a phone number or residential address', () => {
    expect(text).toContain(COMPANY.contactEmail);
    expect(text).not.toMatch(/\b0\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/); // no UK-looking phone number
  });

  it('never describes itself as "bulletproof" or guaranteeing legal compliance', () => {
    expect(text).not.toMatch(/bulletproof/i);
    expect(text).not.toMatch(/guarantees? (full |complete )?(legal )?compliance/i);
  });
});

describe('Terms of Use content', () => {
  const text = allText(TERMS_SECTIONS);

  it('has an update date in ISO format', () => {
    expect(TERMS_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('identifies EasyFeezy as a trading name of Compliance Logbook Ltd', () => {
    expect(text).toMatch(/trading name of Compliance Logbook Ltd/);
  });

  it('states EasyFeezy does not provide personal legal, tax, accounting, financial or investment advice', () => {
    expect(text).toMatch(/does not provide personal legal, tax, accounting, financial or investment advice/i);
  });

  it('does not guarantee complete coverage of every fee, promotion, tax treatment or circumstance', () => {
    expect(text).toMatch(/does not guarantee that every possible fee, promotion, tax treatment, seller circumstance/i);
  });

  it('carves out liability that cannot lawfully be excluded (death/personal injury by negligence, fraud)', () => {
    expect(text).toMatch(/death or personal injury/i);
    expect(text).toMatch(/fraud/i);
    expect(text).toMatch(/cannot lawfully be excluded/i);
  });

  it('specifies England and Wales governing law and exclusive jurisdiction', () => {
    expect(text).toMatch(/governed by the law of England and Wales/i);
    expect(text).toMatch(/exclusive jurisdiction/i);
  });

  it('never mentions affiliate links, affiliate commission or advertising as though active in V1', () => {
    expect(text).not.toMatch(/affiliate/i);
    expect(text).not.toMatch(/advertis/i);
    expect(text).not.toMatch(/sponsored/i);
  });

  it('never describes itself as "bulletproof" or guaranteeing legal compliance', () => {
    expect(text).not.toMatch(/bulletproof/i);
    expect(text).not.toMatch(/guarantees? (full |complete )?(legal )?compliance/i);
  });
});
