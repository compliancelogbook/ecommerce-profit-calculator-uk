import { describe, expect, it } from 'vitest';
import { buildOrganizationJsonLd } from '../structured-data';

describe('structured data (JSON-LD)', () => {
  it('serialises to valid, parseable JSON', () => {
    const json = JSON.stringify(buildOrganizationJsonLd());
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('contains an Organization and a WebSite node, matching the real site', () => {
    const data = buildOrganizationJsonLd();
    const types = data['@graph'].map((n: { '@type': string }) => n['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
  });

  it('uses the registered office (a business address), never a residential-looking address', () => {
    const json = JSON.stringify(buildOrganizationJsonLd());
    expect(json).toMatch(/Shelton Street/);
    expect(json).not.toMatch(/flat|apartment|residence/i);
  });

  it('never includes reviews, ratings, prices, offers or social profiles that have not been established', () => {
    const json = JSON.stringify(buildOrganizationJsonLd());
    expect(json).not.toMatch(/aggregateRating/i);
    expect(json).not.toMatch(/"review"/i);
    expect(json).not.toMatch(/"offers"/i);
    expect(json).not.toMatch(/sameAs/i);
    expect(json).not.toMatch(/"price"/i);
  });

  it('uses https://easyfeezy.com as the canonical domain throughout', () => {
    const json = JSON.stringify(buildOrganizationJsonLd());
    const urls = [...json.matchAll(/"url":"([^"]+)"/g)].map((m) => m[1]);
    for (const u of urls) {
      expect(u.startsWith('https://easyfeezy.com')).toBe(true);
    }
  });
});
