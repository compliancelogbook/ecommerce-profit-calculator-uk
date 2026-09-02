"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import { buildTabDescriptors, resolveDisplayedPlatform, type Platform } from '../../lib/platform-routes';
import { EBAY_CATEGORIES } from '../../data/ebay.fees';
import { TIKTOK_CATEGORIES } from '../../data/tiktok.fees';
import type { VatProfile } from '../../data/vat';
import { calculateShopify } from '../../lib/engines/shopify';
import { calculateEtsy } from '../../lib/engines/etsy';
import { calculateEbay } from '../../lib/engines/ebay';
import { calculateAmazon } from '../../lib/engines/amazon';
import { resolveTikTok } from '../../lib/engines/tiktok-resolve';
import { resolveVinted } from '../../lib/engines/vinted-resolve';
import type { CalculationResult } from '../../lib/types';
import {
  parseManualCategoryRate,
  parseNonNegativeAmount,
  parseNonNegativeFixedFee,
  parseNonNegativePercent,
  parseOptionalPositiveInteger,
  parsePositiveFxRate,
  parsePositiveWholeQuantity,
  type ValidationResult,
} from '../../lib/validation';
import { MoneyField, NumberField, SegmentedToggle } from './inputs';
import ShopifyPanel, { type ShopifyPanelState } from './ShopifyPanel';
import EtsyPanel, { type EtsyPanelState } from './EtsyPanel';
import EbayPanel, { type EbayPanelState } from './EbayPanel';
import AmazonPanel, { type AmazonPanelState } from './AmazonPanel';
import TikTokPanel, { defaultCategoryIdForGroup, TIKTOK_OTHER_GROUP, type TikTokPanelState } from './TikTokPanel';
import VintedPanel, { type VintedPanelState } from './VintedPanel';
import ResultsPanel from './ResultsPanel';

// Platform itself now lives in src/lib/platform-routes.ts (the shared
// route registry) — re-exported here since nothing outside this file
// currently imports it, but keeping the name stable at this path costs
// nothing and avoids a silent breaking change for any future import.
export type { Platform };

function err<T>(r: ValidationResult<T>): string | undefined {
  return r.ok ? undefined : r.error;
}
function val<T>(r: ValidationResult<T>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export default function CalculatorShell({
  defaultPlatform = 'SHOPIFY',
  routeLocked = false,
}: {
  defaultPlatform?: Platform;
  /**
   * True on every dedicated /*-fee-calculator route, false on the homepage.
   * When true, the tab switcher renders real <Link>s to each platform's own
   * route (with aria-current="page" on the active one) instead of buttons
   * that reassign local state — so the URL, metadata, H1, intro and
   * "What's included" section can never drift out of sync with whichever
   * calculator is actually showing. The homepage keeps the original
   * local-state switcher so users can compare platforms without navigating
   * away.
   */
  routeLocked?: boolean;
}) {
  // usePathname() is a live, reactive subscription to the browser's actual
  // current location — a <Link> click, router.push, AND back/forward
  // navigation all update it — so resolveDisplayedPlatform (see its own
  // doc comment in platform-routes.ts, and src/lib/__tests__/platform-routes.test.ts) can
  // make the URL the single source of truth for `platform` on a dedicated
  // route, never a prop snapshot or local state that a page-level
  // re-render could fail to keep in sync.
  const pathname = usePathname();
  const [localPlatform, setLocalPlatform] = useState<Platform>(defaultPlatform);
  const platform = resolveDisplayedPlatform({ routeLocked, pathname, defaultPlatform, localPlatform });

  // Shared transaction inputs
  const [soldPrice, setSoldPrice] = useState('30');
  const [itemCost, setItemCost] = useState('10');
  const [shippingCharged, setShippingCharged] = useState('0');
  const [shippingCost, setShippingCost] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [vatProfile, setVatProfile] = useState<VatProfile>('NOT_REGISTERED');

  const [shopify, setShopify] = useState<ShopifyPanelState>({
    plan: 'BASIC',
    processor: 'SHOPIFY_PAYMENTS',
    cardType: 'STANDARD',
    expectedMonthlyOrders: '',
    useThirdPartyAssumption: false,
    thirdPartyRate: '',
    thirdPartyFixed: '',
  });

  const [etsy, setEtsy] = useState<EtsyPanelState>({
    currencyConversionSelected: false,
    offsiteAdsRate: null,
    vatIdSupplied: true,
    usdToGbpRate: '0.75',
  });

  const [ebay, setEbay] = useState<EbayPanelState>({
    categoryId: 'EVERYTHING_ELSE',
    manualCategoryRate: '',
    region: 'DOMESTIC',
    currencyConversionSelected: false,
    topRatedPremiumService: false,
  });

  const [amazon, setAmazon] = useState<AmazonPanelState>({
    sellerPlan: 'INDIVIDUAL',
    categoryId: 'EVERYTHING_ELSE',
    manualCategoryRate: '',
    expectedMonthlyUnits: '',
  });

  const [tiktok, setTiktok] = useState<TikTokPanelState>(() => {
    const categoryGroup = TIKTOK_CATEGORIES[0]?.category ?? TIKTOK_OTHER_GROUP;
    return {
      categoryGroup,
      categoryId: defaultCategoryIdForGroup(categoryGroup),
      manualCategoryRate: '',
      sellerDiscount: '0',
      platformDiscount: '0',
      promotionalRateEnabled: false,
      promotionalRate: '',
      affiliateCommissionRate: '',
      otherActualCosts: '0',
    };
  });

  const [vinted, setVinted] = useState<VintedPanelState>({
    sellerRoute: 'PRIVATE',
    visibilityServicePurchased: false,
    visibilityServiceCost: '',
  });

  // --- Validation ---------------------------------------------------------
  // Two tiers, deliberately different:
  //
  // 1. CORE fields (sold price, item cost, shipping, quantity) affect every
  //    figure in the result — an invalid value here would make the ENTIRE
  //    calculation misleading, so it's withheld entirely until fixed.
  // 2. SOFT/optional assumption fields (a manual category rate, an entered
  //    processor rate, an FX rate, an expected volume) affect only their
  //    own fee line. An invalid value there excludes just that fee — with
  //    an inline error shown — while the rest of the calculation still
  //    renders normally, exactly like leaving the field blank/unsupplied.
  //    (Blocking the whole calculator here was tried and rejected during
  //    the 2026-08-16 audit fix — it contradicted the requirement that a
  //    missing manual rate should exclude just the category-dependent fee.)
  //
  // Nothing here silently coerces a bad value to 0 or 1 either way.

  const soldPriceR = parseNonNegativeAmount(soldPrice, 'Sold price');
  const itemCostR = parseNonNegativeAmount(itemCost, 'Item cost');
  const shippingChargedR = parseNonNegativeAmount(shippingCharged, 'Shipping charged');
  const shippingCostR = parseNonNegativeAmount(shippingCost, 'Actual shipping cost');
  const quantityR = parsePositiveWholeQuantity(quantity);

  const sharedErrors = {
    soldPrice: err(soldPriceR),
    itemCost: err(itemCostR),
    shippingCharged: err(shippingChargedR),
    shippingCost: err(shippingCostR),
    quantity: err(quantityR),
  };
  const sharedHasBlockingError = Object.values(sharedErrors).some(Boolean);

  const shopifyMonthlyOrdersR = parseOptionalPositiveInteger(shopify.expectedMonthlyOrders, 'Expected monthly orders');
  const shopifyThirdPartyActive = shopify.processor === 'THIRD_PARTY' && shopify.useThirdPartyAssumption;
  const shopifyRateR = parseNonNegativePercent(shopify.thirdPartyRate, 'Processor rate');
  const shopifyFixedR = parseNonNegativeFixedFee(shopify.thirdPartyFixed, 'Processor fixed fee');
  const shopifyErrors = {
    expectedMonthlyOrders: err(shopifyMonthlyOrdersR),
    thirdPartyRate: shopifyThirdPartyActive ? err(shopifyRateR) : undefined,
    thirdPartyFixed: shopifyThirdPartyActive ? err(shopifyFixedR) : undefined,
  };
  // Only pass a processor assumption through when BOTH its fields are valid — a half-valid
  // pair (e.g. a good rate but a malformed fixed fee) must not silently drop one half.
  const shopifyThirdPartyValid = shopifyThirdPartyActive && shopifyRateR.ok && shopifyFixedR.ok;

  const etsyFxR = parsePositiveFxRate(etsy.usdToGbpRate);
  const etsyErrors = { usdToGbpRate: err(etsyFxR) };

  const ebaySelectedCategory = EBAY_CATEGORIES.find((c) => c.id === ebay.categoryId);
  // Manual rate applies both to the generic "Other" fallback AND to a known category
  // whose own FVF rate isn't confirmed (it still has a real `schedule`-less entry).
  const ebayManualActive = ebay.categoryId === UNSUPPORTED_CATEGORY_ID || (ebaySelectedCategory !== undefined && !ebaySelectedCategory.schedule);
  const ebayManualRateR = parseManualCategoryRate(ebay.manualCategoryRate);
  const ebayErrors = { manualCategoryRate: ebayManualActive ? err(ebayManualRateR) : undefined };

  const amazonManualActive = amazon.categoryId === UNSUPPORTED_CATEGORY_ID;
  const amazonManualRateR = parseManualCategoryRate(amazon.manualCategoryRate);
  const amazonMonthlyUnitsR = parseOptionalPositiveInteger(amazon.expectedMonthlyUnits, 'Expected monthly units');
  const amazonErrors = {
    manualCategoryRate: amazonManualActive ? err(amazonManualRateR) : undefined,
    expectedMonthlyUnits: err(amazonMonthlyUnitsR),
  };

  // TikTok's validation + engine-call composition lives in resolveTikTok
  // (src/lib/engines/tiktok-resolve.ts) rather than inline here — it's
  // exactly the same function this component calls and the one the test
  // suite exercises directly, so an enabled-but-invalid rate can't silently
  // fall back to "no override" and continue as an apparently-exact result
  // without a test catching it. Seller discount / platform discount / other
  // actual costs, an enabled-but-invalid promotional rate, and a supplied
  // (nonblank) invalid affiliate rate are all core/blocking for TikTok —
  // they either affect the commission basis directly or the core commission
  // rate itself, unlike a soft/excludable field such as an unmatched
  // category's manual rate.
  const tiktokResolution = resolveTikTok(
    {
      soldPrice: val(soldPriceR, 0),
      itemCost: val(itemCostR, 0),
      shippingCharged: val(shippingChargedR, 0),
      shippingCost: val(shippingCostR, 0),
      quantity: val(quantityR, 1),
      vatProfile,
    },
    tiktok
  );
  const tiktokErrors = tiktokResolution.errors;
  const tiktokHasBlockingError = tiktokResolution.hasBlockingError;

  // Vinted's "Shipping Charged"/"Actual Shipping Cost" shared fields are
  // relabelled as "amount received"/"amount paid" (see the panel copy
  // below) but reuse the exact same underlying validated values — Vinted's
  // normal prepaid-label flow means both are normally left at £0.
  const vintedResolution = resolveVinted(
    {
      soldPrice: val(soldPriceR, 0),
      itemCost: val(itemCostR, 0),
      shippingReceived: val(shippingChargedR, 0),
      shippingCost: val(shippingCostR, 0),
      quantity: val(quantityR, 1),
    },
    vinted
  );
  const vintedErrors = vintedResolution.errors;
  const vintedHasBlockingError = vintedResolution.hasBlockingError;

  const hasBlockingError =
    sharedHasBlockingError ||
    (platform === 'TIKTOK' && tiktokHasBlockingError) ||
    (platform === 'VINTED' && vintedHasBlockingError);

  const result: CalculationResult | null = useMemo(() => {
    if (hasBlockingError) return null;

    const shared = {
      soldPrice: val(soldPriceR, 0),
      itemCost: val(itemCostR, 0),
      shippingCharged: val(shippingChargedR, 0),
      shippingCost: val(shippingCostR, 0),
      quantity: val(quantityR, 1),
    };

    switch (platform) {
      case 'SHOPIFY':
        return calculateShopify({
          soldPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          shippingCharged: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          plan: shopify.plan,
          processor: shopify.processor,
          cardType: shopify.cardType,
          thirdPartyProcessor: shopifyThirdPartyValid ? { rate: val(shopifyRateR, 0), fixed: val(shopifyFixedR, 0) } : null,
          expectedMonthlyOrders: val(shopifyMonthlyOrdersR, null),
        });
      case 'ETSY':
        return calculateEtsy({
          itemPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          shippingCharged: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          currencyConversionSelected: etsy.currencyConversionSelected,
          offsiteAdsRate: etsy.offsiteAdsRate,
          vatIdSupplied: etsy.vatIdSupplied,
          vatProfile,
          // null (not a silent default) tells the engine to exclude FX-dependent fees when the rate is unusable.
          usdToGbpRate: etsyFxR.ok ? etsyFxR.value : null,
        });
      case 'EBAY':
        return calculateEbay({
          itemPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          shippingCharged: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          categoryId: ebay.categoryId,
          manualCategoryRate: ebayManualActive ? val(ebayManualRateR, null) : null,
          region: ebay.region,
          currencyConversionSelected: ebay.currencyConversionSelected,
          topRatedPremiumService: ebay.topRatedPremiumService,
          vatProfile,
        });
      case 'AMAZON':
        return calculateAmazon({
          itemPrice: shared.soldPrice,
          itemCost: shared.itemCost,
          deliveryCharge: shared.shippingCharged,
          shippingCost: shared.shippingCost,
          quantity: shared.quantity,
          sellerPlan: amazon.sellerPlan,
          categoryId: amazon.categoryId,
          manualCategoryRate: amazonManualActive ? val(amazonManualRateR, null) : null,
          expectedMonthlyUnits: val(amazonMonthlyUnitsR, null),
          vatProfile,
        });
      case 'TIKTOK':
        // Already fully resolved above (errors, blocking, and the engine
        // call are one composed unit — see resolveTikTok).
        return tiktokResolution.result;
      case 'VINTED':
        // Already fully resolved above (errors, blocking, and the engine
        // call are one composed unit — see resolveVinted).
        return vintedResolution.result;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBlockingError, platform, soldPrice, itemCost, shippingCharged, shippingCost, quantity, vatProfile, shopify, etsy, ebay, amazon, tiktok, vinted]);

  return (
    <div className="w-full bg-[#000000] rounded-xl border border-[#333] p-0 md:p-0 relative overflow-hidden font-sans">
      <div className="flex px-4 pt-2 border-b border-[#333] overflow-x-auto scrollbar-hide">
        {/* buildTabDescriptors is the single source of truth for "does this
            tab navigate or just set local state" — see its own doc comment
            and src/lib/__tests__/platform-routes.test.ts. This component
            only turns that decision into markup: a real <Link> (with
            aria-current) when `href` is set, a state-setting <button>
            otherwise. On a dedicated route this is real navigation, so the
            current route's own content (metadata, H1, intro, "What's
            included") can never end up paired with a different platform's
            calculator underneath it — and Next's default scroll-to-top on
            route change lands the user at the top of the new page for free. */}
        {buildTabDescriptors(platform, routeLocked).map((tab) => {
          // Active tab is distinguished by text treatment alone (white/bold
          // vs muted grey) — no underline/glow indicator. font-semibold (vs
          // font-medium) is what actually supplies the "bold" half of that
          // treatment; text-white alone does not change weight. aria-current
          // (dedicated routes) marks the active tab semantically for
          // assistive tech there; aria-pressed does the same for the
          // homepage's local-state buttons, which have no navigation state
          // for aria-current to describe.
          const tabClassName = `px-5 py-3 text-sm transition-all whitespace-nowrap ${
            tab.isActive ? 'text-white font-semibold' : 'text-[#888] font-medium hover:text-[#eaeaea]'
          }`;

          if (tab.href !== null) {
            return (
              <Link key={tab.platform} href={tab.href} aria-current={tab.ariaCurrent} className={tabClassName}>
                {tab.label}
              </Link>
            );
          }

          return (
            <button
              key={tab.platform}
              type="button"
              onClick={() => setLocalPlatform(tab.platform)}
              aria-pressed={tab.isActive}
              className={tabClassName}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 lg:p-10 space-y-8 lg:border-r border-[#333]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Transaction Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoneyField
              label={platform === 'TIKTOK' ? 'Original Product Price (per unit, before discounts)' : 'Sold Price (per unit)'}
              value={soldPrice}
              onChange={setSoldPrice}
              error={sharedErrors.soldPrice}
            />
            <MoneyField label="Item Cost (per unit)" value={itemCost} onChange={setItemCost} error={sharedErrors.itemCost} />
            <MoneyField
              label={platform === 'VINTED' ? 'Shipping Amount You Received (order total)' : 'Shipping Charged (order total)'}
              value={shippingCharged}
              onChange={setShippingCharged}
              error={sharedErrors.shippingCharged}
            />
            <MoneyField
              label={platform === 'VINTED' ? 'Shipping You Paid Yourself (order total)' : 'Actual Shipping Cost (order total)'}
              value={shippingCost}
              onChange={setShippingCost}
              error={sharedErrors.shippingCost}
            />
            <NumberField label="Quantity" value={quantity} onChange={setQuantity} placeholder="1" error={sharedErrors.quantity} />
          </div>

          {platform === 'VINTED' && (
            <p className="text-[11px] text-[#666] -mt-4">
              With Vinted&apos;s normal prepaid-label flow, the buyer purchases shipping directly through Vinted and you
              wouldn&apos;t ordinarily receive or pay anything for it — leave both shipping fields at £0 unless you actually
              received a shipping amount or paid for shipping yourself. Nothing is assumed or calculated on your behalf.
            </p>
          )}

          {platform !== 'VINTED' && (
            <SegmentedToggle<VatProfile>
              label="VAT Profile"
              value={vatProfile}
              onChange={setVatProfile}
              options={[
                { value: 'NOT_REGISTERED', label: 'Not VAT registered' },
                { value: 'REGISTERED', label: 'VAT registered' },
              ]}
            />
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-[#333] to-transparent my-8"></div>

          <AnimatePresence mode="wait">
            <motion.div key={platform} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {platform === 'SHOPIFY' && (
                <ShopifyPanel state={shopify} onChange={(patch) => setShopify((s) => ({ ...s, ...patch }))} errors={shopifyErrors} />
              )}
              {platform === 'ETSY' && <EtsyPanel state={etsy} onChange={(patch) => setEtsy((s) => ({ ...s, ...patch }))} errors={etsyErrors} />}
              {platform === 'EBAY' && <EbayPanel state={ebay} onChange={(patch) => setEbay((s) => ({ ...s, ...patch }))} errors={ebayErrors} />}
              {platform === 'AMAZON' && (
                <AmazonPanel state={amazon} onChange={(patch) => setAmazon((s) => ({ ...s, ...patch }))} errors={amazonErrors} />
              )}
              {platform === 'TIKTOK' && (
                <TikTokPanel state={tiktok} onChange={(patch) => setTiktok((s) => ({ ...s, ...patch }))} errors={tiktokErrors} />
              )}
              {platform === 'VINTED' && (
                <VintedPanel state={vinted} onChange={(patch) => setVinted((s) => ({ ...s, ...patch }))} errors={vintedErrors} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="lg:col-span-5 bg-[#050505]">
          <ResultsPanel
            result={result}
            blockingError={
              hasBlockingError
                ? `Fix the highlighted transaction detail${
                    Object.values(sharedErrors).filter(Boolean).length +
                      (platform === 'TIKTOK'
                        ? [
                            tiktokErrors.sellerDiscount,
                            tiktokErrors.platformDiscount,
                            tiktokErrors.otherActualCosts,
                            tiktokErrors.promotionalRate,
                            tiktokErrors.affiliateCommissionRate,
                          ].filter(Boolean).length
                        : 0) +
                      (platform === 'VINTED' ? [vintedErrors.visibilityServiceCost].filter(Boolean).length : 0) >
                    1
                      ? 's'
                      : ''
                  } to see a calculation.`
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
