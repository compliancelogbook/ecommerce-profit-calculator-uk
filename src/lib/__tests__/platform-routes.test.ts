import { describe, expect, it } from 'vitest';
import {
  buildTabDescriptors,
  PLATFORM_LIST,
  PLATFORM_ROUTES,
  platformForPath,
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
