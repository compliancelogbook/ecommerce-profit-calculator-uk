import Link from 'next/link';

const NAV_LINKS = [
  { href: '/shopify-fee-calculator', label: 'Shopify' },
  { href: '/etsy-fee-calculator', label: 'Etsy' },
  { href: '/ebay-fee-calculator', label: 'eBay' },
  { href: '/amazon-fee-calculator', label: 'Amazon' },
  { href: '/tiktok-shop-fee-calculator', label: 'TikTok Shop' },
  { href: '/methodology', label: 'Methodology' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222] bg-black/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 md:px-8">
        <Link href="/" className={`text-sm font-semibold tracking-tight text-white ${FOCUS_RING}`}>
          EasyFeezy
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888] md:gap-x-6 md:text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`hover:text-[#eaeaea] transition-colors ${FOCUS_RING}`}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
