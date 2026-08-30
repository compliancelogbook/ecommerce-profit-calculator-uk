import Link from 'next/link';

const NAV_LINKS = [
  { href: '/shopify-fee-calculator', label: 'Shopify' },
  { href: '/etsy-fee-calculator', label: 'Etsy' },
  { href: '/ebay-fee-calculator', label: 'eBay' },
  { href: '/amazon-fee-calculator', label: 'Amazon' },
  { href: '/methodology', label: 'Methodology' },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222] bg-black/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 md:px-8">
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          EasyFeezy
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888] md:gap-x-6 md:text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#eaeaea] transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
