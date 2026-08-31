"use client";

import { TIKTOK_CATEGORIES } from '../../data/tiktok.fees';
import { UNSUPPORTED_CATEGORY_ID } from '../../data/types';
import { CheckboxField, MoneyField, NumberField, SelectField } from './inputs';

// Sentinel for the top-level group selector only (a UI-internal grouping
// concept, distinct from the resolved rule id) — never a real category name.
const OTHER_GROUP = '__OTHER__';

const CATEGORY_GROUPS = Array.from(new Set(TIKTOK_CATEGORIES.map((c) => c.category)));

function rulesForGroup(group: string) {
  return TIKTOK_CATEGORIES.filter((c) => c.category === group);
}

export interface TikTokPanelState {
  /** Top-level category group, or OTHER_GROUP for "not in the verified schedule". */
  categoryGroup: string;
  /** The resolved TikTokCategoryRule id, or UNSUPPORTED_CATEGORY_ID. */
  categoryId: string;
  manualCategoryRate: string;
  sellerDiscount: string;
  platformDiscount: string;
  promotionalRateEnabled: boolean;
  promotionalRate: string;
  affiliateCommissionRate: string;
  otherActualCosts: string;
}

export interface TikTokPanelErrors {
  manualCategoryRate?: string;
  promotionalRate?: string;
  affiliateCommissionRate?: string;
  sellerDiscount?: string;
  platformDiscount?: string;
  otherActualCosts?: string;
}

/** Picks the default rule id for a newly selected top-level group. */
export function defaultCategoryIdForGroup(group: string): string {
  if (group === OTHER_GROUP) return UNSUPPORTED_CATEGORY_ID;
  const rules = rulesForGroup(group);
  return rules[0]?.id ?? UNSUPPORTED_CATEGORY_ID;
}

export { OTHER_GROUP as TIKTOK_OTHER_GROUP };

export default function TikTokPanel({
  state,
  onChange,
  errors,
}: {
  state: TikTokPanelState;
  onChange: (patch: Partial<TikTokPanelState>) => void;
  errors?: TikTokPanelErrors;
}) {
  const groupOptions = [
    ...CATEGORY_GROUPS.map((g) => ({ value: g, label: g })),
    { value: OTHER_GROUP, label: 'Other (not in verified schedule — enter manually)' },
  ];

  const subRules = state.categoryGroup === OTHER_GROUP ? [] : rulesForGroup(state.categoryGroup);
  const showSubcategorySelect = subRules.length > 1;
  const subOptions = subRules.map((r) => ({ value: r.id, label: r.subcategoryDisplay ?? r.subcategory }));

  const manualRateActive = state.categoryId === UNSUPPORTED_CATEGORY_ID;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#eaeaea] tracking-tight">TikTok Shop UK Configuration</h2>
      <p className="text-xs text-[#888] leading-relaxed">
        The complete published TikTok Shop UK commission schedule (343 category/subcategory rules) is implemented below. Any
        category genuinely not on the schedule still requires a manually entered rate rather than a guess.
      </p>

      <SelectField
        label="Category"
        value={state.categoryGroup}
        onChange={(group) => onChange({ categoryGroup: group, categoryId: defaultCategoryIdForGroup(group) })}
        options={groupOptions}
      />

      {showSubcategorySelect && (
        <SelectField
          label="Subcategory"
          value={state.categoryId}
          onChange={(id) => onChange({ categoryId: id })}
          options={subOptions}
        />
      )}

      {manualRateActive && (
        <NumberField
          label="Manual commission rate (%)"
          value={state.manualCategoryRate}
          onChange={(v) => onChange({ manualCategoryRate: v })}
          placeholder="e.g. 9"
          error={errors?.manualCategoryRate}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MoneyField
          label="Seller discount (order total)"
          value={state.sellerDiscount}
          onChange={(v) => onChange({ sellerDiscount: v })}
          error={errors?.sellerDiscount}
        />
        <MoneyField
          label="Platform discount (order total)"
          value={state.platformDiscount}
          onChange={(v) => onChange({ platformDiscount: v })}
          error={errors?.platformDiscount}
        />
      </div>
      <p className="text-[11px] text-[#666] -mt-4">
        Seller discount reduces the commission basis; platform (TikTok-funded) discount does not — TikTok absorbs that cost
        itself, per its published commission formula.
      </p>

      <CheckboxField
        label="Apply a seller-specific promotional commission rate"
        description="A manual override — replaces the category rate entirely, never stacked on top of it."
        checked={state.promotionalRateEnabled}
        onChange={(v) => onChange({ promotionalRateEnabled: v })}
      />
      {state.promotionalRateEnabled && (
        <NumberField
          label="Promotional commission rate (%)"
          value={state.promotionalRate}
          onChange={(v) => onChange({ promotionalRate: v })}
          placeholder="e.g. 6"
          error={errors?.promotionalRate}
        />
      )}

      <NumberField
        label="Affiliate/creator commission rate (%, 1–80, optional)"
        value={state.affiliateCommissionRate}
        onChange={(v) => onChange({ affiliateCommissionRate: v })}
        placeholder="Leave blank if not applicable"
        error={errors?.affiliateCommissionRate}
      />
      <p className="text-[11px] text-[#666] -mt-4">
        Never assumed — leave blank unless this order used TikTok Shop&apos;s affiliate/creator program. Must be between 1%
        and 80% (TikTok&apos;s documented range) when used. Calculated on its own basis — product price less seller and
        platform discount, excluding shipping — separate from, and never combined with, the platform commission.
      </p>

      <MoneyField
        label="Other TikTok Shop costs (fulfilment/FBT, ads, storage, returns — actual)"
        value={state.otherActualCosts}
        onChange={(v) => onChange({ otherActualCosts: v })}
        error={errors?.otherActualCosts}
      />
      <p className="text-[11px] text-[#666] -mt-4">
        Enter the actual amount you already know — these don&apos;t have a published fee schedule this build verifies against,
        so nothing is estimated on your behalf.
      </p>
    </div>
  );
}
