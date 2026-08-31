"use client";

// Isolated client component — the page itself stays a server component.
// Purely client-side: no fetch, no server action, no localStorage/cookies.
// State lives only in React state and is gone on refresh/navigation, per
// the "we don't need to store your answers" promise made on the page.

import { useEffect, useRef, useState } from 'react';
import {
  ACTIVITY_TYPE_OPTIONS,
  decide,
  parseGrossTradingIncome,
  type ActivityType,
  type GuidanceOutcome,
} from '../../lib/uk-tax-guide/decision';
import { UK_TAX_GUIDE_SOURCES } from '../../lib/uk-tax-guide/sources';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm';

// A local money-input field, styled identically to the shared calculator
// MoneyField (same classes — matches the existing visual system exactly),
// but with an explicit id/htmlFor label association. The shared MoneyField
// in components/calculator/inputs.tsx doesn't wire that up, and this
// feature must not touch that shared file (used by every fee calculator).
function MoneyField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-[#888]">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-[#888] font-medium">£</span>
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full bg-[#0a0a0a] border rounded-md py-2.5 pl-8 pr-4 text-[#eaeaea] text-sm focus:outline-none focus:ring-1 transition-all ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#333] focus:border-[#888] focus:ring-[#888]'
          }`}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function RadioGroupField({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
  error?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[#888]">{legend}</legend>
      <div className="space-y-2" aria-describedby={errorId}>
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-all ${
              value === o.value ? 'border-[#888] bg-[#111]' : 'border-[#333] bg-[#0a0a0a] hover:border-[#555]'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className={`h-4 w-4 shrink-0 accent-white ${FOCUS_RING}`}
            />
            <span className="text-sm text-[#eaeaea]">{o.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface FormErrors {
  activityType?: string;
  personalItemSoldFor6kOrMore?: string;
  grossTradingIncome?: string;
}

export default function UkTaxGuideChecker() {
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [personalItemSoldFor6kOrMore, setPersonalItemSoldFor6kOrMore] = useState<boolean | null>(null);
  const [grossTradingIncomeRaw, setGrossTradingIncomeRaw] = useState('');
  const [alreadyDoesSelfAssessment, setAlreadyDoesSelfAssessment] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<GuidanceOutcome | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultRef.current?.focus();
    }
  }, [result]);

  const needsPersonal = activityType === 'PERSONAL_POSSESSIONS' || activityType === 'MIXED';
  const needsTrading =
    activityType === 'TRADING_BOUGHT_FOR_RESALE' || activityType === 'TRADING_MADE_OR_UPCYCLED' || activityType === 'MIXED';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    const nextErrors: FormErrors = {};

    if (!activityType) {
      nextErrors.activityType = 'Choose the option that best describes your situation.';
    }
    if (needsPersonal && personalItemSoldFor6kOrMore === null) {
      nextErrors.personalItemSoldFor6kOrMore = 'Answer yes or no to continue.';
    }
    let parsedIncome: number | null = null;
    if (needsTrading) {
      const incomeResult = parseGrossTradingIncome(grossTradingIncomeRaw);
      if (!incomeResult.ok) {
        nextErrors.grossTradingIncome = incomeResult.error;
      } else {
        parsedIncome = incomeResult.value;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !activityType) {
      return;
    }

    setResult(
      decide({
        activityType,
        grossTradingIncome: parsedIncome,
        personalItemSoldFor6kOrMore,
        alreadyDoesSelfAssessment,
      })
    );
  }

  function handleReset() {
    setActivityType(null);
    setPersonalItemSoldFor6kOrMore(null);
    setGrossTradingIncomeRaw('');
    setAlreadyDoesSelfAssessment(null);
    setErrors({});
    setResult(null);
  }

  return (
    <div className="w-full bg-[#000000] rounded-xl border border-[#333] p-6 md:p-10 space-y-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <RadioGroupField
          legend="What best describes your situation?"
          name="activityType"
          options={ACTIVITY_TYPE_OPTIONS}
          value={activityType}
          onChange={(v) => {
            setActivityType(v as ActivityType);
            setResult(null);
          }}
          error={errors.activityType}
        />

        {needsPersonal && (
          <RadioGroupField
            legend="Did you sell any single personal possession, or a matching collection/set, for £6,000 or more?"
            name="personalItemSoldFor6kOrMore"
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            value={personalItemSoldFor6kOrMore === null ? null : String(personalItemSoldFor6kOrMore)}
            onChange={(v) => setPersonalItemSoldFor6kOrMore(v === 'true')}
            error={errors.personalItemSoldFor6kOrMore}
          />
        )}

        {needsTrading && (
          <>
            <MoneyField
              id="gross-trading-income"
              label="Combined gross trading income for the tax year (before expenses, across all trading activities and platforms)"
              value={grossTradingIncomeRaw}
              onChange={setGrossTradingIncomeRaw}
              error={errors.grossTradingIncome}
            />
            <RadioGroupField
              legend="Do you already complete Self Assessment? (Optional)"
              name="alreadyDoesSelfAssessment"
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
              value={alreadyDoesSelfAssessment === null ? null : String(alreadyDoesSelfAssessment)}
              onChange={(v) => setAlreadyDoesSelfAssessment(v === 'true')}
            />
          </>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className={`px-5 py-2.5 rounded-md bg-white text-black text-sm font-medium hover:bg-[#eaeaea] transition-all ${FOCUS_RING}`}
          >
            Show guidance
          </button>
          {(result || activityType) && (
            <button
              type="button"
              onClick={handleReset}
              className={`px-5 py-2.5 rounded-md border border-[#333] text-[#888] text-sm font-medium hover:text-[#eaeaea] hover:border-[#666] transition-all ${FOCUS_RING}`}
            >
              Start again
            </button>
          )}
        </div>
      </form>

      <div ref={resultRef} tabIndex={-1} role="status" aria-live="polite" className="outline-none">
        {result && (
          <div className="border-t border-[#222] pt-8 space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-tight">{result.headline}</h2>
            <ul className="space-y-2 list-disc list-inside">
              {result.points.map((point, i) => (
                <li key={i} className="text-sm text-[#a1a1a1] leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#eaeaea] leading-relaxed font-medium">{result.nextStep}</p>
            <div className="text-xs text-[#666] space-y-1 pt-2">
              {result.sourceIds.map((id) => {
                const source = Object.values(UK_TAX_GUIDE_SOURCES).find((s) => s.id === id);
                if (!source) return null;
                return (
                  <div key={id}>
                    <a href={source.url} target="_blank" rel="noreferrer" className={`underline hover:text-[#888] ${FOCUS_RING}`}>
                      {source.title}
                    </a>
                    <span> — {source.publisher}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
