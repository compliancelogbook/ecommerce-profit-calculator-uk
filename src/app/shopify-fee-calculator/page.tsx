import type { Metadata } from 'next';
import CalculatorShell from '../../components/calculator/CalculatorShell';
import MarketplaceCalculatorLinks from '../../components/site/MarketplaceCalculatorLinks';
import { pageMetadata } from '../../lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/shopify-fee-calculator',
  title: 'Shopify UK Fee Calculator (Basic, Grow, Advanced)',
  description:
    'Calculate Shopify UK Payments and transaction fees for Basic, Grow and Advanced plans, allocate your monthly subscription per order, and see your real net profit.',
});

export default function ShopifyFeeCalculatorPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col items-center">
        <header className="mb-12 text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-tight">Shopify UK Fee Calculator</h1>
          <p className="text-[#888] text-base leading-relaxed">
            Model Shopify Payments and third-party processor fees across Basic (£25/mo), Grow (£65/mo) and Advanced (£344/mo), including the
            international/Amex card surcharge and per-order subscription allocation.
          </p>
        </header>
        {/* key forces a full remount on route change — see amazon-fee-calculator/page.tsx for why. */}
        <CalculatorShell key="SHOPIFY" defaultPlatform="SHOPIFY" routeLocked />
        <section className="w-full mt-12 text-sm text-[#888] leading-relaxed space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">What&apos;s included</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Shopify Payments standard UK card and international/Amex rates, per plan.</li>
            <li>Shopify&apos;s own transaction fee when a third-party payment provider is used (external processor fee is never guessed).</li>
            <li>Monthly subscription allocated per order using your expected monthly order volume.</li>
          </ul>
          <p>
            Shopify billing VAT is not calculated here — check your Shopify invoice. Rates verified against{' '}
            <a href="https://www.shopify.com/uk/pricing" target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea]">
              shopify.com/uk/pricing
            </a>{' '}
            on 16 August 2026. See <a href="/methodology" className="underline hover:text-[#eaeaea]">methodology</a> for full sourcing.
          </p>
        </section>
        <MarketplaceCalculatorLinks />
      </div>
    </div>
  );
}
