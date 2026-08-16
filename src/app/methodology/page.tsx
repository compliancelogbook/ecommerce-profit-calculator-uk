import type { Metadata } from 'next';
import Link from 'next/link';
import { SHOPIFY_SOURCE } from '../../data/shopify.fees';
import { ETSY_SOURCES } from '../../data/etsy.fees';
import { EBAY_SOURCE } from '../../data/ebay.fees';
import { AMAZON_CATEGORIES, AMAZON_SOURCE, AMAZON_SOURCE_AUTOMATED } from '../../data/amazon.fees';
import { UK_VAT_SOURCE } from '../../data/vat';

const amazonVerifiedCount = AMAZON_CATEGORIES.filter((c) => c.source.verificationStatus === 'SPEC_VERIFIED').length;
const amazonAuditCount = AMAZON_CATEGORIES.filter((c) => c.source.verificationStatus === 'AUDIT_VERIFIED').length;
const amazonUnverifiedCount = AMAZON_CATEGORIES.filter((c) => c.source.verificationStatus === 'AUTOMATED_UNVERIFIED').length;

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
            or the relevant platform invoice. Last independently audited 16 August 2026 (launch audit — see corrections below).
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
          <h2 className="text-xl font-semibold text-white">2026-08-16 launch audit — corrections</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">Amazon: removed 10 categories with an unconfirmed threshold mechanic.</strong> A prior
              build had auto-calculated ~37 extra categories, assigning each a marginal-vs-whole-amount &quot;mechanic&quot; by analogy
              rather than verification. The audit found a concrete error — Automotive &amp; Powersports was modelled as whole-amount when
              Amazon&apos;s own terms describe it as marginal (15% up to £45, 9% above) — now fixed and individually confirmed
              (AUDIT_VERIFIED). Ten other multi-bracket categories whose mechanic remains genuinely unconfirmed (Baby Products, Baby
              Pushchairs &amp; Safety Equipment, Reusable Work &amp; Safety Gloves, Clothing &amp; Accessories, Electronic Accessories,
              Printer &amp; Scanner Accessories, Furniture, Grocery &amp; Gourmet, Pet Clothing &amp; Food, Vitamins/Minerals &amp;
              Supplements) were removed from auto-calculation rather than re-guessed — select &quot;Other&quot; and enter a rate manually
              for these.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Etsy: Regulatory Operating Fee VAT was corrected.</strong> Previously modelled as
              unconfirmed; Etsy&apos;s Regulatory Operating Fee page explicitly states the fee is subject to VAT where applicable, so it
              now follows the same VAT-ID-based mechanism as the listing, transaction and Etsy Payments fees.
            </p>
            <p>
              <strong className="text-[#eaeaea]">eBay/Amazon: blank or invalid manual category rates no longer silently become 0%.</strong>{' '}
              A missing, malformed, zero, negative or implausibly high (&gt;60%) manual rate now excludes the category-dependent fee
              (confidence <code className="text-[#eaeaea]">EXCLUDES_VARIABLE_FEES</code>) with an inline validation error, instead of being
              treated as a real calculated assumption.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Etsy: listing fee now scales with quantity.</strong> Etsy charges the US$0.20 listing fee
              per unit sold, not once per order — a 3-unit order now shows 3× the fee, converted through the same editable USD→GBP
              assumption.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Confidence precedence was made explicit and consistent.</strong> Every engine now reduces
              a list of signals to the worst case: a missing/applicable-but-excluded fee outranks a disclosed assumption, which outranks a
              fully verified input. Shopify always excludes billing VAT, so it can no longer report{' '}
              <code className="text-[#eaeaea]">EXACT_FOR_SELECTED_INPUTS</code>. Etsy&apos;s currency-conversion and Offsite Ads fees have
              unconfirmed VAT treatment, so selecting either now reports{' '}
              <code className="text-[#eaeaea]">EXCLUDES_VARIABLE_FEES</code> rather than merely{' '}
              <code className="text-[#eaeaea]">ASSUMPTION_DEPENDENT</code>.
            </p>
            <p>
              <strong className="text-[#eaeaea]">eBay&apos;s category table was not expanded.</strong> The audit made two further attempts
              to fetch eBay&apos;s live category page (both timed out) and one targeted web search, which returned figures for Jewellery
              that conflicted with this build&apos;s tested, spec-given figures. Given that unreliability, the table was deliberately left
              at its existing 7 verified categories rather than risk encoding a wrong or stale rate.
            </p>
            <p>
              <strong className="text-[#eaeaea]">&quot;Fees last verified&quot; now requires full verification.</strong> The banner only
              appears when every fee line contributing to a result is independently verified as of that date — a mixed result (any
              unverified or manually entered line) no longer shows it.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Coverage &amp; what&apos;s not verified</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">eBay category coverage is partial.</strong> Only the categories given directly in this
              build&apos;s specification are included (Clothes/Shoes/Accessories, Women&apos;s Bags &amp; Handbags, Jewellery &amp; Watches,
              Mobile Phones, Smartphones, Business/Office/Industrial, Everything Else). eBay&apos;s live category page could not be fetched
              (repeated timeouts across two build passes). Any other category must be entered manually — the calculator will never silently
              apply a guessed rate.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Amazon category coverage: {amazonVerifiedCount} verified, {amazonAuditCount} audit-corrected,
              {' '}{amazonUnverifiedCount} unverified.</strong> {amazonVerifiedCount} categories match this build&apos;s specification exactly
              and are covered by automated tests. 1 (Automotive &amp; Powersports) was individually corrected during the 2026-08-16 audit.
              A further {amazonUnverifiedCount} single-rate (flat, no threshold to infer) categories were extracted via an automated fetch of{' '}
              <a href={AMAZON_SOURCE_AUTOMATED.url} target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea]">
                sell.amazon.co.uk/pricing
              </a>{' '}
              and are marked &quot;unverified&quot; in the category picker. Any category whose marginal-vs-whole-amount mechanic could not
              be individually confirmed was removed rather than guessed — see the audit corrections above.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Etsy VAT treatment is fee-specific.</strong> VAT (20% if no VAT ID is on file, 0% reverse
              charge if one is) is applied to the listing, transaction, Etsy Payments and Regulatory Operating fees, all of which Etsy&apos;s
              own help pages confirm are subject to this treatment. The currency conversion fee and Offsite Ads fee are shown ex-VAT with
              the uncertainty disclosed, because their specific VAT treatment could not be independently confirmed.
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
          <h2 className="text-xl font-semibold text-white">Confidence levels &amp; precedence</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            Every calculation collects a signal for each fee decision it makes, then reports the single worst signal — never an average
            and never the happy-path default:
          </p>
          <ol className="text-sm text-[#888] leading-relaxed space-y-2 list-decimal list-inside">
            <li><strong className="text-[#eaeaea]">Excludes variable fees</strong> (worst) — a fee that should apply is missing or its VAT couldn&apos;t be confirmed, and is excluded from the total rather than guessed. Outranks everything else.</li>
            <li><strong className="text-[#eaeaea]">Assumption-dependent</strong> — every fee is calculated, but at least one line relies on a disclosed, user-controllable assumption (an entered processor rate, an unverified category, an FX rate).</li>
            <li><strong className="text-[#eaeaea]">Exact for selected inputs</strong> (best) — every fee line is a verified rate applied exactly as published, with no exclusions or assumptions.</li>
          </ol>
          <p className="text-sm text-[#888] leading-relaxed">
            Because Shopify billing VAT and Amazon referral-fee VAT are always excluded, those two platforms can never report
            &quot;Exact for selected inputs&quot; — that is intentional, not a bug.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Input validation</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            Negative prices/costs/shipping, zero or negative quantities, fractional quantities, malformed numbers, and invalid FX/processor/
            manual-category rates are rejected with an inline error rather than silently converted to 0 or 1 — no calculation is shown until
            every field relevant to the selected platform is valid. A manually entered category rate of exactly 0% is rejected outright: it
            is never a real supported fallback value, only a missing one.
          </p>
        </section>

        <Link href="/" className="inline-block text-sm underline text-[#888] hover:text-[#eaeaea]">← Back to calculator</Link>
      </div>
    </div>
  );
}
