import { describe, expect, it } from 'vitest';
import {
  buildTabDescriptors,
  PLATFORM_LIST,
  PLATFORM_ROUTES,
  platformForPath,
  resolveDisplayedPlatform,
  type Platform,
} from '../platform-routes';

describe('PLATFORM_ROUTES / PLATFORM_LIST', () => {
  it('has exactly the six supported platforms, no more, no fewer', () => {
    expect(PLATFORM_LIST).toEqual(['SHOPIFY', 'ETSY', 'EBAY', 'AMAZON', 'TIKTOK', 'VINTED']);
    expect(Object.keys(PLATFORM_ROUTES).sort()).toEqual([...PLATFORM_LIST].sort());
  });

  it('every route path is unique — no two platforms can ever resolve to the same dedicated route', () => {
    const paths = PLATFORM_LIST.map((p) => PLATFORM_ROUTES[p].path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('every path starts with / and ends in -fee-calculator', () => {
    for (const p of PLATFORM_LIST) {
      expect(PLATFORM_ROUTES[p].path).toMatch(/^\/[a-z-]+-fee-calculator$/);
    }
  });

  it('platformForPath round-trips every platform\'s own path back to itself', () => {
    for (const p of PLATFORM_LIST) {
      expect(platformForPath(PLATFORM_ROUTES[p].path)).toBe(p);
    }
  });

  it('platformForPath returns null for the homepage and any unrelated path', () => {
    expect(platformForPath('/')).toBeNull();
    expect(platformForPath('/methodology')).toBeNull();
    expect(platformForPath('/vinted-fee-calculato')).toBeNull(); // near-miss, not an exact match
  });
});

describe('buildTabDescriptors — the core route/state-sync decision', () => {
  it('on the homepage (routeLocked=false), every tab has href: null — switching can only ever be local state', () => {
    for (const active of PLATFORM_LIST) {
      const tabs = buildTabDescriptors(active, false);
      expect(tabs).toHaveLength(6);
      for (const tab of tabs) {
        expect(tab.href).toBeNull();
      }
    }
  });

  it('on a dedicated route (routeLocked=true), every tab has a real href — none can silently reassign state instead of navigating', () => {
    for (const active of PLATFORM_LIST) {
      const tabs = buildTabDescriptors(active, true);
      for (const tab of tabs) {
        expect(tab.href).toBe(PLATFORM_ROUTES[tab.platform].path);
      }
    }
  });

  it('exactly one tab is active and carries aria-current="page", matching the active platform, in both modes', () => {
    for (const routeLocked of [true, false]) {
      for (const active of PLATFORM_LIST) {
        const tabs = buildTabDescriptors(active, routeLocked);
        const activeTabs = tabs.filter((t) => t.isActive);
        expect(activeTabs).toHaveLength(1);
        expect(activeTabs[0].platform).toBe(active);
        expect(activeTabs[0].ariaCurrent).toBe('page');
        for (const tab of tabs) {
          if (!tab.isActive) expect(tab.ariaCurrent).toBeUndefined();
        }
      }
    }
  });

  it('a dedicated route\'s own tab points at itself — clicking the already-active tab is a no-op navigation to the same URL, not a dead link', () => {
    const active: Platform = 'VINTED';
    const tabs = buildTabDescriptors(active, true);
    const selfTab = tabs.find((t) => t.platform === active)!;
    expect(selfTab.href).toBe('/vinted-fee-calculator');
  });

  it('reproduces the reported defect\'s exact scenario and proves it is fixed: on /vinted-fee-calculator, clicking "Shopify" navigates to /shopify-fee-calculator rather than swapping local state', () => {
    const tabs = buildTabDescriptors('VINTED', true); // routeLocked=true — this is exactly what /vinted-fee-calculator now passes
    const shopifyTab = tabs.find((t) => t.platform === 'SHOPIFY')!;
    expect(shopifyTab.href).toBe('/shopify-fee-calculator'); // a real destination, not null (which would mean "just call setPlatform locally")
    // The Vinted page's own tab is still marked active until that navigation actually happens.
    const vintedTab = tabs.find((t) => t.platform === 'VINTED')!;
    expect(vintedTab.isActive).toBe(true);
    expect(vintedTab.ariaCurrent).toBe('page');
  });

  it('labels always match PLATFORM_ROUTES.tabLabel, regardless of mode', () => {
    for (const routeLocked of [true, false]) {
      const tabs = buildTabDescriptors('SHOPIFY', routeLocked);
      for (const tab of tabs) {
        expect(tab.label).toBe(PLATFORM_ROUTES[tab.platform].tabLabel);
      }
    }
  });
});

describe('resolveDisplayedPlatform — the URL is the single source of truth on a dedicated route', () => {
  it("reproduces the precise Etsy → inner eBay defect and proves it's fixed: pathname wins even when defaultPlatform is stale", () => {
    // Exactly the reported scenario: CalculatorShell was first given
    // defaultPlatform="ETSY" (how /etsy-fee-calculator renders it), but the
    // browser's actual current URL has already moved to /ebay-fee-calculator
    // — whether because a real navigation completed and this instance
    // merely wasn't remounted, or any other reason. The displayed platform
    // must follow the URL, never the stale prop.
    const displayed = resolveDisplayedPlatform({
      routeLocked: true,
      pathname: '/ebay-fee-calculator',
      defaultPlatform: 'ETSY',
      localPlatform: 'ETSY',
    });
    expect(displayed).toBe('EBAY');
  });

  it('agrees with the route for all 30 same-page and cross-page combinations, whatever defaultPlatform claims', () => {
    for (const routePlatform of PLATFORM_LIST) {
      for (const staleDefault of PLATFORM_LIST) {
        const displayed = resolveDisplayedPlatform({
          routeLocked: true,
          pathname: PLATFORM_ROUTES[routePlatform].path,
          defaultPlatform: staleDefault,
          localPlatform: staleDefault,
        });
        expect(displayed).toBe(routePlatform); // the URL always wins, regardless of staleDefault
      }
    }
  });

  it('falls back to defaultPlatform only when the pathname does not resolve to any known platform route', () => {
    expect(
      resolveDisplayedPlatform({ routeLocked: true, pathname: null, defaultPlatform: 'AMAZON', localPlatform: 'SHOPIFY' })
    ).toBe('AMAZON');
    expect(
      resolveDisplayedPlatform({ routeLocked: true, pathname: '/', defaultPlatform: 'AMAZON', localPlatform: 'SHOPIFY' })
    ).toBe('AMAZON');
  });

  it('on the homepage (routeLocked=false), the URL is ignored entirely — only local state decides, exactly preserving free comparison switching', () => {
    for (const local of PLATFORM_LIST) {
      const displayed = resolveDisplayedPlatform({
        routeLocked: false,
        pathname: '/amazon-fee-calculator', // deliberately mismatched, to prove it's ignored
        defaultPlatform: 'SHOPIFY',
        localPlatform: local,
      });
      expect(displayed).toBe(local);
    }
  });

  it('back/forward navigation is covered for free: resolveDisplayedPlatform only ever reads the CURRENT pathname, however it got there', () => {
    // popstate (back/forward) updates the same pathname a <Link> click or
    // router.push does — there is no separate code path to keep in sync.
    let displayed = resolveDisplayedPlatform({
      routeLocked: true,
      pathname: '/shopify-fee-calculator',
      defaultPlatform: 'SHOPIFY',
      localPlatform: 'SHOPIFY',
    });
    expect(displayed).toBe('SHOPIFY');
    displayed = resolveDisplayedPlatform({
      routeLocked: true,
      pathname: '/tiktok-shop-fee-calculator', // simulates a back-button navigation
      defaultPlatform: 'SHOPIFY',
      localPlatform: 'SHOPIFY',
    });
    expect(displayed).toBe('TIKTOK');
  });
});
