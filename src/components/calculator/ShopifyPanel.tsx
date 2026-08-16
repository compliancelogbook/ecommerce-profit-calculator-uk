"use client";

import type { ShopifyCardType } from '../../lib/engines/shopify';
import type { ShopifyPaymentProcessor, ShopifyPlan } from '../../data/shopify.fees';
import { CheckboxField, MoneyField, NumberField, SegmentedToggle, SelectField } from './inputs';

export interface ShopifyPanelState {
  plan: ShopifyPlan;
  processor: ShopifyPaymentProcessor;
  cardType: ShopifyCardType;
  expectedMonthlyOrders: string;
  useThirdPartyAssumption: boolean;
  thirdPartyRate: string;
  thirdPartyFixed: string;
}

export interface ShopifyPanelErrors {
  expectedMonthlyOrders?: string;
  thirdPartyRate?: string;
  thirdPartyFixed?: string;
}

export default function ShopifyPanel({
  state,
  onChange,
  errors,
}: {
  state: ShopifyPanelState;
  onChange: (patch: Partial<ShopifyPanelState>) => void;
  errors?: ShopifyPanelErrors;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">Shopify Configuration</h2>

      <SelectField
        label="Shopify Plan"
        value={state.plan}
        onChange={(v) => onChange({ plan: v })}
        options={[
          { value: 'BASIC', label: 'Basic — £25/mo' },
          { value: 'GROW', label: 'Grow — £65/mo' },
          { value: 'ADVANCED', label: 'Advanced — £344/mo' },
        ]}
      />

      <SegmentedToggle
        label="Payment Processor"
        value={state.processor}
        onChange={(v) => onChange({ processor: v })}
        options={[
          { value: 'SHOPIFY_PAYMENTS', label: 'Shopify Payments' },
          { value: 'THIRD_PARTY', label: 'Third-party (PayPal etc.)' },
        ]}
      />

      {state.processor === 'SHOPIFY_PAYMENTS' ? (
        <SegmentedToggle
          label="Card Type"
          value={state.cardType}
          onChange={(v) => onChange({ cardType: v })}
          options={[
            { value: 'STANDARD', label: 'Standard UK card' },
            { value: 'INTERNATIONAL_AMEX', label: 'International / Amex' },
          ]}
        />
      ) : (
        <div className="space-y-4 border border-dashed border-[#333] rounded-lg p-4">
          <p className="text-xs text-[#888]">
            Shopify does not publish third-party processor rates. Nothing is assumed unless you enter your processor&apos;s rate below.
          </p>
          <CheckboxField
            label="Enter processor rate manually"
            description="Otherwise the external processing fee is excluded, not estimated."
            checked={state.useThirdPartyAssumption}
            onChange={(v) => onChange({ useThirdPartyAssumption: v })}
          />
          {state.useThirdPartyAssumption && (
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Processor rate (%)"
                value={state.thirdPartyRate}
                onChange={(v) => onChange({ thirdPartyRate: v })}
                error={errors?.thirdPartyRate}
              />
              <MoneyField
                label="Processor fixed fee"
                value={state.thirdPartyFixed}
                onChange={(v) => onChange({ thirdPartyFixed: v })}
                error={errors?.thirdPartyFixed}
              />
            </div>
          )}
        </div>
      )}

      <NumberField
        label="Expected monthly orders (optional — allocates subscription cost)"
        value={state.expectedMonthlyOrders}
        onChange={(v) => onChange({ expectedMonthlyOrders: v })}
        placeholder="e.g. 100"
        error={errors?.expectedMonthlyOrders}
      />
    </div>
  );
}
