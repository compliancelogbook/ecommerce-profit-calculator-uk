import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import Home, { metadata as homeMetadata } from '../page';
import ShopifyFeeCalculatorPage, { metadata as shopifyMetadata } from '../shopify-fee-calculator/page';
import EtsyFeeCalculatorPage, { metadata as etsyMetadata } from '../etsy-fee-calculator/page';
import EbayFeeCalculatorPage, { metadata as ebayMetadata } from '../ebay-fee-calculator/page';
import AmazonFeeCalculatorPage, { metadata as amazonMetadata } from '../amazon-fee-calculator/page';
import TikTokShopFeeCalculatorPage, { metadata as tiktokMetadata } from '../tiktok-shop-fee-calculator/page';
import VintedFeeCalculatorPage, { metadata as vintedMetadata } from '../vinted-fee-calculator/page';
import CalculatorShell from '../../components/calculator/CalculatorShell';
import MarketplaceCalculatorLinks from '../../components/site/MarketplaceCalculatorLinks';
import { PLATFORM_ROUTES, type Platform } from '../../lib/platform-routes';
import { findAll, findFirst, textContentOf } from './react-tree-helpers';

// Regression coverage for the /vinted-fee-calculator -> "select Shopify" bug:
// the calculator's platform state changed while the route's own URL, title,
// canonical, H1, intro and "What's included" stayed on Vinted. Every test
// below inspects the actual element tree each page.tsx returns (no
// rendering — see react-tree-helpers.ts) rather than re-describing the fix
// in prose, so a regression in the real component tree fails these tests.

interface DedicatedPage {
  platform: Platform;
  Page: () => ReactElement;
  metadata: typeof shopifyMetadata;
  expectedH1: string;
  /** Brand fragment the title is expected to name — title and H1 use legitimately different marketing copy, so this checks the real invariant (same platform) rather than exact string equality. */
  brandFragment: string;
}

const DEDICATED_PAGES: DedicatedPage[] = [
  { platform: 'SHOPIFY', Page: ShopifyFeeCalculatorPage, metadata: shopifyMetadata, expectedH1: 'Shopify UK Fee Calculator', brandFragment: 'Shopify' },
  { platform: 'ETSY', Page: EtsyFeeCalculatorPage, metadata: etsyMetadata, expectedH1: 'Etsy UK Fee Calculator', brandFragment: 'Etsy' },
  { platform: 'EBAY', Page: EbayFeeCalculatorPage, metadata: ebayMetadata, expectedH1: 'eBay UK Business Fee Calculator', brandFragment: 'eBay' },
  { platform: 'AMAZON', Page: AmazonFeeCalculatorPage, metadata: amazonMetadata, expectedH1: 'Amazon UK FBM Fee Calculator', brandFragment: 'Amazon' },
  { platform: 'TIKTOK', Page: TikTokShopFeeCalculatorPage, metadata: tiktokMetadata, expectedH1: 'TikTok Shop UK Fee Calculator', brandFragment: 'TikTok' },
  { platform: 'VINTED', Page: VintedFeeCalculatorPage, metadata: vintedMetadata, expectedH1: 'Vinted UK Fee Calculator', brandFragment: 'Vinted' },
];

describe('Homepage (/) — local-state switching only', () => {
  const tree = Home();

  it('renders CalculatorShell WITHOUT routeLocked — switching platform must stay local state, never navigate', () => {
    const shells = findAll(tree, CalculatorShell);
    expect(shells).toHaveLength(1);
    expect(shells[0].props.routeLocked).toBeFalsy();
  });

  it('renders the shared MarketplaceCalculatorLinks nav', () => {
    expect(findFirst(tree, MarketplaceCalculatorLinks)).toBeDefined();
  });

  it('H1 is the fixed homepage headline, independent of any platform selection', () => {
    const h1 = findFirst(tree, 'h1');
    expect(textContentOf(h1)).toBe('Marketplace fees made easy.');
  });

  it('canonical is / — switching the local calculator selection can never change the homepage URL', () => {
    expect(homeMetadata.alternates?.canonical).toBe('/');
  });
});

describe.each(DEDICATED_PAGES)('$platform dedicated route', ({ platform, Page, metadata, expectedH1, brandFragment }) => {
  const tree = Page();
  const route = PLATFORM_ROUTES[platform];

  it('renders CalculatorShell with routeLocked AND defaultPlatform matching this route\'s own platform — the core "no drift" invariant', () => {
    const shells = findAll(tree, CalculatorShell);
    expect(shells).toHaveLength(1);
    expect(shells[0].props.routeLocked).toBeTruthy();
    expect(shells[0].props.defaultPlatform).toBe(platform);
  });

  it('renders the shared MarketplaceCalculatorLinks nav', () => {
    expect(findFirst(tree, MarketplaceCalculatorLinks)).toBeDefined();
  });

  it('H1 names this route\'s own platform', () => {
    const h1 = findFirst(tree, 'h1');
    expect(textContentOf(h1)).toBe(expectedH1);
  });

  it('metadata canonical matches this platform\'s own dedicated route', () => {
    expect(metadata.alternates?.canonical).toBe(route.path);
  });

  it('metadata title names the same platform as the H1 (title/H1 copy may legitimately differ in wording, never in platform)', () => {
    expect(metadata.title).toContain(brandFragment);
    expect(expectedH1).toContain(brandFragment);
  });
});

describe('cross-route uniqueness', () => {
  it('every dedicated page uses a distinct canonical path, matching PLATFORM_ROUTES exactly', () => {
    const canonicals = DEDICATED_PAGES.map((p) => p.metadata.alternates?.canonical);
    expect(new Set(canonicals).size).toBe(DEDICATED_PAGES.length);
    for (const p of DEDICATED_PAGES) {
      expect(p.metadata.alternates?.canonical).toBe(PLATFORM_ROUTES[p.platform].path);
    }
  });

  it('every dedicated page uses a distinct H1, and no dedicated page reuses another platform\'s H1', () => {
    const h1s = DEDICATED_PAGES.map((p) => p.expectedH1);
    expect(new Set(h1s).size).toBe(DEDICATED_PAGES.length);
  });

  it('MarketplaceCalculatorLinks appears on the homepage and all six dedicated routes — seven pages total', () => {
    const pages = [Home, ...DEDICATED_PAGES.map((p) => p.Page)];
    expect(pages).toHaveLength(7);
    for (const PageFn of pages) {
      expect(findFirst(PageFn(), MarketplaceCalculatorLinks)).toBeDefined();
    }
  });
});
