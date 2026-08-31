import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-[#222] bg-black">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-[#666] md:flex-row md:items-start md:justify-between md:px-8">
        <div className="max-w-md space-y-1 text-center md:text-left">
          <p className="font-medium text-[#888]">© {new Date().getFullYear()} EasyFeezy. All rights reserved.</p>
          <p className="text-xs leading-relaxed text-[#555]">
            EasyFeezy is a trading name of Compliance Logbook Ltd, registered in England and Wales. Company number 16932013.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/uk-online-selling-tax-guide"
            className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            UK Seller Tax Guide
          </Link>
          <Link
            href="/methodology"
            className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          >
            Methodology
          </Link>
        </div>
      </div>
    </footer>
  );
}
