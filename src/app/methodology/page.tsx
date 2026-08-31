import type { Metadata } from 'next';
import Link from 'next/link';
import { SHOPIFY_SOURCE } from '../../data/shopify.fees';
import { ETSY_SOURCES } from '../../data/etsy.fees';
import { EBAY_CATEGORIES, EBAY_SOURCE, EBAY_SOURCE_2026_08_04 } from '../../data/ebay.fees';
import { AMAZON_CATEGORIES, AMAZON_SOURCE } from '../../data/amazon.fees';
import { TIKTOK_CATEGORIES, TIKTOK_SOURCE } from '../../data/tiktok.fees';
import { UK_VAT_SOURCE } from '../../data/vat';
import { pageMetadata } from '../../lib/seo';

const amazonVerifiedCount = AMAZON_CATEGORIES.filter((c) => c.source.verificationStatus === 'SPEC_VERIFIED').length;
const amazonAuditCount = AMAZON_CATEGORIES.filter((c) => c.source.verificationStatus === 'AUDIT_VERIFIED').length;
const amazonUnverifiedCount = AMAZON_CATEGORIES.filter((c) => c.source.verificationStatus === 'AUTOMATED_UNVERIFIED').length;
const ebayCategoryCount = EBAY_CATEGORIES.length;
const ebayWithReducedFeeCount = EBAY_CATEGORIES.filter((c) => c.reducedPerOrderFee).length;
const tiktokCategoryCount = TIKTOK_CATEGORIES.length;
const tiktok5pctCount = TIKTOK_CATEGORIES.filter((c) => c.rate === 0.05).length;
const tiktok9pctCount = TIKTOK_CATEGORIES.filter((c) => c.rate === 0.09).length;

export const metadata: Metadata = pageMetadata({
  path: '/methodology',
  title: 'Methodology & Sources',
  description: 'How this calculator computes UK seller fees: data sources, verification dates, VAT treatment, arithmetic and confidence levels.',
});

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
            This calculator covers UK seller rules only (Shopify UK, Etsy UK, eBay UK Business Sellers, Amazon UK FBM, TikTok Shop UK),
            current to 16 August 2026 for Shopify/Etsy/eBay/Amazon and 31 August 2026 for TikTok Shop. It is not tax or accounting advice —
            always confirm VAT and fee treatment with your accountant, HMRC guidance, or the relevant platform invoice. Last independently
            audited 16 August 2026 (launch audit, then a same-day follow-up audit — see corrections below); TikTok Shop UK support was added
            31 August 2026.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Sources</h2>
          <ul>
            <SourceRow label="Shopify UK pricing" url={SHOPIFY_SOURCE.url} verifiedAt={SHOPIFY_SOURCE.verifiedAt} />
            <SourceRow label="Etsy: Fees and Taxes" url={ETSY_SOURCES.feesAndTaxes.url} verifiedAt={ETSY_SOURCES.feesAndTaxes.verifiedAt} />
            <SourceRow label="Etsy: Payment Processing Fees" url={ETSY_SOURCES.paymentProcessing.url} verifiedAt={ETSY_SOURCES.paymentProcessing.verifiedAt} />
            <SourceRow label="Etsy: Regulatory Operating Fee" url={ETSY_SOURCES.regulatoryOperatingFee.url} verifiedAt={ETSY_SOURCES.regulatoryOperatingFee.verifiedAt} />
            <SourceRow label="eBay UK: Store Selling Fees (original spec examples)" url={EBAY_SOURCE.url} verifiedAt={EBAY_SOURCE.verifiedAt} />
            <SourceRow
              label="eBay UK: Fees for business sellers (complete category schedule, page dated 4 Aug 2026)"
              url={EBAY_SOURCE_2026_08_04.url}
              verifiedAt={EBAY_SOURCE_2026_08_04.verifiedAt}
            />
            <SourceRow label="Amazon UK: Pricing (verified categories)" url={AMAZON_SOURCE.url} verifiedAt={AMAZON_SOURCE.verifiedAt} />
            <SourceRow
              label="TikTok Shop UK: commission-category workbook (TikTok Seller Academy)"
              url={TIKTOK_SOURCE.url}
              verifiedAt={TIKTOK_SOURCE.verifiedAt}
            />
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
              <strong className="text-[#eaeaea]">eBay&apos;s category table was not expanded (first attempt).</strong> This first audit
              pass made two further attempts to fetch eBay&apos;s live category page (both timed out) and one targeted web search, which
              returned figures for Jewellery that conflicted with this build&apos;s tested, spec-given figures. Given that unreliability,
              the table was deliberately left at its existing 7 verified categories rather than risk encoding a wrong or stale rate — see
              the follow-up audit below, which found a working access path.
            </p>
            <p>
              <strong className="text-[#eaeaea]">&quot;Fees last verified&quot; now requires full verification.</strong> The banner only
              appears when every fee line contributing to a result is independently verified as of that date — a mixed result (any
              unverified or manually entered line) no longer shows it.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2026-08-16 follow-up audit — further corrections</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">eBay: fixed a per-item vs per-order threshold bug.</strong> Tiered categories were being
              evaluated against the COMBINED order total (item price × quantity + postage), which let multiple items collectively cross a
              threshold that none of them crossed individually — e.g. two £800 Jewellery items were being taxed as if £1,600 had been
              sold in one go. eBay&apos;s own published wording for these categories explicitly says &quot;per item&quot;, confirmed via a
              direct fetch of eBay&apos;s community announcement pages (the main fee page still could not be directly fetched — see
              below). The three tiered categories (Jewellery &amp; Watches, Women&apos;s Bags &amp; Handbags, Smartphones) are now
              evaluated per item and multiplied by quantity; flat categories are mathematically unaffected. For a single item, &quot;per
              item&quot; and &quot;per order&quot; are the same basis. For multiple items, postage&apos;s allocation across items for tier
              purposes is not stated by any primary source found, so it is excluded from the per-item basis rather than invented — this
              exclusion is disclosed on the result and the order-level fees (regulatory, international, currency conversion) still include
              the full postage charged.
            </p>
            <p>
              <strong className="text-[#eaeaea]">eBay: category IDs and a reduced per-order-fee exception, sourced from a working access
              path.</strong> eBay&apos;s main fee page remains unfetchable directly, but eBay&apos;s community.ebay.co.uk announcement
              pages ARE fetchable and are still a primary eBay source. This confirmed official category IDs for the three tiered
              categories (Jewellery &amp; Watches #281, Women&apos;s Bags &amp; Handbags #169291, Smartphones #9355) and a fully-sourced
              reduced 10p (instead of 30p) per-order fee for qualifying sales ≤ £10 in Antiques (#20081), Art (#550), Coins (#11116),
              Collectables (#1), Dolls &amp; Bears (#237), Pottery &amp; Glass (#870), Sports Memorabilia (#64482), Stamps (#260) and
              Home, Furniture &amp; DIY. That reduction is exposed as an independent toggle rather than folded into a new category, because
              none of those categories currently have a confirmed variable Final Value Fee percentage in this build — pairing a verified
              exception with a guessed percentage would be worse than not adding it.
            </p>
            <p>
              <strong className="text-[#eaeaea]">eBay: one open question surfaced, not resolved by guessing.</strong> A primary-source
              announcement dated 7 March 2024 states the current 14.9%/£1,000/4% rate applies to &quot;Jewellery only&quot;, with no
              corresponding increase mentioned for &quot;Watches, Parts &amp; Accessories&quot;. This build still treats &quot;Jewellery
              &amp; Watches&quot; as one combined category at that rate, because that is the explicit, tested ground truth given for this
              build and the announcement doesn&apos;t state what Watches&apos; current rate actually is — only that it wasn&apos;t part of
              that specific increase. Flagged for a human to confirm whether Watches should be split into its own category.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Amazon: every automatically enabled category is now individually verified.</strong> The
              first audit pass removed 10 categories rather than guess their marginal-vs-whole-amount mechanic. This follow-up made nine
              separate, targeted fetches of sell.amazon.co.uk/pricing — one per category or small group, by name, quoting each
              category&apos;s literal published wording rather than a bulk summary — which distinguishes &quot;X% for the portion of the
              total price up to £Y&quot; (marginal) from &quot;X% for products/items priced at/up to £Y&quot; (whole-price threshold). This
              resolved the mechanic for all 10 previously-removed categories (now restored) and individually confirmed the rate and
              minimum fee for the remaining ~32 flat categories, which were previously auto-calculated without that individual check. One
              genuine contradiction was found and resolved: a bulk fetch implied Books had a £0.25 minimum fee, but a dedicated, narrower
              fetch confirmed &quot;not applicable&quot; — consistent with the original build&apos;s figure — so the narrower, targeted
              answer was trusted over the bulk one. No Amazon category remains <code className="text-[#eaeaea]">AUTOMATED_UNVERIFIED</code>{' '}
              while auto-selectable; an automated test fails the build if one ever becomes selectable again without being upgraded first.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2026-08-16 second follow-up audit — further corrections</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">eBay: Jewellery and Watches, Parts &amp; Accessories are now split — the prior
              &quot;open question&quot; is resolved.</strong> The previous pass flagged that Jewellery&apos;s 14.9%/£1,000/4% rate
              increase explicitly excluded &quot;Watches, Parts &amp; Accessories&quot;, but didn&apos;t state what Watches&apos; own
              rate actually was, so the two stayed combined pending confirmation. That confirmation has now been provided: Jewellery
              (#281, excluding subcategories) stays at 14.9%/£1,000/4%; Watches, Parts &amp; Accessories (#260324) is a separate
              category at 12.9% on the portion up to £750 per item, 3% above. The combined &quot;Jewellery &amp; Watches&quot; option
              no longer exists — selecting Watches items under Jewellery&apos;s rate is no longer possible. Category ID #260324 was
              independently cross-checked against eBay&apos;s own category browse page.
            </p>
            <p>
              <strong className="text-[#eaeaea]">eBay: the reduced 10p per-order fee is now tied to category selection, not a
              free-standing toggle.</strong> The previous implementation exposed eligibility as an independent checkbox, which allowed
              impossible combinations (e.g. applying the Collectables discount to a Jewellery listing). It has been removed. The nine
              categories confirmed eligible for the reduction (Antiques, Art, Coins, Collectables, Dolls &amp; Bears, Pottery &amp;
              Glass, Sports Memorabilia, Stamps, Home/Furniture/DIY) are now real, selectable entries in the same category dropdown as
              every other category — each carries a confirmed <code className="text-[#eaeaea]">reducedPerOrderFee</code> rule, applied
              automatically when eligible. None of these nine have a confirmed variable Final Value Fee percentage, so selecting one
              still requires a manual FVF rate (or leaves the FVF excluded) — but the per-order-fee reduction is independently
              confirmed and doesn&apos;t depend on that. A category with no confirmed reduction (e.g. Jewellery, Everything Else) can
              never receive the discount, at any sale price, by construction — there is no input that can assert it.
            </p>
            <p>
              <strong className="text-[#eaeaea]">eBay: the per-item correction now visibly marks a partial result as partial.</strong>{' '}
              When postage is excluded from a multi-item per-item Final Value Fee calculation, the fee line&apos;s own label now reads
              &quot;— INCOMPLETE (postage excluded)&quot; and carries an explanatory note, in addition to the general exclusion already
              shown — the figure is never presented as if it were a complete, exact fee.
            </p>
            <p>
              <strong className="text-[#eaeaea]">eBay: the main fee page still could not be fetched — four more attempts.</strong> This
              round tried the main page under its two known URL slugs, a generic &quot;selling-fees&quot; page, and a
              fees.ebay.co.uk subdomain that turned out not to resolve at all (DNS failure) — plus two more community-forum threads
              that exist but sit behind a login wall. Only eBay&apos;s public community ANNOUNCEMENT pages (as opposed to forum
              discussion threads) remain reliably fetchable, and by nature those only document specific historical changes, not
              today&apos;s full consolidated table. Category coverage beyond what&apos;s listed below was not expanded by guessing.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2026-08-16 third audit pass — complete eBay category schedule</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">A complete official-page capture was supplied directly and implemented in full.</strong>{' '}
              After three rounds of failed automated fetch attempts, a complete rendered capture of eBay&apos;s official UK Business
              Seller fees page (structured JSON table transcription cross-checked line-by-line against the full rendered text — both
              agree exactly) was provided directly. Every row in that page&apos;s &quot;Final value fees by category&quot; table has been
              implemented: <strong className="text-[#eaeaea]">{ebayCategoryCount} categories and subcategories</strong> in total, each
              with its official category ID, exact rate(s), threshold(s) and per-item/per-order basis, taken directly from the source
              with nothing inferred or extrapolated. No further fetch attempts were made this round, per instruction.
            </p>
            <p>
              <strong className="text-[#eaeaea]">The nine reduced-per-order-fee categories now also have a confirmed FVF rate.</strong>{' '}
              Antiques, Art, Coins, Collectables, Dolls &amp; Bears, Pottery &amp; Glass, Sports Memorabilia, Stamps and Home, Furniture
              &amp; DIY previously required a manual FVF entry (their per-order-fee eligibility was confirmed, but not their FVF
              percentage). This capture confirms real rates for all nine — every one of their official category IDs cross-checks exactly
              against the IDs found via community announcements in the prior audit pass, corroborating both sources.
            </p>
            <p>
              <strong className="text-[#eaeaea]">A new basis rule was found and implemented: threshold determination that excludes
              postage.</strong> The Trainers subcategories (Men&apos;s and Women&apos;s Shoes &gt; Trainers) charge 11.9% below a £100
              item price and 7% at £100 or more — and the source explicitly states &quot;the item selling price excludes postage, and
              any other additional fees or taxes&quot;. This is a confirmed rule, modelled distinctly from the general
              per-item-postage-exclusion used elsewhere (which is an unconfirmed-allocation limitation for quantity &gt; 1, not a
              published rule) — a Trainers calculation is never marked incomplete, because nothing about it is uncertain.
            </p>
            <p>
              <strong className="text-[#eaeaea]">One verbatim source oddity was preserved, not corrected.</strong> The official table
              lists &quot;Tyres&quot; twice, against two different category IDs (#179680 and #124313) sharing the same rate — both the
              JSON and the rendered text show this identically. Rather than assume one is an error and drop it, both are encoded as
              separate, independently selectable entries, per the instruction not to infer anything absent from the source.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Still explicitly out of scope:</strong> the Classified Ad listing format (no FVF
              applies to it at all), listing-time upgrade fees (Reserve Price, Subtitle, Gallery Plus, etc.), the £14 dispute fee, and
              seller-performance-based fee penalties — none of these are calculated by this build, consistent with its existing scope.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">TikTok Shop UK</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">Complete commission schedule, mechanically extracted from a verified source file.</strong>{' '}
              The official TikTok Shop UK commission-category workbook was downloaded from TikTok Seller Academy and supplied directly
              for this build. Its SHA-256 hash was checked against the hash it was supplied with before any row was encoded, and every
              one of its <strong className="text-[#eaeaea]">{tiktokCategoryCount} category/subcategory rules</strong> ({tiktok5pctCount}{' '}
              at 5%, {tiktok9pctCount} at 9%) was extracted directly from the source .xlsx by a small script — no value was hand-retyped
              at any point, which is what eliminates transcription risk for this dataset. The extraction script re-checks the source
              hash and the audited row/rate counts every time it runs, and refuses to generate anything if either doesn&apos;t match. The
              category data was verified 31 August 2026.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Commission is inclusive of VAT.</strong> Unlike this build&apos;s other platforms,
              TikTok Shop&apos;s published commission rate already includes applicable VAT — no separate 20% UK VAT is added on top of
              it. The standard rate is 9%; a minority of categories/subcategories are confirmed at a reduced 5%.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Platform commission and affiliate/creator commission use different bases.</strong> TikTok
              publishes two distinct formulas, not one shared basis:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-[#eaeaea]">Platform commission basis</strong> = (item price × quantity) minus any{' '}
                <em>seller-funded</em> discount, plus shipping charged to the customer. A TikTok-funded (platform) discount is recorded
                for transparency but does not reduce this basis — TikTok absorbs that cost itself. Worked example: £100 product, £10
                seller discount, £5 customer-paid shipping → basis = 100 − 10 + 5 = £95; commission at 9% = £8.55.
              </li>
              <li>
                <strong className="text-[#eaeaea]">Affiliate/creator commission basis</strong> = product price minus seller discount
                minus platform discount, floored at £0 — it excludes customer-paid shipping entirely, and (unlike the platform basis) it
                does subtract the platform discount. Same order, 10% affiliate rate: basis = 100 − 10 − 10 = £80; commission = £8.00.
              </li>
            </ul>
            <p>
              <strong className="text-[#eaeaea]">Affiliate/creator commission is optional and seller-entered.</strong> A rate is only
              applied when the seller enters one — it is never assumed — and it must fall within TikTok&apos;s documented 1%–80% range;
              blank or 0% means no affiliate arrangement applies. It is shown as a fully separate deduction from the platform commission,
              on its own basis, never blended with it.
            </p>
            <p>
              <strong className="text-[#eaeaea]">No rate stacking.</strong> An optional seller-specific promotional commission rate, when
              entered, entirely replaces the category rate — it is never added to or combined with it.
            </p>
            <p>
              <strong className="text-[#eaeaea]">TikTok Shop fulfilment (FBT), ads, storage and return costs are not calculated from a
              schedule.</strong> These have no published, verified fee schedule in this build&apos;s dataset, so — consistent with the
              existing &quot;never guess&quot; approach used elsewhere for the seller&apos;s actual shipping cost — they are entered as a
              single actual-cost amount rather than estimated.
            </p>
            <p>
              <strong className="text-[#eaeaea]">One source-data oddity preserved verbatim.</strong> The workbook&apos;s Pre-Owned
              category lists a subcategory using an unusual first character (&quot;Ǫuartz Watches&quot;, U+01EA rather than a plain
              &quot;Q&quot;). That literal source value is retained for auditability; the calculator displays the corrected &quot;Quartz
              Watches&quot; as a tested alias, without mutating the underlying source record.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Official TikTok Seller Academy sources.</strong> Category commission workbook:{' '}
              <a href={TIKTOK_SOURCE.url} target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea] break-all">
                {TIKTOK_SOURCE.url}
              </a>
              . Cross-referenced against{' '}
              <a
                href="https://seller-uk.tiktok.com/university/essay?knowledge_id=3337893683398432"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#eaeaea] break-all"
              >
                knowledge_id=3337893683398432
              </a>{' '}
              (commission structure),{' '}
              <a
                href="https://seller-uk.tiktok.com/university/essay?knowledge_id=7753824408913665"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#eaeaea] break-all"
              >
                knowledge_id=7753824408913665
              </a>{' '}
              (fee overview), and{' '}
              <a
                href="https://seller-uk.tiktok.com/university/essay?knowledge_id=7753826522154754"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#eaeaea] break-all"
              >
                knowledge_id=7753826522154754
              </a>{' '}
              (affiliate/creator commission formula).
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Coverage &amp; what&apos;s not verified</h2>
          <div className="text-sm text-[#888] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#eaeaea]">eBay category coverage: {ebayCategoryCount} categories, all with a confirmed Final Value
              Fee.</strong> The complete published category schedule from the 4 August 2026 official page is implemented, including
              {' '}{ebayWithReducedFeeCount} categories that also carry a confirmed reduced 10p per-order fee. Any category genuinely not
              on eBay&apos;s published table (e.g. a brand-new or regional category not yet captured) still requires a manually entered
              rate — the calculator will never silently apply a guessed rate or an unearned fee reduction.
            </p>
            <p>
              <strong className="text-[#eaeaea]">Amazon category coverage: {amazonVerifiedCount} spec-verified, {amazonAuditCount} audit-verified,
              {' '}{amazonUnverifiedCount} unverified.</strong> Every automatically selectable Amazon category is either{' '}
              {amazonVerifiedCount} given verbatim in the original build brief and covered by acceptance tests, or {amazonAuditCount}{' '}
              individually confirmed by name — rate, threshold mechanic and minimum fee — via targeted fetches of{' '}
              <a href={AMAZON_SOURCE.url} target="_blank" rel="noreferrer" className="underline hover:text-[#eaeaea]">
                sell.amazon.co.uk/pricing
              </a>{' '}
              during the 2026-08-16 follow-up audit, quoting each category&apos;s literal published wording to distinguish marginal
              (&quot;portion of the total price&quot;) from whole-price-threshold (&quot;products/items priced at/up to&quot;) categories.
              No category remains auto-selectable while unverified — see the automated test asserting this in the test suite.
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
            <p>
              <strong className="text-[#eaeaea]">TikTok Shop commission schedule: {tiktokCategoryCount} category/subcategory rules, all
              confirmed.</strong> Every selectable category resolves to a confirmed 5% or 9% commission rate — none require a manual
              rate. A category genuinely outside the workbook (e.g. a new category TikTok adds later) still requires one, rather than a
              guess.
            </p>
            <p>
              V1 explicitly excludes: Amazon FBA, TikTok Shop FBT/ads/storage/return fee schedules (entered as an actual cost, not
              calculated), accounts/saved calculations, marketplace API connections, and non-UK seller jurisdictions.
            </p>
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
