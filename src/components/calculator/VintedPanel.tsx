"use client";

import type { VintedSellerRoute } from '../../lib/engines/vinted';
import type { VintedPanelErrors, VintedRawPanelInput } from '../../lib/engines/vinted-resolve';
import { CheckboxField, MoneyField, SegmentedToggle } from './inputs';

export type VintedPanelState = VintedRawPanelInput;

export type { VintedPanelErrors };

export default function VintedPanel({
  state,
  onChange,
  errors,
}: {
  state: VintedPanelState;
  onChange: (patch: Partial<VintedPanelState>) => void;
  errors?: VintedPanelErrors;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Vinted UK Configuration</h2>
      <p className="text-xs text-[#888] leading-relaxed">
        Vinted charges sellers no mandatory listing, transaction or selling fee — confirmed on Vinted&apos;s own &quot;How it
        works&quot; page. The Buyer Protection fee shown at the buyer&apos;s checkout is paid by the buyer, not deducted from
        your revenue — see the indicative range shown with your results below, not an exact fee.
      </p>

      <SegmentedToggle<VintedSellerRoute>
        label="Seller type"
        value={state.sellerRoute}
        onChange={(v) => onChange({ sellerRoute: v })}
        options={[
          { value: 'PRIVATE', label: 'Private seller' },
          { value: 'PRO', label: 'Pro seller' },
        ]}
      />
      {state.sellerRoute === 'PRO' && (
        <p className="text-[11px] text-[#666] -mt-4">
          Professional sellers must register as a Vinted Pro Seller and list at a price that already includes applicable
          VAT/taxes. This calculator does not compute output VAT, the second-hand VAT margin scheme, or any other tax on
          this sale — see your result&apos;s exclusions and{' '}
          <a href="/methodology" className="underline hover:text-[#888]">methodology</a> for full sourcing.
        </p>
      )}

      <CheckboxField
        label="Did you pay for a Bump or Showcase for this sale?"
        description="Vinted publishes no fixed universal price for these optional visibility services — the exact cost is shown at checkout."
        checked={state.visibilityServicePurchased}
        onChange={(v) => onChange({ visibilityServicePurchased: v })}
      />
      {state.visibilityServicePurchased && (
        <MoneyField
          label="Bump/Showcase amount paid (actual, VAT-inclusive)"
          value={state.visibilityServiceCost}
          onChange={(v) => onChange({ visibilityServiceCost: v })}
          error={errors?.visibilityServiceCost}
        />
      )}
    </div>
  );
}
