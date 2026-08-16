import type { Metadata } from 'next';
import CalculatorShell from '../../components/calculator/CalculatorShell';

export const metadata: Metadata = {
  title: 'Etsy UK Fee Calculator | Compliance Logbook',
  description:
    'Calculate Etsy UK listing, transaction, payment processing and Regulatory Operating Fee costs, model Offsite Ads, and see your net profit per sale.',
};

export default function EtsyFeeCalculatorPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col items-center">
        <header className="mb-12 text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-tight">Etsy UK Fee Calculator</h1>
          <p className="text-[#888] text-base leading-relaxed">
            Model the $0.20 listing fee, 6.5% transaction fee, 4%+£0.20 Etsy Payments fee, 0.48% UK Regulatory Operating Fee, and optional
            Offsite Ads (12%/15%, capped at $100/order).
          </p>
        </header>
        <CalculatorShell defaultPlatform="ETSY" />
        <section className="w-full mt-12 text-sm text-[#888] leading-relaxed space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">What&apos;s included</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Listing fee converted from USD using an explicit, editable exchange-rate assumption — never a hidden hard-coded figure.</li>
            <li>Transaction, payments and regulatory fees calculated on item price plus any postage charged, per Etsy&apos;s published rules.</li>
            <li>VAT on fees is only calculated for fee types Etsy&apos;s own help pages confirm are VAT-eligible; anything unconfirmed is shown ex-VAT with the uncertainty disclosed.</li>
          </ul>
          <p>
            Rates verified against Etsy&apos;s Fees &amp; Taxes, Payment Processing, and Regulatory Operating Fee help pages on 16 August 2026. See{' '}
            <a href="/methodology" className="underline hover:text-[#eaeaea]">methodology</a> for full sourcing.
          </p>
        </section>
      </div>
    </div>
  );
}
