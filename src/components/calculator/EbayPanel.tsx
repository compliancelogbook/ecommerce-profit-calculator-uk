"use client";

import { EBAY_CATEGORIES, type EbayInternationalRegion } from '../../data/ebay.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import { CheckboxField, NumberField, SelectField } from './inputs';

export interface EbayPanelState {
  categoryId: string;
  manualCategoryRate: string;
  region: EbayInternationalRegion;
  currencyConversionSelected: boolean;
  topRatedPremiumService: boolean;
}

const REGION_OPTIONS: { value: EbayInternationalRegion; label: string }[] = [
  { value: 'DOMESTIC', label: 'Domestic (UK)' },
  { value: 'EU_NORTHERN_EUROPE', label: 'Eurozone / Northern Europe' },
  { value: 'US_CANADA', label: 'US / Canada' },
  { value: 'OTHER', label: 'Other' },
];

export interface EbayPanelErrors {
  manualCategoryRate?: string;
}

export default function EbayPanel({
  state,
  onChange,
  errors,
}: {
  state: EbayPanelState;
  onChange: (patch: Partial<EbayPanelState>) => void;
  errors?: EbayPanelErrors;
}) {
  const categoryOptions = [
    ...EBAY_CATEGORIES.map((c) => ({
      value: c.id,
      label:
        (c.officialCategoryId ? `${c.label} (#${c.officialCategoryId})` : c.label) +
        (!c.schedule ? ' — FVF rate not confirmed, enter manually' : ''),
    })),
    { value: UNSUPPORTED_CATEGORY_ID, label: 'Other (not in verified schedule — enter manually)' },
  ];

  const selectedCategory = EBAY_CATEGORIES.find((c) => c.id === state.categoryId);
  const needsManualRate = state.categoryId === UNSUPPORTED_CATEGORY_ID || (selectedCategory !== undefined && !selectedCategory.schedule);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">eBay UK Business Configuration</h2>
      <p className="text-xs text-[#888] leading-relaxed">
        Only a subset of eBay&apos;s full category schedule is verified in this build. eBay&apos;s live category page could not be
        directly fetched — categories outside this list require a manually entered rate rather than a guess. Tiered categories are
        calculated per item, matching eBay&apos;s own published wording.
      </p>

      <SelectField label="Category" value={state.categoryId} onChange={(v) => onChange({ categoryId: v })} options={categoryOptions} />

      {selectedCategory && !selectedCategory.schedule && (
        <p className="text-[11px] text-[#666] -mt-4">
          The Final Value Fee percentage for {selectedCategory.label} was not confirmed, so it needs a manual rate below. Its reduced
          per-order fee (if eligible) is still calculated automatically — that part is confirmed independently of the FVF rate.
        </p>
      )}

      {needsManualRate && (
        <NumberField
          label="Manual Final Value Fee rate (%)"
          value={state.manualCategoryRate}
          onChange={(v) => onChange({ manualCategoryRate: v })}
          placeholder="e.g. 12.5"
          error={errors?.manualCategoryRate}
        />
      )}

      <SelectField label="Buyer region" value={state.region} onChange={(v) => onChange({ region: v })} options={REGION_OPTIONS} />

      <CheckboxField
        label="Order required currency conversion"
        description="Applies eBay's 2.5% currency conversion fee to this order."
        checked={state.currencyConversionSelected}
        onChange={(v) => onChange({ currencyConversionSelected: v })}
      />

      <CheckboxField
        label="Top Rated Premium Service discount"
        description="10% reduction applied only to the variable Final Value Fee component."
        checked={state.topRatedPremiumService}
        onChange={(v) => onChange({ topRatedPremiumService: v })}
      />

      {selectedCategory?.reducedPerOrderFee && (
        <p className="text-[11px] text-[#666]">
          {selectedCategory.label} qualifies for eBay&apos;s reduced £0.10 per-order fee on sales ≤ £
          {selectedCategory.reducedPerOrderFee.atOrBelowThreshold} — applied automatically, no action needed.
        </p>
      )}
    </div>
  );
}
