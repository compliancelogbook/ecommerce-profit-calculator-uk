"use client";

import type { EtsyOffsiteAdsRate } from '../../data/etsy.fees';
import { CheckboxField, NumberField, SelectField } from './inputs';

export interface EtsyPanelState {
  currencyConversionSelected: boolean;
  offsiteAdsRate: EtsyOffsiteAdsRate | null;
  vatIdSupplied: boolean;
  usdToGbpRate: string;
}

const OFFSITE_ADS_OPTIONS: { value: string; label: string }[] = [
  { value: 'NONE', label: 'Not applicable' },
  { value: '0.15', label: '15% (standard)' },
  { value: '0.12', label: '12% (eligible shops)' },
];

export default function EtsyPanel({ state, onChange }: { state: EtsyPanelState; onChange: (patch: Partial<EtsyPanelState>) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Etsy Configuration</h2>

      <NumberField
        label="US$ → £ exchange rate assumption (applies to the $0.20 listing fee)"
        value={state.usdToGbpRate}
        onChange={(v) => onChange({ usdToGbpRate: v })}
        placeholder="0.75"
      />

      <SelectField
        label="Offsite Ads"
        value={state.offsiteAdsRate === null ? 'NONE' : String(state.offsiteAdsRate)}
        onChange={(v) => onChange({ offsiteAdsRate: v === 'NONE' ? null : (Number(v) as EtsyOffsiteAdsRate) })}
        options={OFFSITE_ADS_OPTIONS}
      />

      <CheckboxField
        label="Order required currency conversion"
        description="Applies Etsy's 2.5% currency conversion fee to this order."
        checked={state.currencyConversionSelected}
        onChange={(v) => onChange({ currencyConversionSelected: v })}
      />

      <CheckboxField
        label="VAT ID supplied to Etsy"
        description="If not supplied, Etsy charges 20% UK VAT on VAT-eligible fees; if supplied, reverse charge applies."
        checked={state.vatIdSupplied}
        onChange={(v) => onChange({ vatIdSupplied: v })}
      />
    </div>
  );
}
