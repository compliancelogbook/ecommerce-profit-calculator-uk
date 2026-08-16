"use client";

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import { EBAY_CATEGORIES } from '../../data/ebay.fees';
import type { VatProfile } from '../../data/vat';
import { calculateShopify } from '../../lib/engines/shopify';
import { calculateEtsy } from '../../lib/engines/etsy';
import { calculateEbay } from '../../lib/engines/ebay';
import { calculateAmazon } from '../../lib/engines/amazon';
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
import ResultsPanel from './ResultsPanel';

export type Platform = 'SHOPIFY' | 'ETSY' | 'EBAY' | 'AMAZON';

const PLATFORM_LABEL: Record<Platform, string> = { SHOPIFY: 'Shopify', ETSY: 'Etsy', EBAY: 'eBay', AMAZON: 'Amazon' };

function err<T>(r: ValidationResult<T>): string | undefined {
  return r.ok ? undefined : r.error;
}
function val<T>(r: ValidationResult<T>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export default function CalculatorShell({ defaultPlatform = 'SHOPIFY' }: { defaultPlatform?: Platform }) {
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);

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
  const hasBlockingError = Object.values(sharedErrors).some(Boolean);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBlockingError, platform, soldPrice, itemCost, shippingCharged, shippingCost, quantity, vatProfile, shopify, etsy, ebay, amazon]);

  return (
    <div className="w-full bg-[#000000] rounded-xl border border-[#333] p-0 md:p-0 relative overflow-hidden font-sans">
      <div className="flex px-4 pt-2 border-b border-[#333] overflow-x-auto scrollbar-hide">
        {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-5 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
              platform === p ? 'text-white' : 'text-[#888] hover:text-[#eaeaea]'
            }`}
          >
            {PLATFORM_LABEL[p]}
            {platform === p && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 lg:p-10 space-y-8 lg:border-r border-[#333]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Transaction Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoneyField label="Sold Price (per unit)" value={soldPrice} onChange={setSoldPrice} error={sharedErrors.soldPrice} />
            <MoneyField label="Item Cost (per unit)" value={itemCost} onChange={setItemCost} error={sharedErrors.itemCost} />
            <MoneyField
              label="Shipping Charged (order total)"
              value={shippingCharged}
              onChange={setShippingCharged}
              error={sharedErrors.shippingCharged}
            />
            <MoneyField
              label="Actual Shipping Cost (order total)"
              value={shippingCost}
              onChange={setShippingCost}
              error={sharedErrors.shippingCost}
            />
            <NumberField label="Quantity" value={quantity} onChange={setQuantity} placeholder="1" error={sharedErrors.quantity} />
          </div>

          <SegmentedToggle<VatProfile>
            label="VAT Profile"
            value={vatProfile}
            onChange={setVatProfile}
            options={[
              { value: 'NOT_REGISTERED', label: 'Not VAT registered' },
              { value: 'REGISTERED', label: 'VAT registered' },
            ]}
          />

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
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="lg:col-span-5 bg-[#050505]">
          <ResultsPanel
            result={result}
            blockingError={
              hasBlockingError
                ? `Fix the highlighted transaction detail${Object.values(sharedErrors).filter(Boolean).length > 1 ? 's' : ''} to see a calculation.`
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
