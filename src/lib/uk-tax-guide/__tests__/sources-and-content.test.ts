import { describe, expect, it } from 'vitest';
import { UK_TAX_GUIDE_SOURCE_LIST, UK_TAX_GUIDE_SOURCES } from '../sources';
import { EDUCATIONAL_DISCLAIMER, MARKETPLACE_REPORTING_EXPLANATION, PRIVACY_STATEMENT } from '../content';

const EXPECTED_URLS = [
  'https://www.gov.uk/guidance/check-if-you-need-to-tell-hmrc-about-your-income-from-online-platforms',
  'https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income',
  'https://www.gov.uk/capital-gains-tax-personal-possessions',
  'https://taxhelpforhustles.campaign.gov.uk/buying-or-making-things-to-sell-and-online-selling-tax-rules/',
  'https://www.gov.uk/government/news/no-tax-changes-for-online-sellers',
];

describe('UK tax guide sources', () => {
  it('contains exactly the 5 required official sources, no more, no fewer', () => {
    expect(UK_TAX_GUIDE_SOURCE_LIST).toHaveLength(5);
    const urls = UK_TAX_GUIDE_SOURCE_LIST.map((s) => s.url).sort();
    expect(urls).toEqual([...EXPECTED_URLS].sort());
  });

  it('every source is an official gov.uk or campaign.gov.uk URL — no blogs or marketing pages', () => {
    for (const source of UK_TAX_GUIDE_SOURCE_LIST) {
      expect(source.url).toMatch(/^https:\/\/(www\.gov\.uk|taxhelpforhustles\.campaign\.gov\.uk)\//);
    }
  });

  it('every source carries complete metadata: title, publisher, dateVerified and a claim', () => {
    for (const source of UK_TAX_GUIDE_SOURCE_LIST) {
      expect(source.title.length).toBeGreaterThan(0);
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.claim.length).toBeGreaterThan(0);
      expect(source.dateVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('every source has a stable, unique id', () => {
    const ids = UK_TAX_GUIDE_SOURCE_LIST.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the platform income checker, trading allowance, CGT personal possessions, tax help for hustles and no-tax-changes announcement are all present', () => {
    expect(UK_TAX_GUIDE_SOURCES.PLATFORM_INCOME_CHECKER.url).toBe(EXPECTED_URLS[0]);
    expect(UK_TAX_GUIDE_SOURCES.TRADING_ALLOWANCE.url).toBe(EXPECTED_URLS[1]);
    expect(UK_TAX_GUIDE_SOURCES.CGT_PERSONAL_POSSESSIONS.url).toBe(EXPECTED_URLS[2]);
    expect(UK_TAX_GUIDE_SOURCES.TAX_HELP_FOR_HUSTLES.url).toBe(EXPECTED_URLS[3]);
    expect(UK_TAX_GUIDE_SOURCES.NO_TAX_CHANGES_ANNOUNCEMENT.url).toBe(EXPECTED_URLS[4]);
  });
});

describe('UK tax guide static content', () => {
  it('the disclaimer explicitly states this is general educational guidance, not personal tax advice', () => {
    expect(EDUCATIONAL_DISCLAIMER).toMatch(/general educational guidance/i);
    expect(EDUCATIONAL_DISCLAIMER).toMatch(/not personal tax advice/i);
  });

  it('the privacy statement confirms answers are not sent to HMRC and do not need to be stored', () => {
    expect(PRIVACY_STATEMENT).toMatch(/does not send your answers to hmrc/i);
    expect(PRIVACY_STATEMENT).toMatch(/does not need to store/i);
  });

  it('marketplace reporting explanation never presents the reporting threshold as a new tax threshold', () => {
    const text = MARKETPLACE_REPORTING_EXPLANATION.points.join(' ');
    expect(text).toMatch(/reporting requirement/i);
    expect(text).toMatch(/not a new tax/i);
    // The reporting threshold is explicitly negated as an allowance, never asserted as one.
    expect(text).toMatch(/it is not a new tax-free allowance/i);
    expect(text).toMatch(/does not automatically mean you owe tax/i);
  });

  it('marketplace reporting explanation avoids hardcoding a sterling conversion of the €2,000 threshold', () => {
    const text = MARKETPLACE_REPORTING_EXPLANATION.points.join(' ');
    // The euro figure and item count may be mentioned descriptively, but no £-figure conversion of it should appear.
    expect(text).toMatch(/€2,000/);
    expect(text).not.toMatch(/£1,7\d\d/); // no hardcoded ~£1,700 GBP conversion
  });

  it('marketplace reporting explanation cites its sources', () => {
    expect(MARKETPLACE_REPORTING_EXPLANATION.sourceIds).toContain('no-tax-changes-announcement');
    expect(MARKETPLACE_REPORTING_EXPLANATION.sourceIds).toContain('platform-income-checker');
  });
});
