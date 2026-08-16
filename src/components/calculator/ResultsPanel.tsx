"use client";

import { formatGBP, formatGBPRaw } from '../../lib/format';
import type { CalculationResult, ConfidenceLevel } from '../../lib/types';

const CONFIDENCE_COPY: Record<ConfidenceLevel, { label: string; className: string }> = {
  EXACT_FOR_SELECTED_INPUTS: { label: 'Exact for selected inputs', className: 'bg-[#0a2a12] text-[#4ade80] border-[#1f5c33]' },
  ASSUMPTION_DEPENDENT: { label: 'Assumption-dependent', className: 'bg-[#2a2308] text-[#facc15] border-[#5c4c1f]' },
  EXCLUDES_VARIABLE_FEES: { label: 'Excludes variable fees', className: 'bg-[#2a1208] text-[#fb923c] border-[#5c2e1f]' },
};

const VERIFIED_DATE_DISPLAY = '16 August 2026';
const VERIFIED_DATE_ISO = '2026-08-16';

export default function ResultsPanel({ result }: { result: CalculationResult }) {
  const hasVerifiedLine = result.feeLines.some((l) => l.verifiedAt === VERIFIED_DATE_ISO);
  const sources = Array.from(new Map(result.feeLines.filter((l) => l.sourceUrl).map((l) => [l.sourceUrl, l])).values());
  const confidence = CONFIDENCE_COPY[result.confidence];

  return (
    <div className="sticky top-0 p-6 lg:p-10 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <h3 className="text-sm font-semibold text-[#888] tracking-widest uppercase">Summary</h3>
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${confidence.className}`}>
          {confidence.label}
        </span>
      </div>

      <div className="space-y-3">
        <Row label="Gross revenue" value={formatGBP(result.grossRevenue)} />
        <Row label="COGS" value={`-${formatGBP(result.cogs)}`} muted />
        <Row label="Shipping cost" value={`-${formatGBP(result.shippingCost)}`} muted />
      </div>

      <div className="h-px bg-[#111] my-4" />

      <div className="space-y-2">
        {result.feeLines.map((line) => (
          <div key={line.id} className="flex justify-between items-baseline gap-4 group">
            <span className="text-[#888] text-xs group-hover:text-[#eaeaea] transition-colors">{line.label}</span>
            <span className="text-[#888] text-xs tabular-nums whitespace-nowrap">-{formatGBPRaw(line.amountExVat, 3)}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-[#111] my-4" />

      <div className="space-y-3">
        <Row label="VAT charged on fees" value={formatGBP(result.vatOnFees)} muted />
        <Row label="Potentially reclaimable VAT" value={formatGBP(result.potentiallyReclaimableVat)} muted />
        <Row label="Total cash fees" value={formatGBP(result.totalCashFees)} />
        <Row label="Estimated economic fees" value={formatGBP(result.estimatedEconomicFees)} muted />
      </div>

      <div className="mt-8 pt-8 border-t border-[#111]">
        <div className="text-[#888] text-xs font-semibold tracking-widest uppercase mb-2">Estimated Profit</div>
        <div className="flex items-baseline space-x-3">
          <div
            className={`text-5xl font-bold tracking-tighter tabular-nums ${
              result.estimatedProfit > 0 ? 'text-white' : result.estimatedProfit < 0 ? 'text-red-500' : 'text-[#888]'
            }`}
          >
            {formatGBP(result.estimatedProfit)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#222]">
            <div className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-1">Margin</div>
            <div className={`text-lg font-medium tabular-nums ${result.marginPct === null ? 'text-[#888]' : result.marginPct > 0 ? 'text-[#eaeaea]' : 'text-red-500'}`}>
              {result.marginPct === null ? 'N/A' : `${result.marginPct.toFixed(1)}%`}
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#222]">
            <div className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-1">ROI</div>
            <div className={`text-lg font-medium tabular-nums ${result.roiPct === null ? 'text-[#888]' : result.roiPct > 0 ? 'text-[#eaeaea]' : 'text-red-500'}`}>
              {result.roiPct === null ? 'N/A' : `${result.roiPct.toFixed(1)}%`}
            </div>
          </div>
        </div>
      </div>

      {(result.assumptions.length > 0 || result.exclusions.length > 0) && (
        <div className="mt-8 pt-6 border-t border-[#111] space-y-4">
          {result.assumptions.length > 0 && (
            <div>
              <div className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-2">Assumptions</div>
              <ul className="space-y-1.5">
                {result.assumptions.map((a, i) => (
                  <li key={i} className="text-xs text-[#a1a1a1] leading-relaxed">
                    · {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.exclusions.length > 0 && (
            <div>
              <div className="text-[10px] text-[#fb923c] font-bold uppercase tracking-widest mb-2">Excluded</div>
              <ul className="space-y-1.5">
                {result.exclusions.map((e, i) => (
                  <li key={i} className="text-xs text-[#a1a1a1] leading-relaxed">
                    · {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[#111] space-y-2">
        {hasVerifiedLine && <div className="text-[11px] text-[#666]">Fees last verified: {VERIFIED_DATE_DISPLAY}</div>}
        {sources.length > 0 && (
          <div className="text-[11px] text-[#666] space-y-1">
            {sources.map((s) => (
              <div key={s.sourceUrl}>
                <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-[#888]">
                  {s.sourceUrl}
                </a>
                {s.verificationStatus === 'AUTOMATED_UNVERIFIED' && <span className="text-[#fb923c]"> — not independently verified</span>}
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-[#555] leading-relaxed pt-2">
          This is a fee/profit estimate, not tax or accounting advice. Confirm VAT and fee treatment with your accountant, HMRC guidance, or the
          relevant platform invoice. See <a href="/methodology" className="underline hover:text-[#888]">methodology</a>.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-[#888] text-sm group-hover:text-[#eaeaea] transition-colors">{label}</span>
      <span className={`text-sm tabular-nums ${muted ? 'text-[#888]' : 'text-[#eaeaea] font-medium'}`}>{value}</span>
    </div>
  );
}
