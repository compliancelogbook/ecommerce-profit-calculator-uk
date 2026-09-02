// Single source of truth mapping each supported marketplace platform to its
// dedicated route and display labels. Shared by:
//  - CalculatorShell's tab switcher (real <Link>s, with aria-current, when
//    rendered on a dedicated route — see the `routeLocked` prop);
//  - MarketplaceCalculatorLinks (src/components/site/), the one place the
//    "Shopify Fee Calculator" / "Etsy Fee Calculator" / ... link list is
//    defined, rendered on `/` and every dedicated calculator route so the
//    markup is never duplicated per page.
//
// `Platform` lives here (not in CalculatorShell.tsx) precisely so this
// registry and CalculatorShell can share one type without either importing
// the other's component code.

export type Platform = 'SHOPIFY' | 'ETSY' | 'EBAY' | 'AMAZON' | 'TIKTOK' | 'VINTED';

export interface PlatformRoute {
  platform: Platform;
  /** Short label for the calculator tab switcher, e.g. "TikTok Shop". */
  tabLabel: string;
  /** The platform's dedicated, statically-generated calculator route. */
  path: string;
  /** Longer label for the "Marketplace calculators" link list, e.g. "TikTok Shop Fee Calculator". */
  navLabel: string;
}

// Order here is the order tabs/links render in, everywhere.
export const PLATFORM_LIST: Platform[] = ['SHOPIFY', 'ETSY', 'EBAY', 'AMAZON', 'TIKTOK', 'VINTED'];

export const PLATFORM_ROUTES: Record<Platform, PlatformRoute> = {
  SHOPIFY: { platform: 'SHOPIFY', tabLabel: 'Shopify', path: '/shopify-fee-calculator', navLabel: 'Shopify Fee Calculator' },
  ETSY: { platform: 'ETSY', tabLabel: 'Etsy', path: '/etsy-fee-calculator', navLabel: 'Etsy Fee Calculator' },
  EBAY: { platform: 'EBAY', tabLabel: 'eBay', path: '/ebay-fee-calculator', navLabel: 'eBay Fee Calculator' },
  AMAZON: { platform: 'AMAZON', tabLabel: 'Amazon', path: '/amazon-fee-calculator', navLabel: 'Amazon Fee Calculator' },
  TIKTOK: { platform: 'TIKTOK', tabLabel: 'TikTok Shop', path: '/tiktok-shop-fee-calculator', navLabel: 'TikTok Shop Fee Calculator' },
  VINTED: { platform: 'VINTED', tabLabel: 'Vinted', path: '/vinted-fee-calculator', navLabel: 'Vinted Fee Calculator' },
};

/** The Platform whose dedicated route exactly matches `pathname`, or null (e.g. on `/`, which isn't dedicated to one platform). */
export function platformForPath(pathname: string): Platform | null {
  const entry = PLATFORM_LIST.find((p) => PLATFORM_ROUTES[p].path === pathname);
  return entry ?? null;
}

/**
 * The pure decision behind which platform CalculatorShell actually
 * displays. On a dedicated route (`routeLocked`), the URL itself — read via
 * `pathname`, which in the real component comes from Next's `usePathname()`
 * — is the single source of truth, never a prop snapshot or local state
 * that a page-level re-render could fail to keep in sync. This is what
 * makes it structurally impossible for the calculator to show a platform
 * the address bar disagrees with: even if `defaultPlatform` is stale (e.g.
 * still "ETSY" from how this component instance was first mounted) while
 * the browser has already navigated to /ebay-fee-calculator, the pathname
 * wins. `defaultPlatform` is used only as a fallback for the moment the
 * pathname doesn't resolve to a known platform route at all. On the
 * homepage (`!routeLocked`), the URL is ignored entirely — switching is
 * local-state-only there, by design, so free comparison never touches the
 * address bar.
 */
export function resolveDisplayedPlatform(params: {
  routeLocked: boolean;
  pathname: string | null;
  defaultPlatform: Platform;
  localPlatform: Platform;
}): Platform {
  if (!params.routeLocked) return params.localPlatform;
  const routePlatform = params.pathname ? platformForPath(params.pathname) : null;
  return routePlatform ?? params.defaultPlatform;
}

export interface TabDescriptor {
  platform: Platform;
  label: string;
  isActive: boolean;
  /**
   * The route to navigate to when routeLocked, or null when not — CalculatorShell
   * renders a real <Link href> for a non-null value and a local-state-setting
   * <button> for null. Kept as plain data (not JSX) so the decision itself is
   * unit-testable without rendering anything.
   */
  href: string | null;
  ariaCurrent: 'page' | undefined;
}

/**
 * The pure decision behind CalculatorShell's tab switcher: on a dedicated
 * route (`routeLocked`), every tab gets a real href to its own platform's
 * page and the active one gets aria-current="page" — clicking ANY tab is
 * therefore always genuine navigation, never a local state change, which is
 * what makes it impossible for a dedicated route's static content (title,
 * H1, intro, "What's included") to end up paired with a different
 * platform's calculator underneath it. On the homepage (`!routeLocked`),
 * every href is null — switching stays local state only, by construction.
 */
export function buildTabDescriptors(activePlatform: Platform, routeLocked: boolean): TabDescriptor[] {
  return PLATFORM_LIST.map((p) => {
    const isActive = p === activePlatform;
    return {
      platform: p,
      label: PLATFORM_ROUTES[p].tabLabel,
      isActive,
      href: routeLocked ? PLATFORM_ROUTES[p].path : null,
      ariaCurrent: isActive ? 'page' : undefined,
    };
  });
}
