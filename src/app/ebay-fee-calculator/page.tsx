import type { Metadata } from 'next';
import CalculatorShell from '../../components/calculator/CalculatorShell';

export const metadata: Metadata = {
  title: 'eBay UK Business Seller Fee Calculator',
  description:
    'Calculate eBay UK Business seller Final Value Fees by category, per-order fees, the Regulatory Operating Fee, international fees and Top Rated discounts.',
};

export default function EbayFeeCalculatorPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col items-center">
        <header className="mb-12 text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-tight">eBay UK Business Fee Calculator</h1>
          <p className="text-[#888] text-base leading-relaxed">
            For UK Business Sellers only. Category-specific Final Value Fees (flat and tiered), the £0.30/£0.40 per-order fee, the 0.35%
            Regulatory Operating Fee, international fees, and the Top Rated Premium Service discount.
          </p>
        </header>
        <CalculatorShell defaultPlatform="EBAY" />
        <section className="w-full mt-12 text-sm text-[#888] leading-relaxed space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">What&apos;s included</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>A verified subset of eBay&apos;s category fee schedule, each with flat, tiered or per-order-exception rules as published.</li>
            <li>Categories outside that verified subset require a manually entered rate rather than a silent guess.</li>
            <li>All fee lines are shown ex-VAT, with 20% UK VAT and potentially-reclaimable VAT calculated separately.</li>
          </ul>
          <p>
            Rates verified against eBay&apos;s UK Store Selling Fees page on 16 August 2026 — this is not eBay&apos;s complete category
            table. See <a href="/methodology" className="underline hover:text-[#eaeaea]">methodology</a> for full sourcing and coverage
            notes.
          </p>
        </section>
      </div>
    </div>
  );
}
