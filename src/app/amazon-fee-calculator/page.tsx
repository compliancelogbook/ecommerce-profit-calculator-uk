import type { Metadata } from 'next';
import CalculatorShell from '../../components/calculator/CalculatorShell';

export const metadata: Metadata = {
  title: 'Amazon UK FBM Fee Calculator',
  description:
    'Calculate Amazon UK Fulfilled by Merchant (FBM) referral fees by category, Individual and Professional selling plan costs, and your net profit. FBA is not covered.',
};

export default function AmazonFeeCalculatorPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col items-center">
        <header className="mb-12 text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-tight">Amazon UK FBM Fee Calculator</h1>
          <p className="text-[#888] text-base leading-relaxed">
            Fulfilled by Merchant only. Category referral fees (flat, tiered and whole-amount threshold), the Individual (£0.75/unit) and
            Professional (£25/mo) plan costs, and per-order subscription allocation.
          </p>
          <p className="text-[#fb923c] text-sm font-medium">Amazon FBA fulfilment, storage and related charges are not included.</p>
        </header>
        <CalculatorShell defaultPlatform="AMAZON" />
        <section className="w-full mt-12 text-sm text-[#888] leading-relaxed space-y-3">
          <h2 className="text-[#eaeaea] font-semibold text-lg">What&apos;s included</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>9 categories given directly in this build&apos;s specification, verified and covered by automated tests.</li>
            <li>A broader set of categories pulled from Amazon&apos;s pricing page automatically — flagged as unverified until manually confirmed.</li>
            <li>VAT is applied to the Individual/Professional plan fees (explicitly ex-VAT); VAT on referral fees is not calculated, since it couldn&apos;t be confirmed, and is disclosed rather than guessed.</li>
          </ul>
          <p>
            Rates verified against{' '}
            <a href="https://sell.amazon.co.uk/pricing" target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea]">
              sell.amazon.co.uk/pricing
            </a>{' '}
            on 16 August 2026. See <a href="/methodology" className="underline hover:text-[#eaeaea]">methodology</a> for full sourcing and
            coverage notes.
          </p>
        </section>
      </div>
    </div>
  );
}
