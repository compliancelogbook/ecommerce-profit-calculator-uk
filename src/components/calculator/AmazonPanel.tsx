"use client";

import { AMAZON_CATEGORIES } from '../../data/amazon.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import type { AmazonSellerPlan } from '../../lib/engines/amazon';
import { NumberField, SegmentedToggle, SelectField } from './inputs';

export interface AmazonPanelState {
  sellerPlan: AmazonSellerPlan;
  categoryId: string;
  manualCategoryRate: string;
  expectedMonthlyUnits: string;
}

export default function AmazonPanel({ state, onChange }: { state: AmazonPanelState; onChange: (patch: Partial<AmazonPanelState>) => void }) {
  const categoryOptions = [
    ...AMAZON_CATEGORIES.map((c) => ({
      value: c.id,
      label: c.source.verificationStatus === 'AUTOMATED_UNVERIFIED' ? `${c.label} (unverified)` : c.label,
    })),
    { value: UNSUPPORTED_CATEGORY_ID, label: 'Other (not in verified schedule — enter manually)' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Amazon UK — FBM Configuration</h2>
      <p className="text-xs text-[#888] leading-relaxed">
        Fulfilled by Merchant only — Amazon FBA fulfilment, storage and related charges are not calculated.
      </p>

      <SegmentedToggle
        label="Selling Plan"
        value={state.sellerPlan}
        onChange={(v) => onChange({ sellerPlan: v })}
        options={[
          { value: 'INDIVIDUAL', label: 'Individual — £0.75/unit' },
          { value: 'PROFESSIONAL', label: 'Professional — £25/mo' },
        ]}
      />

      {state.sellerPlan === 'PROFESSIONAL' && (
        <NumberField
          label="Expected monthly units (optional — allocates subscription cost)"
          value={state.expectedMonthlyUnits}
          onChange={(v) => onChange({ expectedMonthlyUnits: v })}
          placeholder="e.g. 100"
        />
      )}

      <SelectField label="Category" value={state.categoryId} onChange={(v) => onChange({ categoryId: v })} options={categoryOptions} />
      <p className="text-[11px] text-[#666] -mt-4">
        &quot;Unverified&quot; categories were pulled from an automated fetch of Amazon&apos;s pricing page and have not been independently
        cross-checked line-by-line.
      </p>

      {state.categoryId === UNSUPPORTED_CATEGORY_ID && (
        <NumberField
          label="Manual referral fee rate (%)"
          value={state.manualCategoryRate}
          onChange={(v) => onChange({ manualCategoryRate: v })}
          placeholder="e.g. 15"
        />
      )}
    </div>
  );
}
