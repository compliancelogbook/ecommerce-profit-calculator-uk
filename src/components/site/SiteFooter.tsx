import Link from 'next/link';
import { COMPANY } from '../../lib/legal/company';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-[#222] bg-black">
      {/* Purely decorative — the real, accessible "EasyFeezy" identity is the
          logo link in SiteHeader and the "EasyFeezy" text in the disclosure
          line below. aria-hidden + select-none/pointer-events-none keep this
          out of the accessible tree and off-limits to focus/selection, so a
          screen reader never announces the brand twice. Sized with clamp()
          so it scales with viewport width but never blows past a sane
          ceiling on very wide screens; the fixed-height, overflow-hidden
          wrapper is what "crops" it top/bottom/sides like the reference. */}
      <div
        aria-hidden="true"
        className="relative h-20 w-full select-none overflow-hidden pointer-events-none sm:h-28 md:h-40 lg:h-52"
      >
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-bold leading-none tracking-tighter text-[#131313]"
          style={{ fontSize: 'clamp(4.5rem, 20vw, 18rem)' }}
        >
          EasyFeezy
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 border-t border-[#222] px-4 py-8 text-sm text-[#666] md:flex-row md:items-start md:justify-between md:px-8">
        <div className="max-w-md space-y-1 text-center md:text-left">
          <p className="font-medium text-[#888]">© {new Date().getFullYear()} EasyFeezy. All rights reserved.</p>
          <p className="text-xs leading-relaxed text-[#555]">
            EasyFeezy is a trading name of Compliance Logbook Ltd, registered in England and Wales. Company number 16932013.
            Registered office: 71–75 Shelton Street, Covent Garden, London, WC2H 9JQ.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href="/privacy"
            className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            Terms
          </Link>
          <a
            href={`mailto:${COMPANY.contactEmail}`}
            className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            {COMPANY.contactEmail}
          </a>
          <Link
            href="/methodology"
            className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            Methodology
          </Link>
          <Link
            href="/uk-online-selling-tax-guide"
            className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            UK Seller Tax Guide
          </Link>
        </div>
      </div>
    </footer>
  );
}
