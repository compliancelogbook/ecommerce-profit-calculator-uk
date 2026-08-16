import type { Metadata } from 'next';
import Link from 'next/link';
import { SHOPIFY_SOURCE } from '../../data/shopify.fees';
import { ETSY_SOURCES } from '../../data/etsy.fees';
import { EBAY_SOURCE } from '../../data/ebay.fees';
import { AMAZON_SOURCE, AMAZON_SOURCE_AUTOMATED } from '../../data/amazon.fees';
import { UK_VAT_SOURCE } from '../../data/vat';

export const metadata: Metadata = {
  title: 'Methodology & Sources | Compliance Logbook',
  description: 'How this calculator computes UK seller fees: data sources, verification dates, VAT treatment, arithmetic and confidence levels.',
};

function SourceRow({ label, url, verifiedAt }: { label: string; url: string; verifiedAt: string | null }) {
  return (
    <li className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 py-2 border-b border-[#111]">
      <span className="text-[#eaeaea] text-sm">{label}</span>
      <span className="text-xs text-[#888] flex items-center gap-3">
        {verifiedAt && <span>Verified {verifiedAt}</span>}
        <a href={url} target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea] break-all">
          {url}
        </a>
      </span>
    </li>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#eaeaea] flex flex-col items-center px-4 py-8 md:py-24 font-sans">
      <div className="w-full max-w-[800px] space-y-14">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tighter">Methodology &amp; Sources</h1>
          <p className="text-[#888] text-base leading-relaxed">
            This calculator covers UK seller rules only (Shopify UK, Etsy UK, eBay UK Business Sellers, Amazon UK FBM), current to
            16 August 2026. It is not tax or accounting advice — always confirm VAT and fee treatment with your accountant, HMRC guidance,
            or the relevant platform invoice.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Sources</h2>
          <ul>
            <SourceRow label="Shopify UK pricing" url={SHOPIFY_SOURCE.url} verifiedAt={SHOPIFY_SOURCE.verifiedAt} />
            <SourceRow label="Etsy: Fees and Taxes" url={ETSY_SOURCES.feesAndTaxes.url} verifiedAt={ETSY_SOURCES.feesAndTaxes.verifiedAt} />
            <SourceRow label="Etsy: Payment Processing Fees" url={ETSY_SOURCES.paymentProcessing.url} verifiedAt={ETSY_SOURCES.paymentProcessing.verifiedAt} />
            <SourceRow label="Etsy: Regulatory Operating Fee" url={ETSY_SOURCES.regulatoryOperatingFee.url} verifiedAt={ETSY_SOURCES.regulatoryOperatingFee.verifiedAt} />
            <SourceRow label="eBay UK: Store Selling Fees" url={EBAY_SOURCE.url} verifiedAt={EBAY_SOURCE.verifiedAt} />
            <SourceRow label="Amazon UK: Pricing (verified categories)" url={AMAZON_SOURCE.url} verifiedAt={AMAZON_SOURCE.verifiedAt} />
            <SourceRow label="UK standard VAT rate (HMRC, statutory)" url={UK_VAT_SOURCE.url} verifiedAt={null} />
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Coverage &amp; what&apos;s not verified</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">eBay category coverage is partial.</strong> Only the categories given directly in this
              build&apos;s specification are included (Clothes/Shoes/Accessories, Women&apos;s Bags &amp; Handbags, Jewellery &amp; Watches,
              Mobile Phones, Smartphones, Business/Office/Industrial, Everything Else). eBay&apos;s live category page could not be fetched
              at build time (repeated timeouts). Any other category must be entered manually — the calculator will never silently apply a
              guessed rate.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Amazon category coverage is broader but partially unverified.</strong> 9 categories match
              this build&apos;s specification exactly and are covered by automated tests. A further ~37 categories were extracted via an
              automated fetch of{' '}
              <a href={AMAZON_SOURCE_AUTOMATED.url} target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea]">
                sell.amazon.co.uk/pricing
              </a>{' '}
              and are marked &quot;unverified&quot; in the category picker — they were not independently checked line-by-line. Whether a
              given threshold category charges a blended (marginal) rate or a single whole-amount rate is only confirmed for Home, Beauty
              (whole-amount) and Jewellery, Watches (marginal); the mechanic for other multi-bracket unverified categories is inferred by
              analogy and should be treated as provisional.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Etsy VAT treatment is fee-specific.</strong> VAT (20% if no VAT ID is on file, 0% reverse
              charge if one is) is only applied to the listing, transaction and Etsy Payments fees, which Etsy&apos;s own Fees &amp; Taxes
              and Payment Processing pages describe. The Regulatory Operating Fee, currency conversion fee and Offsite Ads fee are shown
              ex-VAT with the uncertainty disclosed, because their specific VAT treatment could not be independently confirmed.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Amazon referral-fee VAT is not calculated.</strong> The Individual (£0.75/unit) and
              Professional (£25/month) fees are explicitly published ex-VAT, so 20% UK VAT is added to those. Referral-fee VAT treatment
              was not confirmed, so it is excluded rather than assumed.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Shopify billing VAT is not calculated at all.</strong> Check your Shopify invoice.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Etsy&apos;s Offsite Ads fee cap</strong> is modelled at US$100/order, converted to £ using
              the same explicit, editable USD→GBP assumption used for the listing fee.
            </p>
            <p>V1 explicitly excludes: Amazon FBA, accounts/saved calculations, marketplace API connections, and non-UK seller jurisdictions.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Arithmetic &amp; rounding</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            All calculations run on arbitrary-precision decimal arithmetic (via <code className="text-[#eaeaea]">decimal.js</code>), not raw
            JavaScript floats. Individual fee lines are shown unrounded (e.g. £30 × 0.35% displays as £0.105) so the breakdown reconciles
            exactly against the total. Rounding to the nearest penny happens only at headline currency display (revenue, profit, totals) —
            never mid-calculation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Confidence levels</h2>
          <ul className="text-sm text-[#888] leading-relaxed space-y-2">
            <li><strong className="text-[#eaeaea]">Exact for selected inputs</strong> — every fee line is a verified rate applied exactly as published.</li>
            <li><strong className="text-[#eaeaea]">Assumption-dependent</strong> — at least one line relies on a disclosed, user-controllable assumption (an entered processor rate, an unverified category, an FX rate).</li>
            <li><strong className="text-[#eaeaea]">Excludes variable fees</strong> — a fee that should apply could not be calculated and is excluded from the total rather than guessed.</li>
          </ul>
        </section>

        <Link href="/" className="inline-block text-sm underline text-[#888] hover:text-[#eaeaea]">← Back to calculator</Link>
      </div>
    </div>
  );
}
