import Link from 'next/link';
import { PLATFORM_LIST, PLATFORM_ROUTES } from '../../lib/platform-routes';

/**
 * The one place the "Shopify Fee Calculator" / "Etsy Fee Calculator" / ...
 * link list is defined — rendered on `/` and on every dedicated calculator
 * route, immediately above the site footer, so the markup is never
 * duplicated per page (see src/lib/platform-routes.ts for the shared route
 * data this reads from).
 */
export default function MarketplaceCalculatorLinks() {
  return (
    <nav aria-label="Marketplace calculators" className="w-full mt-10 flex flex-wrap justify-center gap-3 text-sm">
      {PLATFORM_LIST.map((p) => (
        <Link
          key={p}
          href={PLATFORM_ROUTES[p].path}
          className="px-3 py-1.5 rounded-full border border-[#333] text-[#888] hover:text-[#eaeaea] hover:border-[#666] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {PLATFORM_ROUTES[p].navLabel}
        </Link>
      ))}
    </nav>
  );
}
