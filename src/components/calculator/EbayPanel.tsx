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

export default function EbayPanel({ state, onChange }: { state: EbayPanelState; onChange: (patch: Partial<EbayPanelState>) => void }) {
  const categoryOptions = [
    ...EBAY_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
    { value: UNSUPPORTED_CATEGORY_ID, label: 'Other (not in verified schedule — enter manually)' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">eBay UK Business Configuration</h2>
      <p className="text-xs text-[#888] leading-relaxed">
        Only a subset of eBay&apos;s full category schedule is verified in this build. Categories outside that list require a manually
        entered rate rather than a guess.
      </p>

      <SelectField label="Category" value={state.categoryId} onChange={(v) => onChange({ categoryId: v })} options={categoryOptions} />

      {state.categoryId === UNSUPPORTED_CATEGORY_ID && (
        <NumberField
          label="Manual Final Value Fee rate (%)"
          value={state.manualCategoryRate}
          onChange={(v) => onChange({ manualCategoryRate: v })}
          placeholder="e.g. 12.5"
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
    </div>
  );
}
