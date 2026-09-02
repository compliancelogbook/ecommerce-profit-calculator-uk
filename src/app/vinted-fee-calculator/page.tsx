import type { Metadata } from 'next';
import CalculatorShell from '../../components/calculator/CalculatorShell';
import MarketplaceCalculatorLinks from '../../components/site/MarketplaceCalculatorLinks';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/vinted-fee-calculator',
  title: 'Vinted UK Fee Calculator',
  description:
    "Vinted UK charges sellers no mandatory listing or selling fee. See your estimated profit, plus an indicative typical Buyer Protection range that's paid by the buyer — never deducted from your revenue.",
});

export default function VintedFeeCalculatorPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col items-center">
        <header className="mb-12 text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-tight">Vinted UK Fee Calculator</h1>
          <p className="text-[#888] text-base leading-relaxed">
            Vinted charges sellers £0 in mandatory listing, transaction or selling fees. See your estimated profit, with an
            indicative typical Buyer Protection range shown for context only — it&apos;s paid by the buyer, never deducted
            from what you earn.
          </p>
        </header>
        {/* key forces a full remount on route change — see amazon-fee-calculator/page.tsx for why. */}
        <CalculatorShell key="VINTED" defaultPlatform="VINTED" routeLocked />
        <section className="w-full mt-12 text-sm text-[#888] leading-relaxed space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">What&apos;s included</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Vinted&apos;s confirmed £0 mandatory seller platform fee — no listing, transaction or selling fee.</li>
            <li>
              An indicative typical Buyer Protection range (3%–8% of the item/bundle price + £0.30–£0.80), clearly labelled as
              contextual information only — never an exact fee, and never included in your fees, profit, margin or ROI.
              Vinted alone calculates and displays the exact figure to the buyer at checkout.
            </li>
            <li>
              An optional Bump/Showcase cost, included only when you confirm you actually paid for one and enter the real
              amount — Vinted publishes no universal fixed price for these, so nothing is estimated on your behalf.
            </li>
            <li>Private and Pro seller routes, with Pro sellers seeing an explicit VAT/tax exclusion notice.</li>
            <li>Shipping fields adapted for Vinted&apos;s prepaid-label flow — normally left at £0 unless you actually received or paid shipping yourself.</li>
          </ul>
          <p>
            Sourced from Vinted UK&apos;s official &quot;How it works&quot;, Buyer Protection help page, Price List and Pro
            guide — see <a href="/methodology" className="underline hover:text-[#eaeaea]">methodology</a> for the full
            verification record, including how a conflict between two official Vinted pages over the exact Buyer Protection
            figure was resolved.
          </p>
        </section>
        <MarketplaceCalculatorLinks />
      </div>
    </div>
  );
}
