import type { Metadata } from 'next';
import CalculatorShell from '../../components/calculator/CalculatorShell';
import MarketplaceCalculatorLinks from '../../components/site/MarketplaceCalculatorLinks';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/tiktok-shop-fee-calculator',
  title: 'TikTok Shop UK Fee Calculator',
  description:
    'Calculate TikTok Shop UK platform commission by category (5%/9%, inclusive of VAT), seller and platform discounts, customer-paid shipping, and optional affiliate commission.',
});

export default function TikTokShopFeeCalculatorPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col items-center">
        <header className="mb-12 text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-tight">TikTok Shop UK Fee Calculator</h1>
          <p className="text-[#888] text-base leading-relaxed">
            Category-specific platform commission (5% or 9%, inclusive of VAT), TikTok&apos;s published seller/platform discount and
            customer-paid shipping formula, and optional affiliate commission.
          </p>
        </header>
        <CalculatorShell defaultPlatform="TIKTOK" routeLocked />
        <section className="w-full mt-12 text-sm text-[#888] leading-relaxed space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">What&apos;s included</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>The complete published TikTok Shop UK commission schedule — 343 category/subcategory rules, every one confirmed.</li>
            <li>Category and, where TikTok&apos;s own schedule breaks a category into subcategories, hierarchical subcategory selection.</li>
            <li>TikTok&apos;s published commission formula: seller-funded discounts reduce the commission basis; TikTok-funded (platform) discounts do not; customer-paid shipping is included in the basis.</li>
            <li>An optional seller-specific promotional rate (manual override — never stacked with the category rate) and an optional, user-entered affiliate/creator commission rate, kept entirely separate from the platform commission.</li>
            <li>Commission is shown inclusive of VAT, matching TikTok&apos;s published rate — no separate 20% UK VAT is added on top of it.</li>
          </ul>
          <p>
            Sourced from the official TikTok Shop UK commission-category workbook (downloaded from TikTok Seller Academy, SHA-256
            verified and mechanically extracted — see <a href="/methodology" className="underline hover:text-[#eaeaea]">methodology</a> for
            the full verification record and sourcing).
          </p>
        </section>
        <MarketplaceCalculatorLinks />
      </div>
    </div>
  );
}
